---
layout: ../../layouts/PostLayout.astro
title: "AZ-104 na prática [5] — Azure Files e Azure File Sync"
category: "Azure"
tag: "azure"
serie: "AZ-104 na prática"
serieSlug: "az104"
serieNum: 5
date: "13 Jun 2026"
readTime: "8 min"
description: "Compartilhamentos SMB na nuvem com Azure Files e sincronização com servidores on-premises."
prev:
  title: "AZ-104 [4] — Storage Accounts"
  slug: "az104-04-storage-accounts"
next:
  title: "AZ-104 [6] — VMs: Criação"
  slug: "az104-06-virtual-machines"

---

Azure Files oferece compartilhamentos de arquivos gerenciados na nuvem, acessíveis via SMB 3.0 e NFS 4.1. É ideal para substituir servidores de arquivos on-premises ou compartilhar dados entre VMs.

## Criando um compartilhamento

```bash
# Criar storage account para Azure Files
az storage account create \
  --name filestorage2026 \
  --resource-group meu-rg \
  --location brazilsouth \
  --sku Premium_LRS \
  --kind FileStorage

# Criar file share
az storage share-rm create \
  --name meu-compartilhamento \
  --storage-account filestorage2026 \
  --quota 100
```

## Montando no Windows

```powershell
# Montar via PowerShell
$storageAccountName = "filestorage2026"
$shareName = "meu-compartilhamento"
$storageAccountKey = (Get-AzStorageAccountKey -ResourceGroupName "meu-rg" -Name $storageAccountName)[0].Value

$connectTestResult = Test-NetConnection -ComputerName "$storageAccountName.file.core.windows.net" -Port 445

cmd /c "net use Z: \\$storageAccountName.file.core.windows.net\$shareName /u:AZURE\$storageAccountName $storageAccountKey /persistent:yes"
```

## Montando no Linux

```bash
sudo mkdir /mnt/azurefiles
sudo mount -t cifs //filestorage2026.file.core.windows.net/meu-compartilhamento /mnt/azurefiles \
  -o vers=3.0,username=filestorage2026,password={storage-key},dir_mode=0777,file_mode=0777
```

## Camadas de Azure Files

| Camada | Uso | Storage |
|--------|-----|---------|
| Premium | Workloads IOPS intensivos | SSD (FileStorage kind) |
| Transaction Optimized | Transações frequentes | HDD |
| Hot | Uso geral | HDD |
| Cool | Backup e arquivamento | HDD |

## Azure File Sync

O Azure File Sync transforma o Azure Files em um cache de servidor de arquivos local. Sincroniza servidores Windows com um compartilhamento Azure Files, com Cloud Tiering que move arquivos pouco usados para a nuvem automaticamente.

**Componentes:**
1. **Storage Sync Service** — recurso no Azure
2. **Sync Group** — define a topologia de sincronização
3. **Cloud Endpoint** — o Azure file share
4. **Server Endpoint** — pasta em um servidor Windows registrado

```bash
# Criar Storage Sync Service
az storagesync create \
  --name meu-sync-service \
  --resource-group meu-rg \
  --location brazilsouth
```

<div class="callout">
<strong>Dica para o exame:</strong> Azure File Sync suporta múltiplos server endpoints para o mesmo sync group, criando um sistema de compartilhamento distribuído onde múltiplos servidores têm a mesma view dos arquivos. Cloud Tiering pode ser habilitado por server endpoint individualmente.
</div>

## Snapshots de compartilhamentos

```bash
# Criar snapshot
az storage share snapshot \
  --name meu-compartilhamento \
  --account-name filestorage2026

# Listar snapshots
az storage share list \
  --account-name filestorage2026 \
  --include-snapshot \
  --query "[?snapshot!=null].{Name:name, Snapshot:snapshot}"
```

## O que cai no exame

- Diferença entre protocolos SMB (Windows) e NFS (Linux)
- Camadas de Azure Files e quando usar cada uma
- Componentes do Azure File Sync (Storage Sync Service, Sync Group, endpoints)
- O que é Cloud Tiering e como funciona
- Limitações: máximo de 100 TB por compartilhamento Premium, 5 TB Standard
