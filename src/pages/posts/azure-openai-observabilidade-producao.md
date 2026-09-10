---
layout: ../../layouts/PostLayout.astro
title: "Observabilidade de pipelines de IA no Azure: logs, traces e métricas"
category: "IA Generativa"
tag: "ia-generativa"
date: "03 Fev 2026"
readTime: "10 min"
description: "Como instrumentar pipelines RAG com Application Insights, OpenTelemetry e Azure Monitor para visibilidade real em produção."
---
Quando um pipeline RAG falha em produção, a primeira pergunta é: onde? No embedding? Na busca? Na geração? Sem observabilidade adequada, a resposta é sempre "não sei" — você faz uma pergunta lenta e não consegue dizer qual dos quatro saltos está causando o problema.

## Os três pilares de observabilidade para IA

**Métricas:** latência por componente (P50/P90/P99), taxa de sucesso, tokens consumidos, custo.

**Traces:** rastreamento de ponta a ponta de cada requisição — do input do usuário à resposta final, com cada chamada intermediária.

**Logs:** detalhes de erros, informações de debug, eventos relevantes do sistema.

## Instrumentação com OpenTelemetry

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from azure.monitor.opentelemetry.exporter import AzureMonitorTraceExporter
import time

# Configurar exportação para Application Insights
exporter = AzureMonitorTraceExporter(
    connection_string="InstrumentationKey=xxx;IngestionEndpoint=https://..."
)
provider = TracerProvider()
provider.add_span_processor(BatchSpanProcessor(exporter))
trace.set_tracer_provider(provider)
tracer = trace.get_tracer("pipeline-rag")

async def pipeline_rag(pergunta: str, user_id: str) -> dict:
    timings = {}

    with tracer.start_as_current_span("rag-pipeline") as span:
        span.set_attribute("user_id", user_id)
        span.set_attribute("query_length", len(pergunta))

        # Embedding
        with tracer.start_as_current_span("embedding") as emb_span:
            t0 = time.perf_counter()
            embedding = await gerar_embedding(pergunta)
            timings["embedding_ms"] = int((time.perf_counter() - t0) * 1000)
            emb_span.set_attribute("duration_ms", timings["embedding_ms"])
            emb_span.set_attribute("dimensions", len(embedding))

        # Busca
        with tracer.start_as_current_span("search") as search_span:
            t0 = time.perf_counter()
            documentos = await buscar_documentos(pergunta, embedding)
            timings["search_ms"] = int((time.perf_counter() - t0) * 1000)
            search_span.set_attribute("duration_ms", timings["search_ms"])
            search_span.set_attribute("docs_returned", len(documentos))

        # Geração
        with tracer.start_as_current_span("generation") as gen_span:
            t0 = time.perf_counter()
            resposta, usage = await gerar_resposta(pergunta, documentos)
            timings["generation_ms"] = int((time.perf_counter() - t0) * 1000)
            gen_span.set_attribute("duration_ms", timings["generation_ms"])
            gen_span.set_attribute("tokens_input", usage.prompt_tokens)
            gen_span.set_attribute("tokens_output", usage.completion_tokens)
            gen_span.set_attribute("tokens_total", usage.total_tokens)

        timings["total_ms"] = sum(timings.values())
        span.set_attribute("total_ms", timings["total_ms"])

    return {"resposta": resposta, "timings": timings}
```

## Dashboard no Application Insights

Com os traces chegando, você consegue visualizar:

```kql
// Latência P50/P90/P99 por componente
dependencies
| where name in ("embedding", "search", "generation")
| summarize
    p50 = percentile(duration, 50),
    p90 = percentile(duration, 90),
    p99 = percentile(duration, 99)
    by name, bin(timestamp, 1h)
| order by timestamp desc
```

```kql
// Custo de tokens por hora
customEvents
| where name == "rag-pipeline"
| extend tokens_total = toint(customDimensions["tokens_total"])
| summarize
    total_tokens = sum(tokens_total),
    requisicoes = count(),
    custo_estimado_usd = sum(tokens_total) * 0.000005  // ajustar por modelo
    by bin(timestamp, 1h)
| order by timestamp desc
```

```kql
// Requisições lentas (P99 > 10s)
dependencies
| where name == "rag-pipeline"
| where duration > 10000
| project timestamp, duration, customDimensions
| order by duration desc
```

## Métricas customizadas com Azure Monitor

```python
from azure.monitor.query import MetricsQueryClient
from azure.monitor.ingestion import LogsIngestionClient
from opentelemetry.metrics import get_meter

meter = get_meter("pipeline-rag")

# Histogramas de latência
latencia_embedding = meter.create_histogram(
    "embedding_latency_ms",
    description="Latência de geração de embeddings em milissegundos"
)
latencia_busca = meter.create_histogram(
    "search_latency_ms",
    description="Latência de busca no AI Search em milissegundos"
)
contador_tokens = meter.create_counter(
    "tokens_consumidos",
    description="Total de tokens consumidos no Azure OpenAI"
)

# Uso nas funções
def registrar_metricas(timings: dict, tokens: int):
    latencia_embedding.record(timings.get("embedding_ms", 0))
    latencia_busca.record(timings.get("search_ms", 0))
    contador_tokens.add(tokens)
```

## Alertas para anomalias

```bash
# Alerta: latência P99 > 15 segundos
az monitor scheduled-query create   --name alerta-latencia-rag   --resource-group rg-monitoring   --scopes $(az resource show     --resource-type microsoft.insights/components     --name appinsights-ia     --resource-group rg-ia --query id -o tsv)   --condition "count > 0"   --condition-query "
    dependencies
    | where name == 'rag-pipeline'
    | where duration > 15000
    | summarize count()"   --evaluation-frequency 5m   --window-size 15m   --severity 2   --action-groups $(az monitor action-group show     --name ag-oncall --resource-group rg-monitoring --query id -o tsv)
```

<div class="callout">
<strong>Não logue o conteúdo das mensagens em produção.</strong> Por LGPD e privacidade, evite logar o texto das perguntas dos usuários e as respostas do modelo em sistemas de observabilidade. Logue métricas (tamanho em tokens, latência, sucesso/falha) — não o conteúdo. Se precisar de conteúdo para debug, use um ambiente separado com dados sintéticos.
</div>

## Conclusão

Observabilidade em pipelines de IA é mais complexa do que em APIs tradicionais porque você tem múltiplos componentes com perfis de latência muito diferentes — embeddings são rápidos (50-200ms), busca é média (100-500ms), geração é lenta (1-10s). Instrumentar cada componente separadamente e medir P90/P99 por componente é o que permite otimizar o pipeline certo em vez de tentar melhorar o tempo total sem saber onde está o gargalo.
