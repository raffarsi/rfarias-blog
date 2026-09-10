---
layout: ../../layouts/PostLayout.astro
title: "VNet Integration no App Service: conectando aplicações a recursos privados sem expor endpoints"
category: "Networking"
tag: "networking"
date: "17 Nov 2025"
readTime: "10 min"
description: "Regional VNet Integration permite que App Services acessem recursos dentro de uma VNet sem IP público. Configuração, limitações e a diferença para Private Endpoints."
---

O App Service é um serviço PaaS que roda fora da sua VNet por padrão. Para que ele acesse recursos privados. SQL Database com Private Endpoint, Azure OpenAI em rede privada, Storage sem acesso público, você precisa de VNet Integration.

Existem dois mecanismos distintos que frequentemente causam confusão:

- **VNet Integration:** permite que o App Service faça chamadas **saindo** para recursos dentro da VNet
- **Private Endpoint para App Service:** permite que chamadas **entrando** no App Service cheguem por endereço privado

Este artigo cobre o primeiro caso. VNet Integration de saída.

## Regional VNet Integration

A integração regional é o padrão atual. O App Service recebe uma NIC virtual em uma subnet dedicada da sua VNet e pode chamar qualquer recurso acessível a partir dela:

```bash
# Criar subnet dedicada para VNet Integration
# Mínimo /28, recomendado /26 para elasticidade
az network vnet subnet create \
  --name snet-appservice-integration \
  --vnet-name vnet-spoke \
  --resource-group rg-app \
  --address-prefix 10.1.5.0/26 \
  --delegations Microsoft.Web/serverFarms  # delegação obrigatória

# Habilitar VNet Integration no App Service
az webapp vnet-integration add \
  --name meu-app \
  --resource-group rg-app \
  --vnet vnet-spoke \
  --subnet snet-appservice-integration
```

## Roteando todo o tráfego de saída pela VNet

Por padrão, apenas tráfego para endereços RFC 1918 vai pela VNet. Para rotear todo o tráfego de saída (incluindo internet) pela VNet, útil quando você tem Azure Firewall inspecionando a saída:

```bash
az webapp config appsettings set \
  --name meu-app \
  --resource-group rg-app \
  --settings WEBSITE_VNET_ROUTE_ALL=1
```

Com isso, todo o tráfego de saída do App Service passa pelo Azure Firewall do hub antes de ir para internet ou outros serviços.

## Acessando Private Endpoints pela integração

Depois de habilitar VNet Integration, o App Service pode chamar recursos com Private Endpoints normalmente, desde que o DNS resolva para o IP privado:

```python
# No App Service, após VNet Integration:
# Esta chamada vai pelo endereço privado do OpenAI (10.x.x.x)
# em vez do endpoint público
from openai import AzureOpenAI
from azure.identity import ManagedServiceIdentity

client = AzureOpenAI(
    azure_endpoint="https://oai-prod.openai.azure.com",  # resolverá para IP privado
    azure_ad_token_provider=...,
    api_version="2024-02-01"
)
```

## Configurando o DNS

O App Service usa o DNS padrão do Azure (168.63.129.16) por padrão. Para resolver Private Endpoints corretamente, configure o DNS customizado:

```bash
# Apontar o App Service para o Private DNS Resolver do hub
az webapp config appsettings set \
  --name meu-app \
  --resource-group rg-app \
  --settings WEBSITE_DNS_SERVER=10.0.4.4  # IP do inbound endpoint do DNS Resolver
```

<div class="callout">
<strong>Subnet exclusiva:</strong> A subnet de VNet Integration não pode ter outros recursos. Não coloque VMs, Private Endpoints ou qualquer outra coisa nela, só a delegação para App Service. Isso também significa que o NSG associado a essa subnet deve permitir tráfego de saída para os recursos que o App precisa acessar.
</div>

## VNet Integration vs Private Endpoint no App Service

| | VNet Integration | Private Endpoint no App |
|---|---|---|
| Direção | Saída (App → VNet) | Entrada (internet → App por IP privado) |
| Uso | Acessar recursos privados | Expor o App apenas na rede privada |
| Subnet | Delegada para App Service | Subnet de Private Endpoints |

Para o cenário completo de App Service totalmente privado: VNet Integration para saída + Private Endpoint para entrada + `publicNetworkAccess: Disabled`.

## Conclusão

VNet Integration é o que conecta um App Service à sua topologia de rede privada sem precisar migrar para IaaS. O custo é uma subnet dedicada e configuração de DNS, mas o resultado é que o App Service acessa Azure OpenAI, AI Search, SQL e qualquer recurso com Private Endpoint exatamente como se estivesse dentro da VNet.
