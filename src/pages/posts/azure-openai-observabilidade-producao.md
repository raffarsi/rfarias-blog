---
layout: ../../layouts/PostLayout.astro
title: "Observabilidade de pipelines de IA no Azure: logs, traces e métricas"
category: "IA Generativa"
tag: "ia-generativa"
date: "03 Fev 2026"
readTime: "10 min"
description: "Como instrumentar pipelines RAG com Application Insights, OpenTelemetry e Azure Monitor para visibilidade real em produção."
---

Você colocou o pipeline RAG em produção. Está respondendo. E aí alguém reclama que está lento, e você não sabe dizer onde.

É o embedding? A busca? A geração? A rede entre os serviços?

Sem instrumentação, a resposta é sempre 'não sei'. O problema não é falta de ferramenta, é falta de granularidade. A maioria dos logs de Azure OpenAI mostra latência total. O que você precisa é latência por componente.

## Instrumentando cada etapa do pipeline

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from azure.monitor.opentelemetry.exporter import AzureMonitorTraceExporter
import time

exporter = AzureMonitorTraceExporter(
    connection_string='InstrumentationKey=xxx;IngestionEndpoint=https://...'
)
provider = TracerProvider()
provider.add_span_processor(BatchSpanProcessor(exporter))
trace.set_tracer_provider(provider)
tracer = trace.get_tracer('pipeline-rag')

async def pipeline_rag(pergunta: str, user_id: str) -> dict:
    timings = {}
    with tracer.start_as_current_span('rag-pipeline') as span:
        span.set_attribute('user_id', user_id)

        with tracer.start_as_current_span('embedding') as s:
            t0 = time.perf_counter()
            embedding = await gerar_embedding(pergunta)
            timings['embedding_ms'] = int((time.perf_counter() - t0) * 1000)
            s.set_attribute('duration_ms', timings['embedding_ms'])

        with tracer.start_as_current_span('search') as s:
            t0 = time.perf_counter()
            docs = await buscar_documentos(pergunta, embedding)
            timings['search_ms'] = int((time.perf_counter() - t0) * 1000)
            s.set_attribute('duration_ms', timings['search_ms'])
            s.set_attribute('docs_returned', len(docs))

        with tracer.start_as_current_span('generation') as s:
            t0 = time.perf_counter()
            resposta, usage = await gerar_resposta(pergunta, docs)
            timings['generation_ms'] = int((time.perf_counter() - t0) * 1000)
            s.set_attribute('duration_ms', timings['generation_ms'])
            s.set_attribute('tokens_total', usage.total_tokens)

    return {'resposta': resposta, 'timings': timings}
```

## Queries KQL que realmente uso

```kql
// Latencia P50/P90/P99 por componente
dependencies
| where name in ('embedding', 'search', 'generation')
| summarize
    p50 = percentile(duration, 50),
    p90 = percentile(duration, 90),
    p99 = percentile(duration, 99)
    by name, bin(timestamp, 1h)
| order by timestamp desc
```

Essa query revela algo que me surpreende sempre que configuro um novo ambiente: embedding frequentemente é mais lento que busca quando os Private Endpoints estão em regiões diferentes. A chamada de embedding é para um endpoint separado, e se os dois não estão na mesma região, o overhead de rede acumula.

```kql
// Custo de tokens por hora
customEvents
| where name == 'rag-pipeline'
| extend tokens_total = toint(customDimensions['tokens_total'])
| summarize
    total_tokens = sum(tokens_total),
    requisicoes = count(),
    custo_estimado_usd = sum(tokens_total) * 0.000005
    by bin(timestamp, 1h)
| order by timestamp desc
```

```kql
// Requisicoes acima de 10 segundos
dependencies
| where name == 'rag-pipeline' and duration > 10000
| project timestamp, duration, customDimensions
| order by duration desc
```

## Alerta para degradação de latência

```bash
az monitor scheduled-query create \
  --name alert-latencia-rag \
  --resource-group rg-monitoring \
  --condition 'count > 0' \
  --condition-query "dependencies | where name == 'rag-pipeline' | where duration > 15000 | summarize count()" \
  --evaluation-frequency 5m \
  --window-size 15m \
  --severity 2
```

<div class="callout">
<strong>Não logue o conteúdo das mensagens em produção.</strong> Por LGPD e privacidade, logue métricas (tamanho em tokens, latência, sucesso/falha), não o texto das perguntas e respostas.
</div>

A diferença entre resolver um incidente em 5 minutos e em 2 horas é ter o trace certo no momento certo. Instrumentar antes do problema é a única forma de ter esse trace disponível quando você precisar.
