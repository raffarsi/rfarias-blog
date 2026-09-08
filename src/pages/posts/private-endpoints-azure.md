---
layout: ../../layouts/PostLayout.astro
title: "Como configurar Private Endpoints no Azure sem perder o acesso ao portal"
category: "Azure"
tag: "azure"
date: "27 Ago 2026"
readTime: "8 min"
description: "Passo a passo para configurar Private Endpoints no Azure com as armadilhas de DNS que a documentação não destaca."
prev:
  title: "NSG vs ASG: quando usar cada um"
  slug: "nsg-vs-asg"
next:
  title: "Azure AI Foundry: primeiro projeto"
  slug: "azure-ai-foundry"
---

Se você trabalha com Azure em ambiente corporativo, em algum momento vai precisar de Private Endpoints. Eles são a peça-chave para garantir que o tráfego entre seus recursos e suas aplicações não passe pela internet pública. Mas a configuração tem armadilhas que a documentação oficial não destaca como deveria.

Neste artigo, explico o conceito, o passo a passo e os erros mais comuns — especialmente o que envolve resolução de DNS.

## O que é um Private Endpoint

Um Private Endpoint é uma interface de rede (NIC) que o Azure cria dentro da sua Virtual Network, atribuindo um IP privado que aponta diretamente para um serviço PaaS — como SQL Database, Storage Account, Key Vault ou Cosmos DB.

Sem Private Endpoint, quando sua aplicação acessa um Azure SQL Database, o tráfego sai pela internet pública (mesmo que o firewall do SQL esteja restrito ao IP da sua VNet). Com Private Endpoint, o tráfego fica inteiramente dentro da sua rede privada.

Na prática, é a diferença entre "restringir quem pode acessar" e "garantir que o caminho é privado".

## Passo a passo da configuração

O processo envolve três etapas: criar o Private Endpoint, configurar a Private DNS Zone e validar a resolução.

**Etapa 1 — Criar o Private Endpoint:**

```bash
az network private-endpoint create \
  --name pe-sqlserver-prod \
  --resource-group rg-networking \
  --vnet-name vnet-producao \
  --subnet snet-privateendpoints \
  --private-connection-resource-id /subscriptions/{sub-id}/resourceGroups/rg-data/providers/Microsoft.Sql/servers/sql-producao \
  --group-id sqlServer \
  --connection-name pec-sqlserver-prod
```

O parâmetro `--group-id` define qual sub-recurso você está expondo. Para SQL Database é `sqlServer`, para Storage Blob é `blob`, para Key Vault é `vault`.

**Etapa 2 — Criar a Private DNS Zone:**

Esta é a etapa que a maioria das pessoas esquece — e onde as coisas quebram.

```bash
az network private-dns zone create \
  --resource-group rg-networking \
  --name privatelink.database.windows.net

az network private-dns link vnet create \
  --resource-group rg-networking \
  --zone-name privatelink.database.windows.net \
  --name link-vnet-producao \
  --virtual-network vnet-producao \
  --registration-enabled false

az network private-endpoint dns-zone-group create \
  --resource-group rg-networking \
  --endpoint-name pe-sqlserver-prod \
  --name default \
  --private-dns-zone privatelink.database.windows.net \
  --zone-name privatelink.database.windows.net
```

Cada tipo de serviço tem um nome de zona DNS diferente. Para SQL é `privatelink.database.windows.net`, para Blob Storage é `privatelink.blob.core.windows.net`, para Key Vault é `privatelink.vaultcore.azure.net`. Usar o nome errado é um erro silencioso — tudo parece funcionar, mas o tráfego continua público.

## A armadilha do DNS

<div class="callout">
<strong>Armadilha:</strong> Depois de criar o Private Endpoint, o FQDN público do recurso continua resolvendo para o IP público. Se você não configurar a Private DNS Zone corretamente, sua aplicação acessa o SQL pelo IP público mesmo tendo um Private Endpoint criado.
</div>

O comportamento correto após a configuração:

```bash
# De dentro de uma VM na mesma VNet
nslookup sql-producao.database.windows.net

# Deve retornar:
# sql-producao.privatelink.database.windows.net
# Address: 10.0.2.5  (IP privado do Private Endpoint)
```

Se retornar um IP público (como 40.x.x.x), a DNS Zone não está configurada corretamente.

## Validação em três passos

Antes de considerar a configuração concluída, sempre valide:

1. **nslookup** de dentro de uma VM na VNet — deve resolver para IP privado (10.x.x.x)
2. **Testar conectividade** — `Test-NetConnection sql-producao.database.windows.net -Port 1433` deve conectar via IP privado
3. **Desabilitar acesso público** no recurso — se tudo funcionar sem acesso público, a configuração está correta

Esse terceiro passo é o teste definitivo. Se você desabilita o acesso público e a aplicação continua funcionando, o Private Endpoint está fazendo seu trabalho.

## Considerações para ambientes corporativos

Em empresas com múltiplas VNets e hub-spoke topology, a Private DNS Zone precisa estar vinculada a todas as VNets que precisam resolver o nome privado. Uma abordagem comum é centralizar as DNS Zones no hub e vincular via VNet links.

Se você usa DNS customizado (como um Windows DNS Server ou Azure DNS Private Resolver), precisa configurar conditional forwarders para as zonas `privatelink.*` apontando para o IP do Azure DNS (168.63.129.16).

Private Endpoints são essenciais para compliance em ambientes regulados. A configuração não é difícil, mas a validação de DNS é o detalhe que separa "funcionar" de "funcionar certo".
