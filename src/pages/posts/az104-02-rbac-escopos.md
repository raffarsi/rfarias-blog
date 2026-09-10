---
layout: ../../layouts/PostLayout.astro
title: "AZ-104 na prática [2] — RBAC: controle de acesso baseado em funções"
category: "IAM"
tag: "iam"
serie: "AZ-104 na prática"
serieSlug: "az104"
serieNum: 2
date: "23 Mai 2026"
readTime: "9 min"
description: "Como o RBAC funciona no Azure, como atribuir funções e entender escopos de forma prática."
prev:
  title: "AZ-104 [1] — Entra ID"
  slug: "az104-01-entra-id-na-pratica"
next:
  title: "AZ-104 [3] — Azure Policy"
  slug: "az104-03-azure-policy"

---


A pergunta que mais aparece em incidentes de acesso no Azure e: quem deu essa permissao, para quem, e por que ainda esta ativa?

RBAC e o que deveria responder isso. Na pratica, ambientes sem governanca de RBAC acumulam permissoes durante meses, e a auditoria revela roles de Owner atribuidas para 'facilitar' e nunca removidas. O AZ-104 testa se voce sabe estruturar isso corretamente desde o inicio.

## Como o RBAC funciona

O modelo é simples: você atribui uma **função** (role) a um **principal de segurança** (usuário, grupo, service principal ou managed identity) em um determinado **escopo**.

```
Atribuição de função = Principal + Função + Escopo
```

O acesso é **aditivo**, não existe deny explícito nas atribuições de função padrão (exceção: deny assignments). Se um usuário tem Leitor em uma subscription e Contribuidor em um resource group específico, ele tem Contribuidor naquele RG.

## Hierarquia de escopos

```
Management Group
  └── Subscription
        └── Resource Group
              └── Resource
```

Atribuições em escopos superiores herdam para escopos inferiores. Atribua no escopo mais restrito possível.

## Funções integradas mais importantes

| Função | O que pode |
|--------|-----------|
| Owner | Tudo, inclusive gerenciar acesso |
| Contributor | Criar/gerenciar recursos, não gerencia acesso |
| Reader | Apenas leitura |
| User Access Administrator | Gerencia apenas atribuições de acesso |

```bash
# Listar atribuições de função em um resource group
az role assignment list \
  --resource-group meu-rg \
  --output table

# Atribuir Contributor a um usuário
az role assignment create \
  --assignee rafael@empresa.com \
  --role "Contributor" \
  --resource-group meu-rg

# Atribuir Reader em nível de subscription
az role assignment create \
  --assignee rafael@empresa.com \
  --role "Reader" \
  --scope /subscriptions/{subscription-id}
```

## Funções customizadas

Quando as funções integradas não atendem, crie funções customizadas:

```json
{
  "Name": "VM Operator",
  "Description": "Pode iniciar e parar VMs mas não criar ou deletar",
  "Actions": [
    "Microsoft.Compute/virtualMachines/start/action",
    "Microsoft.Compute/virtualMachines/deallocate/action",
    "Microsoft.Compute/virtualMachines/read"
  ],
  "NotActions": [],
  "AssignableScopes": ["/subscriptions/{subscription-id}"]
}
```

```bash
az role definition create --role-definition vm-operator.json
```

<div class="callout">
<strong>Armadilha do exame:</strong> Owner pode atribuir funções a outros usuários; Contributor não pode. User Access Administrator pode gerenciar acesso mas não criar recursos. Confundir essas permissões é erro comum.
</div>

## Verificando permissões efetivas

```bash
# Verificar o que um usuário pode fazer em um recurso
az role assignment list \
  --assignee rafael@empresa.com \
  --all \
  --include-inherited \
  --output table
```

## Deny Assignments

Deny Assignments bloqueiam ações específicas mesmo que o usuário tenha uma role que as permita. Criadas automaticamente por Azure Blueprints e Managed Applications, você não pode criar manualmente via ARM.

## O que cai no exame

- A diferença entre Owner, Contributor e User Access Administrator
- Como herança de escopos funciona
- Quando usar funções customizadas
- Que Deny Assignments têm precedência sobre atribuições
- Limite de 2.000 atribuições por subscription
