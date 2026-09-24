---
layout: ../../layouts/PostLayout.astro
title: "Function Calling no Azure OpenAI: como agentes executam ações reais"
category: "IA Generativa"
tag: "ia-generativa"
date: "23 Dez 2025"
readTime: "5 min"
description: "O modelo não executa nada: ele pede, e quem executa é o seu código. É nesse intervalo que mora a segurança do agente, e é ali que eu vejo a maioria dos projetos errar."
---

"Se o agente consegue criar uma solicitação de férias, o que impede ele de criar para outra pessoa?" A pergunta veio de um time que revisava um agente de RH ainda em desenho.

A resposta honesta, naquele primeiro desenho, era: nada. A função recebia a matrícula como parâmetro, e quem preenchia o parâmetro era o modelo. Bastava o usuário escrever "abre férias para a matrícula tal" e o modelo, prestativo como sempre, preenchia.

Esse é o ponto que mais confunde quem começa com agentes. Function calling não dá ao modelo o poder de executar coisas. Ele dá ao modelo o poder de pedir. Quem decide se o pedido é atendido é o seu código.

## O modelo não executa nada

O ciclo tem quatro passos, e só um deles acontece no modelo:

1. Você envia a mensagem do usuário junto com a lista de funções disponíveis, cada uma com nome, descrição e parâmetros.
2. O modelo responde com um pedido estruturado: "quero chamar tal função com tais argumentos".
3. O seu código valida o pedido, executa a função e devolve o resultado.
4. O modelo usa o resultado para responder ao usuário, ou pede outra função.

O passo 3 é todo seu. E é nele que a segurança do agente mora. Se o código só repassa o que o modelo pediu, o agente tem exatamente as permissões do usuário mais criativo que falar com ele.

## O ciclo completo em código

O exemplo abaixo usa a API v1 do Azure OpenAI com a Responses API, que é o formato atual da documentação da Microsoft. Repare em três escolhas: a matrícula não é parâmetro de nenhuma função, cada perfil tem a sua lista de funções permitidas, e o laço tem limite de voltas.

```python
import json
from datetime import date
from openai import OpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

token_provider = get_bearer_token_provider(
    DefaultAzureCredential(), "https://ai.azure.com/.default"
)
client = OpenAI(
    base_url="https://oai-producao.openai.azure.com/openai/v1/",
    api_key=token_provider,
)

INSTRUCOES = (
    "Você é o assistente de RH. Antes de criar qualquer solicitação, "
    "repita as datas para o usuário e peça confirmação."
)

TOOLS = [
    {
        "type": "function",
        "name": "consultar_saldo_ferias",
        "description": "Retorna o saldo de férias de quem está conversando. "
                       "Não recebe matrícula: o sistema já sabe quem é o usuário.",
        "parameters": {"type": "object", "properties": {}, "required": []},
    },
    {
        "type": "function",
        "name": "criar_solicitacao_ferias",
        "description": "Cria solicitação de férias para quem está conversando. "
                       "Use só depois de o usuário confirmar as datas.",
        "parameters": {
            "type": "object",
            "properties": {
                "data_inicio": {"type": "string", "description": "AAAA-MM-DD"},
                "data_fim": {"type": "string", "description": "AAAA-MM-DD"},
            },
            "required": ["data_inicio", "data_fim"],
        },
    },
]

PERMISSOES = {
    "colaborador": {"consultar_saldo_ferias", "criar_solicitacao_ferias"},
    "estagiario": {"consultar_saldo_ferias"},
}
MAX_VOLTAS = 5


def validar_periodo(inicio: str, fim: str) -> tuple[date, date]:
    i, f = date.fromisoformat(inicio), date.fromisoformat(fim)
    if i <= date.today() or f < i:
        raise ValueError("Período inválido")
    return i, f


def executar(nome: str, args: dict, usuario: dict) -> dict:
    # A identidade vem da sessão autenticada, nunca do modelo
    if nome not in PERMISSOES.get(usuario["perfil"], set()):
        return {"erro": "Função não permitida para este perfil"}
    if nome == "consultar_saldo_ferias":
        return rh.saldo(usuario["matricula"])
    inicio, fim = validar_periodo(args["data_inicio"], args["data_fim"])
    return rh.criar_ferias(usuario["matricula"], inicio, fim)


def agente(mensagem: str, usuario: dict) -> str:
    # O modelo só enxerga as funções que o perfil pode usar
    permitidas = PERMISSOES.get(usuario["perfil"], set())
    tools_usuario = [t for t in TOOLS if t["name"] in permitidas]

    resposta = client.responses.create(
        model="gpt-4o-prod", instructions=INSTRUCOES, tools=tools_usuario, input=mensagem
    )
    for volta in range(MAX_VOLTAS + 1):
        chamadas = [i for i in resposta.output if i.type == "function_call"]
        if not chamadas:
            return resposta.output_text
        if volta == MAX_VOLTAS:
            break
        saidas = []
        for c in chamadas:
            try:
                resultado = executar(c.name, json.loads(c.arguments), usuario)
            except (ValueError, KeyError) as erro:
                resultado = {"erro": str(erro)}
            saidas.append({
                "type": "function_call_output",
                "call_id": c.call_id,
                "output": json.dumps(resultado, ensure_ascii=False, default=str),
            })
        resposta = client.responses.create(
            model="gpt-4o-prod", instructions=INSTRUCOES, tools=tools_usuario,
            previous_response_id=resposta.id, input=saidas,
        )
    return "Não consegui concluir o pedido. Pode reformular?"
```

