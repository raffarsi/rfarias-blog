---
layout: ../../layouts/PostLayout.astro
title: "Azure DNS: delegação de zonas e gerenciamento de subdomínios corporativos"
category: "Networking"
tag: "networking"
date: "22 Nov 2025"
readTime: "10 min"
description: "Como estruturar zonas DNS no Azure para ambientes corporativos com múltiplos domínios, subdomínios delegados e integração com DNS on-premises via Private DNS Resolver."
---

DNS é aquele serviço que ninguém pensa até parar de funcionar. E no Azure, a maioria dos problemas de Private Endpoint que vejo não são de configuração de rede, são de DNS. O Private Endpoint existe, o IP privado está certo, e mesmo assim a aplicação não resolve o nome.

Entender como estruturar zonas DNS desde o início evita esses incidentes.

## Zonas públicas vs zonas privadas

**Zona pública** (`empresa.com.br`): resolve para IPs públicos, acessível da internet. Você gerencia pelo portal ou via Azure CLI como qualquer recurso.

**Zona privada** (`internal.empresa.com.br`): resolve para IPs privados, funciona apenas de dentro das VNets que você vincular a ela. Essa é a peça central dos Private Endpoints.

```bash
# Zona publica
az network dns zone create   --name empresa.com.br   --resource-group rg-dns

# Zona privada
az network private-dns zone create   --name internal.empresa.com.br   --resource-group rg-dns

# Vincular ao hub (obrigatorio para resolucao funcionar)
az network private-dns link vnet create   --name link-vnet-hub   --zone-name internal.empresa.com.br   --resource-group rg-dns   --virtual-network vnet-hub   --registration-enabled false
```

## Delegação de subdomínio: autonomia sem perder controle

Quando times diferentes gerenciam domínios diferentes, você não precisa dar acesso a zona principal para cada um. Delegue o subdomínio:

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

A partir daí, a equipe de IA gerencia tudo em `ia.empresa.com.br` de forma autônoma. Mudanças la não exigem intervenção no time de plataforma.

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

## Integração com DNS on-premises via Private DNS Resolver

Para que máquinas on-premises resolvam os domínios `privatelink.*`, configure forwarders condicionais no DNS interno apontando para o inbound endpoint do DNS Resolver:

```powershell
# No DNS on-premises
Add-DnsServerConditionalForwarderZone   -Name "privatelink.openai.azure.com"   -MasterServers 10.0.4.4  # IP do inbound endpoint do DNS Resolver
```

<div class="callout">
<strong>O erro mais comum:</strong> Vincular zonas Private DNS aos spokes em vez do hub. O DNS Resolver usa as zonas vinculadas a VNet onde ele está (o hub). Vincular apenas nos spokes não funciona.
</div>

DNS mal planejado é a causa mais frequente de "Private Endpoint configurado mas não funciona". Vale 1 hora de planejamento de zonas antes de começar a criar Private Endpoints.
