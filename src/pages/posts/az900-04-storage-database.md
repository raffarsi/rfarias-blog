---
layout: ../../layouts/PostLayout.astro
title: "AZ-900 na prática [4] — Storage e banco de dados no Azure"
category: "IA Generativa"
tag: "ia-generativa"
serie: "AZ-900 na prática"
serieSlug: "az900"
serieNum: 4
date: "14 Mar 2026"
readTime: "9 min"
description: "Azure Storage, Azure SQL, Cosmos DB e os principais serviços de dados para o AZ-900."
prev:
  title: "AZ-900 [3] — Computação e Redes"
  slug: "az900-03-computacao-redes"
next:
  title: "AZ-900 [5] — Identidade e Segurança"
  slug: "az900-05-identidade-seguranca"

---

Armazenamento e banco de dados são temas recorrentes no AZ-900. O exame testa principalmente sua capacidade de escolher o serviço certo para cada cenário.

## Azure Storage

Uma Storage Account pode hospedar quatro tipos de storage:

**Blob Storage**, objetos não estruturados: imagens, vídeos, backups, logs. Três tipos de blob: Block (arquivos em geral), Append (logs), Page (discos de VMs).

**Azure Files**, compartilhamentos SMB e NFS acessíveis de Windows, Linux e macOS.

**Queue Storage**, filas de mensagens para comunicação assíncrona entre serviços.

**Table Storage**, dados NoSQL semi-estruturados em formato chave-valor.

```bash
# Criar Storage Account
az storage account create \
  --name meustorage2026 \
  --resource-group meu-rg \
  --location brazilsouth \
  --sku Standard_GRS \
  --kind StorageV2

# Criar container Blob
az storage container create \
  --name imagens \
  --account-name meustorage2026 \
  --public-access off

# Upload de arquivo
az storage blob upload \
  --account-name meustorage2026 \
  --container-name imagens \
  --name foto.jpg \
  --file ./foto.jpg
```

## Redundância de Storage

| Opção | Cópias | Proteção |
|-------|--------|----------|
| LRS | 3 no mesmo datacenter | Falha de rack |
| ZRS | 3 em zonas diferentes | Falha de datacenter |
| GRS | LRS + 3 na região secundária | Falha de região |
| GZRS | ZRS + 3 na região secundária | Falha de região + datacenter |

## Banco de dados relacionais

### Azure SQL Database

SQL Server como serviço. Sem gerenciar SO ou instâncias. Patches e backups automáticos.

```bash
# Criar SQL Server
az sql server create \
  --name meu-sql-server \
  --resource-group meu-rg \
  --location brazilsouth \
  --admin-user adminuser \
  --admin-password "Senha@Segura123"

# Criar banco de dados
az sql db create \
  --resource-group meu-rg \
  --server meu-sql-server \
  --name meu-banco \
  --edition Standard \
  --capacity 10
```

### Azure Database for PostgreSQL / MySQL / MariaDB

Bancos relacionais open-source como serviço gerenciado.

### Azure SQL Managed Instance

SQL Server completo como serviço, compatibilidade total com SQL Server on-premises. Ideal para migração lift-and-shift de workloads SQL complexos.

## Banco de dados NoSQL

### Azure Cosmos DB

Banco de dados NoSQL globalmente distribuído, multi-modelo. Suporta APIs para MongoDB, Cassandra, Gremlin (grafos) e Table Storage.

```bash
# Criar conta Cosmos DB
az cosmosdb create \
  --name meu-cosmos \
  --resource-group meu-rg \
  --kind MongoDB \
  --locations regionName=brazilsouth failoverPriority=0

# Criar banco e collection
az cosmosdb mongodb database create \
  --account-name meu-cosmos \
  --resource-group meu-rg \
  --name meu-db

az cosmosdb mongodb collection create \
  --account-name meu-cosmos \
  --resource-group meu-rg \
  --database-name meu-db \
  --name usuarios
```

**Garantia de SLA:** 99,999% de disponibilidade, latência de leitura abaixo de 10ms e escrita abaixo de 15ms no 99º percentil.

## Serviços de Analytics

**Azure Synapse Analytics**, plataforma unificada para data warehouse e big data analytics.

**Azure HDInsight**, clusters gerenciados de Hadoop, Spark, Kafka, HBase.

**Azure Databricks**, plataforma de analytics baseada em Apache Spark.

<div class="callout">
<strong>Dica para o exame:</strong> Cosmos DB é a resposta certa quando o enunciado menciona: escala global, latência baixa garantida, múltiplas APIs NoSQL, ou dados não estruturados que precisam de distribuição geográfica. Azure SQL Database é para dados relacionais estruturados com transações ACID.
</div>

## O que cai no exame

- Tipos de storage (Blob, Files, Queue, Table) e quando usar cada um
- Redundância: LRS → ZRS → GRS → GZRS (custo e proteção crescentes)
- Azure SQL Database vs SQL Managed Instance (diferença de compatibilidade)
- Cosmos DB: NoSQL, global, multi-model, SLA de 99,999%
- Que camadas de acesso (Hot, Cool, Archive) se aplicam ao Blob
