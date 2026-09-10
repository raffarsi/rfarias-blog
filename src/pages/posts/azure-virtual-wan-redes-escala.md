---
layout: ../../layouts/PostLayout.astro
title: "Azure Virtual WAN: quando a topologia hub-and-spoke tradicional nao escala"
category: "Networking"
tag: "networking"
date: "26 Fev 2026"
readTime: "9 min"
description: "O que e o Virtual WAN e quando a topologia hub-and-spoke tradicional atinge seus limites."
---

Hub-and-spoke tradicional funciona bem ate uns 20 spokes. A partir dai, gerenciar peerings, UDRs e conectividade entre regioes começa a virar trabalho operacional de tempo integral. Voce passa mais tempo mantendo a topologia do que construindo coisas sobre ela.

O Virtual WAN nao e so "hub-and-spoke na nuvem". E uma mudanca de modelo operacional.

## O que muda na pratica

No hub-and-spoke tradicional, voce gerencia manualmente: peerings entre hub e cada spoke, UDRs em cada subnet de cada spoke, gateways VPN/ER separados, conectividade entre regioes via peering global.

No Virtual WAN, voce cria a conexao entre o spoke e o hub. O resto e gerenciado automaticamente: roteamento, propagacao de rotas, conectividade entre hubs em regioes diferentes.

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

Nao e necessario peering manual. A conexao ao hub e gerenciada pelo Virtual WAN, incluindo roteamento automatico para outros spokes e para conexoes on-premises do mesmo hub.

## Secured Hub: Azure Firewall integrado

```bash
az network firewall create   --name fw-hub-br   --resource-group rg-networking   --location brazilsouth   --vhub hub-brazilsouth   --sku AZFW_Hub   --tier Premium
```

Com o Firewall no hub, todo trafego entre spokes e para internet passa pela inspeção automaticamente, sem precisar de UDRs manuais em cada spoke.

## Quando nao usar Virtual WAN

Virtual WAN custa mais que hub-and-spoke tradicional e tem menos flexibilidade de customizacao de roteamento. Para ambientes com menos de 20 spokes, equipe com experiencia em UDRs e peerings, ou orcamento restrito, hub-and-spoke tradicional ainda e a escolha certa.

O ponto de inflexao onde Virtual WAN faz sentido: quando o overhead de gerenciar a topologia manualmente supera o custo adicional do servico. Para a maioria das organizacoes, isso acontece entre 20-40 spokes ou quando a topologia multi-regiao começa a crescer.
