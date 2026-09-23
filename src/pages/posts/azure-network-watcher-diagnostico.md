---
layout: ../../layouts/PostLayout.astro
title: "Azure Network Watcher: diagnóstico de problemas de rede"
category: "Networking"
tag: "networking"
date: "13 Nov 2025"
readTime: "9 min"
description: "Connection Monitor, IP Flow Verify, Next Hop -- as ferramentas do Network Watcher que resolvem incidentes de conectividade em minutos."
---

Você abriu um ticket, o usuário reclama que não acessa o recurso, e você passa a próxima hora olhando para regras de NSG tentando descobrir o que está bloqueando. Isso acontece porque a maioria das pessoas não usa o Network Watcher para diagnosticar, usa intuição e tentativa e erro.

O Network Watcher tem ferramentas que respondem em segundos o que levaria horas de análise manual.

## IP Flow Verify: a ferramenta que mais uso

Testa se um fluxo de tráfego específico seria permitido ou bloqueado pelos NSGs, e qual regra toma a decisão:

```bash
az network watcher test-ip-flow   --vm minha-vm   --direction Inbound   --protocol TCP   --local 10.0.1.4:443   --remote 203.0.113.50:54321   --out table
```

O resultado diz: Allow ou Deny, e o nome da regra exata que tomou a decisão. Em 5 segundos você sabe o que está acontecendo, sem precisar abrir o portal e comparar regras manualmente.

## Next Hop: "para onde vai esse pacote?"

Quando o tráfego não está chegando ao destino e você não sabe se o problema é NSG ou roteamento, o Next Hop responde:

```bash
az network watcher show-next-hop   --resource-group rg-app   --vm minha-vm   --source-ip 10.0.1.4   --dest-ip 10.0.2.10
```

Retorna: `VirtualNetworkGateway`, `VirtualAppliance`, `Internet`, `None`. Se retornar `None`, o pacote está sendo descartado antes mesmo de uma regra de NSG ser avaliada, problema de roteamento. Se retornar `VirtualAppliance` com o IP errado, tem uma UDR mandando o tráfego para o lugar errado.

## Connection Monitor: monitoramento contínuo

Em vez de esperar um usuário reclamar, o Connection Monitor faz testes de conectividade de forma continua entre endpoints:

```bash
az network watcher connection-monitor create   --name monitor-agente-search   --resource-group rg-monitoring   --location brazilsouth   --source-resource $(az vm show -n vm-agente -g rg-ia --query id -o tsv)   --dest-resource $(az search service show -n search-ia -g rg-ia --query id -o tsv)   --dest-port 443   --monitoring-frequency 30
```

Quando a conectividade cai, você vê no Log Analytics antes que o usuário abra o ticket:

```kql
NetworkMonitoring
| where TimeGenerated > ago(1h)
| where TestGroupName == "monitor-agente-search"
| where ConnectionMonitorTestResult == "Fail"
| project TimeGenerated, SourceAddress, DestinationAddress, AvgLatencyInMs
```

## NSG Flow Logs: quando você precisa ver o tráfego real

Para auditar o que realmente está passando pela rede, não só o que as regras permitem teoricamente:

```bash
az network watcher flow-log create   --location brazilsouth   --name flowlog-snet-app   --nsg nsg-app   --storage-account meu-storage   --enabled true   --format JSON   --log-version 2   --retention 30   --workspace $(az monitor log-analytics workspace show     -n law-producao -g rg-monitoring --query id -o tsv)   --traffic-analytics true
```

Traffic Analytics no Log Analytics mostra os top flows, IPs mais ativos, portas mais usadas. Útil para descobrir tráfego inesperado e para compliance.

O Network Watcher é a diferença entre resolver um incidente em 5 minutos ou em 2 horas. Vale configurar o Connection Monitor para os caminhos críticos da sua arquitetura antes do primeiro incidente, não depois.
