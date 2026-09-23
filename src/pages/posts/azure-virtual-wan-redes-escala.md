---
layout: ../../layouts/PostLayout.astro
title: "Azure Virtual WAN: quando a topologia hub-and-spoke tradicional não escala"
category: "Networking"
tag: "networking"
date: "26 Fev 2026"
readTime: "9 min"
description: "O que é o Virtual WAN e quando a topologia hub-and-spoke tradicional atinge seus limites."
---

Hub-and-spoke tradicional funciona bem até uns 20 spokes. A partir daí, gerenciar peerings, UDRs e conectividade entre regiões começa a virar trabalho operacional de tempo integral. Você passa mais tempo mantendo a topologia do que construindo coisas sobre ela.

O Virtual WAN não é só "hub-and-spoke na nuvem". É uma mudança de modelo operacional.

## O que muda na prática

No hub-and-spoke tradicional, você gerencia manualmente: peerings entre hub e cada spoke, UDRs em cada subnet de cada spoke, gateways VPN/ER separados, conectividade entre regiões via peering global.

No Virtual WAN, você cria a conexão entre o spoke e o hub. O resto é gerenciado automaticamente: roteamento, propagação de rotas, conectividade entre hubs em regiões diferentes.

```bash
az network vwan create   --name vwan-global   --resource-group rg-networking   --type Standard

az network vhub create   --name hub-brazilsouth   --resource-group rg-networking   --vwan vwan-global   --location brazilsouth   --address-prefix 10.0.0.0/24

# Segundo hub em outra regiao
az network vhub create   --name hub-eastus   --resource-group rg-networking   --vwan vwan-global   --location eastus   --address-prefix 10.1.0.0/24
```

Os hubs se conectam automaticamente via backbone Microsoft. Sem configurar peering entre eles.

## Conectando VNets ao hub

```bash
az network vhub connection create   --name conn-spoke-ia   --resource-group rg-networking   --vhub-name hub-brazilsouth   --remote-vnet vnet-spoke-ia
```

Não é necessário peering manual. A conexão ao hub é gerenciada pelo Virtual WAN, incluindo roteamento automático para outros spokes e para conexões on-premises do mesmo hub.

## Secured Hub: Azure Firewall integrado

```bash
az network firewall create   --name fw-hub-br   --resource-group rg-networking   --location brazilsouth   --vhub hub-brazilsouth   --sku AZFW_Hub   --tier Premium
```

Com o Firewall no hub, todo tráfego entre spokes e para internet passa pela inspeção automaticamente, sem precisar de UDRs manuais em cada spoke.

## Quando não usar Virtual WAN

Virtual WAN custa mais que hub-and-spoke tradicional e tem menos flexibilidade de customização de roteamento. Para ambientes com menos de 20 spokes, equipe com experiência em UDRs e peerings, ou orçamento restrito, hub-and-spoke tradicional ainda é a escolha certa.

O ponto de inflexão onde Virtual WAN faz sentido: quando o overhead de gerenciar a topologia manualmente supera o custo adicional do serviço. Para a maioria das organizações, isso acontece entre 20-40 spokes ou quando a topologia multi-região começa a crescer.
