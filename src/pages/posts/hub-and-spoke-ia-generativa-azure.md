---
layout: ../../layouts/PostLayout.astro
title: "Hub-and-spoke para workloads de IA generativa: onde colocar Azure AI Foundry, Search e Storage na topologia"
category: "IA Generativa"
tag: "azure"
serie: "Série Azure Networking + IA Generativa"
serieNum: 2
serieSlug: "serie-azure-networking-ia"
date: "21 Ago 2026"
readTime: "10 min"
description: "A topologia 'óbvia' para IA generativa quebra a governança assim que a segunda squad de IA aparece. O padrão hub-and-spoke resolve — mas só se você souber onde colocar cada componente."
prev:
  title: "Azure Networking [1] — Seu Azure OpenAI está exposto na internet"
  slug: "azure-openai-exposto-na-internet-private-link"
next:
  title: "Azure Networking [3] — DNS privado em arquiteturas de IA multi-VNet"
  slug: "dns-privado-arquiteturas-ia-multi-vnet"
---

Quantas VNets isoladas de IA já existem na sua empresa? Se a resposta for "mais de uma", este artigo é para você.

Quando um time começa a desenhar a rede para uma plataforma de agentes de IA, a tendência natural é criar uma VNet isolada só para IA e conectá-la ao resto da empresa via peering direto. Funciona no piloto. Mas quebra a governança assim que a segunda, terceira e quarta squad de IA aparecem — cada uma criando sua própria VNet, seu próprio firewall, suas próprias regras de saída para a internet.

Este é o artigo 2 de 20 da série **Azure Networking + IA Generativa**. Aqui mostro onde cada peça entra na topologia hub-and-spoke e o erro de segmentação que trava a governança assim que o segundo time de IA aparece.

## Por que a topologia "óbvia" costuma estar errada

A topologia óbvia para quem está começando com IA generativa no Azure:

```
VNet-IA ──── peering ──── VNet-Corporativa ──── on-premises
```

Funciona bem para o primeiro projeto. O problema aparece quando o segundo time de IA começa:

```
VNet-IA-RH       ──┐
VNet-IA-Juridico ──┤── peering direto ──── VNet-Corporativa
VNet-IA-Finance  ──┘
```

Cada VNet tem seu próprio Azure Firewall (ou não tem), suas próprias regras de NSG, seus próprios Private Endpoints para os mesmos serviços (Azure OpenAI, AI Search), sua própria saída para internet — necessária para chamadas a modelos do Model Catalog, por exemplo. O custo de infraestrutura multiplica, a governança fragmenta, e auditar quem acessa o quê vira um pesadelo.

## Onde cada componente entra na topologia hub-and-spoke

O padrão correto é tratar workloads de IA generativa como qualquer outro spoke — conectado a um hub central que concentra os recursos compartilhados:

```
                    VNet HUB
              ┌─────────────────┐
              │  Azure Firewall  │
              │  VPN/ER Gateway  │
              │  DNS Resolver    │
              │  Bastion         │
              └────────┬────────┘
                       │ peering
          ┌────────────┴────────────┐
          │                         │
   VNet Spoke IA-RH         VNet Spoke IA-Finance
   ┌──────────────┐          ┌──────────────┐
   │ AI Foundry   │          │ AI Foundry   │
   │ (agentes)    │          │ (agentes)    │
   │              │          │              │
   │ snet-pe:     │          │ snet-pe:     │
   │  PE-OpenAI   │          │  PE-OpenAI   │
   │  PE-Search   │          │  PE-Search   │
   └──────────────┘          └──────────────┘
```

**O hub concentra o que é compartilhado:** o Azure Firewall (ou NVA de terceiros) para inspeção de saída, o gateway de conectividade híbrida (VPN ou ExpressRoute), o DNS Resolver privado e o Azure Bastion para acesso administrativo seguro.

**Cada spoke de IA concentra o que é específico do domínio:** os agentes no Azure AI Foundry ou App Service, os Private Endpoints para os serviços PaaS do domínio (cada spoke tem seus próprios PEs — não compartilhados entre domínios por questão de isolamento de dados), e os NSGs específicos do workload.

