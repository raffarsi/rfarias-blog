---
layout: ../../layouts/PostLayout.astro
title: "AZ-104 na prática [10] — VNets, subnets e peering"
category: "Networking"
tag: "networking"
serie: "AZ-104 na prática"
serieSlug: "az104"
serieNum: 10
date: "18 Jul 2026"
readTime: "11 min"
description: "Como planejar e implementar Virtual Networks, subnets e conectar VNets com peering."
prev:
  title: "AZ-104 [9] — Containers e AKS"
  slug: "az104-09-containers-aks"
next:
  title: "AZ-104 [11] — NSG e Roteamento"
  slug: "az104-11-nsg-roteamento"

---

Redes virtuais são a base da infraestrutura Azure. Planejar o espaço de endereçamento corretamente desde o início evita retrabalho custoso no futuro.

## Planejamento de endereçamento

Antes de criar qualquer VNet, defina o espaço de endereçamento. Considerações:
- Evite sobreposição com redes on-premises
- Reserve espaço para crescimento
- Planeje subnets por função (web, app, data, gateway)

```bash
# Criar VNet com múltiplas subnets
az network vnet create \
  --resource-group meu-rg \
  --name vnet-producao \
  --address-prefix 10.0.0.0/16 \
  --subnet-name snet-web \
  --subnet-prefix 10.0.1.0/24

# Adicionar subnets
az network vnet subnet create \
  --resource-group meu-rg \
  --vnet-name vnet-producao \
  --name snet-app \
  --address-prefix 10.0.2.0/24

az network vnet subnet create \
  --resource-group meu-rg \
  --vnet-name vnet-producao \
  --name snet-data \
  --address-prefix 10.0.3.0/24

az network vnet subnet create \
  --resource-group meu-rg \
  --vnet-name vnet-producao \
  --name GatewaySubnet \
  --address-prefix 10.0.255.0/27
```

<div class="callout">
<strong>Importante:</strong> A subnet GatewaySubnet é obrigatória e reservada para VPN Gateway e ExpressRoute Gateway. O nome deve ser exatamente "GatewaySubnet". O /27 (ou maior) é o mínimo recomendado.
</div>

## Endereços reservados pelo Azure

Em cada subnet, o Azure reserva 5 endereços:
- x.x.x.0 — endereço de rede
- x.x.x.1 — gateway padrão
- x.x.x.2 e x.x.x.3 — DNS do Azure
- x.x.x.255 — broadcast

Uma /28 (16 endereços) deixa apenas 11 utilizáveis.

## VNet Peering

Conecta VNets (mesma região ou cross-region) sem VPN, com latência de rede Azure:

```bash
# Peering entre duas VNets
az network vnet peering create \
  --resource-group meu-rg \
  --name vnet-producao-to-vnet-dev \
  --vnet-name vnet-producao \
  --remote-vnet vnet-dev \
  --allow-vnet-access \
  --allow-forwarded-traffic

# O peering é bidirecional mas requer criação em ambas as direções
az network vnet peering create \
  --resource-group rg-dev \
  --name vnet-dev-to-vnet-producao \
  --vnet-name vnet-dev \
  --remote-vnet /subscriptions/{sub-id}/resourceGroups/meu-rg/providers/Microsoft.Network/virtualNetworks/vnet-producao \
  --allow-vnet-access
```

## Global VNet Peering

Para conectar VNets em regiões diferentes, use o mesmo comando — o Azure detecta automaticamente se é regional ou global:

```bash
az network vnet peering create \
  --resource-group meu-rg \
  --name producao-to-eua \
  --vnet-name vnet-producao \
  --remote-vnet /subscriptions/{sub-id}/resourceGroups/rg-eua/providers/Microsoft.Network/virtualNetworks/vnet-eua \
  --allow-vnet-access
```

## Service Endpoints vs Private Endpoints

**Service Endpoint** — estende a identidade da VNet para serviços Azure (ex: SQL, Storage). O tráfego ainda vai pela rede da Microsoft mas pode vir de qualquer lugar.

**Private Endpoint** — cria uma NIC com IP privado dentro da VNet apontando para o serviço. O tráfego é completamente privado.

```bash
# Habilitar Service Endpoint para Storage em uma subnet
az network vnet subnet update \
  --resource-group meu-rg \
  --vnet-name vnet-producao \
  --name snet-app \
  --service-endpoints Microsoft.Storage

# Criar Private Endpoint para SQL Database
az network private-endpoint create \
  --resource-group meu-rg \
  --name pe-sql \
  --vnet-name vnet-producao \
  --subnet snet-data \
  --private-connection-resource-id /subscriptions/{sub-id}/resourceGroups/meu-rg/providers/Microsoft.Sql/servers/meu-sql \
  --group-id sqlServer \
  --connection-name pec-sql
```

## O que cai no exame

- Endereços reservados por subnet (5 primeiros + último)
- Que peering não é transitivo — A→B e B→C não significa A→C
- Diferença entre Service Endpoint e Private Endpoint
- Que GatewaySubnet é reservada e não pode ter NSG
- Como calcular hosts disponíveis por CIDR
