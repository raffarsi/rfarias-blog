---
layout: ../../layouts/PostLayout.astro
title: "AZ-104 na prática [7] — VMs: alta disponibilidade e Scale Sets"
category: "Infra"
tag: "infra"
serie: "AZ-104 na prática"
serieSlug: "az104"
serieNum: 7
date: "27 Jun 2026"
readTime: "10 min"
description: "Availability Sets, Availability Zones e Virtual Machine Scale Sets para alta disponibilidade."
prev:
  title: "AZ-104 [6] — VMs: Criação"
  slug: "az104-06-virtual-machines"
next:
  title: "AZ-104 [8] — App Service"
  slug: "az104-08-app-service"

---

Alta disponibilidade não é opcional em produção. O Azure oferece três mecanismos principais: Availability Sets, Availability Zones e Virtual Machine Scale Sets.

## Availability Sets

Protege contra falhas de hardware dentro de um datacenter. Distribui VMs em Fault Domains (racks diferentes) e Update Domains (grupos de atualização).

```bash
# Criar Availability Set
az vm availability-set create \
  --resource-group meu-rg \
  --name meu-as \
  --platform-fault-domain-count 2 \
  --platform-update-domain-count 5

# Criar VM dentro do AS
az vm create \
  --resource-group meu-rg \
  --name vm-web-01 \
  --availability-set meu-as \
  --image Win2022Datacenter \
  --size Standard_D2s_v3
```

**SLA:** 99,95% com 2+ VMs no mesmo Availability Set.

## Availability Zones

Protege contra falha de datacenter inteiro. Distribui VMs em datacenters fisicamente separados na mesma região.

```bash
az vm create \
  --resource-group meu-rg \
  --name vm-web-zone1 \
  --zone 1 \
  --image Ubuntu2204 \
  --size Standard_D2s_v3

az vm create \
  --resource-group meu-rg \
  --name vm-web-zone2 \
  --zone 2 \
  --image Ubuntu2204 \
  --size Standard_D2s_v3
```

**SLA:** 99,99% com 2+ VMs em zonas diferentes.

<div class="callout">
<strong>Importante:</strong> Não é possível usar Availability Set e Availability Zone na mesma VM, são mutuamente exclusivos. Availability Zones oferecem SLA maior e são a abordagem recomendada para novos deployments.
</div>

## Virtual Machine Scale Sets (VMSS)

VMSS cria e gerencia um grupo de VMs idênticas com auto-scaling:

```bash
az vmss create \
  --resource-group meu-rg \
  --name meu-vmss \
  --image Ubuntu2204 \
  --vm-sku Standard_D2s_v3 \
  --instance-count 2 \
  --admin-username azureuser \
  --ssh-key-values ~/.ssh/id_rsa.pub \
  --zones 1 2 3 \
  --upgrade-policy-mode automatic

# Configurar autoscaling
az monitor autoscale create \
  --resource-group meu-rg \
  --resource meu-vmss \
  --resource-type Microsoft.Compute/virtualMachineScaleSets \
  --name autoscale-cpu \
  --min-count 2 \
  --max-count 10 \
  --count 2

# Regra: escalar para cima quando CPU > 70%
az monitor autoscale rule create \
  --resource-group meu-rg \
  --autoscale-name autoscale-cpu \
  --condition "Percentage CPU > 70 avg 5m" \
  --scale out 2

# Regra: escalar para baixo quando CPU < 30%
az monitor autoscale rule create \
  --resource-group meu-rg \
  --autoscale-name autoscale-cpu \
  --condition "Percentage CPU < 30 avg 5m" \
  --scale in 1
```

## Política de upgrade do VMSS

| Modo | Comportamento |
|------|--------------|
| Automatic | Atualiza instâncias automaticamente |
| Rolling | Atualiza em lotes, mantendo capacidade |
  Manual | Você controla quando atualizar cada instância |

## Azure Dedicated Hosts

Para requisitos de isolamento de hardware (compliance, licenciamento):

```bash
az vm host group create \
  --name meu-host-group \
  --resource-group meu-rg \
  --location brazilsouth \
  --platform-fault-domain-count 2 \
  --zone 1

az vm host create \
  --name meu-host \
  --host-group meu-host-group \
  --resource-group meu-rg \
  --sku DSv3-Type1
```

## O que cai no exame

- Fault Domains vs Update Domains em Availability Sets
- SLA: 99,95% (AS) vs 99,99% (AZ)
- Que AS e AZ são mutuamente exclusivos
- Modos de upgrade do VMSS (Automatic, Rolling, Manual)
- Quando usar Dedicated Hosts
