---
layout: ../../layouts/PostLayout.astro
title: "Network Security Groups vs Application Security Groups: quando usar cada um"
category: "Networking"
tag: "networking"
date: "13 Ago 2026"
readTime: "10 min"
description: "Entenda as diferenças entre NSG e ASG no Azure e em quais cenários cada um se destaca."
prev:
  title: "Simulado gamificado AZ-900"
  slug: "simulado-gamificado-az900"
next:
  title: "17 anos na mesma empresa"
  slug: "17-anos-mesma-empresa"
---

NSG e ASG aparecem juntos em toda documentacao de seguranca de rede Azure. A diferenca entre eles e simples, mas a confusao sobre quando usar cada um aparece com frequencia.

NSG define regras. ASG e uma forma de referenciar grupos de VMs nessas regras sem usar IPs fixos.

## O problema que ASG resolve

Imagine uma regra de NSG: "permitir trafego da porta 80 dos servidores web para os servidores de aplicacao". Sem ASG, voce escreve isso com IPs ou ranges:

```
Origem: 10.0.1.4, 10.0.1.5, 10.0.1.6
Destino: 10.0.2.4, 10.0.2.5
Porta: 80
```

Quando adiciona uma nova VM web, atualiza a regra. Quando remove, atualiza de novo. Em ambientes que crescem, isso vira manutencao constante.

Com ASG, voce cria grupos logicos e as regras referenciam os grupos:

```
Origem: asg-servidores-web
Destino: asg-servidores-app
Porta: 80
```

Adicionar uma VM ao grupo web e so associar o ASG a NIC dela. A regra continua valendo automaticamente.

## Criando ASGs e usando nas regras

```bash
# Criar ASGs
az network asg create --name asg-web --resource-group rg-app --location brazilsouth
az network asg create --name asg-app --resource-group rg-app --location brazilsouth

# Associar a NIC de uma VM
az network nic ip-config update   --nic-name vm-web-01-nic   --resource-group rg-app   --name ipconfig1   --application-security-groups asg-web

# Regra de NSG referenciando ASGs
az network nsg rule create   --nsg-name nsg-app   --resource-group rg-app   --name allow-web-to-app   --priority 100   --protocol Tcp   --source-asgs asg-web   --destination-asgs asg-app   --destination-port-ranges 80 443   --access Allow
```

## Quando NSG sem ASG ainda faz sentido

ASGs adicionam uma camada de gerenciamento. Para ambientes pequenos com poucas VMs e sem crescimento previsto, manter IPs nas regras pode ser mais simples.

Use ASG quando: o numero de VMs num grupo muda com frequencia, ou quando voce quer que as regras de seguranca sejam independentes dos IPs especificos das maquinas.

Use IP direto quando: o ambiente e pequeno e estaevel, ou quando a regra e para ranges amplos (Internet, VirtualNetwork) onde ASG nao faz diferenca.

NSG e ASG nao competem, trabalham juntos. O NSG tem as regras, o ASG organiza os alvos dessas regras.
