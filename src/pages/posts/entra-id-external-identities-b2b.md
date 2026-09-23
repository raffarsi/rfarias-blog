---
layout: ../../layouts/PostLayout.astro
title: "External Identities no Entra ID: colaboração B2B segura"
category: "IAM"
tag: "iam"
date: "20 Nov 2025"
readTime: "8 min"
description: "Como convidar usuários externos, configurar políticas de acesso B2B e evitar erros que deixam parceiros com acesso além do necessário."
---

O Microsoft Entra External ID permite colaborar com parceiros, fornecedores e clientes externos sem criar contas internas para eles. O usuário externo se autentica com sua própria identidade e acessa apenas o que você autoriza.

## O modelo B2B

Quando você convida um usuário externo:
1. O usuário recebe um email de convite
2. Aceita o convite e se autentica com sua própria conta (Microsoft, Google, etc.)
3. Um Guest user e criado no seu tenant Entra ID
4. Você atribui permissões a esse Guest user como qualquer usuário interno

O usuário externo nunca tem senha no seu tenant -- sempre autentica no tenant de origem.

## Convidando usuários externos

```bash
# Convidar via CLI
az ad invitation create   --invited-user-email-address "parceiro@empresa-parceira.com"   --invite-redirect-url "https://myapp.empresa.com"   --invited-user-display-name "Joao Silva (Empresa Parceira)"

# Em massa via PowerShell
Import-Csv "convidados.csv" | ForEach-Object {
    New-AzureADMSInvitation         -InvitedUserEmailAddress $_.Email         -SendInvitationMessage $True         -InviteRedirectUrl "https://myapp.empresa.com"
}
```

## Acesso Condicional para usuários externos

Guests devem ter políticas mais restritivas:

```json
{
  "displayName": "Exigir MFA para todos os guests",
  "conditions": {
    "users": {
      "includeGuestOrExternalUsers": {
        "guestOrExternalUserTypes": "b2bCollaborationGuest"
      }
    },
    "applications": { "includeApplications": ["All"] }
  },
  "grantControls": {
    "operator": "OR",
    "builtInControls": ["mfa"]
  }
}
```

## Cross-Tenant Access Settings

Controla quais tenants externos podem acessar seus recursos:

```
Inbound settings para tenant parceiro.com:
  - Permitir autenticacao direta (sem convite individual)
  - Confiar MFA do tenant parceiro
  - Confiar dispositivos compliant do parceiro

Outbound settings:
  - Bloquear usuarios internos de acessar apps no tenant concorrente.com
```

## Access Packages para B2B governado

Em vez de gerenciar acesso de cada parceiro manualmente:

1. Crie um Access Package "Acesso Parceiro XYZ" com os recursos necessários
2. Configure aprovação e expiração (ex: 6 meses renovável)
3. Compartilhe o link do package com o parceiro
4. O parceiro solicita acesso, aprovador interno aprova
5. Revisão periódica automática -- se não renovar, acesso expira

Quando o contrato expira, o acesso expira junto.

## Erros comuns a evitar

- Adicionar guests ao grupo "Todos" ou grupos com acesso amplo
- Não configurar expiração automática para contas de parceiros
- Não fazer revisões periódicas de quem ainda precisa do acesso
- Dar acesso de Contributor quando Reader seria suficiente

<div class="callout">
<strong>Auditoria de guests:</strong> Periodicamente revise quem são os Guest users no seu tenant. Muitas empresas acumulam guests de ex-parceiros ou projetos encerrados. Uma Access Review trimestral em todos os grupos que contém guests resolve isso automaticamente.
</div>

## Conclusão

B2B no Entra ID é a forma correta de colaborar com externos no ecossistema Microsoft -- sem contas não gerenciadas, com controle de acesso que expira automaticamente e auditoria completa. Access Packages com aprovação e revisão periódica é o padrão para ambientes com compliance como requisito.
