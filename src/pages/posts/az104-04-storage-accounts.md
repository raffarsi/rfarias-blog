---
layout: ../../layouts/PostLayout.astro
title: "AZ-104 na prática [4] — Storage Accounts: tudo que você precisa saber"
category: "Azure"
tag: "azure"
serie: "AZ-104 na prática"
serieNum: 4
date: "6 Jun 2026"
readTime: "11 min"
description: "Tipos de storage, redundância, acesso e lifecycle management no Azure Storage."
prev:
  title: "AZ-104 na prática [3] — Azure Policy"
  slug: "az104-03-azure-policy"
next:
  title: "AZ-104 na prática [5] — Azure Files e File Sync"
  slug: "az104-05-azure-files"
---

Storage Account é um dos recursos mais versáteis do Azure e um dos mais cobrados no AZ-104. Entender os tipos, redundância e opções de acesso é obrigatório.

## Tipos de storage

| Tipo | Uso |
|------|-----|
| Blob Storage | Objetos não estruturados (imagens, vídeos, backups) |
| File Storage | Compartilhamentos SMB/NFS na nuvem |
| Queue Storage | Mensagens para comunicação entre serviços |
| Table Storage | Dados NoSQL semiestruturados |
| Disk Storage | Discos gerenciados para VMs |

## Camadas de acesso (Blob)

- **Hot** — acesso frequente, maior custo de armazenamento, menor custo de operação
- **Cool** — acesso infrequente (mín. 30 dias), menor custo de armazenamento
- **Cold** — acesso raro (mín. 90 dias), custo ainda menor
- **Archive** — acesso muito raro (mín. 180 dias), menor custo de armazenamento, reidratação necessária para acesso

## Opções de redundância

| Sigla | Nome | Descrição |
|-------|------|-----------|
| LRS | Locally Redundant Storage | 3 cópias na mesma zona/datacenter |
| ZRS | Zone Redundant Storage | 3 cópias em zonas diferentes |
| GRS | Geo Redundant Storage | LRS + replicação assíncrona para região secundária |
| GZRS | Geo Zone Redundant Storage | ZRS + replicação para região secundária |
| RA-GRS | Read-Access GRS | GRS com leitura da região secundária |
| RA-GZRS | Read-Access GZRS | GZRS com leitura da região secundária |

```bash
# Criar storage account com GRS
az storage account create \
  --name meuStorage2026 \
  --resource-group meu-rg \
  --location brazilsouth \
  --sku Standard_GRS \
  --kind StorageV2 \
  --access-tier Hot
```

## Controle de acesso

**Shared Access Signature (SAS)** — token com permissões e validade específicas, sem expor a account key:

```bash
# Gerar SAS token para um container
az storage container generate-sas \
  --account-name meuStorage2026 \
  --name meu-container \
  --permissions rwdl \
  --expiry 2026-12-31 \
  --output tsv
```

**Stored Access Policy** — política reutilizável que pode ser revogada sem re-gerar SAS tokens:

```bash
az storage container policy create \
  --account-name meuStorage2026 \
  --container-name meu-container \
  --name politica-leitura \
  --permissions rl \
  --expiry 2026-12-31
```

## Lifecycle Management

Automatiza a movimentação e exclusão de blobs baseada em regras:

```json
{
  "rules": [
    {
      "name": "move-to-cool",
      "type": "Lifecycle",
      "definition": {
        "filters": { "blobTypes": ["blockBlob"] },
        "actions": {
          "baseBlob": {
            "tierToCool": { "daysAfterModificationGreaterThan": 30 },
            "tierToArchive": { "daysAfterModificationGreaterThan": 90 },
            "delete": { "daysAfterModificationGreaterThan": 365 }
          }
        }
      }
    }
  ]
}
```

## Soft Delete e Versionamento

```bash
# Habilitar soft delete para blobs (retenção de 7 dias)
az storage blob service-properties delete-policy update \
  --account-name meuStorage2026 \
  --enable true \
  --days-retained 7

# Habilitar versionamento
az storage account blob-service-properties update \
  --account-name meuStorage2026 \
  --resource-group meu-rg \
  --enable-versioning true
```

<div class="callout">
<strong>Armadilha do exame:</strong> Archive não é uma camada de acesso da conta — é uma camada de blob individual. Você não muda a conta para Archive; move blobs específicos para Archive. A reidratação de Archive para Hot/Cool pode levar horas.
</div>

## Azure Storage Explorer

Para gerenciamento visual, o Azure Storage Explorer é uma ferramenta desktop gratuita que facilita upload, download e gerenciamento de blobs, filas e tabelas.

## O que cai no exame

- Diferença entre tipos de redundância (LRS/ZRS/GRS/RA-GRS)
- Camadas de acesso e custos mínimos de permanência
- Diferença entre Account Key, SAS e RBAC para acesso
- Quando usar Stored Access Policy vs SAS ad-hoc
- Como lifecycle management funciona
