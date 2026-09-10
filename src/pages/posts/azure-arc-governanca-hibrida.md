---
layout: ../../layouts/PostLayout.astro
title: "Azure Arc: governança unificada para ambientes híbridos e multi-cloud"
category: "Infra"
tag: "infra"
date: "04 Dez 2025"
readTime: "9 min"
description: "Como o Azure Arc estende governança, segurança e monitoramento do Azure para servidores on-premises e outras clouds."
---
A maioria das empresas não é 100% cloud. Servidores on-premises, VMs em outras clouds, clusters Kubernetes fora do Azure, tudo isso coexiste com recursos Azure. O Azure Arc resolve o problema de gerenciar tudo isso com ferramentas diferentes: ele projeta o plano de controle do Azure para qualquer infraestrutura.

## O que o Arc faz

Com o Azure Arc, recursos externos aparecem no portal Azure e são gerenciáveis via ARM, CLI, Policy e Monitor, como se fossem recursos nativos:

- **Servidores Arc:** Windows e Linux on-premises ou em AWS/GCP
- **Kubernetes Arc:** EKS, GKE, OpenShift, clusters on-premises
- **SQL Arc:** SQL Server on-premises com serviços gerenciados

## Conectando um servidor on-premises

```bash
# No servidor Linux que você quer conectar:
curl -o azcmagent.deb https://aka.ms/azcmagent-linux-deb
dpkg -i azcmagent.deb

azcmagent connect   --service-principal-id $SP_ID   --service-principal-secret $SP_SECRET   --tenant-id $TENANT_ID   --subscription-id $SUB_ID   --resource-group rg-arc-servidores   --location brazilsouth
```

Após conectar, o servidor aparece no portal Azure com:
- Status online/offline em tempo real
- Extensões instaláveis (Azure Monitor Agent, Defender, etc.)
- Participação em Azure Policy
- RBAC gerenciado pelo Entra ID

## Azure Policy em servidores Arc

A mesma política que verifica VMs Azure funciona em servidores Arc:

```bash
# Aplicar política de auditoria em todos os servidores Arc do RG
az policy assignment create   --name "auditoria-antivirus-arc"   --policy "/providers/Microsoft.Authorization/policyDefinitions/..."   --scope "/subscriptions/{sub}/resourceGroups/rg-arc-servidores"
```

Para conformidade em ambientes regulados, isso é significativo: você demonstra para auditores que os mesmos controles se aplicam a toda a infraestrutura, Azure e on-premises, com um único relatório de compliance.

## Azure Monitor em servidores externos

```bash
# Instalar Azure Monitor Agent via Arc
az connectedmachine extension create   --name AzureMonitorLinuxAgent   --publisher Microsoft.Azure.Monitor   --type AzureMonitorLinuxAgent   --machine-name servidor-datacenter-sp   --resource-group rg-arc-servidores   --location brazilsouth
```

Logs e métricas do servidor on-premises chegam no mesmo Log Analytics workspace que os recursos Azure, uma única consulta KQL cobre toda a infraestrutura:

```kql
// CPU de servidores Azure E Arc ao mesmo tempo
Perf
| where CounterName == "% Processor Time"
| summarize avg_cpu = avg(CounterValue) by Computer, bin(TimeGenerated, 5m)
| order by TimeGenerated desc
```

## Microsoft Defender for Servers em on-premises

Com Arc, você ativa o Defender for Servers nos servidores on-premises, recebendo detecção de ameaças, vulnerability assessment e recomendações de segurança:

```bash
# Habilitar Defender for Servers para servidores Arc
az security pricing create   --name "HybridCompute"   --tier "Standard"
```

## Kubernetes Arc com GitOps

```bash
# Conectar cluster on-premises
az connectedk8s connect   --name cluster-datacenter   --resource-group rg-arc-kubernetes   --location brazilsouth

# Configurar GitOps via Flux CD
az k8s-configuration create   --name config-producao   --cluster-name cluster-datacenter   --cluster-type connectedClusters   --resource-group rg-arc-kubernetes   --scope cluster   --source-kind GitRepository   --url "https://github.com/empresa/k8s-configs"   --branch main   --sync-interval 5m
```

O Flux CD sincroniza configurações do Git com o cluster, mesmo que ele esteja on-premises, sem IP público.

<div class="callout">
<strong>Custo do Arc:</strong> O agente Arc em si é gratuito. Você paga pelos serviços que habilitar em cima: Azure Monitor (por GB ingerido), Defender for Servers (~$15/servidor/mês), extensões específicas. Calcule o custo por servidor antes de habilitar em larga escala.
</div>

## Relatório de conformidade híbrido

```kql
// Status de conformidade de VMs Azure + servidores Arc
PolicyStates
| where ComplianceState == "NonCompliant"
| where ResourceType in (
    "microsoft.compute/virtualmachines",        // VMs Azure
    "microsoft.hybridcompute/machines"          // Servidores Arc
  )
| summarize NonCompliant = count() by PolicyDefinitionName, ResourceType
| order by NonCompliant desc
```

## Conclusão

O Azure Arc é para organizações que precisam de governança consistente além das fronteiras do Azure. Em vez de ferramentas separadas para cloud e on-premises, o Arc unifica Policy, Monitor, Defender e RBAC em um único plano de gerenciamento, simplificando auditorias, reduzindo ferramentas e eliminando a divisão "o que está no Azure" vs "o que está fora".
