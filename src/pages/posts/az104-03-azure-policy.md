---
layout: ../../layouts/PostLayout.astro
title: "AZ-104 na prática [3] — Azure Policy e governança"
category: "Azure"
tag: "azure"
serie: "AZ-104 na prática"
serieSlug: "az104"
serieNum: 3
date: "30 Mai 2026"
readTime: "8 min"
description: "Como usar Azure Policy para enforçar padrões, auditar conformidade e governar seu ambiente Azure."
prev:
  title: "AZ-104 [2] — RBAC"
  slug: "az104-02-rbac-escopos"
next:
  title: "AZ-104 [4] — Storage Accounts"
  slug: "az104-04-storage-accounts"

---

Azure Policy é a ferramenta de governança do Azure. Permite enforçar padrões organizacionais, auditar conformidade e automaticamente remediar configurações incorretas.

## Conceitos fundamentais

**Policy Definition** — a regra em si (ex: "todas as VMs devem usar discos gerenciados")
**Policy Assignment** — aplicar a política a um escopo
**Policy Initiative (Set)** — grupo de políticas relacionadas
**Compliance** — percentual de recursos em conformidade

## Efeitos das políticas

| Efeito | O que faz |
|--------|-----------|
| Deny | Bloqueia a criação/atualização do recurso |
| Audit | Registra não-conformidade mas não bloqueia |
| AuditIfNotExists | Audita se um recurso relacionado não existe |
| DeployIfNotExists | Cria recurso relacionado se não existir |
| Append | Adiciona propriedades ao recurso |
| Modify | Modifica propriedades durante criação/atualização |

## Criando uma política simples

Política que requer uma tag "CostCenter" em todos os resource groups:

```json
{
  "if": {
    "allOf": [
      {
        "field": "type",
        "equals": "Microsoft.Resources/subscriptions/resourceGroups"
      },
      {
        "field": "tags['CostCenter']",
        "exists": "false"
      }
    ]
  },
  "then": {
    "effect": "deny"
  }
}
```

```bash
# Criar definição de política
az policy definition create \
  --name "require-costcenter-tag" \
  --display-name "Requer tag CostCenter" \
  --description "Todos os RGs devem ter tag CostCenter" \
  --rules policy-rule.json \
  --mode All

# Atribuir a uma subscription
az policy assignment create \
  --name "require-tag-assignment" \
  --policy "require-costcenter-tag" \
  --scope /subscriptions/{subscription-id}
```

## Remediation tasks

Para políticas com efeito `DeployIfNotExists` ou `Modify`, você pode criar tarefas de remediação para corrigir recursos existentes não conformes:

```bash
az policy remediation create \
  --name remediation-01 \
  --policy-assignment require-tag-assignment \
  --resource-group meu-rg
```

## Initiatives (Policy Sets)

Iniciativas agrupam políticas relacionadas. O Azure tem iniciativas built-in para conformidade regulatória (PCI DSS, ISO 27001, NIST).

```bash
# Ver iniciativas disponíveis
az policy set-definition list --query "[].{Nome:displayName}" -o table

# Atribuir iniciativa de conformidade
az policy assignment create \
  --name "pci-compliance" \
  --policy-set-definition "PCI v3.2.1:2018" \
  --scope /subscriptions/{subscription-id}
```

<div class="callout">
<strong>Dica para o exame:</strong> Azure Policy avalia recursos durante criação, atualização e periodicamente (a cada 24h). Recursos criados antes da política ser atribuída aparecem como não conformes mas não são bloqueados retroativamente — exceto com remediation tasks.
</div>

## Management Groups

Para governança em escala com múltiplas subscriptions, use Management Groups. Permitem aplicar políticas e RBAC em múltiplas subscriptions de uma vez.

```bash
# Criar management group
az account management-group create \
  --name "mg-producao" \
  --display-name "Produção"

# Mover subscription para o management group
az account management-group subscription add \
  --name "mg-producao" \
  --subscription {subscription-id}
```

## O que cai no exame

- Os efeitos de política e quando usar cada um (Deny vs Audit vs DeployIfNotExists)
- Que Policy é diferente de RBAC — Policy governa o quê pode ser criado; RBAC governa quem pode criar
- Como remediation tasks funcionam
- A hierarquia: Management Group → Subscription → Resource Group → Resource
