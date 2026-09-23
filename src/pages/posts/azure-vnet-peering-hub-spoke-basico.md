---
layout: ../../layouts/PostLayout.astro
title: "VNet Peering e topologia hub-and-spoke: conceitos fundamentais"
category: "Networking"
tag: "networking"
date: "16 Set 2025"
readTime: "9 min"
description: "Como conectar VNets com peering, quando usar hub-and-spoke e as limitações que você só descobre em produção."
---

Hub-and-spoke é uma das topologias mais faladas em Azure. Mas a maioria das implementações que vejo tem o mesmo problema: peering configurado sem entender a não-transitividade, e ai surgem os incidentes de "por que o spoke A não alcança o spoke B?".

## Como o peering funciona de verdade

O peering conecta duas VNets pelo backbone da Microsoft. Sem internet pública, com baixa latência e alta confiabilidade. O que importa entender: **o peering não é transitivo por padrão**.

Se A tem peering com B, e B tem peering com C, A não alcança C automaticamente. Você precisa de peering direto entre A e C, ou de um hub intermediário com roteamento configurado.

```bash
# Peering bidirecional entre Hub e Spoke
az network vnet peering create   --name hub-to-spoke-ia   --resource-group rg-networking   --vnet-name vnet-hub   --remote-vnet vnet-spoke-ia   --allow-vnet-access   --allow-forwarded-traffic   --allow-gateway-transit

az network vnet peering create   --name spoke-ia-to-hub   --resource-group rg-ia   --vnet-name vnet-spoke-ia   --remote-vnet vnet-hub   --allow-vnet-access   --allow-forwarded-traffic   --use-remote-gateways
```

## Por que hub-and-spoke resolve a não-transitividade

O hub centraliza recursos compartilhados: Azure Firewall, VPN/ER Gateway, DNS Resolver. Os spokes se conectam ao hub via peering. Tráfego entre spokes passa pelo hub, onde o Firewall pode inspecionar e controlar.

```
on-premises -- VPN/ER Gateway -- VNet HUB -- Azure Firewall
                                     |
              +----------------------+---------------------+
              |                      |                     |
        Spoke Web              Spoke App              Spoke IA
     (10.1.0.0/16)         (10.2.0.0/16)         (10.3.0.0/16)
```

## Forçando o tráfego pelo Firewall do hub

Por padrão, tráfego entre spokes vai direto via backbone, sem passar pelo Firewall. Para forçar inspeção, você precisa de UDR em cada spoke:

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

Sem essa UDR, o tráfego entre spokes nunca passa pelo Firewall, independente de como você configurou as regras dele.

## Peering global: o que muda entre regiões

O peering funciona entre regiões diferentes. O tráfego usa o backbone da Microsoft, mas há considerações importantes: latência maior que peering na mesma região, custo de transferência de dados cross-region, e gateway transit não suportado em peering global.

<div class="callout">
<strong>Limitação crítica:</strong> VNets com ranges de IP sobrepostos não podem ter peering. Se você está planejando a topologia agora, defina os ranges com cuidado. Mudar o range de uma VNet em produção é destrutivo.
</div>

Hub-and-spoke com peering bem configurado é a base de qualquer arquitetura Azure corporativa. O detalhe que mais causa problema na prática é esse: peering é comunicação, não roteamento. Você precisa das UDRs para controlar para onde o tráfego vai depois que chega ao hub.
