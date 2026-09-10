---
layout: ../../layouts/PostLayout.astro
title: "ExpressRoute FastPath e Global Reach: quando o bypass do gateway faz diferença"
category: "Networking"
tag: "networking"
date: "01 Dez 2025"
readTime: "10 min"
description: "FastPath elimina o gateway do caminho de dados para alto throughput. Global Reach conecta circuitos ExpressRoute diferentes. Quando cada um se justifica e o impacto real na latência."
---

O ExpressRoute tem dois componentes de latência que frequentemente são ignorados: o gateway de rede virtual e o overhead de throughput. FastPath e Global Reach resolvem problemas distintos, entender qual você tem antes de pagar pelo upgrade é essencial.

## O problema que FastPath resolve

O fluxo padrão de tráfego ExpressRoute:

```
On-premises → Edge da Microsoft → VNet Gateway → VMs/recursos na VNet
```

O VNet Gateway é um gargalo de throughput e latência, especialmente para tráfego de alta frequência entre VMs e sistemas on-premises. O FastPath bypassa o gateway para tráfego de dados:

```
On-premises → Edge da Microsoft → VMs/recursos diretamente
             (gateway só para plano de controle/BGP)
```

## Quando FastPath faz diferença real

FastPath reduz latência e aumenta throughput. O impacto é mais significativo quando:

- Comunicação de alta frequência entre VMs Azure e sistemas on-premises (ex: bancos de dados distribuídos, replicação)
- Tráfego de alto throughput (>1 Gbps consistente)
- Aplicações sensíveis a latência (trading, tempo real)

Para tráfego ocasional, burst ou aplicações web, o impacto do FastPath é geralmente irrelevante.

## Habilitando FastPath

FastPath requer circuito ExpressRoute com bandwidth de 1 Gbps+ e gateway UltraPerformance ou ErGw3AZ:

```bash
# Atualizar gateway para suportar FastPath
az network vnet-gateway update \
  --name er-gateway-hub \
  --resource-group rg-networking \
  --gateway-type ExpressRoute \
  --sku ErGw3AZ  # UltraPerformance ou ErGw3AZ são obrigatórios

# Habilitar FastPath na conexão
az network vpn-connection update \
  --name connection-er-prod \
  --resource-group rg-networking \
  --express-route-gateway-bypass true
```

## Global Reach: conectando circuitos ExpressRoute

O Global Reach resolve um problema diferente: conectar dois ambientes on-premises através da rede backbone da Microsoft, sem tráfego passando pela internet pública.

Cenário típico: você tem um datacenter em São Paulo (circuito ER para Brazil South) e um escritório em Lisboa (circuito ER para West Europe). Sem Global Reach, o tráfego entre os dois vai pela internet. Com Global Reach, vai pelo backbone Microsoft.

```bash
# Habilitar Global Reach entre dois circuitos
az network express-route peering connection create \
  --name connection-sp-lisboa \
  --circuit-name er-circuit-saopaulo \
  --peering-name AzurePrivatePeering \
  --resource-group rg-networking \
  --peer-circuit $(az network express-route show \
    --name er-circuit-lisboa --resource-group rg-networking --query id -o tsv) \
  --address-prefix 192.168.100.0/29  # range /29 para o link Global Reach
```

## Megaport: conectando múltiplos provedores no mesmo ponto

Para ambientes com múltiplos circuitos ExpressRoute (alta disponibilidade ou múltiplos provedores), o Megaport oferece uma fabric de interconexão que simplifica o gerenciamento:

Em vez de contratar um circuito dedicado de São Paulo para o peering da Microsoft em cada provedor, você contrata uma porta no Megaport e cria Virtual Cross Connects para os peering points da Microsoft. Mais flexível e geralmente mais barato para múltiplos destinos.

A latência adicional do Megaport (fabric de interconexão) é tipicamente < 1ms, irrelevante para a maioria dos casos de uso.

## Monitorando a latência real

```kql
// Monitorar latência do ExpressRoute com Connection Monitor
NetworkMonitoring
| where TimeGenerated > ago(24h)
| where SubType == "ConnectivityDiagnosticsSnapshot"
| where SourceName contains "on-premises"
| summarize avg(AvgLatencyInMs), max(MaxLatencyInMs), min(MinLatencyInMs) 
    by SourceName, DestinationName, bin(TimeGenerated, 1h)
| order by TimeGenerated desc
```

<div class="callout">
<strong>FastPath e Private Endpoints:</strong> O FastPath não funciona para tráfego destinado a Private Endpoints, esse tráfego sempre passa pelo gateway. Se o seu caso de uso é principalmente acessar serviços PaaS (Storage, SQL, OpenAI) via Private Endpoints de on-premises, FastPath não vai ajudar.
</div>

## Quando investir em cada um

| Problema | Solução |
|----------|---------|
| Alta latência entre VMs Azure e sistemas on-premises | FastPath |
| Baixo throughput (< capacidade do circuito) | FastPath + gateway de maior SKU |
| Conectar dois datacenters on-premises via Microsoft backbone | Global Reach |
| Múltiplos provedores/circuitos, gerenciamento complexo | Megaport como fabric |

## Conclusão

FastPath e Global Reach são investimentos adicionais sobre o ExpressRoute base. Meça a latência atual com Connection Monitor antes de decidir, o problema pode estar no roteamento on-premises, não no gateway Azure.
