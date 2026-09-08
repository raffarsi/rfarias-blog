---
layout: ../../layouts/PostLayout.astro
title: "DP-900 na prática [1] — Conceitos fundamentais de dados"
category: "Azure"
tag: "azure"
serie: "DP-900 na prática"
serieNum: 1
date: "28 Abr 2026"
readTime: "9 min"
description: "Dados estruturados, semiestruturados e não estruturados. Processamento batch vs streaming para o DP-900."
next:
  title: "DP-900 na prática [2] — Dados relacionais no Azure"
  slug: "dp900-02-dados-relacionais"
---

O DP-900 cobre os fundamentos de dados em nuvem — desde os conceitos básicos até os serviços Azure de dados. Este artigo começa pelo essencial.

## Tipos de dados

**Dados estruturados** — formato definido, esquema fixo. Armazenados em tabelas com linhas e colunas.
- Exemplos: tabelas de banco de dados SQL, planilhas Excel
- Consulta: SQL
- Quando usar: transações, relatórios, dados com relacionamentos bem definidos

**Dados semiestruturados** — têm alguma organização mas esquema flexível. Formato: JSON, XML, YAML.
```json
{
  "cliente_id": 123,
  "nome": "Rafael",
  "endereco": {
    "rua": "Av. Paulista",
    "cidade": "São Paulo"
  },
  "pedidos": [{"id": 1, "valor": 150.00}, {"id": 2, "valor": 89.90}]
}
```

**Dados não estruturados** — sem esquema definido.
- Exemplos: imagens, vídeos, áudio, documentos PDF, emails
- Armazenamento: Blob Storage, data lakes
- Processamento: IA/ML para extrair insights

## Armazenamento de dados

**Transacional (OLTP)** — Online Transaction Processing. Otimizado para operações de leitura/escrita frequentes. Baixa latência, alta disponibilidade. Normalizado para evitar redundância.
- Azure SQL Database, Azure Database for PostgreSQL/MySQL

**Analítico (OLAP)** — Online Analytical Processing. Otimizado para consultas complexas sobre grandes volumes de dados. Desnormalizado para performance de leitura.
- Azure Synapse Analytics, Azure Analysis Services

## Processamento de dados

**Batch** — processa grandes volumes de dados acumulados em intervalos regulares.
```bash
# Exemplo: processar logs do dia anterior via Azure Data Factory
az datafactory pipeline create-run \
  --factory-name meu-adf \
  --resource-group meu-rg \
  --name pipeline-batch-diario \
  --parameters '{"data": "2026-04-27"}'
```
- Alta latência (horas/dias)
- Alto throughput
- Economicamente eficiente

**Streaming** — processa dados em tempo real conforme chegam.
```bash
# Criar Azure Event Hubs para ingestão de streaming
az eventhubs namespace create \
  --name meu-eventhub-ns \
  --resource-group meu-rg \
  --location brazilsouth \
  --sku Standard

az eventhubs eventhub create \
  --name telemetria-iot \
  --namespace-name meu-eventhub-ns \
  --resource-group meu-rg \
  --partition-count 4
```
- Baixa latência (milissegundos/segundos)
- Dados em movimento
- Casos de uso: IoT, detecção de fraude em tempo real, trading

**Lambda Architecture** — combina batch e streaming para ter o melhor dos dois mundos: resultados históricos precisos + atualizações em tempo real.

## Papéis em engenharia de dados

| Papel | Responsabilidade |
|-------|-----------------|
| Engenheiro de Dados | Pipelines ETL, infraestrutura de dados |
| Cientista de Dados | Modelos ML, análise exploratória |
| Analista de Dados | Relatórios, dashboards, BI |
| Administrador de BD | Performance, backup, segurança de bancos |

## ETL vs ELT

**ETL** (Extract, Transform, Load) — transforma dados antes de carregar no destino.
**ELT** (Extract, Load, Transform) — carrega dados brutos primeiro, transforma no destino (comum em data lakes modernos).

<div class="callout">
<strong>Dica para o exame:</strong> O DP-900 frequentemente pergunta qual serviço Azure é mais adequado para cada tipo de workload. OLTP = transacional (SQL Database); OLAP = analítico (Synapse); Streaming = Event Hubs + Stream Analytics; Data Lake = Azure Data Lake Storage Gen2.
</div>

## O que cai no exame

- Diferença entre dados estruturados, semiestruturados e não estruturados
- OLTP vs OLAP: transacional vs analítico
- Batch vs Streaming e quando usar cada um
- ETL vs ELT
- Papéis: engenheiro de dados vs cientista de dados vs analista
