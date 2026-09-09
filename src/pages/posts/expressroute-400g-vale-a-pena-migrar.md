---
layout: ../../layouts/PostLayout.astro
title: "ExpressRoute 400G: vale a pena migrar? Cenários onde o upgrade compensa"
category: "Azure"
tag: "azure"
serie: "Série Azure Networking + IA Generativa"
serieNum: 1
serieSlug: "serie-azure-networking-ia"
date: "8 Set 2026"
readTime: "9 min"
description: "A Microsoft agora oferece portas ExpressRoute Direct de 400 Gbps. Mas a pergunta certa não é 'dá pra ter' — é 'eu preciso disso ou só quero o número maior'."
next:
  title: "Azure Networking [4] — Latência de rede em pipelines RAG"
  slug: "latencia-rede-pipelines-rag-azure"

---

A Microsoft passou a oferecer portas ExpressRoute Direct de 400 Gbps em locais selecionados. A notícia circulou, os slides apareceram nas apresentações e inevitavelmente alguém no seu comitê de arquitetura vai perguntar: *"precisamos migrar para 400G?"*

A resposta honesta: **depende — e na maioria dos casos, não.**

Este artigo mostra quando o upgrade genuinamente compensa e quando é puro over-engineering disfarçado de inovação.

## O que mudou de fato

O ExpressRoute Direct sempre foi a opção para quem precisava de conectividade dedicada de alta capacidade — você aluga fisicamente uma porta no local de peering, sem compartilhar com outros clientes do provedor. Antes, as portas disponíveis eram de 10 Gbps e 100 Gbps.

Com a adição de portas de **400 Gbps**, o cenário muda para um público bem específico: organizações que já usam ExpressRoute Direct com portas de 100G e estão chegando no limite de saturação agregada.

Se você ainda usa ExpressRoute via provedor (o modelo mais comum, onde o provedor é o intermediário), esse anúncio não muda nada para você no curto prazo.

## Quando 400G genuinamente faz sentido

Existem três cenários onde o upgrade se justifica tecnicamente:

**Migração massiva de dados para Azure em janela de tempo definida.** Quando você está movendo um datacenter completo ou volumes de storage na casa dos exabytes e tem um prazo. Nesse cenário, throughput é o gargalo real — cada Gbps a mais encurta a janela de migração.

**Cargas de HPC e treinamento de modelos de IA em escala.** Clusters de GPU trocando grandes volumes de dados entre on-premises e Azure de forma contínua. Estamos falando de treinamento distribuído de modelos grandes, onde os nós precisam sincronizar gradientes e mover checkpoints de dezenas de gigabytes frequentemente.

**Consolidação de múltiplos circuitos 100G.** Se você tem 3 ou 4 circuitos de 100G para atender a demanda, um único circuito de 400G pode reduzir complexidade operacional e custo de portas físicas — dependendo do modelo de precificação do seu provedor de colocation.

## Quando 400G é over-engineering

Aqui está o ponto que raramente aparece nas apresentações de vendas:

**A maioria das arquiteturas corporativas de aplicação não precisa de 400G** — incluindo pipelines de IA generativa como os que discuto nesta série.

Um pipeline RAG (Retrieval-Augmented Generation) típico não move terabytes por segundo entre on-premises e Azure. Ele move requisições HTTP relativamente pequenas: uma query de busca vetorial, um contexto de alguns kilobytes, uma resposta do modelo. O gargalo nesses sistemas raramente é a largura de banda da conexão WAN.

Se o circuito atual de 1G, 10G ou mesmo 100G não está saturado — e você pode verificar isso com métricas reais no Network Watcher e Connection Monitor — o upgrade para 400G não vai resolver nenhum problema real. Vai apenas aumentar a fatura mensal.

<div class="callout">
<strong>Regra prática:</strong> Antes de qualquer conversa sobre upgrade de capacidade, colete métricas de utilização real do circuito atual por pelo menos 30 dias, incluindo os picos — não só as médias. A média pode estar em 15% enquanto os picos chegam a 90%. Ou os picos podem chegar a 20%. São decisões completamente diferentes.
</div>

## Como decidir com dados, não com intuição

O processo que uso para avaliar upgrades de circuito:

**1. Meça o circuito atual com granularidade adequada.** No Azure Monitor, configure métricas de BitsInPerSecond e BitsOutPerSecond no seu circuito ExpressRoute com agregação de 1 minuto (não 5 minutos — você perde os picos). Colete por 30 dias mínimo, cobrindo ciclos de negócio completos.

```bash
# Verificar utilização do circuito via CLI
az monitor metrics list \
  --resource /subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.Network/expressRouteCircuits/{circuit-name} \
  --metric BitsInPerSecond BitsOutPerSecond \
  --interval PT1M \
  --start-time 2026-08-10T00:00:00Z \
  --end-time 2026-09-09T00:00:00Z \
  --aggregation Maximum Average \
  --output table
```

**2. Identifique o gargalo real.** Throughput saturado é diferente de latência alta. Um circuito com throughput em 40% mas com latência inconsistente tem um problema diferente — e aumentar a banda não vai resolver.

- Throughput saturado = gráfico de utilização batendo no teto do circuito de forma sustentada (não só em picos de 5 minutos)
- Problema de latência = throughput ok, mas aplicações reclamam de lentidão. Investigar roteamento, peering location, configuração de BGP

**3. Projete crescimento real.** Se o throughput atual é de 60% e você está crescendo 20% ao ano, você tem menos de 3 anos antes de saturar. Esse é o momento de planejar o upgrade — não quando já está saturado.

## O ângulo pouco discutido: 400G e workloads de IA

Onde o 400G genuinamente entra em cena para IA é em cenários de **treinamento distribuído de modelos** ou **movimentação de datasets de treinamento**:

- Você tem um cluster de GPUs on-premises e quer usar Azure NDv5 para ampliar a capacidade de treinamento
- Você precisa mover datasets de treinamento de dezenas de TB regularmente entre sua infraestrutura e o Azure
- Sua organização está construindo modelos proprietários (não apenas consumindo modelos gerenciados) e o ciclo de treino envolve grandes transferências de dados

Se sua organização está **apenas consumindo** modelos gerenciados (Azure OpenAI, Model Catalog) e fazendo RAG sobre documentos internos, o throughput do ExpressRoute quase certamente não é o seu gargalo. O investimento em 400G rende menos do que melhorar a arquitetura do pipeline, otimizar os embeddings ou reduzir a latência do banco vetorial.

## Conclusão

O ExpressRoute 400G é uma ferramenta poderosa para um problema específico: **throughput agregado saturado em cenários de escala que realmente demandam essa capacidade**.

Antes de considerar o upgrade, meça o circuito atual. Na maioria dos casos de IA generativa corporativa, o dinheiro rende mais investido em otimização de arquitetura do que em largura de banda que não vai ser utilizada.

A pergunta certa nunca é "dá pra ter 400G?" — sempre é "eu tenho um problema que 400G resolve?"

---

*Este artigo faz parte da série **Azure Networking + IA Generativa**, onde exploro as decisões de rede que impactam arquiteturas de IA em produção — com base em casos reais do ambiente corporativo.*
