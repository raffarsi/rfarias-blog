---
layout: ../../layouts/PostLayout.astro
title: "Azure Firewall IDPS e Threat Intelligence: configuração prática e análise de alertas"
category: "Networking"
tag: "networking"
date: "29 Nov 2025"
readTime: "10 min"
description: "IDPS no Azure Firewall Premium detecta ameaças conhecidas por assinatura. Como configurar, analisar alertas no Log Analytics e ajustar para reduzir falsos positivos em produção."
---

O IDPS (Intrusion Detection and Prevention System) e o Threat Intelligence do Azure Firewall Premium são frequentemente habilitados sem uma estratégia clara de como gerenciar os alertas. O resultado: centenas de alertas por dia que ninguém analisa, ou modo Deny que bloqueia tráfego legítimo sem que ninguém entenda por quê.

## IDPS vs Threat Intelligence, a diferença

**Threat Intelligence:** bloqueia IPs e domínios conhecidamente maliciosos com base em feeds de inteligência da Microsoft. É mais simples, uma lista de "nunca permitir isso".

**IDPS:** analisa o conteúdo do tráfego por padrões de ataque usando assinaturas (SQL injection em URLs, payloads de malware, C2 traffic). Mais granular, mais falsos positivos possíveis.

## Habilitando Threat Intelligence

```bicep
resource firewallPolicy 'Microsoft.Network/firewallPolicies@2023-09-01' = {
  properties: {
    sku: { tier: 'Premium' }
    threatIntelMode: 'Deny'     // Alert = loga, Deny = bloqueia
    threatIntelWhitelist: {
      fqdns: ['meu-fornecedor-legado.com']    // exceções necessárias
      ipAddresses: ['203.0.113.50']
    }
  }
}
```

## Habilitando IDPS

```bicep
intrusionDetection: {
  mode: 'Alert'    // Comece em Alert, mova para Deny depois de análise
  configuration: {
    signatureOverrides: [
      // Desabilitar assinaturas que geram falsos positivos confirmados
      {
        id: '2008983'   // ID da assinatura
        mode: 'Off'
      }
    ]
    privateRanges: [    // Excluir tráfego interno da inspeção IDPS
      '10.0.0.0/8'
      '172.16.0.0/12'
      '192.168.0.0/16'
    ]
  }
}
```

## Analisando alertas no Log Analytics

```kql
// Top 20 assinaturas que mais disparam
AzureDiagnostics
| where Category == "AzureFirewallIDSLog"
| summarize count() by SignatureId_s, Description_s, Action_s
| order by count_ desc
| take 20
```

```kql
// Alertas por IP de origem, identificar se é tráfego interno ou externo
AzureDiagnostics
| where Category == "AzureFirewallIDSLog"
| where Action_s == "Alert"
| summarize count() by SourceIp_s, DestinationIp_s, SignatureId_s, Description_s
| order by count_ desc
```

```kql
// Tráfego bloqueado pelo Threat Intelligence
AzureDiagnostics
| where Category == "AzureFirewallNetworkRule"
| where Action_s == "Deny"
| where ThreatIntelCategory_s != ""
| project TimeGenerated, SourceIp_s, DestinationIp_s, ThreatIntelCategory_s
| order by TimeGenerated desc
```

## Processo para mover de Alert para Deny

Antes de ativar modo Deny no IDPS, faça esse processo:

1. **Semana 1-2:** IDPS em Alert, analisar os top 20 alertas
2. **Para cada alerta frequente:** verificar se é tráfego legítimo ou malicioso
3. **Tráfego legítimo que dispara alerta:** adicionar à `signatureOverrides` com modo Off
4. **Após 2 semanas sem falsos positivos confirmados:** mover para Deny

<div class="callout">
<strong>Performance com IDPS:</strong> O IDPS processa o payload de cada pacote, não só headers. Isso tem impacto de CPU no Firewall. Monitore a utilização de CPU do Azure Firewall após habilitar IDPS, se estiver consistentemente acima de 80%, considere aumentar a capacidade ou revisar quais regras de aplicação estão com IDPS habilitado.
</div>

## Alertas no Azure Monitor

```bash
# Criar alerta para IDPS em modo Deny bloqueando alto volume
az monitor scheduled-query create \
  --name alert-idps-alto-volume \
  --resource-group rg-monitoring \
  --scopes $(az monitor log-analytics workspace show \
    -n law-security -g rg-monitoring --query id -o tsv) \
  --condition "count > 100" \
  --condition-query "AzureDiagnostics | where Category == 'AzureFirewallIDSLog' | where Action_s == 'Deny'" \
  --evaluation-frequency 5m \
  --window-size 15m \
  --severity 2
```

## Conclusão

IDPS e Threat Intelligence são eficazes quando há um processo de análise de alertas por trás. Habilitar em modo Deny sem análise prévia causa bloqueios inesperados; habilitar em modo Alert sem analisar os logs não adiciona segurança real. O valor está no processo: Alert → análise → ajuste de assinaturas → Deny.