`rh` é o cliente do sistema de RH e `gpt-4o-prod` é o nome do deployment. O resto está aí: nada que o modelo escreve decide quem é o usuário ou o que ele pode fazer.

## Onde mora o controle

Entre o pedido do modelo e a execução, eu passo cada chamada por quatro perguntas:

**Essa função existe para esse usuário?** A lista de funções enviada ao modelo já deve ser filtrada pelo perfil. E o código confere de novo, porque o modelo pode pedir uma função que conhece de outra conversa ou que o usuário mencionou.

**De onde vem a identidade?** Matrícula, conta, CPF, tenant: tudo que define sobre quem a ação acontece vem da sessão autenticada. Se aparece como parâmetro, o usuário consegue trocar.

**Os argumentos fazem sentido?** Datas no passado, valores negativos, intervalos invertidos. O modelo erra formato com frequência, e às vezes o usuário induz o erro de propósito.

**A ação tem volta?** Consultar saldo não tem risco. Criar, alterar, pagar e excluir têm. Para essas, a confirmação não deveria depender só da instrução no prompt. O padrão que recomendo é a função devolver um rascunho e a confirmação acontecer num botão da interface, fora do modelo.

## A descrição da função é um contrato

O modelo escolhe a função pelo nome e pela descrição. Descrição vaga gera chamada errada.

"Consulta dados do funcionário" é vago: quais dados? de quem? "Retorna o saldo de férias de quem está conversando" diz o que volta e deixa claro que não serve para terceiros. Vale o mesmo para os parâmetros: dizer o formato esperado (AAAA-MM-DD) evita metade dos erros de conversão.

Eu trato essas descrições como código: elas passam por revisão, têm versão e são testadas com perguntas reais antes de ir para produção.

## Três erros que eu já vi acontecer

**Confiar no parâmetro que o modelo preencheu.** É o caso da abertura. Qualquer identificador que o usuário possa influenciar pela conversa vira vetor de ataque, e o ataque é só uma frase bem escrita.

**Dar funções demais ao agente.** Um agente com vinte funções escolhe pior do que um com cinco, e cada função a mais é mais superfície de ataque. Se o agente de RH não precisa ler dados financeiros, a função simplesmente não deve existir para ele.

**Laço sem limite.** Já vi agente chamar a mesma função repetidamente porque o resultado vinha com erro e o modelo tentava de novo, e de novo. Sem limite de voltas, isso vira custo e latência sem resposta nenhuma para o usuário.

## Quando function calling não é a resposta

Se o fluxo é sempre o mesmo (consulta saldo, valida, cria), talvez você não precise de um modelo decidindo a ordem. Um formulário com três campos resolve com menos risco e menos custo.

Function calling faz sentido quando o caminho depende do que o usuário pede e da resposta de cada etapa. Quanto mais previsível o fluxo, mais o código deve mandar e menos o modelo.

## O que fica

A qualidade de um agente depende menos do modelo e mais do que acontece entre o pedido e a execução. O modelo pede. Seu código decide.

Se hoje alguém escrevesse para o seu agente "faça isso em nome de outra pessoa", o que o código faria?
