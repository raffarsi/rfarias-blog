---
layout: ../../layouts/PostLayout.astro
title: "AZ-104 na prática [12] — Load Balancer e Application Gateway"
category: "Networking"
tag: "networking"
serie: "AZ-104 na prática"
serieSlug: "az104"
serieNum: 12
date: "1 Ago 2026"
readTime: "10 min"
description: "Distribuição de carga com Azure Load Balancer (L4) e Application Gateway (L7)."
prev:
  title: "AZ-104 [11] — NSG e Roteamento"
  slug: "az104-11-nsg-roteamento"
next:
  title: "AZ-104 [13] — VPN e ExpressRoute"
  slug: "az104-13-vpn-expressroute"

---

O AZ-104 testa Load Balancer e Application Gateway como recursos distintos com casos de uso diferentes. Confundir os dois na prova e responder errado para perguntas que parecem ambiguas.

A diferenca fundamental: Load Balancer opera na camada 4 (TCP/UDP), Application Gateway na camada 7 (HTTP/HTTPS).

## Azure Load Balancer: o que o AZ-104 cobre

Load Balancer tem dois SKUs importantes: Basic e Standard. O Standard suporta zonas de disponibilidade, tem SLA de 99.99% e e o que voce deve usar em producao. Basic nao tem SLA garantido e vai ser descontinuado.

Load Balancer pode ser publico (IP publico no frontend) ou interno (IP privado). O tipo nao muda a configuracao, muda o tipo de IP do frontend.

```bash
# Load Balancer publico
az network lb create   --name lb-publico   --resource-group rg-app   --sku Standard   --public-ip-address pip-lb

# Load Balancer interno
az network lb create   --name lb-interno   --resource-group rg-app   --sku Standard   --frontend-ip-name fe-interno   --private-ip-address 10.0.1.100   --vnet-name vnet-app   --subnet snet-app
```

Health probes verificam se os backends estao respondendo. Se um backend para de responder, o Load Balancer para de enviar trafego para ele. Tipos de probe: HTTP, HTTPS, TCP.

## Application Gateway: o que muda

Application Gateway entende HTTP. Isso permite: roteamento por URL path (`/api/*` vai para um backend, `/app/*` vai para outro), SSL offload (o gateway termina o SSL, backends recebem HTTP), afinidade de sessao por cookie, WAF integrado.

SKU WAF_v2 e o atual e o que o AZ-104 foca. Tem autoscaling automatico, zonas de disponibilidade e WAF como opcao.

```bash
az network application-gateway create   --name agw-producao   --resource-group rg-app   --sku WAF_v2   --capacity 2   --vnet-name vnet-app   --subnet snet-agw   --public-ip-address pip-agw
```

## Questoes tipicas do AZ-104

"Voce tem uma aplicacao web com dois backends. Voce quer que requisicoes para /api/* vao para um pool e /app/* para outro. Qual recurso usar?"

Resposta: Application Gateway. Load Balancer nao tem roteamento por URL.

"Voce precisa distribuir trafego TCP porta 1433 (SQL Server) entre tres servidores. Qual recurso usar?"

Resposta: Load Balancer. Application Gateway so entende HTTP/HTTPS.

"Um backend do Application Gateway esta respondendo HTTP 503. O que acontece?"

Resposta: o Application Gateway para de enviar trafego para aquele backend ate ele voltar a responder dentro dos criterios do health probe.

Load Balancer e Application Gateway nao competem, resolvem problemas de camadas diferentes. Na prova, a camada do protocolo e o que determina qual recurso usar.
