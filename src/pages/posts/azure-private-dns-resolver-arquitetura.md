---
layout: ../../layouts/PostLayout.astro
title: "Azure Private DNS Resolver: resolucao de nomes centralizada no hub"
category: "Networking"
tag: "networking"
date: "18 Dez 2025"
readTime: "9 min"
description: "Como configurar o Private DNS Resolver para centralizar a resolucao de nomes em arquiteturas hub-and-spoke."
---

O Azure Private DNS Resolver resolve um problema que parece simples mas causa incidentes em producao: como garantir que recursos em qualquer spoke e sistemas on-premises consigam resolver nomes de Private Endpoints corretamente.

## O problema sem o DNS Resolver

Sem um resolvedor centralizado, cada spoke e cada servidor on-premises precisaria de configuracao individual. Em ambientes com dezenas de spokes e servicos PaaS, isso e inviavel.

## Arquitetura

```
On-premises
  -> forward condicional para 10.0.4.4
Azure Private DNS Resolver (hub)
  Inbound Endpoint: 10.0.4.4 (recebe queries)
  Outbound Endpoint: 10.0.4.5 (encaminha para on-premises)
     resolucao automatica
Private DNS Zones (vinculadas ao hub)
  privatelink.openai.azure.com -> 10.0.1.4
  privatelink.search.windows.net -> 10.0.1.5
```

## Criando o DNS Resolver

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

resource outboundEndpoint 'Microsoft.Network/dnsResolvers/outboundEndpoints@2022-07-01' = {
  name: 'outbound'
  parent: dnsResolver
  location: location
  properties: {
    subnet: { id: subnetDnsOutbound.id }
  }
}
```

## Forwarding Ruleset

```bicep
resource forwardingRuleset 'Microsoft.Network/dnsForwardingRulesets@2022-07-01' = {
  name: 'frs-hub'
  location: location
  properties: {
    dnsResolverOutboundEndpoints: [{ id: outboundEndpoint.id }]
  }
}

// Encaminhar dominios on-premises para DNS interno
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

## Configurando os spokes

```bicep
resource vnetSpoke 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  properties: {
    dhcpOptions: {
      dnsServers: ['10.0.4.4']  // IP do inbound endpoint
    }
  }
}
```

## Configurando on-premises (Windows DNS)

```powershell
Add-DnsServerConditionalForwarderZone `
  -Name "privatelink.openai.azure.com" `
  -MasterServers 10.0.4.4

Add-DnsServerConditionalForwarderZone `
  -Name "privatelink.search.windows.net" `
  -MasterServers 10.0.4.4
```

## Testando

```bash
# De uma VM no spoke
nslookup oai-producao.openai.azure.com 10.0.4.4
# Deve retornar IP privado (10.x.x.x)
```

<div class="callout">
<strong>Ordem de vinculacao de zonas:</strong> As Private DNS Zones devem ser vinculadas ao hub -- nao aos spokes individualmente. O DNS Resolver resolve usando as zonas vinculadas a VNet onde ele esta (hub). Vincular zonas diretamente nos spokes e o erro mais comum nessa arquitetura.
</div>

## Conclusao

O Private DNS Resolver centraliza toda a logica de resolucao em um unico ponto. Spokes e on-premises simplesmente apontam para o inbound endpoint e tudo funciona automaticamente, sem configuracao manual por spoke ou por Private Endpoint.
