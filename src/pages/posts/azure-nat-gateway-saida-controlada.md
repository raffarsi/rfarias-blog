---
layout: ../../layouts/PostLayout.astro
title: "Azure NAT Gateway: saida de internet controlada e previsivel"
category: "Networking"
tag: "networking"
date: "19 Fev 2026"
readTime: "8 min"
description: "Por que NAT Gateway e melhor que IPs publicos em VMs para saida de internet, e como configurar."
---

O Azure NAT Gateway resolve um problema simples mas com implicacoes importantes: como garantir que o trafego de saida para internet de uma VNet use IPs publicos previsíveis, sem precisar atribuir IP publico a cada VM.

## O problema sem NAT Gateway

Sem NAT Gateway, VMs sem IP publico usam o default outbound access do Azure -- um IP efemero que pode mudar e que desde marco de 2026 nao e mais atribuido por padrao em VNets novas. VMs com IP publico expoe esse IP diretamente -- risco de seguranca.

## Criando o NAT Gateway

```bicep
resource publicIpNat 'Microsoft.Network/publicIPAddresses@2023-09-01' = {
  name: 'pip-nat-spoke-ia'
  location: location
  sku: { name: 'Standard' }
  properties: { publicIPAllocationMethod: 'Static' }
}

resource natGateway 'Microsoft.Network/natGateways@2023-09-01' = {
  name: 'nat-spoke-ia'
  location: location
  sku: { name: 'Standard' }
  properties: {
    idleTimeoutInMinutes: 4
    publicIpAddresses: [{ id: publicIpNat.id }]
  }
}

// Associar a subnet -- todo trafego de saida usa o NAT Gateway
resource subnet 'Microsoft.Network/virtualNetworks/subnets@2023-09-01' = {
  name: 'snet-app'
  parent: vnet
  properties: {
    addressPrefix: '10.1.1.0/24'
    natGateway: { id: natGateway.id }
  }
}
```

## Por que NAT Gateway e melhor que IPs publicos nas VMs

| | IP Publico na VM | NAT Gateway |
|---|---|---|
| IP da VM exposto | Sim | Nao |
| IP de saida previsivel | Nao (se VM recriar) | Sim (do NAT GW) |
| Compartilhado entre VMs | Nao | Sim |
| Custo | Por VM | Por NAT GW |
| Risco de seguranca | Alto | Baixo |

## Multiplos IPs publicos para SNAT

Para workloads com muitas conexoes simultaneas (cada IP suporta ~64K portas SNAT):

```bash
# Adicionar segundo IP ao NAT Gateway
az network nat gateway update \
  --name nat-spoke-ia \
  --resource-group rg-ia \
  --public-ip-addresses pip-nat-1 pip-nat-2
```

## NAT Gateway vs Azure Firewall para saida

Use NAT Gateway quando precisar apenas de saida controlada com IP previsivel.
Use Azure Firewall quando precisar de inspeção de trafego, filtragem por FQDN ou logging detalhado.

Os dois podem coexistir: NAT Gateway fornece o IP de saida, Azure Firewall inspeciona o trafego antes dele sair.

## Conclusao

O NAT Gateway e a forma correta de gerenciar saida de internet em VNets Azure. IP previsivel, sem expor as VMs, com escala automatica para SNAT. Para ambientes que precisam tambem de inspeção de saida, combine com Azure Firewall.
