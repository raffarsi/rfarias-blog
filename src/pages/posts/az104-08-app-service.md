---
layout: ../../layouts/PostLayout.astro
title: "AZ-104 na prática [8] — Azure App Service"
category: "Infra"
tag: "azure"
serie: "AZ-104 na prática"
serieSlug: "az104"
serieNum: 8
date: "4 Jul 2026"
readTime: "9 min"
description: "Deploy de aplicações web no Azure App Service: planos, slots, scaling e configurações."
prev:
  title: "AZ-104 [7] — VMs: Disponibilidade"
  slug: "az104-07-vm-disponibilidade"
next:
  title: "AZ-104 [9] — Containers e AKS"
  slug: "az104-09-containers-aks"

---

Azure App Service é a plataforma PaaS para hospedar aplicações web, APIs REST e backends móveis. Sem gerenciar infraestrutura, você foca no código.

## App Service Plans

O plano define os recursos computacionais. Múltiplas apps podem compartilhar o mesmo plano.

| Tier | Uso | Recursos |
|------|-----|---------|
| Free/Shared | Dev/Test | Compartilhado, sem SLA |
| Basic | Dev/Test | Dedicado, sem auto-scale |
| Standard | Produção | Auto-scale, slots (5), backup |
| Premium | Produção crítica | Mais recursos, slots (20), VNet |
| Isolated | Máximo isolamento | Ambiente dedicado (ASE) |

```bash
# Criar App Service Plan
az appservice plan create \
  --name meu-plano \
  --resource-group meu-rg \
  --sku S1 \
  --is-linux \
  --location brazilsouth

# Criar Web App
az webapp create \
  --resource-group meu-rg \
  --plan meu-plano \
  --name minha-webapp-2026 \
  --runtime "NODE:18-lts"
```

## Deployment Slots

Slots permitem ambientes paralelos (staging, QA) com swap sem downtime:

```bash
# Criar slot de staging
az webapp deployment slot create \
  --name minha-webapp-2026 \
  --resource-group meu-rg \
  --slot staging

# Deploy no slot de staging
az webapp deploy \
  --resource-group meu-rg \
  --name minha-webapp-2026 \
  --slot staging \
  --src-path ./app.zip

# Swap staging → production
az webapp deployment slot swap \
  --resource-group meu-rg \
  --name minha-webapp-2026 \
  --slot staging \
  --target-slot production
```

<div class="callout">
<strong>Dica para o exame:</strong> Slots têm suas próprias configurações de app settings. Algumas configurações são "slot-sticky" — não mudam com o swap. Marque as configurações como "Deployment slot setting" para que não sejam trocadas durante o swap.
</div>

## Auto-scaling

```bash
az monitor autoscale create \
  --resource-group meu-rg \
  --resource minha-webapp-2026 \
  --resource-type Microsoft.Web/sites \
  --name autoscale-web \
  --min-count 1 \
  --max-count 10 \
  --count 2

az monitor autoscale rule create \
  --resource-group meu-rg \
  --autoscale-name autoscale-web \
  --condition "CpuPercentage > 80 avg 5m" \
  --scale out 2
```

## App Settings e Connection Strings

```bash
az webapp config appsettings set \
  --resource-group meu-rg \
  --name minha-webapp-2026 \
  --settings \
    ENVIRONMENT=production \
    API_KEY=@Microsoft.KeyVault(SecretUri=https://meu-kv.vault.azure.net/secrets/api-key/)

az webapp config connection-string set \
  --resource-group meu-rg \
  --name minha-webapp-2026 \
  --settings DefaultConnection="Server=meu-sql..." \
  --connection-string-type SQLAzure
```

## Managed Identity na Web App

```bash
# Habilitar identidade gerenciada
az webapp identity assign \
  --resource-group meu-rg \
  --name minha-webapp-2026

# Dar acesso ao Key Vault
az keyvault set-policy \
  --name meu-kv \
  --object-id $(az webapp identity show --resource-group meu-rg --name minha-webapp-2026 --query principalId -o tsv) \
  --secret-permissions get list
```

## O que cai no exame

- Tiers do App Service Plan e o que cada um oferece
- Deployment slots e como o swap funciona
- Configurações slot-sticky
- Diferença entre scale up (mudar o plano) e scale out (mais instâncias)
- Como integrar com Key Vault via Managed Identity
