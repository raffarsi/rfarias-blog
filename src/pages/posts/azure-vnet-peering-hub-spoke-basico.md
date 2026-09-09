---
layout: ../../layouts/PostLayout.astro
title: "VNet Peering e topologia hub-and-spoke: conceitos fundamentais"
category: "Azure"
tag: "azure"
date: "16 Set 2025"
readTime: "9 min"
description: "Como conectar VNets com peering, quando usar hub-and-spoke e as limitações que você só descobre em produção."
---

VNet Peering é o mecanismo para conectar duas VNets Azure de forma que os recursos em cada uma se comuniquem usando IPs privados, sem passar pela internet pública. O tráfego trafega pela rede backbone da Microsoft — baixa latência e alta confiabilidade.

## Como funciona o peering

O peering é não-transitivo por padrão. Se a VNet A tem peering com B, e B tem peering com C, A não consegue alcançar C automaticamente. Você precisa de peering direto entre A e C, ou configurar um hub intermediário.

```bash
# Criar peering bidirecional entre Hub e Spoke
az network vnet peering create \
  --name hub-to-spoke-ia \
  --resource-group rg-networking \
  --vnet-name vnet-hub \
  --remote-vnet vnet-spoke-ia \
  --allow-vnet-access \
  --allow-forwarded-traffic \
  --allow-gateway-transit  # hub expõe o gateway para o spoke

az network vnet peering create \
  --name spoke-ia-to-hub \
  --resource-group rg-ia \
  --vnet-name vnet-spoke-ia \
  --remote-vnet vnet-hub \
  --allow-vnet-access \
  --allow-forwarded-traffic \
  --use-remote-gateways  # spoke usa o gateway do hub
```

## Topologia hub-and-spoke

O padrão hub-and-spoke resolve a limitação de não-transitividade:

```
on-premises ─── VPN/ER Gateway ─── VNet HUB ─── Azure Firewall
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
              Spoke Web           Spoke App           Spoke IA
           (10.1.0.0/16)      (10.2.0.0/16)      (10.3.0.0/16)
```

O hub centraliza recursos compartilhados. Os spokes se conectam ao hub via peering. O tráfego entre spokes passa pelo hub — via Azure Firewall para inspeção e controle.

## Configurando UDR para rotear tráfego pelo Firewall

Por padrão, tráfego entre spokes vai direto via backbone, sem passar pelo Firewall do hub. Para forçar a inspeção:

```bicep
resource routeTable 'Microsoft.Network/routeTables@2023-09-01' = {
  name: 'rt-spoke-ia'
  location: location
  properties: {
    routes: [
      {
        name: 'route-to-hub-firewall'
        properties: {
          addressPrefix: '0.0.0.0/0'
          nextHopType: 'VirtualAppliance'
          nextHopIpAddress: '10.0.0.4'  // IP privado do Azure Firewall no hub
        }
      }
    ]
  }
}
```

## Peering global: entre regiões diferentes

O VNet Peering funciona entre regiões (Global VNet Peering). O tráfego usa a rede backbone da Microsoft, mas há considerações:

- **Latência:** maior que peering na mesma região
- **Custo:** tráfego cross-region tem custo de transferência de dados
- **Gateway transit:** não suportado em peering global (limitação)

<div class="callout">
<strong>Limitação importante:</strong> VNets com ranges de IP sobrepostos não podem ter peering. Planeje seus ranges de IP antes de criar as VNets — mudar depois é destrutivo.
</div>

## Conclusão

VNet Peering com topologia hub-and-spoke é a base de qualquer arquitetura Azure corporativa bem desenhada. Centralizar recursos compartilhados no hub (Firewall, VPN Gateway, DNS Resolver) e conectar spokes de workload via peering oferece escala, controle e visibilidade que VNets isoladas não conseguem.
