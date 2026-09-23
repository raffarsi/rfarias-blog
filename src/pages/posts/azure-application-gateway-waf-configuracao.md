---
layout: ../../layouts/PostLayout.astro
title: "Azure Application Gateway com WAF: configuração prática e regras customizadas"
category: "Networking"
tag: "networking"
date: "01 Nov 2025"
readTime: "10 min"
description: "WAF no Application Gateway vai além de habilitar o OWASP ruleset. Regras customizadas, exclusões e integração com o Azure Monitor para uma proteção que não quebra aplicações legítimas."
---

WAF no Application Gateway é aquele recurso que a maioria habilita, marca "configurado" no checklist de segurança e esquece. Até o primeiro falso positivo em produção, quando o WAF começa a bloquear requisições legítimas e o time de aplicação abre incidente achando que é bug deles.

A configuração correta evita esse ciclo.

## Modos de operação: Detection antes de Prevention

Nunca habilite o WAF direto em modo Prevention sem passar pelo Detection antes. Em Detection, o WAF loga o que bloquearia mas não bloqueia. Você tem visibilidade do impacto sem derrubar produção.

```bash
az network application-gateway waf-config set   --gateway-name agw-producao   --resource-group rg-app   --enabled true   --firewall-mode Detection   --rule-set-type OWASP   --rule-set-version 3.2
```

Analise os logs por pelo menos 48 horas em tráfego real antes de mudar para Prevention.

## Identificando o que está sendo bloqueado

```kql
AzureDiagnostics
| where ResourceType == "APPLICATIONGATEWAYS"
| where OperationName == "ApplicationGatewayFirewall"
| where action_s == "Blocked"
| project TimeGenerated, clientIp_s, requestUri_s, ruleId_s, ruleGroup_s, message_s
| order by TimeGenerated desc
```

Para cada regra que aparece com frequência, decida: é um ataque real ou falso positivo? Se for falso positivo, crie uma exclusão cirúrgica, não desabilite a regra inteira.

## Exclusões cirúrgicas (não desabilitar a regra inteira)

```bicep
resource wafPolicy 'Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies@2023-09-01' = {
  name: 'waf-policy-prod'
  location: location
  properties: {
    managedRules: {
      managedRuleSets: [
        { ruleSetType: 'OWASP', ruleSetVersion: '3.2' }
      ]
      exclusions: [
        {
          matchVariable: 'RequestBodyPostArgNames'
          selectorMatchOperator: 'Equals'
          selector: 'descricao_produto'
          exclusionManagedRuleSets: [
            {
              ruleSetType: 'OWASP'
              ruleSetVersion: '3.2'
              ruleGroups: [
                {
                  ruleGroupName: 'REQUEST-942-APPLICATION-ATTACK-SQLI'
                  rules: [{ ruleId: '942440' }]
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

Exclusão por campo específico e por regra específica. Não por toda a categoria, não por todo o request.

## Regras customizadas para controle fino

```bicep
customRules: [
  {
    name: 'bloquear-paises-sem-operacao'
    priority: 10
    ruleType: 'MatchRule'
    action: 'Block'
    matchConditions: [
      {
        matchVariables: [{ variableName: 'RemoteAddr' }]
        operator: 'GeoMatch'
        negationCondition: true
        matchValues: ['BR', 'US', 'PT']
      }
    ]
  }
]
```

<div class="callout">
<strong>WAF Policy em vez de WAF Config:</strong> O modelo antigo configura WAF diretamente no Application Gateway. O modelo atual usa WAF Policy como recurso separado, que pode ser associada a múltiplos gateways e listeners individualmente. Se você tem um ambiente existente com WAF Config, vale avaliar a migração para WAF Policy antes de adicionar mais regras customizadas.
</div>

O ciclo correto: Detection por 48h, analisar os top alertas, criar exclusões para falsos positivos confirmados, mudar para Prevention, monitorar. Pular essa etapa é a receita para um incidente de produção desnecessário.
