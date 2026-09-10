---
layout: ../../layouts/PostLayout.astro
title: "DP-900 na prática [5] — Pipelines e governança de dados"
category: "Docência"
tag: "azure"
serie: "DP-900 na prática"
serieSlug: "dp900"
serieNum: 5
date: "12 Mai 2026"
readTime: "9 min"
description: "Azure Data Factory, Event Hubs, Stream Analytics e governança de dados com Microsoft Purview."
prev:
  title: "DP-900 [4] — Analytics e Power BI"
  slug: "dp900-04-analytics-powerbi"

---

Pipelines movem e transformam dados entre sistemas. Governança garante que dados sejam confiáveis, seguros e rastreáveis. Ambos são temas do DP-900.

## Azure Data Factory

Serviço gerenciado de ETL/ELT para orquestrar pipelines de dados:

```bash
# Criar Data Factory
az datafactory create \
  --factory-name meu-adf-2026 \
  --resource-group meu-rg \
  --location brazilsouth

# Criar linked service para SQL Database
az datafactory linked-service create \
  --factory-name meu-adf-2026 \
  --resource-group meu-rg \
  --name ls-sql-producao \
  --properties '{
    "type": "AzureSqlDatabase",
    "typeProperties": {
      "connectionString": "Server=meu-sql.database.windows.net;Database=banco;Authentication=ActiveDirectoryServicePrincipal"
    }
  }'
```

**Componentes principais:**
- **Linked Services** — conexões com fontes/destinos (SQL, Storage, APIs)
- **Datasets** — representação dos dados em cada linked service
- **Activities** — operações (Copy, Lookup, ForEach, If, Execute Pipeline)
- **Pipelines** — orquestração de activities
- **Triggers** — agendamento (schedule, event-based, tumbling window)

**Copy Activity** — o mais usado, copia dados entre 90+ fontes e destinos:

```json
{
  "name": "CopiarVendasParaDatalake",
  "type": "Copy",
  "inputs": [{"referenceName": "ds-sql-vendas", "type": "DatasetReference"}],
  "outputs": [{"referenceName": "ds-datalake-raw", "type": "DatasetReference"}],
  "typeProperties": {
    "source": {"type": "AzureSqlSource", "queryTimeout": "02:00:00"},
    "sink": {"type": "ParquetSink", "storeSettings": {"type": "AzureBlobFSWriteSettings"}}
  }
}
```

## Azure Event Hubs

Plataforma de streaming de eventos de alta capacidade — milhões de eventos por segundo:

```bash
az eventhubs namespace create \
  --name ns-eventos-2026 \
  --resource-group meu-rg \
  --sku Standard \
  --location brazilsouth \
  --capacity 2  # Throughput Units

az eventhubs eventhub create \
  --name telemetria \
  --namespace-name ns-eventos-2026 \
  --resource-group meu-rg \
  --partition-count 8 \
  --message-retention 3  # Dias de retenção
```

```python
# Enviar eventos para Event Hubs
from azure.eventhub import EventHubProducerClient, EventData
import json

producer = EventHubProducerClient.from_connection_string(
    conn_str="MINHA_CONNECTION_STRING",
    eventhub_name="telemetria"
)

with producer:
    batch = producer.create_batch()
    evento = {
        "device_id": "sensor-001",
        "temperatura": 23.5,
        "timestamp": "2026-05-12T10:30:00Z"
    }
    batch.add(EventData(json.dumps(evento)))
    producer.send_batch(batch)
```

## Azure Stream Analytics

Processa fluxos de dados em tempo real com SQL-like queries:

```bash
az stream-analytics job create \
  --job-name meu-stream-job \
  --resource-group meu-rg \
  --location brazilsouth \
  --output-error-policy "Drop" \
  --events-out-of-order-policy "Adjust"
```

```sql
-- Query Stream Analytics: média de temperatura por sensor, janela de 5 minutos
SELECT
    device_id,
    AVG(temperatura) AS temp_media,
    MAX(temperatura) AS temp_max,
    System.Timestamp() AS janela_fim
INTO [output-powerbi]
FROM [input-eventhubs]
GROUP BY
    device_id,
    TumblingWindow(minute, 5)
HAVING AVG(temperatura) > 30  -- Alerta: temperatura acima do normal
```

**Tipos de janela (window):**
- **Tumbling** — janelas fixas sem sobreposição (0-5min, 5-10min...)
- **Hopping** — janelas com sobreposição (0-5min, 2-7min, 4-9min...)
- **Sliding** — janela se move com cada evento
- **Session** — agrupa eventos próximos no tempo

## Microsoft Purview para governança de dados

Catálogo e governança de dados em escala:

```bash
# Criar conta Purview
az purview account create \
  --account-name meu-purview \
  --resource-group meu-rg \
  --location brazilsouth

# Registrar fonte de dados (Azure SQL Database)
az purview scan \
  --account-name meu-purview \
  --data-source-name ds-sql-producao \
  --scan-name scan-diario
```

**Funcionalidades:**
- **Data Map** — inventário automático de todos os ativos de dados
- **Data Catalog** — busca e descoberta de dados com metadados
- **Data Lineage** — rastreamento de origem e transformações dos dados
- **Classifications** — identificação automática de dados sensíveis (CPF, cartão de crédito)

**Linhagem de dados** — rastrea a jornada dos dados:
```
SQL Database → ADF Pipeline → Data Lake (Raw) → Databricks → Data Lake (Curated) → Synapse → Power BI
```

<div class="callout">
<strong>Dica para o exame:</strong> O DP-900 testa a diferença entre Data Factory (ETL batch, orquestração) e Event Hubs + Stream Analytics (streaming em tempo real). A combinação clássica é: Event Hubs (ingestão) → Stream Analytics (processamento em tempo real) → Power BI (visualização em tempo real).
</div>

## Azure Purview vs Azure Policy

- **Azure Purview** — governança de *dados* (descoberta, classificação, linhagem)
- **Azure Policy** — governança de *recursos Azure* (conformidade de configuração)

## O que cai no exame

- Azure Data Factory: componentes (linked services, datasets, activities, pipelines, triggers)
- Event Hubs: ingestão de streaming em alta escala
- Stream Analytics: processamento em tempo real com SQL
- Tipos de janela no Stream Analytics (Tumbling, Hopping, Sliding, Session)
- Microsoft Purview: catálogo, linhagem e classificação de dados
- Diferença entre Data Factory (batch) e Event Hubs + Stream Analytics (streaming)
