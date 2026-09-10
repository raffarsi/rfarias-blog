---
layout: ../../layouts/PostLayout.astro
title: "LangChain com Azure OpenAI: integração passo a passo"
category: "IA Generativa"
tag: "ia-generativa"
date: "23 Set 2025"
readTime: "9 min"
description: "Como conectar LangChain ao Azure OpenAI Service respeitando as configurações de rede e autenticação corporativas."
---

LangChain resolve um problema real: orquestrar chamadas a modelos de linguagem junto com ferramentas, memoria e bases de conhecimento sem escrever toda a logica do zero. O problema e que ele tambem e o framework que mais gera codigo que parece funcionar mas e dificil de debugar em producao.

Vale aprender. Vale saber quando nao usar. com LLMs. Ele abstrai chamadas aos modelos, gerencia contexto de conversação, orquestra chains de processamento e integra com ferramentas externas. Neste artigo, a integração específica com Azure OpenAI, não a API da OpenAI diretamente.

## Instalação

```bash
pip install langchain langchain-openai azure-identity
```

## Configuração básica com API Key

```python
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings

# Chat model
llm = AzureChatOpenAI(
    azure_deployment="gpt4o-prod",
    azure_endpoint="https://oai-producao.openai.azure.com",
    api_version="2024-02-01",
    api_key="sua-api-key",
    temperature=0.3,
    max_tokens=1000
)

# Embeddings
embeddings = AzureOpenAIEmbeddings(
    azure_deployment="text-embedding-3-large",
    azure_endpoint="https://oai-producao.openai.azure.com",
    api_version="2024-02-01",
    api_key="sua-api-key"
)
```

## Configuração com Managed Identity (produção)

```python
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from langchain_openai import AzureChatOpenAI

credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(
    credential, "https://cognitiveservices.azure.com/.default"
)

llm = AzureChatOpenAI(
    azure_deployment="gpt4o-prod",
    azure_endpoint="https://oai-producao.openai.azure.com",
    api_version="2024-02-01",
    azure_ad_token_provider=token_provider,
    temperature=0.3
)
```

## Chain simples: pergunta e resposta

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_messages([
    ("system", "Você é um especialista em Azure. Responda de forma técnica e objetiva."),
    ("human", "{pergunta}")
])

chain = prompt | llm | StrOutputParser()

resposta = chain.invoke({"pergunta": "Qual a diferença entre NSG e Azure Firewall?"})
print(resposta)
```

## RAG com LangChain e Azure AI Search

```python
from langchain_community.vectorstores import AzureSearch
from langchain.chains import RetrievalQA

# Conectar ao índice do AI Search
vector_store = AzureSearch(
    azure_search_endpoint="https://search-ia-prod.search.windows.net",
    azure_search_key="sua-chave-admin",
    index_name="base-conhecimento",
    embedding_function=embeddings.embed_query,
    search_type="hybrid"  # combina vetorial + BM25
)

# Chain de RAG
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=vector_store.as_retriever(search_kwargs={"k": 5}),
    return_source_documents=True
)

resultado = qa_chain.invoke({"query": "Como configurar Private Endpoint para Azure OpenAI?"})
print(resultado["result"])
print("
Fontes:")
for doc in resultado["source_documents"]:
    print(f"  - {doc.metadata.get('source', 'N/A')}")
```

## Memória de conversação

```python
from langchain.memory import ConversationBufferWindowMemory
from langchain.chains import ConversationalRetrievalChain

memory = ConversationBufferWindowMemory(
    memory_key="chat_history",
    return_messages=True,
    k=5  # manter últimas 5 trocas
)

conversational_chain = ConversationalRetrievalChain.from_llm(
    llm=llm,
    retriever=vector_store.as_retriever(),
    memory=memory,
    verbose=True
)

# Primeira pergunta
r1 = conversational_chain.invoke({"question": "O que é VNet Peering?"})

# Segunda pergunta, o contexto da primeira é mantido
r2 = conversational_chain.invoke({"question": "Quais são as limitações disso?"})
```

<div class="callout">
<strong>LCEL (LangChain Expression Language):</strong> A versão moderna do LangChain usa LCEL com o operador <code>|</code> (pipe) para compor chains. É mais legível e tem melhor suporte a streaming e async. Prefira LCEL para novos projetos em vez das classes legadas como <code>LLMChain</code>.
</div>

## Streaming de respostas

```python
async def stream_resposta(pergunta: str):
    async for chunk in chain.astream({"pergunta": pergunta}):
        print(chunk, end="", flush=True)
    print()  # nova linha ao final

import asyncio
asyncio.run(stream_resposta("Explique hub-and-spoke em Azure"))
```

## Conclusão

LangChain com Azure OpenAI combina a flexibilidade do framework com os controles de segurança do Azure, Managed Identity, Private Endpoints e integração com AI Search. Para projetos corporativos, sempre prefira autenticação via Managed Identity e configure o Azure OpenAI com `publicNetworkAccess: Disabled`.
