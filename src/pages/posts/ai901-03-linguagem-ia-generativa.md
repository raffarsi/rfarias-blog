---
layout: ../../layouts/PostLayout.astro
title: "AI-901 na prática [3] — Linguagem natural e IA Generativa"
category: "IA Generativa"
tag: "ia-generativa"
serie: "AI-901 na prática"
serieSlug: "ai901"
serieNum: 3
date: "31 Mar 2026"
readTime: "10 min"
description: "NLP, Azure Language Service, Azure OpenAI e os fundamentos de IA Generativa para o AI-901."
prev:
  title: "AI-901 [2] — Visão e Fala"
  slug: "ai901-02-azure-ai-services"
next:
  title: "AI-901 [4] — IA Conversacional"
  slug: "ai901-04-ia-conversacional"

---

Processamento de Linguagem Natural (NLP) e IA Generativa são os tópicos de maior crescimento no AI-901. Este artigo cobre desde análise de sentimento até LLMs.

## Azure Language Service

Conjunto de capacidades de NLP pré-construídas:

```bash
# Criar recurso Language
az cognitiveservices account create \
  --name meu-language \
  --resource-group meu-rg \
  --kind TextAnalytics \
  --sku S \
  --location brazilsouth
```

**Análise de sentimento** — classifica texto como positivo, negativo ou neutro com pontuação de confiança.

```python
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential

client = TextAnalyticsClient(
    endpoint="https://meu-language.cognitiveservices.azure.com/",
    credential=AzureKeyCredential("MINHA_CHAVE")
)

documents = [
    "O produto é excelente, entrega rápida e suporte incrível!",
    "Péssima experiência, chegou com defeito e ninguém atende.",
]

result = client.analyze_sentiment(documents=documents, language="pt")
for doc in result:
    print(f"Sentimento: {doc.sentiment} | Positivo: {doc.confidence_scores.positive:.2f}")
```

**Extração de entidades** — identifica pessoas, organizações, locais, datas em texto.

**Reconhecimento de PII** — detecta informações pessoais identificáveis (CPF, email, telefone) para redação ou compliance.

**Detecção de idioma** — identifica o idioma de um texto.

**Sumarização** — resume documentos longos automaticamente.

## Language Understanding (CLU)

Treina modelos para entender intenções e extrair entidades de frases em linguagem natural. Base para chatbots e assistentes virtuais.

**Intenções:** o que o usuário quer fazer (ReservarVoo, ConsultarSaldo, CancelarPedido)
**Entidades:** informações dentro da frase (data, destino, número do pedido)

## Azure OpenAI Service

Acesso aos modelos da OpenAI (GPT-4, GPT-4o, DALL-E, Whisper, text-embedding) dentro da infraestrutura Azure, com segurança e compliance corporativo.

```bash
# Criar recurso Azure OpenAI
az cognitiveservices account create \
  --name meu-openai \
  --resource-group meu-rg \
  --kind OpenAI \
  --sku S0 \
  --location eastus

# Deploy de um modelo
az cognitiveservices account deployment create \
  --name meu-openai \
  --resource-group meu-rg \
  --deployment-name gpt4o \
  --model-name gpt-4o \
  --model-version "2024-08-06" \
  --model-format OpenAI \
  --sku-capacity 10 \
  --sku-name Standard
```

```python
from openai import AzureOpenAI

client = AzureOpenAI(
    azure_endpoint="https://meu-openai.openai.azure.com/",
    api_key="MINHA_CHAVE",
    api_version="2024-02-01"
)

response = client.chat.completions.create(
    model="gpt4o",
    messages=[
        {"role": "system", "content": "Você é um especialista em Azure."},
        {"role": "user", "content": "Explique o que é um Private Endpoint em uma frase."}
    ]
)
print(response.choices[0].message.content)
```

## Fundamentos de IA Generativa

**Modelos de Linguagem de Grande Escala (LLMs)** — treinados em enormes volumes de texto para gerar, resumir, traduzir e conversar em linguagem natural.

**Tokens** — unidades de texto que os LLMs processam. Aproximadamente 4 caracteres = 1 token em inglês.

**Temperatura** — controla a criatividade/aleatoriedade. 0 = determinístico, 1 = criativo.

**Prompt Engineering** — técnica de elaborar instruções para obter melhores respostas dos LLMs:
- Zero-shot: apenas a instrução
- Few-shot: instrução + exemplos
- Chain-of-thought: peça para o modelo pensar passo a passo

**RAG (Retrieval-Augmented Generation)** — combina busca em base de dados com geração de texto, permitindo que o LLM responda com base em documentos específicos.

**Grounding** — conectar o modelo a fontes de dados confiáveis para reduzir alucinações.

<div class="callout">
<strong>Dica para o exame:</strong> Alucinação é quando um LLM gera informações falsas com confiança. A principal mitigação é o RAG — fornecer contexto real ao modelo em vez de depender apenas do seu treinamento.
</div>

## DALL-E — Geração de imagens

```python
response = client.images.generate(
    model="dall-e-3",
    prompt="Uma paisagem futurista de São Paulo em 2050, estilo realista",
    size="1024x1024",
    quality="standard",
    n=1,
)
image_url = response.data[0].url
```

## O que cai no exame

- Azure Language Service: análise de sentimento, entidades, PII, sumarização
- CLU para intenções e entidades em chatbots
- Azure OpenAI para acesso corporativo aos modelos GPT
- Conceitos de LLM: tokens, temperatura, prompt engineering
- RAG como solução para alucinação e dados atualizados
- DALL-E para geração de imagens por texto
