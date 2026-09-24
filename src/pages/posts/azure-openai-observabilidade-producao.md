---
layout: ../../layouts/PostLayout.astro
title: "Observabilidade de pipelines de IA no Azure: logs, traces e métricas"
category: "IA Generativa"
tag: "ia-generativa"
date: "03 Fev 2026"
readTime: "5 min"
description: "\"Está lento\" e \"respondeu errado\" são as duas reclamações que todo pipeline RAG recebe. Sem trace por etapa, a resposta é sempre \"não sei\". O que medir, como instrumentar com OpenTelemetry e as consultas que encurtam o diagnóstico."
---

"O assistente está lento." A reclamação chegou, e ninguém no time sabia dizer onde. O painel mostrava a latência total da chamada, e só isso.

Era o embedding? A busca? A geração? A rede entre os serviços? Cada pessoa tinha um palpite, e cada palpite levava a uma mudança diferente.

Já vi esse cenário se repetir: o pipeline RAG vai para produção medindo só o tempo de ponta a ponta, e o primeiro incidente vira uma sessão de adivinhação. O problema quase nunca é falta de ferramenta. É falta de granularidade.

## Duas reclamações, duas perguntas

Pipeline de IA recebe dois tipos de reclamação, e cada um pede uma medição diferente.

**"Está lento"** é uma pergunta de tempo: qual etapa consome a maior parte da latência, e desde quando.

**"Respondeu errado"** é uma pergunta de qualidade: a busca trouxe os documentos certos? Trouxe algum? O modelo respondeu sem contexto?

A maioria das instrumentações cobre a primeira e esquece a segunda. E a segunda é a que mais desgasta a confiança do usuário.

## O que medir em cada etapa

| Etapa | O que registrar | Pergunta que responde |
|-------|-----------------|-----------------------|
| Embedding | Duração, modelo | A lentidão começa antes da busca? |
| Busca | Duração, documentos retornados, maior score | A busca achou algo relevante? |
| Geração | Duração, tokens de entrada e saída, modelo | O custo e a latência vêm do tamanho do contexto? |
| Pipeline inteiro | Duração total, área ou tenant do usuário, se respondeu sem documento | Quem é afetado e com que frequência? |

O campo "respondeu sem documento" é o mais subestimado. Quando ele sobe, o índice parou de cobrir o que as pessoas perguntam, e nenhum painel de latência vai mostrar isso.

## Instrumentando com OpenTelemetry

O caminho atual no Azure é OpenTelemetry exportando para o Application Insights. O próprio tracing do Microsoft Foundry (antigo Azure AI Foundry) funciona assim, seguindo as convenções semânticas de IA generativa do OpenTelemetry. Com a distribuição do Azure Monitor e o instrumentador de IA generativa do OpenTelemetry para o SDK da OpenAI (pacote `opentelemetry-instrumentation-genai-openai`, que cobre Chat Completions, embeddings e Responses API), as chamadas ao modelo já saem com tokens e nome do modelo. O pacote ainda é beta, então fixe a versão no `requirements.txt`. O que falta são os spans das suas etapas:

```python
from azure.monitor.opentelemetry import configure_azure_monitor
from opentelemetry import trace
from opentelemetry.instrumentation.genai.openai import OpenAIInstrumentor

configure_azure_monitor()  # usa APPLICATIONINSIGHTS_CONNECTION_STRING do ambiente
OpenAIInstrumentor().instrument()
tracer = trace.get_tracer("pipeline-rag")


def responder(pergunta: str, usuario: dict) -> str:
    with tracer.start_as_current_span("rag.pipeline") as span:
        span.set_attribute("app.area", usuario["area"])

        with tracer.start_as_current_span("rag.embedding"):
            vetor = gerar_embedding(pergunta)

        with tracer.start_as_current_span("rag.busca") as s:
            docs = buscar(pergunta, vetor, usuario)
            s.set_attribute("rag.docs_retornados", len(docs))
            s.set_attribute("rag.melhor_score", docs[0].score if docs else 0.0)

        with tracer.start_as_current_span("rag.geracao") as s:
            s.set_attribute("rag.sem_contexto", not docs)
            return gerar(pergunta, docs)
```

