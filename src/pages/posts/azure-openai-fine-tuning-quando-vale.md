---
layout: ../../layouts/PostLayout.astro
title: "Fine-tuning no Azure OpenAI: quando vale a pena e quando é desperdício"
category: "IA Generativa"
tag: "ia-generativa"
date: "14 Out 2025"
readTime: "9 min"
description: "Fine-tuning quase nunca resolve o problema que fizeram ele resolver. Ele ensina forma, não conteúdo, e o custo continua correndo mesmo com o modelo parado."
---

A pergunta chega sempre com a mesma frase: "a gente queria fazer um fine-tuning para o modelo aprender os dados da empresa".

É a expectativa mais comum e é a errada. Fine-tuning não é como o modelo aprende fatos. É como o modelo aprende a se comportar.

Essa distinção parece sutil e custa caro quando passa batido, porque o time monta o dataset, roda o treinamento, paga a hospedagem e descobre no final que o modelo continua sem saber a política de reembolso que estava no documento.

## O que fine-tuning realmente muda

Fine-tuning ajusta os pesos do modelo com base em exemplos de entrada e saída. Ele é bom em fazer o modelo responder **daquele jeito**: aquele formato de JSON, aquele tom, aquela taxonomia de classificação, aquele nível de concisão.

Ele é ruim em fazer o modelo saber coisas novas. Conhecimento factual entra por contexto, não por peso. Se a informação muda de mês em mês, treinar o modelo nela significa retreinar de mês em mês, e ainda assim sem garantia de que ele vai citar a versão certa.

A regra que uso ao ouvir o pedido: se a resposta correta depende de um documento, é RAG. Se a resposta correta depende de um padrão de resposta, aí pode ser fine-tuning.

## Antes de considerar, esgote o que é mais barato

Na prática, a maioria dos casos que chegam como fine-tuning se resolve antes, em três camadas mais baratas.

**System prompt bem escrito.** Boa parte do que as pessoas querem ensinar cabe em instrução explícita. Formato de saída, restrição de escopo, tom, o que fazer quando não souber.

**Few-shot.** Três a cinco exemplos no próprio prompt resolvem a maioria dos problemas de formato. Custa tokens, mas custa zero de operação e muda em minutos.

**RAG.** Se o problema é conhecimento, é aqui que ele mora. E tem a vantagem de ser auditável: dá para mostrar de onde veio a resposta.

Só depois que essas três falharem, de forma medida e não por impressão, é que fine-tuning entra na conversa.

## Quando ele de fato compensa

Existem casos reais, e eles têm assinatura parecida.

**Formato rígido e repetitivo em alto volume.** Quando você precisa que a saída siga exatamente um esquema, milhões de vezes, e o few-shot está consumindo 800 tokens de exemplo em toda chamada. Aí o fine-tuning paga o próprio custo encurtando o prompt.

**Classificação em taxonomia própria.** Quando as categorias são da casa, não do mundo, e explicá-las no prompt fica longo e ainda assim ambíguo.

**Tom e estilo institucional.** Quando a saída precisa soar de um jeito específico e descrever esse jeito em palavras não funciona.

**Latência e custo por token em escala.** Um modelo menor com fine-tuning pode entregar o que um modelo maior entrega no prompt, mais barato e mais rápido.

O padrão comum: o ganho vem de **encurtar o prompt** ou de **usar modelo menor**, não de o modelo saber mais.

## O custo que ninguém coloca na conta

Aqui é onde o projeto costuma travar depois de aprovado.

No Azure OpenAI, fine-tuning tem três custos distintos. O treinamento, cobrado por token treinado. A inferência, como sempre. E a **hospedagem do modelo**, cobrada por hora enquanto o deployment existir, independente de você chamar ou não.

Esse terceiro é o que surpreende. Um modelo ajustado que fica parado no fim de semana continua custando. Em ambiente com vários modelos ajustados por área, a conta de hospedagem pode passar a de inferência.

Some a isso o custo que não aparece em fatura: alguém precisa manter o dataset, reavaliar quando o modelo base for atualizado e repetir o processo quando o comportamento desejado mudar.

## O dataset é o trabalho real

Se depois de tudo a decisão for fazer, o esforço não está no treinamento, está nos dados.

Exemplos precisam ser consistentes entre si. Dois exemplos que resolvem o mesmo caso de formas diferentes ensinam o modelo a ser inconsistente. Precisam cobrir os casos de borda que você quer que ele acerte. E precisam ser em quantidade suficiente para o padrão emergir, o que na prática significa centenas, não dezenas.

Separe uma parte do conjunto para avaliação antes de treinar. Sem isso você não tem como afirmar que melhorou, só que mudou.

## O que eu respondo quando o pedido chega

Peço para a pessoa me mostrar três respostas ruins do modelo atual e me dizer o que deveria ter saído em cada uma.

Na maioria das vezes, olhando as três juntas, fica claro que o problema é instrução vaga ou documento que não foi recuperado. Nesses casos, fine-tuning resolveria um problema que ninguém tem, e o dinheiro iria para hospedagem de um modelo que erra pelo mesmo motivo de antes.

Nas poucas vezes em que o padrão aparece mesmo, a conversa muda de figura e vale a pena.

Se o seu modelo está errando hoje, você sabe dizer se ele errou por não saber o fato ou por não ter entendido o que você pediu? Essa resposta decide sozinha se fine-tuning entra ou não na conversa.
