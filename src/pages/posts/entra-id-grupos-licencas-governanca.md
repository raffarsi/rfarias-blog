---
layout: ../../layouts/PostLayout.astro
title: "Grupos no Entra ID: como estruturar para escalar com governanca"
category: "IAM"
tag: "iam"
date: "23 Out 2025"
readTime: "9 min"
description: "Grupos dinamicos, atribuicao de licencas e governanca com Entitlement Management para gerenciar acesso em escala."
---

Grupos no Microsoft Entra ID sao o mecanismo central para gerenciar acesso em escala. Em vez de atribuir roles, licencas e permissoes individualmente a cada usuario, voce gerencia grupos -- e quem faz parte de cada grupo.

## Tipos de grupos

**Grupos de Seguranca:** usados para controle de acesso -- RBAC no Azure, permissoes em aplicacoes, politicas de Acesso Condicional.

**Grupos Microsoft 365:** incluem caixa de email compartilhada, site SharePoint, canal Teams. Para colaboracao, nao para controle de acesso tecnico.

## Grupos dinamicos: automacao de associacao

Em vez de adicionar usuarios manualmente, grupos dinamicos usam regras para incluir automaticamente usuarios que atendem a criterios:

```bash
az ad group create   --display-name "Desenvolvedores TI"   --mail-nickname "devs-ti"   --group-types DynamicMembership   --membership-rule "(user.department -eq 'TI') and (user.jobTitle -contains 'Desenvolvedor')"   --membership-rule-processing-state On
```

Quando um usuario muda de departamento no diretorio, automaticamente sai do grupo -- sem intervencao manual.

## Atribuicao de licencas baseada em grupo

Em vez de atribuir licencas individualmente:

```bash
# Atribuir licenca Microsoft 365 Business Premium ao grupo
# (via portal Entra ID -> Groups -> Licenses)
# Quando um usuario entra no grupo, recebe a licenca automaticamente
# Quando sai, a licenca e removida

# Verificar atribuicao de licencas por grupo via PowerShell
Get-MgGroupLicenseDetail -GroupId {group-id} | Select SkuPartNumber
```

## Entitlement Management: acesso self-service com aprovacao

O Entitlement Management (requer P2) permite que usuarios solicitem acesso a pacotes de recursos:

```
Access Package "Acesso Ambiente IA - Producao":
  - Grupo: sg-ia-prod-contributors
  - Expiracao: 90 dias (renovavel)
  - Aprovacao: 1 aprovador do time de seguranca
  - Revisao trimestral: usuario confirma que ainda precisa
```

Usuarios externos (B2B) tambem podem solicitar acesso -- a aprovacao determina se e por quanto tempo tem acesso.

## Estrutura recomendada de grupos

```
sg-azure-contributors          (Contributor em subscriptions de app)
sg-azure-readers               (Reader em todas as subscriptions)
sg-ia-foundry-users            (Acesso ao Azure AI Foundry)
sg-ia-openai-users             (Role: Cognitive Services OpenAI User)
  └── populado automaticamente pelo Entitlement Management

sg-ti-desenvolvedores          (Grupo dinamico: department=TI, jobTitle contains Desenvolvedor)
sg-ti-arquitetos               (Grupo manual: membros selecionados)
```

## Revisoes de acesso periodicas

```bash
# Criar revisao de acesso para owners do grupo
az rest --method post   --url "https://graph.microsoft.com/v1.0/identityGovernance/accessReviews/definitions"   --body '{
    "displayName": "Revisao Trimestral - sg-ia-prod-contributors",
    "scope": {
      "query": "/groups/{group-id}/members",
      "queryType": "MicrosoftGraph"
    },
    "settings": {
      "mailNotificationsEnabled": true,
      "reminderNotificationsEnabled": true,
      "justificationRequiredOnApproval": true,
      "autoApplyDecisionsEnabled": true,
      "defaultDecision": "Deny",    // remover se nao responder
      "instanceDurationInDays": 14
    }
  }'
```

<div class="callout">
<strong>Grupos aninhados:</strong> O Entra ID suporta grupos aninhados para permissoes RBAC. Mas grupos dinamicos nao podem ter outros grupos como membros -- apenas usuarios e service principals. Planeje a hierarquia antes de criar dependencias entre grupos.
</div>

## Auditoria de associacoes

```kql
AuditLogs
| where OperationName contains "member"
| where TargetResources[0].type == "Group"
| project TimeGenerated,
    InitiatedBy=InitiatedBy.user.userPrincipalName,
    Action=OperationName,
    Group=TargetResources[0].displayName,
    User=TargetResources[1].userPrincipalName
| order by TimeGenerated desc
```

## Conclusao

Estruturar grupos corretamente -- grupos dinamicos para automacao, licencas baseadas em grupo, Entitlement Management para self-service -- e o que permite escalar o ambiente sem crescer a equipe de administracao na mesma proporcao. A governanca fica no design dos grupos, nao no trabalho manual de gerenciar cada usuario individualmente.
