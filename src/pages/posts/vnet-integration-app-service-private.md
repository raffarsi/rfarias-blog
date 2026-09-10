---
layout: ../../layouts/PostLayout.astro
title: "VNet Integration no App Service: conectando aplicações a recursos privados sem expor endpoints"
category: "Networking"
tag: "networking"
date: "17 Nov 2025"
readTime: "10 min"
description: "Regional VNet Integration permite que App Services acessem recursos dentro de uma VNet sem IP público. Configuração, limitações e a diferença para Private Endpoints."
---

App Service e PaaS, fica fora da sua VNet por padrao. Ate que voce precise que ele acesse um banco de dados com Private Endpoint, ou um Azure OpenAI que voce colocou sem acesso publico, ou qualquer outro recurso privado. E ai surge a pergunta: como um recurso PaaS acessa outro recurso privado?

A resposta e VNet Integration de saida.

## Dois mecanismos diferentes que confundem

**VNet Integration (Regional):** permite que o App Service faca chamadas SAINDO para recursos dentro da VNet. Voce usa quando o App Service precisa alcançar recursos privados.

**Private Endpoint no App Service:** permite que chamadas ENTRANDO no App Service cheguem por endereço privado. Voce usa quando quer que o App Service nao tenha IP publico.

Sao complementares, nao substitutos. Ambos podem existir no mesmo App Service.

## Configurando VNet Integration

```bash
# Subnet dedicada com delegacao obrigatoria
az network vnet subnet create   --name snet-appservice-integration   --vnet-name vnet-spoke   --resource-group rg-app   --address-prefix 10.1.5.0/26   --delegations Microsoft.Web/serverFarms

# Habilitar VNet Integration
az webapp vnet-integration add   --name meu-app   --resource-group rg-app   --vnet vnet-spoke   --subnet snet-appservice-integration
```

## Roteando tudo pelo Firewall do hub

Por padrao, so trafego para ranges RFC 1918 vai pela VNet. Para rotear todo o trafego de saida pelo Azure Firewall:

```bash
az webapp config appsettings set   --name meu-app   --resource-group rg-app   --settings WEBSITE_VNET_ROUTE_ALL=1
```

Com isso, o App Service alcanca os Private Endpoints normalmente e todo o trafego para internet passa pelo Firewall antes de sair.

## O DNS que ninguem lembra

Depois de configurar VNet Integration, o App Service precisa resolver os nomes dos Private Endpoints para IPs privados. Por padrao, ele usa o DNS do Azure (168.63.129.16) que nao sabe sobre as zonas Private DNS da sua VNet.

```bash
# Apontar para o DNS Resolver do hub
az webapp config appsettings set   --name meu-app   --resource-group rg-app   --settings WEBSITE_DNS_SERVER=10.0.4.4
```

Sem essa configuracao, o App Service vai resolver o nome do OpenAI ou do AI Search para o IP publico, e a conexao vai falhar porque o acesso publico esta desabilitado.

<div class="callout">
<strong>Subnet exclusiva:</strong> A subnet de VNet Integration nao pode ter outros recursos. Coloque so a delegacao para App Service. O NSG associado a ela precisa permitir trafego de saida para os recursos que o App precisa acessar.
</div>

VNet Integration e o que conecta o mundo PaaS ao mundo de rede privada do Azure. O detalhe de DNS e o que mais derruba implementacoes na primeira vez.
