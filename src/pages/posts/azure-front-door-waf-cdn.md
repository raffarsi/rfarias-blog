---
layout: ../../layouts/PostLayout.astro
title: "Azure Front Door: WAF, CDN e balanceamento global explicados"
category: "Azure"
tag: "azure"
date: "08 Jan 2026"
readTime: "9 min"
description: "Como o Azure Front Door combina WAF, CDN e roteamento global -- e quando usa-lo em vez do Application Gateway."
---

O Azure Front Door e frequentemente descrito como "CDN com WAF" -- mas essa descricao subestima o que ele faz. E uma plataforma de entrega de aplicacoes globais que combina roteamento inteligente, protecao contra ataques, aceleracao de conteudo e failover automatico em um unico servico.

## O que o Front Door faz

**Anycast global:** o Front Door tem pontos de presenca (PoPs) em dezenas de regioes. Quando um usuario acessa seu dominio, o DNS resolve para o PoP mais proximo. O trafego chega rapido ao PoP e viaja pelo backbone da Microsoft ate o backend -- mais rapido que pela internet publica.

**WAF:** protecao contra ataques na camada de aplicacao (OWASP Top 10, DDoS L7, bots maliciosos) aplicada globalmente em todos os PoPs.

**CDN:** cache de conteudo estatico e dinamico nos PoPs -- reduz a carga nos backends e melhora a latencia para usuarios distantes.

**Roteamento inteligente:** distribui trafego entre multiplos backends por latencia, peso, prioridade ou regras customizadas.

## Criando um perfil Front Door

```bicep
resource frontDoor 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: 'fd-meuapp'
  location: 'global'
  sku: { name: 'Premium_AzureFrontDoor' }  // Premium para WAF gerenciado
}

// Endpoint publico
resource fdEndpoint 'Microsoft.Cdn/profiles/afdEndpoints@2023-05-01' = {
  name: 'endpoint-producao'
  parent: frontDoor
  location: 'global'
  properties: { enabledState: 'Enabled' }
}

// Grupo de origens (backends)
resource originGroup 'Microsoft.Cdn/profiles/originGroups@2023-05-01' = {
  name: 'og-backends'
  parent: frontDoor
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/health'
      probeRequestType: 'GET'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 30
    }
  }
}

// Backend primario (Brazil South)
resource originPrimary 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = {
  name: 'origin-br'
  parent: originGroup
  properties: {
    hostName: 'meuapp-br.azurewebsites.net'
    httpPort: 80
    httpsPort: 443
    originHostHeader: 'meuapp-br.azurewebsites.net'
    priority: 1
    weight: 1000
  }
}

// Backend secundario (East US - DR)
resource originSecondary 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = {
  name: 'origin-us'
  parent: originGroup
  properties: {
    hostName: 'meuapp-us.azurewebsites.net'
    httpPort: 80
    httpsPort: 443
    originHostHeader: 'meuapp-us.azurewebsites.net'
    priority: 2      // ativado so se o primario falhar
    weight: 1000
  }
}
```

## WAF: protecao aplicada globalmente

```bicep
resource wafPolicy 'Microsoft.Network/FrontDoorWebApplicationFirewallPolicies@2022-05-01' = {
  name: 'waf-fd-producao'
  location: 'global'
  sku: { name: 'Premium_AzureFrontDoor' }
  properties: {
    policySettings: {
      mode: 'Prevention'   // bloqueia, nao so loga
      enabledState: 'Enabled'
    }
    managedRules: {
      managedRuleSets: [
        { ruleSetType: 'Microsoft_DefaultRuleSet', ruleSetVersion: '2.1' }
        { ruleSetType: 'Microsoft_BotManagerRuleSet', ruleSetVersion: '1.1' }
      ]
    }
    customRules: {
      rules: [
        {
          name: 'RateLimit'
          priority: 10
          ruleType: 'RateLimitRule'
          rateLimitDurationInMinutes: 1
          rateLimitThreshold: 100   // max 100 req/min por IP
          action: 'Block'
          matchConditions: [
            {
              matchVariable: 'RemoteAddr'
              operator: 'IPMatch'
              matchValue: ['0.0.0.0/0']
            }
          ]
        }
      ]
    }
  }
}
```

## Front Door vs Application Gateway

| | Front Door | Application Gateway |
|---|---|---|
| Escopo | Global (multi-regiao) | Regional (uma regiao) |
| Anycast | Sim | Nao |
| CDN | Sim | Nao |
| WAF | Sim (global) | Sim (regional) |
| SSL Offload | Sim | Sim |
| Private Link para backend | Sim (Premium) | Nao |
| Custo base | Maior | Menor |

**Use Front Door quando:**
- Aplicacao com usuarios em multiplas regioes
- Precisa de CDN + WAF + balanceamento global em um servico
- Failover automatico entre regioes

**Use Application Gateway quando:**
- Aplicacao em uma unica regiao
- Precisao de roteamento por URL path para microservicos
- Integracao direta com AKS Ingress

<div class="callout">
<strong>Private Link para backends:</strong> No SKU Premium, o Front Door pode se conectar aos seus backends via Private Link -- o trafego do PoP ao backend nao passa pela internet publica. Util quando o backend precisa estar sem IP publico mas com acesso via Front Door.
</div>

## Conclusao

O Azure Front Door e a escolha certa para aplicacoes com requisitos globais de latencia, protecao contra ataques e alta disponibilidade multi-regiao. Para aplicacoes regionais sem necessidade de CDN, o Application Gateway e mais simples e economico.
