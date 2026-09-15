---
layout: ../../layouts/PostLayout.astro
title: "Application Gateway vs. Front Door vs. Load Balancer: qual usar em cada camada da arquitetura"
category: "Networking"
tag: "networking"
date: "15 Set 2026"
readTime: "10 min"
description: "Escolher pelo nome e a forma mais cara de errar. A decisao certa depende da camada OSI e do escopo geografico, nao do que parece mais robusto."
---

Ja vi um time passar semanas tentando resolver um problema de performance escalando maquina. Primeiro vertical. Depois horizontal. Depois Load Balancer na frente.

O problema continuava.

Quando fui olhar, o gargalo nao era capacidade. Era roteamento. A aplicacao tinha multiplos servicos e todo o trafego ia para o mesmo destino, independente do endpoint chamado.

Load Balancer distribui conexoes. Ele nao le URL. Nao sabe que `/api` deveria ir para um lugar e `/app` para outro.

Trocaram pelo Application Gateway. Resolvido em horas depois de semanas tentando escalar o que nao precisava escalar.

## A diferenca que muda tudo

Nao e sobre qual dos tres e o melhor. E sobre qual camada voce precisa atuar.

**Load Balancer (Camada 4):** distribui conexoes TCP/UDP por IP e porta. Nao inspeciona o conteudo HTTP. Rapido, baixa latencia, sem overhead. Certo para protocolos que nao sao HTTP, para cenarios onde latencia e critica ou quando custo e uma restricao real.

**Application Gateway (Camada 7):** entende HTTP. Roteia por URL path, headers, cookies. WAF integrado com OWASP ruleset. SSL offload centralizado. Afinidade de sessao. Certo quando voce precisa que `/api` va para um backend e `/app` va para outro, ou quando WAF e requisito.

**Front Door (Global):** tambem entende HTTP, mas opera na borda global antes do trafego entrar em qualquer regiao Azure. Anycast, CDN integrada, WAF global, failover automatico entre regioes. Certo quando voce tem usuarios em multiplos paises ou quando alta disponibilidade entre regioes e requisito.

## Numa arquitetura de IA generativa, os tres coexistem

Quando uma plataforma de IA generativa precisa atender usuarios via Web, Mobile e Teams de multiplas regioes, a pergunta nao e qual dos tres usar. E como cada um entra na arquitetura.

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

Cada um resolvendo a parte que sabe resolver melhor. Front Door nao substitui o WAF regional do Application Gateway, ele opera em camadas diferentes.

## O erro mais comum: Front Door sozinho

Front Door tem WAF proprio. Mas ele opera na borda, antes do trafego chegar a sua regiao. Uma requisicao que passar pela borda ainda chega sem inspecao regional.

Para defesa em profundidade, especialmente em arquiteturas que lidam com dados corporativos sensiveis via RAG, a pratica recomendada e combinar os dois: WAF do Front Door na borda global e WAF do Application Gateway na regiao.

Nao e redundancia. E profundidade.

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

## O outro erro comum: Application Gateway v1 em producao nova

O v2 (Standard v2 e WAF v2) suporta autoscaling e zonas de disponibilidade. O v1 nao suporta nenhum dos dois.

Para qualquer ambiente de producao novo nao existe justificativa para escolher v1. Ainda aparece em arquiteturas legadas por receio de migrar, mas a divida tecnica acumula sem necessidade.

```bash
# Verificar SKU dos Application Gateways existentes
az network application-gateway list \
  --query "[].{nome:name, sku:sku.tier, rg:resourceGroup}" \
  --output table

# Saida esperada em producao nova:
# WAF_v2 ou Standard_v2
# Se aparecer WAF ou Standard (sem v2), e candidato a migracao
```

## Tabela de decisao

| | Load Balancer | Application Gateway | Front Door |
|---|---|---|---|
| Camada OSI | 4 | 7 | Global |
| URL routing | Nao | Sim | Sim |
| WAF | Nao | Sim (regional) | Sim (global) |
| SSL offload | Nao | Sim | Sim |
| Multi-regiao | Nao | Nao | Sim |
| CDN | Nao | Nao | Sim |
| Custo relativo | Baixo | Medio | Alto |

## A regra que uso antes de escolher

Tres perguntas, nessa ordem:

1. O trafego e HTTP ou TCP/UDP? Se for TCP/UDP puro, Load Balancer. Se for HTTP, proxima pergunta.
2. Preciso rotear por URL ou so distribuir carga? Se precisar de URL routing, Application Gateway. Se nao, Load Balancer.
3. Meus usuarios estao em uma regiao ou no mundo todo? Se estiverem espalhados, Front Door na frente.

Quando voce entende isso, a escolha vira consequencia da arquitetura. Nao o ponto de partida.
