---
layout: ../../layouts/PostLayout.astro
title: "Como avaliar a qualidade de um pipeline RAG: métricas e frameworks"
category: "IA Generativa"
tag: "ia-generativa"
date: "30 Dez 2025"
readTime: "10 min"
description: "Mudaram o prompt e perguntaram se melhorou. A resposta honesta era que ninguém sabia. Sem avaliação repetível, todo ajuste em RAG é aposta."
---

A reunião tinha uma pergunta simples: o ajuste que fizemos no prompt melhorou a qualidade das respostas?

A resposta foi "acho que sim, testei umas cinco perguntas aqui e pareceu melhor". Todo mundo aceitou, porque não havia nada melhor para oferecer.

Duas semanas depois, um usuário reclamou de uma resposta que funcionava antes. Ninguém conseguiu dizer se aquilo tinha quebrado no ajuste do prompt, na reindexação ou na troca de versão do modelo.

Esse é o custo de não ter avaliação: você não consegue afirmar nada, nem para frente nem para trás.

## A primeira coisa é separar as duas falhas

Um RAG erra por dois motivos completamente diferentes, e tratá-los como um só é o que faz times girarem em círculo.

**Falha de recuperação:** o trecho que responde a pergunta não chegou ao modelo. Não importa o quanto você melhore o prompt, a informação não estava lá.

**Falha de geração:** o trecho certo chegou e o modelo respondeu mal. Ignorou, interpretou errado ou misturou com o que ele já sabia.

O sintoma na tela é o mesmo: resposta errada. A correção é oposta. Um caso se resolve em chunking, embedding e busca. O outro em prompt e escolha de modelo.

Toda avaliação útil começa medindo esses dois separadamente.

## Medindo a recuperação, que é a parte mais barata

Essa parte não precisa de modelo nenhum, e é onde eu começaria em qualquer projeto.

Monte um conjunto de perguntas reais, aquelas que os usuários de fato fazem, e para cada uma anote qual documento ou trecho contém a resposta. Cinquenta perguntas bem escolhidas valem mais que quinhentas inventadas.

Com isso pronto, duas medidas respondem quase tudo. A primeira é quantas vezes o trecho correto aparece entre os resultados retornados. A segunda é em que posição ele aparece, porque trecho que chega em décimo lugar quando você só manda os três primeiros para o modelo é o mesmo que não ter sido encontrado.

É um teste determinístico, roda em segundos e não custa tokens. Dá para colocar no pipeline e rodar a cada mudança de índice.

## Medindo a geração

Aqui entra o que as ferramentas chamam de avaliação assistida por modelo, em que um modelo avalia a resposta de outro. Três medidas cobrem a maior parte do que importa.

**Fundamentação.** A resposta se apoia no contexto recuperado ou o modelo completou com conhecimento próprio? É a medida mais importante em ambiente corporativo, porque é ela que detecta alucinação. Uma resposta correta mas não fundamentada ainda é um problema: significa que naquele caso deu sorte.

**Relevância.** A resposta responde o que foi perguntado, ou responde outra coisa correta?

**Completude.** A resposta cobre o que o contexto permitia responder, ou parou na metade?

O Azure AI Foundry traz essas avaliações prontas, com o resultado registrado por execução, o que resolve o problema de comparar duas versões.

## O detalhe que decide se isso funciona

O conjunto de avaliação precisa ser real e precisa ser fixo.

Real significa perguntas tiradas dos logs, com a ambiguidade e os erros de digitação que os usuários cometem, não perguntas bem formuladas escritas por quem construiu o sistema. As duas populações se comportam de forma muito diferente.

Fixo significa que você não muda o conjunto junto com o sistema. No momento em que o conjunto muda, os números param de ser comparáveis, e você volta ao "acho que melhorou".

E inclua perguntas cuja resposta correta é "não sei". Esse é o comportamento mais difícil de obter e o mais valioso: um sistema que inventa quando não tem a informação é pior que um sistema que admite a lacuna, principalmente quando alguém vai decidir alguma coisa com aquilo.

## Onde isso encaixa no dia a dia

O padrão que funciona é tratar avaliação como teste, não como estudo.

O teste de recuperação roda a cada mudança de índice ou de estratégia de chunking, é rápido e barato. A avaliação de geração roda antes de subir mudança de prompt ou de modelo, em cima de um subconjunto, porque essa custa tokens.

Com isso no lugar, a conversa da reunião muda. Em vez de "acho que melhorou", a frase vira "a recuperação subiu de 71% para 88% e a fundamentação ficou igual". Aí dá para decidir.

## O mínimo que vale montar hoje

Se eu tivesse que escolher uma única coisa para um time que não tem nada, seria o conjunto de cinquenta perguntas com o trecho esperado anotado. Ele resolve sozinho o diagnóstico mais frequente, que é descobrir se o problema está na busca ou no modelo, e leva uma tarde para montar.

O resto vem depois, e vem mais fácil quando essa base existe.

Se o seu RAG desse uma resposta errada agora, quanto tempo você levaria para saber se o trecho certo chegou a ser recuperado?
