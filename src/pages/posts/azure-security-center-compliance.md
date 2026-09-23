---
layout: ../../layouts/PostLayout.astro
title: "Conformidade regulatória no Azure: LGPD, PCI-DSS e ISO 27001"
category: "Segurança"
tag: "seguranca"
date: "25 Dez 2025"
readTime: "9 min"
description: "Como o Microsoft Defender for Cloud mapeia controles para frameworks regulatórios e gera evidências de conformidade para auditorias."
---

Demonstrar conformidade com LGPD, PCI-DSS, ISO 27001 ou qualquer outro framework regulatório em ambientes Azure é um processo que pode ser significativamente automatizado, em vez de depender de evidências coletadas manualmente a cada ciclo de auditoria.

## Como o Defender for Cloud mapeia frameworks

O Defender for Cloud tem um módulo de conformidade regulatória que avalia continuamente seus recursos contra os controles de cada framework:

```bash
# Ver frameworks de conformidade disponiveis
az security regulatory-compliance-standards list

# Ver status por controle em um framework especifico
az security regulatory-compliance-controls list \
  --standard-name "PCI-DSS" \
  --query "[].{Controle:id,Status:state,Recursos:passedResources}" \
  --output table
```

Frameworks disponíveis nativamente:
- CIS Microsoft Azure Foundations Benchmark
- ISO 27001:2013
- PCI DSS v4.0
- NIST SP 800-53
- SOC TSP (para SaaS)
- Mapeamento para LGPD (via controles de privacidade)

## Exportando evidências para auditoria

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

## Controles críticos por framework

**LGPD: controles técnicos que o Azure facilita demonstrar:**
- Criptografia de dados em repouso (Azure Storage, SQL com TDE habilitado)
- Controle de acesso baseado em necessidade (RBAC + PIM)
- Logs de auditoria de acesso a dados pessoais (Audit logs no Entra ID)
- Capacidade de exclusão de dados (Azure Policy para retenção)

**PCI-DSS: controles de rede:**
```bash
# Verificar se todos os recursos de pagamento tem acesso publico bloqueado
az network public-ip list \
  --query "[?ipAddress!=null].{Nome:name,IP:ipAddress,Associado:ipConfiguration.id}" \
  --output table
```

**ISO 27001: controles operacionais:**
- A.9 Controle de acesso: demonstrado via Entra ID + Acesso Condicional + PIM
- A.10 Criptografia: Azure Key Vault + customer-managed keys
- A.12 Segurança de operações: Azure Monitor + Log Analytics
- A.16 Gestão de incidentes: Microsoft Sentinel + playbooks de resposta

## Azure Policy como evidência de conformidade

Policies com efeito Audit geram evidências automáticas:

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
<strong>Conformidade não é auditoria:</strong> O dashboard de conformidade do Defender for Cloud mostra o estado atual dos controles técnicos, mas não substitui uma auditoria formal conduzida por auditor independente. Mas gera evidências sólidas que aceleram significativamente o processo de auditoria.
</div>

## Conclusão

Conformidade regulatória no Azure passa de um processo manual e estressante para um processo contínuo e auditável quando você usa Defender for Cloud, Azure Policy e Sentinel de forma integrada. As evidências existem continuamente: a auditoria vira um exercício de exportar e apresentar o que já está coletado, não de correr para coletar antes da data.
