---
layout: ../../layouts/PostLayout.astro
title: "Azure Arc: governança unificada para ambientes híbridos e multi-cloud"
category: "Infra"
tag: "infra"
date: "04 Dez 2025"
readTime: "5 min"
description: "A auditoria quer para os servidores do datacenter o mesmo relatório que já existe para as VMs no Azure. O que o Azure Arc projeta para fora do Azure, o que é gratuito e o que é cobrado, e os erros de uma adoção em escala."
---

A auditoria pediu, para os servidores do datacenter, o mesmo relatório de conformidade que já existia para as VMs no Azure. Na nuvem, o relatório saía do Azure Policy em minutos. No datacenter, eram planilhas, scripts e ferramentas diferentes para cada tipo de servidor.

Essa é a situação de quase toda empresa que não é 100% nuvem: servidores on-premises, VMs em outras nuvens e clusters Kubernetes fora do Azure convivem com o que está no Azure, cada um governado de um jeito. O Azure Arc resolve isso levando o plano de controle do Azure até eles.

## O que o Arc faz, na prática

Um servidor conectado ao Arc vira um recurso do Azure. Ele aparece no portal, tem um ID, fica num resource group, recebe tags, entra no RBAC e pode ser alvo de Azure Policy, como qualquer VM. O servidor continua onde está; o que muda é que ele passa a ser governado pelo mesmo lugar.

O Arc cobre três frentes principais: **servidores** Windows e Linux, em qualquer lugar; **Kubernetes**, incluindo clusters on-premises e de outras nuvens; e **SQL Server** fora do Azure.

## Conectando servidores em escala

Um servidor se conecta com o agente do Arc, o `azcmagent`. Para escala, o caminho é uma entidade de serviço com permissão só de onboarding, usada por um script ou por ferramenta de automação:

```bash
azcmagent connect \
  --service-principal-id "$SP_ID" \
  --service-principal-secret "$SP_SECRET" \
  --tenant-id "$TENANT_ID" \
  --subscription-id "$SUB_ID" \
  --resource-group rg-arc-servidores \
  --location brazilsouth
```

Dois cuidados. A entidade de serviço deve ter só o papel Azure Connected Machine Onboarding, e o segredo não pode ficar num script guardado em compartilhamento de rede. E a conectividade precisa ser planejada: o agente sai para endpoints do Azure, e em ambientes que não podem ter saída ampla, o Arc gateway e o Private Link reduzem essa superfície.

## O que é gratuito e o que é cobrado

É a pergunta que define o tamanho da adoção, e a resposta tem nuances.

**Gratuito:** o plano de controle. Inventário, tags, RBAC, organização em resource groups e consultas pelo Azure Resource Graph não custam nada.

**Cobrado:** os serviços que você liga em cima. Machine Configuration (as políticas que auditam dentro do sistema operacional), Azure Update Manager e Defender for Servers são cobrados por servidor; o Azure Monitor, pelo volume de dados ingeridos.

**Incluído em alguns licenciamentos:** servidores Windows com Software Assurance, licença por assinatura ou pay-as-you-go podem ativar o Windows Server Management enabled by Azure Arc, com uma declaração de licença por servidor (em Azure Arc > Licenses) e o agente na versão 1.47 ou superior. O benefício inclui Update Manager, Machine Configuration, inventário e controle de alterações sem custo adicional. Para quem tem Software Assurance, isso muda a conta inteira.

O Arc também é o caminho para comprar Extended Security Updates de versões antigas do Windows Server por mês, cobradas pelo Azure, em vez de um contrato anual.

A recomendação prática: conecte tudo pelo plano de controle, que é gratuito, e ligue os serviços pagos por grupo de servidores, com o custo calculado antes.

## Política e conformidade no mesmo relatório

Com os servidores no Arc, a mesma atribuição de política vale para as VMs do Azure e para as máquinas do datacenter. O relatório que a auditoria pediu sai de uma consulta no Azure Resource Graph:

```kql
PolicyResources
| where type == "microsoft.policyinsights/policystates"
| extend estado = tostring(properties.complianceState),
         tipo = tostring(properties.resourceType)
| where tipo in~ ("microsoft.compute/virtualmachines", "microsoft.hybridcompute/machines")
| extend recurso = tostring(properties.resourceId)
| summarize maquinas = dcount(recurso), nao_conformes = dcountif(recurso, estado == "NonCompliant") by tipo
```

Em ambiente regulado, esse é o argumento mais forte do Arc: um único conjunto de controles e uma única evidência, dentro e fora do Azure.

## Monitoramento e segurança

O Azure Monitor Agent é instalado como extensão do Arc, e os logs dos servidores do datacenter chegam ao mesmo workspace das VMs do Azure. Uma consulta passa a cobrir toda a infraestrutura.

O Defender for Servers também alcança as máquinas do Arc. O plano 1 traz o Defender for Endpoint e a gestão básica de vulnerabilidades; o plano 2 acrescenta a gestão de vulnerabilidades premium, a varredura sem agente e o monitoramento de integridade de arquivos. O acesso just-in-time, também do plano 2, vale para VMs do Azure e da AWS, não para máquinas do Arc:

```bash
az security pricing create --name VirtualMachines --tier standard --subplan P2
```

## Kubernetes fora do Azure

Um cluster conectado ao Arc recebe configuração por GitOps, com Flux: o estado desejado fica num repositório Git, e o cluster se sincroniza sozinho, mesmo sem IP público.

```bash
az k8s-configuration flux create \
  --resource-group rg-arc-kubernetes \
  --cluster-name cluster-datacenter \
  --cluster-type connectedClusters \
  --name config-plataforma \
  --namespace config-plataforma \
  --scope cluster \
  --url https://github.com/empresa/k8s-config \
  --branch main \
  --kustomization name=infra path=./infra prune=true
```

## Três erros que eu vejo com frequência

**Conectar sem governança.** Servidores entram no Arc sem tags, em resource groups aleatórios, e o inventário vira uma segunda bagunça. A estrutura de resource groups e as tags obrigatórias vêm antes do primeiro onboarding.

**Ligar tudo em tudo.** Monitor, Defender e Update Manager habilitados em milhares de servidores de uma vez, sem cálculo, viram uma surpresa na fatura do mês seguinte.

**Esquecer que o servidor continua on-premises.** O Arc governa, mas não opera: backup, alta disponibilidade e rede do datacenter continuam sendo responsabilidade de quem sempre cuidou deles.

## O que fica

O Arc não move servidor nenhum para a nuvem. Ele traz a governança da nuvem até onde os servidores estão. O plano de controle é gratuito, então conectar custa pouco; o que precisa de decisão é quais serviços ligar, e para quais servidores.

Se a auditoria pedisse amanhã o relatório de conformidade de todos os seus servidores, dentro e fora do Azure, de quantas ferramentas ele sairia?
