---
layout: ../../layouts/PostLayout.astro
title: "VNet Peering e topologia hub-and-spoke: conceitos fundamentais"
category: "Networking"
tag: "networking"
date: "16 Set 2025"
readTime: "9 min"
description: "Como conectar VNets com peering, quando usar hub-and-spoke e as limitações que você só descobre em produção."
---

Hub-and-spoke e uma das topologias mais faladas em Azure. Mas a maioria das implementacoes que vejo tem o mesmo problema: peering configurado sem entender a nao-transitividade, e ai surgem os incidentes de "por que o spoke A nao alcanca o spoke B?".

## Como o peering funciona de verdade

O peering conecta duas VNets pelo backbone da Microsoft. Sem internet publica, com baixa latencia e alta confiabilidade. O que importa entender: **o peering nao e transitivo por padrao**.

Se A tem peering com B, e B tem peering com C, A nao alcanca C automaticamente. Voce precisa de peering direto entre A e C, ou de um hub intermediario com roteamento configurado.

```bash
# Peering bidirecional entre Hub e Spoke
az network vnet peering create   --name hub-to-spoke-ia   --resource-group rg-networking   --vnet-name vnet-hub   --remote-vnet vnet-spoke-ia   --allow-vnet-access   --allow-forwarded-traffic   --allow-gateway-transit

az network vnet peering create   --name spoke-ia-to-hub   --resource-group rg-ia   --vnet-name vnet-spoke-ia   --remote-vnet vnet-hub   --allow-vnet-access   --allow-forwarded-traffic   --use-remote-gateways
```

## Por que hub-and-spoke resolve a nao-transitividade

O hub centraliza recursos compartilhados: Azure Firewall, VPN/ER Gateway, DNS Resolver. Os spokes se conectam ao hub via peering. Trafego entre spokes passa pelo hub, onde o Firewall pode inspecionar e controlar.

```
on-premises -- VPN/ER Gateway -- VNet HUB -- Azure Firewall
                                     |
              +----------------------+---------------------+
              |                      |                     |
        Spoke Web              Spoke App              Spoke IA
     (10.1.0.0/16)         (10.2.0.0/16)         (10.3.0.0/16)
```

## Forcando o trafego pelo Firewall do hub

Por padrao, trafego entre spokes vai direto via backbone, sem passar pelo Firewall. Para forccar inspeção, voce precisa de UDR em cada spoke:

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

Sem essa UDR, o trafego entre spokes nunca passa pelo Firewall, independente de como voce configurou as regras dele.

## Peering global: o que muda entre regioes

O peering funciona entre regioes diferentes. O trafego usa o backbone da Microsoft, mas ha consideracoes importantes: latencia maior que peering na mesma regiao, custo de transferencia de dados cross-region, e gateway transit nao suportado em peering global.

<div class="callout">
<strong>Limitacao critica:</strong> VNets com ranges de IP sobrepostos nao podem ter peering. Se voce esta planejando a topologia agora, defina os ranges com cuidado. Mudar o range de uma VNet em producao e destrutivo.
</div>

Hub-and-spoke com peering bem configurado e a base de qualquer arquitetura Azure corporativa. O detalhe que mais causa problema na pratica e esse: peering e comunicacao, nao roteamento. Voce precisa das UDRs para controlar para onde o trafego vai depois que chega ao hub.
