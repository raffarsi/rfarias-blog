---
layout: ../../layouts/PostLayout.astro
title: "Copilot Studio: criando agentes corporativos sem código"
category: "IA Generativa"
tag: "ia-generativa"
date: "13 Jan 2026"
readTime: "8 min"
description: "Como o Microsoft Copilot Studio permite criar agentes de IA conectados a dados corporativos sem precisar escrever código."
---

O Microsoft Copilot Studio (antigo Power Virtual Agents) é a plataforma low-code da Microsoft para criar agentes de IA. Com ele, equipes de negócio podem construir chatbots e agentes conectados a dados corporativos, fluxos do Power Automate e bases de conhecimento, sem escrever código Python ou configurar infraestrutura Azure.

## O que o Copilot Studio oferece

**Topics:** os fluxos de conversa. Cada tópico define como o agente responde a um tipo de pergunta ou intenção do usuário.

**Generative AI:** integração com Azure OpenAI para respostas generativas baseadas em documentos ou bases de conhecimento: o agente "faz RAG" sem você implementar o pipeline.

**Ações (Power Automate):** o agente pode executar ações reais (criar tickets, consultar CRMs, enviar emails, atualizar planilhas), conectando ao ecossistema Power Platform.

**Canais:** Teams, SharePoint, site web, WhatsApp e outros canais de publicação com um clique.

## Criando o primeiro agente

No portal studio.microsoft.com:

1. Novo agente -> definir nome e idioma (Português do Brasil)
2. Configurar instruções do agente (equivalente ao System Prompt)
3. Adicionar fontes de conhecimento (SharePoint, PDFs, sites internos)
4. Publicar no canal desejado (Microsoft Teams para uso corporativo)

## Integrando com base de conhecimento corporativa

O Copilot Studio suporta conexão direta com:

- **SharePoint:** indexa automaticamente documentos de sites SharePoint selecionados
- **Sites web:** crawl de URLs específicas para base de conhecimento
- **Azure AI Search:** para ambientes que já tem índices criados

```
Configuracao no Studio:
Settings > Generative AI > Add knowledge source
  -> SharePoint: https://empresa.sharepoint.com/sites/rh
  -> URL: https://intranet.empresa.com/politicas
```

O agente usa essas fontes para responder com grounding, igual ao RAG, mas sem escrever código.

## Criando Topics (fluxos de conversa)

Além do modo generativo, você define Topics para fluxos estruturados:

```
Topic: Solicitar Ferias
  Trigger: "quero tirar ferias", "solicitar ferias", "dias de ferias"

  Perguntar ao usuario:
    - Periodo desejado (data inicio e fim)
    - Tipo de ferias (coletiva, programada, antecipada)

  Acao (Power Automate):
    - Verificar saldo de dias no sistema de RH
    - Se saldo suficiente: criar solicitacao no SAP
    - Enviar email de confirmacao ao gestor
    - Notificar usuario com numero do protocolo

  Resposta: "Solicitacao #{protocolo} criada. Seu gestor recebera notificacao."
```

## Integrações via Power Automate

Para ações que vão além de responder perguntas:

```
Fluxo Power Automate: "Consultar Status de Ticket"
  Trigger: Copilot Studio (recebe numero do ticket)
  Acoes:
    1. Conectar ao ServiceNow via conector
    2. Buscar ticket pelo numero
    3. Retornar status, responsavel e SLA
  Resposta de volta ao agente com os dados
```

O agente consegue executar esse fluxo sem o usuário sair da conversa.

## Quando usar Copilot Studio vs Azure AI Foundry

| Critério | Copilot Studio | Azure AI Foundry |
|----------|---------------|-----------------|
| Audiência | Business users, IT | Desenvolvedores |
| Código | Low-code | Pro-code |
| Customização | Média | Total |
| Integração Power Platform | Nativa | Requer desenvolvimento |
| Controle de rede/segurança | Limitado | Total |
| Tempo para primeira versão | Horas | Dias/Semanas |

**Use Copilot Studio quando:**
- A equipe não tem desenvolvedores Python/Azure disponíveis
- O agente vai para Microsoft Teams rapidamente
- Integrações são principalmente com Power Platform e M365

**Use Azure AI Foundry quando:**
- Precisa de controle total sobre o pipeline RAG
- Requisitos rigorosos de rede (Private Endpoints, VNet)
- O agente vai para canais próprios (app web, API)

<div class="callout">
<strong>Governança de dados:</strong> O Copilot Studio usa o Microsoft Azure como infraestrutura, mas os dados processados passam pelos serviços da Power Platform. Verifique as políticas de retenção de dados e conformidade com LGPD antes de conectar fontes de dados sensíveis.
</div>

## Conclusão

O Copilot Studio democratiza a criação de agentes de IA corporativos. Para casos de uso onde velocidade de entrega e integração com M365 são prioridade, é a escolha correta. Para agentes com requisitos técnicos avançados de rede, segurança ou customização de pipeline, Azure AI Foundry oferece o controle necessário.
