---
layout: ../../layouts/PostLayout.astro
title: "SC-900 na prática [2] — Identidade e acesso com Microsoft Entra ID"
category: "IAM"
tag: "iam"
serie: "SC-900 na prática"
serieSlug: "sc900"
serieNum: 2
date: "14 Abr 2026"
readTime: "10 min"
description: "Microsoft Entra ID, MFA, RBAC, PIM e controle de acesso para o SC-900."
prev:
  title: "SC-900 [1] — Zero Trust"
  slug: "sc900-01-zero-trust-defesa"
next:
  title: "SC-900 [3] — Soluções de Segurança"
  slug: "sc900-03-solucoes-seguranca"

---


Identidade e o topico que o SC-900 mais aprofunda, e por uma razao pratica: e onde a maioria dos ataques comeca. Phishing, credential stuffing, MFA ausente. Nao e a rede, nao e o endpoint, e a identidade.

O Microsoft Entra ID e a resposta da Microsoft para esse problema. O SC-900 testa se voce entende como as pecas se encaixam.

## Microsoft Entra ID

Serviço de identidade baseado em nuvem. Autentica e autoriza usuários para Microsoft 365, Azure e aplicações SaaS.

```bash
# Criar usuário
az ad user create \
  --display-name "João Silva" \
  --user-principal-name joao@empresa.onmicrosoft.com \
  --password "Senha@Temp123" \
  --force-change-password-next-sign-in true

# Criar grupo de segurança
az ad group create \
  --display-name "Equipe-Azure" \
  --mail-nickname "equipe-azure"

# Adicionar usuário ao grupo
az ad group member add \
  --group "Equipe-Azure" \
  --member-id $(az ad user show --id joao@empresa.onmicrosoft.com --query id -o tsv)
```

## Autenticação multifator (MFA)

Combina dois ou mais fatores:
- **Algo que você sabe:** senha, PIN
- **Algo que você tem:** telefone (Authenticator), token físico, SMS
- **Algo que você é:** impressão digital, reconhecimento facial

```bash
# Verificar usuários registrados para MFA (via Graph API)
az rest --method GET \
  --url "https://graph.microsoft.com/v1.0/reports/credentialUserRegistrationDetails" \
  --query "value[].{User:userPrincipalName, MFA:isMfaRegistered}"
```

## Acesso Condicional

Política que avalia sinais contextuais para permitir ou bloquear acesso:

**Sinais avaliados:** usuário/grupo, localização IP, plataforma do dispositivo, aplicativo, risco de usuário/sign-in

**Controles possíveis:** exigir MFA, exigir dispositivo conforme, bloquear acesso, limitar sessão

```bash
# Exemplo: exigir MFA para acesso externo
az rest --method POST \
  --url "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies" \
  --body '{
    "displayName": "MFA-Para-Acesso-Externo",
    "state": "enabled",
    "conditions": {
      "users": {"includeUsers": ["All"]},
      "locations": {"includeLocations": ["AllTrusted"]}
    },
    "grantControls": {
      "operator": "OR",
      "builtInControls": ["mfa"]
    }
  }'
```

## RBAC no Entra ID

Funções administrativas controlam quem gerencia o diretório:

| Função | Permissão |
|--------|-----------|
| Administrador Global | Tudo |
| Administrador de Usuários | Gerencia usuários e grupos |
| Administrador de Segurança | Gerencia políticas de segurança |
| Leitor de Segurança | Leitura de configurações de segurança |
| Administrador de Aplicativos | Gerencia registros de app |

```bash
# Atribuir função de Administrador de Usuários
az ad user get-member-of \
  --id joao@empresa.onmicrosoft.com \
  --query "[].displayName"
```

## Privileged Identity Management (PIM)

Gerencia acesso privilegiado just-in-time:

```bash
# Via PowerShell (PIM não tem suporte completo na CLI)
# Ativar função por 4 horas com justificativa
Connect-MgGraph -Scopes "RoleManagement.ReadWrite.Directory"

New-MgRoleManagementDirectoryRoleAssignmentScheduleRequest -BodyParameter @{
    Action = "selfActivate"
    PrincipalId = "id-do-usuario"
    RoleDefinitionId = "id-da-funcao-global-admin"
    Justification = "Manutenção emergencial do sistema"
    ScheduleInfo = @{
        StartDateTime = Get-Date
        Expiration = @{
            Duration = "PT4H"
            Type = "AfterDuration"
        }
    }
}
```

## Entra ID Protection

Detecta riscos de identidade usando ML:
- Credenciais vazadas encontradas na dark web
- Login de localização atípica ou impossível (travel impossível)
- Uso de IPs anônimos (Tor, VPN)
- Spray de senha

<div class="callout">
<strong>Dica para o exame:</strong> PIM resolve o problema de administradores com acesso privilegiado permanente, risco enorme se a conta for comprometida. Com PIM, o acesso privilegiado é ativado sob demanda, com aprovação e por tempo limitado.
</div>

## Self-Service Password Reset (SSPR)

Usuários redefinem senhas sem acionar o helpdesk, usando métodos verificados (email, telefone, autenticador).

## O que cai no exame

- Entra ID como IDaaS (Identity as a Service) para nuvem
- Fatores de MFA (saber, ter, ser)
- Acesso Condicional e seus sinais/controles
- RBAC no Entra ID vs RBAC no Azure (dois sistemas separados)
- PIM para acesso just-in-time privilegiado
- Entra ID Protection para detecção de risco
