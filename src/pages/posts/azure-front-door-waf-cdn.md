---
layout: ../../layouts/PostLayout.astro
title: "Azure Front Door: WAF, CDN e balanceamento global explicados"
category: "Networking"
tag: "networking"
date: "08 Jan 2026"
readTime: "9 min"
description: "Como o Azure Front Door combina WAF, CDN e roteamento global, e quando usá-lo em vez do Application Gateway."
---

O Azure Front Door é frequentemente descrito como "CDN com WAF", mas essa descrição subestima o que ele faz. É uma plataforma de entrega de aplicações globais que combina roteamento inteligente, proteção contra ataques, aceleração de conteúdo e failover automático em um único serviço.

## O que o Front Door faz

**Anycast global:** o Front Door tem pontos de presença (PoPs) em dezenas de regiões. Quando um usuário acessa seu domínio, o DNS resolve para o PoP mais próximo. O tráfego chega rápido ao PoP e viaja pelo backbone da Microsoft até o backend, mais rápido que pela internet pública.

**WAF:** proteção contra ataques na camada de aplicação (OWASP Top 10, DDoS L7, bots maliciosos) aplicada globalmente em todos os PoPs.

**CDN:** cache de conteúdo estático e dinâmico nos PoPs, o que reduz a carga nos backends e melhora a latência para usuários distantes.

**Roteamento inteligente:** distribui tráfego entre múltiplos backends por latência, peso, prioridade ou regras customizadas.

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

## WAF: proteção aplicada globalmente

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
| Escopo | Global (multi-região) | Regional (uma região) |
| Anycast | Sim | Não |
| CDN | Sim | Não |
| WAF | Sim (global) | Sim (regional) |
| SSL Offload | Sim | Sim |
| Private Link para backend | Sim (Premium) | Não |
| Custo base | Maior | Menor |

**Use Front Door quando:**
- Aplicação com usuários em múltiplas regiões
- Precisa de CDN + WAF + balanceamento global em um serviço
- Failover automático entre regiões

**Use Application Gateway quando:**
- Aplicação em uma única região
- Precisão de roteamento por URL path para microsserviços
- Integração direta com AKS Ingress

<div class="callout">
<strong>Private Link para backends:</strong> No SKU Premium, o Front Door pode se conectar aos seus backends via Private Link: o tráfego do PoP ao backend não passa pela internet pública. Útil quando o backend precisa estar sem IP público mas com acesso via Front Door.
</div>

## Conclusão

O Azure Front Door é a escolha certa para aplicações com requisitos globais de latência, proteção contra ataques e alta disponibilidade multi-região. Para aplicações regionais sem necessidade de CDN, o Application Gateway é mais simples e econômico.
