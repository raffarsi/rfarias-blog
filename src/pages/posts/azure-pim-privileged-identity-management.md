---
layout: ../../layouts/PostLayout.astro
title: "Privileged Identity Management: acesso privilegiado just-in-time no Azure"
category: "IAM"
tag: "iam"
date: "18 Set 2025"
readTime: "10 min"
description: "PIM é o que separa um ambiente Azure maduro de um ambiente com Owner permanente para todo mundo. Como configurar e usar no dia a dia."
---

Privileged Identity Management (PIM) é a solução do Microsoft Entra ID para acesso privilegiado just-in-time (JIT). Em vez de ter administradores com roles permanentes e poderosas, o PIM permite que os usuários ativem temporariamente papéis privilegiados quando precisam — com aprovação, justificativa e duração limitada.

## O problema do acesso permanente

Quando um admin tem Owner permanente em uma subscription:
- A conta fica com privilégios elevados 24/7 — se comprometida, o atacante tem acesso total
- Não há rastreabilidade de quando e por que o acesso foi usado
- É difícil saber quem tem acesso a quê em um dado momento

Com PIM, o admin tem o role de forma **elegível** — ele pode ativar quando precisar, por no máximo X horas, com justificativa registrada.

## Habilitando PIM para Azure Resources

```bash
# O PIM para Azure Resources é habilitado via portal
# Ou via API/PowerShell:
# Importar o módulo
Install-Module -Name Az.Resources

# Criar role assignment elegível (não permanente)
$schedule = New-Object Microsoft.Azure.PowerShell.Cmdlets.Resources.MSGraph.Models.ApiV10.MicrosoftGraphRequestSchedule
$schedule.StartDateTime = Get-Date
$schedule.Expiration = @{
    Type = "AfterDuration"
    Duration = "P365D"  # elegível por 1 ano
}
```

## Configurando no portal

1. Acesse **Privileged Identity Management** no portal Entra
2. Selecione **Azure Resources** → encontre sua subscription
3. Em **Roles**, selecione o role (ex: Contributor)
4. Adicione membros como **Eligible** (elegíveis, não permanentes)

## Ativando o role quando necessário

O usuário elegível ativa o role quando precisar:

```bash
# Via Azure PowerShell
$principalId = (Get-AzADUser -UserPrincipalName "usuario@empresa.com").Id
$roleId = (Get-AzRoleDefinition -Name "Contributor").Id

# Criar ativação (válida por 4 horas)
New-AzRoleEligibilityScheduleRequest -Scope "/subscriptions/{sub-id}" `
  -Name (New-Guid) `
  -PrincipalId $principalId `
  -RoleDefinitionId "/subscriptions/{sub-id}/providers/Microsoft.Authorization/roleDefinitions/$roleId" `
  -RequestType "SelfActivate" `
  -ScheduleInfoStartDateTime (Get-Date) `
  -ScheduleInfoExpirationDuration "PT4H" `  # 4 horas
  -Justification "Implantação de atualização crítica - Ticket #12345"
```

## Configurações de ativação

Para cada role, você pode configurar:
- **Duração máxima de ativação** — ex: 4 horas (não pode ficar ativo indefinidamente)
- **Aprovação necessária** — ativação requer aprovação de um aprovador designado
- **MFA obrigatório na ativação** — mesmo que o usuário já tenha passado pelo MFA no login
- **Justificativa obrigatória** — usuário deve informar o motivo da ativação
- **Ticket number** — integração com sistema de chamados

## Auditoria

Todas as ativações ficam registradas:

```kql
// Consulta no Log Analytics
AuditLogs
| where OperationName == "Add eligible member to role in PIM completed"
   or OperationName == "Add member to role in PIM completed (permanent)"
| project TimeGenerated, InitiatedBy=InitiatedBy.user.userPrincipalName,
    TargetUser=TargetResources[0].userPrincipalName,
    Role=TargetResources[0].displayName,
    Result=ResultReason
| order by TimeGenerated desc
```

<div class="callout">
<strong>PIM requer Entra ID P2:</strong> O PIM para Entra ID roles e Azure Resources requer licença Microsoft Entra ID P2 (ou Microsoft Entra ID Governance). Verifique as licenças antes de planejar a implementação.
</div>

## Access Reviews: revisão periódica

O PIM suporta Access Reviews — revisões periódicas onde os próprios usuários ou aprovadores confirmam se ainda precisam do acesso:

```
Configura: revisão trimestral de todos os Owners
→ Email enviado para cada Owner: "Você ainda precisa deste acesso?"
→ Se não responder em 30 dias: acesso removido automaticamente
```

## Conclusão

PIM transforma acesso privilegiado de "sempre ligado e invisível" para "ativado quando necessário, com rastreabilidade completa". Para ambientes Azure em empresas reguladas (financeiro, saúde, governo), PIM é praticamente um requisito — não uma opção.
