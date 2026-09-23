---
layout: ../../layouts/PostLayout.astro
title: "Landing Zones no Azure: estruturando ambientes com governança"
category: "Segurança"
tag: "seguranca"
date: "11 Dez 2025"
readTime: "6 min"
description: "Vinte subscriptions, cada uma criada por um time diferente, nenhuma com a mesma regra. Landing Zone é o que evita chegar nesse ponto, e o que dá para fazer quando você já chegou."
---

A empresa tinha vinte e poucas subscriptions no Azure. Cada uma tinha sido criada por um time diferente, em um momento diferente, com a pressa de quem precisava entregar alguma coisa naquela semana.

Algumas tinham diagnóstico ligado, outras não. Uma tinha recursos em três regiões, inclusive uma que ninguém sabia explicar. Duas tinham VNets com o mesmo range de IP, o que só apareceu quando alguém tentou conectar as duas.

Ninguém fez nada errado de propósito. O problema é que não existia um lugar pronto para os workloads chegarem. Cada time construiu o seu, e o resultado foi um ambiente que ninguém conseguia governar como um todo.

É exatamente esse lugar pronto que uma Landing Zone resolve.

## O que é, sem jargão

Landing Zone é o ambiente base configurado antes do primeiro workload: hierarquia de management groups, políticas, rede, identidade e monitoramento. Quando um time novo precisa de espaço no Azure, ele não começa do zero. Recebe uma subscription que já nasce dentro das regras.

A Microsoft documenta isso no Cloud Adoption Framework (CAF) como uma arquitetura de referência. Vale separar duas ideias que costumam aparecer misturadas:

**Platform landing zone.** A fundação compartilhada. Identidade, conectividade (hub de rede, DNS, firewall) e gerenciamento (Log Analytics, automação). Fica com o time de plataforma.

**Application landing zone.** O espaço de cada workload. Subscriptions onde os times de aplicação trabalham com autonomia, mas herdando as políticas e a conectividade da plataforma.

Essa divisão é o ponto central. A plataforma decide o que é inegociável. Os times decidem o resto.

## A hierarquia de management groups

A estrutura de referência do CAF tem mais ou menos esta cara:

```
Tenant Root Group
└── Empresa
    ├── Platform
    │   ├── Identity
    │   ├── Management
    │   └── Connectivity
    ├── Landing Zones
    │   ├── Corp      (workloads internos, sem exposição pública)
    │   └── Online    (workloads expostos à internet)
    ├── Sandbox
    └── Decommissioned
```

O detalhe que mais importa: a hierarquia é organizada por **tipo de governança**, não pelo organograma. Corp e Online existem porque as regras são diferentes (um bloqueia IP público, o outro permite com controles), não porque existem dois departamentos.

Criar essa estrutura é simples:

```bash
az account management-group create --name empresa --display-name "Empresa"
az account management-group create --name empresa-platform --display-name "Platform" --parent empresa
az account management-group create --name empresa-landingzones --display-name "Landing Zones" --parent empresa
az account management-group create --name empresa-corp --display-name "Corp" --parent empresa-landingzones

# mover uma subscription existente para dentro da hierarquia
az account management-group subscription add --name empresa-corp --subscription <sub-id>
```

## Onde a governança de verdade acontece: políticas

A hierarquia sozinha não governa nada. Quem governa é o Azure Policy atribuído em cada nível, e herdado por tudo que está abaixo.

Um exemplo que resolveria o problema da região que ninguém sabia explicar:

```bash
az policy assignment create \
  --name allowed-locations \
  --scope /providers/Microsoft.Management/managementGroups/empresa \
  --policy e56962a6-4747-49cd-b67b-bf8b01975c4c \
  --params '{"listOfAllowedLocations":{"value":["brazilsouth","eastus2"]}}'
```

Atribuída no management group raiz, a regra vale para todas as subscriptions, inclusive as que ainda nem foram criadas.

As políticas que costumo ver como base em qualquer Landing Zone: regiões permitidas, envio obrigatório de logs de diagnóstico para o workspace central, Defender for Cloud habilitado, tags obrigatórias de centro de custo e dono, e bloqueio de IP público nas landing zones Corp.

## O Accelerator e o que ele não resolve

A Microsoft mantém implementações de referência da Landing Zone, tanto pelo portal quanto em código (Bicep e Terraform). Elas criam a hierarquia, atribuem dezenas de políticas e montam a plataforma de rede em horas.

Vale usar. Mas com uma consciência: o Accelerator entrega a estrutura, não as decisões. Quais regiões permitir, qual range de IP reservar para cada spoke, quais políticas começam bloqueando e quais só auditam. Tudo isso continua sendo seu. Rodar o Accelerator sem essas respostas é só criar a bagunça de forma mais organizada.

## Três erros que eu vejo com frequência

**Espelhar o organograma.** Um management group por diretoria parece intuitivo e envelhece mal. Na primeira reestruturação da empresa, a hierarquia inteira precisa ser refeita, e as políticas vão junto.

**Ligar tudo em modo Deny no primeiro dia.** Em ambiente que já tem workloads, políticas bloqueando de cara quebram deploys que funcionavam ontem. O caminho mais seguro é começar em Audit, olhar o relatório de conformidade, corrigir o que existe e só então mudar para Deny.

**Planejar a rede depois.** Range de IP é a decisão mais difícil de desfazer. Se cada spoke não tem uma faixa reservada desde o início, o conflito de endereços aparece exatamente quando você mais precisa conectar dois ambientes.

## E se o ambiente já existe?

Quase ninguém começa uma Landing Zone do zero. O cenário comum é o do começo deste artigo: subscriptions já em produção e nenhuma estrutura em volta.

Dá para chegar lá de forma incremental. Primeiro a hierarquia, movendo as subscriptions existentes para os management groups certos. Depois as políticas em Audit, para enxergar o tamanho do problema. Depois as correções, workload por workload. A rede costuma ser a última peça, porque mexer em VNet em produção exige janela.

## O que fica

Uma Landing Zone não acelera o primeiro projeto. Ela acelera o décimo. O investimento de algumas semanas no começo é o que evita meses de refatoração quando o Azure deixa de ser o piloto de um time e vira o ambiente da empresa inteira.

Se hoje um time novo pedisse uma subscription, ela nasceria dentro das regras ou cada time continuaria construindo a sua?
