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

Private Endpoint e um dos recursos que parece simples de configurar e complexo de funcionar corretamente. Voce cria, o IP privado aparece, o status fica como "Approved", e mesmo assim a aplicacao nao alcança o servico. Quase sempre e DNS.

Vou mostrar a configuracao correta e os pontos onde a maioria trava.

## O que acontece quando voce cria um Private Endpoint

O Private Endpoint recebe um IP privado na subnet que voce escolheu. Mas por padrao, o nome do servico (ex: `oai-producao.openai.azure.com`) ainda resolve para o IP publico via DNS. Para que a resolucao retorne o IP privado, voce precisa de uma zona Private DNS vinculada a VNet.

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

A zona Private DNS precisa estar vinculada ao hub, onde o DNS Resolver esta. Se voce vincula so ao spoke, recursos em outros spokes e on-premises nao vao resolver corretamente. A regra: **zona vinculada ao hub, valida para todos que consultam o resolver do hub**.

## Como nao perder o acesso ao portal

Quando voce desabilita o acesso publico de um servico como o Azure OpenAI, o portal Azure nao consegue mais se conectar a ele diretamente. Voce nao perde o acesso ao portal em si, mas certas funcionalidades do recurso (como testar deployments no playground) ficam indisponiveis de fora da VNet.

Para manter acesso administrativo ao portal, mantenha o acesso publico habilitado durante a configuracao e so desabilite depois que o Private Endpoint estiver funcionando e verificado. Ou use Azure Bastion + VM dentro da VNet para gerenciar recursos com acesso publico desabilitado.

## Verificando se esta funcionando

```bash
# De uma VM dentro da VNet
nslookup oai-producao.openai.azure.com
# Deve retornar o IP privado (10.x.x.x)

# Teste de conectividade
curl -I https://oai-producao.openai.azure.com
# Deve retornar sem erro de certificado
```

Private Endpoint funciona quando DNS, zona Private DNS e vinculacao ao hub estao corretos. Se voce verificou os tres e ainda nao funciona, verifique o NSG da subnet onde esta o Private Endpoint. Por padrao, NSGs nao bloqueiam trafego para Private Endpoints, mas UDRs mal configuradas podem redirecionar o trafego para o lugar errado.
