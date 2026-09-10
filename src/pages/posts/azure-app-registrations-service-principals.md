---
layout: ../../layouts/PostLayout.astro
title: "App Registrations e Service Principals: identidade para aplicacoes no Azure"
category: "IAM"
tag: "iam"
date: "06 Nov 2025"
readTime: "9 min"
description: "A diferenca entre App Registration e Service Principal, como configurar permissoes e por que Managed Identity deve ser a primeira escolha."
---

Quando uma aplicacao precisa acessar recursos do Azure ou APIs da Microsoft, ela precisa de uma identidade. O Microsoft Entra ID oferece dois mecanismos relacionados: App Registration e Service Principal.

## App Registration vs Service Principal

**App Registration** e o objeto global -- o registro da aplicacao no tenant. Define o que a aplicacao e: nome, URLs de redirect, permissoes necessarias, certificados e secrets.

**Service Principal** e a instancia local. E o objeto que recebe permissoes RBAC, aparece nos logs de auditoria e pode ser associado a Managed Identities.

A relacao: um App Registration pode ter Service Principals em multiplos tenants. Em um tenant single, geralmente um App Registration = um Service Principal.

## Criando um App Registration

```bash
az ad app create \
  --display-name "minha-aplicacao-ia" \
  --sign-in-audience AzureADMyOrg

APP_ID=$(az ad app show --display-name "minha-aplicacao-ia" --query appId -o tsv)
az ad sp create --id $APP_ID
```

## Client Secret vs Certificate

**Client Secret** -- simples, menos seguro:
```bash
az ad app credential reset \
  --id $APP_ID \
  --append \
  --years 1
```

**Certificate** -- recomendado para producao:
```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
az ad app credential reset \
  --id $APP_ID \
  --cert cert.pem \
  --append
```

## Permissoes de API

```bash
# Adicionar permissao para Microsoft Graph
az ad app permission add \
  --id $APP_ID \
  --api 00000003-0000-0000-c000-000000000000 \
  --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Role

az ad app permission admin-consent --id $APP_ID
```

## Workload Identity Federation: sem secrets para CI/CD

Para GitHub Actions e outras plataformas CI/CD, use federacao em vez de secrets:

```bash
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "github-actions-producao",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:empresa/repo:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

No GitHub Actions:
```yaml
- uses: azure/login@v1
  with:
    client-id: ${{ secrets.AZURE_CLIENT_ID }}
    tenant-id: ${{ secrets.AZURE_TENANT_ID }}
    subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
    # Sem client-secret -- usa OIDC token do GitHub
```

## Quando usar o que

| Cenario | Recomendacao |
|---------|-------------|
| App rodando no Azure (VM, App Service, AKS) | Managed Identity |
| App rodando on-premises | App Registration + Certificate |
| CI/CD pipeline (GitHub Actions, Azure DevOps) | Workload Identity Federation |
| Integracao com API de terceiros | App Registration + Secret/Certificate |

<div class="callout">
<strong>Managed Identity e sempre preferivel.</strong> Para qualquer recurso rodando no Azure, Managed Identity elimina a classe inteira de problemas de gestao de credenciais. Reserve App Registrations para o que genuinamente nao pode usar Managed Identity.
</div>

## Conclusao

App Registrations sao necessarios quando Managed Identity nao e uma opcao. Para tudo que roda no Azure, prefira sempre Managed Identity. Para pipelines CI/CD externos, Workload Identity Federation elimina secrets por completo. Client secrets devem ser o ultimo recurso.
