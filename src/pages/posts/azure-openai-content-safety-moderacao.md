---
layout: ../../layouts/PostLayout.astro
title: "Azure Content Safety: moderação de conteúdo em aplicações de IA"
category: "IA Generativa"
tag: "ia-generativa"
date: "04 Nov 2025"
readTime: "8 min"
description: "Como integrar o Azure Content Safety para detectar conteúdo prejudicial em inputs e outputs de agentes de IA corporativos."
---
Em aplicações de IA generativa corporativas, moderação de conteúdo não é opcional — é um requisito de compliance e proteção de marca. O Azure Content Safety oferece APIs específicas para detectar conteúdo prejudicial em texto e imagens, além de verificar se as respostas do modelo estão fundamentadas no contexto fornecido.

## Criando o recurso

```bash
az cognitiveservices account create   --name content-safety-prod   --resource-group rg-ia   --kind ContentSafety   --sku S0   --location eastus
```

## Analisando texto: input e output

A estratégia de moderação em duas camadas — verificar o que o usuário envia e o que o modelo responde:

```python
from azure.ai.contentsafety import ContentSafetyClient
from azure.ai.contentsafety.models import AnalyzeTextOptions, TextCategory
from azure.identity import DefaultAzureCredential

client = ContentSafetyClient(
    endpoint="https://content-safety-prod.cognitiveservices.azure.com",
    credential=DefaultAzureCredential()
)

def verificar_conteudo(texto: str, threshold: int = 2) -> dict:
    """
    threshold: 0=safe, 2=low, 4=medium, 6=high
    Retorna: {"aprovado": bool, "flags": list}
    """
    result = client.analyze_text(AnalyzeTextOptions(
        text=texto,
        categories=[
            TextCategory.HATE,
            TextCategory.SEXUAL,
            TextCategory.SELF_HARM,
            TextCategory.VIOLENCE
        ]
    ))

    flags = [
        {"categoria": c.category, "severidade": c.severity}
        for c in result.categories_analysis
        if c.severity >= threshold
    ]

    return {"aprovado": len(flags) == 0, "flags": flags}

# Pipeline com moderação em camadas
def processar_com_moderacao(user_input: str) -> str:
    # 1. Verificar input
    check_input = verificar_conteudo(user_input)
    if not check_input["aprovado"]:
        return f"Sua mensagem não pode ser processada: {check_input['flags']}"

    # 2. Chamar o modelo
    response = openai_client.chat.completions.create(
        model="gpt4o-prod",
        messages=[{"role": "user", "content": user_input}]
    )
    output = response.choices[0].message.content

    # 3. Verificar output
    check_output = verificar_conteudo(output)
    if not check_output["aprovado"]:
        return "Não posso fornecer essa resposta de acordo com as políticas da empresa."

    return output
```

## Groundedness Detection: verificando alucinações

O Content Safety tem um endpoint para verificar se a resposta está fundamentada no contexto fornecido — útil para detectar alucinações em pipelines RAG:

```python
from azure.ai.contentsafety.models import AnalyzeGroundednessOptions

def verificar_grounding(contexto: str, pergunta: str, resposta: str) -> bool:
    result = client.analyze_text_groundedness(
        AnalyzeGroundednessOptions(
            domain="Generic",
            task="QnA",
            grounding_sources=[contexto],
            query=pergunta,
            text=resposta
        )
    )
    # ungrounded = True significa que o modelo inventou algo fora do contexto
    return not result.ungrounded
```

## Filtros nativos do Azure OpenAI

Além do Content Safety separado, o Azure OpenAI tem filtros de conteúdo embutidos configuráveis por deployment:

```bicep
resource deployment 'Microsoft.CognitiveServices/accounts/deployments@2023-10-01-preview' = {
  parent: openAI
  name: 'gpt4o-prod'
  properties: {
    model: { format: 'OpenAI', name: 'gpt-4o', version: '2024-11-20' }
    raiPolicyName: 'politica-corporativa'  // política customizada de content filter
  }
}
```

Categorias configuráveis nos filtros nativos:
- **Hate** — conteúdo de ódio por grupos
- **Sexual** — conteúdo sexualmente explícito
- **Violence** — conteúdo violento
- **Self-harm** — conteúdo sobre auto-lesão

Cada categoria tem threshold ajustável (low/medium/high) e ação configurável (block/annotate).

## Moderação em imagens

Para agentes multimodais que processam imagens:

```python
import base64
from azure.ai.contentsafety.models import AnalyzeImageOptions, ImageData

def verificar_imagem(image_path: str) -> dict:
    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("utf-8")

    result = client.analyze_image(AnalyzeImageOptions(
        image=ImageData(content=image_data)
    ))

    flags = [
        {"categoria": c.category, "severidade": c.severity}
        for c in result.categories_analysis
        if c.severity >= 2
    ]
    return {"aprovada": len(flags) == 0, "flags": flags}
```

<div class="callout">
<strong>Moderação em camadas:</strong> Combine os filtros nativos do Azure OpenAI (baixa latência, primeira camada) com o Azure Content Safety separado (mais configurável, segunda camada). A dupla camada captura o que escapa de cada sistema individualmente — especialmente útil para casos de uso com requisitos regulatórios.
</div>

## Conclusão

Moderação de conteúdo é uma das poucas áreas onde a abordagem "habilitar e esquecer" funciona razoavelmente bem para proteger contra os casos mais grosseiros. O diferencial está nos casos intermediários — alucinações que parecem factuais, conteúdo borderline, respostas tecnicamente corretas mas inadequadas para o contexto corporativo. Para esses, a verificação de groundedness e políticas customizadas de filtro são o que separa uma implementação básica de uma produção-ready.
