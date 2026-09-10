---
layout: ../../layouts/PostLayout.astro
title: "Azure Network Watcher: diagnostico de problemas de rede"
category: "Networking"
tag: "networking"
date: "13 Nov 2025"
readTime: "9 min"
description: "Connection Monitor, IP Flow Verify, Next Hop -- as ferramentas do Network Watcher que resolvem incidentes de conectividade em minutos."
---

O Azure Network Watcher e o conjunto de ferramentas de diagnostico e monitoramento de rede do Azure. Quando a conectividade falha e voce nao sabe o motivo, o Network Watcher responde isso em segundos.

## Habilitando o Network Watcher

```bash
az network watcher configure \
  --resource-group NetworkWatcherRG \
  --locations brazilsouth \
  --enabled true
```

## IP Flow Verify: "esse trafego esta sendo bloqueado?"

```bash
az network watcher test-ip-flow \
  --vm minha-vm \
  --direction Inbound \
  --protocol TCP \
  --local 10.0.1.4:443 \
  --remote 203.0.113.50:54321 \
  --out table
```

Resultado: `Allow` ou `Deny` e qual regra de NSG tomou a decisao.

## Next Hop: "para onde vai o trafego?"

```bash
az network watcher show-next-hop \
  --resource-group rg-app \
  --vm minha-vm \
  --source-ip 10.0.1.4 \
  --dest-ip 10.0.2.10
```

Mostra: `VirtualNetworkGateway`, `VirtualAppliance`, `Internet` -- util para diagnosticar problemas de UDR.

## Connection Monitor: monitoramento continuo

```bash
az network watcher connection-monitor create \
  --name monitor-agente-search \
  --resource-group rg-monitoring \
  --location brazilsouth \
  --source-resource $(az vm show -n vm-agente -g rg-ia --query id -o tsv) \
  --dest-resource $(az search service show -n search-ia -g rg-ia --query id -o tsv) \
  --dest-port 443 \
  --monitoring-frequency 30
```

```kql
NetworkMonitoring
| where TimeGenerated > ago(1h)
| where TestGroupName == "monitor-agente-search"
| where ConnectionMonitorTestResult == "Fail"
| project TimeGenerated, SourceAddress, DestinationAddress, AvgLatencyInMs
```

## NSG Flow Logs

```bash
az network watcher flow-log create \
  --location brazilsouth \
  --name flowlog-snet-app \
  --nsg nsg-app \
  --storage-account meu-storage \
  --enabled true \
  --format JSON \
  --log-version 2 \
  --retention 30 \
  --workspace $(az monitor log-analytics workspace show \
    -n law-producao -g rg-monitoring --query id -o tsv) \
  --traffic-analytics true
```

## Conclusao

IP Flow Verify e Next Hop resolvem 80% dos incidentes de conectividade em minutos. Connection Monitor previne que muitos desses incidentes cheguem a usuarios, detectando falhas antes que os sistemas de alertas de aplicacao disparem.
