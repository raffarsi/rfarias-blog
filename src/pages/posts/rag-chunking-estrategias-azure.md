---
layout: ../../layouts/PostLayout.astro
title: "Estratégias de chunking para RAG no Azure AI Search"
category: "IA Generativa"
tag: "ia-generativa"
date: "11 Nov 2025"
readTime: "10 min"
description: "A resposta do agente citou metade de uma tabela e inventou a outra metade. O problema raramente está no modelo, está em onde o documento foi cortado."
---

O pipeline estava certo no papel. Documentos indexados, busca vetorial funcionando, modelo respondendo. Aí alguém perguntou sobre uma política que tinha uma tabela de prazos, e a resposta trouxe a primeira metade da tabela com os valores certos e a segunda metade inventada.

Ninguém mexeu no prompt nem trocou de modelo. O que aconteceu foi mais simples: a tabela tinha sido cortada ao meio na hora de indexar, e o pedaço que o modelo recebeu terminava no meio da linha.

Chunking é a decisão menos discutida e uma das que mais determinam a qualidade de um RAG.

## Por que o tamanho fixo falha

A primeira implementação de todo mundo corta o documento a cada N caracteres. É simples, é rápido e ignora completamente o que o documento é.

O corte cego cria dois problemas. O primeiro é o que aconteceu acima: ele parte estruturas que só fazem sentido inteiras. Tabelas, listas numeradas, blocos de código, cláusulas.

O segundo é mais silencioso. Ele separa a informação do seu contexto. Um parágrafo que diz "o prazo é de 30 dias" perde o valor se o título da seção, que dizia a que prazo aquilo se refere, ficou no chunk anterior. O trecho vai ser recuperado, vai parecer relevante e vai induzir o modelo ao erro.

## Cortar pela estrutura, não pelo tamanho

A mudança que mais melhora resultado é deixar o documento decidir onde ele pode ser cortado.

Em documentos com hierarquia, e isso inclui praticamente toda documentação corporativa, o corte natural é o cabeçalho. Cada seção vira um chunk, ou um grupo de chunks se for longa demais. O título da seção e dos níveis acima dela vão junto, repetidos no começo de cada pedaço.

Essa repetição parece desperdício de token e não é. Ela é o que faz o trecho ser encontrado quando alguém pergunta usando as palavras do título, e o que faz o modelo entender o que está lendo quando recebe o pedaço isolado.

Para documentos sem estrutura clara, o critério seguinte é o parágrafo, nunca o caractere. E tabelas merecem tratamento próprio: ou cabem inteiras num chunk, ou são convertidas em linhas com o cabeçalho repetido em cada uma.

## Tamanho e sobreposição

Com a estrutura respeitada, os números viram ajuste fino.

Chunks pequenos, na faixa de 200 a 400 tokens, dão busca mais precisa. O vetor representa uma ideia só, então a similaridade é mais confiável. O preço é que o modelo recebe menos contexto por trecho e pode precisar de mais trechos para montar a resposta.

Chunks grandes, de 800 a 1500 tokens, preservam raciocínio que se desenvolve ao longo de páginas. O preço é a diluição: quando um chunk fala de cinco coisas, o vetor dele não representa bem nenhuma, e a busca começa a trazer o documento certo pelo motivo errado.

A sobreposição entre chunks vizinhos, algo entre 10% e 20%, serve para o caso em que a informação cai exatamente na fronteira. É seguro de baixo custo, não solução. Se você precisa de 50% de sobreposição para achar as coisas, o problema está no critério de corte.

Não existe número universal. Existe o seu conjunto de perguntas reais medido contra as duas configurações.

## O que o Azure AI Search já faz por você

Vale saber o que não precisa ser construído.

A indexação integrada tem uma etapa de divisão de texto com tamanho e sobreposição configuráveis, e sabe cortar por sentença em vez de cortar no meio da palavra. Para documento de texto corrido, resolve.

Para documento com layout de verdade, escaneado, com tabelas e colunas, vale passar antes pelo Document Intelligence. Ele devolve a estrutura reconhecida, e aí você corta por estrutura em vez de adivinhar onde ela estava.

E a busca híbrida, que combina vetorial com palavra-chave, perdoa parte dos erros de chunking. Quando a pergunta usa um termo exato que está no trecho, a busca textual encontra mesmo que o vetor não tenha ficado bom. Ligar híbrido costuma dar mais resultado que passar a tarde ajustando tamanho de chunk.

## Metadados são metade do trabalho

Um chunk não deveria ser só texto solto. Junto dele vão o documento de origem, a seção, a data de vigência, a área dona e o nível de acesso.

Isso serve para três coisas que aparecem cedo em ambiente corporativo. Filtrar a busca pelo que aquele usuário pode ver. Descartar versões vencidas de uma política. E citar a fonte na resposta, que é o que transforma um chatbot em algo que alguém aceita usar para decidir.

## Como saber se está bom

O erro mais comum é avaliar o RAG inteiro e concluir "melhorou" ou "piorou" sem saber de onde veio a diferença.

Separe as duas perguntas. A primeira é se o trecho certo foi recuperado, e isso se mede sem envolver o modelo: monte um conjunto de perguntas reais, anote qual documento responde cada uma, e veja quantas vezes ele aparece entre os primeiros resultados. A segunda é se o modelo usou bem o que recebeu.

Quando a resposta está errada e o trecho certo estava lá, o problema é de prompt. Quando o trecho certo nem apareceu, é de chunking ou de busca. São correções diferentes e misturá-las custa semanas.

Pegue as cinco perguntas que seus usuários mais fazem e olhe o que foi recuperado em cada uma, não a resposta final. Na maior parte das vezes o diagnóstico está ali, visível, antes de qualquer ajuste no modelo.
