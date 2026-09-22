---
layout: ../../layouts/PostLayout.astro
title: "Modelos multimodais no Azure OpenAI: visão computacional com GPT-4o"
category: "IA Generativa"
tag: "ia-generativa"
date: "25 Nov 2025"
readTime: "9 min"
description: "Ele descreve um gráfico com naturalidade impressionante e erra o valor do eixo. Onde a visão do GPT-4o entrega de verdade e onde ela só parece que entrega."
---

O pedido parecia trivial: mandar o print de um gráfico e pedir os números.

O modelo respondeu com um texto bem escrito, explicou a tendência, comentou o pico no meio do período e citou valores. Só que os valores estavam errados. Não absurdamente errados, o que teria sido melhor. Errados por pouco, do jeito que passa despercebido.

Essa é a armadilha da visão multimodal. Ela é boa o suficiente para parecer confiável em tudo, e confiável de verdade só em parte.

## O que ele faz bem

A régua que uso é simples: o modelo é forte quando a tarefa é **interpretar** e fraco quando a tarefa é **transcrever com exatidão**.

Interpretar cena funciona muito bem. Descrever o que aparece numa foto, dizer se um equipamento está montado do jeito certo, classificar uma imagem em categorias que você define em linguagem natural, apontar o que há de diferente entre duas fotos.

Ler texto em contexto solto também funciona. Uma placa numa foto, um aviso na tela, o título de um documento fotografado.

Entender o que uma interface está mostrando funciona bem o suficiente para ser útil. Mandar o print de uma tela de erro e perguntar o que aconteceu costuma dar resposta melhor que a descrição que o usuário daria por escrito.

## Onde ele falha, e falha em silêncio

Número exato lido de um gráfico é o caso clássico. O modelo estima a partir da posição visual e escreve a estimativa com a mesma segurança com que escreveria um valor lido.

Tabela densa é o segundo. Ele acerta a estrutura e erra o alinhamento, atribuindo o valor de uma linha à linha vizinha. Em tabela de dez colunas, isso acontece com frequência incômoda.

Documento com layout complexo é o terceiro. Formulário com campos em duas colunas, nota fiscal, contrato com cláusulas numeradas. Ele lê, mas não preserva a relação entre rótulo e valor de forma confiável.

O padrão em todos: não existe aviso. Não vem um "não consegui ler bem". Vem uma resposta plausível.

## A combinação que resolve

Para documento estruturado, a resposta não é escolher entre modelo de visão e OCR. É usar os dois em ordem.

O Document Intelligence extrai a estrutura: onde estão as tabelas, quais são as células, qual rótulo pertence a qual valor, com nível de confiança por campo. Isso é trabalho determinístico e ele faz bem.

Aí o modelo entra em cima do texto já estruturado, para interpretar, classificar, resumir ou decidir. Que é onde ele é bom.

Quem inverte essa ordem, jogando o PDF direto no modelo e pedindo o JSON, tem o resultado que descrevi no começo: parece que funcionou até alguém conferir.

## Custo, porque imagem não é barata

Imagem vira tokens, e a quantidade depende da resolução e do nível de detalhe escolhido na chamada.

O nível baixo processa a imagem numa resolução reduzida e fixa, com custo pequeno e previsível. Serve para classificação e para perguntas sobre a cena como um todo.

O nível alto fatia a imagem e processa os pedaços, custando várias vezes mais. É necessário quando o que importa está em detalhe pequeno dentro da imagem.

O erro comum é mandar tudo em alto detalhe por precaução. Em volume, isso multiplica a conta sem melhorar resultado nenhum nas tarefas que não precisavam. Vale medir: rode uma amostra nos dois níveis e compare acerto, não impressão.

E redimensione antes de enviar. Foto de celular moderno tem muito mais resolução do que o modelo aproveita, e você paga por isso.

## Cuidados que valem em ambiente corporativo

Imagem enviada por usuário é entrada não confiável, com um agravante: ela pode conter texto com instrução. Já é conhecido o caso de imagem com comando escrito nela tentando redirecionar o comportamento do modelo. Se a sua aplicação processa imagem que vem de fora, o system prompt precisa tratar o que está na imagem como conteúdo a ser analisado, nunca como instrução a ser seguida.

Do lado de privacidade, imagem costuma carregar mais do que o necessário. Documento fotografado traz o documento inteiro, print de tela traz o resto da tela. Vale recortar antes de enviar quando a tarefa permite.

## Como eu decidiria

Se a resposta errada gera retrabalho, a visão do modelo resolve. Se a resposta errada vira decisão, contrato ou lançamento contábil, ela não pode ser a única fonte. Nesse caso ou o dado vem de extração determinística, ou existe alguém conferindo antes de virar efeito.

Nos seus casos de uso com imagem, o que acontece se o número estiver errado por pouco e ninguém perceber? A resposta a essa pergunta define quanta estrutura você precisa colocar em volta do modelo.
