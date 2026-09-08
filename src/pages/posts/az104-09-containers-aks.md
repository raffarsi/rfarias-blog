---
layout: ../../layouts/PostLayout.astro
title: "AZ-104 na prática [9] — Containers: ACI e AKS"
category: "Azure"
tag: "azure"
serie: "AZ-104 na prática"
serieNum: 9
date: "28 Ago 2026"
readTime: "10 min"
description: "Azure Container Instances para containers simples e Azure Kubernetes Service para orquestração."
prev:
  title: "AZ-104 na prática [8] — App Service"
  slug: "az104-08-app-service"
next:
  title: "AZ-104 na prática [10] — VNets e subnets"
  slug: "az104-10-vnets-subnets"
---

Containers são cada vez mais presentes nos ambientes Azure. O AZ-104 cobre dois serviços principais: Azure Container Instances (ACI) para casos simples e Azure Kubernetes Service (AKS) para orquestração em escala.

## Azure Container Instances (ACI)

ACI é a forma mais simples de executar containers no Azure — sem gerenciar VMs ou clusters:

```bash
# Executar container simples
az container create \
  --resource-group meu-rg \
  --name meu-container \
  --image nginx:latest \
  --cpu 1 \
  --memory 1.5 \
  --ports 80 \
  --ip-address public \
  --dns-name-label meu-app-2026

# Ver logs
az container logs \
  --resource-group meu-rg \
  --name meu-container

# Container com variáveis de ambiente
az container create \
  --resource-group meu-rg \
  --name meu-app \
  --image meuregistro.azurecr.io/minha-app:v1 \
  --registry-login-server meuregistro.azurecr.io \
  --registry-username meuregistro \
  --registry-password {acr-password} \
  --environment-variables \
    ENVIRONMENT=production \
    DB_HOST=meudb.database.windows.net
```

## Azure Container Registry (ACR)

Registro privado para imagens Docker:

```bash
# Criar ACR
az acr create \
  --resource-group meu-rg \
  --name meuregistro2026 \
  --sku Standard

# Build e push de imagem
az acr build \
  --registry meuregistro2026 \
  --image minha-app:v1 \
  --file Dockerfile .

# Habilitar Admin user
az acr update \
  --name meuregistro2026 \
  --admin-enabled true
```

## Azure Kubernetes Service (AKS)

AKS gerencia a complexidade do Kubernetes — control plane é gerenciado pela Microsoft:

```bash
# Criar cluster AKS
az aks create \
  --resource-group meu-rg \
  --name meu-cluster \
  --node-count 2 \
  --node-vm-size Standard_D2s_v3 \
  --enable-addons monitoring \
  --generate-ssh-keys \
  --zones 1 2 3 \
  --enable-managed-identity

# Conectar ao cluster
az aks get-credentials \
  --resource-group meu-rg \
  --name meu-cluster

# Verificar nós
kubectl get nodes

# Scale do cluster
az aks scale \
  --resource-group meu-rg \
  --name meu-cluster \
  --node-count 5

# Atualizar versão do Kubernetes
az aks upgrade \
  --resource-group meu-rg \
  --name meu-cluster \
  --kubernetes-version 1.29.0
```

## Integração AKS com ACR

```bash
az aks update \
  --name meu-cluster \
  --resource-group meu-rg \
  --attach-acr meuregistro2026
```

<div class="callout">
<strong>Dica para o exame:</strong> ACI cobra por segundo de execução — ideal para workloads batch ou tarefas intermitentes. AKS é para aplicações de longa duração que precisam de orquestração, auto-scaling e service discovery. Para o AZ-104, o foco é nos conceitos básicos de AKS, não em Kubernetes avançado.
</div>

## Node Pools

AKS suporta múltiplos node pools com configurações diferentes:

```bash
az aks nodepool add \
  --resource-group meu-rg \
  --cluster-name meu-cluster \
  --name gpupool \
  --node-count 1 \
  --node-vm-size Standard_NC6s_v3 \
  --mode User
```

## O que cai no exame

- Diferença entre ACI (simples, serverless) e AKS (orquestrado)
- Que AKS gerencia o control plane — você gerencia apenas os worker nodes
- Como integrar ACR com AKS via Managed Identity
- Node pools system vs user
- Como fazer upgrades de versão do Kubernetes no AKS
