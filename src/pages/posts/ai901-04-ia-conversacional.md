---
layout: ../../layouts/PostLayout.astro
title: "AI-901 na prática [4] — IA conversacional e agentes"
category: "IA Generativa"
tag: "ia-generativa"
serie: "AI-901 na prática"
serieSlug: "ai901"
serieNum: 4
date: "4 Abr 2026"
readTime: "8 min"
description: "Azure Bot Service, Copilot Studio e como criar assistentes virtuais inteligentes."
prev:
  title: "AI-901 [3] — Linguagem e IA Generativa"
  slug: "ai901-03-linguagem-ia-generativa"
next:
  title: "AI-901 [5] — IA Responsável"
  slug: "ai901-05-ia-responsavel-foundry"

---

IA conversacional engloba chatbots, assistentes virtuais e agentes de IA. O AI-901 cobre tanto os conceitos quanto as ferramentas Microsoft para construir essas soluções.

## Azure Bot Service

Plataforma para criar, implantar e gerenciar bots em múltiplos canais (Teams, WhatsApp, Web, Slack):

```bash
# Criar Bot Service
az bot create \
  --resource-group meu-rg \
  --name meu-bot \
  --kind registration \
  --endpoint "https://minha-app.azurewebsites.net/api/messages" \
  --sku F0
```

Um bot típico tem:
- **Dialog**, fluxo de conversa
- **Intents**, o que o usuário quer fazer
- **Entities**, dados extraídos da mensagem
- **State**, memória da conversa (usuário, diálogo, conversa)

```python
from botbuilder.core import ActivityHandler, TurnContext
from botbuilder.schema import Activity

class MeuBot(ActivityHandler):
    async def on_message_activity(self, turn_context: TurnContext):
        user_message = turn_context.activity.text
        
        if "olá" in user_message.lower():
            await turn_context.send_activity("Olá! Como posso ajudar?")
        elif "azure" in user_message.lower():
            await turn_context.send_activity("Azure é a plataforma de cloud da Microsoft!")
        else:
            await turn_context.send_activity(f"Você disse: {user_message}")
```

## Microsoft Copilot Studio

Plataforma low-code para criar agentes de IA sem código:

1. Defina tópicos (intenções) com frases de gatilho
2. Crie fluxos de conversa com nós visuais
3. Integre com APIs e bases de conhecimento
4. Publique em Teams, WhatsApp, website

**Copilot Studio vs Azure Bot Service:**
- Copilot Studio: low-code, rápido, ideal para casos de uso de negócio
- Bot Service: pro-code, flexível, para cenários complexos e personalizados

## Q&A Pairs, Perguntas e Respostas

O Azure Language Service inclui Question Answering para criar bases de conhecimento:

```python
from azure.ai.language.questionanswering import QuestionAnsweringClient
from azure.core.credentials import AzureKeyCredential

client = QuestionAnsweringClient(
    endpoint="https://meu-language.cognitiveservices.azure.com/",
    credential=AzureKeyCredential("MINHA_CHAVE")
)

output = client.get_answers(
    project_name="minha-base-conhecimento",
    deployment_name="production",
    question="Como faço para redefinir minha senha?"
)

print(f"Resposta: {output.answers[0].answer}")
print(f"Confiança: {output.answers[0].confidence:.2f}")
```

## Copilot, IA integrada ao Microsoft 365

**Microsoft 365 Copilot**, IA generativa integrada ao Word, Excel, PowerPoint, Teams e Outlook. Gera documentos, resume reuniões, responde emails.

**GitHub Copilot**, assistente de código que sugere, completa e explica código em tempo real no VS Code e outros IDEs.

<div class="callout">
<strong>Dica para o exame:</strong> O AI-901 distingue entre Copilot (produto integrado ao Microsoft 365/GitHub) e Copilot Studio (plataforma para criar seus próprios agentes). São coisas diferentes, não confunda.
</div>

## Agentes de IA

Agentes vão além de chatbots, eles tomam ações autônomas:

1. **Percebem** o ambiente (leem emails, monitoram dados)
2. **Raciocinam** sobre o que fazer
3. **Agem** (enviam emails, criam tickets, atualizam sistemas)
4. **Aprendem** com o resultado

O Azure AI Foundry e o Copilot Studio suportam criação de agentes com ferramentas (tools) que permitem chamar APIs externas.

## O que cai no exame

- Azure Bot Service para bots pro-code
- Copilot Studio para bots low-code
- Question Answering para bases de conhecimento FAQ
- Diferença entre Microsoft 365 Copilot e Copilot Studio
- GitHub Copilot para desenvolvimento de software
- Conceito de agentes de IA (perceber, raciocinar, agir)
