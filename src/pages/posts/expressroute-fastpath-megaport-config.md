---
layout: ../../layouts/PostLayout.astro
title: "ExpressRoute FastPath e Global Reach: quando o bypass do gateway faz diferença"
category: "Networking"
tag: "networking"
date: "01 Dez 2025"
readTime: "10 min"
description: "FastPath elimina o gateway do caminho de dados para alto throughput. Global Reach conecta circuitos ExpressRoute diferentes. Quando cada um se justifica e o impacto real na latência."
---

ExpressRoute tem dois números que as pessoas olham: bandwidth e latência. Mas há um terceiro gargalo que raramente aparece na conversa inicial: o VNet Gateway no caminho de dados. Para tráfego de alto throughput entre VMs on-premises e recursos Azure, o gateway pode ser o limitador real, não o circuito.

FastPath bypassa esse problema.

## O que o FastPath faz (e o que não faz)

O fluxo padrão:
```
On-premises -> Edge da Microsoft -> VNet Gateway -> VMs/recursos
```

Com FastPath:
```
On-premises -> Edge da Microsoft -> VMs diretamente
             (gateway so para plano de controle BGP)
```

O gateway sai do caminho de dados. Latência reduz, throughput aumenta. Mas há uma limitação crítica: **FastPath não funciona para tráfego destinado a Private Endpoints**. Esse tráfego sempre passa pelo gateway, independente de FastPath estar habilitado. Se o seu caso de uso principal e acessar serviços PaaS (Storage, OpenAI, SQL) via Private Endpoints a partir do on-premises, FastPath não vai ajudar.

## Habilitando FastPath

Requer circuito com bandwidth de 1 Gbps+ e gateway UltraPerformance ou ErGw3AZ:

```bash
az network vnet-gateway update   --name er-gateway-hub   --resource-group rg-networking   --gateway-type ExpressRoute   --sku ErGw3AZ

az network vpn-connection update   --name connection-er-prod   --resource-group rg-networking   --express-route-gateway-bypass true
```

## Global Reach: outro problema, outra solução

FastPath e latência entre on-premises e Azure. Global Reach e conectividade entre dois ambientes on-premises via backbone da Microsoft.

Se você tem datacenter em São Paulo (circuito ER para Brazil South) e escritório em Lisboa (circuito ER para West Europe), sem Global Reach o tráfego entre eles vai pela internet. Com Global Reach, vai pelo backbone Microsoft.

```bash
az network express-route peering connection create   --name connection-sp-lisboa   --circuit-name er-circuit-saopaulo   --peering-name AzurePrivatePeering   --resource-group rg-networking   --peer-circuit $(az network express-route show     --name er-circuit-lisboa --resource-group rg-networking --query id -o tsv)   --address-prefix 192.168.100.0/29
```

## Megaport: simplificando múltiplos circuitos

Para ambientes com vários circuitos ExpressRoute (HA ou múltiplos provedores), o Megaport oferece uma fabric de interconexão. Em vez de contratar um circuito físico dedicado para cada destino, você tem uma porta no Megaport e cria Virtual Cross Connects para os peering points da Microsoft.

A latência adicional do Megaport e tipicamente menos de 1ms, irrelevante para a maioria dos casos.

## Quando cada um resolve

| Problema | Solução |
|----------|---------|
| Latência alta entre VMs on-premises e VMs Azure | FastPath |
| Throughput limitado pelo gateway | FastPath + gateway maior SKU |
| Conectar dois datacenters via backbone Microsoft | Global Reach |
| Múltiplos provedores ou circuitos, complexidade operacional | Megaport |

Meca o circuito atual com Connection Monitor por 30 dias antes de decidir qualquer upgrade. O problema pode estar no roteamento on-premises, não no lado Azure.
