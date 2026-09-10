---
layout: ../../layouts/PostLayout.astro
title: "Azure Application Gateway com WAF: configuração prática e regras customizadas"
category: "Networking"
tag: "networking"
date: "01 Nov 2025"
readTime: "10 min"
description: "WAF no Application Gateway vai além de habilitar o OWASP ruleset. Regras customizadas, exclusões e integração com o Azure Monitor para uma proteção que não quebra aplicações legítimas."
---

O Azure Application Gateway com WAF (Web Application Firewall) é frequentemente habilitado e esquecido — o OWASP ruleset vai para produção com as configurações padrão e fica lá até começar a bloquear requisições legítimas. Configuração adequada exige entender como as regras se aplicam, como criar exclusões cirúrgicas e como monitorar o que está sendo bloqueado.

## Modos de operação: Detection vs Prevention

O WAF opera em dois modos:

**Detection:** inspeciona o tráfego, loga o que violaria as regras, mas não bloqueia. Use para entender o impacto antes de ativar.

**Prevention:** bloqueia ativamente. Ative só depois de analisar os logs do modo Detection por pelo menos 48h em tráfego real.

```bash
# Ativar modo Prevention
az network application-gateway waf-config set \
  --gateway-name agw-producao \
  --resource-group rg-app \
  --enabled true \
  --firewall-mode Prevention \
  --rule-set-type OWASP \
  --rule-set-version 3.2
```

## Exclusões: o que fazer quando o WAF bloqueia tráfego legítimo

O cenário mais comum: uma aplicação envia dados no body de um POST que o WAF interpreta como SQL injection. Em vez de desabilitar a regra inteira, crie uma exclusão cirúrgica:

```bicep
resource wafPolicy 'Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies@2023-09-01' = {
  name: 'waf-policy-prod'
  location: location
  properties: {
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: 'OWASP'
          ruleSetVersion: '3.2'
        }
      ]
      exclusions: [
        {
          matchVariable: 'RequestBodyPostArgNames'
          selectorMatchOperator: 'Equals'
          selector: 'descricao_produto'   // campo específico que dispara falso positivo
          exclusionManagedRuleSets: [
            {
              ruleSetType: 'OWASP'
              ruleSetVersion: '3.2'
              ruleGroups: [
                {
                  ruleGroupName: 'REQUEST-942-APPLICATION-ATTACK-SQLI'
                  rules: [{ ruleId: '942440' }]  // só a regra específica
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

## Identificando o que está sendo bloqueado

```kql
AzureDiagnostics
| where ResourceType == "APPLICATIONGATEWAYS"
| where OperationName == "ApplicationGatewayFirewall"
| where action_s == "Blocked"
| project TimeGenerated, clientIp_s, requestUri_s, ruleId_s, ruleGroup_s, message_s
| order by TimeGenerated desc
```

Antes de criar exclusões, confirme que o tráfego bloqueado é legítimo — o log inclui o IP de origem e a URI completa.

## Regras customizadas

Além das regras OWASP, você pode criar regras próprias com prioridade mais alta:

```bicep
customRules: [
  {
    name: 'bloquear-paises-nao-operamos'
    priority: 10
    ruleType: 'MatchRule'
    action: 'Block'
    matchConditions: [
      {
        matchVariables: [{ variableName: 'RemoteAddr' }]
        operator: 'GeoMatch'
        negationCondition: true
        matchValues: ['BR', 'US', 'PT']  // só permitir Brasil, EUA e Portugal
      }
    ]
  }
]
```

<div class="callout">
<strong>WAF Policy vs WAF Config:</strong> O modelo antigo usa WAF Config diretamente no Application Gateway. O modelo atual usa WAF Policy (recurso separado) que pode ser associada a múltiplos gateways e listeners individualmente. Prefira WAF Policy — é mais flexível e permite políticas diferentes por URI path.
</div>

## Conclusão

WAF no Application Gateway bem configurado exige um ciclo: Detection → análise de logs → exclusões cirúrgicas → Prevention. Desabilitar regras inteiras para resolver falsos positivos troca segurança por conveniência. Exclusões por campo e por regra específica resolvem o problema sem abrir brechas desnecessárias.
