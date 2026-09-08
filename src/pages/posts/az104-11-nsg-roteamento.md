---
layout: ../../layouts/PostLayout.astro
title: "AZ-104 na prática [11] — NSG, UDR e roteamento"
category: "Azure"
tag: "azure"
serie: "AZ-104 na prática"
serieNum: 11
date: "3 Set 2026"
readTime: "10 min"
description: "Network Security Groups e User Defined Routes para controle de tráfego nas redes Azure."
prev:
  title: "AZ-104 na prática [10] — VNets e subnets"
  slug: "az104-10-vnets-subnets"
next:
  title: "AZ-104 na prática [12] — Load Balancer e Application Gateway"
  slug: "az104-12-load-balancer"
---

Controlar o fluxo de tráfego na rede Azure requer entender como NSGs filtram pacotes e como UDRs direcionam o roteamento.

## Network Security Groups (NSG)

NSGs contêm regras de segurança que permitem ou negam tráfego baseado em IP, porta e protocolo. Podem ser associados a subnets e NICs.

```bash
# Criar NSG
az network nsg create \
  --resource-group meu-rg \
  --name nsg-web

# Regra: permitir HTTPS de qualquer origem
az network nsg rule create \
  --resource-group meu-rg \
  --nsg-name nsg-web \
  --name allow-https \
  --priority 100 \
  --direction Inbound \
  --access Allow \
  --protocol Tcp \
  --source-address-prefixes '*' \
  --destination-port-ranges 443

# Regra: bloquear tráfego SSH de internet
az network nsg rule create \
  --resource-group meu-rg \
  --nsg-name nsg-web \
  --name deny-ssh-internet \
  --priority 200 \
  --direction Inbound \
  --access Deny \
  --protocol Tcp \
  --source-address-prefixes Internet \
  --destination-port-ranges 22

# Associar NSG à subnet
az network vnet subnet update \
  --resource-group meu-rg \
  --vnet-name vnet-producao \
  --name snet-web \
  --network-security-group nsg-web
```

## Service Tags

Service Tags são grupos de prefixos de IP gerenciados pela Microsoft:

| Tag | Representa |
|-----|-----------|
| Internet | IPs públicos fora do Azure |
| VirtualNetwork | Espaço de endereçamento da VNet |
| AzureLoadBalancer | IPs de health probes do LB |
| AzureCloud | Todos os IPs do Azure |
| Storage | IPs do Azure Storage |
| Sql | IPs do Azure SQL |

```bash
az network nsg rule create \
  --resource-group meu-rg \
  --nsg-name nsg-web \
  --name allow-azure-lb \
  --priority 110 \
  --direction Inbound \
  --access Allow \
  --source-address-prefixes AzureLoadBalancer \
  --destination-port-ranges '*'
```

## Application Security Groups (ASG)

ASGs permitem agrupar VMs por função e usar esses grupos nas regras de NSG:

```bash
# Criar ASGs
az network asg create --resource-group meu-rg --name asg-webservers
az network asg create --resource-group meu-rg --name asg-dbservers

# Associar NIC ao ASG
az network nic update \
  --resource-group meu-rg \
  --name vm-web-01-nic \
  --application-security-groups asg-webservers

# Regra usando ASGs
az network nsg rule create \
  --resource-group meu-rg \
  --nsg-name nsg-app \
  --name web-to-db \
  --priority 100 \
  --direction Inbound \
  --access Allow \
  --source-asgs asg-webservers \
  --destination-asgs asg-dbservers \
  --destination-port-ranges 1433
```

## User Defined Routes (UDR)

UDRs sobrescrevem o roteamento padrão do Azure para direcionar tráfego por um appliance específico (NVA, Azure Firewall):

```bash
# Criar route table
az network route-table create \
  --resource-group meu-rg \
  --name rt-producao

# Rota: todo tráfego para internet passa pelo Azure Firewall
az network route-table route create \
  --resource-group meu-rg \
  --route-table-name rt-producao \
  --name route-to-firewall \
  --address-prefix 0.0.0.0/0 \
  --next-hop-type VirtualAppliance \
  --next-hop-ip-address 10.0.100.4

# Associar route table à subnet
az network vnet subnet update \
  --resource-group meu-rg \
  --vnet-name vnet-producao \
  --name snet-app \
  --route-table rt-producao
```

<div class="callout">
<strong>Armadilha do exame:</strong> Quando NSG está associado tanto à subnet quanto à NIC, ambas as regras se aplicam — o tráfego passa pelos dois filtros. Na entrada: subnet NSG → NIC NSG. Na saída: NIC NSG → subnet NSG. O tráfego precisa ser permitido em ambos.
</div>

## O que cai no exame

- Que NSGs são stateful (resposta permitida automaticamente)
- Prioridade de regras (menor número = maior prioridade)
- Regras padrão: AllowVNetInBound, AllowAzureLoadBalancerInBound, DenyAllInBound
- Diferença entre NSG de subnet e NSG de NIC
- Tipos de next-hop em UDR (VirtualAppliance, VirtualNetworkGateway, Internet, None)
