---
layout: ../../layouts/PostLayout.astro
title: "Conformidade regulatoria no Azure: LGPD, PCI-DSS e ISO 27001"
category: "Segurança"
tag: "seguranca"
date: "25 Dez 2025"
readTime: "9 min"
description: "Como o Microsoft Defender for Cloud mapeia controles para frameworks regulatorios e gera evidencias de conformidade para auditorias."
---

Demonstrar conformidade com LGPD, PCI-DSS, ISO 27001 ou qualquer outro framework regulatorio em ambientes Azure e um processo que pode ser significativamente automatizado -- em vez de depender de evidencias coletadas manualmente a cada ciclo de auditoria.

## Como o Defender for Cloud mapeia frameworks

O Defender for Cloud tem um modulo de conformidade regulatoria que avalia continuamente seus recursos contra os controles de cada framework:

```bash
# Ver frameworks de conformidade disponiveis
az security regulatory-compliance-standards list

# Ver status por controle em um framework especifico
az security regulatory-compliance-controls list \
  --standard-name "PCI-DSS" \
  --query "[].{Controle:id,Status:state,Recursos:passedResources}" \
  --output table
```

Frameworks disponiveis nativamente:
- CIS Microsoft Azure Foundations Benchmark
- ISO 27001:2013
- PCI DSS v4.0
- NIST SP 800-53
- SOC TSP (para SaaS)
- Mapeamento para LGPD (via controles de privacidade)

## Exportando evidencias para auditoria

```bash
# Exportar status de conformidade em JSON (para o auditor)
az security regulatory-compliance-controls list \
  --standard-name "ISO-27001" \
  --output json > evidencias-iso27001-$(date +%Y%m).json

# Configurar exportacao continua para Log Analytics
az security auto-provisioning-setting update \
  --auto-provision On \
  --name MicrosoftMonitoringAgent
```

## Controles criticos por framework

**LGPD -- controles tecnicos que o Azure facilita demonstrar:**
- Criptografia de dados em repouso (Azure Storage, SQL com TDE habilitado)
- Controle de acesso baseado em necessidade (RBAC + PIM)
- Logs de auditoria de acesso a dados pessoais (Audit logs no Entra ID)
- Capacidade de exclusao de dados (Azure Policy para retencao)

**PCI-DSS -- controles de rede:**
```bash
# Verificar se todos os recursos de pagamento tem acesso publico bloqueado
az network public-ip list \
  --query "[?ipAddress!=null].{Nome:name,IP:ipAddress,Associado:ipConfiguration.id}" \
  --output table
```

**ISO 27001 -- controles operacionais:**
- A.9 Controle de acesso: demonstrado via Entra ID + Acesso Condicional + PIM
- A.10 Criptografia: Azure Key Vault + customer-managed keys
- A.12 Seguranca de operacoes: Azure Monitor + Log Analytics
- A.16 Gestao de incidentes: Microsoft Sentinel + playbooks de resposta

## Azure Policy como evidencia de conformidade

Policies com efeito Audit geram evidencias automaticas:

```bash
# Criar relatorio de conformidade de politicas
az policy state summarize \
  --scope "/subscriptions/{sub-id}" \
  --query "results[].{Politica:policyDefinitionReferenceId,Conformes:results[0].resourceDetails[?complianceState=='Compliant'].count,NaoConformes:results[0].resourceDetails[?complianceState=='NonCompliant'].count}"
```

## Dashboard de conformidade ao longo do tempo

```kql
// Evolucao do score de conformidade no ultimo trimestre
SecurityRegulatoryCompliance
| where TimeGenerated > ago(90d)
| where AssessmentName == "PCI-DSS"
| summarize PassedControls = countif(State == "Passed"),
    FailedControls = countif(State == "Failed")
    by bin(TimeGenerated, 7d)
| order by TimeGenerated asc
```

<div class="callout">
<strong>Conformidade nao e auditoria:</strong> O dashboard de conformidade do Defender for Cloud mostra o estado atual dos controles tecnicos -- nao substitui uma auditoria formal conduzida por auditor independente. Mas gera evidencias solidas que aceleram significativamente o processo de auditoria.
</div>

## Conclusao

Conformidade regulatoria no Azure passa de um processo manual e estressante para um processo continuo e auditavel quando voce usa Defender for Cloud, Azure Policy e Sentinel de forma integrada. As evidencias existem continuamente -- a auditoria vira um exercicio de exportar e apresentar o que ja esta coletado, nao de correr para coletar antes da data.
