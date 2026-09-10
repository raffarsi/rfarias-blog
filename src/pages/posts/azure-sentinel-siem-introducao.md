---
layout: ../../layouts/PostLayout.astro
title: "Microsoft Sentinel: SIEM nativo do Azure para deteccao de ameacas"
category: "Segurança"
tag: "seguranca"
date: "16 Out 2025"
readTime: "10 min"
description: "Como o Sentinel coleta logs, detecta ameacas com analytics rules e automatiza respostas com playbooks."
---

O Microsoft Sentinel e o SIEM (Security Information and Event Management) e SOAR (Security Orchestration, Automation and Response) nativo do Azure. Ele coleta dados de seguranca, detecta ameacas com machine learning e analytics rules, e automatiza respostas a incidentes.

## Habilitando o Sentinel

```bash
az sentinel onboarding-state create \
  --workspace-name law-security \
  --resource-group rg-security \
  --name default
```

## Data Connectors: fontes de dados

```bash
# Conector para Azure Active Directory / Entra ID
az sentinel data-connector create \
  --workspace-name law-security \
  --resource-group rg-security \
  --data-connector-kind AzureActiveDirectory \
  --name entra-id-connector

# Azure Activity (audit log da subscription)
az sentinel data-connector create \
  --workspace-name law-security \
  --resource-group rg-security \
  --data-connector-kind AzureActivity \
  --name azure-activity-connector
```

Conectores mais usados: Entra ID Sign-in logs, Azure Activity, Microsoft 365, Defender for Cloud, Windows Security Events.

## Analytics Rules: deteccao de ameacas

```kql
// Regra: muitas falhas de login seguidas de sucesso (password spray)
let failed_threshold = 10;
SigninLogs
| where TimeGenerated > ago(1d)
| where ResultType != "0"
| summarize FailedCount = count() by UserPrincipalName, bin(TimeGenerated, 1h)
| where FailedCount >= failed_threshold
| join kind=inner (
    SigninLogs
    | where TimeGenerated > ago(1d)
    | where ResultType == "0"
    | project SuccessTime = TimeGenerated, UserPrincipalName
) on UserPrincipalName
| where SuccessTime > TimeGenerated and SuccessTime < TimeGenerated + 30m
| project UserPrincipalName, FailedCount, SuccessTime
```

## Playbooks: automacao de resposta

Playbooks sao Logic Apps que executam automaticamente quando um incidente e criado:

```json
{
  "trigger": "When a Sentinel incident is created",
  "actions": [
    {
      "type": "EntraID_DisableUser",
      "userPrincipalName": "@{triggerBody()?['object']?['properties']?['relatedEntities']?[0]?['properties']?['userPrincipalName']}"
    },
    {
      "type": "Teams_PostMessage",
      "channel": "SOC-Alertas",
      "message": "Incidente criado: @{triggerBody()?['object']?['properties']?['title']}"
    }
  ]
}
```

## Custo: monitorar de perto

```kql
// Volume de dados ingeridos por conector nas ultimas 24h
Usage
| where TimeGenerated > ago(24h)
| where DataType != "Heartbeat"
| summarize GB = sum(Quantity) / 1024 by DataType, Solution
| order by GB desc
```

O Sentinel cobra por GB de dados ingeridos (~$2.46/GB). Habilite conectores seletivamente -- nem todos os logs de todos os servicos precisam ir para o Sentinel.

<div class="callout">
<strong>Regras de Analytics built-in:</strong> O Sentinel tem centenas de regras pre-configuradas que voce pode habilitar com um clique. Comece habilitando as regras para os conectores que voce ja tem ativos -- e um ponto de partida rapido sem precisar escrever KQL do zero.
</div>

## Conclusao

O Sentinel centraliza a visibilidade de seguranca que antes exigia correlacionar manualmente logs de multiplas fontes. Analytics rules para deteccao, incidents para triagem e playbooks para resposta automatica formam o loop completo de um SOC moderno. Para ambientes Azure, e a plataforma central de operacoes de seguranca.
