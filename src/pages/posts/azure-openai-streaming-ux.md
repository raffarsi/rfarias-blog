---
layout: ../../layouts/PostLayout.astro
title: "Streaming de respostas do Azure OpenAI: implementando UX responsiva"
category: "IA Generativa"
tag: "ia-generativa"
date: "09 Dez 2025"
readTime: "8 min"
description: "Como implementar streaming para uma experiência de usuário fluida em aplicações web com Azure OpenAI."
---

Sem streaming, o usuário vê uma tela em branco por vários segundos e então recebe toda a resposta de uma vez. Com streaming, o texto aparece progressivamente, exatamente como no ChatGPT. A diferença na percepção de velocidade é enorme, mesmo que o tempo total de geração seja idêntico.

## Streaming básico com o SDK

```python
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(
    credential, "https://cognitiveservices.azure.com/.default"
)

client = AzureOpenAI(
    azure_ad_token_provider=token_provider,
    api_version="2024-02-01",
    azure_endpoint="https://oai-producao.openai.azure.com"
)

# Streaming com context manager
with client.chat.completions.stream(
    model="gpt4o-prod",
    messages=[
        {"role": "system", "content": "Você é um assistente técnico."},
        {"role": "user", "content": "Explique Private Endpoints no Azure"}
    ]
) as stream:
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            print(delta, end="", flush=True)
    print()

# Tokens disponíveis após o stream
final = stream.get_final_completion()
print(f"Tokens: {final.usage.total_tokens}")
```

## Server-Sent Events com FastAPI

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

async def stream_resposta(pergunta: str):
    async with client.chat.completions.stream(
        model="gpt4o-prod",
        messages=[
            {"role": "system", "content": "Você é um assistente técnico."},
            {"role": "user", "content": pergunta}
        ]
    ) as stream:
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield f"data: {delta}\n\n"
        yield "data: [DONE]\n\n"

@app.get("/chat/stream")
async def chat_stream(q: str):
    return StreamingResponse(
        stream_resposta(q),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )
```

## Consumindo no frontend

```javascript
const output = document.getElementById('output');
output.textContent = '';

const response = await fetch(`/chat/stream?q=${encodeURIComponent(pergunta)}`);
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split('\n');
    for (const line of lines) {
        if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            output.textContent += data;
            output.scrollTop = output.scrollHeight;
        }
    }
}
```

## Streaming com LangChain

```python
from langchain_openai import AzureChatOpenAI
from langchain_core.callbacks import StreamingStdOutCallbackHandler

llm = AzureChatOpenAI(
    azure_deployment="gpt4o-prod",
    azure_endpoint="https://oai-producao.openai.azure.com",
    api_version="2024-02-01",
    azure_ad_token_provider=token_provider,
    streaming=True,
    callbacks=[StreamingStdOutCallbackHandler()]
)

response = llm.invoke("Explique hub-and-spoke no Azure")
```

## Considerações de producao

**Timeout:** configure adequadamente -- respostas longas podem levar 30-60 segundos.

**Buffering no nginx:** adicione `proxy_buffering off` na configuração do servidor.

**Reconexão automática:**

```javascript
function conectarStream(pergunta, onChunk, onDone) {
    let tentativas = 0;
    function tentar() {
        const source = new EventSource(`/chat/stream?q=${encodeURIComponent(pergunta)}`);
        source.onmessage = (e) => {
            if (e.data === '[DONE]') { source.close(); onDone(); return; }
            onChunk(e.data);
        };
        source.onerror = () => {
            source.close();
            if (++tentativas < 3) setTimeout(tentar, 1000 * tentativas);
        };
    }
    tentar();
}
```

<div class="callout">
<strong>Streaming e RAG:</strong> Em pipelines RAG, faça a busca de documentos antes de iniciar o stream. Mostre "Buscando na base de conhecimento..." enquanto faz a query no AI Search, e inicie o streaming quando o modelo começa a gerar. Isso melhora a percepção de velocidade sem comprometer o grounding.
</div>

## Conclusao

Streaming é uma das melhorias de UX de maior impacto com o menor esforço de implementação. Para usuários acostumados com ChatGPT e Copilot, ver a resposta aparecer progressivamente é o comportamento esperado -- um requisito básico de usabilidade em aplicações de IA em 2026.
