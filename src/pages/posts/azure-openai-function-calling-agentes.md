---
layout: ../../layouts/PostLayout.astro
title: "Function Calling no Azure OpenAI: como agentes executam acoes reais"
category: "IA Generativa"
tag: "ia-generativa"
date: "23 Dez 2025"
readTime: "10 min"
description: "Artigo tecnico sobre function calling no azure openai: como agentes executam acoes reais — parte da serie de conteudo Azure no blog rfarias.com."
---

Existe uma diferenca enorme entre um chatbot que responde perguntas e um agente que resolve problemas. A diferenca esta em function calling.

Um chatbot diz: 'para solicitar ferias, acesse o sistema de RH e preencha o formulario'. Um agente faz: abre o sistema, verifica o saldo de dias, cria a solicitacao, retorna o protocolo. O usuario nao muda de sistema.

## Como funciona: o modelo nao executa

O modelo decide o que executar e retorna uma instrucao estruturada. Voce executa. Esse detalhe e critico para seguranca: voce tem controle total.

```python
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
import json

client = AzureOpenAI(
    azure_ad_token_provider=get_bearer_token_provider(
        DefaultAzureCredential(), 'https://cognitiveservices.azure.com/.default'
    ),
    api_version='2024-02-01',
    azure_endpoint='https://oai-producao.openai.azure.com'
)

tools = [
    {
        'type': 'function',
        'function': {
            'name': 'consultar_saldo_ferias',
            'description': 'Consulta o saldo de dias de ferias do funcionario',
            'parameters': {
                'type': 'object',
                'properties': {
                    'matricula': {'type': 'string'}
                },
                'required': ['matricula']
            }
        }
    },
    {
        'type': 'function',
        'function': {
            'name': 'criar_solicitacao_ferias',
            'description': 'Cria solicitacao de ferias no sistema de RH',
            'parameters': {
                'type': 'object',
                'properties': {
                    'matricula': {'type': 'string'},
                    'data_inicio': {'type': 'string'},
                    'data_fim': {'type': 'string'}
                },
                'required': ['matricula', 'data_inicio', 'data_fim']
            }
        }
    }
]

def consultar_saldo_ferias(matricula: str) -> dict:
    return {'matricula': matricula, 'saldo_dias': 22, 'vencimento': '2026-12-31'}

def criar_solicitacao_ferias(matricula: str, data_inicio: str, data_fim: str) -> dict:
    protocolo = f'FER{hash((matricula, data_inicio)) % 100000:05d}'
    return {'protocolo': protocolo, 'status': 'Criado'}

FUNCOES = {
    'consultar_saldo_ferias': consultar_saldo_ferias,
    'criar_solicitacao_ferias': criar_solicitacao_ferias
}

def agente(mensagem: str, matricula_usuario: str) -> str:
    messages = [
        {'role': 'system', 'content': f'Assistente de RH. Matricula do usuario: {matricula_usuario}'},
        {'role': 'user', 'content': mensagem}
    ]
    while True:
        response = client.chat.completions.create(
            model='gpt4o-prod', messages=messages, tools=tools, tool_choice='auto'
        )
        msg = response.choices[0].message
        messages.append(msg)
        if not msg.tool_calls:
            return msg.content
        for tc in msg.tool_calls:
            params = json.loads(tc.function.arguments)
            # Validar antes de executar
            if tc.function.name == 'criar_solicitacao_ferias':
                if params.get('matricula') != matricula_usuario:
                    resultado = {'erro': 'Nao e possivel criar solicitacao para outra matricula'}
                else:
                    resultado = FUNCOES[tc.function.name](**params)
            elif tc.function.name in FUNCOES:
                resultado = FUNCOES[tc.function.name](**params)
            else:
                resultado = {'erro': 'Funcao nao autorizada'}
            messages.append({
                'role': 'tool',
                'tool_call_id': tc.id,
                'content': json.dumps(resultado, ensure_ascii=False)
            })
```

## O que validar antes de executar

A validacao entre o modelo retornar o tool_call e voce executar e onde mora a seguranca. O usuario tem permissao para essa acao? Os parametros fazem sentido? A acao e sobre os proprios dados do usuario ou de outra pessoa?

O modelo nao valida isso. Voce valida.

Function calling e o que separa IA generativa de automacao real. A qualidade do resultado depende menos do modelo e mais das descricoes das funcoes e da robustez das validacoes.
