---
layout: ../../layouts/PostLayout.astro
title: "Azure AI Foundry: criando seu primeiro projeto de IA Generativa"
category: "IA Generativa"
tag: "ia"
date: "20 Ago 2026"
readTime: "12 min"
description: "Guia prático para criar uma PoC de chatbot com RAG usando Azure AI Foundry em ambiente corporativo."
prev:
  title: "17 anos na mesma empresa"
  slug: "17-anos-mesma-empresa"
next:
  title: "Aula de MS Project"
  slug: "aula-ms-project"
---

O Azure AI Foundry é a plataforma unificada da Microsoft para construir aplicações de IA Generativa em ambiente corporativo. Ele substituiu o Azure AI Studio e centralizou catálogo de modelos, playgrounds, orquestração com Prompt Flow e ferramentas de avaliação em um único hub.

Neste guia, mostro como criar um projeto do zero — do setup do hub até um chatbot com RAG funcional.

## Por que o AI Foundry importa para o corporativo

Antes do AI Foundry, montar uma PoC de IA Generativa no Azure exigia integrar manualmente 4 ou 5 serviços: Azure OpenAI para o modelo, Azure AI Search para o índice de busca, Azure Blob Storage para os documentos, algum orquestrador para conectar tudo, e Azure Monitor para observabilidade.

O AI Foundry unifica isso. Tudo roda dentro da sua assinatura Azure, com controle de rede (Private Endpoints), identidade (Entra ID) e compliance. Para quem trabalha em instituições reguladas, isso é decisivo.

## Conceitos fundamentais

**AI Hub** — O contêiner organizacional. Ele gerencia as conexões com modelos, compute e storage.

**Projeto** — Dentro do hub, cada projeto é um workspace isolado. Cada PoC ou aplicação vive em seu próprio projeto, com seus dados, deployments e avaliações.

**Catálogo de modelos** — O AI Foundry oferece modelos da OpenAI (GPT-4o, GPT-4o-mini), Meta (Llama), Mistral, Cohere e outros.

## Setup: Hub e Projeto

```bash
az ml workspace create \
  --kind hub \
  --name hub-ia-corp \
  --resource-group rg-ia \
  --location eastus2

az ml workspace create \
  --kind project \
  --name poc-chatbot-docs \
  --hub-id /subscriptions/{sub-id}/resourceGroups/rg-ia/providers/Microsoft.MachineLearningServices/workspaces/hub-ia-corp \
  --resource-group rg-ia
```

## Deployando o modelo

Para a maioria das PoCs, deploy serverless (pay-per-token) é suficiente e mais barato:

```bash
az ml serverless-endpoint create \
  --name gpt4o-mini-endpoint \
  --model-id azureml://registries/azure-openai/models/gpt-4o-mini \
  --workspace-name poc-chatbot-docs \
  --resource-group rg-ia
```

## Construindo o RAG

RAG é o padrão mais comum em aplicações corporativas. A ideia: antes de enviar a pergunta para o modelo, você busca documentos relevantes na base da empresa e inclui esse contexto no prompt.

O Prompt Flow do AI Foundry facilita essa orquestração com componentes visuais:

1. **Input** — pergunta do usuário
2. **Embedding** — converte a pergunta em vetor
3. **Index Lookup** — busca trechos similares no Azure AI Search
4. **LLM** — envia contexto + pergunta para o GPT-4o
5. **Output** — resposta formatada

**System prompt funcional:**

```
Você é um assistente que responde perguntas sobre os documentos internos da empresa.
Use APENAS as informações do contexto fornecido para responder.
Se a resposta não estiver no contexto, diga "Não encontrei essa informação nos documentos disponíveis."
Sempre cite o nome do documento de onde veio a informação.
Responda em português brasileiro, de forma clara e objetiva.
```

## Avaliação

O AI Foundry tem métricas integradas: **Groundedness** (evita alucinações), **Relevance**, **Coherence** e **Fluency**. Cada uma recebe nota de 1 a 5. Para produção, busque scores acima de 4.0 em todas as dimensões.

<div class="callout">
<strong>Dica:</strong> Avalie com perguntas reais dos usuários, não com exemplos fabricados. A diferença nos resultados é significativa — perguntas reais incluem ambiguidades e referências implícitas que exemplos inventados não capturam.
</div>

## Próximos passos

Com o RAG funcionando no playground, o caminho para produção envolve: autenticação via Entra ID, Private Endpoints para o AI Search e o endpoint do modelo, content filters e logging para monitorar a qualidade das respostas.

O Azure AI Foundry reduziu drasticamente o tempo de montagem de PoCs de IA Generativa. O que antes levava semanas de integração manual agora está em um fluxo unificado.
