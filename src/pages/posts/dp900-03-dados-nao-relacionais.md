---
layout: ../../layouts/PostLayout.astro
title: "DP-900 na prática [3] — Dados não relacionais e Cosmos DB"
category: "Azure"
tag: "azure"
serie: "DP-900 na prática"
serieSlug: "dp900"
serieNum: 3
date: "5 Mai 2026"
readTime: "9 min"
description: "Azure Cosmos DB, tipos de NoSQL e Azure Storage para dados não relacionais."
prev:
  title: "DP-900 [2] — Dados Relacionais"
  slug: "dp900-02-dados-relacionais"
next:
  title: "DP-900 [4] — Analytics e Power BI"
  slug: "dp900-04-analytics-powerbi"

---

Bancos de dados NoSQL oferecem flexibilidade de esquema e escala horizontal que bancos relacionais não conseguem facilmente. O DP-900 cobre os principais tipos e o Azure Cosmos DB.

## Por que NoSQL?

Bancos relacionais enfrentam limitações em escala horizontal e esquemas flexíveis. NoSQL resolve isso sacrificando algumas garantias ACID em favor de:
- **Escala horizontal** (mais máquinas, não máquinas maiores)
- **Alta disponibilidade** distribuída
- **Esquema flexível** (evolução sem migrações)

**Teorema CAP** — sistemas distribuídos só podem garantir dois de três:
- **C**onsistency — todos veem os mesmos dados
- **A**vailability — sistema sempre responde
- **P**artition tolerance — funciona mesmo com falhas de rede

## Tipos de NoSQL

**Chave-valor** — pares simples chave:valor. Ultra-rápido para leitura/escrita.
```python
# Redis (via Azure Cache for Redis)
import redis
r = redis.Redis(host='meu-redis.redis.cache.windows.net', port=6380,
                password='MINHA_SENHA', ssl=True)

r.set('sessao:abc123', '{"userId": 1, "role": "admin"}', ex=3600)
session = r.get('sessao:abc123')
```

**Documento** — armazena documentos JSON/BSON. Esquema flexível por documento.
```json
// Dois "clientes" com campos diferentes — válido em NoSQL
{"id": 1, "nome": "Rafael", "email": "rafael@ex.com"}
{"id": 2, "nome": "Ana", "email": "ana@ex.com", "empresa": "TechCorp", "cargo": "CTO"}
```

**Colunar** — dados agrupados por coluna em vez de linha. Ótimo para analytics.
- Apache Cassandra (disponível via Cosmos DB API for Cassandra)

**Grafo** — nós e arestas para representar relacionamentos complexos.
- Casos de uso: redes sociais, detecção de fraude, recomendações
- Disponível via Cosmos DB API for Gremlin

## Azure Cosmos DB

Banco NoSQL globalmente distribuído, multi-API, SLA de 99,999%:

```bash
# Criar conta Cosmos DB (API for NoSQL)
az cosmosdb create \
  --name meu-cosmos-2026 \
  --resource-group meu-rg \
  --locations regionName=brazilsouth failoverPriority=0 \
  --default-consistency-level Session

# Criar banco e container
az cosmosdb sql database create \
  --account-name meu-cosmos-2026 \
  --resource-group meu-rg \
  --name ecommerce

az cosmosdb sql container create \
  --account-name meu-cosmos-2026 \
  --resource-group meu-rg \
  --database-name ecommerce \
  --name produtos \
  --partition-key-path "/categoria" \
  --throughput 400
```

```python
from azure.cosmos import CosmosClient, PartitionKey

client = CosmosClient("https://meu-cosmos-2026.documents.azure.com", "MINHA_CHAVE")
db = client.get_database_client("ecommerce")
container = db.get_container_client("produtos")

# Inserir documento
produto = {
    "id": "prod-001",
    "categoria": "eletronicos",
    "nome": "Notebook",
    "preco": 3500.00,
    "especificacoes": {
        "ram": "16GB",
        "storage": "512GB SSD",
        "processador": "Intel Core i7"
    }
}
container.create_item(body=produto)

# Consultar
query = "SELECT * FROM c WHERE c.categoria = 'eletronicos' AND c.preco < 5000"
items = list(container.query_items(query=query, enable_cross_partition_query=True))
```

**Partition Key** — critério de distribuição dos dados. Escolha ruim = hotspot (uma partição com todo o tráfego). Escolha boa = distribuição uniforme.

**Request Units (RU/s)** — unidade de throughput do Cosmos DB. 1 RU = 1 leitura de documento de 1KB. Escritas custam ~5 RUs.

## Níveis de consistência do Cosmos DB

| Nível | Garantia | Latência | Custo RU |
|-------|----------|----------|----------|
| Strong | Linearizabilidade | Alta | Alto |
| Bounded Staleness | Atraso máximo configurável | Alta | Alto |
| Session | Consistência por sessão | Média | Médio |
| Consistent Prefix | Sem leituras fora de ordem | Baixa | Baixo |
| Eventual | Eventual convergência | Baixa | Baixo |

## Azure Storage para dados não relacionais

**Azure Table Storage** — chave-valor em formato tabular, sem schema fixo, baixo custo.

```bash
# Criar tabela
az storage table create \
  --name produtos \
  --account-name meustorage2026

# Inserir entidade
az storage entity insert \
  --account-name meustorage2026 \
  --table-name produtos \
  --entity PartitionKey=eletronicos RowKey=notebook-01 nome="Notebook Dell" preco=3500
```

<div class="callout">
<strong>Dica para o exame:</strong> Cosmos DB é a resposta quando o enunciado menciona distribuição global, SLA de 99,999%, múltiplas APIs NoSQL, ou latência garantida em milissegundos. Para dados simples de chave-valor sem requisitos de escala global, Azure Table Storage é mais econômico.
</div>

## O que cai no exame

- Tipos de NoSQL: chave-valor, documento, colunar, grafo
- Cosmos DB: multi-API, global, 99,999% SLA, RU/s
- Partition key e seu impacto na performance
- Níveis de consistência (Strong vs Eventual)
- Cosmos DB vs Azure Table Storage (quando usar cada)
- Teorema CAP aplicado a bancos distribuídos
