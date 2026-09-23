---
layout: ../../layouts/PostLayout.astro
title: "Azure DDoS Protection: Standard vs Basic e quando contratar"
category: "Networking"
tag: "networking"
date: "25 Set 2025"
readTime: "8 min"
description: "DDoS Protection Standard custa caro. Quando faz sentido contratar, o que ele protege e o que não protege. Análise técnica e financeira."
---

Todo ambiente Azure tem proteção DDoS básica incluída sem custo. A pergunta real é: quando o DDoS Protection Standard, que custa em torno de 3 mil dólares por mês, agrega valor suficiente para justificar esse investimento?

Na maioria dos casos corporativos que analiso, a resposta é não.

## O que a proteção básica gratuita já faz

O Azure mitiga automaticamente ataques volumétricos de grande escala contra a infraestrutura da Microsoft. Isso inclui UDP/TCP flood de alta escala, amplification attacks (DNS, NTP, SSDP) e ataques a camada de infraestrutura.

O que a proteção básica não faz: mitigar ataques direcionados especificamente aos seus IPs públicos, detectar ataques de camada de aplicação (L7) e fornecer telemetria detalhada sobre o que está acontecendo.

## O que o Standard adiciona

**Tuning adaptativo por IP:** aprende o perfil de tráfego normal do seu IP e ajusta os limites automaticamente. Reduz falsos positivos durante picos legítimos.

**Telemetria em tempo real:** você sabe o que aconteceu durante um ataque, quais vetores, quantos pacotes descartados.

**Garantia de reembolso:** se um ataque causar scale-out automático dos seus recursos, a Microsoft reembolsa o custo de computação gerado.

**Suporte prioritário:** acesso ao time de DDoS da Microsoft durante um ataque ativo.

## Quando faz sentido contratar

Contratar quando: a aplicação é financeira ou de comércio eletrônico onde downtime tem custo direto e mensurável, quando você já foi alvo de DDoS antes, ou quando o requisito de compliance exige documentação de proteção DDoS.

Não faz sentido quando: a maioria do tráfego passa por Private Endpoints (tráfego privado não é exposto), o ambiente é interno sem IPs públicos relevantes, ou quando o WAF do Front Door ou Application Gateway já cobre os vetores L7 que são sua preocupação real.

```bash
# Criar plano e associar VNet
az network ddos-protection create   --name ddos-plan   --resource-group rg-networking   --location brazilsouth

az network vnet update   --name vnet-producao   --resource-group rg-networking   --ddos-protection-plan ddos-plan
```

<div class="callout">
<strong>WAF vs DDoS Standard:</strong> Se sua preocupação principal e ataques HTTP flood, SQL injection ou XSS, o WAF do Application Gateway ou Front Door cobre isso por uma fração do custo do DDoS Standard. Os dois não são substitutos tecnicamente, mas para muitas empresas de médio porte, o WAF resolve o que preocupa de verdade.
</div>

Calcule o custo real de um downtime de 4 horas para o seu negócio. Se for menor que 3 mil dólares por mês, o DDoS Standard provavelmente não se paga. Se for significativamente maior, vale a avaliação.
