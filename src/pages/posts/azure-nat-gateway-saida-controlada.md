---
layout: ../../layouts/PostLayout.astro
title: "Azure NAT Gateway: saída de internet controlada e previsível"
category: "Networking"
tag: "networking"
date: "19 Fev 2026"
readTime: "8 min"
description: "Por que NAT Gateway é melhor que IPs públicos em VMs para saída de internet, e como configurar."
---

Todo mundo foca em como o tráfego entra no Azure. Poucos pensam em como sai. Até aparecer o incidente em que uma API externa começa a rejeitar conexões porque os IPs de saída do ambiente ficam mudando, ou até você descobrir que suas VMs estão saindo para a internet por IPs que você não controla.

O NAT Gateway resolve a saída de forma previsível.

## O problema com o comportamento padrão

Sem NAT Gateway, VMs sem IP público usam o default outbound access do Azure, um IP efêmero que pode mudar e que desde março de 2026 não é mais atribuído automaticamente em VNets novas. VMs com IP público saem por esse IP diretamente, o que significa que a VM está exposta na internet independente das regras de NSG de entrada.

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

resource subnet 'Microsoft.Network/virtualNetworks/subnets@2023-09-01' = {
  name: 'snet-app'
  parent: vnet
  properties: {
    addressPrefix: '10.1.1.0/24'
    natGateway: { id: natGateway.id }
  }
}
```

A partir daí, todo tráfego de saída da subnet usa o IP do NAT Gateway, previsível e controlado. As VMs não tem IP público. Ninguém alcança elas diretamente da internet.

## Múltiplos IPs para SNAT em alta escala

Cada IP público suporta até 64 mil portas SNAT simultâneas. Para workloads com muitas conexões:

```bash
az network nat gateway update   --name nat-spoke-ia   --resource-group rg-ia   --public-ip-addresses pip-nat-1 pip-nat-2
```

## NAT Gateway vs Azure Firewall para saída

Use NAT Gateway quando você precisa de saída controlada com IP previsível, sem inspeção de conteúdo. Use Azure Firewall quando precisar filtrar por FQDN, inspecionar o tráfego ou ter log detalhado do que sai.

Os dois coexistem: o NAT Gateway fornece o IP de saída, o Firewall inspeciona antes de sair. Em ambientes corporativos com compliance rigoroso, essa combinação é o padrão.

Tráfego de saída é o que mais surpreende quando você começa a analisar o que o ambiente Azure realmente faz. Vale mapear como os recursos saem para internet antes de um incidente de segurança ou um problema de conectividade com API externa te obrigar a fazer isso.
