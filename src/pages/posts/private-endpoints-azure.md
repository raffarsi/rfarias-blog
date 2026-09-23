---
layout: ../../layouts/PostLayout.astro
title: "Como configurar Private Endpoints no Azure sem perder o acesso ao portal"
category: "Networking"
tag: "networking"
date: "27 Ago 2026"
readTime: "8 min"
description: "Passo a passo para configurar Private Endpoints no Azure com as armadilhas de DNS que a documentação não destaca."
prev:
  title: "NSG vs ASG: quando usar cada um"
  slug: "nsg-vs-asg"
next:
  title: "Azure AI Foundry: primeiro projeto"
  slug: "azure-ai-foundry"
---

Private Endpoint é um dos recursos que parece simples de configurar e complexo de funcionar corretamente. Você cria, o IP privado aparece, o status fica como "Approved", e mesmo assim a aplicação não alcança o serviço. Quase sempre é DNS.

Vou mostrar a configuração correta e os pontos onde a maioria trava.

## O que acontece quando você cria um Private Endpoint

O Private Endpoint recebe um IP privado na subnet que você escolheu. Mas por padrão, o nome do serviço (ex: `oai-producao.openai.azure.com`) ainda resolve para o IP público via DNS. Para que a resolução retorne o IP privado, você precisa de uma zona Private DNS vinculada a VNet.

```bash
# Criar o Private Endpoint
az network private-endpoint create   --name pe-openai   --resource-group rg-ia   --vnet-name vnet-spoke   --subnet snet-pe   --private-connection-resource-id $(az cognitiveservices account show     --name oai-producao --resource-group rg-ia --query id -o tsv)   --group-id account   --connection-name pe-openai-connection

# Criar a zona Private DNS correspondente
az network private-dns zone create   --resource-group rg-dns   --name "privatelink.openai.azure.com"

# Vincular ao hub (nao ao spoke onde esta o PE)
az network private-dns link vnet create   --resource-group rg-dns   --zone-name "privatelink.openai.azure.com"   --name link-hub   --virtual-network vnet-hub   --registration-enabled false

# Criar o registro A na zona
PRIVATE_IP=$(az network private-endpoint show   --name pe-openai --resource-group rg-ia   --query 'customDnsConfigs[0].ipAddresses[0]' -o tsv)

az network private-dns record-set a create   --resource-group rg-dns   --zone-name "privatelink.openai.azure.com"   --name "oai-producao"

az network private-dns record-set a add-record   --resource-group rg-dns   --zone-name "privatelink.openai.azure.com"   --record-set-name "oai-producao"   --ipv4-address $PRIVATE_IP
```

## O erro mais comum: vincular a zona ao spoke em vez do hub

A zona Private DNS precisa estar vinculada ao hub, onde o DNS Resolver está. Se você vincula só ao spoke, recursos em outros spokes e on-premises não vão resolver corretamente. A regra: **zona vinculada ao hub, válida para todos que consultam o resolver do hub**.

## Como não perder o acesso ao portal

Quando você desabilita o acesso público de um serviço como o Azure OpenAI, o portal Azure não consegue mais se conectar a ele diretamente. Você não perde o acesso ao portal em si, mas certas funcionalidades do recurso (como testar deployments no playground) ficam indisponíveis de fora da VNet.

Para manter acesso administrativo ao portal, mantenha o acesso público habilitado durante a configuração e só desabilite depois que o Private Endpoint estiver funcionando e verificado. Ou use Azure Bastion + VM dentro da VNet para gerenciar recursos com acesso público desabilitado.

## Verificando se está funcionando

```bash
# De uma VM dentro da VNet
nslookup oai-producao.openai.azure.com
# Deve retornar o IP privado (10.x.x.x)

# Teste de conectividade
curl -I https://oai-producao.openai.azure.com
# Deve retornar sem erro de certificado
```

Private Endpoint funciona quando DNS, zona Private DNS e vinculação ao hub estão corretos. Se você verificou os três e ainda não funciona, verifique o NSG da subnet onde está o Private Endpoint. Por padrão, NSGs não bloqueiam tráfego para Private Endpoints, mas UDRs mal configuradas podem redirecionar o tráfego para o lugar errado.