Os spans internos caem na tabela `dependencies` do Application Insights (`AppDependencies`, se você consulta pelo workspace do Log Analytics), e os atributos vão para `customDimensions`. Isso importa para as consultas: evento customizado e span são coisas diferentes, e consultar a tabela errada devolve vazio sem erro nenhum.

## Três consultas que encurtam o diagnóstico

**Onde está o tempo.** Percentis por etapa nas últimas 24 horas. Eu olho o p95, não a média: a média esconde exatamente os usuários que estão reclamando.

```kql
dependencies
| where timestamp > ago(24h)
| where name startswith "rag."
| summarize p50 = percentile(duration, 50), p95 = percentile(duration, 95), chamadas = count() by name
| order by p95 desc
```

Já vi essa consulta mostrar o embedding mais lento que a busca, porque o recurso de embedding estava em outra região. Ninguém desconfiava da etapa mais simples do pipeline.

**Quantas perguntas ficam sem contexto.** A taxa de buscas sem documento por dia. É o indicador de qualidade mais barato que existe.

```kql
dependencies
| where timestamp > ago(7d) and name == "rag.busca"
| extend docs = toint(customDimensions["rag.docs_retornados"])
| summarize total = count(), sem_documento = countif(docs == 0) by dia = bin(timestamp, 1d)
| extend taxa_sem_documento = round(100.0 * sem_documento / total, 1)
| order by dia desc
```

**Para onde vão os tokens.** Consumo por dia e por modelo, a partir dos atributos que o instrumentador grava em cada chamada. Multiplicar pelo preço do seu contrato dá o custo; deixo o preço fora da consulta de propósito, porque ele muda e varia por tipo de deployment.

```kql
dependencies
| where timestamp > ago(30d)
| where isnotempty(customDimensions["gen_ai.usage.input_tokens"])
| extend entrada = toint(customDimensions["gen_ai.usage.input_tokens"]),
         saida = toint(customDimensions["gen_ai.usage.output_tokens"]),
         modelo = tostring(customDimensions["gen_ai.request.model"])
| summarize tokens_entrada = sum(entrada), tokens_saida = sum(saida) by dia = bin(timestamp, 1d), modelo
| order by dia desc
```

## Alerta que não vira ruído

O alerta mais comum que eu vejo é "avise se alguma requisição passar de 15 segundos". Em uma semana ele dispara tanto que o time cria uma regra no e-mail para ignorar.

Um alerta útil olha para o comportamento, não para o caso isolado: p95 do `rag.pipeline` acima do limite combinado por 15 minutos seguidos, com um mínimo de chamadas na janela para não disparar de madrugada por causa de duas requisições. E um segundo alerta, de qualidade, para quando a taxa de buscas sem documento passar do normal da semana.

Dois alertas bem calibrados valem mais que dez que ninguém lê.

## O que não registrar

O instrumentador não grava o texto das perguntas e respostas por padrão. A gravação só liga quando a variável `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT` recebe `span_only`, `event_only` ou `span_and_event`.

Em produção, eu deixo desligado. Pergunta de usuário carrega nome, CPF, dado de cliente e tudo o que a LGPD pede para tratar com cuidado, e trace costuma ter retenção longa e acesso amplo. Para investigar qualidade, tamanho em tokens, quantidade de documentos e score dizem muito sem expor ninguém. Quando o conteúdo é indispensável, o lugar é um ambiente de avaliação com dados controlados.

## O que fica

A diferença entre resolver um incidente em minutos ou em horas é ter o trace certo quando a reclamação chega. E esse trace só existe se foi instrumentado antes.

Se amanhã alguém disser que o seu assistente está lento, você consegue apontar qual etapa em menos de cinco minutos?
