---
layout: ../../layouts/PostLayout.astro
title: "Azure DDoS Protection: Standard vs Basic e quando contratar"
category: "Azure"
tag: "azure"
date: "25 Set 2025"
readTime: "8 min"
description: "DDoS Protection Standard custa caro. Quando faz sentido contratar, o que ele protege e o que não protege — análise técnica e financeira."
---

Todo recurso Azure tem proteção DDoS básica incluída sem custo adicional. A pergunta real é: quando vale pagar pelo DDoS Protection Standard?

## O que a proteção básica (gratuita) cobre

O Azure já mitiga automaticamente ataques volumétricos de grande escala contra a infraestrutura da Microsoft. Isso inclui:
- Ataques UDP/TCP flood de alta escala
- Amplification attacks (DNS, NTP, SSDP)
- Ataques à camada de infraestrutura do Azure

O que a proteção básica **não** cobre: ataques direcionados especificamente aos seus IPs públicos, ataques de camada de aplicação (L7) e telemetria detalhada sobre os ataques.

## O que o DDoS Protection Standard adiciona

**1. Tuning adaptativo por IP público**
O Standard aprende o perfil de tráfego normal de cada IP público e ajusta os limites de mitigação automaticamente. Isso reduz falsos positivos durante picos legítimos de tráfego.

**2. Telemetria em tempo real**
Métricas no Azure Monitor durante e após um ataque: packets dropped, bytes ingested, attack vectors. Você sabe exatamente o que aconteceu.

**3. Garantia de crédito de custo**
Se um ataque causar scale-out automático dos seus recursos (VM Scale Sets, App Service), a Microsoft reembolsa o custo de computação gerado durante o ataque.

**4. Acesso ao DDoS Rapid Response team**
Durante um ataque, você pode abrir um ticket prioritário com especialistas em DDoS da Microsoft.

## Custo: o elefante na sala

O DDoS Protection Standard custa aproximadamente **$2.944/mês** por plano (cobre até 100 IPs públicos na mesma região). Para muitas empresas, especialmente PMEs, esse custo é significativo.

O que está incluído no custo:
- Proteção por IP público na região do plano
- Proteção para todos os recursos na VNet associada
- Suporte técnico durante ataques

## Quando vale a pena contratar

**Vale:**
- Aplicações financeiras, e-commerce ou qualquer serviço onde downtime tem custo financeiro direto
- Serviços com histórico de serem alvo de DDoS (ex: exchanges, serviços populares)
- Ambientes regulados onde a documentação de proteção DDoS é requisito de compliance
- Quando o custo de um downtime de 4 horas é maior que o custo mensal do serviço

**Não vale:**
- Ambientes internos sem IPs públicos (Private Endpoints resolvem a exposição)
- Ambientes de desenvolvimento e homologação
- Aplicações atrás do Azure Front Door ou Application Gateway com WAF (que já têm proteção L7)
- Quando todo o acesso já passa por Azure Firewall

<div class="callout">
<strong>Alternativa para muitos casos:</strong> Se sua preocupação é ataques L7 (HTTP flood, SQL injection, XSS), o WAF do Azure Application Gateway ou Azure Front Door cobre esses vetores por uma fração do custo do DDoS Standard. Os dois não são substitutos, mas frequentemente o WAF resolve o que as empresas de médio porte realmente precisam.
</div>

## Associando o plano a uma VNet

```bash
# Criar o plano de proteção DDoS
az network ddos-protection create \
  --name ddos-protection-plan \
  --resource-group rg-networking \
  --location brazilsouth

# Associar a uma VNet
az network vnet update \
  --name vnet-producao \
  --resource-group rg-networking \
  --ddos-protection-plan ddos-protection-plan
```

## Conclusão

O DDoS Protection Standard é caro e específico. Para a maioria dos workloads corporativos que usam Private Endpoints extensivamente e têm tráfego público mínimo, a proteção básica gratuita é suficiente. Avalie o custo real de downtime para seu negócio antes de decidir.
