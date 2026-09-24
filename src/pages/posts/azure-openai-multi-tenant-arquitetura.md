---
layout: ../../layouts/PostLayout.astro
title: "Arquitetura multi-tenant com Azure OpenAI: isolamento e governança"
category: "IA Generativa"
tag: "ia-generativa"
date: "06 Jan 2026"
readTime: "6 min"
description: "RH, Jurídico e Financeiro no mesmo recurso funciona até o dia em que um departamento consome a cota de todos, ou em que alguém pergunta se os documentos de um podem aparecer para o outro. Os níveis de isolamento, o critério para escolher cada um e o que colocar entre os tenants e o modelo."
---

Um time me procurou com dois problemas que apareceram na mesma semana. O primeiro: um processo em lote do Financeiro consumiu a cota inteira do deployment e o assistente do RH passou a devolver erro 429 durante a tarde. O segundo: a auditoria perguntou se um documento do Jurídico poderia, em alguma circunstância, aparecer numa resposta para alguém do RH.

A plataforma era uma só, com um recurso, um deployment e um índice de busca. Tinha nascido para um departamento e foi recebendo os outros. Nenhum dos dois problemas era de modelo. Eram de isolamento, e isolamento é uma decisão que precisa ser tomada antes, não descoberta depois.

## Os níveis de isolamento

A Microsoft descreve os modelos possíveis no guia de arquitetura para multitenancy com Azure OpenAI. Três deles cobrem a maioria dos casos, do mais compartilhado ao mais isolado. O quarto, em que o próprio cliente fornece o recurso na assinatura dele, é a resposta natural para clientes externos com exigências fortes de conformidade.

**Deployment compartilhado.** Um recurso, um deployment, e a separação por tenant acontece só na aplicação. É o mais simples de implantar e o mais difícil de operar: a cota é uma só, e um tenant barulhento afeta todos os outros. Serve para tenants que são a mesma empresa, com volumes parecidos e sem exigência de separação.

**Deployment por tenant.** Um recurso compartilhado, mas cada tenant com o seu deployment e a sua cota. Resolve o vizinho barulhento e deixa o consumo de cada um visível. A rede, as chaves de criptografia e o recurso continuam compartilhados. E um detalhe que a documentação destaca: o recurso compartilhado não segmenta a segurança por deployment. Nada impede um tenant de chamar o deployment de outro, a menos que algo na frente garanta esse mapeamento.

**Recurso por tenant.** Cada tenant com o seu próprio recurso, com rede, identidade, chave de criptografia e cobrança separadas. É o isolamento mais forte e o de maior custo operacional. É o caminho quando os tenants são clientes externos ou quando há exigência contratual ou regulatória de separação.

O critério que eu uso cabe em três perguntas. Os tenants são da mesma empresa? Um tenant pode prejudicar o outro por volume? Alguém exige, por contrato ou regulação, que os dados e a cobrança fiquem separados? Um "sim" na última leva direto ao recurso por tenant.

Uma regra da documentação que vale guardar: não compartilhe um recurso Azure OpenAI quando houver modelos com fine-tuning, para não expor dados específicos de um tenant a outro.

## O que colocar entre os tenants e o modelo

Mesmo com deployment por tenant, falta um lugar para aplicar a política de uso de cada um e medir o consumo. Espalhar isso pelo código de cada aplicação não escala. O padrão que eu recomendo é um gateway, e no Azure o guia de arquitetura aponta o API Management como a escolha preferida para esse papel.

Com uma assinatura (subscription) do API Management por tenant, que também garante qual deployment cada tenant pode chamar, duas políticas resolvem os dois problemas da abertura. A primeira limita o consumo de cada tenant. A segunda registra os tokens por tenant, para rateio de custo:

