---
layout: ../../layouts/PostLayout.astro
title: "SC-900 na prática [3] — Soluções de segurança Microsoft"
category: "Segurança"
tag: "seguranca"
serie: "SC-900 na prática"
serieSlug: "sc900"
serieNum: 3
date: "18 Abr 2026"
readTime: "10 min"
description: "Microsoft Defender XDR, Sentinel, Defender for Cloud e as principais soluções de segurança."
prev:
  title: "SC-900 [2] — Identidade e Acesso"
  slug: "sc900-02-identidade-entra"
next:
  title: "SC-900 [4] — Conformidade"
  slug: "sc900-04-conformidade-purview"

---

O ecossistema de segurança da Microsoft é amplo. Este artigo cobre os produtos mais cobrados no SC-900.

## Microsoft Defender XDR

Solução de detecção e resposta estendida que correlaciona alertas de múltiplos produtos:

- **Defender for Endpoint** — protege dispositivos (Windows, Mac, Linux, iOS, Android)
- **Defender for Office 365** — protege email, Teams e SharePoint
- **Defender for Identity** — monitora Active Directory on-premises
- **Defender for Cloud Apps** — CASB para aplicações SaaS

```bash
# Verificar dispositivos no Defender for Endpoint (via API)
az rest --method GET \
  --url "https://api.securitycenter.microsoft.com/api/machines" \
  --query "value[].{Device:computerDnsName, RiskScore:riskScore, ExposureLevel:exposureLevel}"
```

**Por que XDR importa:** um ataque moderno cruza múltiplos produtos. Um phishing no email compromete credenciais que são usadas em um endpoint. O XDR correlaciona esses eventos separados em um único incidente, revelando o ataque completo.

## Microsoft Sentinel

SIEM + SOAR nativo da nuvem:

```bash
# Criar workspace do Sentinel
az monitor log-analytics workspace create \
  --resource-group meu-rg \
  --workspace-name workspace-sentinel \
  --location brazilsouth

# Habilitar Sentinel no workspace
az sentinel workspace create \
  --workspace-name workspace-sentinel \
  --resource-group meu-rg
```

**KQL para hunting de ameaças:**

```kql
// Detectar múltiplas falhas de login seguidas de sucesso (possível ataque)
SecurityEvent
| where TimeGenerated > ago(24h)
| where EventID == 4625  // Login falhou
| summarize FailedAttempts = count() by Account, Computer, bin(TimeGenerated, 1h)
| where FailedAttempts > 10
| join kind=inner (
    SecurityEvent
    | where EventID == 4624  // Login bem-sucedido
    | project Account, SuccessTime = TimeGenerated
) on Account
| where SuccessTime > TimeGenerated
| project Account, Computer, FailedAttempts, SuccessTime
```

**Playbooks SOAR** — automatizam resposta a incidentes usando Azure Logic Apps. Exemplo: quando phishing detectado → bloquear usuário + revogar tokens + notificar SOC.

## Microsoft Defender for Cloud

Avalia postura de segurança em Azure, AWS e GCP:

```bash
# Ver Secure Score
az security secure-score list \
  --query "[].{Score:score.current, Max:score.max, Pct:score.percentage}" \
  --output table

# Ver recomendações críticas
az security assessment list \
  --query "[?status.code=='Unhealthy' && metadata.severity=='High'].displayName" \
  --output table
```

## Azure Key Vault

Armazena segredos, chaves e certificados:

```bash
az keyvault create \
  --name meu-kv \
  --resource-group meu-rg \
  --location brazilsouth \
  --sku premium  # Premium suporta HSM (Hardware Security Module)

# Guardar segredo
az keyvault secret set --vault-name meu-kv --name "db-password" --value "MinhaSenh@Segura"

# Monitorar acesso ao Key Vault
az monitor diagnostic-settings create \
  --resource $(az keyvault show --name meu-kv --query id -o tsv) \
  --name diag-kv \
  --workspace $(az monitor log-analytics workspace show --workspace-name workspace-sentinel --resource-group meu-rg --query id -o tsv) \
  --logs '[{"category": "AuditEvent", "enabled": true}]'
```

## Azure DDoS Protection

- **Basic:** incluído automaticamente, protege infraestrutura Microsoft
- **Standard:** proteção adaptativa por recurso, analytics em tempo real, SLA de mitigação, suporte de especialistas

```bash
az network ddos-protection create \
  --resource-group meu-rg \
  --name meu-ddos-plan \
  --location brazilsouth

# Associar ao VNet
az network vnet update \
  --resource-group meu-rg \
  --name minha-vnet \
  --ddos-protection true \
  --ddos-protection-plan meu-ddos-plan
```

<div class="callout">
<strong>Dica para o exame:</strong> Diferencie SIEM (coleta e análise de logs para detectar) de SOAR (automatiza a resposta). O Microsoft Sentinel faz os dois. Defender XDR é EDR/XDR (foca em endpoints e produtividade). São complementares, não substitutos.
</div>

## O que cai no exame

- Defender XDR: correlação de alertas entre endpoint, email, identidade e apps
- Sentinel: SIEM (detecção) + SOAR (resposta automatizada via playbooks)
- Defender for Cloud: CSPM (postura) + CWP (proteção de workloads)
- Key Vault: segredos, chaves e certificados (com ou sem HSM)
- DDoS Protection Basic vs Standard
