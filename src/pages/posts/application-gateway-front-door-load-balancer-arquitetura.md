---
layout: ../../layouts/PostLayout.astro
title: "Application Gateway vs. Front Door vs. Load Balancer: qual usar em cada camada da arquitetura"
category: "Networking"
tag: "networking"
date: "15 Set 2026"
readTime: "10 min"
description: "Escolher pelo nome é a forma mais cara de errar. A decisão certa depende da camada OSI e do escopo geográfico, não do que parece mais robusto."
---

Já vi um time passar semanas tentando resolver um problema de performance escalando máquina. Primeiro vertical. Depois horizontal. Depois Load Balancer na frente.

O problema continuava.

Quando fui olhar, o gargalo não era capacidade. Era roteamento. A aplicação tinha múltiplos serviços e todo o tráfego ia para o mesmo destino, independente do endpoint chamado.

Load Balancer distribui conexões. Ele não lê URL. Não sabe que `/api` deveria ir para um lugar e `/app` para outro.

Trocaram pelo Application Gateway. Resolvido em horas depois de semanas tentando escalar o que não precisava escalar.

## A diferença que muda tudo

Não é sobre qual dos três é o melhor. É sobre qual camada você precisa atuar.

**Load Balancer (Camada 4):** distribui conexões TCP/UDP por IP e porta. Não inspeciona o conteúdo HTTP. Rápido, baixa latência, sem overhead. Certo para protocolos que não são HTTP, para cenários onde latência é crítica ou quando custo é uma restrição real.

**Application Gateway (Camada 7):** entende HTTP. Roteia por URL path, headers, cookies. WAF integrado com OWASP ruleset. SSL offload centralizado. Afinidade de sessão. Certo quando você precisa que `/api` va para um backend e `/app` va para outro, ou quando WAF é requisito.

**Front Door (Global):** também entende HTTP, mas opera na borda global antes do tráfego entrar em qualquer região Azure. Anycast, CDN integrada, WAF global, failover automático entre regiões. Certo quando você tem usuários em múltiplos países ou quando alta disponibilidade entre regiões é requisito.

## Numa arquitetura de IA generativa, os três coexistem

Quando uma plataforma de IA generativa precisa atender usuários via Web, Mobile e Teams de múltiplas regiões, a pergunta não é qual dos três usar. É como cada um entra na arquitetura.

```
Usuarios (Web, Mobile, Teams)
  -> Azure Front Door
       WAF global + CDN + anycast
       Direciona para a regiao mais proxima
       
  -> Application Gateway (por regiao)
       WAF regional + URL routing
       /api  -> backend dos agentes de IA
       /app  -> frontend da aplicacao
       
  -> Load Balancer (interno, por tier)
       Distribui carga entre instancias
       Sem overhead de inspecao de conteudo
```

Cada um resolvendo a parte que sabe resolver melhor. Front Door não substitui o WAF regional do Application Gateway, ele opera em camadas diferentes.

## O erro mais comum: Front Door sozinho

Front Door tem WAF próprio. Mas ele opera na borda, antes do tráfego chegar a sua região. Uma requisição que passar pela borda ainda chega sem inspeção regional.

Para defesa em profundidade, especialmente em arquiteturas que lidam com dados corporativos sensíveis via RAG, a prática recomendada é combinar os dois: WAF do Front Door na borda global e WAF do Application Gateway na região.

Não é redundância. É profundidade.

```bicep
// Application Gateway WAF v2 — WAF regional
resource appGw 'Microsoft.Network/applicationGateways@2023-09-01' = {
  name: 'agw-ia-producao'
  properties: {
    sku: { name: 'WAF_v2', tier: 'WAF_v2' }
    webApplicationFirewallConfiguration: {
      enabled: true
      firewallMode: 'Prevention'
      ruleSetType: 'OWASP'
      ruleSetVersion: '3.2'
    }
    urlPathMaps: [{
      name: 'routing-ia'
      properties: {
        pathRules: [
          {
            name: 'route-api-agentes'
            properties: {
              paths: ['/api/agentes/*']
              backendAddressPool: { id: poolAgentes.id }
            }
          }
          {
            name: 'route-api-rag'
            properties: {
              paths: ['/api/rag/*']
              backendAddressPool: { id: poolRAG.id }
            }
          }
        ]
      }
    }]
  }
}
```

```bicep
// Front Door com WAF global
resource frontDoor 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: 'afd-ia-global'
  sku: { name: 'Premium_AzureFrontDoor' }
}

resource wafPolicy 'Microsoft.Network/FrontDoorWebApplicationFirewallPolicies@2022-05-01' = {
  name: 'waf-global-ia'
  properties: {
    policySettings: { mode: 'Prevention' }
    managedRules: {
      managedRuleSets: [{
        ruleSetType: 'Microsoft_DefaultRuleSet'
        ruleSetVersion: '2.1'
      }]
    }
  }
}
```

## O outro erro comum: Application Gateway v1 em produção nova

O v2 (Standard v2 e WAF v2) suporta autoscaling e zonas de disponibilidade. O v1 não suporta nenhum dos dois.

Para qualquer ambiente de produção novo não existe justificativa para escolher v1. Ainda aparece em arquiteturas legadas por receio de migrar, mas a dívida técnica acumula sem necessidade.

```bash
# Verificar SKU dos Application Gateways existentes
az network application-gateway list \
  --query "[].{nome:name, sku:sku.tier, rg:resourceGroup}" \
  --output table

# Saida esperada em producao nova:
# WAF_v2 ou Standard_v2
# Se aparecer WAF ou Standard (sem v2), e candidato a migracao
```

## Tabela de decisão

| | Load Balancer | Application Gateway | Front Door |
|---|---|---|---|
| Camada OSI | 4 | 7 | Global |
| URL routing | Não | Sim | Sim |
| WAF | Não | Sim (regional) | Sim (global) |
| SSL offload | Não | Sim | Sim |
| Multi-região | Não | Não | Sim |
| CDN | Não | Não | Sim |
| Custo relativo | Baixo | Médio | Alto |

## A regra que uso antes de escolher

Três perguntas, nessa ordem:

1. O tráfego é HTTP ou TCP/UDP? Se for TCP/UDP puro, Load Balancer. Se for HTTP, próxima pergunta.
2. Preciso rotear por URL ou só distribuir carga? Se precisar de URL routing, Application Gateway. Se não, Load Balancer.
3. Meus usuários estão em uma região ou no mundo todo? Se estiverem espalhados, Front Door na frente.

Quando você entende isso, a escolha vira consequência da arquitetura. Não o ponto de partida.
