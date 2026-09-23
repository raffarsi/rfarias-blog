---
layout: ../../layouts/PostLayout.astro
title: "Load Balancer vs Application Gateway: qual usar em cada cenário"
category: "Networking"
tag: "networking"
date: "29 Jan 2026"
readTime: "9 min"
description: "Camada 4 vs camada 7, quando cada um resolve e quando você precisa dos dois."
---

Essa confusão aparece em todo projeto: você precisa distribuir carga e não sabe se é Load Balancer ou Application Gateway. A documentação lista features dos dois. As apresentações de vendas sugerem o mais completo. É o mais completo custa três vezes mais e adiciona latência que você talvez não precise.

A diferença real está na camada OSI, e isso define tudo.

## O que cada um faz de verdade

**Azure Load Balancer (Camada 4):** distribui conexões TCP/UDP com base em IP e porta. Não vê o conteúdo HTTP. Rápido, baixa latência, sem overhead de inspeção de pacote.

**Azure Application Gateway (Camada 7):** distribui requisições HTTP/HTTPS com base em URL, headers, host, cookies. Entende o protocolo. Mais recursos, mais latência, custo maior.

```bash
# Load Balancer interno para VMs
az network lb create   --name lb-interno   --resource-group rg-app   --sku Standard   --frontend-ip-name fe-interno   --private-ip-address 10.0.1.100   --vnet-name vnet-app   --subnet snet-app   --backend-pool-name pool-vms

az network lb probe create   --lb-name lb-interno   --resource-group rg-app   --name probe-http   --protocol Http   --port 80   --path /health

az network lb rule create   --lb-name lb-interno   --resource-group rg-app   --name rule-http   --protocol Tcp   --frontend-port 80   --backend-port 80   --frontend-ip-name fe-interno   --backend-pool-name pool-vms   --probe-name probe-http
```

## Application Gateway: quando a camada 7 faz diferença

```bicep
resource appGw 'Microsoft.Network/applicationGateways@2023-09-01' = {
  name: 'agw-producao'
  properties: {
    sku: { name: 'WAF_v2', tier: 'WAF_v2', capacity: 2 }
    urlPathMaps: [{
      name: 'url-routing'
      properties: {
        pathRules: [
          {
            name: 'rule-api'
            properties: {
              paths: ['/api/*']
              backendAddressPool: { id: poolApi.id }
            }
          }
          {
            name: 'rule-frontend'
            properties: {
              paths: ['/app/*']
              backendAddressPool: { id: poolFrontend.id }
            }
          }
        ]
      }
    }]
  }
}
```

## A tabela que resolve a dúvida

| | Load Balancer | Application Gateway |
|---|---|---|
| Protocolos | TCP/UDP | HTTP/HTTPS |
| WAF | Não | Sim |
| URL routing | Não | Sim |
| SSL offload | Não | Sim |
| Latência | Menor | Maior |
| Custo | Menor | Maior |
| AKS Ingress | Não | Sim (AGIC) |

## A combinação que mais aparece em produção

Em arquiteturas com múltiplos tiers, os dois coexistem:

```
Internet
  -> Application Gateway (WAF + SSL + URL routing)
       -> Load Balancer interno (distribui entre VMs de cada tier)
            -> VMs Backend
```

O Application Gateway lida com tudo que é HTTP. O Load Balancer distribui a carga dentro de cada tier sem overhead de inspeção de pacote.

Escolha Load Balancer quando o problema é TCP/UDP, latência é prioridade ou custo é uma restrição real. Escolha Application Gateway quando você precisa de WAF, roteamento por URL ou SSL offload centralizado. Não escolha Application Gateway só porque parece mais completo, o custo adicional precisa de justificativa técnica real.
