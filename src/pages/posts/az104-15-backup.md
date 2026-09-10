---
layout: ../../layouts/PostLayout.astro
title: "AZ-104 na prática [15] — Backup e Azure Site Recovery"
category: "Infra"
tag: "infra"
serie: "AZ-104 na prática"
serieSlug: "az104"
serieNum: 15
date: "22 Ago 2026"
readTime: "9 min"
description: "Protegendo dados com Azure Backup e implementando DR com Azure Site Recovery."
prev:
  title: "AZ-104 [14] — Azure Monitor"
  slug: "az104-14-azure-monitor"
next:
  title: "AZ-104 [16] — Custos"
  slug: "az104-16-custos"

---

Proteção de dados e recuperação de desastres são requisitos de qualquer ambiente de produção. O Azure oferece Azure Backup e Azure Site Recovery como soluções integradas.

## Recovery Services Vault

O vault é o contêiner central para backup e recuperação:

```bash
az backup vault create \
  --resource-group meu-rg \
  --name meu-vault \
  --location brazilsouth

# Configurar redundância do vault
az backup vault backup-properties set \
  --resource-group meu-rg \
  --name meu-vault \
  --backup-storage-redundancy GeoRedundant
```

## Azure Backup para VMs

```bash
# Habilitar backup de VM com política padrão
az backup protection enable-for-vm \
  --resource-group meu-rg \
  --vault-name meu-vault \
  --vm minha-vm \
  --policy-name DefaultPolicy

# Criar política customizada
az backup policy create \
  --resource-group meu-rg \
  --vault-name meu-vault \
  --name politica-diaria \
  --policy '{
    "schedulePolicy": {
      "schedulePolicyType": "SimpleSchedulePolicy",
      "scheduleRunFrequency": "Daily",
      "scheduleRunTimes": ["2026-09-01T02:00:00Z"]
    },
    "retentionPolicy": {
      "retentionPolicyType": "LongTermRetentionPolicy",
      "dailySchedule": {
        "retentionTimes": ["2026-09-01T02:00:00Z"],
        "retentionDuration": {"count": 30, "durationType": "Days"}
      },
      "weeklySchedule": {
        "daysOfTheWeek": ["Sunday"],
        "retentionTimes": ["2026-09-01T02:00:00Z"],
        "retentionDuration": {"count": 12, "durationType": "Weeks"}
      }
    }
  }'

# Disparar backup imediato
az backup protection backup-now \
  --resource-group meu-rg \
  --vault-name meu-vault \
  --container-name minha-vm \
  --item-name minha-vm \
  --backup-management-type AzureIaasVM \
  --retain-until 2026-12-31
```

## Restauração de VMs

```bash
# Listar pontos de recuperação
az backup recoverypoint list \
  --resource-group meu-rg \
  --vault-name meu-vault \
  --container-name minha-vm \
  --item-name minha-vm \
  --backup-management-type AzureIaasVM \
  --output table

# Restaurar VM completa
az backup restore restore-disks \
  --resource-group meu-rg \
  --vault-name meu-vault \
  --container-name minha-vm \
  --item-name minha-vm \
  --rp-name {recovery-point-name} \
  --storage-account meu-storage \
  --target-resource-group rg-restore
```

<div class="callout">
<strong>Soft Delete:</strong> O Azure Backup habilita Soft Delete por padrão — dados de backup excluídos são retidos por 14 dias adicionais antes da exclusão permanente. Isso protege contra exclusão acidental ou ransomware que tente deletar backups.
</div>

## Azure Site Recovery (ASR)

ASR replica VMs para outra região para recuperação de desastre:

```bash
# Criar vault de DR (em região diferente)
az backup vault create \
  --resource-group rg-dr \
  --name vault-dr \
  --location eastus

# Habilitar replicação (via portal ou PowerShell — CLI tem suporte limitado para ASR)
# O ASR replica continuamente e permite failover planejado ou não-planejado
```

**Conceitos chave do ASR:**
- **RPO** (Recovery Point Objective) — quanto de dado pode ser perdido. ASR oferece RPO de ~60 segundos
- **RTO** (Recovery Time Objective) — quanto tempo para recuperar. Depende do tamanho da VM
- **Failover de teste** — testa DR sem impactar produção
- **Failover** — move produção para a região de DR
- **Failback** — retorna produção para a região original após resolução do incidente

## Azure Backup para SQL Server em VMs

```bash
az backup protection enable-for-azurewl \
  --resource-group meu-rg \
  --vault-name meu-vault \
  --policy-name politica-sql \
  --protectable-item-name "SQLDataBase;mssqlserver;modelo" \
  --protectable-item-type SQLDataBase \
  --server-name minha-vm \
  --workload-type SQLDataBase
```

## O que cai no exame

- Diferença entre Azure Backup (proteção de dados) e ASR (DR/business continuity)
- Que Recovery Services Vault é usado por ambos
- Tipos de redundância do vault (LRS, GRS, ZRS) e implicações
- Soft Delete e período de retenção
- RPO e RTO no contexto de ASR
