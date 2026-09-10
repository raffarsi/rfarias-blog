---
layout: ../../layouts/PostLayout.astro
title: "ExpressRoute FastPath e Global Reach: quando o bypass do gateway faz diferença"
category: "Networking"
tag: "networking"
date: "01 Dez 2025"
readTime: "10 min"
description: "FastPath elimina o gateway do caminho de dados para alto throughput. Global Reach conecta circuitos ExpressRoute diferentes. Quando cada um se justifica e o impacto real na latência."
---

ExpressRoute tem dois numeros que as pessoas olham: bandwidth e latencia. Mas ha um terceiro gargalo que raramente aparece na conversa inicial: o VNet Gateway no caminho de dados. Para trafego de alto throughput entre VMs on-premises e recursos Azure, o gateway pode ser o limitador real, nao o circuito.

FastPath bypassa esse problema.

## O que o FastPath faz (e o que nao faz)

O fluxo padrao:
```
On-premises -> Edge da Microsoft -> VNet Gateway -> VMs/recursos
```

Com FastPath:
```
On-premises -> Edge da Microsoft -> VMs diretamente
             (gateway so para plano de controle BGP)
```

O gateway sai do caminho de dados. Latencia reduz, throughput aumenta. Mas ha uma limitacao critica: **FastPath nao funciona para trafego destinado a Private Endpoints**. Esse trafego sempre passa pelo gateway, independente de FastPath estar habilitado. Se o seu caso de uso principal e acessar servicos PaaS (Storage, OpenAI, SQL) via Private Endpoints a partir do on-premises, FastPath nao vai ajudar.

## Habilitando FastPath

Requer circuito com bandwidth de 1 Gbps+ e gateway UltraPerformance ou ErGw3AZ:

```bash
az network vnet-gateway update   --name er-gateway-hub   --resource-group rg-networking   --gateway-type ExpressRoute   --sku ErGw3AZ

az network vpn-connection update   --name connection-er-prod   --resource-group rg-networking   --express-route-gateway-bypass true
```

## Global Reach: outro problema, outra solucao

FastPath e latencia entre on-premises e Azure. Global Reach e conectividade entre dois ambientes on-premises via backbone da Microsoft.

Se voce tem datacenter em Sao Paulo (circuito ER para Brazil South) e escritorio em Lisboa (circuito ER para West Europe), sem Global Reach o trafego entre eles vai pela internet. Com Global Reach, vai pelo backbone Microsoft.

```bash
az network express-route peering connection create   --name connection-sp-lisboa   --circuit-name er-circuit-saopaulo   --peering-name AzurePrivatePeering   --resource-group rg-networking   --peer-circuit $(az network express-route show     --name er-circuit-lisboa --resource-group rg-networking --query id -o tsv)   --address-prefix 192.168.100.0/29
```

## Megaport: simplificando multiplos circuitos

Para ambientes com varios circuitos ExpressRoute (HA ou multiplos provedores), o Megaport oferece uma fabric de interconexao. Em vez de contratar um circuito fisico dedicado para cada destino, voce tem uma porta no Megaport e cria Virtual Cross Connects para os peering points da Microsoft.

A latencia adicional do Megaport e tipicamente menos de 1ms, irrelevante para a maioria dos casos.

## Quando cada um resolve

| Problema | Solucao |
|----------|---------|
| Latencia alta entre VMs on-premises e VMs Azure | FastPath |
| Throughput limitado pelo gateway | FastPath + gateway maior SKU |
| Conectar dois datacenters via backbone Microsoft | Global Reach |
| Multiplos provedores ou circuitos, complexidade operacional | Megaport |

Meca o circuito atual com Connection Monitor por 30 dias antes de decidir qualquer upgrade. O problema pode estar no roteamento on-premises, nao no lado Azure.
