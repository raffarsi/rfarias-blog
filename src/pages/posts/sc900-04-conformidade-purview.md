---
layout: ../../layouts/PostLayout.astro
title: "SC-900 na prática [4] — Conformidade e Microsoft Purview"
category: "Azure"
tag: "azure"
serie: "SC-900 na prática"
serieSlug: "sc900"
serieNum: 4
date: "21 Abr 2026"
readTime: "9 min"
description: "GDPR, Compliance Manager, Microsoft Purview e as ferramentas de conformidade da Microsoft."
prev:
  title: "SC-900 [3] — Soluções de Segurança"
  slug: "sc900-03-solucoes-seguranca"
next:
  title: "SC-900 [5] — Governança"
  slug: "sc900-05-governanca-trust"

---

Conformidade regulatória é obrigatória em setores como financeiro, saúde e governo. O SC-900 cobre as ferramentas Microsoft para gerenciar esses requisitos.

## Conceitos de conformidade

**GDPR** — Regulamento europeu de proteção de dados pessoais. Princípios: consentimento, minimização, transparência, direito ao esquecimento.

**ISO 27001** — Padrão internacional para gestão de segurança da informação.

**SOC 2** — Relatório de auditoria para provedores de serviço sobre segurança, disponibilidade e privacidade.

**PCI DSS** — Padrão para organizações que processam cartões de pagamento.

**HIPAA** — Lei americana de proteção de dados de saúde.

## Microsoft Purview

Suite unificada de governança, conformidade e segurança de dados:

### Information Protection — Rótulos de Sensibilidade

```powershell
# Criar rótulo de sensibilidade (via PowerShell)
Connect-IPPSSession

New-Label -Name "Confidencial" `
  -DisplayName "Confidencial" `
  -Tooltip "Dados confidenciais da empresa" `
  -EncryptionEnabled $true `
  -EncryptionProtectionType Template `
  -SiteAndGroupProtectionEnabled $true

# Publicar rótulo
New-LabelPolicy -Name "Politica-Rotulos" `
  -Labels "Publico","Interno","Confidencial","Altamente-Confidencial" `
  -ExchangeLocation "All"
```

### DLP — Prevenção de Perda de Dados

```powershell
# Criar política DLP para detectar CPF em emails
New-DlpCompliancePolicy -Name "Proteger-CPF" `
  -ExchangeLocation All `
  -Mode Enable

New-DlpComplianceRule -Name "Regra-CPF" `
  -Policy "Proteger-CPF" `
  -ContentContainsSensitiveInformation @{Name="Brazil CPF Number"; minCount="1"} `
  -BlockAccess $true `
  -NotifyUser "LastModifier"
```

### eDiscovery

Para investigações legais — preserva e exporta conteúdo de email, Teams, SharePoint:

```powershell
# Criar caso de eDiscovery
New-ComplianceCase -Name "Investigacao-2026-001"

# Colocar caixa postal em hold (preservar evidências)
New-CaseHoldPolicy -Name "Hold-Joao" `
  -Case "Investigacao-2026-001" `
  -ExchangeLocation "joao@empresa.com"
```

### Insider Risk Management

Detecta riscos de ameaças internas correlacionando comportamentos:
- Exfiltração de dados antes de demissão
- Compartilhamento de dados sensíveis
- Violações de políticas de segurança

### Communication Compliance

Monitora comunicações (email, Teams) para violações de políticas:
- Linguagem de assédio
- Possível insider trading em serviços financeiros
- Compartilhamento de informações confidenciais

## Microsoft Compliance Manager

Dashboard de conformidade que mede progresso e sugere ações:

```bash
# Ver pontuação de conformidade (via portal Purview)
# O Compliance Manager calcula uma pontuação de 0-1000+
# baseada nos controles implementados

# Controles são divididos em:
# - Ações da Microsoft (já implementadas)
# - Ações do cliente (sua responsabilidade)
```

**Pontuação de conformidade** — quanto maior, mais controles implementados. Mapeada para regulamentos específicos: GDPR, ISO 27001, NIST, SOC 2.

<div class="callout">
<strong>Dica para o exame:</strong> Rótulos de sensibilidade (Information Protection) controlam quem acessa os dados. Rótulos de retenção (Records Management) controlam por quanto tempo os dados existem. São complementares — um documento pode ter ambos.
</div>

## Azure Policy para conformidade

```bash
# Atribuir iniciativa de conformidade PCI DSS
az policy assignment create \
  --name "pci-dss" \
  --policy-set-definition "PCI v3.2.1:2018" \
  --scope /subscriptions/{subscription-id}

# Ver recursos não conformes
az policy state list \
  --filter "complianceState eq 'NonCompliant'" \
  --query "[].{Recurso:resourceId, Politica:policyDefinitionName}" \
  --output table
```

## O que cai no exame

- Principais regulamentos: GDPR, HIPAA, PCI DSS, ISO 27001, SOC 2
- Rótulos de sensibilidade para classificação e proteção de dados
- DLP para detectar e impedir vazamento de informações
- eDiscovery para investigações legais
- Compliance Manager e pontuação de conformidade
- Diferença entre rótulos de sensibilidade e rótulos de retenção
