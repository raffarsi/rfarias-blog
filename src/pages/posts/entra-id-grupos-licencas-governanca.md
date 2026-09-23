---
layout: ../../layouts/PostLayout.astro
title: "Grupos no Entra ID: como estruturar para escalar com governança"
category: "IAM"
tag: "iam"
date: "23 Out 2025"
readTime: "9 min"
description: "Grupos dinâmicos, atribuição de licenças e governança com Entitlement Management para gerenciar acesso em escala."
---

Grupos no Microsoft Entra ID são o mecanismo central para gerenciar acesso em escala. Em vez de atribuir roles, licenças e permissões individualmente a cada usuário, você gerencia grupos -- e quem faz parte de cada grupo.

## Tipos de grupos

**Grupos de Segurança:** usados para controle de acesso -- RBAC no Azure, permissões em aplicações, políticas de Acesso Condicional.

**Grupos Microsoft 365:** incluem caixa de email compartilhada, site SharePoint, canal Teams. Para colaboração, não para controle de acesso técnico.

## Grupos dinâmicos: automação de associação

Em vez de adicionar usuários manualmente, grupos dinâmicos usam regras para incluir automaticamente usuários que atendem a critérios:

```bash
az ad group create   --display-name "Desenvolvedores TI"   --mail-nickname "devs-ti"   --group-types DynamicMembership   --membership-rule "(user.department -eq 'TI') and (user.jobTitle -contains 'Desenvolvedor')"   --membership-rule-processing-state On
```

Quando um usuário muda de departamento no diretório, automaticamente sai do grupo -- sem intervenção manual.

## Atribuição de licenças baseada em grupo

Em vez de atribuir licenças individualmente:

```bash
# Atribuir licenca Microsoft 365 Business Premium ao grupo
# (via portal Entra ID -> Groups -> Licenses)
# Quando um usuario entra no grupo, recebe a licenca automaticamente
# Quando sai, a licenca e removida

# Verificar atribuicao de licencas por grupo via PowerShell
Get-MgGroupLicenseDetail -GroupId {group-id} | Select SkuPartNumber
```

## Entitlement Management: acesso self-service com aprovação

O Entitlement Management (requer P2) permite que usuários solicitem acesso a pacotes de recursos:

```
Access Package "Acesso Ambiente IA - Producao":
  - Grupo: sg-ia-prod-contributors
  - Expiracao: 90 dias (renovavel)
  - Aprovacao: 1 aprovador do time de seguranca
  - Revisao trimestral: usuario confirma que ainda precisa
```

Usuários externos (B2B) também podem solicitar acesso -- a aprovação determina se e por quanto tempo tem acesso.

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

## Revisões de acesso periódicas

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
<strong>Grupos aninhados:</strong> O Entra ID suporta grupos aninhados para permissões RBAC. Mas grupos dinâmicos não podem ter outros grupos como membros -- apenas usuários e service principals. Planeje a hierarquia antes de criar dependências entre grupos.
</div>

## Auditoria de associações

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

## Conclusão

Estruturar grupos corretamente -- grupos dinâmicos para automação, licenças baseadas em grupo, Entitlement Management para self-service -- é o que permite escalar o ambiente sem crescer a equipe de administração na mesma proporção. A governança fica no design dos grupos, não no trabalho manual de gerenciar cada usuário individualmente.
