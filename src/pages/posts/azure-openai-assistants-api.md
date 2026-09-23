---
layout: ../../layouts/PostLayout.astro
title: "Azure OpenAI Assistants API: quando usar em vez de RAG customizado"
category: "IA Generativa"
tag: "ia-generativa"
date: "18 Nov 2025"
readTime: "5 min"
description: "O protótipo com Assistants ficou pronto numa tarde. O problema apareceu quando o jurídico perguntou quem podia ver cada documento. A decisão entre serviço gerenciado e RAG próprio continua valendo, mesmo depois da aposentadoria da API."
---

*Atualização de setembro de 2026: a Microsoft aposentou a Assistants API do Azure OpenAI em 26 de agosto de 2026. O modelo de trabalho que ela introduziu (agente gerenciado, conversa persistida, busca em arquivos embutida) continua vivo no Azure AI Foundry Agent Service. A decisão discutida aqui vale igual para ele.*

O protótipo ficou pronto numa tarde. Subimos uns quarenta PDFs de políticas internas, criamos um assistente com busca em arquivos e ele respondia bem. Todo mundo gostou da demo.

Aí o jurídico fez uma pergunta simples: "esse assistente respeita quem pode ver cada documento?"

Não respeitava. Todos os arquivos estavam no mesmo repositório vetorial, e qualquer pessoa com acesso ao assistente recebia respostas baseadas em qualquer um deles. Para uma demo, irrelevante. Para produção com documentos de RH e contratos, inaceitável.

Essa é a fronteira real entre um serviço gerenciado e um RAG construído por você. Não é tecnologia. É controle.

## O que a Assistants API entregava pronto

A proposta era tirar do seu colo tudo que dá trabalho num chatbot com documentos:

**Threads.** O histórico da conversa ficava guardado no serviço. Você não precisava montar o contexto de cada chamada nem decidir o que cortar quando a conversa crescia.

**File search.** Você enviava arquivos, o serviço fazia o chunking, gerava os embeddings, indexava num vector store e buscava na hora da pergunta. Sem índice para desenhar.

**Code interpreter.** Um ambiente isolado onde o modelo executava Python para cálculos e análise de planilhas.

**Function calling.** O modelo pedia para chamar funções suas, e o serviço orquestrava o vai e volta.

Para chegar de zero a algo funcionando, poucas coisas eram tão rápidas.

## O que o RAG customizado entrega que o gerenciado não entrega

Construir o próprio RAG, normalmente com Azure AI Search, dá mais trabalho. Em troca, cada decisão fica com você:

**Filtro de segurança por documento.** Cada chunk carrega metadados de quem pode vê-lo, e a busca filtra pelo usuário que perguntou. Foi exatamente o que faltou no protótipo:

```python
resultados = search_client.search(
    search_text=pergunta,
    filter="grupos_permitidos/any(g: search.in(g, '{}'))".format(",".join(grupos_do_usuario)),
    top=5,
)
```

**Chunking do seu jeito.** Cortar por seção, preservar tabelas inteiras, repetir o título em cada pedaço. No gerenciado, a estratégia é a do serviço.

**Busca híbrida e ranking semântico.** Combinar vetor com palavra-chave muda muito a qualidade quando as perguntas usam termos exatos, como números de política ou nomes de sistemas.

**Um índice, vários consumidores.** O mesmo índice atende o chatbot, a busca da intranet e um agente de atendimento. No gerenciado, os arquivos ficam presos àquele uso.

**Observabilidade do meio do caminho.** Você enxerga o que foi recuperado antes de o modelo responder, e isso é o que permite separar erro de busca de erro de geração.

## Então, quando usar cada um

O critério que eu uso cabe em três perguntas.

**Todo usuário pode ver todo documento?** Se sim, o gerenciado resolve. Se a resposta depende de quem pergunta, você precisa de filtro de segurança no nível do documento, e isso é território de RAG próprio.

**O volume e a estrutura dos documentos são simples?** Dezenas de PDFs de texto corrido funcionam bem com o chunking padrão. Milhares de documentos com tabelas, versões e datas de vigência pedem controle sobre como tudo é cortado e filtrado.

**Isso vai ser reaproveitado?** Se o conteúdo indexado vai servir a mais de uma aplicação, vale construir o índice uma vez e do jeito certo.

Se as três respostas apontam para o simples, começar pelo gerenciado não é atalho, é a escolha correta. Muita iniciativa de IA morre tentando montar a arquitetura definitiva de algo que ninguém validou ainda.

## O que a aposentadoria ensinou

A saída da Assistants API deixou uma lição que vale para qualquer serviço gerenciado: o que o serviço guarda por você, ele também leva embora quando muda. Histórico de threads não migrou sozinho para o modelo novo, e quem dependia dele precisou exportar antes do prazo.

Com RAG próprio, o índice, os metadados e o histórico são seus. Troca o modelo, troca o SDK, e o conteúdo continua onde estava. Não é motivo para evitar o gerenciado, mas é um custo que precisa entrar na conta desde o protótipo.

## O que fica

Começar gerenciado e migrar para RAG próprio quando as perguntas de segurança e escala aparecerem é um caminho legítimo. O erro é não saber que essa migração existe e descobrir na reunião com o jurídico.

No seu projeto de IA com documentos, alguém já perguntou quem pode ver o quê?
