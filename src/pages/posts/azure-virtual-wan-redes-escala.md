---
layout: ../../layouts/PostLayout.astro
title: "Azure Virtual WAN: quando a topologia hub-and-spoke tradicional nao escala"
category: "Networking"
tag: "networking"
date: "26 Fev 2026"
readTime: "9 min"
description: "O que e o Virtual WAN e quando a topologia hub-and-spoke tradicional atinge seus limites."
---

A topologia hub-and-spoke tradicional -- uma VNet hub com Azure Firewall e VPN/ER Gateway, conectada a spokes via peering -- funciona bem ate certo ponto. Quando voce tem dezenas de spokes, multiplas regioes e conectividade complexa entre branches, o Virtual WAN resolve problemas que a topologia tradicional nao consegue.

## O que o Virtual WAN resolve

**Limite de spokes por hub:** VNets tem limites de peering. O Virtual WAN gerencia conexoes de forma diferente, sem esse bottleneck.

**Conectividade any-to-any automatica:** em hub-and-spoke tradicional, trafego entre dois spokes precisa passar pelo hub e voce gerencia as UDRs. No Virtual WAN, a conectividade entre spokes e entre branches e gerenciada automaticamente.

**Gerenciamento centralizado:** um plano de controle para multiplos hubs em multiplas regioes.

## Criando uma topologia Virtual WAN

```bash
# Criar o Virtual WAN
az network vwan create \
  --name vwan-global \
  --resource-group rg-networking \
  --type Standard

# Hub na regiao primaria
az network vhub create \
  --name hub-brazilsouth \
  --resource-group rg-networking \
  --vwan vwan-global \
  --location brazilsouth \
  --address-prefix 10.0.0.0/24

# Hub na regiao secundaria (DR)
az network vhub create \
  --name hub-eastus \
  --resource-group rg-networking \
  --vwan vwan-global \
  --location eastus \
  --address-prefix 10.1.0.0/24
```

Os hubs se conectam automaticamente via backbone Microsoft -- sem configurar peering entre eles.

## Secured Hub: Azure Firewall integrado

```bash
# Adicionar Azure Firewall ao hub (Secured Hub)
az network vhub create \
  --name hub-brazilsouth \
  --resource-group rg-networking \
  --vwan vwan-global \
  --location brazilsouth \
  --address-prefix 10.0.0.0/24 \
  --sku Standard

az network firewall create \
  --name fw-hub-br \
  --resource-group rg-networking \
  --location brazilsouth \
  --vhub hub-brazilsouth \
  --sku AZFW_Hub \
  --tier Premium
```

## Conectando VNets ao hub

```bash
az network vhub connection create \
  --name conn-spoke-ia \
  --resource-group rg-networking \
  --vhub-name hub-brazilsouth \
  --remote-vnet vnet-spoke-ia
```

Nao e necessario peering manual -- a conexao ao hub e gerenciada pelo Virtual WAN.

## Virtual WAN vs hub-and-spoke tradicional

| | Hub-and-Spoke Tradicional | Virtual WAN |
|---|---|---|
| Gerenciamento | Manual (UDRs, peerings) | Automatico |
| Limite de spokes | ~500 peerings | Maior |
| Multi-regiao | Configuracao complexa | Nativo |
| Branch connectivity | VPN Gateway separado | Integrado |
| Custo | Menor | Maior |
| Flexibilidade | Total | Menor |

## Quando hub-and-spoke tradicional ainda faz sentido

- Menos de 20 spokes e poucas branches
- Equipe com experiencia em UDRs e peerings
- Necessidade de customizacao granular de roteamento
- Orcamento limitado (Virtual WAN e mais caro)

## Quando migrar para Virtual WAN

- Mais de 20-30 spokes crescendo rapidamente
- Multiplos hubs em regioes diferentes
- Muitas branches SD-WAN para conectar
- Equipe pequena que precisa de automacao de roteamento

<div class="callout">
<strong>Migracao de hub-and-spoke para Virtual WAN:</strong> Nao e uma migracao simples. O Virtual WAN usa sua propria logica de roteamento e os recursos existentes (VPN Gateways, Firewalls) precisam ser recriados dentro do hub VWAN. Planeje com tempo e teste em ambiente nao-producao.
</div>

## Conclusao

O Virtual WAN e a evolucao natural da topologia hub-and-spoke para empresas em crescimento. Para ambientes que comecam pequenos, hub-and-spoke tradicional e mais simples e economico. O ponto de inflexao -- onde o overhead de gerenciar peerings, UDRs e conectividade entre regioes supera o custo adicional do Virtual WAN -- varia por organizacao, mas geralmente ocorre entre 20-40 spokes.
