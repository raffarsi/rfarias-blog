---
layout: ../../layouts/PostLayout.astro
title: "Topologia de rede multi-região no Azure: estratégias de conectividade e failover"
category: "Networking"
tag: "networking"
date: "24 Nov 2025"
readTime: "10 min"
description: "Quando um hub único não basta — como arquitetar redes Azure em múltiplas regiões com Virtual WAN, peering global e failover automático entre regiões."
---

Um único hub Azure funciona bem para a maioria das organizações. Mas conforme a operação cresce — workloads em múltiplas regiões, requisitos de latência por região, compliance de dados em países específicos — a topologia de hub único atinge seus limites.

## Quando hub único não escala

Os sinais de que você precisa de múltiplas regiões:

- **Latência:** usuários na Europa experimentam latência alta acessando workloads no Brazil South
- **Residência de dados:** regulação exige que dados de usuários europeus fiquem na Europa
- **Resiliência:** falha regional derruba toda a operação
- **Capacidade:** Azure Firewall ou VPN Gateway de uma região não suporta o throughput total

## Topologia 1: Hubs regionais independentes

Cada região tem seu próprio hub completo (Firewall, Gateway, DNS Resolver). Os hubs se conectam entre si via Global VNet Peering:

```
Hub Brazil South                    Hub East US
├── Azure Firewall                  ├── Azure Firewall
├── ER/VPN Gateway                  ├── ER/VPN Gateway
├── DNS Resolver                    ├── DNS Resolver
│                                   │
├── Spoke App BR                    ├── Spoke App US
└── Spoke IA BR                     └── Spoke IA US
         │                                    │
         └──────── Global Peering ────────────┘
                   (hub-to-hub)
```

**Vantagem:** independência total — falha em uma região não afeta outra.
**Desvantagem:** duplicação de custo (dois Firewalls, dois Gateways).

## Topologia 2: Virtual WAN com múltiplos hubs

O Virtual WAN gerencia múltiplos hubs de forma centralizada — um único plano de controle para toda a topologia:

```bash
# Criar VWAN global
az network vwan create \
  --name vwan-global \
  --resource-group rg-networking \
  --type Standard

# Hub na região primária
az network vhub create \
  --name hub-brazilsouth \
  --resource-group rg-networking \
  --vwan vwan-global \
  --location brazilsouth \
  --address-prefix 10.0.0.0/24

# Hub na região secundária
az network vhub create \
  --name hub-eastus \
  --resource-group rg-networking \
  --vwan vwan-global \
  --location eastus \
  --address-prefix 10.1.0.0/24
```

O Virtual WAN conecta os hubs automaticamente via backbone Microsoft — sem precisar configurar peering entre hubs manualmente.

## Failover de workloads entre regiões

Para workloads que precisam failover automático, combine topologia multi-região com Traffic Manager ou Azure Front Door:

```
Usuário
  ↓ DNS query
Traffic Manager (prioridade)
  ├── App Service Brazil South (prioridade 1 — primário)
  └── App Service East US (prioridade 2 — DR)
         │
         ambos acessam Azure OpenAI
         via Private Endpoint na sua região
```

**Importante:** Azure OpenAI tem disponibilidade limitada de modelos por região. Verifique se o modelo necessário (GPT-4o, por exemplo) está disponível na região de DR antes de planejar o failover.

## Sincronização de dados entre regiões

O failover de rede é a parte simples. A parte complexa é garantir que os dados estejam na região de destino:

```bash
# Geo-replication do Azure AI Search
az search service create \
  --name search-prod \
  --resource-group rg-ia \
  --sku Standard \
  --replica-count 2 \
  --partition-count 1 \
  # Para geo-redundância, crie um serviço separado na região de DR
  # e sincronize o índice via indexer ou reindexação

# Storage com geo-redundância
az storage account create \
  --name storageprod \
  --sku Standard_GRS  # Geo-redundant storage — replica para região par
```

<div class="callout">
<strong>Par de regiões Azure:</strong> Brazil South é pareada com South Central US (não East US). Serviços com geo-replicação automática (Storage GRS, SQL geo-replication) usam o par de região definido pela Microsoft. Considere isso ao planejar a topologia de DR.
</div>

## Conclusão

Multi-região no Azure não é simplesmente duplicar a infraestrutura. A escolha entre hubs regionais independentes e Virtual WAN depende do volume de hubs e da necessidade de gerenciamento centralizado. O ponto mais crítico — e mais frequentemente negligenciado — é garantir que os dados estejam na região de destino antes do failover ocorrer.
