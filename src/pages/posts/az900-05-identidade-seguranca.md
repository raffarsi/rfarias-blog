---
layout: ../../layouts/PostLayout.astro
title: "AZ-900 na prática [5] — Identidade, segurança e governança"
category: "IAM"
tag: "iam"
serie: "AZ-900 na prática"
serieSlug: "az900"
serieNum: 5
date: "17 Mar 2026"
readTime: "10 min"
description: "Microsoft Entra ID, MFA, RBAC, Azure Policy e as ferramentas de segurança e governança do Azure."
prev:
  title: "AZ-900 [4] — Storage e Banco de Dados"
  slug: "az900-04-storage-database"
next:
  title: "AZ-900 [6] — Custos e SLA"
  slug: "az900-06-custos-sla"

---

Identidade é o novo perímetro de segurança. O AZ-900 dedica uma boa parte ao ecossistema de segurança e governança do Azure, e são conceitos que se aplicam diretamente ao dia a dia.

## Microsoft Entra ID

Serviço de identidade e acesso baseado em nuvem. Autentica usuários para Microsoft 365, Azure e milhares de aplicações SaaS.

```bash
# Criar usuário
az ad user create \
  --display-name "Rafael Farias" \
  --user-principal-name rafael@empresa.onmicrosoft.com \
  --password "Senha@Temp123" \
  --force-change-password-next-sign-in true

# Habilitar MFA via política de Acesso Condicional
# (feito via portal ou Graph API)
```

**Entra ID vs Active Directory local:**
- AD local: protocolo Kerberos/LDAP, autenticação de domínio Windows
- Entra ID: protocolo OAuth 2.0/OpenID Connect, autenticação para nuvem
- Entra Connect sincroniza os dois para identidade híbrida

## Autenticação multifator (MFA)

MFA adiciona uma segunda camada: algo que você sabe (senha) + algo que você tem (telefone/token) + algo que você é (biometria).

O Microsoft Authenticator é o método recomendado, suporta notificações push, códigos TOTP e autenticação passwordless.

<div class="callout">
<strong>Dado importante:</strong> Habilitar MFA bloqueia mais de 99,9% dos ataques de comprometimento de conta. É a medida de segurança com melhor custo-benefício disponível.
</div>

## RBAC, Controle de acesso baseado em funções

```bash
# Principais funções internas
# Owner: controle total + gerencia acesso
# Contributor: gerencia recursos, não gerencia acesso
# Reader: apenas leitura

# Atribuir Contributor a um usuário em um RG
az role assignment create \
  --assignee rafael@empresa.onmicrosoft.com \
  --role "Contributor" \
  --resource-group meu-rg

# Verificar acesso efetivo
az role assignment list \
  --assignee rafael@empresa.onmicrosoft.com \
  --all \
  --output table
```

## Azure Policy

Governa o que pode ser criado e como. Diferente do RBAC (quem pode criar), o Policy controla o quê e como é criado.

```bash
# Atribuir política built-in: requer tag no RG
az policy assignment create \
  --name "require-tag-rg" \
  --policy "96670d01-0a4d-4649-9c89-2d3abc0a5025" \
  --scope /subscriptions/{sub-id}
```

## Microsoft Defender for Cloud

Avalia continuamente a postura de segurança dos recursos Azure e fornece recomendações:

```bash
# Ver recomendações de segurança
az security assessment list \
  --query "[?status.code=='Unhealthy'].{Titulo:displayName, Severidade:metadata.severity}" \
  --output table
```

## Azure Key Vault

Armazena segredos, chaves e certificados com segurança:

```bash
# Criar Key Vault
az keyvault create \
  --name meu-kv-2026 \
  --resource-group meu-rg \
  --location brazilsouth

# Guardar segredo
az keyvault secret set \
  --vault-name meu-kv-2026 \
  --name "ConnectionString" \
  --value "Server=meu-sql;Database=meu-db;..."

# Recuperar segredo
az keyvault secret show \
  --vault-name meu-kv-2026 \
  --name "ConnectionString" \
  --query "value"
```

## Zero Trust

Modelo de segurança baseado em: **nunca confie, sempre verifique**. Três princípios:
1. Verificar explicitamente (autenticar e autorizar sempre)
2. Menor privilégio (acesso mínimo necessário)
3. Assumir violação (segmentar, monitorar, minimizar raio de impacto)

## Microsoft Purview

Solução de governança de dados: classifica informações sensíveis, aplica políticas de retenção e prevenção de perda de dados (DLP).

## O que cai no exame

- Entra ID para nuvem vs Active Directory para on-premises
- MFA e os fatores de autenticação (saber, ter, ser)
- RBAC (quem pode fazer o quê) vs Policy (o que pode ser criado)
- Key Vault para segredos, chaves e certificados
- Defender for Cloud e Secure Score
- Princípios do Zero Trust
