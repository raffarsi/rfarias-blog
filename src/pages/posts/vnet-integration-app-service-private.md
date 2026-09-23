---
layout: ../../layouts/PostLayout.astro
title: "VNet Integration no App Service: conectando aplicações a recursos privados sem expor endpoints"
category: "Networking"
tag: "networking"
date: "17 Nov 2025"
readTime: "10 min"
description: "Regional VNet Integration permite que App Services acessem recursos dentro de uma VNet sem IP público. Configuração, limitações e a diferença para Private Endpoints."
---

App Service é PaaS, fica fora da sua VNet por padrão. Até que você precise que ele acesse um banco de dados com Private Endpoint, ou um Azure OpenAI que você colocou sem acesso público, ou qualquer outro recurso privado. E ai surge a pergunta: como um recurso PaaS acessa outro recurso privado?

A resposta é VNet Integration de saída.

## Dois mecanismos diferentes que confundem

**VNet Integration (Regional):** permite que o App Service faça chamadas SAINDO para recursos dentro da VNet. Você usa quando o App Service precisa alcançar recursos privados.

**Private Endpoint no App Service:** permite que chamadas ENTRANDO no App Service cheguem por endereço privado. Você usa quando quer que o App Service não tenha IP público.

São complementares, não substitutos. Ambos podem existir no mesmo App Service.

## Configurando VNet Integration

```bash
# Subnet dedicada com delegacao obrigatoria
az network vnet subnet create   --name snet-appservice-integration   --vnet-name vnet-spoke   --resource-group rg-app   --address-prefix 10.1.5.0/26   --delegations Microsoft.Web/serverFarms

# Habilitar VNet Integration
az webapp vnet-integration add   --name meu-app   --resource-group rg-app   --vnet vnet-spoke   --subnet snet-appservice-integration
```

## Roteando tudo pelo Firewall do hub

Por padrão, só tráfego para ranges RFC 1918 vai pela VNet. Para rotear todo o tráfego de saída pelo Azure Firewall:

```bash
az webapp config appsettings set   --name meu-app   --resource-group rg-app   --settings WEBSITE_VNET_ROUTE_ALL=1
```

Com isso, o App Service alcança os Private Endpoints normalmente e todo o tráfego para internet passa pelo Firewall antes de sair.

## O DNS que ninguém lembra

Depois de configurar VNet Integration, o App Service precisa resolver os nomes dos Private Endpoints para IPs privados. Por padrão, ele usa o DNS do Azure (168.63.129.16) que não sabe sobre as zonas Private DNS da sua VNet.

```bash
# Apontar para o DNS Resolver do hub
az webapp config appsettings set   --name meu-app   --resource-group rg-app   --settings WEBSITE_DNS_SERVER=10.0.4.4
```

Sem essa configuração, o App Service vai resolver o nome do OpenAI ou do AI Search para o IP público, e a conexão vai falhar porque o acesso público está desabilitado.

<div class="callout">
<strong>Subnet exclusiva:</strong> A subnet de VNet Integration não pode ter outros recursos. Coloque só a delegação para App Service. O NSG associado a ela precisa permitir tráfego de saída para os recursos que o App precisa acessar.
</div>

VNet Integration é o que conecta o mundo PaaS ao mundo de rede privada do Azure. O detalhe de DNS é o que mais derruba implementações na primeira vez.
