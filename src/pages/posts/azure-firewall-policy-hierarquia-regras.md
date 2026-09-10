---
layout: ../../layouts/PostLayout.astro
title: "Azure Firewall Policy: hierarquia de políticas e herança de regras entre ambientes"
category: "Networking"
tag: "networking"
date: "15 Nov 2025"
readTime: "10 min"
description: "Firewall Policies podem ser herdadas, a política base define regras globais, políticas filhas adicionam regras específicas por ambiente. Como estruturar para escalar sem duplicar configuração."
---

O Azure Firewall Policy permite criar uma hierarquia de políticas onde uma política pai define regras globais e políticas filhas herdam essas regras e adicionam as específicas do ambiente. Isso evita duplicar configuração entre dezenas de firewalls em diferentes ambientes.

## O problema sem hierarquia

Sem hierarquia de políticas, cada ambiente (produção, homologação, desenvolvimento) tem sua própria política com as mesmas regras base copiadas manualmente. Quando uma regra global precisa mudar, um novo endpoint de monitoramento, uma atualização de IP, você atualiza em N lugares.

## Estrutura de hierarquia recomendada

```
Política Base (global)
├── Regras de DNS (sempre permitidas)
├── Regras de monitoramento (Azure Monitor, Log Analytics)
├── Regras de atualização (Windows Update, pacotes Linux)
└── Regras de segurança globais (bloquear países, categorias)
    │
    ├── Política Produção (herda da base)
    │   ├── Regras específicas de produção
    │   └── Restrições mais rígidas
    │
    ├── Política Homologação (herda da base)
    │   └── Regras menos restritivas para testes
    │
    └── Política Desenvolvimento (herda da base)
        └── Regras permissivas para desenvolvimento
```

## Configurando em Bicep

```bicep
// Política base, regras globais
resource policyBase 'Microsoft.Network/firewallPolicies@2023-09-01' = {
  name: 'fwpolicy-base'
  location: location
  properties: {
    sku: { tier: 'Premium' }
    threatIntelMode: 'Alert'
  }
}

resource baseRules 'Microsoft.Network/firewallPolicies/ruleCollectionGroups@2023-09-01' = {
  name: 'rcg-global'
  parent: policyBase
  properties: {
    priority: 100
    ruleCollections: [
      {
        ruleCollectionType: 'FirewallPolicyFilterRuleCollection'
        name: 'rc-monitoramento'
        priority: 100
        action: { type: 'Allow' }
        rules: [
          {
            ruleType: 'ApplicationRule'
            name: 'allow-azure-monitor'
            targetFqdns: [
              '*.monitor.azure.com'
              '*.oms.opinsights.azure.com'
              '*.ods.opinsights.azure.com'
              'dc.services.visualstudio.com'
            ]
            protocols: [{ protocolType: 'Https', port: 443 }]
            sourceAddresses: ['*']
          }
        ]
      }
    ]
  }
}

// Política filha, herda da base
resource policyProd 'Microsoft.Network/firewallPolicies@2023-09-01' = {
  name: 'fwpolicy-prod'
  location: location
  properties: {
    sku: { tier: 'Premium' }
    basePolicy: { id: policyBase.id }   // herança
  }
}

resource prodRules 'Microsoft.Network/firewallPolicies/ruleCollectionGroups@2023-09-01' = {
  name: 'rcg-prod-especifico'
  parent: policyProd
  properties: {
    priority: 200  // prioridade maior que as regras da base
    ruleCollections: [
      {
        ruleCollectionType: 'FirewallPolicyFilterRuleCollection'
        name: 'rc-ia-producao'
        priority: 100
        action: { type: 'Allow' }
        rules: [
          {
            ruleType: 'ApplicationRule'
            name: 'allow-model-catalog-prod'
            targetFqdns: ['*.models.ai.azure.com']
            protocols: [{ protocolType: 'Https', port: 443 }]
            sourceAddresses: ['10.1.0.0/16']
          }
        ]
      }
    ]
  }
}
```

## Precedência de regras

A precedência funciona por prioridade numérica dentro de cada política, **menor número = maior prioridade**. Regras da política filha não sobrescrevem regras da política pai; ambas são avaliadas. Se a política base tem um Allow com prioridade 100 e a filha tem um Deny com prioridade 200, o Allow da base vai ganhar.

Para que a filha sobrescreva a base, use prioridade menor:

```
Base:  Allow *.microsoft.com  (prioridade 200)
Filha: Deny  *.microsoft.com  (prioridade 100) ← esta ganha
```

<div class="callout">
<strong>Limitação importante:</strong> Uma política filha só pode ter uma política pai. Você não pode herdar de múltiplas políticas base. Planeje a hierarquia antes de criar, reorganizar depois exige recriar as políticas e reassociar firewalls.
</div>

## Conclusão

Hierarquia de Firewall Policies é o que torna o gerenciamento de firewall escalável em ambientes com múltiplos firewalls e ambientes. Regras globais na base, regras específicas nas filhas, e mudanças globais propagam automaticamente para todos os ambientes sem tocar em cada política individualmente.
