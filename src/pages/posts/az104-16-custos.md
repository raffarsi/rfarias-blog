---
layout: ../../layouts/PostLayout.astro
title: "AZ-104 na prática [16] — Gerenciamento de custos no Azure"
category: "FinOps"
tag: "finops"
serie: "AZ-104 na prática"
serieSlug: "az104"
serieNum: 16
date: "29 Ago 2026"
readTime: "8 min"
description: "Como monitorar, analisar e otimizar custos no Azure com Cost Management e estratégias de reserva."
prev:
  title: "AZ-104 [15] — Backup e ASR"
  slug: "az104-15-backup"

---

Gerenciar custos é parte do AZ-104 e uma habilidade essencial para qualquer administrador Azure. Custo não controlado é um dos principais problemas em ambientes cloud.

## Azure Cost Management + Billing

```bash
# Ver consumo atual da subscription
az consumption usage list \
  --start-date 2026-09-01 \
  --end-date 2026-09-08 \
  --output table

# Criar orçamento com alerta
az consumption budget create \
  --budget-name orcamento-mensal \
  --amount 5000 \
  --time-grain Monthly \
  --start-date 2026-09-01 \
  --end-date 2027-08-31 \
  --category Cost \
  --resource-group meu-rg
```

## Tags para rastreamento de custos

Tags permitem categorizar recursos por projeto, ambiente, owner:

```bash
# Aplicar tags a resource group
az group update \
  --name meu-rg \
  --tags Projeto=WebApp Ambiente=Producao Owner=rafael@empresa.com CostCenter=TI-001

# Aplicar tags a recurso específico
az resource tag \
  --ids /subscriptions/{sub-id}/resourceGroups/meu-rg/providers/Microsoft.Compute/virtualMachines/minha-vm \
  --tags Projeto=WebApp Ambiente=Producao
```

## Estratégias de economia

### Azure Reservations
Compromisso de 1 ou 3 anos em troca de desconto de até 72%:

```bash
# Ver economias potenciais com reservas
az consumption reservation detail list \
  --start-date 2026-08-01 \
  --end-date 2026-09-01
```

### Azure Hybrid Benefit
Se você tem licenças Windows Server ou SQL Server com Software Assurance:

```bash
# Habilitar Hybrid Benefit em VM Windows
az vm update \
  --resource-group meu-rg \
  --name minha-vm \
  --license-type Windows_Server
```

Economia de até 40% no custo da licença do SO.

### Spot VMs (instâncias de baixa prioridade)
Para workloads tolerantes a interrupção (batch, CI/CD):

```bash
az vm create \
  --resource-group meu-rg \
  --name vm-spot \
  --image Ubuntu2204 \
  --priority Spot \
  --eviction-policy Deallocate \
  --max-price 0.05
```

### Dev/Test Pricing
Subscriptions de Dev/Test têm preços reduzidos para ambientes não-produtivos.

## Azure Advisor

O Advisor analisa seu ambiente e faz recomendações em 5 categorias:

```bash
az advisor recommendation list \
  --category Cost \
  --output table
```

Recomendações comuns:
- Redimensionar ou desligar VMs subutilizadas
- Comprar reservas para recursos com uso consistente
- Excluir discos não associados a VMs
- Usar Hybrid Benefit para Windows VMs

<div class="callout">
<strong>Dica para o exame:</strong> Recursos em estado "Stopped" (via portal) ainda cobram pelo compute. Apenas recursos "Deallocated" param a cobrança de compute, mas ainda cobram por discos gerenciados anexados. Para zero cobrança, delete o recurso ou use Spot VMs.
</div>

## Azure Pricing Calculator vs TCO Calculator

**Pricing Calculator**, estima custo de recursos Azure específicos antes de criar.
**TCO Calculator**, calcula o custo total de propriedade comparando on-premises vs Azure para justificar migração.

## Alertas de orçamento

```bash
az monitor action-group create \
  --resource-group meu-rg \
  --name ag-custos \
  --short-name custos \
  --email-receiver name=financeiro address=financeiro@empresa.com

# Alerta quando atingir 80% do orçamento
az consumption budget create \
  --budget-name alerta-80-porcento \
  --amount 5000 \
  --time-grain Monthly \
  --notifications '[{
    "enabled": true,
    "operator": "GreaterThan",
    "threshold": 80,
    "contactEmails": ["financeiro@empresa.com"]
  }]'
```

## O que cai no exame

- Diferença entre Pricing Calculator (planejamento) e TCO Calculator (ROI de migração)
- Como Reservations e Hybrid Benefit reduzem custos
- Que Spot VMs podem ser desalocadas pelo Azure com 30s de aviso
- Que tags são para organização e rastreamento, não para segurança
- Azure Advisor como ferramenta de otimização
- Que discos cobram mesmo quando a VM está desalocada
