---
layout: ../../layouts/PostLayout.astro
title: "AZ-900 na prática [6] — Custos, SLA e ciclo de vida de serviços"
category: "FinOps"
tag: "finops"
serie: "AZ-900 na prática"
serieSlug: "az900"
serieNum: 6
date: "21 Mar 2026"
readTime: "8 min"
description: "Como calcular custos no Azure, entender SLAs e o ciclo de vida de serviços — tópicos obrigatórios do AZ-900."
prev:
  title: "AZ-900 [5] — Identidade e Segurança"
  slug: "az900-05-identidade-seguranca"

---

Os domínios de custos e SLA são altamente cobrados no AZ-900. Entender como o Azure cobra e como SLAs funcionam é essencial para o exame e para evitar surpresas na fatura.

## Fatores que afetam o custo

**Tipo de recurso** — cada serviço tem sua própria estrutura de preço. VMs cobram por hora de alocação, Storage cobra por GB armazenado, Functions cobram por execução.

**Consumo** — paga pelo que usa. Uma VM desalocada não cobra compute (mas ainda cobra pelo disco).

**Região** — preços variam por região. Brazil South geralmente é mais caro que East US pelo custo de infraestrutura local.

**Largura de banda** — entrada de dados (inbound) é gratuita. Saída de dados (outbound) tem custo crescente por GB.

**Instâncias reservadas** — compromisso de 1 ou 3 anos em troca de desconto de até 72% sobre o preço sob demanda.

```bash
# Verificar custo do mês atual
az consumption usage list \
  --start-date 2026-03-01 \
  --end-date 2026-03-21 \
  --query "[].{Servico:instanceName, Custo:pretaxCost}" \
  --output table

# Criar alerta de orçamento
az consumption budget create \
  --budget-name orcamento-mensal \
  --amount 1000 \
  --time-grain Monthly \
  --start-date 2026-03-01 \
  --end-date 2027-02-28
```

## Azure Pricing Calculator vs TCO Calculator

**Pricing Calculator** (azure.microsoft.com/pricing/calculator) — estima o custo de recursos Azure que você planeja criar. Selecione serviço, região, configuração e veja o custo mensal estimado.

**TCO Calculator** (azure.microsoft.com/pricing/tco) — calcula o retorno sobre investimento da migração para o Azure comparando com on-premises. Inclui custos de hardware, energia, mão de obra e espaço físico.

## Azure Cost Management

Ferramenta integrada para monitorar, analisar e otimizar gastos:

```bash
# Ver recomendações de economia
az advisor recommendation list \
  --category Cost \
  --query "[].{Titulo:shortDescription.problem, Economia:extendedProperties.savingsAmount}" \
  --output table
```

## SLA — Service Level Agreement

SLA define o compromisso da Microsoft com disponibilidade. Calculado mensalmente.

| SLA | Downtime máximo/mês |
|-----|---------------------|
| 99% | ~7,2 horas |
| 99,9% | ~43,8 minutos |
| 99,95% | ~21,9 minutos |
| 99,99% | ~4,4 minutos |
| 99,999% | ~26 segundos |

**Como aumentar o SLA efetivo:**
- VMs em Availability Zones: 99,99%
- VMs em Availability Sets: 99,95%
- VM única com Premium SSD: 99,9%
- VM única com Standard SSD: 99,5%

<div class="callout">
<strong>Dica para o exame:</strong> SLAs compostos multiplicam as disponibilidades. Se você tem dois serviços com 99,9% cada em sequência: 0,999 × 0,999 = 99,8%. Para aumentar o SLA composto, adicione redundância em cada componente.
</div>

## Ciclo de vida de serviços

**Preview** — serviço em fase de testes, sem SLA garantido, pode mudar ou ser descontinuado.
- Public Preview: disponível para todos
- Private Preview: acesso restrito mediante solicitação

**General Availability (GA)** — serviço estável, com SLA garantido e suporte completo.

**Descontinuação** — Microsoft avisa com antecedência mínima de 12 meses antes de descontinuar serviços GA.

## Azure Marketplace

Repositório de soluções de terceiros certificadas para Azure: appliances de rede (Palo Alto, Fortinet), bancos de dados (MongoDB, Redis), ferramentas de monitoramento (Datadog, Splunk).

## O que cai no exame

- Fatores que afetam custo (tipo, consumo, região, banda de saída)
- Diferença entre Pricing Calculator e TCO Calculator
- Como SLAs são calculados e combinados (multiplicação)
- Que Preview não tem SLA garantido
- Reservas (1 ou 3 anos) como estratégia de economia
- Azure Hybrid Benefit para licenças Windows e SQL existentes
