---
layout: ../../layouts/PostLayout.astro
title: "Load Balancer vs Application Gateway: qual usar em cada cenario"
category: "Networking"
tag: "networking"
date: "29 Jan 2026"
readTime: "9 min"
description: "Camada 4 vs camada 7, quando cada um resolve e quando voce precisa dos dois."
---

Essa confusao aparece em todo projeto: voce precisa distribuir carga e nao sabe se e Load Balancer ou Application Gateway. A documentacao lista features dos dois. As apresentacoes de vendas sugerem o mais completo. E o mais completo custa tres vezes mais e adiciona latencia que voce talvez nao precise.

A diferenca real esta na camada OSI, e isso define tudo.

## O que cada um faz de verdade

**Azure Load Balancer (Camada 4):** distribui conexoes TCP/UDP com base em IP e porta. Nao ve o conteudo HTTP. Rapido, baixa latencia, sem overhead de inspecao de pacote.

**Azure Application Gateway (Camada 7):** distribui requisicoes HTTP/HTTPS com base em URL, headers, host, cookies. Entende o protocolo. Mais recursos, mais latencia, custo maior.

```bash
# Load Balancer interno para VMs
az network lb create   --name lb-interno   --resource-group rg-app   --sku Standard   --frontend-ip-name fe-interno   --private-ip-address 10.0.1.100   --vnet-name vnet-app   --subnet snet-app   --backend-pool-name pool-vms

az network lb probe create   --lb-name lb-interno   --resource-group rg-app   --name probe-http   --protocol Http   --port 80   --path /health

az network lb rule create   --lb-name lb-interno   --resource-group rg-app   --name rule-http   --protocol Tcp   --frontend-port 80   --backend-port 80   --frontend-ip-name fe-interno   --backend-pool-name pool-vms   --probe-name probe-http
```

## Application Gateway: quando a camada 7 faz diferenca

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

## A tabela que resolve a duvida

| | Load Balancer | Application Gateway |
|---|---|---|
| Protocolos | TCP/UDP | HTTP/HTTPS |
| WAF | Nao | Sim |
| URL routing | Nao | Sim |
| SSL offload | Nao | Sim |
| Latencia | Menor | Maior |
| Custo | Menor | Maior |
| AKS Ingress | Nao | Sim (AGIC) |

## A combinacao que mais aparece em producao

Em arquiteturas com multiplos tiers, os dois coexistem:

```
Internet
  -> Application Gateway (WAF + SSL + URL routing)
       -> Load Balancer interno (distribui entre VMs de cada tier)
            -> VMs Backend
```

O Application Gateway lida com tudo que e HTTP. O Load Balancer distribui a carga dentro de cada tier sem overhead de inspecao de pacote.

Escolha Load Balancer quando o problema e TCP/UDP, latencia e prioridade ou custo e uma restricao real. Escolha Application Gateway quando voce precisa de WAF, roteamento por URL ou SSL offload centralizado. Nao escolha Application Gateway so porque parece mais completo, o custo adicional precisa de justificativa tecnica real.
