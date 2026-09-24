---
layout: ../../layouts/PostLayout.astro
title: "Azure Firewall IDPS e Threat Intelligence: configuração prática e análise de alertas"
category: "Networking"
tag: "networking"
date: "29 Nov 2025"
readTime: "10 min"
description: "IDPS no Azure Firewall Premium detecta ameaças conhecidas por assinatura. Como configurar, analisar alertas no Log Analytics e ajustar para reduzir falsos positivos em produção."
---

IDPS e Threat Intelligence são recursos que a maioria habilita em modo Alert, nunca analisa os alertas e depois ativa modo Deny esperando que funcione. O resultado: centenas de alertas por dia que ninguém vê, ou bloqueios inesperados em produção que o time leva horas para diagnosticar.

Existe uma sequência que funciona.

## A diferença entre os dois

**Threat Intelligence:** bloqueia IPs e domínios conhecidamente maliciosos com base em feeds da Microsoft. Mais simples, menos falsos positivos, habilite em Alert ou Deny desde o início.

**IDPS:** analisa o conteúdo dos pacotes por padrões de ataque usando assinaturas. Mais granular, mais falsos positivos possíveis. Comece em Alert, analise por duas semanas antes de ir para Deny.

```bicep
resource firewallPolicy 'Microsoft.Network/firewallPolicies@2023-09-01' = {
  properties: {
    sku: { tier: 'Premium' }
    threatIntelMode: 'Deny'   // Threat Intel pode ir para Deny direto
    intrusionDetection: {
      mode: 'Alert'           // IDPS comeca em Alert
      configuration: {
        signatureOverrides: []
        privateRanges: [
          '10.0.0.0/8'
          '172.16.0.0/12'
          '192.168.0.0/16'
        ]
      }
    }
  }
}
```

## Analisando os alertas antes de ativar Deny

```kql
// Top assinaturas que mais disparam
AzureDiagnostics
| where Category == "AzureFirewallIDSLog"
| summarize count() by SignatureId_s, Description_s, Action_s
| order by count_ desc
| take 20
```

Para cada assinatura frequente: é tráfego legítimo ou malicioso? Se for tráfego legitimo, adicione a exclusão antes de ir para Deny.

## Excluindo assinaturas que geram falsos positivos confirmados

```bicep
intrusionDetection: {
  mode: 'Alert'
  configuration: {
    signatureOverrides: [
      {
        id: '2008983'
        mode: 'Off'
      }
    ]
  }
}
```

## O processo que funciona

Duas semanas em Alert, analisar os top 20 alertas, confirmar quais são falsos positivos, criar exclusões para esses, mudar para Deny, monitorar a primeira semana em Deny com atenção.

Não pule a fase de Alert. Já vi ambientes onde ir direto para Deny bloqueou tráfego de atualização de SO, tráfego de monitoramento e até tráfego de DNS interno, porque as assinaturas confundiram padrões legítimos com ataques.

IDPS em produção é um recurso que exige operação ativa, não é configure-e-esqueça.
