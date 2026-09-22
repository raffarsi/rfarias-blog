---
layout: ../../layouts/PostLayout.astro
title: "Cache de respostas no Azure OpenAI: reduzindo custo e latência"
category: "IA Generativa"
tag: "ia-generativa"
date: "10 Fev 2026"
readTime: "9 min"
description: "O time ligou cache esperando cortar a conta pela metade e a taxa de acerto ficou em 4%. Pergunta em linguagem natural quase nunca se repete igual."
---

A conta do Azure OpenAI cresceu e a primeira ideia foi cache. Faz sentido: muita gente pergunta a mesma coisa, então guardar a resposta deveria cortar custo e latência de uma vez.

Implementaram do jeito direto. Hash do texto da pergunta como chave, resposta guardada no Redis, expiração de 24 horas.

A taxa de acerto ficou em 4%.

O motivo é óbvio depois que alguém fala em voz alta: ninguém pergunta duas vezes exatamente a mesma coisa. "Qual o prazo de reembolso?", "quanto tempo demora o reembolso" e "prazo pra receber reembolso" são a mesma pergunta e três hashes diferentes.

## Cache exato serve, mas não para o que você acha

Antes de descartar, vale saber onde o cache por hash funciona bem, porque existem esses casos e eles são os mais baratos de implementar.

Ele funciona quando a entrada não é digitada por uma pessoa. Classificação de tickets que chegam com texto repetido de formulário, enriquecimento de registros em lote, geração de descrição a partir de campos estruturados, qualquer fluxo em que o mesmo input aparece de novo porque um sistema o produziu.

Nesses casos a taxa de acerto é alta e o custo de implementar é uma linha.

Para chat com gente digitando, não.

## Cache semântico

A alternativa é guardar o vetor da pergunta junto com a resposta e, na próxima, procurar por proximidade em vez de igualdade. Se a nova pergunta estiver perto o suficiente de uma já respondida, devolve a resposta guardada.

O ponto de atenção é o limiar de proximidade, e ele é mais delicado do que parece.

Muito frouxo e você entrega a resposta errada com confiança total. "Qual o prazo para reembolso" e "qual o prazo para reajuste" são textualmente parecidas e semanticamente diferentes. Um limiar generoso trata as duas como a mesma pergunta.

Muito apertado e você volta aos 4%.

Não existe número que sirva para todo mundo. O que existe é o seu log: pegue as perguntas reais, calcule a similaridade entre pares que você sabe que são a mesma coisa e pares que você sabe que não são, e escolha o corte onde as duas distribuições se separam. Em ambientes que envolvem dinheiro ou política interna, eu erro para o lado apertado.

## O que quase ninguém trata: invalidação

Cache de resposta guarda mais do que a resposta. Guarda o estado do mundo no momento em que ela foi gerada.

Se a base de conhecimento mudou, se a política foi revisada, se o preço foi reajustado, a resposta guardada virou informação errada servida instantaneamente e com aparência de certeza. É pior que a versão lenta e correta.

Duas defesas simples resolvem a maior parte disso. A primeira é a expiração curta, que limita a janela de dano sem exigir integração nenhuma. A segunda é invalidar por origem: guarde junto da resposta quais documentos foram usados para gerá-la e, quando um documento for reindexado, descarte o que dependia dele.

A segunda dá mais trabalho e é a que permite expiração longa, que é onde mora a economia de verdade.

## O cache que vem de graça

Vale lembrar que parte disso já acontece sem você construir nada.

Os modelos mais recentes aplicam desconto em tokens de entrada repetidos no início do prompt. Se o seu system prompt é longo e estável, e ele vem antes da parte variável, esse trecho passa a custar menos nas chamadas seguintes.

O que isso exige de você é ordenação: o que é fixo primeiro, o que muda por último. É uma mudança de meia hora que reduz custo sem risco nenhum de servir resposta velha, e por isso eu faria ela antes de qualquer cache próprio.

## A conta que decide

Cache semântico não é grátis. Cada consulta gera um embedding, que custa tokens e tempo, e ainda tem a busca vetorial no meio.

A economia só aparece se a taxa de acerto pagar esse overhead. Em fluxo onde as perguntas se repetem bastante, paga com folga. Em fluxo de cauda longa, onde cada usuário pergunta algo diferente, você adiciona latência a todas as chamadas para economizar em poucas.

Antes de construir, dá para estimar com o que você já tem: pegue um mês de perguntas do log, agrupe por similaridade e veja qual fração cairia em grupos com mais de uma ocorrência. Esse número é o teto da sua taxa de acerto, e ele costuma ser bem menor do que a intuição sugere.

## Por onde eu começaria

Primeiro a ordenação do prompt, que é barata e não tem risco. Depois o cache exato, se existir fluxo automatizado no sistema. Cache semântico por último, e só se o log mostrar repetição suficiente para justificar.

Se você ligasse cache semântico hoje, saberia dizer quantos por cento das perguntas do último mês realmente se repetem?
