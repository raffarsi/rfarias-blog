---
layout: ../../layouts/PostLayout.astro
title: "Backup e Disaster Recovery no Azure: RPO, RTO e como escolher a estratégia certa"
category: "Infra"
tag: "infra"
date: "22 Jan 2026"
readTime: "10 min"
description: "Como calcular RPO e RTO e quando usar Azure Backup, ASR ou geo-replication para cada tipo de workload."
---

Backup e Disaster Recovery são frequentemente tratados como a mesma coisa, mas não são. Backup protege contra perda de dados (deletar acidentalmente, corrupção). DR protege contra indisponibilidade de infraestrutura (falha de datacenter, região Azure fora do ar). A estratégia certa depende de dois números: RPO e RTO.

## RPO e RTO: os dois números que definem sua estratégia

**RPO (Recovery Point Objective):** quanto de dado você pode perder? Se seu RPO é 1 hora, você precisa de backup a cada hora: um incidente pode te fazer perder no máximo 1 hora de dados.

**RTO (Recovery Time Objective):** quanto tempo você pode ficar fora do ar? Se seu RTO é 4 horas, sua solução de recuperação precisa restaurar tudo em 4 horas.

Quanto menor o RPO e RTO, mais cara é a solução.

## Azure Backup: proteção de dados

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

## Azure Site Recovery (ASR): replicação para DR

Para replicar VMs entre regiões com failover automático:

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

Com ASR, as VMs são replicadas continuamente para a região de DR. RPO típico: 15 segundos para VMs VMware/Hyper-V, poucos minutos para VMs Azure.

## Geo-replication para dados: quando usar

| Serviço | Opção de Geo-replication | RPO típico |
|---------|--------------------------|------------|
| Azure SQL Database | Active Geo-Replication | < 5 segundos |
| Azure Storage | GRS/GZRS | < 15 minutos |
| Azure Cosmos DB | Multi-region writes | < 1 segundo |
| Azure AI Search | Serviço separado + reindexação | Horas |

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

## Escolhendo a estratégia por RPO/RTO

| RPO | RTO | Estratégia |
|-----|-----|------------|
| 24 horas | 4 horas | Azure Backup diário + restore manual |
| 4 horas | 1 hora | Azure Backup horário + ASR para VMs críticas |
| 15 minutos | 15 minutos | ASR contínuo + SQL Active Geo-Replication |
| < 1 minuto | < 5 minutos | Active-Active multi-região (custo muito maior) |

<div class="callout">
<strong>Teste o RTO real, não o estimado.</strong> A maioria das organizações sabe o RTO teórico mas nunca testou quanto tempo leva de fato para restaurar. Faça um teste de DR anual: só assim você sabe se o RTO real está dentro do acordado em contrato.
</div>

## Conclusão

Backup e DR são necessidades diferentes com soluções diferentes. Azure Backup protege dados contra perda ou corrupção. ASR e geo-replication protegem contra indisponibilidade de infraestrutura. A escolha da estratégia certa começa pelos números de RPO e RTO, e esses números devem ser definidos com o negócio, não pela equipe de TI unilateralmente.
