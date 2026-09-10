---
layout: ../../layouts/PostLayout.astro
title: "AZ-104 na prática [12] — Load Balancer e Application Gateway"
category: "Networking"
tag: "azure"
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

O Azure oferece múltiplas opções de balanceamento de carga. Escolher a certa depende da camada de rede e dos requisitos da aplicação.

## Azure Load Balancer (Camada 4)

Opera em L4 (TCP/UDP). Distribui tráfego baseado em IP e porta, sem inspecionar conteúdo HTTP.

```bash
# Criar IP público para o LB
az network public-ip create \
  --resource-group meu-rg \
  --name lb-pip \
  --sku Standard \
  --allocation-method Static \
  --zone 1 2 3

# Criar Load Balancer Standard
az network lb create \
  --resource-group meu-rg \
  --name meu-lb \
  --sku Standard \
  --public-ip-address lb-pip \
  --frontend-ip-name frontend \
  --backend-pool-name backend-pool

# Health probe
az network lb probe create \
  --resource-group meu-rg \
  --lb-name meu-lb \
  --name health-probe \
  --protocol Http \
  --port 80 \
  --path /health

# Regra de balanceamento
az network lb rule create \
  --resource-group meu-rg \
  --lb-name meu-lb \
  --name http-rule \
  --protocol Tcp \
  --frontend-port 80 \
  --backend-port 80 \
  --frontend-ip-name frontend \
  --backend-pool-name backend-pool \
  --probe-name health-probe
```

## Internal vs Public Load Balancer

- **Public LB** — IP público, distribui tráfego da internet
- **Internal LB** — IP privado, distribui tráfego dentro da VNet (ex: entre camada web e app)

```bash
# Internal Load Balancer
az network lb create \
  --resource-group meu-rg \
  --name lb-interno \
  --sku Standard \
  --vnet-name vnet-producao \
  --subnet snet-app \
  --frontend-ip-name frontend-interno \
  --private-ip-address 10.0.2.100 \
  --backend-pool-name backend-app
```

## Application Gateway (Camada 7)

Opera em L7 (HTTP/HTTPS). Permite roteamento baseado em URL, path e headers, terminação SSL e WAF integrado.

```bash
az network application-gateway create \
  --resource-group meu-rg \
  --name meu-agw \
  --vnet-name vnet-producao \
  --subnet snet-agw \
  --public-ip-address agw-pip \
  --sku WAF_v2 \
  --capacity 2 \
  --http-settings-port 80 \
  --frontend-port 443 \
  --cert-file meu-cert.pfx \
  --cert-password {senha}
```

## Roteamento baseado em path

```bash
# Configurar roteamento: /api/* vai para backend-api, resto para backend-web
az network application-gateway url-path-map create \
  --resource-group meu-rg \
  --gateway-name meu-agw \
  --name url-path-map \
  --paths /api/* \
  --address-pool backend-api \
  --http-settings http-settings-api \
  --default-address-pool backend-web \
  --default-http-settings http-settings-web
```

<div class="callout">
<strong>Dica para o exame:</strong> Azure Load Balancer Standard é zone-redundant por padrão — distribui automaticamente entre zonas. O SKU Basic não suporta Availability Zones. Para novos deployments, sempre use Standard.
</div>

## Comparativo: quando usar cada um

| | Load Balancer | Application Gateway | Traffic Manager | Front Door |
|-|--------------|-------------------|-----------------|------------|
| Camada | L4 | L7 | DNS (Global) | L7 (Global) |
| Roteamento | IP/Porta | URL, Path, Headers | Geográfico, performance | URL, latência |
| SSL | Passthrough | Terminação/E2E | N/A | Terminação |
| WAF | Não | Sim | Não | Sim |

## O que cai no exame

- Diferença entre LB L4 e Application Gateway L7
- Basic vs Standard SKU do Load Balancer
- Health probes e como determinam a disponibilidade dos backends
- Roteamento baseado em path no Application Gateway
- Que o AGW precisa de subnet dedicada (snet-agw)
