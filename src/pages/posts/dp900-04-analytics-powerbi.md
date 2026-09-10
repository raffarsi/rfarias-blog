---
layout: ../../layouts/PostLayout.astro
title: "DP-900 na prática [4] — Analytics, Synapse e Power BI"
category: "Docência"
tag: "docencia"
serie: "DP-900 na prática"
serieSlug: "dp900"
serieNum: 4
date: "9 Mai 2026"
readTime: "10 min"
description: "Azure Synapse Analytics, Data Lake, Azure Databricks e Power BI para analytics moderno."
prev:
  title: "DP-900 [3] — Dados Não Relacionais"
  slug: "dp900-03-dados-nao-relacionais"
next:
  title: "DP-900 [5] — Pipelines e Governança"
  slug: "dp900-05-pipelines-governanca"

---

Analytics é o processo de transformar dados brutos em insights acionáveis. O DP-900 cobre toda a stack de analytics moderna do Azure.

## Modern Data Warehouse

Arquitetura em camadas para analytics em escala:

```
Fontes (SQL, APIs, IoT, arquivos)
    ↓ Ingestão
Azure Data Factory / Event Hubs
    ↓ Armazenamento bruto
Azure Data Lake Storage Gen2
    ↓ Transformação
Azure Databricks / Synapse Spark
    ↓ Serving
Azure Synapse Analytics (SQL Pool)
    ↓ Visualização
Power BI
```

## Azure Data Lake Storage Gen2

Storage otimizado para analytics — combina escalabilidade do Blob Storage com hierarquia de sistema de arquivos:

```bash
# Criar ADLS Gen2
az storage account create \
  --name meudatalake2026 \
  --resource-group meu-rg \
  --location brazilsouth \
  --sku Standard_LRS \
  --kind StorageV2 \
  --enable-hierarchical-namespace true  # Isso habilita ADLS Gen2

# Criar containers (zonas)
az storage fs create --name raw --account-name meudatalake2026       # Bronze
az storage fs create --name curated --account-name meudatalake2026   # Silver
az storage fs create --name analytics --account-name meudatalake2026 # Gold
```

**Medalion Architecture (Bronze/Silver/Gold):**
- **Bronze (Raw)** — dados brutos como chegam, sem transformação
- **Silver (Curated)** — dados limpos, validados e integrados
- **Gold (Analytics)** — dados agregados e modelados para consumo

## Azure Synapse Analytics

Plataforma unificada de analytics que combina data warehouse e big data:

```bash
# Criar workspace Synapse
az synapse workspace create \
  --name meu-synapse \
  --resource-group meu-rg \
  --storage-account meudatalake2026 \
  --file-system analytics \
  --sql-admin-login-user adminuser \
  --sql-admin-login-password "MinhaSenh@Forte123" \
  --location brazilsouth
```

**Serverless SQL Pool** — consulta dados no Data Lake sem provisionar recursos:

```sql
-- Consultar parquet diretamente no Data Lake
SELECT TOP 100
    ano,
    mes,
    SUM(valor_total) as receita_total
FROM
    OPENROWSET(
        BULK 'https://meudatalake2026.dfs.core.windows.net/analytics/vendas/**',
        FORMAT = 'PARQUET'
    ) AS dados
GROUP BY ano, mes
ORDER BY ano DESC, mes DESC;
```

**Dedicated SQL Pool** — data warehouse com recursos dedicados para performance máxima:
- Distribuição de dados: hash, round-robin ou replicada
- Índices columnstore para compressão e performance analítica

## Azure Databricks

Plataforma de analytics baseada em Apache Spark — processamento distribuído:

```python
# Exemplo de pipeline ETL com PySpark
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, year, month, sum as spark_sum

spark = SparkSession.builder.appName("ETL-Vendas").getOrCreate()

# Ler dados brutos do Data Lake
df_raw = spark.read.parquet("abfss://raw@meudatalake2026.dfs.core.windows.net/vendas/")

# Transformar
df_curated = (df_raw
    .filter(col("status") == "APROVADO")
    .withColumn("ano", year(col("data_venda")))
    .withColumn("mes", month(col("data_venda")))
    .groupBy("ano", "mes", "produto_id")
    .agg(spark_sum("valor").alias("receita_total"))
)

# Salvar na camada curated
df_curated.write.mode("overwrite").parquet(
    "abfss://curated@meudatalake2026.dfs.core.windows.net/vendas-agregadas/"
)
```

## Power BI

Ferramenta de Business Intelligence para visualização e relatórios:

**Componentes:**
- **Power BI Desktop** — criação de relatórios (gratuito)
- **Power BI Service** — publicação e compartilhamento na nuvem
- **Power BI Mobile** — visualização em dispositivos móveis
- **Power BI Embedded** — incorporar relatórios em aplicações

```bash
# Conectar Power BI ao Azure Synapse
# (feito via Power BI Desktop → Get Data → Azure → Azure Synapse Analytics)
# Endpoint: meu-synapse.sql.azuresynapse.net
# Database: seu-banco
# Autenticação: conta Microsoft ou SQL
```

**DAX (Data Analysis Expressions)** — linguagem de fórmulas do Power BI:

```dax
// Medida: receita do mês atual
Receita Mes Atual = 
CALCULATE(
    SUM(Vendas[Valor]),
    DATESMTD(Calendario[Data])
)

// Medida: crescimento YoY
Crescimento YoY = 
DIVIDE(
    [Receita Mes Atual] - [Receita Mesmo Mes Ano Anterior],
    [Receita Mesmo Mes Ano Anterior]
)
```

<div class="callout">
<strong>Dica para o exame:</strong> O DP-900 frequentemente pergunta quando usar Synapse Serverless (consulta ad-hoc no Data Lake, sem custo de provisioning) vs Dedicated Pool (data warehouse com alta performance garantida para relatórios regulares). Serverless = exploração; Dedicated = produção com SLA.
</div>

## O que cai no exame

- Data Lake vs Data Warehouse vs Database: propósito de cada
- Synapse Serverless vs Dedicated SQL Pool
- Azure Databricks para processamento Spark
- Medalion Architecture (Bronze/Silver/Gold)
- Power BI: Desktop → Service → Mobile pipeline
- ELT vs ETL em contexto de data lake
