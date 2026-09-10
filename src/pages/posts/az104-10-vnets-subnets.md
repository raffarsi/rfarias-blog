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

VNet e subnet sao os primeiros recursos que voce precisa entender para o AZ-104, e tambem os que mais aparecem em questoes de prova porque estao na base de quase tudo que vem depois.

Vou focar no que realmente cai na prova e no que faz diferenca na pratica.

## VNet: o que cai na prova

VNet e regional. Voce nao pode esticar uma VNet entre duas regioes. Para conectar regioes diferentes, voce usa peering global ou Virtual WAN.

O espaco de endereçamento usa ranges RFC 1918: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. Qualquer range dentro desses e valido para VNet.

Uma VNet pode ter multiplos address spaces. Isso e util quando voce precisa adicionar ranges a uma VNet existente sem recriar tudo.

```bash
az network vnet create   --name vnet-producao   --resource-group rg-app   --location brazilsouth   --address-prefix 10.0.0.0/16

# Adicionar segundo range
az network vnet update   --name vnet-producao   --resource-group rg-app   --add addressSpace.addressPrefixes 10.1.0.0/16
```

## Subnets: o que cai na prova

O Azure reserva 5 enderecos em cada subnet: .0 (rede), .1 (gateway), .2 e .3 (DNS interno), .255 (broadcast). Esse numero cai muito em questoes sobre capacidade.

Subnets especiais tem nomes obrigatorios: `GatewaySubnet` para VPN/ER Gateway, `AzureBastionSubnet` para Bastion, `AzureFirewallSubnet` para Azure Firewall. Se o nome estiver errado, o recurso nao consegue ser criado na subnet.

```bash
az network vnet subnet create   --name GatewaySubnet   --vnet-name vnet-producao   --resource-group rg-app   --address-prefix 10.0.255.0/27  # /27 minimo para GatewaySubnet

az network vnet subnet create   --name AzureBastionSubnet   --vnet-name vnet-producao   --resource-group rg-app   --address-prefix 10.0.254.0/26  # /26 minimo para BastionSubnet
```

## Peering: o que mais engana

Peering nao e transitivo. A -> B e B -> C nao implica A -> C. Para que A alcance C, voce precisa de peering direto entre A e C.

Peering requer que os ranges de IP das VNets nao se sobreponham. Esse e o erro mais comum ao planejar a topologia.

Para peering funcionar corretamente em hub-and-spoke:
- Hub ativa `allow-gateway-transit`
- Spoke ativa `use-remote-gateways`
- Hub ativa `allow-forwarded-traffic` (para trafego que vem de outros spokes)

## Questoes tipicas do AZ-104

"Uma VM na Subnet A nao consegue se comunicar com uma VM na Subnet B da mesma VNet. O que pode estar causando isso?"

Resposta: NSG com regra de Deny entre as subnets, ou UDR redirecionando o trafego para um next-hop que esta bloqueando.

"Voce precisa conectar duas VNets que tem o range 10.0.0.0/16 cada uma. O que voce faz?"

Resposta: nao da para usar peering com ranges sobrepostos. Voce precisaria recriar uma das VNets com range diferente.

VNets e subnets sao fundacao, nao opcao. O investimento em entender bem essa parte retorna em todas as outras areas do exame.
