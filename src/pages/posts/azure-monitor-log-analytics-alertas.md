---
layout: ../../layouts/PostLayout.astro
title: "Azure Monitor e Log Analytics: monitoramento que realmente funciona"
category: "Azure"
tag: "azure"
date: "09 Out 2025"
readTime: "10 min"
description: "Como centralizar logs, criar alertas úteis (não ruidosos) e usar KQL para investigar incidentes no Azure Monitor."
---

Azure Monitor é a plataforma central de observabilidade do Azure. Ele coleta métricas, logs e traces de todos os recursos Azure — e deixa tudo disponível para consulta, alerta e visualização. O problema não é falta de dados; é transformar o volume de dados em insights acionáveis.

## Log Analytics Workspace: o centro de tudo

```bash
# Criar workspace
az monitor log-analytics workspace create \
  --resource-group rg-monitoring \
  --workspace-name law-producao \
  --location brazilsouth \
  --retention-time 90  # dias de retenção

# Configurar diagnósticos de uma VM para o workspace
az monitor diagnostic-settings create \
  --resource $(az vm show -n minha-vm -g rg-app --query id -o tsv) \
  --name diag-vm \
  --workspace $(az monitor log-analytics workspace show \
    -n law-producao -g rg-monitoring --query id -o tsv) \
  --metrics '[{"category":"AllMetrics","enabled":true}]' \
  --logs '[{"category":"Administrative","enabled":true}]'
```

## KQL: as queries mais úteis

```kql
// Top 10 VMs por uso de CPU nas últimas 24h
Perf
| where TimeGenerated > ago(24h)
| where CounterName == "% Processor Time"
| summarize avg_cpu = avg(CounterValue) by Computer
| top 10 by avg_cpu desc

// Falhas de login nos últimos 7 dias
SigninLogs
| where TimeGenerated > ago(7d)
| where ResultType != "0"  // 0 = sucesso
| summarize failures = count() by UserPrincipalName, ResultDescription
| where failures > 5
| order by failures desc

// Recursos criados/deletados hoje
AzureActivity
| where TimeGenerated > ago(1d)
| where OperationNameValue has_any ("write", "delete")
| where ActivityStatusValue == "Success"
| project TimeGenerated, Caller, OperationNameValue, ResourceGroup, Resource
| order by TimeGenerated desc
```

## Alertas que não geram ruído

O erro mais comum é criar alertas que disparam com muita frequência — a equipe para de prestar atenção.

```bash
# Alerta de CPU alta — com threshold inteligente
az monitor metrics alert create \
  --name alert-cpu-alta \
  --resource-group rg-monitoring \
  --scopes $(az vm show -n minha-vm -g rg-app --query id -o tsv) \
  --condition "avg Percentage CPU > 90" \
  --window-size 15m \   # média de 15 min, não pico de 1 min
  --evaluation-frequency 5m \
  --severity 2 \
  --action $(az monitor action-group show -n ag-oncall -g rg-monitoring --query id -o tsv)
```

<div class="callout">
<strong>Boas práticas de alertas:</strong> Use janelas de tempo adequadas (15-30 min para CPU, não 1 min), configure supressão para evitar alertas repetitivos, e garanta que cada alerta tenha um runbook claro de como responder.
</div>

## Workbooks: dashboards operacionais

O Azure Monitor Workbooks permitem criar dashboards interativos com consultas KQL:

```json
{
  "type": "query",
  "query": "Perf | where CounterName == '% Processor Time' | make-series avg(CounterValue) on TimeGenerated step 5m by Computer | render timechart",
  "size": 0,
  "title": "CPU por VM (últimas 4h)"
}
```

## Conclusão

Azure Monitor com Log Analytics é poderoso quando bem configurado. Centralizar logs no mesmo workspace, usar KQL para investigações, alertas com janelas de tempo adequadas e workbooks para visualização são as práticas que transformam dados brutos em operações eficazes.