```xml
<inbound>
    <base />
    <!-- Cada tenant tem a sua assinatura no APIM: o limite vale por tenant -->
    <llm-token-limit
        counter-key="@(context.Subscription.Id)"
        tokens-per-minute="20000"
        token-quota="5000000"
        token-quota-period="Monthly"
        estimate-prompt-tokens="true" />
    <!-- Tokens por tenant, como métrica no Application Insights -->
    <llm-emit-token-metric namespace="ia-por-tenant">
        <dimension name="Subscription ID" />
        <dimension name="Tenant" value="@(context.Subscription.Name)" />
    </llm-emit-token-metric>
</inbound>
```

Com isso, o lote do Financeiro bate no teto por minuto dele, recebe 429, e o RH continua respondendo. Se a cota do mês acabar, a resposta passa a ser 403. Dois pré-requisitos: os contadores são mantidos por gateway, então não somam entre gateways regionais; e a métrica só aparece com o API Management integrado ao Application Insights e as métricas customizadas com dimensões habilitadas. E o custo de cada departamento sai de uma métrica, não de uma planilha montada no fim do mês.

O identificador do tenant vem da assinatura do gateway ou de uma claim validada do token de login. Nunca de um cabeçalho que a própria aplicação cliente preenche, porque aí qualquer cliente pode se passar por outro.

## Isolamento dos dados de contexto

A segunda pergunta da abertura, a da auditoria, não se resolve no modelo. Ela se resolve na busca. Num RAG multi-tenant, o risco não é o modelo "vazar" um documento: é a busca entregar ao modelo um trecho de outro tenant.

Os mesmos três níveis aparecem aqui:

**Índice compartilhado com filtro por tenant.** Cada documento carrega o identificador do tenant, e toda busca filtra por ele. É o mais barato, e a documentação da Microsoft o apresenta como variação de granularidade mais fina. Dois riscos: um operacional, porque uma busca feita sem o filtro expõe tudo, e um de qualidade, porque a relevância é calculada sobre o índice inteiro, então os documentos de todos os tenants influenciam o ranking de cada um.

**Índice por tenant.** Um índice para cada um, no mesmo serviço de busca. Um erro de filtro deixa de ser um vazamento entre tenants.

**Serviço de busca por tenant.** Isolamento de rede, de chave e de capacidade. É o par natural do recurso de IA por tenant.

Para departamentos da mesma empresa, o filtro costuma bastar, desde que ele seja aplicado num único lugar do código, com o tenant vindo da identidade do usuário. Para clientes externos, eu não aceitaria menos que índice por tenant.

## Logs e auditoria

O isolamento também vale para quem enxerga o uso. Os logs de um tenant não devem ficar acessíveis a administradores de outro. Com recurso por tenant, isso vem quase de graça, com workspaces separados. Com recurso compartilhado, o caminho é registrar o tenant em cada evento e controlar o acesso às consultas por RBAC.

E vale o cuidado de sempre: registrar tamanho, tokens, tenant e latência, não o conteúdo das perguntas.

## Três erros que eu vejo com frequência

**Começar compartilhado sem prever a saída.** Começar com deployment compartilhado é razoável. O erro é não separar o tenant no código desde o primeiro dia. Quando chega o cliente que exige isolamento, a migração vira refatoração.

**Tenant vindo do cliente.** O identificador do tenant chega num cabeçalho preenchido pela própria aplicação que chama a API, sem validação. É o equivalente multi-tenant de confiar no parâmetro que o modelo preencheu.

**Cota única para todo mundo.** Sem limite por tenant, o primeiro processo em lote mal dimensionado vira incidente para todos os outros.

## O que fica

Multi-tenant com Azure OpenAI é uma escolha de nível de isolamento, feita com base em quem são os tenants e no que eles exigem. O modelo é o mesmo em todos os níveis. O que muda é onde ficam as fronteiras: no código, no gateway, no índice ou no recurso.

Na sua plataforma, se um tenant consumisse o dobro amanhã, quem mais ficaria sem resposta?
