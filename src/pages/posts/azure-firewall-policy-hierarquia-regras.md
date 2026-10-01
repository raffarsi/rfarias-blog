---
layout: ../../layouts/PostLayout.astro
title: "Azure Firewall Policy: hierarquia de políticas e herança de regras entre ambientes"
category: "Networking"
tag: "networking"
date: "15 Nov 2025"
readTime: "7 min"
description: "Firewall Policies podem ser herdadas: a política base define as regras globais e as políticas filhas adicionam o que é de cada ambiente. Como a precedência realmente funciona e como estruturar a hierarquia sem duplicar configuração."
---

Se você tem Azure Firewall em mais de um ambiente, em produção, homologação e desenvolvimento, provavelmente mantém as mesmas regras base copiadas em cada política. Toda vez que precisa liberar um novo endpoint de monitoramento ou atualizar um range de IP, atualiza em três lugares. Mais cedo ou mais tarde, um deles fica para trás.

A hierarquia de Firewall Policies resolve a duplicação. Mas ela tem uma regra de precedência que muda o jeito de pensar o que vai na base, e é justamente o ponto que mais gera erro na primeira implantação.

## A estrutura

Uma política pai concentra as regras globais. As políticas filhas apontam para ela, herdam essas regras e acrescentam o que é específico do ambiente:

```
Política base (regras globais)
  Monitoramento (Azure Monitor, Log Analytics)
  Atualizações (Windows Update, repositórios Linux)
  Bloqueios corporativos

  Política de produção (herda da base)
    Regras específicas de produção

  Política de homologação (herda da base)
    Regras para testes

  Política de desenvolvimento (herda da base)
    Regras mais abertas para desenvolvimento
```

Cada firewall fica associado à política filha do seu ambiente. Quando a política base muda, a mudança chega automaticamente a todas as filhas e a todos os firewalls associados a elas.

## Como a precedência funciona

Aqui está o ponto central: **as regras da política pai sempre vencem.** A documentação da Microsoft é direta: os rule collection groups herdados da política pai têm precedência sobre os da filha, independentemente da prioridade numérica que a filha use.

Na prática, isso significa que a filha não consegue sobrescrever a base:

```
Base:  Allow *.microsoft.com  (rule collection group, prioridade 300)
Filha: Deny  *.microsoft.com  (rule collection group, prioridade 100)

Resultado: o Allow da base vence. A prioridade 100 da filha não muda nada.
```

A prioridade, de 100 a 65.000, com o menor número processado primeiro, só ordena as regras dentro do mesmo nível: os grupos da base entre si e os grupos da filha entre si. Dentro de uma rule collection, as regras são avaliadas de cima para baixo.

A consequência para o desenho é que a base deixa de ser um "padrão sugerido" e passa a ser o que nenhum ambiente pode mudar. Um Allow na base vale para todos os ambientes, inclusive para aquele que queria bloquear. Um Deny na base também vale para todos, e nenhuma filha consegue liberar o que ele bloqueia com uma regra do mesmo tipo.

Por isso, a pergunta certa para cada regra candidata à base é: algum ambiente vai precisar ser diferente disso? Se a resposta for sim, a regra vai para as filhas.

## A ordem por tipo de regra vem antes de tudo

Existe uma segunda camada de precedência, que vale com ou sem herança: depois da filtragem de Threat Intelligence, quando ativada, o Azure Firewall processa primeiro as regras de DNAT, depois as de rede e por último as de aplicação. A herança ordena as regras dentro de cada tipo, mas não muda essa sequência.

Isso tem um efeito que pega muita gente. Se a base bloqueia um domínio com uma regra de aplicação, e uma filha libera o IP de destino na porta 443 com uma regra de rede, a regra de rede é avaliada antes. O tráfego passa, e o Deny da base nem chega a ser consultado.

Um bloqueio corporativo na base só é um bloqueio de verdade se nenhuma filha tiver regra de rede ampla o bastante para passar por cima dele. Vale revisar as regras de rede das filhas com esse olhar, principalmente as que usam destino `*` ou ranges grandes.

