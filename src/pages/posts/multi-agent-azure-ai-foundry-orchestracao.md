---
layout: ../../layouts/PostLayout.astro
title: "Orquestracao de multiplos agentes com Azure AI Foundry"
category: "IA Generativa"
tag: "ia-generativa"
date: "27 Jan 2026"
readTime: "11 min"
description: "Artigo tecnico sobre orquestracao de multiplos agentes com azure ai foundry — parte da serie de conteudo Azure no blog rfarias.com."
---

Um agente generalista que tenta fazer tudo tende a fazer tudo mal. Isso nao e teoria, e o que observo na pratica: quanto maior o escopo de responsabilidade, menor a precisao por topico.

A solucao e especializar. Um agente de RH que so conhece politicas de RH responde melhor sobre ferias do que um agente generico que sabe de tudo superficialmente. O desafio e orquestrar esses especialistas de forma que o usuario nem saiba que existem varios.

## O padrao de orquestracao

Um orquestrador central recebe a solicitacao, decide qual especialista chamar e consolida a resposta. Os especialistas nao falam entre si diretamente.

```
Usuario
  -> Orquestrador (roteamento)
       -> Agente RH       (ferias, beneficios, politicas)
       -> Agente TI       (suporte, tickets, acessos)
       -> Agente Juridico (contratos, compliance)
  <- Resposta
```

```python
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential
import json

client = AIProjectClient.from_connection_string(
    credential=DefaultAzureCredential(),
    conn_str='eastus.api.azureml.ms;{sub};{rg};{project}'
)

agente_rh = client.agents.create_agent(
    model='gpt-4o', name='agente-rh',
    instructions='Especialista em RH. Responda APENAS sobre ferias, beneficios, politicas. '
                 'Para outros topicos: {"encaminhar": true}',
    tools=[{'type': 'file_search'}],
    tool_resources={'file_search': {'vector_store_ids': [vs_rh.id]}}
)

agente_ti = client.agents.create_agent(
    model='gpt-4o', name='agente-ti',
    instructions='Especialista em TI. Responda sobre sistemas, acessos, incidentes. '
                 'Para outros topicos: {"encaminhar": true}',
    tools=[{'type': 'file_search'}]
)

AGENTES = {'rh': agente_rh, 'ti': agente_ti}

def chamar_agente(agente, mensagem: str) -> str:
    thread = client.agents.create_thread()
    client.agents.create_message(thread_id=thread.id, role='user', content=mensagem)
    run = client.agents.create_and_process_run(
        thread_id=thread.id, assistant_id=agente.id
    )
    messages = client.agents.list_messages(thread_id=thread.id)
    return messages.data[0].content[0].text.value

def orquestrar(solicitacao: str) -> str:
    decisao_str = chamar_agente(
        agente_orquestrador,
        f'Retorne JSON: {{"agente": "rh|ti", "mensagem": "..."}}.\nSolicitacao: {solicitacao}'
    )
    try:
        roteamento = json.loads(decisao_str)
        agente = AGENTES.get(roteamento.get('agente'))
        if agente:
            return chamar_agente(agente, roteamento.get('mensagem', solicitacao))
    except (json.JSONDecodeError, KeyError):
        pass
    return decisao_str
```

## O problema que mais aparece: loops

Agente A chama orquestrador que chama agente A de volta. Acontece quando o orquestrador nao tem confianca suficiente para decidir. Limite de profundidade e obrigatorio:

```python
def orquestrar_com_limite(solicitacao: str, limite: int = 3) -> str:
    tentativas = 0
    while tentativas < limite:
        resultado = orquestrar(solicitacao)
        if not isinstance(resultado, dict) or 'encaminhar' not in resultado:
            return resultado
        tentativas += 1
    return 'Nao consegui processar. Por favor reformule a solicitacao.'
```

## Quando multi-agent vale o investimento

Nao parta para multi-agent por achar que e mais avancado. Um agente unico bem instruido resolve 80% dos casos de uso com muito menos overhead.

Vale quando: dominios com bases de conhecimento muito diferentes que nao devem se misturar, quando cada especialista precisa de ferramentas distintas, ou quando voce tem evidencia de que o agente unico esta falhando em topicos especificos.

Comece simples. Adicione especialistas so quando os dados mostrarem que voce precisa.
