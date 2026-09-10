---
layout: ../../layouts/PostLayout.astro
title: "AI-901 na prática [5] — IA Responsável e Azure AI Foundry"
category: "IA Generativa"
tag: "ia-generativa"
serie: "AI-901 na prática"
serieSlug: "ai901"
serieNum: 5
date: "7 Abr 2026"
readTime: "9 min"
description: "Princípios de IA Responsável, Content Safety e o Azure AI Foundry como plataforma unificada."
prev:
  title: "AI-901 [4] — IA Conversacional"
  slug: "ai901-04-ia-conversacional"

---

IA Responsável é um dos tópicos com maior peso no AI-901. A Microsoft tem uma abordagem estruturada para desenvolvimento ético de IA que precisa ser conhecida a fundo.

## Os 6 princípios de IA Responsável da Microsoft

**1. Equidade (Fairness)** — sistemas de IA não devem discriminar grupos com base em características protegidas (raça, gênero, idade). Bias nos dados de treinamento leva a sistemas injustos.

**2. Confiabilidade e Segurança (Reliability & Safety)** — IA deve funcionar de forma confiável e segura. Um carro autônomo com comportamento imprevisível é perigoso; um sistema médico com falhas pode causar danos.

**3. Privacidade e Segurança (Privacy & Security)** — dados usados para treinar e operar IA devem ser protegidos. Minimize a coleta de dados pessoais.

**4. Inclusão (Inclusiveness)** — IA deve ser acessível e útil para todos, incluindo pessoas com deficiências. Soluções como legendas automáticas e leitores de tela são exemplos.

**5. Transparência (Transparency)** — usuários devem entender como decisões de IA são tomadas. Modelos explicáveis (XAI) ajudam a justificar decisões.

**6. Responsabilização (Accountability)** — pessoas e organizações são responsáveis pelos sistemas de IA que criam e implantam. Não existe "o algoritmo decidiu" como escudo de responsabilidade.

## Ferramentas de IA Responsável

**Azure AI Content Safety** — detecta e filtra conteúdo prejudicial em texto e imagens:

```python
from azure.ai.contentsafety import ContentSafetyClient
from azure.core.credentials import AzureKeyCredential
from azure.ai.contentsafety.models import AnalyzeTextOptions

client = ContentSafetyClient(
    endpoint="https://meu-safety.cognitiveservices.azure.com/",
    credential=AzureKeyCredential("MINHA_CHAVE")
)

request = AnalyzeTextOptions(text="Conteúdo para analisar...")
response = client.analyze_text(request)

for category in response.categories_analysis:
    print(f"{category.category}: severidade {category.severity}")
    # Categorias: Hate, Violence, Sexual, SelfHarm
```

**Fairlearn** — biblioteca Python para avaliar e mitigar bias em modelos de ML:

```python
from fairlearn.metrics import demographic_parity_difference, equalized_odds_difference

# Verificar diferença de paridade demográfica entre grupos
dp_diff = demographic_parity_difference(
    y_true=y_test,
    y_pred=y_pred,
    sensitive_features=sensitive_feature_column
)
print(f"Diferença de paridade demográfica: {dp_diff:.4f}")
# Próximo de 0 indica maior equidade
```

**Azure ML Explainability** — explica quais features mais influenciam as previsões do modelo:

```python
from interpret.ext.blackbox import TabularExplainer

explainer = TabularExplainer(model, X_train, features=feature_names)
explanation = explainer.explain_global(X_test)

# Features mais importantes globalmente
feature_importance = dict(zip(feature_names, explanation.get_feature_importance()))
sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
```

## Azure AI Foundry

Plataforma unificada para desenvolver aplicações de IA Generativa em produção:

```bash
# Criar AI Hub
az ml workspace create \
  --kind hub \
  --name hub-ia \
  --resource-group meu-rg \
  --location eastus2

# Criar projeto
az ml workspace create \
  --kind project \
  --name projeto-chatbot \
  --hub-id /subscriptions/{sub-id}/resourceGroups/meu-rg/providers/Microsoft.MachineLearningServices/workspaces/hub-ia \
  --resource-group meu-rg
```

**Componentes do AI Foundry:**
- **Catálogo de modelos** — GPT-4o, Llama, Mistral, Phi e outros
- **Playground** — teste modelos interativamente
- **Prompt Flow** — orquestradores de RAG e fluxos de IA
- **Evaluation** — métricas de qualidade (groundedness, relevance, coherence)
- **Content Filters** — filtros de segurança configuráveis

<div class="callout">
<strong>Dica para o exame:</strong> O AI-901 testa especificamente os 6 princípios de IA Responsável — memorize os nomes e um exemplo prático de cada. Equidade (fairness) e Responsabilização (accountability) são os que mais aparecem com cenários de caso.
</div>

## Avaliação de modelos generativos

**Groundedness** — a resposta é baseada no contexto fornecido? (Evita alucinações)
**Relevance** — a resposta é relevante para a pergunta?
**Coherence** — a resposta é coerente e bem estruturada?
**Fluency** — a linguagem é natural e fluente?
**Similarity** — quão próxima a resposta está da resposta esperada?

## O que cai no exame

- Os 6 princípios de IA Responsável com exemplos práticos
- Azure AI Content Safety para filtrar conteúdo prejudicial
- Fairlearn para detectar e mitigar bias
- Explicabilidade de modelos (por que o modelo tomou essa decisão)
- Azure AI Foundry como plataforma unificada de IA Generativa
- Métricas de avaliação de LLMs (groundedness, relevance, coherence)
