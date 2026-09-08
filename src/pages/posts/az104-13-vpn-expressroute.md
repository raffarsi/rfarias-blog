---
layout: ../../layouts/PostLayout.astro
title: "AZ-104 na prática [13] — VPN Gateway e ExpressRoute"
category: "Azure"
tag: "azure"
serie: "AZ-104 na prática"
serieNum: 13
date: "8 Ago 2026"
readTime: "9 min"
description: "Conectando redes on-premises ao Azure com VPN Gateway e ExpressRoute."
prev:
  title: "AZ-104 na prática [12] — Load Balancer"
  slug: "az104-12-load-balancer"
next:
  title: "AZ-104 na prática [14] — Azure Monitor"
  slug: "az104-14-azure-monitor"
---

Conectar ambientes on-premises ao Azure é um requisito comum. O Azure oferece duas opções principais: VPN Gateway (pela internet) e ExpressRoute (conexão privada dedicada).

## VPN Gateway

Cria conexões IPsec/IKE sobre a internet pública, criptografadas.

```bash
# Criar IP público para o gateway
az network public-ip create \
  --resource-group meu-rg \
  --name vpn-pip \
  --allocation-method Static \
  --sku Standard

# Criar VPN Gateway (leva 30-45 minutos)
az network vnet-gateway create \
  --resource-group meu-rg \
  --name meu-vpn-gateway \
  --public-ip-address vpn-pip \
  --vnet vnet-producao \
  --gateway-type Vpn \
  --vpn-type RouteBased \
  --sku VpnGw2 \
  --no-wait
```

## Tipos de VPN

**VPN Baseada em Política** — usa políticas estáticas de tráfego. Legada, suporta apenas IKEv1. Uma única conexão.

**VPN Baseada em Rota** — usa tabelas de roteamento. Recomendada. Suporta IKEv2, múltiplas conexões, VNet-to-VNet e conexões ponto a site.

## Site-to-Site (S2S)

Conecta rede on-premises inteira ao Azure:

```bash
# Representar o dispositivo VPN on-premises
az network local-gateway create \
  --resource-group meu-rg \
  --name local-gw-onprem \
  --gateway-ip-address {IP-publico-do-firewall-onprem} \
  --address-prefixes 192.168.0.0/24

# Criar conexão S2S
az network vpn-connection create \
  --resource-group meu-rg \
  --name conexao-onprem \
  --vnet-gateway1 meu-vpn-gateway \
  --local-gateway2 local-gw-onprem \
  --shared-key {chave-pre-compartilhada}
```

## Point-to-Site (P2S)

Conecta computadores individuais à VNet (usuários remotos):

```bash
az network vnet-gateway update \
  --resource-group meu-rg \
  --name meu-vpn-gateway \
  --client-protocol OpenVPN \
  --address-prefixes 172.16.0.0/24
```

## ExpressRoute

Conexão privada dedicada via parceiros (Equinix, AT&T, etc.). Não passa pela internet.

**Vantagens sobre VPN:**
- Menor latência e maior confiabilidade
- Largura de banda maior (até 100 Gbps)
- SLA garantido

```bash
# Criar circuit (depois de adquirir com o provedor)
az network express-route create \
  --resource-group meu-rg \
  --name meu-er-circuit \
  --location brazilsouth \
  --bandwidth 200 \
  --peering-location "Equinix-SP" \
  --provider "Equinix" \
  --sku-family MeteredData \
  --sku-tier Standard
```

<div class="callout">
<strong>Dica para o exame:</strong> ExpressRoute Global Reach permite que duas redes on-premises conectadas ao Azure se comuniquem entre si através do backbone Microsoft, sem tráfego pela internet pública. Ideal para empresas multinacionais.
</div>

## VPN Gateway SKUs

| SKU | Throughput | Conexões S2S | P2S |
|-----|-----------|-------------|-----|
| Basic | 100 Mbps | 10 | 128 |
| VpnGw1 | 650 Mbps | 30 | 250 |
| VpnGw2 | 1 Gbps | 30 | 500 |
| VpnGw3 | 1.25 Gbps | 30 | 1000 |
| VpnGw4/5 | 5/10 Gbps | 30 | 5000/10000 |

## O que cai no exame

- Diferença entre VPN Policy-based e Route-based
- VPN S2S vs P2S e quando usar cada um
- ExpressRoute vs VPN: privacidade, latência, SLA e custo
- Que GatewaySubnet é obrigatória e não pode ter NSG
- ExpressRoute Global Reach para conectar sites on-premises entre si
