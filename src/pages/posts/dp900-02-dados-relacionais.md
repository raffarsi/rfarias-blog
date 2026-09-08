---
layout: ../../layouts/PostLayout.astro
title: "DP-900 na prática [2] — Dados relacionais no Azure"
category: "Azure"
tag: "azure"
serie: "DP-900 na prática"
serieNum: 2
date: "2 Mai 2026"
readTime: "9 min"
description: "Azure SQL Database, SQL Managed Instance, PostgreSQL e os serviços de banco de dados relacional."
prev:
  title: "DP-900 na prática [1] — Conceitos de dados"
  slug: "dp900-01-conceitos-dados"
next:
  title: "DP-900 na prática [3] — Dados não relacionais"
  slug: "dp900-03-dados-nao-relacionais"
---

Bancos de dados relacionais são a base da maioria das aplicações. O DP-900 cobre os serviços Azure para dados relacionais em profundidade.

## Modelo Relacional

Dados organizados em tabelas com linhas (registros) e colunas (atributos). Relacionamentos entre tabelas via chaves:

```sql
-- Tabela de clientes
CREATE TABLE Clientes (
    ClienteID INT PRIMARY KEY,
    Nome NVARCHAR(100) NOT NULL,
    Email NVARCHAR(200) UNIQUE
);

-- Tabela de pedidos com FK para clientes
CREATE TABLE Pedidos (
    PedidoID INT PRIMARY KEY,
    ClienteID INT FOREIGN KEY REFERENCES Clientes(ClienteID),
    Data DATE NOT NULL,
    Total DECIMAL(10,2)
);

-- Consulta com JOIN
SELECT c.Nome, p.PedidoID, p.Total
FROM Clientes c
INNER JOIN Pedidos p ON c.ClienteID = p.ClienteID
WHERE p.Total > 100
ORDER BY p.Data DESC;
```

**Propriedades ACID:**
- **Atomicidade** — transação é tudo ou nada
- **Consistência** — dados sempre em estado válido
- **Isolamento** — transações concorrentes não interferem
- **Durabilidade** — dados comprometidos são permanentes

## Azure SQL Database

SQL Server como PaaS. Sem gerenciar SO ou instâncias.

```bash
# Criar servidor SQL
az sql server create \
  --name meu-sql-2026 \
  --resource-group meu-rg \
  --location brazilsouth \
  --admin-user adminuser \
  --admin-password "MinhaSenh@Forte123"

# Criar banco de dados
az sql db create \
  --resource-group meu-rg \
  --server meu-sql-2026 \
  --name banco-producao \
  --tier GeneralPurpose \
  --family Gen5 \
  --capacity 2

# Configurar firewall
az sql server firewall-rule create \
  --resource-group meu-rg \
  --server meu-sql-2026 \
  --name allow-azure \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

**Modelos de compra:**
- **DTU** — unidades combinadas de CPU, memória e I/O. Simples, mas menos flexível.
- **vCore** — escolha independente de CPU, memória e storage. Mais controle, suporta Hybrid Benefit.

**Backups automáticos:**
- Full: semanal
- Diferencial: 12-24 horas
- Log de transações: 5-12 minutos
- Retenção padrão: 7 dias (configurável até 35 dias)

## Azure SQL Managed Instance

SQL Server completo como serviço — 100% compatível com SQL Server on-premises.

```bash
# Criar Managed Instance (leva ~3-4 horas)
az sql mi create \
  --resource-group meu-rg \
  --name meu-mi-2026 \
  --location brazilsouth \
  --admin-user adminuser \
  --admin-password "MinhaSenh@Forte123" \
  --subnet /subscriptions/{sub-id}/resourceGroups/meu-rg/providers/Microsoft.Network/virtualNetworks/minha-vnet/subnets/snet-mi \
  --license-type LicenseIncluded \
  --capacity 4 \
  --tier GeneralPurpose
```

**Quando usar MI vs SQL Database:**
- SQL Database: novos projetos, aplicações nativas de nuvem
- SQL Managed Instance: migração lift-and-shift de SQL Server on-premises, recursos que SQL Database não tem (SQL Agent, CLR, cross-database queries, linked servers)

## Azure Database for PostgreSQL / MySQL

Bancos open-source como serviço:

```bash
# PostgreSQL Flexible Server
az postgres flexible-server create \
  --resource-group meu-rg \
  --name meu-postgres \
  --location brazilsouth \
  --admin-user adminuser \
  --admin-password "MinhaSenh@Forte123" \
  --sku-name Standard_D2s_v3 \
  --tier GeneralPurpose \
  --storage-size 128

# Conectar e criar tabela
az postgres flexible-server execute \
  --resource-group meu-rg \
  --name meu-postgres \
  --database-name postgres \
  --admin-user adminuser \
  --admin-password "MinhaSenh@Forte123" \
  --querytext "CREATE TABLE usuarios (id SERIAL PRIMARY KEY, nome VARCHAR(100));"
```

<div class="callout">
<strong>Dica para o exame:</strong> Azure SQL Managed Instance é a resposta quando o enunciado menciona "migração de SQL Server on-premises" ou "máxima compatibilidade com SQL Server". SQL Database é para novas aplicações ou quando você precisa de escala sem gerenciar instâncias.
</div>

## Índices — performance de consultas

```sql
-- Índice clustered (determina a ordem física dos dados)
CREATE CLUSTERED INDEX IX_Pedidos_Data ON Pedidos(Data);

-- Índice non-clustered (estrutura separada)
CREATE NONCLUSTERED INDEX IX_Pedidos_ClienteID ON Pedidos(ClienteID)
INCLUDE (Total, Data);

-- Verificar uso de índices
SELECT i.name, i.type_desc, us.user_seeks, us.user_scans, us.user_lookups
FROM sys.indexes i
JOIN sys.dm_db_index_usage_stats us ON i.object_id = us.object_id AND i.index_id = us.index_id
WHERE OBJECT_NAME(i.object_id) = 'Pedidos';
```

## O que cai no exame

- Propriedades ACID e por que são importantes
- SQL Database vs SQL Managed Instance (quando usar cada)
- Modelos DTU vs vCore
- Backups automáticos e retenção
- Azure Database for PostgreSQL/MySQL para workloads open-source
- Normalização e por que reduz redundância
