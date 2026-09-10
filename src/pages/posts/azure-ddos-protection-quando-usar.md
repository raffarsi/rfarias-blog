---
layout: ../../layouts/PostLayout.astro
title: "Azure DDoS Protection: Standard vs Basic e quando contratar"
category: "Networking"
tag: "networking"
date: "25 Set 2025"
readTime: "8 min"
description: "DDoS Protection Standard custa caro. Quando faz sentido contratar, o que ele protege e o que não protege — análise técnica e financeira."
---

Todo ambiente Azure tem protecao DDoS basica incluida sem custo. A pergunta real e: quando o DDoS Protection Standard, que custa em torno de 3 mil dolares por mes, agrega valor suficiente para justificar esse investimento?

Na maioria dos casos corporativos que analiso, a resposta e nao.

## O que a protecao basica gratuita ja faz

O Azure mitiga automaticamente ataques volumetricos de grande escala contra a infraestrutura da Microsoft. Isso inclui UDP/TCP flood de alta escala, amplification attacks (DNS, NTP, SSDP) e ataques a camada de infraestrutura.

O que a protecao basica nao faz: mitigar ataques direcionados especificamente aos seus IPs publicos, detectar ataques de camada de aplicacao (L7) e fornecer telemetria detalhada sobre o que esta acontecendo.

## O que o Standard adiciona

**Tuning adaptativo por IP:** aprende o perfil de trafego normal do seu IP e ajusta os limites automaticamente. Reduz falsos positivos durante picos legitimos.

**Telemetria em tempo real:** voce sabe o que aconteceu durante um ataque, quais vetores, quantos pacotes descartados.

**Garantia de reembolso:** se um ataque causar scale-out automatico dos seus recursos, a Microsoft reembolsa o custo de computacao gerado.

**Suporte prioritario:** acesso ao time de DDoS da Microsoft durante um ataque ativo.

## Quando faz sentido contratar

Contratar quando: a aplicacao e financeira ou de comercio eletronico onde downtime tem custo direto e mensuravel, quando voce ja foi alvo de DDoS antes, ou quando o requisito de compliance exige documentacao de protecao DDoS.

Nao faz sentido quando: a maioria do trafego passa por Private Endpoints (trafego privado nao e exposto), o ambiente e interno sem IPs publicos relevantes, ou quando o WAF do Front Door ou Application Gateway ja cobre os vetores L7 que sao sua preocupacao real.

```bash
# Criar plano e associar VNet
az network ddos-protection create   --name ddos-plan   --resource-group rg-networking   --location brazilsouth

az network vnet update   --name vnet-producao   --resource-group rg-networking   --ddos-protection-plan ddos-plan
```

<div class="callout">
<strong>WAF vs DDoS Standard:</strong> Se sua preocupacao principal e ataques HTTP flood, SQL injection ou XSS, o WAF do Application Gateway ou Front Door cobre isso por uma fracao do custo do DDoS Standard. Os dois nao sao substitutos tecnicamente, mas para muitas empresas de medio porte, o WAF resolve o que preocupa de verdade.
</div>

Calcule o custo real de um downtime de 4 horas para o seu negocio. Se for menor que 3 mil dolares por mes, o DDoS Standard provavelmente nao se paga. Se for significativamente maior, vale a avaliacao.
