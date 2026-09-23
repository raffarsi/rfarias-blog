---
layout: ../../layouts/PostLayout.astro
title: "AZ-104 na prática [13]: VPN Gateway e ExpressRoute"
category: "Networking"
tag: "networking"
serie: "AZ-104 na prática"
serieSlug: "az104"
serieNum: 13
date: "8 Ago 2026"
readTime: "9 min"
description: "Conectando redes on-premises ao Azure com VPN Gateway e ExpressRoute."
prev:
  title: "AZ-104 [12]: Load Balancer"
  slug: "az104-12-load-balancer"
next:
  title: "AZ-104 [14]: Azure Monitor"
  slug: "az104-14-azure-monitor"

---

Conectividade híbrida é um dos tópicos mais pesados do AZ-104. VPN Gateway, ExpressRoute, tipos de conexão e limitações específicas aparecem em várias questões.

Vou cobrir o que realmente cai.

## VPN Gateway: os tipos de conexão que o AZ-104 testa

**Site-to-Site (S2S):** conecta rede on-premises ao Azure via túnel IPsec. Requer dispositivo VPN físico ou virtual no lado on-premises. Tráfego criptografado pela internet pública.

**Point-to-Site (P2S):** conecta dispositivos individuais (laptops, estações de trabalho) ao Azure. Sem necessidade de dispositivo VPN dedicado. Útil para acesso remoto de usuários.

**VNet-to-VNet:** conecta duas VNets Azure via VPN Gateway. Alternativa ao peering quando as VNets estão em subscriptions diferentes ou em regiões diferentes e você precisa de criptografia no trânsito.

```bash
# VPN Gateway (leva 30-45 minutos para provisionar)
az network vnet-gateway create   --name vpn-gw-hub   --resource-group rg-networking   --vnet vnet-hub   --gateway-type Vpn   --vpn-type RouteBased   --sku VpnGw1AZ   --public-ip-address pip-vpn-gw

# Local Network Gateway (representa a rede on-premises)
az network local-gateway create   --name lng-datacenter   --resource-group rg-networking   --gateway-ip-address 203.0.113.1   --local-address-prefixes 192.168.0.0/16

# Conexao S2S
az network vpn-connection create   --name conn-datacenter   --resource-group rg-networking   --vnet-gateway1 vpn-gw-hub   --local-gateway2 lng-datacenter   --shared-key MinhaSenhaForte123
```

## SKUs do VPN Gateway que o AZ-104 diferencia

VpnGw1 a VpnGw5 com variante AZ (zona de disponibilidade). A diferença principal para a prova: SKUs maiores suportam mais throughput e mais conexões simultâneas. Basic não suporta BGP nem autenticação RADIUS.

## ExpressRoute: o que o AZ-104 foca

ExpressRoute é conexão privada dedicada entre on-premises e Azure via provedor. Sem internet pública, sem criptografia necessária (o link é privado), com SLA de disponibilidade.

**Private Peering:** acessa recursos em VNets Azure (VMs, Private Endpoints). O peering que você usa para conectar datacenter ao Azure.

**Microsoft Peering:** acessa serviços Microsoft públicos (Microsoft 365, Dynamics, Azure PaaS endpoints públicos) pelo backbone Microsoft em vez da internet. Menos usado que Private Peering.

O AZ-104 testa a diferença entre os dois e sabe que Private Peering é o mais comum para conectividade híbrida tradicional.

## Questões típicas do AZ-104

"Você precisa que usuários trabalhando remotamente acessem recursos na VNet Azure sem um dispositivo VPN dedicado. Qual tipo de conexão usar?"

Resposta: Point-to-Site VPN.

"Uma empresa quer garantir que o tráfego entre o datacenter e o Azure nunca passe pela internet pública e tenha SLA garantido. Qual recurso usar?"

Resposta: ExpressRoute.

"Qual a diferença entre ExpressRoute Private Peering e Microsoft Peering?"

Private Peering acessa recursos em VNets (IPs privados). Microsoft Peering acessa serviços Microsoft públicos pelo backbone.

VPN Gateway e ExpressRoute resolvem o mesmo problema (conectividade híbrida) com tradeoffs diferentes: VPN é mais barato e mais rápido de implementar, ExpressRoute é mais confiável e privado, mas mais caro e demora mais para provisionar.
