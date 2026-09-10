---
layout: ../../layouts/PostLayout.astro
title: "Backup e Disaster Recovery no Azure: RPO, RTO e como escolher a estrategia certa"
category: "Infra"
tag: "infra"
date: "22 Jan 2026"
readTime: "10 min"
description: "Como calcular RPO e RTO e quando usar Azure Backup, ASR ou geo-replication para cada tipo de workload."
---

Backup e Disaster Recovery sao frequentemente tratados como a mesma coisa -- nao sao. Backup protege contra perda de dados (deletar acidentalmente, corrupcao). DR protege contra indisponibilidade de infraestrutura (falha de datacenter, regiao Azure fora do ar). A estrategia certa depende de dois numeros: RPO e RTO.

## RPO e RTO: os dois numeros que definem sua estrategia

**RPO (Recovery Point Objective):** quanto de dado voce pode perder? Se seu RPO e 1 hora, voce precisa de backup a cada hora -- um incidente pode te fazer perder no maximo 1 hora de dados.

**RTO (Recovery Time Objective):** quanto tempo voce pode ficar fora do ar? Se seu RTO e 4 horas, sua solucao de recuperacao precisa restaurar tudo em 4 horas.

Quanto menor o RPO e RTO, mais cara e a solucao.

## Azure Backup: protecao de dados

Para VMs, SQL Server, Storage e outros recursos:

```bash
# Criar vault de backup
az backup vault create \
  --name vault-backup-producao \
  --resource-group rg-backup \
  --location brazilsouth

# Configurar politica de backup para VM (diario + retencao 30 dias)
az backup policy create \
  --vault-name vault-backup-producao \
  --resource-group rg-backup \
  --name politica-vms \
  --backup-management-type AzureIaasVM \
  --policy '{
    "schedulePolicy": {
      "schedulePolicyType": "SimpleSchedulePolicy",
      "scheduleRunFrequency": "Daily",
      "scheduleRunTimes": ["2026-01-01T02:00:00Z"]
    },
    "retentionPolicy": {
      "retentionPolicyType": "LongTermRetentionPolicy",
      "dailySchedule": {"retentionDuration": {"count": 30, "durationType": "Days"}}
    }
  }'

# Habilitar backup em uma VM
az backup protection enable-for-vm \
  --vault-name vault-backup-producao \
  --resource-group rg-backup \
  --vm minha-vm-producao \
  --policy-name politica-vms
```

## Azure Site Recovery (ASR): replicacao para DR

Para replicar VMs entre regioes com failover automatico:

```bash
# Criar vault de recuperacao
az recoveryservices vault create \
  --name vault-asr \
  --resource-group rg-dr \
  --location eastus  # regiao de DR (diferente da producao)

# Habilitar replicacao de uma VM
# (configuracao completa e feita pelo portal ou ARM template)
az site-recovery protection-container create \
  --fabric-name fabric-brazilsouth \
  --name container-vms \
  --resource-group rg-dr \
  --vault-name vault-asr
```

Com ASR, as VMs sao replicadas continuamente para a regiao de DR. RPO tipico: 15 segundos para VMs VMware/Hyper-V, poucos minutos para VMs Azure.

## Geo-replication para dados: quando usar

| Servico | Opcao de Geo-replication | RPO tipico |
|---------|--------------------------|------------|
| Azure SQL Database | Active Geo-Replication | < 5 segundos |
| Azure Storage | GRS/GZRS | < 15 minutos |
| Azure Cosmos DB | Multi-region writes | < 1 segundo |
| Azure AI Search | Servico separado + reindexacao | Horas |

```bash
# SQL Database com replica em outra regiao
az sql db replica create \
  --name banco-producao \
  --server sql-server-br \
  --resource-group rg-dados \
  --partner-server sql-server-us \
  --partner-resource-group rg-dados-dr \
  --partner-region eastus

# Storage com geo-redundancia automatica
az storage account create \
  --name storageproducao \
  --resource-group rg-dados \
  --sku Standard_GZRS  # Zone + Geo redundant
```

## Escolhendo a estrategia por RPO/RTO

| RPO | RTO | Estrategia |
|-----|-----|------------|
| 24 horas | 4 horas | Azure Backup diario + restore manual |
| 4 horas | 1 hora | Azure Backup horario + ASR para VMs criticas |
| 15 minutos | 15 minutos | ASR continuo + SQL Active Geo-Replication |
| < 1 minuto | < 5 minutos | Active-Active multi-regiao (custo muito maior) |

<div class="callout">
<strong>Teste o RTO real, nao o estimado.</strong> A maioria das organizacoes sabe o RTO teorico mas nunca testou quanto tempo leva de fato para restaurar. Faca um teste de DR anual -- so assim voce sabe se o RTO real esta dentro do acordado em contrato.
</div>

## Conclusao

Backup e DR sao necessidades diferentes com solucoes diferentes. Azure Backup protege dados contra perda ou corrupcao. ASR e geo-replication protegem contra indisponibilidade de infraestrutura. A escolha da estrategia certa comeca pelos numeros de RPO e RTO -- e esses numeros devem ser definidos com o negocio, nao pela equipe de TI unilateralmente.
