---
layout: ../../layouts/PostLayout.astro
title: "Grounding com dados corporativos: conectando Azure OpenAI à base de conhecimento"
category: "IA Generativa"
tag: "ia-generativa"
date: "02 Dez 2025"
readTime: "10 min"
description: "O que é grounding, por que elimina alucinações e como implementar com Azure AI Search e Azure AI Foundry."
---

Grounding é o processo de fornecer ao modelo informações factuais específicas como contexto antes de gerar uma resposta. Sem grounding, o modelo usa apenas o conhecimento do treinamento, que tem data de corte e não conhece seus dados internos. Com grounding, você controla o contexto.

## Por que grounding elimina alucinações

Um modelo de linguagem sem contexto externo responde com base no que "aprendeu" durante o treinamento. Para perguntas sobre a sua empresa, seus processos, seus produtos, ele vai ou dizer que não sabe, ou inventar algo plausível. O segundo caso é o problema: respostas inventadas apresentadas com confiança.

O grounding resolve isso porque você fornece os fatos relevantes diretamente no prompt. O modelo não precisa "lembrar", ele lê o contexto e responde com base nele.

## Implementação com Azure AI Search + Azure OpenAI

O pipeline básico de grounding tem três etapas:

```python
from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizedQuery
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(
    credential, "https://cognitiveservices.azure.com/.default"
)

openai_client = AzureOpenAI(
    azure_ad_token_provider=token_provider,
    api_version="2024-02-01",
    azure_endpoint="https://oai-producao.openai.azure.com"
)

search_client = SearchClient(
    endpoint="https://search-prod.search.windows.net",
    index_name="base-conhecimento",
    credential=credential
)

def resposta_com_grounding(pergunta: str) -> dict:
    # 1. Gerar embedding da pergunta
    embedding = openai_client.embeddings.create(
        input=pergunta,
        model="text-embedding-3-large"
    ).data[0].embedding

    # 2. Buscar documentos relevantes (busca híbrida)
    resultados = list(search_client.search(
        search_text=pergunta,
        vector_queries=[VectorizedQuery(
            vector=embedding,
            fields="content_vector",
            k_nearest_neighbors=5
        )],
        select=["content", "source", "titulo"],
        top=5
    ))

    # 3. Montar contexto
    contexto = "

".join([
        f"[Fonte: {r['source']}, {r['titulo']}]
{r['content']}"
        for r in resultados
    ])

    # 4. Gerar resposta com grounding
    system_prompt = f"""Você é um assistente corporativo.

REGRAS:
- Responda APENAS com base no CONTEXTO abaixo
- Se a informação não estiver no contexto, diga: "Não encontrei essa informação na base de conhecimento."
- Cite sempre a fonte da informação

CONTEXTO:
{contexto}"""

    response = openai_client.chat.completions.create(
        model="gpt4o-prod",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": pergunta}
        ],
        temperature=0.1
    )

    return {
        "resposta": response.choices[0].message.content,
        "fontes": [r["source"] for r in resultados],
        "documentos_usados": len(resultados)
    }
```

## Grounding com Azure AI Foundry

O AI Foundry integra grounding nativamente via File Search e Vector Stores:

```python
from azure.ai.projects import AIProjectClient

client = AIProjectClient.from_connection_string(
    credential=credential,
    conn_str="eastus.api.azureml.ms;{sub};{rg};{project}"
)

# Criar vector store com documentos corporativos
vector_store = client.agents.create_vector_store_and_poll(
    file_ids=[arquivo.id for arquivo in arquivos_uploaded],
    name="base-conhecimento-rh"
)

# Agente com grounding automático
agente = client.agents.create_agent(
    model="gpt-4o",
    name="assistente-rh",
    instructions="""Você é um assistente de RH.
    Responda APENAS com base nos documentos disponibilizados.
    Se não encontrar a informação, diga que não sabe.""",
    tools=[{"type": "file_search"}],
    tool_resources={
        "file_search": {"vector_store_ids": [vector_store.id]}
    }
)
```

## Verificando qualidade do grounding com Content Safety

O Azure Content Safety tem um endpoint específico para verificar se a resposta está fundamentada no contexto fornecido:

```python
from azure.ai.contentsafety import ContentSafetyClient
from azure.ai.contentsafety.models import AnalyzeGroundednessOptions

safety_client = ContentSafetyClient(
    endpoint="https://content-safety.cognitiveservices.azure.com",
    credential=credential
)

def verificar_grounding(contexto: str, pergunta: str, resposta: str) -> dict:
    result = safety_client.analyze_text_groundedness(
        AnalyzeGroundednessOptions(
            domain="Generic",
            task="QnA",
            grounding_sources=[contexto],
            query=pergunta,
            text=resposta
        )
    )
    return {
        "fundamentada": not result.ungrounded,
        "score_confianca": getattr(result, "confidence_score", None)
    }
```

## Estratégia de fallback quando não há contexto

```python
FALLBACKS = {
    "ti":     "Para suporte de TI, acesse helpdesk.empresa.com ou ligue para a central.",
    "rh":     "Para dúvidas de RH, entre em contato com rh@empresa.com.",
    "padrao": "Não encontrei essa informação. Por favor, consulte seu gestor ou abra um chamado."
}

def detectar_falta_de_contexto(resposta: str) -> str | None:
    indicadores = ["não encontrei", "não tenho essa informação",
                   "não está na base", "não possuo informações"]
    for ind in indicadores:
        if ind in resposta.lower():
            return FALLBACKS.get("padrao")
    return None
```

<div class="callout">
<strong>Temperature baixa para grounding:</strong> Use temperature entre 0.0 e 0.2 em pipelines RAG. O objetivo é fidelidade ao contexto, não criatividade. Temperature alta aumenta o risco de o modelo combinar o contexto fornecido com conhecimento do treinamento de forma indevida.
</div>

## Conclusão

Grounding é o que transforma um chatbot genérico em um assistente corporativo confiável. A combinação de busca híbrida para recuperação, instrução explícita de fidelidade no System Prompt e verificação de groundedness fecha o ciclo, garantindo que o modelo responde com base nos seus dados, não nos dados de treinamento da OpenAI.
