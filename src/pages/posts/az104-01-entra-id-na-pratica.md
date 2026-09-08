---
layout: ../../layouts/PostLayout.astro
title: "AZ-104 na prática [1] — Gerenciando identidades com Microsoft Entra ID"
category: "Azure"
tag: "azure"
serie: "AZ-104 na prática"
serieNum: 1
date: "23 Mai 2026"
readTime: "10 min"
description: "Como gerenciar usuários, grupos e identidades no Microsoft Entra ID para o exame AZ-104 e para o dia a dia."
next:
  title: "AZ-104 na prática [2] — RBAC e escopos"
  slug: "az104-02-rbac-escopos"
---

Gerenciar identidades é a primeira habilidade cobrada no AZ-104 e também uma das mais usadas no dia a dia de qualquer administrador Azure. Neste artigo, cubro os principais conceitos e operações com Microsoft Entra ID que você precisa dominar.

## Criando e gerenciando usuários

Você pode criar usuários via portal, PowerShell, CLI ou API. No dia a dia de operação, a CLI é o caminho mais rápido:

```bash
# Criar usuário
az ad user create \
  --display-name "Rafael Farias" \
  --user-principal-name rafael@empresa.onmicrosoft.com \
  --password "Senha@Temp123" \
  --force-change-password-next-sign-in true

# Listar usuários
az ad user list --query "[].{Nome:displayName, UPN:userPrincipalName}" -o table

# Atualizar atributos
az ad user update \
  --id rafael@empresa.onmicrosoft.com \
  --department "Tecnologia" \
  --job-title "Arquiteto Azure"
```

Para o exame, preste atenção na diferença entre **usuários membros** (internos) e **usuários convidados** (B2B). Convidados têm `userType = Guest` e permissões restritas por padrão.

## Grupos e estratégias de atribuição

Existem dois tipos de grupo: **Segurança** (para controle de acesso) e **Microsoft 365** (para colaboração). Para o AZ-104, o foco é em grupos de segurança.

```bash
# Criar grupo de segurança
az ad group create \
  --display-name "Equipe-Networking" \
  --mail-nickname "equipe-networking"

# Adicionar membro
az ad group member add \
  --group "Equipe-Networking" \
  --member-id $(az ad user show --id rafael@empresa.onmicrosoft.com --query id -o tsv)
```

**Grupos dinâmicos** são uma feature poderosa: adicionam membros automaticamente baseado em atributos. Para usar, você precisa de licença Entra ID P1.

Regra de exemplo — todos do departamento de TI:

```
(user.department -eq "Tecnologia")
```

## Unidades Administrativas

Unidades Administrativas (AU) permitem segmentar o diretório e delegar administração. Útil em organizações com múltiplas filiais ou departamentos que precisam de autonomia administrativa.

```bash
# Criar Unidade Administrativa
az rest --method POST \
  --url "https://graph.microsoft.com/v1.0/directory/administrativeUnits" \
  --body '{"displayName": "Filial-SP", "description": "Usuários da filial São Paulo"}'
```

## Identidades externas — B2B

Para colaboração com parceiros externos, use o convite B2B:

```bash
az ad user invite \
  --invited-user-email parceiro@empresa-externa.com \
  --invite-redirect-url "https://portal.azure.com"
```

<div class="callout">
<strong>Dica para o exame:</strong> Memorize que usuários B2B usam suas próprias credenciais e aparecem no diretório com sufixo #EXT#. Ex: parceiro_empresa-externa.com#EXT#@suaempresa.onmicrosoft.com
</div>

## Self-Service Password Reset (SSPR)

SSPR permite que usuários redefinam suas senhas sem acionar o helpdesk. No exame, saiba que SSPR requer Entra ID P1 para uso híbrido (write-back para AD on-premises).

Métodos de verificação disponíveis: email alternativo, telefone celular, aplicativo autenticador, perguntas de segurança e código de aplicativo Office.

## O que cai no exame

- Diferença entre tipos de usuário (Membro vs Convidado)
- Quando usar grupos dinâmicos vs estáticos
- Requisitos de licença para funcionalidades (P1/P2)
- Processo de convite B2B e fluxo de resgate
- Como as AUs limitam o escopo administrativo
