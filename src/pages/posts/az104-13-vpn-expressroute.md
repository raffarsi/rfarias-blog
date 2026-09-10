---
layout: ../../layouts/PostLayout.astro
title: "AZ-104 na prática [13] — VPN Gateway e ExpressRoute"
category: "Networking"
tag: "networking"
serie: "AZ-104 na prática"
serieSlug: "az104"
serieNum: 13
date: "8 Ago 2026"
readTime: "9 min"
description: "Conectando redes on-premises ao Azure com VPN Gateway e ExpressRoute."
prev:
  title: "AZ-104 [12] — Load Balancer"
  slug: "az104-12-load-balancer"
next:
  title: "AZ-104 [14] — Azure Monitor"
  slug: "az104-14-azure-monitor"

---

Conectividade hibrida e um dos topicos mais pesados do AZ-104. VPN Gateway, ExpressRoute, tipos de conexao e limitacoes especificas aparecem em varias questoes.

Vou cobrir o que realmente cai.

## VPN Gateway: os tipos de conexao que o AZ-104 testa

**Site-to-Site (S2S):** conecta rede on-premises ao Azure via tunel IPsec. Requer dispositivo VPN fisico ou virtual no lado on-premises. Trafego criptografado pela internet publica.

**Point-to-Site (P2S):** conecta dispositivos individuais (laptops, estacoes de trabalho) ao Azure. Sem necessidade de dispositivo VPN dedicado. Util para acesso remoto de usuarios.

**VNet-to-VNet:** conecta duas VNets Azure via VPN Gateway. Alternativa ao peering quando as VNets estao em subscriptions diferentes ou em regioes diferentes e voce precisa de criptografia no transito.

```bash
# VPN Gateway (leva 30-45 minutos para provisionar)
az network vnet-gateway create   --name vpn-gw-hub   --resource-group rg-networking   --vnet vnet-hub   --gateway-type Vpn   --vpn-type RouteBased   --sku VpnGw1AZ   --public-ip-address pip-vpn-gw

# Local Network Gateway (representa a rede on-premises)
az network local-gateway create   --name lng-datacenter   --resource-group rg-networking   --gateway-ip-address 203.0.113.1   --local-address-prefixes 192.168.0.0/16

# Conexao S2S
az network vpn-connection create   --name conn-datacenter   --resource-group rg-networking   --vnet-gateway1 vpn-gw-hub   --local-gateway2 lng-datacenter   --shared-key MinhaSenhaForte123
```

## SKUs do VPN Gateway que o AZ-104 diferencia

VpnGw1 a VpnGw5 com variante AZ (zona de disponibilidade). A diferenca principal para a prova: SKUs maiores suportam mais throughput e mais conexoes simultaneas. Basic nao suporta BGP nem autenticacao RADIUS.

## ExpressRoute: o que o AZ-104 foca

ExpressRoute e conexao privada dedicada entre on-premises e Azure via provedor. Sem internet publica, sem criptografia necessaria (o link e privado), com SLA de disponibilidade.

**Private Peering:** acessa recursos em VNets Azure (VMs, Private Endpoints). O peering que voce usa para conectar datacenter ao Azure.

**Microsoft Peering:** acessa servicos Microsoft publicos (Microsoft 365, Dynamics, Azure PaaS endpoints publicos) pelo backbone Microsoft em vez da internet. Menos usado que Private Peering.

O AZ-104 testa a diferenca entre os dois e sabe que Private Peering e o mais comum para conectividade hibrida tradicional.

## Questoes tipicas do AZ-104

"Voce precisa que usuarios trabalhando remotamente acessem recursos na VNet Azure sem um dispositivo VPN dedicado. Qual tipo de conexao usar?"

Resposta: Point-to-Site VPN.

"Uma empresa quer garantir que o trafego entre o datacenter e o Azure nunca passe pela internet publica e tenha SLA garantido. Qual recurso usar?"

Resposta: ExpressRoute.

"Qual a diferenca entre ExpressRoute Private Peering e Microsoft Peering?"

Private Peering acessa recursos em VNets (IPs privados). Microsoft Peering acessa servicos Microsoft publicos pelo backbone.

VPN Gateway e ExpressRoute resolvem o mesmo problema (conectividade hibrida) com tradeoffs diferentes: VPN e mais barato e mais rapido de implementar, ExpressRoute e mais confiavel e privado, mas mais caro e demora mais para provisionar.
