---
layout: ../../layouts/PostLayout.astro
title: "Azure Application Gateway com WAF: configuração prática e regras customizadas"
category: "Networking"
tag: "networking"
date: "01 Nov 2025"
readTime: "10 min"
description: "WAF no Application Gateway vai além de habilitar o OWASP ruleset. Regras customizadas, exclusões e integração com o Azure Monitor para uma proteção que não quebra aplicações legítimas."
---

WAF no Application Gateway e aquele recurso que a maioria habilita, marca "configurado" no checklist de segurança e esquece. Ate o primeiro falso positivo em producao, quando o WAF começa a bloquear requisicoes legitimas e o time de aplicacao abre incidente achando que e bug deles.

A configuracao correta evita esse ciclo.

## Modos de operacao: Detection antes de Prevention

Nunca habilite o WAF direto em modo Prevention sem passar pelo Detection antes. Em Detection, o WAF loga o que bloquearia mas nao bloqueia. Voce tem visibilidade do impacto sem derrubar producao.

```bash
az network application-gateway waf-config set   --gateway-name agw-producao   --resource-group rg-app   --enabled true   --firewall-mode Detection   --rule-set-type OWASP   --rule-set-version 3.2
```

Analise os logs por pelo menos 48 horas em trafego real antes de mudar para Prevention.

## Identificando o que esta sendo bloqueado

```kql
AzureDiagnostics
| where ResourceType == "APPLICATIONGATEWAYS"
| where OperationName == "ApplicationGatewayFirewall"
| where action_s == "Blocked"
| project TimeGenerated, clientIp_s, requestUri_s, ruleId_s, ruleGroup_s, message_s
| order by TimeGenerated desc
```

Para cada regra que aparece com frequencia, decida: e um ataque real ou falso positivo? Se for falso positivo, crie uma exclusao cirurgica, nao desabilite a regra inteira.

## Exclusoes cirurgicas (nao desabilitar a regra inteira)

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

Exclusao por campo especifico e por regra especifica. Nao por toda a categoria, nao por todo o request.

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
<strong>WAF Policy em vez de WAF Config:</strong> O modelo antigo configura WAF diretamente no Application Gateway. O modelo atual usa WAF Policy como recurso separado, que pode ser associada a multiplos gateways e listeners individualmente. Se voce tem um ambiente existente com WAF Config, vale avaliar a migracao para WAF Policy antes de adicionar mais regras customizadas.
</div>

O ciclo correto: Detection por 48h, analisar os top alertas, criar exclusoes para falsos positivos confirmados, mudar para Prevention, monitorar. Pular essa etapa e a receita para um incidente de producao desnecessario.
