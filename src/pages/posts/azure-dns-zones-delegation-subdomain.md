---
layout: ../../layouts/PostLayout.astro
title: "Azure DNS: delegação de zonas e gerenciamento de subdomínios corporativos"
category: "Networking"
tag: "networking"
date: "22 Nov 2025"
readTime: "10 min"
description: "Como estruturar zonas DNS no Azure para ambientes corporativos com múltiplos domínios, subdomínios delegados e integração com DNS on-premises via Private DNS Resolver."
---

Gerenciar DNS no Azure para ambientes corporativos vai além de criar registros A. Você precisa estruturar zonas, delegar subdomínios para equipes específicas e integrar com DNS on-premises — tudo isso de forma auditável e automatizável via IaC.

## Zonas DNS públicas vs privadas

**Zona pública** (`empresa.com.br`): resolve para IPs públicos, acessível da internet.

**Zona privada** (`internal.empresa.com.br`): resolve para IPs privados, associada a VNets — só funciona de dentro das VNets vinculadas.

```bash
# Criar zona pública
az network dns zone create \
  --name empresa.com.br \
  --resource-group rg-dns

# Criar zona privada
az network private-dns zone create \
  --name internal.empresa.com.br \
  --resource-group rg-dns

# Vincular zona privada à VNet
az network private-dns link vnet create \
  --name link-vnet-hub \
  --zone-name internal.empresa.com.br \
  --resource-group rg-dns \
  --virtual-network vnet-hub \
  --registration-enabled false
```

## Delegação de subdomínios

Quando diferentes equipes gerenciam subdomínios diferentes — por exemplo, a equipe de IA gerencia `ia.empresa.com.br` — você delega o subdomínio criando registros NS:

```bicep
// Zona principal — gerenciada pelo time de plataforma
resource zonaPrincipal 'Microsoft.Network/dnsZones@2018-05-01' existing = {
  name: 'empresa.com.br'
}

// Zona do subdomínio — gerenciada pela equipe de IA
resource zonaIA 'Microsoft.Network/dnsZones@2018-05-01' = {
  name: 'ia.empresa.com.br'
  location: 'global'
}

// Delegação: registro NS na zona principal apontando para os nameservers da zona filha
resource delegacaoIA 'Microsoft.Network/dnsZones/NS@2018-05-01' = {
  name: 'ia'
  parent: zonaPrincipal
  properties: {
    TTL: 3600
    NSRecords: [for ns in zonaIA.properties.nameServers: { nsdname: ns }]
  }
}
```

Depois da delegação, a equipe de IA gerencia tudo em `ia.empresa.com.br` de forma autônoma — sem tocar na zona principal.

## Estrutura recomendada para ambientes Azure

```
empresa.com.br                    (zona pública — plataforma)
├── www → IP do Front Door
├── api → IP do API Management
│
├── ia.empresa.com.br             (delegado — equipe IA)
│   ├── chat → App Service de IA
│   └── api → Azure API Management IA
│
internal.empresa.com.br           (zona privada — plataforma)
├── sql01 → 10.0.3.4
├── storage → 10.0.3.5
│
privatelink.openai.azure.com      (zona privada — criada pelo Private Endpoint)
├── oai-prod → 10.0.1.4
│
privatelink.search.windows.net    (zona privada — criada pelo Private Endpoint)
└── search-prod → 10.0.1.5
```

## Integração com DNS on-premises via Private DNS Resolver

Para que máquinas on-premises resolvam `internal.empresa.com.br` e os domínios `privatelink.*`:

```bash
# Criar Inbound Endpoint — recebe queries de on-premises
az dns-resolver inbound-endpoint create \
  --dns-resolver-name resolver-hub \
  --resource-group rg-dns \
  --endpoint-name inbound \
  --ip-configurations '[{"privateIpAddress":"10.0.4.4","privateIpAllocationMethod":"Static","subnet":{"id":"'$SUBNET_ID'"}}]'

# No DNS on-premises: criar forwarder condicional
# Para *.internal.empresa.com.br → 10.0.4.4
# Para *.privatelink.openai.azure.com → 10.0.4.4
# Para *.privatelink.search.windows.net → 10.0.4.4
```

<div class="callout">
<strong>Automatize a criação de zonas Private Link:</strong> Toda vez que você cria um Private Endpoint, precisa criar (ou reusar) a zona Private DNS correspondente e vinculá-la às VNets. Azure Policy com efeito DeployIfNotExists pode fazer isso automaticamente — a Microsoft disponibiliza políticas built-in para cada tipo de recurso PaaS.
</div>

## Conclusão

Uma estrutura de DNS bem planejada — zonas públicas para exposição externa, privadas para resolução interna, delegações para autonomia das equipes e forwarders para integração on-premises — é o que permite que Private Endpoints funcionem de forma consistente em toda a topologia de rede. DNS mal planejado é a causa mais frequente de "Private Endpoint configurado mas não funciona".
