---
layout: ../../layouts/PostLayout.astro
title: "Network Security Groups vs Application Security Groups: quando usar cada um"
category: "Azure"
tag: "azure"
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

NSG e ASG são dois recursos de segurança de rede no Azure que aparecem juntos em quase toda arquitetura, mas que muita gente confunde ou usa de forma incompleta.

## NSG: o filtro de pacotes do Azure

Um Network Security Group é uma lista ordenada de regras de entrada e saída que filtram tráfego com base em IP de origem, IP de destino, porta e protocolo. Você associa um NSG a uma **subnet** ou a uma **NIC**.

```bash
az network nsg create \
  --resource-group rg-networking \
  --name nsg-subnet-web

az network nsg rule create \
  --resource-group rg-networking \
  --nsg-name nsg-subnet-web \
  --name AllowHTTPS \
  --priority 100 \
  --direction Inbound \
  --access Allow \
  --protocol Tcp \
  --source-address-prefixes '*' \
  --destination-port-ranges 443
```

O NSG funciona bem quando suas regras são baseadas em ranges de IP fixos. Mas em ambientes com auto-scaling, múltiplas VMs na mesma subnet servindo funções diferentes, gerenciar IPs se torna um pesadelo.

## ASG: agrupamento lógico de interfaces de rede

O Application Security Group permite agrupar NICs por função (web servers, app servers, database servers) e usar esses grupos como origem ou destino nas regras do NSG.

```bash
az network asg create --resource-group rg-networking --name asg-webservers
az network asg create --resource-group rg-networking --name asg-appservers
az network asg create --resource-group rg-networking --name asg-dbservers

az network nsg rule create \
  --resource-group rg-networking \
  --nsg-name nsg-subnet-app \
  --name Web-to-App \
  --priority 200 \
  --direction Inbound \
  --access Allow \
  --protocol Tcp \
  --source-asgs asg-webservers \
  --destination-asgs asg-appservers \
  --destination-port-ranges 8080
```

A grande vantagem: quando uma nova VM é criada, basta associar a NIC ao ASG. Todas as regras se aplicam automaticamente, sem editar nenhum NSG.

## Quando usar o quê

**NSG sozinho** funciona quando as regras são baseadas em CIDRs fixos ou Service Tags (`AzureLoadBalancer`, `Internet`, `VirtualNetwork`).

**NSG + ASG** é necessário quando a mesma subnet tem VMs com funções diferentes, você usa auto-scaling, ou quer microsegmentação.

<div class="callout">
<strong>Limitação importante:</strong> ASGs só funcionam dentro da mesma VNet. Para regras entre VNets via peering, use IPs ou Service Tags no NSG.
</div>

## Padrão recomendado para ambientes corporativos

1. **NSG na subnet** com regras gerais (bloquear tudo por padrão, permitir tráfego do Load Balancer)
2. **ASGs por camada** (web, app, data) associados às NICs
3. **Regras de microsegmentação** no NSG usando ASGs como origem/destino

Essa abordagem mantém as regras legíveis, escaláveis e auditáveis — três requisitos que em ambiente corporativo não são opcionais.
