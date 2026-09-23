---
layout: ../../layouts/PostLayout.astro
title: "Gerenciamento de custos no Azure: do caos ao controle"
category: "FinOps"
tag: "finops"
date: "27 Nov 2025"
readTime: "9 min"
description: "Tags, budgets, alertas, reservas e Advisor: o fluxo completo para ter visibilidade e controle sobre os custos do ambiente Azure."
---

Custos do Azure fora de controle é um dos problemas mais comuns em organizações que adotam a nuvem sem uma estratégia de governança financeira. O Azure tem ferramentas nativas para cada etapa: o desafio é usar todas elas de forma integrada.

## Tags: o alicerce da visibilidade

Sem tags, você sabe quanto gasta no Azure total, mas não sabe quem ou o que está gerando cada custo. Tags transformam uma fatura única em um relatório por projeto, ambiente e centro de custo.

```bash
# Politica Azure para exigir tags obrigatorias em todos os recursos
az policy assignment create \
  --name "exigir-tags-projeto-ambiente" \
  --policy "726aca4c-86e9-4b04-b0c5-073027359532" \
  --scope "/subscriptions/{sub-id}"

# Tags essenciais
az tag create --resource-id {resource-id} --tags \
  projeto="plataforma-ia" \
  ambiente="producao" \
  centro-de-custo="CC-1234" \
  responsavel="rafael@empresa.com"
```

## Budgets e alertas

```bash
# Budget mensal com alertas em 80% e 100%
az consumption budget create \
  --budget-name budget-ia-mensal \
  --amount 5000 \
  --time-grain Monthly \
  --start-date "2025-11-01" \
  --end-date "2026-12-31" \
  --category Cost \
  --resource-group rg-ia \
  --notifications '[
    {"enabled":true,"operator":"GreaterThan","threshold":80,"contactEmails":["rafael@empresa.com"]},
    {"enabled":true,"operator":"GreaterThan","threshold":100,"contactEmails":["rafael@empresa.com","gestor@empresa.com"]}
  ]'
```

## Azure Advisor: recomendações de redução de custo

```bash
az advisor recommendation list \
  --category Cost \
  --query "[].{Problema:shortDescription.problem,Impacto:impact,Economia:extendedProperties.annualSavingsAmount}" \
  --output table
```

Recomendações típicas:
- VMs com CPU < 5% por 7 dias: desligar ou reduzir tamanho
- Reserved Instances para VMs com uso consistente
- Storage sem acesso nos últimos 30 dias
- Recursos órfãos (discos sem VM, IPs sem recurso)

## Reservas: até 72% de desconto

```bash
# Verificar elegibilidade antes de comprar
az consumption reservation summary list \
  --grain daily \
  --scope /subscriptions/{sub-id}

# Comprar reserva de 1 ano (via portal ou API)
# Avalie com a calculadora de precos antes
```

Antes de comprar: analise pelo menos 30 dias de uso para confirmar que o recurso roda continuamente. Reservas não se pagam para recursos intermitentes.

## Desligar ambientes de desenvolvimento automaticamente

```bash
# Azure Automation: desligar VMs de dev as 20h
az automation runbook create \
  --automation-account-name aa-gestao \
  --resource-group rg-ops \
  --name shutdown-dev-vms \
  --type PowerShell

# Script no runbook:
# Get-AzVM -ResourceGroupName rg-dev | Stop-AzVM -Force
```

## Consulta KQL para análise de custos por tag

```kql
// Custo por projeto (requer exportacao de dados de custo para Log Analytics)
AzureCostData
| where TimeGenerated > ago(30d)
| summarize Custo = sum(Cost) by tostring(Tags.projeto)
| order by Custo desc
```

## Conclusão

Controle de custos no Azure é um processo contínuo: tags para visibilidade, budgets para alertas precoces, Advisor para otimização e reservas para recursos previsíveis. A maioria das organizações começa sem tags e depois luta para entender de onde vem o custo. Investir 1 dia em configurar tags e budgets no início poupa semanas de investigação depois.
