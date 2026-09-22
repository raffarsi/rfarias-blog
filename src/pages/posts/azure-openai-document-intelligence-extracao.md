---
layout: ../../layouts/PostLayout.astro
title: "Azure Document Intelligence: extração de dados de documentos não estruturados"
category: "IA Generativa"
tag: "ia-generativa"
date: "17 Fev 2026"
readTime: "9 min"
description: "A planilha que alguém preenche olhando PDF é um processo esperando para ser automatizado. O que muda quando a extração devolve confiança por campo."
---

Em quase toda área que lida com documento existe uma planilha mantida à mão. Alguém abre o PDF, lê, digita em outro sistema e passa adiante. Nota fiscal, contrato, laudo, formulário assinado, comprovante.

É o tipo de trabalho que todo mundo concorda que deveria ser automático, e que resiste há anos porque as tentativas anteriores erraram de um jeito que custou mais caro que o trabalho manual.

## Por que as tentativas anteriores falharam

A primeira geração era OCR puro. Ele devolvia o texto da página como uma sequência, e aí alguém escrevia regras de posição para achar o campo. Funcionava até o fornecedor mudar o layout do documento, o que acontecia toda hora.

A tentativa mais recente é jogar o PDF no modelo de linguagem e pedir o JSON. Funciona surpreendentemente bem na demonstração e falha do pior jeito possível em produção: silenciosamente. O modelo devolve o campo preenchido com valor plausível quando não conseguiu ler direito, e não existe sinal nenhum de que aquele campo é menos confiável que os outros.

Em processo que vira lançamento contábil ou pagamento, esse silêncio é o problema inteiro.

## O que o Document Intelligence acrescenta

A diferença está em duas coisas: estrutura e confiança.

Estrutura porque ele não devolve texto corrido, devolve o documento entendido. Quais são as tabelas, quais são as células de cada uma, qual rótulo pertence a qual valor, onde termina um parágrafo e começa o seguinte, o que é cabeçalho e o que é rodapé. Isso é o que sobrevive a variação de layout.

Confiança porque cada campo extraído vem com um nível de certeza. Esse número é o que permite montar um processo honesto: acima de um corte, segue direto; abaixo, vai para conferência humana.

É essa segunda parte que muda a conversa com quem é dono do processo. Você não está propondo trocar uma pessoa conferindo tudo por uma máquina que erra escondido. Está propondo que a pessoa confira só o que o sistema marcou como duvidoso.

## Os três caminhos, em ordem de esforço

**Modelos prontos.** Para tipos de documento comuns, como nota fiscal, recibo, documento de identidade e cartão, já existe modelo treinado. Você chama e recebe os campos nomeados. Quando o seu caso cai aqui, não construa nada.

**Modelo de layout.** Para documento que não se encaixa em nenhum tipo pronto, ele devolve a estrutura sem nomear os campos de negócio. É o caminho mais subestimado, porque combina muito bem com o modelo de linguagem: a extração garante a estrutura e o modelo interpreta em cima dela.

**Modelo customizado.** Você rotula alguns documentos do seu layout e treina. Vale quando o formato é estável e o volume justifica. Não vale quando cada fornecedor manda de um jeito.

## A combinação que eu usaria na maioria dos casos

Extração primeiro, modelo depois.

O Document Intelligence devolve a estrutura com a relação entre rótulo e valor preservada. O modelo de linguagem recebe esse texto já organizado e faz o que ele faz bem: normalizar formato de data, interpretar uma cláusula, classificar o documento, decidir para qual fila aquilo vai.

Quem faz o inverso perde a parte determinística e fica com a parte que erra em silêncio.

## O desenho do processo importa mais que a tecnologia

A parte que decide se o projeto entrega valor não é a chamada de API. É o que acontece com o resultado.

Defina o corte de confiança olhando o custo do erro, não o número que parece bonito. Campo que vira valor a pagar merece corte alto e revisão humana generosa. Campo que vira metadado de busca aguenta corte baixo.

Guarde o documento original junto com o extraído. Quando alguém questionar um lançamento daqui a seis meses, a pergunta vai ser o que estava escrito no papel, e ninguém vai aceitar o JSON como resposta.

E meça a taxa de revisão humana ao longo do tempo. Ela é o indicador real do projeto: se não cair, ou o corte está conservador demais ou o tipo de documento não é adequado para automação.

## Onde isso não se aplica

Documento manuscrito continua difícil, e cursivo continua muito difícil. Documento com qualidade ruim de digitalização, torto ou com sombra, degrada rápido. E documento que exige interpretação jurídica não é caso de extração, é caso de leitura por quem responde pela interpretação.

Se o seu processo manual de hoje sumisse amanhã, quantos dos campos que alguém digita você aceitaria receber sem nenhuma conferência? Esse número é o tamanho real do ganho, e ele costuma ser maior do que as pessoas admitem na primeira conversa.
