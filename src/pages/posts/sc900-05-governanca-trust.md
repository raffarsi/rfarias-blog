---
layout: ../../layouts/PostLayout.astro
title: "SC-900 na prática [5] — Governança e Service Trust Portal"
category: "Azure"
tag: "azure"
serie: "SC-900 na prática"
serieNum: 5
date: "25 Abr 2026"
readTime: "8 min"
description: "Service Trust Portal, Microsoft Privacy, Secure Score e as ferramentas de governança para o SC-900."
prev:
  title: "SC-900 na prática [4] — Conformidade e Purview"
  slug: "sc900-04-conformidade-purview"
---

Governança e transparência são diferenciais competitivos da Microsoft no mercado corporativo. Este artigo cobre as ferramentas que demonstram e gerenciam a postura de segurança.

## Microsoft Service Trust Portal

Portal central para documentos de auditoria, certificações e relatórios de conformidade da Microsoft:

**URL:** servicetrust.microsoft.com

**O que você encontra:**
- Relatórios de auditoria SOC 1, SOC 2, SOC 3
- Certificações ISO 27001, ISO 27018, ISO 27701
- Relatórios FedRAMP, HIPAA, PCI DSS
- Avaliações de conformidade GDPR
- Guias de implementação para regulamentos

```bash
# Verificar certificações do Azure programaticamente via Compliance API
az rest --method GET \
  --url "https://management.azure.com/providers/Microsoft.PolicyInsights/policyStates/latest/queryResults?api-version=2019-10-01" \
  --query "value[0].complianceState"
```

## Microsoft Trust Center

trust.microsoft.com — hub de informações sobre segurança, privacidade e conformidade da Microsoft. Explica como produtos Microsoft protegem dados de clientes.

## Privacy Dashboard

privacy.microsoft.com — permite que usuários visualizem e controlem dados coletados pela Microsoft:
- Histórico de pesquisa e atividade
- Dados de localização
- Preferências de privacidade
- Exportação de dados (direito de portabilidade — GDPR)

## Microsoft Secure Score

Métrica agregada da postura de segurança no Microsoft 365 e Azure:

```bash
# Ver Secure Score via API
az rest --method GET \
  --url "https://graph.microsoft.com/v1.0/security/secureScores" \
  --query "value[0].{Score:currentScore, Max:maxScore, Percentual:averageComparativeScores[0].averageScore}"
```

**Como melhorar:**
- Habilitar MFA para todos os administradores (+10 pontos)
- Habilitar auditoria de caixa de email (+5 pontos)
- Configurar DLP para dados sensíveis (+8 pontos)
- Habilitar proteção contra ameaças (+12 pontos)

## Azure Policy e Conformidade

```bash
# Dashboard de conformidade
az policy state summarize \
  --query "{Conforme:results.resourceDetails[?complianceState=='Compliant'].count, NaoConforme:results.resourceDetails[?complianceState=='NonCompliant'].count}"

# Exportar relatório de conformidade
az policy state list \
  --all \
  --query "[].{Recurso:resourceId, Politica:policyDefinitionName, Estado:complianceState, Data:timestamp}" \
  --output table > relatorio-conformidade.txt
```

## Data Protection Addendum (DPA)

Compromisso contratual da Microsoft sobre processamento de dados:
- Como Microsoft processa dados de clientes
- Medidas técnicas e organizacionais de segurança
- Suporte a DSARs (Data Subject Access Requests)
- Conformidade com GDPR, LGPD e outros regulamentos

Disponível para download no Service Trust Portal.

## Azure Information Protection Scanner

Varre compartilhamentos de arquivo e SharePoint on-premises para descobrir e classificar dados sensíveis:

```powershell
# Instalar e configurar o scanner
Install-AIPScanner -SqlServerInstance "MEUSERVIDOR\SQLEXPRESS" -Profile "AIPScanner"

# Configurar política de scan
Set-AIPScannerConfiguration -DiscoverInformationTypes All

# Iniciar scan
Start-AIPScan
Get-AIPScannerStatus
```

<div class="callout">
<strong>Dica para o exame:</strong> O SC-900 frequentemente pergunta onde encontrar documentos de auditoria e certificações da Microsoft. A resposta é sempre o Service Trust Portal (servicetrust.microsoft.com), não o Azure Portal ou o Trust Center.
</div>

## Privacidade como padrão (Privacy by Default)

A Microsoft implementa privacidade como padrão em seus produtos:
- Configurações de privacidade mais restritivas são o padrão
- Usuários optam por compartilhar mais, não por compartilhar menos
- Coleta mínima de dados (minimização)
- Dados usados apenas para a finalidade declarada (limitação de propósito)

## O que cai no exame

- Service Trust Portal: relatórios de auditoria e certificações
- Trust Center: informações sobre segurança e privacidade
- Privacy Dashboard: controle de dados pessoais pelo usuário
- Microsoft Secure Score: métrica de postura de segurança
- DPA como compromisso contratual de proteção de dados
- Privacy by Default e Privacy by Design
