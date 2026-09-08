---
layout: ../../layouts/PostLayout.astro
title: "AI-901 na prática [1] — Fundamentos de IA e Machine Learning"
category: "IA"
tag: "ia"
serie: "AI-901 na prática"
serieNum: 1
date: "24 Mar 2026"
readTime: "9 min"
description: "Conceitos essenciais de IA, ML, Deep Learning e os tipos de problemas que cada abordagem resolve."
next:
  title: "AI-901 na prática [2] — Azure AI Services"
  slug: "ai901-02-azure-ai-services"
---

O AI-901 testa seu entendimento dos conceitos de IA e como os serviços cognitivos da Microsoft os implementam. Este artigo cobre os fundamentos que sustentam todo o exame.

## A hierarquia: IA → ML → Deep Learning

**Inteligência Artificial** — campo amplo de sistemas que simulam capacidades humanas de raciocínio, aprendizado e tomada de decisão.

**Machine Learning** — subconjunto de IA onde sistemas aprendem padrões a partir de dados, sem serem explicitamente programados para cada regra.

**Deep Learning** — subconjunto de ML que usa redes neurais com múltiplas camadas. Excelente para imagens, áudio e texto. Requer grandes volumes de dados e poder computacional.

## Tipos de Machine Learning

**Supervisionado** — treinado com dados rotulados (entrada + resposta correta). Aprende a mapeamento entre entrada e saída.
- Classificação: email é spam ou não spam?
- Regressão: qual o preço desta casa?

**Não supervisionado** — treinado com dados sem rótulos. Descobre padrões e estruturas ocultas.
- Clustering: agrupar clientes por comportamento de compra
- Detecção de anomalias: transação financeira suspeita

**Por reforço** — aprende por tentativa e erro com sistema de recompensas. Usado em robótica e jogos.

## Conceitos fundamentais de ML

**Features (características)** — variáveis de entrada usadas para treinar o modelo. Ex: idade, renda, histórico de crédito para prever inadimplência.

**Label (rótulo)** — a variável de saída que o modelo aprende a prever. Ex: inadimplente (sim/não).

**Treinamento** — processo de ajustar parâmetros do modelo para minimizar erros nas previsões.

**Validação** — avaliação do modelo em dados que não foram usados no treinamento.

**Overfitting** — modelo memoriza os dados de treino mas não generaliza para dados novos.

## Avaliação de modelos

Para **classificação:**
- Acurácia: % de previsões corretas
- Precisão: dos previstos como positivos, quantos realmente são?
- Recall: dos reais positivos, quantos foram detectados?
- F1-Score: média harmônica entre precisão e recall

Para **regressão:**
- MAE (Mean Absolute Error): média dos erros absolutos
- RMSE (Root Mean Squared Error): raiz do erro quadrático médio

## Azure Machine Learning

Plataforma gerenciada para todo o ciclo de vida de ML:

```bash
# Criar workspace do Azure ML
az ml workspace create \
  --name meu-workspace-ml \
  --resource-group meu-rg \
  --location brazilsouth

# Criar compute cluster para treinamento
az ml compute create \
  --name cpu-cluster \
  --type amlcompute \
  --min-instances 0 \
  --max-instances 4 \
  --size Standard_D2s_v3 \
  --workspace-name meu-workspace-ml \
  --resource-group meu-rg
```

**Automated ML (AutoML)** — testa múltiplos algoritmos automaticamente e escolhe o melhor para o problema.

**Designer** — interface visual drag-and-drop para criar pipelines de ML sem código.

**MLflow** — rastreamento de experimentos, parâmetros e métricas integrado ao Azure ML.

<div class="callout">
<strong>Dica para o exame:</strong> O AI-901 frequentemente testa a diferença entre os tipos de ML (supervisionado, não supervisionado, por reforço) com cenários práticos. Memorize: se tem dados rotulados = supervisionado; se precisa descobrir grupos = clustering (não supervisionado); se aprende por recompensa = reforço.
</div>

## IA Responsável

A Microsoft define 6 princípios de IA Responsável:

1. **Equidade** — sistemas de IA não devem discriminar grupos
2. **Confiabilidade e segurança** — comportamento previsível e seguro
3. **Privacidade e segurança** — proteção de dados pessoais
4. **Inclusão** — acessível a todos
5. **Transparência** — explicabilidade das decisões
6. **Responsabilidade** — humanos são responsáveis pelos sistemas de IA

## O que cai no exame

- Hierarquia IA → ML → Deep Learning
- Tipos de ML (supervisionado, não supervisionado, por reforço) com exemplos
- Diferença entre classificação e regressão
- Overfitting e como evitá-lo (validação cruzada, mais dados)
- Os 6 princípios de IA Responsável
