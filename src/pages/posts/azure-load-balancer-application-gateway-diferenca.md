---
layout: ../../layouts/PostLayout.astro
title: "Load Balancer vs Application Gateway: qual usar em cada cenario"
category: "Networking"
tag: "networking"
date: "29 Jan 2026"
readTime: "9 min"
description: "Camada 4 vs camada 7, quando cada um resolve e quando voce precisa dos dois."
---

Uma das perguntas mais frequentes em projetos Azure: preciso de Load Balancer ou Application Gateway? A resposta depende de qual camada voce precisa de balanceamento e quais features sao necessarias.

## A diferenca fundamental: camada 4 vs camada 7

**Azure Load Balancer (Camada 4 -- TCP/UDP):** distribui conexoes com base em IP e porta. Rapido, baixa latencia, sem inspecao de conteudo HTTP.

**Azure Application Gateway (Camada 7 -- HTTP/HTTPS):** distribui requisicoes com base em URL, headers, cookies, host. Mais lento, mais caro, mas muito mais flexivel.

## Azure Load Balancer

```bash
# Load Balancer interno (private frontend)
az network lb create \
  --name lb-interno \
  --resource-group rg-app \
  --sku Standard \
  --frontend-ip-name fe-interno \
  --private-ip-address 10.0.1.100 \
  --vnet-name vnet-app \
  --subnet snet-app \
  --backend-pool-name pool-vms

# Health probe
az network lb probe create \
  --lb-name lb-interno \
  --resource-group rg-app \
  --name probe-http \
  --protocol Http \
  --port 80 \
  --path /health

# Regra de balanceamento
az network lb rule create \
  --lb-name lb-interno \
  --resource-group rg-app \
  --name rule-http \
  --protocol Tcp \
  --frontend-port 80 \
  --backend-port 80 \
  --frontend-ip-name fe-interno \
  --backend-pool-name pool-vms \
  --probe-name probe-http
```

Quando usar Load Balancer:
- Balanceamento de trafego nao-HTTP (SQL, SMTP, protocolos proprios)
- Baixa latencia e alta performance sao criticos
- Nao precisa de WAF, SSL offload ou roteamento por URL

## Application Gateway

```bicep
resource appGw 'Microsoft.Network/applicationGateways@2023-09-01' = {
  name: 'agw-producao'
  properties: {
    sku: { name: 'WAF_v2', tier: 'WAF_v2', capacity: 2 }
    // Routing por URL path
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

Quando usar Application Gateway:
- WAF necessario (OWASP ruleset, custom rules)
- Roteamento por URL path (microservicos)
- SSL offload centralizado
- Session affinity por cookie
- Integracao com AKS como Ingress Controller (AGIC)

## Comparacao lado a lado

| Feature | Load Balancer | App Gateway |
|---------|--------------|-------------|
| Camada OSI | 4 | 7 |
| Protocolos | TCP/UDP | HTTP/HTTPS |
| WAF | Nao | Sim |
| URL routing | Nao | Sim |
| SSL offload | Nao | Sim |
| Latencia | Menor | Maior |
| Custo | Menor | Maior |
| Autoscale | Nao | Sim (v2) |

## Usando os dois juntos

Para aplicacoes complexas, voce usa ambos em camadas:

```
Internet
  -> Application Gateway (WAF + SSL + URL routing)
       -> Load Balancer interno (balanceia VMs de cada tier)
            -> VMs Backend
```

<div class="callout">
<strong>Application Gateway Ingress Controller (AGIC):</strong> Para workloads AKS, o AGIC integra o Application Gateway como Ingress do cluster -- regras de Ingress do Kubernetes sao automaticamente traduzidas para regras do App Gateway. Elimina a necessidade de um Load Balancer separado na frente do cluster.
</div>

## Conclusao

Load Balancer para trafego nao-HTTP ou quando performance e prioridade. Application Gateway quando precisar de WAF, roteamento por URL ou SSL offload. Para a maioria das aplicacoes web em producao, o Application Gateway com WAF e o correto -- o custo adicional paga o nivel de protecao e flexibilidade.
