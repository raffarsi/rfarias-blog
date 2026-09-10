---
layout: ../../layouts/PostLayout.astro
title: "Azure NAT Gateway: saida de internet controlada e previsivel"
category: "Networking"
tag: "networking"
date: "19 Fev 2026"
readTime: "8 min"
description: "Por que NAT Gateway e melhor que IPs publicos em VMs para saida de internet, e como configurar."
---

Todo mundo foca em como o trafego entra no Azure. Poucos pensam em como sai. Ate aparecer o incidente em que uma API externa comeca a rejeitar conexoes porque os IPs de saida do ambiente ficam mudando, ou ate voce descobrir que suas VMs estao saindo para a internet por IPs que voce nao controla.

O NAT Gateway resolve a saida de forma previsivel.

## O problema com o comportamento padrao

Sem NAT Gateway, VMs sem IP publico usam o default outbound access do Azure, um IP efemero que pode mudar e que desde marco de 2026 nao e mais atribuido automaticamente em VNets novas. VMs com IP publico saem por esse IP diretamente, o que significa que a VM esta exposta na internet independente das regras de NSG de entrada.

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

A partir dai, todo trafego de saida da subnet usa o IP do NAT Gateway, previsivel e controlado. As VMs nao tem IP publico. Ninguem alcanca elas diretamente da internet.

## Multiplos IPs para SNAT em alta escala

Cada IP publico suporta ate 64 mil portas SNAT simultaneas. Para workloads com muitas conexoes:

```bash
az network nat gateway update   --name nat-spoke-ia   --resource-group rg-ia   --public-ip-addresses pip-nat-1 pip-nat-2
```

## NAT Gateway vs Azure Firewall para saida

Use NAT Gateway quando voce precisa de saida controlada com IP previsivel, sem inspecao de conteudo. Use Azure Firewall quando precisar filtrar por FQDN, inspecionar o trafego ou ter log detalhado do que sai.

Os dois coexistem: o NAT Gateway fornece o IP de saida, o Firewall inspeciona antes de sair. Em ambientes corporativos com compliance rigoroso, essa combinacao e o padrao.

Trafego de saida e o que mais surpreende quando voce começa a analisar o que o ambiente Azure realmente faz. Vale mapear como os recursos saem para internet antes de um incidente de seguranca ou um problema de conectividade com API externa te obrigar a fazer isso.
