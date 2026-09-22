---
layout: ../../layouts/PostLayout.astro
title: "Azure Private DNS Resolver: resolução de nomes centralizada no hub"
category: "Networking"
tag: "networking"
date: "18 Dez 2025"
readTime: "9 min"
description: "Funciona no primeiro spoke. No segundo já não resolve, e no on-premises também não. Centralizar o DNS no hub é o que faz a topologia escalar."
---

Você criou o Private Endpoint, configurou a zona Private DNS, vinculou a VNet. A VM no spoke resolve o nome certo e alcanca o recurso. Até ai tudo bem.

Ai você adiciona um segundo spoke, e ele não resolve. Ai o servidor on-premises tenta acessar e também não resolve. Cada novo elemento na topologia exige configuração manual de DNS. Escalar assim não funciona.

O Private DNS Resolver centraliza tudo isso.

## O problema sem o Resolver

Sem um resolvedor centralizado, cada spoke e cada servidor on-premises precisa de configuração individual para resolver `oai-producao.privatelink.openai.azure.com`. Em ambientes com dezenas de spokes e vários serviços PaaS, isso e inviável de gerenciar.

## Arquitetura centralizada no hub

```
On-premises
  -> forwarder condicional para 10.0.4.4
Azure Private DNS Resolver (hub)
  Inbound Endpoint: 10.0.4.4
  Outbound Endpoint: 10.0.4.5
    Private DNS Zones vinculadas ao hub
      privatelink.openai.azure.com -> 10.0.1.4
      privatelink.search.windows.net -> 10.0.1.5
```

```bicep
resource dnsResolver 'Microsoft.Network/dnsResolvers@2022-07-01' = {
  name: 'resolver-hub'
  location: location
  properties: {
    virtualNetwork: { id: vnetHub.id }
  }
}

resource inboundEndpoint 'Microsoft.Network/dnsResolvers/inboundEndpoints@2022-07-01' = {
  name: 'inbound'
  parent: dnsResolver
  location: location
  properties: {
    ipConfigurations: [{
      privateIpAllocationMethod: 'Static'
      privateIpAddress: '10.0.4.4'
      subnet: { id: subnetDnsInbound.id }
    }]
  }
}
```

## Configurando os spokes para usar o Resolver

Cada spoke aponta para o inbound endpoint:

```bicep
resource vnetSpoke 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  properties: {
    dhcpOptions: {
      dnsServers: ['10.0.4.4']
    }
    // resto da config
  }
}
```

Pronto. Qualquer recurso em qualquer spoke que precisar resolver um nome de Private Endpoint vai consultar o resolver no hub, que tem as zonas vinculadas e devolve o IP privado correto.

## Forwarder condicional para on-premises

Para domains internos que precisam resolver para o DNS on-premises:

```bicep
resource ruleOnPrem 'Microsoft.Network/dnsForwardingRulesets/forwardingRules@2022-07-01' = {
  name: 'rule-empresa-internal'
  parent: forwardingRuleset
  properties: {
    domainName: 'empresa.internal.'
    targetDnsServers: [{ ipAddress: '192.168.1.10', port: 53 }]
    forwardingRuleState: 'Enabled'
  }
}
```

## Configurando on-premises para resolver domínios Azure

```powershell
Add-DnsServerConditionalForwarderZone `
  -Name "privatelink.openai.azure.com" `
  -MasterServers 10.0.4.4

Add-DnsServerConditionalForwarderZone `
  -Name "privatelink.search.windows.net" `
  -MasterServers 10.0.4.4
```

Novo Private Endpoint adicionado? A zona já está configurada no hub, o resolver já está ativo. Nenhuma configuração adicional nos spokes ou no on-premises. Esse e o ponto.
