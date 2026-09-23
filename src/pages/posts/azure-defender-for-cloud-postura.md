---
layout: ../../layouts/PostLayout.astro
title: "Microsoft Defender for Cloud: postura de segurança e Secure Score"
category: "Segurança"
tag: "seguranca"
date: "30 Out 2025"
readTime: "8 min"
description: "Como usar o Defender for Cloud para identificar vulnerabilidades, priorizar correções e demonstrar conformidade em auditorias."
---

O Microsoft Defender for Cloud e o CSPM (Cloud Security Posture Management) nativo do Azure. Ele avalia continuamente sua postura de segurança, calcula uma pontuação (Secure Score) e fornece recomendações priorizadas de correção.

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

O Secure Score é calculado com base nas recomendações ativas. Cada recomendação tem um peso -- corrigir as de maior peso sobe mais o score.

```kql
SecurityRecommendation
| where RecommendationState == "Unhealthy"
| project RecommendationDisplayName, AffectedResourceCount,
    PotentialScoreIncrease, RemediationDescription
| order by PotentialScoreIncrease desc
```

## Remediando as recomendações mais comuns

**"MFA deve ser habilitado em contas com privilégios":**
Configurar política de Acesso Condicional exigindo MFA para Azure Management.

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

**"Logs de diagnóstico devem ser habilitados":**
```bash
az monitor diagnostic-settings create \
  --resource {resource-id} \
  --name diag-settings \
  --workspace {log-analytics-id} \
  --logs '[{"category":"Administrative","enabled":true}]' \
  --metrics '[{"category":"AllMetrics","enabled":true}]'
```

## Conformidade regulatória

O Defender for Cloud mapeia automaticamente sua postura para frameworks regulatórios:

```bash
az security regulatory-compliance-standards list
az security regulatory-compliance-controls list \
  --standard-name "CIS Azure 2.0.0"
```

O relatório mostra quais controles estão compliant -- com evidências automáticas que podem ser usadas em auditorias.

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
<strong>Secure Score não é a única métrica:</strong> Um Secure Score alto e bom sinal, mas não garante segurança completa. Ele mede configurações verificáveis -- não detecta ameaças ativas, não substitui monitoramento com Sentinel, não cobre todos os riscos. Use como um dos vários indicadores de postura, não como o único.
</div>

## Conclusão

O Defender for Cloud transforma segurança de reativa para proativa -- em vez de descobrir problemas em auditorias ou incidentes, você vê continuamente o que está exposto e recebe um caminho claro de correção priorizado pelo impacto real. Para candidatura ao MVP de Azure, o Secure Score e a demonstração de conformidade são evidências concretas de domínio da área.
