---
layout: ../../layouts/PostLayout.astro
title: "Azure AI Foundry: criando seu primeiro projeto de IA Generativa"
category: "IA"
tag: "tech"
date: "20 Ago 2026"
readTime: "12 min"
description: "Guia prático para criar uma prova de conceito de chatbot com RAG usando Azure AI Foundry."
prev:
  title: "17 anos na mesma empresa"
  slug: "17-anos-mesma-empresa"
next:
  title: "Aula de MS Project"
  slug: "aula-ms-project"
---

Uma das plataformas que mais me empolgou nos últimos meses foi o Azure AI Foundry. Ele unifica modelos, dados, orquestração e avaliação em um único hub — e facilita muito a vida de quem precisa montar uma PoC de IA Generativa em ambiente corporativo.

Neste post, mostro o passo a passo que usei para criar um chatbot com RAG (Retrieval-Augmented Generation) do zero.

## O que é o Azure AI Foundry

O AI Foundry é o sucessor do Azure AI Studio. Ele centraliza o catálogo de modelos (OpenAI, Meta, Mistral, Cohere e outros), playgrounds para teste, pipelines de prompt flow e ferramentas de avaliação.

A grande vantagem para o ambiente corporativo: tudo roda dentro da sua assinatura Azure, com controle de rede, identidade e compliance.

## Criando o Hub e o Projeto

O primeiro passo é criar um AI Hub — o contêiner organizacional:

```bash
az ml workspace create \
  --kind hub \
  --name meu-ai-hub \
  --resource-group rg-ia \
  --location eastus2
```

Dentro do hub, crie um projeto:

```bash
az ml workspace create \
  --kind project \
  --name poc-chatbot \
  --hub-id /subscriptions/.../meu-ai-hub \
  --resource-group rg-ia
```

## Deployando o modelo

No catálogo de modelos, escolhi o GPT-4o para a PoC. O deploy é feito como endpoint serverless:

```bash
az ml serverless-endpoint create \
  --name gpt4o-endpoint \
  --model-id azureml://registries/azure-openai/models/gpt-4o \
  --workspace-name poc-chatbot \
  --resource-group rg-ia
```

## Configurando o RAG

Para o RAG funcionar, precisamos de três peças: um índice de busca (Azure AI Search), os documentos indexados, e a orquestração que conecta busca + modelo.

O Prompt Flow do AI Foundry facilita essa orquestração com componentes visuais. Você literalmente arrasta os blocos e conecta:

1. **Input** — pergunta do usuário
2. **Embedding** — converte a pergunta em vetor
3. **Index Lookup** — busca documentos similares no AI Search
4. **LLM** — envia contexto + pergunta para o GPT-4o
5. **Output** — resposta formatada

## Avaliação

O AI Foundry tem métricas de avaliação built-in: groundedness, relevance, coherence e fluency. Rodei um batch de 50 perguntas e obtive scores acima de 4.0 em todas as dimensões.

<div class="callout">
<strong>Dica:</strong> Sempre avalie com perguntas reais dos usuários, não com exemplos inventados. A diferença nos resultados é brutal.
</div>

## Conclusão

O Azure AI Foundry reduziu drasticamente o tempo que eu levava para montar PoCs de IA. O que antes exigia integrar 4 ou 5 serviços separados agora está em um fluxo unificado.

Se você está pensando em levar IA Generativa para o seu ambiente corporativo, recomendo começar por aqui.
