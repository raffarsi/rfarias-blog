---
layout: ../../layouts/PostLayout.astro
title: "AZ-104 na prática [14] — Azure Monitor e Log Analytics"
category: "Azure"
tag: "azure"
serie: "AZ-104 na prática"
serieNum: 14
date: "8 Set 2026"
readTime: "9 min"
description: "Monitoramento de recursos Azure com Azure Monitor, Log Analytics e alertas."
prev:
  title: "AZ-104 na prática [13] — VPN e ExpressRoute"
  slug: "az104-13-vpn-expressroute"
next:
  title: "AZ-104 na prática [15] — Backup e Site Recovery"
  slug: "az104-15-backup"
---

Monitorar o ambiente Azure é fundamental para garantir disponibilidade, performance e segurança. O Azure Monitor é a plataforma central para coleta e análise de dados de telemetria.

## Tipos de dados no Azure Monitor

**Métricas** — valores numéricos coletados em intervalos regulares (CPU %, bytes de rede, IOPS). Retidos por 93 dias por padrão.

**Logs** — registros estruturados de eventos e operações. Armazenados no Log Analytics Workspace, retidos por 30 dias por padrão (configurável até 2 anos).

## Log Analytics Workspace

```bash
# Criar workspace
az monitor log-analytics workspace create \
  --resource-group meu-rg \
  --workspace-name meu-workspace \
  --location brazilsouth \
  --sku PerGB2018 \
  --retention-time 90

# Conectar VM ao workspace (via Azure Monitor Agent)
az vm extension set \
  --resource-group meu-rg \
  --vm-name minha-vm \
  --name AzureMonitorLinuxAgent \
  --publisher Microsoft.Azure.Monitor \
  --version 1.0
```

## Queries KQL

KQL (Kusto Query Language) é a linguagem de consulta do Log Analytics:

```kql
// VMs com CPU acima de 90% nas últimas 24h
Perf
| where TimeGenerated > ago(24h)
| where ObjectName == "Processor" and CounterName == "% Processor Time"
| where CounterValue > 90
| summarize MaxCPU = max(CounterValue) by Computer
| order by MaxCPU desc

// Falhas de login nas últimas 6h
SecurityEvent
| where TimeGenerated > ago(6h)
| where EventID == 4625
| summarize FailedLogins = count() by Account, Computer
| where FailedLogins > 5
| order by FailedLogins desc

// Eventos de criação de recursos
AzureActivity
| where TimeGenerated > ago(7d)
| where OperationNameValue endswith "write"
| where ActivityStatusValue == "Success"
| project TimeGenerated, Caller, ResourceGroup, ResourceId
```

## Alertas

```bash
# Alerta de métrica: CPU > 80% por 5 minutos
az monitor metrics alert create \
  --name alerta-cpu \
  --resource-group meu-rg \
  --scopes /subscriptions/{sub-id}/resourceGroups/meu-rg/providers/Microsoft.Compute/virtualMachines/minha-vm \
  --condition "avg Percentage CPU > 80" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action /subscriptions/{sub-id}/resourceGroups/meu-rg/providers/microsoft.insights/actionGroups/meu-ag \
  --severity 2

# Criar action group
az monitor action-group create \
  --resource-group meu-rg \
  --name meu-ag \
  --short-name ag \
  --email-receiver name=admin address=admin@empresa.com
```

## Diagnostic Settings

Configure quais logs e métricas são enviados para onde:

```bash
az monitor diagnostic-settings create \
  --resource /subscriptions/{sub-id}/resourceGroups/meu-rg/providers/Microsoft.Network/networkSecurityGroups/nsg-web \
  --name diag-nsg \
  --workspace /subscriptions/{sub-id}/resourceGroups/meu-rg/providers/Microsoft.OperationalInsights/workspaces/meu-workspace \
  --logs '[{"category": "NetworkSecurityGroupFlowEvent", "enabled": true}]'
```

<div class="callout">
<strong>Dica para o exame:</strong> Application Insights é um subcomponente do Azure Monitor para monitoramento de aplicações (disponibilidade, performance, exceções). Pode ser baseado em workspace (recomendado) ou clássico. O SDK do Application Insights permite instrumentação personalizada no código.
</div>

## Network Watcher

```bash
# Verificar conectividade entre dois recursos
az network watcher test-connectivity \
  --source-resource /subscriptions/{sub-id}/resourceGroups/meu-rg/providers/Microsoft.Compute/virtualMachines/vm-origem \
  --dest-address 10.0.2.4 \
  --dest-port 443

# Capturar pacotes de rede
az network watcher packet-capture create \
  --resource-group meu-rg \
  --vm minha-vm \
  --name captura-01 \
  --storage-account meu-storage \
  --time-limit 300
```

## O que cai no exame

- Diferença entre Métricas (tempo real) e Logs (histórico, KQL)
- Como configurar alertas de métrica e de log
- Que Diagnostic Settings conectam recursos ao Log Analytics
- Application Insights e seus recursos (availabilty tests, live metrics)
- Network Watcher para troubleshooting de rede
