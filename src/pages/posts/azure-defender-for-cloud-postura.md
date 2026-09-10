---
layout: ../../layouts/PostLayout.astro
title: "Microsoft Defender for Cloud: postura de seguranca e Secure Score"
category: "Segurança"
tag: "seguranca"
date: "30 Out 2025"
readTime: "8 min"
description: "Como usar o Defender for Cloud para identificar vulnerabilidades, priorizar correcoes e demonstrar conformidade em auditorias."
---

O Microsoft Defender for Cloud e o CSPM (Cloud Security Posture Management) nativo do Azure. Ele avalia continuamente sua postura de seguranca, calcula uma pontuacao (Secure Score) e fornece recomendacoes priorizadas de correcao.

## Habilitando o Defender for Cloud

```bash
# Camada basica (gratuita) -- score de seguranca e recomendacoes
az security pricing create \
  --name Default \
  --tier Free

# Defender para VMs (pago -- protecao de ameacas)
az security pricing create \
  --name VirtualMachines \
  --tier Standard
```

## Secure Score: a fotografia da postura

O Secure Score e calculado com base nas recomendacoes ativas. Cada recomendacao tem um peso -- corrigir as de maior peso sobe mais o score.

```kql
SecurityRecommendation
| where RecommendationState == "Unhealthy"
| project RecommendationDisplayName, AffectedResourceCount,
    PotentialScoreIncrease, RemediationDescription
| order by PotentialScoreIncrease desc
```

## Remediando as recomendacoes mais comuns

**"MFA deve ser habilitado em contas com privilegios":**
Configurar politica de Acesso Condicional exigindo MFA para Azure Management.

**"Portas de gerenciamento de VMs devem ser fechadas":**
```bash
az network nsg rule delete \
  --resource-group rg-app \
  --nsg-name nsg-vm \
  --name allow-rdp-internet
```

**"Storage accounts devem usar apenas HTTPS":**
```bash
az storage account update \
  --name meu-storage \
  --resource-group rg-data \
  --https-only true
```

**"Logs de diagnostico devem ser habilitados":**
```bash
az monitor diagnostic-settings create \
  --resource {resource-id} \
  --name diag-settings \
  --workspace {log-analytics-id} \
  --logs '[{"category":"Administrative","enabled":true}]' \
  --metrics '[{"category":"AllMetrics","enabled":true}]'
```

## Conformidade regulatoria

O Defender for Cloud mapeia automaticamente sua postura para frameworks regulatorios:

```bash
az security regulatory-compliance-standards list
az security regulatory-compliance-controls list \
  --standard-name "CIS Azure 2.0.0"
```

O relatorio mostra quais controles estao compliant -- com evidencias automaticas que podem ser usadas em auditorias.

## Just-in-Time VM Access

```bash
# Habilitar JIT -- portas fechadas por padrao, abertas sob demanda
az security jit-policy create \
  --resource-group rg-app \
  --location brazilsouth \
  --vm-name minha-vm \
  --ports '[{"number":3389,"protocol":"TCP","allowedSourceAddressPrefix":"*","maxRequestAccessDuration":"PT3H"}]'
```

## Export para auditoria continua

```bash
# Exportar status de conformidade para Log Analytics
az security auto-provisioning-setting update \
  --auto-provision On \
  --name MicrosoftMonitoringAgent
```

<div class="callout">
<strong>Secure Score nao e a unica metrica:</strong> Um Secure Score alto e bom sinal, mas nao garante seguranca completa. Ele mede configuracoes verificaveis -- nao detecta ameacas ativas, nao substitui monitoramento com Sentinel, nao cobre todos os riscos. Use como um dos varios indicadores de postura, nao como o unico.
</div>

## Conclusao

O Defender for Cloud transforma seguranca de reativa para proativa -- em vez de descobrir problemas em auditorias ou incidentes, voce ve continuamente o que esta exposto e recebe um caminho claro de correcao priorizado pelo impacto real. Para candidatura ao MVP de Azure, o Secure Score e a demonstracao de conformidade sao evidencias concretas de dominio da area.
