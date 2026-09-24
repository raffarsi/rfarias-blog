---
layout: ../../layouts/PostLayout.astro
title: "DNS privado e resolução de nomes em arquiteturas de IA multi-VNet: os erros mais comuns"
category: "Networking"
tag: "networking"
serie: "Série Azure Networking + IA Generativa"
serieNum: 3
serieSlug: "serie-azure-networking-ia"
date: "26 Ago 2026"
readTime: "10 min"
description: "O Private Endpoint está configurado certo. O recurso responde no telnet. E mesmo assim a aplicação não resolve o nome. Os 4 erros de DNS que fazem um Private Endpoint 'configurado certo' simplesmente não funcionar."
prev:
  title: "Azure Networking [2], Hub-and-spoke para IA generativa"
  slug: "hub-and-spoke-ia-generativa-azure"
next:
  title: "Azure Networking [4], Latência de rede em pipelines RAG"
  slug: "latencia-rede-pipelines-rag-azure"
---

O Private Endpoint está configurado. O IP privado está correto. O `nslookup` a partir do Azure Cloud Shell retorna o IP público. A aplicação não consegue conectar. É o tipo de incidente que dura horas porque as pessoas olham para a configuração de rede quando o problema é de DNS.

Esse artigo cobre os erros de DNS mais comuns em arquiteturas multi-VNet com IA generativa.

## Por que o problema de DNS é específico de IA

Arquiteturas de IA tipicamente tem: Azure OpenAI com Private Endpoint, Azure AI Search com Private Endpoint, Storage com Private Endpoint, e uma aplicação em App Service ou AKS que precisa alcançar todos eles. Três serviços, três zonas Private DNS (`privatelink.openai.azure.com`, `privatelink.search.windows.net`, `privatelink.blob.core.windows.net`), e potencialmente vários spokes ou ambientes.

A probabilidade de erro de DNS é proporcional ao número de Private Endpoints.

## Erro 1: zona Private DNS vinculada ao spoke, não ao hub

O erro mais frequente. Você cria o Private Endpoint no spoke, cria a zona Private DNS, e vincula ao spoke. Funciona da VNet do spoke. Mas quando a aplicação está em outro spoke, ou quando os servidores on-premises tentam acessar, a resolução falha.

A regra: **todas as zonas Private DNS devem estar vinculadas ao hub**, onde o DNS Resolver está. O resolver no hub é o que responde consultas de todos os spokes e do on-premises.

```bash
# Correto: vincular ao hub
az network private-dns link vnet create   --resource-group rg-dns   --zone-name "privatelink.openai.azure.com"   --name link-hub   --virtual-network vnet-hub   --registration-enabled false

# Errado: vincular ao spoke (so funciona daquele spoke)
az network private-dns link vnet create   --zone-name "privatelink.openai.azure.com"   --virtual-network vnet-spoke-ia  # nao faz isso
```

## Erro 2: App Service sem DNS customizado

Depois de configurar VNet Integration no App Service, você ainda precisa configurar o DNS para que ele use o resolver do hub:

```bash
az webapp config appsettings set   --name meu-app-ia   --resource-group rg-ia   --settings WEBSITE_DNS_SERVER=10.0.4.4
```

Sem isso, o App Service usa o DNS público do Azure (168.63.129.16) e resolve o nome do OpenAI para o IP público. Se o acesso público está desabilitado no OpenAI, a conexão falha.

## Erro 3: AKS sem configuração de DNS customizado

Para AKS, o DNS customizado é configurado na VNet:

```bicep
resource vnetSpoke 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  properties: {
    dhcpOptions: {
      dnsServers: ['10.0.4.4']  // IP do inbound endpoint do DNS Resolver
    }
  }
}
```

Mas existe um detalhe: o CoreDNS do AKS tem seu próprio cache. Depois de alterar o DNS da VNet, os pods existentes podem continuar resolvendo com o DNS antigo por algum tempo. Reiniciar os pods do CoreDNS acelera a propagação.

```bash
kubectl rollout restart deployment coredns -n kube-system
```

## Como diagnosticar rapidamente

```bash
# De dentro de um pod ou VM no spoke
nslookup oai-producao.openai.azure.com 10.0.4.4
# Se retornar IP privado: DNS resolvendo corretamente
# Se retornar IP publico: zona nao esta vinculada ao hub ou o resolver nao esta respondendo

# Testar o resolver diretamente
nslookup oai-producao.openai.azure.com 168.63.129.16
# Se retornar IP publico aqui tambem: confirma que e problema de zona DNS
```

A maioria dos incidentes de Private Endpoint em arquiteturas de IA e DNS. Quando o Private Endpoint "não funciona", teste o DNS antes de olhar qualquer outra coisa.
