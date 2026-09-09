---
layout: ../../layouts/PostLayout.astro
title: "AZ-900 na prática [2] — Arquitetura e componentes do Azure"
category: "Azure"
tag: "azure"
serie: "AZ-900 na prática"
serieSlug: "az900"
serieNum: 2
date: "7 Mar 2026"
readTime: "9 min"
description: "Regiões, Zonas de Disponibilidade, Resource Groups e a hierarquia de organização do Azure."
prev:
  title: "AZ-900 [1] — Conceitos de Cloud"
  slug: "az900-01-conceitos-nuvem"
next:
  title: "AZ-900 [3] — Computação e Redes"
  slug: "az900-03-computacao-redes"

---

Entender como o Azure está organizado geograficamente e como você estrutura seus recursos é fundamental — tanto para o exame quanto para projetar soluções reais.

## Infraestrutura global

**Datacenters** — instalações físicas com servidores, rede e energia redundante. A Microsoft não divulga a localização exata por segurança.

**Regiões** — agrupamento geográfico de datacenters conectados por rede de baixa latência. O Azure tem 60+ regiões em todo o mundo. Exemplos: Brazil South, East US, West Europe.

**Pares de Regiões** — cada região tem um par para replicação de dados e failover. Brazil South está pareada com South Central US. Dados replicados entre pares não saem da mesma fronteira geopolítica (exceto Brazil South).

**Regiões Soberanas** — instâncias isoladas para requisitos governamentais: Azure Government (EUA), Azure China (operada pela 21Vianet).

```bash
# Listar regiões disponíveis
az account list-locations \
  --query "[].{Nome:displayName, Regiao:name}" \
  --output table | grep -i brazil
```

## Zonas de Disponibilidade

Datacenters fisicamente separados dentro de uma região, com energia, resfriamento e rede independentes.

```bash
# Criar recurso em zona específica
az vm create \
  --resource-group meu-rg \
  --name vm-zona1 \
  --zone 1 \
  --image Ubuntu2204 \
  --size Standard_D2s_v3

# Ver zonas disponíveis em uma região
az vm list-skus \
  --location brazilsouth \
  --zone \
  --query "[?name=='Standard_D2s_v3'].locationInfo[].zones" \
  --output table
```

<div class="callout">
<strong>Importante:</strong> Nem todas as regiões têm Zonas de Disponibilidade. Brazil South tem, mas verifique sempre antes de projetar uma solução de alta disponibilidade.
</div>

## Hierarquia de organização

```
Management Groups (opcional)
  └── Subscriptions
        └── Resource Groups
              └── Resources
```

**Management Groups** — container para múltiplas subscriptions. Permite aplicar políticas e RBAC em escala. Máximo de 6 níveis de hierarquia.

**Subscriptions** — unidade de billing e limite de recursos. Uma organização pode ter múltiplas subscriptions por ambiente (dev, produção), departamento ou projeto.

**Resource Groups** — container lógico para recursos relacionados. Todo recurso deve pertencer a exatamente um RG. Recursos de um RG podem estar em regiões diferentes.

**Resources** — os serviços individuais (VMs, Storage Accounts, bancos de dados, etc.).

```bash
# Criar Resource Group
az group create \
  --name rg-webapp-producao \
  --location brazilsouth \
  --tags Ambiente=Producao Projeto=WebApp Owner=rafael

# Listar recursos em um RG
az resource list \
  --resource-group rg-webapp-producao \
  --output table

# Mover recurso entre Resource Groups
az resource move \
  --destination-group rg-novo \
  --ids /subscriptions/{sub-id}/resourceGroups/rg-antigo/providers/Microsoft.Storage/storageAccounts/meu-storage
```

## Azure Resource Manager (ARM)

O ARM é a camada de gerenciamento do Azure. Toda operação — portal, CLI, PowerShell, SDK, API REST — passa pelo ARM.

```bash
# ARM Templates — infraestrutura como código
az deployment group create \
  --resource-group meu-rg \
  --template-file main.bicep \
  --parameters @parameters.json
```

**Bicep** é a linguagem moderna para IaC no Azure (substitui JSON do ARM Template):

```bicep
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'meuStorage2026'
  location: 'brazilsouth'
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
  }
}
```

## O que cai no exame

- Diferença entre Região, Par de Regiões e Zona de Disponibilidade
- Hierarquia: Management Group → Subscription → Resource Group → Resource
- Que Resource Groups são lógicos — recursos podem estar em regiões diferentes
- ARM como camada de gerenciamento unificada
- Regiões soberanas e quando usá-las
