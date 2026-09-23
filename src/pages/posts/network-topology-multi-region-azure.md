---
layout: ../../layouts/PostLayout.astro
title: "Topologia de rede multi-região no Azure: estratégias de conectividade e failover"
category: "Networking"
tag: "networking"
date: "24 Nov 2025"
readTime: "10 min"
description: "Quando um hub único não basta, como arquitetar redes Azure em múltiplas regiões com Virtual WAN, peering global e failover automático entre regiões."
---

Um hub Azure é suficiente para a maioria das organizações. Mas quando você tem workloads em múltiplas regiões por requisito de latência, compliance ou resiliência, a topologia precisa evoluir. E é aqui que os projetos ficam complexos mais rápido do que o necessário.

Antes de escolher a arquitetura, vale entender o que você realmente precisa resolver.

## O que impulsiona a necessidade de multi-região

**Latência:** usuários na Europa com latência alta acessando workloads no Brazil South. Solução: uma instância do workload na Europa, roteamento pelo Traffic Manager ou Front Door.

**Residência de dados:** regulação exige que dados de usuários europeus fiquem na Europa. Solução: storage e banco de dados separados por região, aplicação que sabe para qual instância enviar cada dado.

**Resiliência:** falha regional derruba toda a operação. Solução: instâncias ativas em regiões diferentes, failover automático.

Cada um desses problemas tem solução diferente. Tentar resolver os três com a mesma arquitetura gera over-engineering.

## Topologia 1: Hubs regionais independentes

Cada região tem hub completo com Firewall, Gateway e DNS Resolver. Hubs conectados via Global VNet Peering:

```
Hub Brazil South                    Hub East US
  Azure Firewall                      Azure Firewall
  ER/VPN Gateway                      ER/VPN Gateway
  DNS Resolver                        DNS Resolver
  Spoke App BR                        Spoke App US
  Spoke IA BR                         Spoke IA US
       |                                   |
       +---------- Global Peering ---------+
```

Vantagem: independência total, falha em uma região não afeta a outra. Desvantagem: custo duplicado, dois Firewalls, dois Gateways.

## Topologia 2: Virtual WAN com múltiplos hubs

Um plano de controle para toda a topologia:

```bash
az network vwan create --name vwan-global --resource-group rg-networking --type Standard

az network vhub create --name hub-brazilsouth --resource-group rg-networking   --vwan vwan-global --location brazilsouth --address-prefix 10.0.0.0/24

az network vhub create --name hub-eastus --resource-group rg-networking   --vwan vwan-global --location eastus --address-prefix 10.1.0.0/24
```

O Virtual WAN conecta os hubs automaticamente. Gerenciamento centralizado, mas com menos flexibilidade de customização e custo maior.

## Failover de workloads entre regiões

Para failover automático, Traffic Manager ou Front Door distribui o tráfego:

```
Usuario
  -> Traffic Manager (Priority routing)
       -> App Service Brazil South (prioridade 1)
       -> App Service East US (prioridade 2, ativado quando primario falha)
```

O desafio não é o failover de rede. É garantir que os dados estejam na região de destino:

```bash
# SQL Database com replica em outra regiao
az sql db replica create   --name banco-producao   --server sql-server-br   --resource-group rg-dados   --partner-server sql-server-us   --partner-region eastus
```

<div class="callout">
<strong>Par de regiões Azure:</strong> Brazil South é pareada com South Central US, não East US. Serviços com geo-replicação automática (Storage GRS, SQL geo-replication) usam o par definido pela Microsoft. Considere isso ao planejar DR.
</div>

A parte de rede de uma arquitetura multi-região é resolvida em horas. A parte de dados, sincronização e consistência é onde os projetos levam semanas. Planeje os dados primeiro, a rede vem depois.