## Regras de saída que a maioria esquece

Diferente de uma carga de trabalho tradicional, um spoke de IA generativa frequentemente precisa de saída controlada para:

- **Azure OpenAI endpoints** — se o recurso está no próprio spoke, o tráfego é interno. Se está em outro spoke ou hub, passa pelo firewall
- **Model Catalog** — para modelos gerenciados da Microsoft e de parceiros, o tráfego precisa de saída para internet via firewall
- **Repositórios de pacotes** — durante build e atualização de containers (PyPI, npm, MCR)
- **GitHub Copilot / APIs externas** — quando agentes chamam ferramentas externas

No Azure Firewall do hub, você precisa de regras de aplicação explícitas para cada destino:

```bicep
// Regras de aplicação para o spoke de IA
resource fwPolicyRuleCollectionGroup 'Microsoft.Network/firewallPolicies/ruleCollectionGroups@2023-09-01' = {
  name: 'rcg-ia-egress'
  parent: firewallPolicy
  properties: {
    priority: 200
    ruleCollections: [{
      ruleCollectionType: 'FirewallPolicyFilterRuleCollection'
      name: 'rc-ia-services'
      priority: 100
      action: { type: 'Allow' }
      rules: [
        {
          ruleType: 'ApplicationRule'
          name: 'allow-model-catalog'
          targetFqdns: ['*.models.ai.azure.com', '*.cognitiveservices.azure.com']
          protocols: [{ protocolType: 'Https', port: 443 }]
          sourceAddresses: ['10.1.0.0/16']  // spoke IA
        },
        {
          ruleType: 'ApplicationRule'
          name: 'allow-pypi'
          targetFqdns: ['pypi.org', 'files.pythonhosted.org']
          protocols: [{ protocolType: 'Https', port: 443 }]
          sourceAddresses: ['10.1.0.0/16']
        }
      ]
    }]
  }
}
```

## Segmentação dentro do próprio spoke de IA

Mesmo dentro do spoke, vale segmentar por função com subnets separadas:

```
VNet Spoke IA (10.1.0.0/16)
├── snet-agents         (10.1.1.0/24)  ← AI Foundry, App Service, AKS
├── snet-private-endpoints (10.1.2.0/26) ← PEs dos serviços PaaS
└── snet-data           (10.1.3.0/24)  ← Storage, integração com dados do domínio
```

O motivo não é burocracia — é controle de NSG. Um NSG na `snet-private-endpoints` pode bloquear qualquer tráfego que não venha da `snet-agents`, garantindo que só os agentes do domínio acessem os Private Endpoints daquele spoke. Sem essa separação, qualquer recurso dentro da VNet pode chamar o Azure OpenAI ou o AI Search diretamente.

## Escala: um hub, múltiplos spokes de IA por domínio de negócio

Conforme a adoção cresce, o padrão recomendado é um spoke de IA por domínio de negócio (RH, Jurídico, Financeiro), cada um com seu próprio Azure AI Search indexando os dados do domínio e seu próprio conjunto de agentes:

A separação de rede vira, na prática, um controle de segurança de dados — não só de infraestrutura. Um agente do domínio de RH fisicamente não consegue acessar o índice de busca do domínio Jurídico, porque estão em VNets diferentes com Private Endpoints separados.

## Conclusão

Tratar a carga de IA generativa como "só mais um spoke" em vez de uma ilha separada é o que permite aplicar as mesmas políticas de governança, segurança e auditoria que o restante da infraestrutura Azure já tem. O hub central não é overhead — é o que torna possível escalar de um piloto para N squads de IA sem multiplicar o custo operacional e perder o controle de quem acessa o quê.

O próximo artigo cobre o componente que mais falha silenciosamente nessa topologia: o DNS privado.

---

*Série **Azure Networking + IA Generativa** — arquitetura de referência, decisões de rede e os erros mais comuns em produção. Publicado às terças e quintas.*
