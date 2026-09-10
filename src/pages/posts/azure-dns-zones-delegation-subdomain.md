---
layout: ../../layouts/PostLayout.astro
title: "Azure DNS: delegação de zonas e gerenciamento de subdomínios corporativos"
category: "Networking"
tag: "networking"
date: "22 Nov 2025"
readTime: "10 min"
description: "Como estruturar zonas DNS no Azure para ambientes corporativos com múltiplos domínios, subdomínios delegados e integração com DNS on-premises via Private DNS Resolver."
---

DNS e aquele servico que ninguem pensa ate parar de funcionar. E no Azure, a maioria dos problemas de Private Endpoint que vejo nao sao de configuracao de rede, sao de DNS. O Private Endpoint existe, o IP privado esta certo, e mesmo assim a aplicacao nao resolve o nome.

Entender como estruturar zonas DNS desde o inicio evita esses incidentes.

## Zonas publicas vs zonas privadas

**Zona publica** (`empresa.com.br`): resolve para IPs publicos, acessivel da internet. Voce gerencia pelo portal ou via Azure CLI como qualquer recurso.

**Zona privada** (`internal.empresa.com.br`): resolve para IPs privados, funciona apenas de dentro das VNets que voce vincular a ela. Essa e a peca central dos Private Endpoints.

```bash
# Zona publica
az network dns zone create   --name empresa.com.br   --resource-group rg-dns

# Zona privada
az network private-dns zone create   --name internal.empresa.com.br   --resource-group rg-dns

# Vincular ao hub (obrigatorio para resolucao funcionar)
az network private-dns link vnet create   --name link-vnet-hub   --zone-name internal.empresa.com.br   --resource-group rg-dns   --virtual-network vnet-hub   --registration-enabled false
```

## Delegacao de subdominio: autonomia sem perder controle

Quando times diferentes gerenciam dominios diferentes, voce nao precisa dar acesso a zona principal para cada um. Delegue o subdominio:

```bicep
// Zona principal, gerenciada pelo time de plataforma
resource zonaPrincipal 'Microsoft.Network/dnsZones@2018-05-01' existing = {
  name: 'empresa.com.br'
}

// Zona filha, gerenciada pela equipe de IA
resource zonaIA 'Microsoft.Network/dnsZones@2018-05-01' = {
  name: 'ia.empresa.com.br'
  location: 'global'
}

// Delegacao: registro NS na zona principal
resource delegacaoIA 'Microsoft.Network/dnsZones/NS@2018-05-01' = {
  name: 'ia'
  parent: zonaPrincipal
  properties: {
    TTL: 3600
    NSRecords: [for ns in zonaIA.properties.nameServers: { nsdname: ns }]
  }
}
```

A partir dai, a equipe de IA gerencia tudo em `ia.empresa.com.br` de forma autonoma. Mudancas la nao exigem intervencao no time de plataforma.

## Estrutura que funciona para ambientes Azure corporativos

```
empresa.com.br                     (publica, plataforma)
  www -> IP do Front Door
  api -> IP do API Management

  ia.empresa.com.br                (delegado, equipe IA)
    chat -> App Service de IA

internal.empresa.com.br            (privada, plataforma)
  sql01 -> 10.0.3.4

privatelink.openai.azure.com       (privada, criada pelo Private Endpoint)
  oai-prod -> 10.0.1.4
```

## Integracao com DNS on-premises via Private DNS Resolver

Para que maquinas on-premises resolvam os dominios `privatelink.*`, configure forwarders condicionais no DNS interno apontando para o inbound endpoint do DNS Resolver:

```powershell
# No DNS on-premises
Add-DnsServerConditionalForwarderZone   -Name "privatelink.openai.azure.com"   -MasterServers 10.0.4.4  # IP do inbound endpoint do DNS Resolver
```

<div class="callout">
<strong>O erro mais comum:</strong> Vincular zonas Private DNS aos spokes em vez do hub. O DNS Resolver usa as zonas vinculadas a VNet onde ele esta (o hub). Vincular apenas nos spokes nao funciona.
</div>

DNS mal planejado e a causa mais frequente de "Private Endpoint configurado mas nao funciona". Vale 1 hora de planejamento de zonas antes de comecar a criar Private Endpoints.