## O que não é herdado como regra comum

Três detalhes que a documentação traz e que costumam aparecer só na hora do incidente:

**Regras de DNAT não são herdadas.** Elas precisam ser criadas na política filha. Faz sentido, já que o DNAT depende do IP público de cada firewall, mas quem espera ver a publicação de um serviço vindo da base descobre isso tarde.

**O modo de Threat Intelligence é herdado e só pode ficar mais rígido.** Se a base usa Alert, a filha pode usar Alert ou Alert and Deny, mas não pode desligar. A allowlist de Threat Intelligence também é herdada, e a filha pode acrescentar endereços a ela.

**Pai e filha precisam estar na mesma região.** A política em si pode ser associada a firewalls de qualquer região, mas a herança exige que as duas políticas estejam na mesma.

## Na prática

A base, com regras que valem para todos os ambientes sem exceção:

```bicep
param location string = resourceGroup().location

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
    priority: 300
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
            protocols: [ { protocolType: 'Https', port: 443 } ]
            sourceAddresses: [ '10.0.0.0/8' ]
          }
        ]
      }
    ]
  }
}
```

A filha de produção, que herda a base, endurece o Threat Intelligence e acrescenta o que é só dela:

```bicep
resource policyProd 'Microsoft.Network/firewallPolicies@2023-09-01' = {
  name: 'fwpolicy-prod'
  location: location
  properties: {
    sku: { tier: 'Premium' }
    basePolicy: { id: policyBase.id }
    threatIntelMode: 'Deny'
  }
}

resource prodRules 'Microsoft.Network/firewallPolicies/ruleCollectionGroups@2023-09-01' = {
  name: 'rcg-producao'
  parent: policyProd
  properties: {
    priority: 300
    ruleCollections: [
      {
        ruleCollectionType: 'FirewallPolicyFilterRuleCollection'
        name: 'rc-apis-parceiros'
        priority: 100
        action: { type: 'Allow' }
        rules: [
          {
            ruleType: 'ApplicationRule'
            name: 'allow-api-pagamentos'
            targetFqdns: [ 'api.parceiro-exemplo.com' ]
            protocols: [ { protocolType: 'Https', port: 443 } ]
            sourceAddresses: [ '10.10.0.0/16' ]
          }
        ]
      }
    ]
  }
}
```

Dois detalhes desse exemplo. O valor `Deny` em `threatIntelMode` corresponde ao modo Alert and Deny do portal, mais rígido que o Alert da base, e por isso é aceito. E a origem da regra de monitoramento é o espaço de endereços interno, não `*`: uma regra na base vale para todos os ambientes, então ela merece o mesmo cuidado que uma regra de produção.

## Três cuidados de operação

**Proteja a base.** Uma alteração errada na política pai chega a todos os firewalls de uma vez. A Microsoft indica usar uma custom role para evitar a remoção acidental da política base e dar a cada time acesso só aos rule collection groups da sua política.

**Pense na cobrança.** Uma política com nenhuma ou uma associação a firewall não tem custo adicional. A partir da segunda associação, há cobrança. Antes de desenhar a hierarquia, vale conferir na página de preços do Firewall Manager como cada política entra na conta.

**Desenhe antes de criar.** Cada política filha aponta para uma única política pai. Vale decidir antes de começar o que é global e o que é por ambiente. E lembrar que pai e filha ficam na mesma região: uma filha pensada para os firewalls de outra região é criada junto da base e só associada a eles.

## O que fica

A hierarquia de Firewall Policies acaba com a duplicação, mas só funciona bem quando a base é tratada pelo que ela é: o conjunto de regras que nenhum ambiente pode contrariar. A prioridade da filha não sobrescreve a base, e a ordem DNAT, rede e aplicação vale acima de qualquer herança.

Se você olhasse hoje a política base dos seus firewalls, todas as regras dela valeriam sem exceção para produção, homologação e desenvolvimento?
