---
layout: ../../layouts/PostLayout.astro
title: "Rate limits do Azure OpenAI em produção: como dimensionar e lidar com throttling"
category: "IA Generativa"
tag: "ia-generativa"
date: "28 Out 2025"
readTime: "6 min"
description: "Você vai atingir o rate limit. A questão é se o sistema degrada em silêncio ou entrega um 429 na cara do usuário. O que conta no limite, por que ele estoura antes do que a conta indica e o que fazer em cada caso."
---

Já vi acontecer mais de uma vez: a aplicação passa semanas em teste com meia dúzia de pessoas, tudo funciona, e no primeiro dia de uso real aparece HTTP 429 na tela do usuário.

O time olha o painel e não entende. O consumo do minuto está bem abaixo da cota. Como pode estar dando limite?

Em desenvolvimento, rate limit é inconveniente. Em produção, é incidente. E quase sempre o incidente vem de três coisas que ninguém explicou para o time: o que conta no limite, como ele é medido e o que fazer quando ele estoura.

## O que conta no limite

Cada deployment tem uma cota em TPM (tokens por minuto) e um limite derivado em RPM (requisições por minuto). Nos modelos de chat da família gpt-4o, cada 1.000 TPM dão 6 RPM. Modelos mais novos e os de raciocínio têm proporções próprias, e a documentação avisa que trocar de modelo pode desbalancear a cota sem ninguém perceber. Vale conferir a tabela do modelo que você usa.

O detalhe que pega quase todo mundo: o limite não conta os tokens que você realmente usou. Ele conta uma estimativa feita na chegada da requisição, que soma o tamanho do prompt e o limite de saída: `max_tokens` na Chat Completions, `max_output_tokens` na Responses API.

Se a resposta típica tem 200 tokens e o código manda um limite de saída de 4.000, cada chamada ocupa na cota como se fosse gerar 4.000. É a causa mais comum de "estamos usando pouco e mesmo assim dá 429". A própria Microsoft recomenda colocar nesse limite o mínimo que o cenário precisa.

O segundo detalhe: o limite por minuto é avaliado em janelas curtas, de 1 ou 10 segundos. Um deployment de 600 RPM aceita cerca de 10 requisições por segundo, não 600 de uma vez. Rajada no início do minuto gera 429 mesmo com o minuto inteiro abaixo do limite.

## Como saber qual limite estourou

As respostas trazem cabeçalhos que dizem quanto sobra: `x-ratelimit-remaining-tokens` e `x-ratelimit-remaining-requests`. Registrar esses dois valores muda a conversa.

**Sobrando requisições e faltando tokens:** o problema é o tamanho. Prompts longos, contexto de RAG grande demais ou limite de saída exagerado.

**Sobrando tokens e faltando requisições:** o problema é o volume ou a distribuição. Muitos usuários ao mesmo tempo, ou processos em lote disparando tudo de uma vez.

Cada caso tem uma solução diferente. Aumentar a cota resolve os dois só até o próximo crescimento.

## Primeira linha de defesa: retry do jeito certo

O SDK do OpenAI para Python já faz retry com backoff exponencial para 429 e erros transitórios, e respeita o tempo de espera que o serviço devolve (até 2 minutos). O padrão são 2 novas tentativas. Para produção, eu ajusto no cliente em vez de escrever o meu próprio laço:

```python
from openai import OpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

token_provider = get_bearer_token_provider(
    DefaultAzureCredential(), "https://ai.azure.com/.default"
)

client = OpenAI(
    base_url="https://oai-prod-br.openai.azure.com/openai/v1/",
    api_key=token_provider,
    max_retries=5,
    timeout=30,
)

resposta = client.responses.create(
    model="gpt-4o-prod",
    input="Resuma a política de reembolso em 3 linhas.",
    max_output_tokens=300,  # o mínimo que o cenário precisa
)
```

