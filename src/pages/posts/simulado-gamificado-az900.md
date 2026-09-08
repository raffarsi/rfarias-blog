---
layout: ../../layouts/PostLayout.astro
title: "Como montei um simulado gamificado de AZ-900 para meus alunos"
category: "Docência"
tag: "docencia"
date: "9 Ago 2026"
readTime: "7 min"
description: "O processo de criação de uma plataforma de simulados com gamificação para preparação do AZ-900."
next:
  title: "NSG vs ASG"
  slug: "nsg-vs-asg"
---

Simulados de certificação são, na maioria, entediantes. Você responde 60 perguntas, recebe uma nota e pronto. Não tem progressão, não tem desafio incremental, não tem motivo para voltar no dia seguinte.

Quando comecei a preparar meus alunos do Senac para o AZ-900, decidi que o material de estudo precisava ser diferente. Criei uma plataforma de simulados com gamificação — banco de questões, sistema de XP e níveis, conquistas temáticas e ranking entre alunos, integrada diretamente ao meu blog.

## O problema que eu queria resolver

Certificações fundamentals como o AZ-900 cobrem um conteúdo amplo mas não profundo — 6 domínios com centenas de conceitos. O desafio do aluno não é entender cada conceito individualmente, é reter tudo junto.

Simulados tradicionais testam retenção, mas não incentivam repetição. A gamificação resolve isso criando loops de engajamento: o aluno volta porque quer subir de nível, desbloquear uma conquista ou ultrapassar um colega no ranking.

## O que a plataforma tem

**Banco de questões por domínio.** 200 questões organizadas pelos domínios do exame, com três níveis de dificuldade. Cada questão tem explicação detalhada para cada opção — o aluno não só descobre que errou, entende por que errou.

**Sistema de XP e níveis.** Cada resposta certa dá pontos de experiência. Respostas consecutivas ativam um multiplicador (streak). Erros não punem — apenas não somam. A filosofia é incentivar tentativa, não penalizar erro.

**Simulados cronometrados.** O aluno pode fazer simulados completos (60 questões em 85 minutos, igual ao exame real) ou simulados por domínio. No final, recebe um relatório com acertos por domínio e comparação com tentativas anteriores.

**Laboratórios guiados.** 14 exercícios práticos com passo a passo no portal do Azure: criar uma VM, configurar um Storage Account, montar uma VNet.

**Conquistas temáticas.** 38 conquistas desbloqueáveis: "Mestre do IaaS", "Guardião da Compliance", "Maratonista". São marcos que reconhecem esforço e especialização.

**Ranking.** Classificação entre alunos por XP total — gera uma competição saudável.

## O impacto na turma

A diferença foi visível. Antes da plataforma, o padrão era estudar na véspera. Com a gamificação, comecei a ver acessos diários.

O ranking gerou uma dinâmica que não esperava: quem liderava o ranking começou a ajudar quem estava atrás. A competição virou colaboração — ensinar é a melhor forma de fixar o conteúdo.

## Decisões técnicas

A plataforma roda inteiramente no frontend — HTML, CSS e JavaScript puro, sem backend. Os dados ficam no localStorage. Essa decisão foi deliberada: qualquer aluno acessa de qualquer dispositivo sem criar conta, sem login, sem fricção.

A plataforma está integrada ao blog, na seção [Treinamentos](/treinamentos). Os próximos passos são AI-900 e DP-900.
