---
layout: ../../layouts/PostLayout.astro
title: "AZ-104 na prática [10] — VNets, subnets e peering"
category: "Networking"
tag: "networking"
serie: "AZ-104 na prática"
serieSlug: "az104"
serieNum: 10
date: "18 Jul 2026"
readTime: "11 min"
description: "Como planejar e implementar Virtual Networks, subnets e conectar VNets com peering."
prev:
  title: "AZ-104 [9] — Containers e AKS"
  slug: "az104-09-containers-aks"
next:
  title: "AZ-104 [11] — NSG e Roteamento"
  slug: "az104-11-nsg-roteamento"

---

VNet e subnet são os primeiros recursos que você precisa entender para o AZ-104, e também os que mais aparecem em questões de prova porque estão na base de quase tudo que vem depois.

Vou focar no que realmente cai na prova e no que faz diferença na prática.

## VNet: o que cai na prova

VNet é regional. Você não pode esticar uma VNet entre duas regiões. Para conectar regiões diferentes, você usa peering global ou Virtual WAN.

O espaço de endereçamento usa ranges RFC 1918: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. Qualquer range dentro desses é válido para VNet.

Uma VNet pode ter múltiplos address spaces. Isso é útil quando você precisa adicionar ranges a uma VNet existente sem recriar tudo.

```bash
az network vnet create   --name vnet-producao   --resource-group rg-app   --location brazilsouth   --address-prefix 10.0.0.0/16

# Adicionar segundo range
az network vnet update   --name vnet-producao   --resource-group rg-app   --add addressSpace.addressPrefixes 10.1.0.0/16
```

## Subnets: o que cai na prova

O Azure reserva 5 endereços em cada subnet: .0 (rede), .1 (gateway), .2 e .3 (DNS interno), .255 (broadcast). Esse número cai muito em questões sobre capacidade.

Subnets especiais tem nomes obrigatórios: `GatewaySubnet` para VPN/ER Gateway, `AzureBastionSubnet` para Bastion, `AzureFirewallSubnet` para Azure Firewall. Se o nome estiver errado, o recurso não consegue ser criado na subnet.

```bash
az network vnet subnet create   --name GatewaySubnet   --vnet-name vnet-producao   --resource-group rg-app   --address-prefix 10.0.255.0/27  # /27 minimo para GatewaySubnet

az network vnet subnet create   --name AzureBastionSubnet   --vnet-name vnet-producao   --resource-group rg-app   --address-prefix 10.0.254.0/26  # /26 minimo para BastionSubnet
```

## Peering: o que mais engana

Peering não é transitivo. A -> B e B -> C não implica A -> C. Para que A alcance C, você precisa de peering direto entre A e C.

Peering requer que os ranges de IP das VNets não se sobreponham. Esse é o erro mais comum ao planejar a topologia.

Para peering funcionar corretamente em hub-and-spoke:
- Hub ativa `allow-gateway-transit`
- Spoke ativa `use-remote-gateways`
- Hub ativa `allow-forwarded-traffic` (para tráfego que vem de outros spokes)

## Questões típicas do AZ-104

"Uma VM na Subnet A não consegue se comunicar com uma VM na Subnet B da mesma VNet. O que pode estar causando isso?"

Resposta: NSG com regra de Deny entre as subnets, ou UDR redirecionando o tráfego para um next-hop que está bloqueando.

"Você precisa conectar duas VNets que tem o range 10.0.0.0/16 cada uma. O que você faz?"

Resposta: não da para usar peering com ranges sobrepostos. Você precisaria recriar uma das VNets com range diferente.

VNets e subnets são fundação, não opção. O investimento em entender bem essa parte retorna em todas as outras áreas do exame.
