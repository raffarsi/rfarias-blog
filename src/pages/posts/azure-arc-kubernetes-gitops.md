---
layout: ../../layouts/PostLayout.astro
title: "Azure Arc para Kubernetes: GitOps e governanca de clusters"
category: "Infra"
tag: "infra"
date: "12 Fev 2026"
readTime: "9 min"
description: "Como usar Azure Arc para gerenciar clusters Kubernetes on-premises e em outras clouds com GitOps, politicas e monitoramento centralizados."
---

O Azure Arc estende o plano de gerenciamento do Azure para clusters Kubernetes que estao fora do Azure -- on-premises, AWS EKS, Google GKE, OpenShift. Com ele, voce aplica as mesmas politicas, monitora com o mesmo Log Analytics e usa GitOps para sincronizar configuracoes.

## Conectando um cluster externo

```bash
az connectedk8s connect \
  --name cluster-datacenter-sp \
  --resource-group rg-arc-kubernetes \
  --location brazilsouth
```

Isso instala um agente no cluster que estabelece conexao de saida com o Azure -- sem precisar abrir portas de entrada no datacenter.

## GitOps com Flux CD

```bash
az k8s-configuration create \
  --name config-producao \
  --cluster-name cluster-datacenter-sp \
  --cluster-type connectedClusters \
  --resource-group rg-arc-kubernetes \
  --scope cluster \
  --source-kind GitRepository \
  --url "https://github.com/empresa/k8s-configs" \
  --branch main \
  --sync-interval 5m
```

O Flux CD e instalado automaticamente e sincroniza as configuracoes do repositorio Git com o cluster a cada 5 minutos. Mudancas no Git sao aplicadas automaticamente -- incluindo em clusters on-premises.

## Azure Policy para clusters Arc

```bash
# Exigir resource limits em todos os containers
az policy assignment create \
  --name "require-resource-limits" \
  --policy "/providers/Microsoft.Authorization/policyDefinitions/..." \
  --scope "/subscriptions/{sub}/resourceGroups/rg-arc-kubernetes"
```

A politica e avaliada em todos os clusters Arc conectados -- nao apenas nos clusters AKS gerenciados.

## Azure Monitor para clusters externos

```bash
az k8s-extension create \
  --name azuremonitor-containers \
  --cluster-name cluster-datacenter-sp \
  --resource-group rg-arc-kubernetes \
  --cluster-type connectedClusters \
  --extension-type Microsoft.AzureMonitor.Containers \
  --configuration-settings logAnalyticsWorkspaceResourceID=$(az monitor log-analytics workspace show \
    --workspace-name law-producao --resource-group rg-monitoring --query id -o tsv)
```

Metricas e logs do cluster on-premises aparecem no mesmo workspace que os clusters AKS do Azure.

## Consultando todos os clusters em uma query

```kql
// CPU usage de todos os clusters (AKS + Arc) ao mesmo tempo
KubeNodeInventory
| summarize avg_cpu = avg(CPUCapacityNanoCores) by ClusterName, bin(TimeGenerated, 5m)
| order by TimeGenerated desc
```

<div class="callout">
<strong>GitOps nao e apenas para Arc:</strong> A mesma abordagem GitOps (repositorio Git como fonte unica da verdade para configuracoes do cluster) funciona em clusters AKS nativos via Azure GitOps ou Flux CD direto. Arc facilita a aplicacao em clusters externos sem configuracao adicional por cluster.
</div>

## Conclusao

Azure Arc para Kubernetes unifica o gerenciamento de clusters independente de onde estao. GitOps via Flux CD garante que todos os clusters -- Azure ou on-premises -- aplicam as mesmas configuracoes do repositorio Git. Para organizacoes com clusters em multiplos ambientes, e o que permite tratar toda a frota de clusters como um unico sistema gerenciado.
