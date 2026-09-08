---
layout: ../../layouts/PostLayout.astro
title: "AZ-104 na prática [6] — VMs: criação, tamanhos e discos"
category: "Azure"
tag: "azure"
serie: "AZ-104 na prática"
serieNum: 6
date: "20 Jun 2026"
readTime: "12 min"
description: "Como criar e configurar VMs no Azure, escolher o tamanho certo e gerenciar discos."
prev:
  title: "AZ-104 na prática [5] — Azure Files"
  slug: "az104-05-azure-files"
next:
  title: "AZ-104 na prática [7] — VMs: disponibilidade e Scale Sets"
  slug: "az104-07-vm-disponibilidade"
---

Máquinas Virtuais são a base da infraestrutura IaaS no Azure. No AZ-104, você precisa saber criar, configurar, dimensionar e gerenciar VMs com eficiência.

## Criando uma VM via CLI

```bash
az vm create \
  --resource-group meu-rg \
  --name vm-producao \
  --image Ubuntu2204 \
  --size Standard_D2s_v3 \
  --vnet-name minha-vnet \
  --subnet minha-subnet \
  --admin-username azureuser \
  --ssh-key-values ~/.ssh/id_rsa.pub \
  --public-ip-sku Standard \
  --storage-sku Premium_LRS \
  --os-disk-size-gb 128
```

## Famílias de tamanhos

| Série | Uso |
|-------|-----|
| B | Burstable — workloads com picos ocasionais |
| D/Ds | Propósito geral — aplicações web, bancos de dados |
| E/Es | Memória otimizada — bancos de dados em memória |
| F/Fs | Computação otimizada — processamento batch |
| N | GPU — ML, renderização, processamento gráfico |
| L | Storage otimizado — bancos de dados NoSQL |
| H | Alta performance (HPC) |

O sufixo **s** indica suporte a Premium SSD. O sufixo **v3**, **v4** indica a geração.

## Tipos de disco

| Tipo | IOPS máx | Latência | Uso |
|------|----------|----------|-----|
| Ultra Disk | 160.000 | Sub-milissegundo | Bancos de dados críticos |
| Premium SSD v2 | 80.000 | ~1ms | SQL Server, SAP |
| Premium SSD | 20.000 | ~2ms | Produção geral |
| Standard SSD | 6.000 | ~4ms | Dev/Test, web servers |
| Standard HDD | 2.000 | ~10ms | Backup, arquivamento |

```bash
# Adicionar disco de dados à VM
az vm disk attach \
  --resource-group meu-rg \
  --vm-name vm-producao \
  --name disco-dados \
  --new \
  --size-gb 256 \
  --sku Premium_LRS

# Listar discos da VM
az vm show \
  --resource-group meu-rg \
  --name vm-producao \
  --query "storageProfile.dataDisks"
```

## Operações básicas de gerenciamento

```bash
# Iniciar, parar e desalocar
az vm start --resource-group meu-rg --name vm-producao
az vm stop --resource-group meu-rg --name vm-producao       # Para mas mantém alocação
az vm deallocate --resource-group meu-rg --name vm-producao # Para e libera recursos (sem cobrança de compute)

# Redimensionar VM
az vm resize \
  --resource-group meu-rg \
  --name vm-producao \
  --size Standard_D4s_v3

# Capturar VM como imagem
az vm generalize --resource-group meu-rg --name vm-producao
az image create \
  --resource-group meu-rg \
  --name minha-imagem \
  --source vm-producao
```

<div class="callout">
<strong>Armadilha do exame:</strong> "Stop" para a VM mas continua cobrando pelo compute (a alocação é mantida). "Deallocate" libera os recursos e para a cobrança de compute — mas você perde o IP público dinâmico e pode mudar o host. Use IP estático se precisar manter o endereço.
</div>

## Azure Bastion — acesso seguro sem IP público

```bash
az network bastion create \
  --name meu-bastion \
  --public-ip-address bastion-pip \
  --resource-group meu-rg \
  --vnet-name minha-vnet \
  --location brazilsouth
```

## Extensões de VM

Extensões adicionam funcionalidades pós-deploy:

```bash
# Instalar Azure Monitor Agent
az vm extension set \
  --resource-group meu-rg \
  --vm-name vm-producao \
  --name AzureMonitorLinuxAgent \
  --publisher Microsoft.Azure.Monitor \
  --version 1.0
```

## O que cai no exame

- Diferença entre Stop e Deallocate
- Famílias de tamanho e quando usar cada uma
- Tipos de disco e requisitos de performance
- Como criar e anexar discos de dados
- Que Ultra Disk e Premium SSD v2 requerem configuração específica de VM
