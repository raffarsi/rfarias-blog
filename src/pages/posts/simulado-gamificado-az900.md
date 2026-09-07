---
layout: ../../layouts/PostLayout.astro
title: "Como montei um simulado gamificado de AZ-900 para meus alunos"
category: "Carreira"
tag: "carreira"
date: "9 Ago 2026"
readTime: "7 min"
description: "O processo de criação de uma plataforma de simulados com gamificação para preparação do AZ-900."
next:
  title: "NSG vs ASG"
  slug: "nsg-vs-asg"
---

Uma coisa que sempre me incomodou nos simulados de certificação é que eles são chatos. Você responde 60 perguntas, recebe uma nota e pronto. Não tem progressão, não tem desafio incremental, não tem motivo para voltar.

Resolvi mudar isso para os meus alunos do Senac. Criei uma plataforma de simulados gamificada focada no AZ-900, integrada diretamente ao meu blog.

## O que a plataforma tem

A ideia foi pegar mecânicas de jogos que funcionam e aplicar ao estudo:

O banco de questões é organizado por domínio do exame. Cada domínio tem questões de níveis diferentes, e o aluno vai desbloqueando conforme acerta. Isso cria uma sensação de progresso que o simulado tradicional não dá.

Implementei um sistema de XP e níveis. Cada resposta certa dá pontos, respostas em sequência dão bônus (streak), e erros não punem — apenas não somam. O objetivo é incentivar tentativa, não penalizar erro.

Tem um ranking entre os alunos da turma. Funciona como motivação social — ninguém quer ficar no final da lista, e quem lidera fica orgulhoso.

E tem conquistas temáticas: "Mestre do IaaS", "Guardião da Compliance", "Primeiro Simulado Completo". São marcos que reconhecem esforço, não apenas resultado.

## O impacto na turma

A diferença foi visível. Antes da plataforma, os alunos estudavam na véspera da prova. Com a gamificação, comecei a ver acessos diários — às vezes de madrugada.

O ranking gerou uma competição saudável. Alunos que normalmente não participavam começaram a perguntar sobre os temas que estavam errando.

E as conquistas funcionaram como mini-celebrações. Quando alguém desbloqueava uma conquista rara, compartilhava no grupo da turma.

## O que eu faria diferente

Se fosse começar hoje, adicionaria dois recursos: modo duelo (dois alunos competindo em tempo real) e relatório de gaps (mostrando quais domínios o aluno precisa reforçar com base no histórico).

São funcionalidades que pretendo implementar quando migrar a plataforma para dentro do blog, na seção de Treinamentos.

A lição principal desse projeto: aprender não precisa ser tedioso. Com as mecânicas certas, o estudo vira algo que o aluno *quer* fazer, não algo que ele *tem* que fazer.
