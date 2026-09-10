---
layout: ../../layouts/PostLayout.astro
title: "Topologia de rede multi-região no Azure: estratégias de conectividade e failover"
category: "Networking"
tag: "networking"
date: "24 Nov 2025"
readTime: "10 min"
description: "Quando um hub único não basta, como arquitetar redes Azure em múltiplas regiões com Virtual WAN, peering global e failover automático entre regiões."
---

Um hub Azure e suficiente para a maioria das organizacoes. Mas quando voce tem workloads em multiplas regioes por requisito de latencia, compliance ou resiliencia, a topologia precisa evoluir. E e aqui que os projetos ficam complexos mais rapido do que o necessario.

Antes de escolher a arquitetura, vale entender o que voce realmente precisa resolver.

## O que impulsiona a necessidade de multi-regiao

**Latencia:** usuarios na Europa com latencia alta acessando workloads no Brazil South. Solucao: uma instancia do workload na Europa, roteamento pelo Traffic Manager ou Front Door.

**Residencia de dados:** regulacao exige que dados de usuarios europeus fiquem na Europa. Solucao: storage e banco de dados separados por regiao, aplicacao que sabe para qual instancia enviar cada dado.

**Resiliencia:** falha regional derruba toda a operacao. Solucao: instancias ativas em regioes diferentes, failover automatico.

Cada um desses problemas tem solucao diferente. Tentar resolver os tres com a mesma arquitetura gera over-engineering.

## Topologia 1: Hubs regionais independentes

Cada regiao tem hub completo com Firewall, Gateway e DNS Resolver. Hubs conectados via Global VNet Peering:

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

Vantagem: independencia total, falha em uma regiao nao afeta a outra. Desvantagem: custo duplicado, dois Firewalls, dois Gateways.

## Topologia 2: Virtual WAN com multiplos hubs

Um plano de controle para toda a topologia:

```bash
az network vwan create --name vwan-global --resource-group rg-networking --type Standard

az network vhub create --name hub-brazilsouth --resource-group rg-networking   --vwan vwan-global --location brazilsouth --address-prefix 10.0.0.0/24

az network vhub create --name hub-eastus --resource-group rg-networking   --vwan vwan-global --location eastus --address-prefix 10.1.0.0/24
```

O Virtual WAN conecta os hubs automaticamente. Gerenciamento centralizado, mas com menos flexibilidade de customizacao e custo maior.

## Failover de workloads entre regioes

Para failover automatico, Traffic Manager ou Front Door distribui o trafego:

```
Usuario
  -> Traffic Manager (Priority routing)
       -> App Service Brazil South (prioridade 1)
       -> App Service East US (prioridade 2, ativado quando primario falha)
```

O desafio nao e o failover de rede. E garantir que os dados estejam na regiao de destino:

```bash
# SQL Database com replica em outra regiao
az sql db replica create   --name banco-producao   --server sql-server-br   --resource-group rg-dados   --partner-server sql-server-us   --partner-region eastus
```

<div class="callout">
<strong>Par de regioes Azure:</strong> Brazil South e pareada com South Central US, nao East US. Servicos com geo-replicacao automatica (Storage GRS, SQL geo-replication) usam o par definido pela Microsoft. Considere isso ao planejar DR.
</div>

A parte de rede de uma arquitetura multi-regiao e resolvida em horas. A parte de dados, sincronizacao e consistencia e onde os projetos levam semanas. Planeje os dados primeiro, a rede vem depois.