Retry resolve pico curto. Não resolve falta de capacidade. Se a aplicação passa o dia inteiro fazendo retry, o usuário está esperando segundos a mais em cada resposta e você não está vendo.

Para processamento em lote, o caminho é outro: fila com vazão controlada. Um job que manda 5.000 documentos de uma vez vai disputar a cota com o chat dos usuários e perder os dois.

## Escolhendo o tipo de deployment

O tipo de deployment define de onde vem a capacidade:

**Global Standard** processa em qualquer região do Azure e costuma ter a cota mais alta. É o ponto de partida recomendado quando não há restrição de onde o dado é processado.

**Data Zone Standard** mantém o processamento dentro de uma zona geográfica, como Estados Unidos ou União Europeia. Serve quando há requisito de residência, com cota intermediária.

**Standard regional** processa só na região do recurso. É o mais restrito em cota, e o único caminho quando o dado não pode sair de uma região específica.

Em ambiente regulado, essa escolha costuma ser do jurídico e do compliance antes de ser da arquitetura. Vale ter essa conversa antes de dimensionar.

## Quando o pay-as-you-go não basta: PTU com spillover

Provisioned Throughput Units reservam capacidade: você paga por hora de capacidade, usando ou não, e em troca tem latência previsível e sem disputa com outros clientes.

Até pouco tempo, o problema do PTU era o pico: passou da capacidade reservada, 429. Desde agosto de 2025 o spillover é GA. Quando o deployment provisionado recusa a requisição (429 por capacidade, 400 por contexto que o PTU não suporta, ou 500 e 503), ela é redirecionada para um deployment Standard que você indica. Três condições: o Standard precisa estar no mesmo recurso, com o mesmo modelo e a mesma versão, e o spillover precisa ser ligado no deployment ou na requisição. O dia a dia roda no PTU e o pico vai para o pay-as-you-go.

O critério que eu uso: PTU faz sentido quando existe uma base de consumo constante e previsível ao longo do dia. Consumo que só aparece em horário comercial ou em campanhas raramente paga a reserva.

## Vários deployments, um ponto de entrada

Quando há mais de uma aplicação ou mais de um deployment, espalhar a lógica de distribuição e fallback pelo código de cada time não escala. O padrão que a Microsoft recomenda é colocar o Azure API Management na frente, como gateway de IA.

Dois recursos do APIM resolvem a maior parte dos problemas deste artigo:

**Pool de backends** com balanceamento por prioridade ou peso e circuit breaker configurado para aceitar o `Retry-After`. Com essa opção ligada, o deployment que devolveu 429 sai do rodízio pelo tempo indicado e volta sozinho.

**Limite de tokens por consumidor**, com a política `llm-token-limit`. Cada aplicação ou time tem o seu teto, e um processo descontrolado não consome a cota de todo mundo:

```xml
<inbound>
    <base />
    <llm-token-limit
        counter-key="@(context.Subscription.Id)"
        tokens-per-minute="20000"
        token-quota="2000000"
        token-quota-period="Monthly"
        estimate-prompt-tokens="false"
        remaining-tokens-header-name="x-tokens-restantes" />
</inbound>
```

Estourado o limite por minuto, o APIM devolve 429. Estourada a cota do período, devolve 403. As duas respostas saem do gateway, sem chegar ao deployment. Um detalhe: com `estimate-prompt-tokens="false"`, a conta usa os tokens reais da resposta, então a requisição que cruza o limite ainda passa e o bloqueio vale a partir da seguinte. Com `true`, o APIM estima antes e bloqueia na hora, ao custo de uma estimativa menos exata.

## O que fica

Rate limit bem tratado é invisível para o usuário. Para chegar lá, a ordem que eu sigo é: medir qual limite estoura, ajustar o limite de saída e o tamanho do contexto, configurar o retry do SDK, separar lote de uso interativo e só então falar em mais cota, PTU ou gateway.

No seu ambiente, alguém sabe dizer hoje se o 429 de ontem foi por token ou por requisição?
