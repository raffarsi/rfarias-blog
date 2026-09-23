---
layout: ../../layouts/PostLayout.astro
title: "Azure Firewall Policy: hierarquia de políticas e herança de regras entre ambientes"
category: "Networking"
tag: "networking"
date: "15 Nov 2025"
readTime: "10 min"
description: "Firewall Policies podem ser herdadas, a política base define regras globais, políticas filhas adicionam regras específicas por ambiente. Como estruturar para escalar sem duplicar configuração."
---

Se você tem Azure Firewall em mais de um ambiente, em produção, homologação e desenvolvimento, provavelmente está mantendo as mesmas regras base duplicadas em cada política. Toda vez que precisa adicionar um novo endpoint de monitoramento ou atualizar um range de IP, atualiza em três lugares. É inevitável que um fique defasado.

Hierarquia de Firewall Policies resolve esse problema.

## A estrutura que funciona

Uma política pai define regras globais. Políticas filhas herdam essas regras e adicionam as específicas do ambiente:

```
Politica Base (regras globais)
  Monitoramento (Azure Monitor, Log Analytics)
  Atualizacoes (Windows Update, pacotes Linux)
  Seguranca global (bloquear categorias)

  Politica Producao (herda da base)
    Regras especificas de producao
    Restricoes mais rigidas

  Politica Homologacao (herda da base)
    Regras menos restritivas para testes

  Politica Desenvolvimento (herda da base)
    Mais permissiva para desenvolvimento
```

```bicep
// Politica base
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
            ]
            protocols: [{ protocolType: 'Https', port: 443 }]
            sourceAddresses: ['*']
          }
        ]
      }
    ]
  }
}

// Politica filha herda da base
resource policyProd 'Microsoft.Network/firewallPolicies@2023-09-01' = {
  name: 'fwpolicy-prod'
  location: location
  properties: {
    sku: { tier: 'Premium' }
    basePolicy: { id: policyBase.id }
  }
}
```

## Como a precedência funciona

Regras da política base e da política filha são avaliadas juntas por prioridade numérica. Para que a regra da filha sobrescreva a da base, ela precisa ter prioridade MENOR:

```
Base:  Allow *.microsoft.com  (prioridade 200)
Filha: Deny  *.microsoft.com  (prioridade 100) <- esta ganha
```

Se a filha tiver prioridade maior que a base, a regra da base vence. Esse é o ponto que mais confunde em implementações novas.

<div class="callout">
<strong>Limitação importante:</strong> Uma política filha só pode ter uma política pai. Você não herda de múltiplas bases. Planeje a hierarquia antes de criar, reorganizar depois exige recriar as políticas e reassociar os firewalls.
</div>

Mudança de regra global agora é: editar a política base, propagar automaticamente para todos os firewalls de todos os ambientes. Sem precisar lembrar de qual ambiente ainda não foi atualizado.
