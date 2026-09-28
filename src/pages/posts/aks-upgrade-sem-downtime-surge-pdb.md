---
layout: ../../layouts/PostLayout.astro
title: "Upgrade do AKS sem derrubar a aplicação: max surge, PDB e janela de manutenção"
category: "Infra"
tag: "infra"
date: "15 Out 2026"
readTime: "8 min"
description: "O upgrade termina com sucesso no portal e a aplicação fica fora do ar mesmo assim. Como o AKS drena os nós, quais ajustes de surge, PDB e janela de manutenção evitam a indisponibilidade e quais erros travam o upgrade."
---

O upgrade do cluster foi agendado para a madrugada de domingo, correu sem nenhum erro e o portal mostrou "Succeeded" na manhã seguinte. Mesmo assim, o monitoramento registrou alguns minutos de indisponibilidade da API principal por volta das duas da manhã. A investigação foi curta: as três réplicas da aplicação estavam no mesmo nó, e quando o AKS drenou esse nó, as três saíram juntas. Não havia PodDisruptionBudget, então nada disse ao Kubernetes que aquilo não podia acontecer.

O AKS fez exatamente o que foi configurado para fazer. O problema é que ninguém tinha configurado nada.

## O que acontece com cada nó durante o upgrade

O upgrade de um node pool é um rolling upgrade, sempre no mesmo ciclo:

**Surge.** O AKS cria nós extras, já na versão nova, conforme o max surge do pool.

**Cordon e drain.** Um nó antigo é marcado como não agendável e os pods são removidos pela Eviction API, a mesma do `kubectl drain`. Com max surge maior que 1, o AKS drena tantos nós ao mesmo tempo quanto o número de nós de surge.

**Soak (opcional).** Uma espera entre o drain e o reimage, para você olhar o painel antes de seguir.

**Reimage e repetição.** O nó drenado recebe a versão nova e passa a ser o buffer do próximo lote. No fim, os nós de surge que sobraram são removidos e o pool volta ao tamanho original.

O ponto que a abertura ilustra: o surge garante capacidade, não disponibilidade. Quem decide quantos pods podem sair ao mesmo tempo é o PDB. Sem ele, a Eviction API não tem restrição nenhuma.

## Max surge, max unavailable e soak

O padrão de max surge é **1**: um nó extra por vez, o mais lento. Para produção, a Microsoft recomenda **33%**. O valor aceita inteiro ou porcentagem (arredondada para cima), e `100%` drena o pool inteiro de uma vez, o que só faz sentido em teste.

Três detalhes que aparecem tarde demais. A configuração é persistente e vale para os próximos upgrades de versão e de imagem. Cada nó de surge consome quota de computação e, com Azure CNI, IPs da sub-rede (`(nós + maxSurge) * (1 + maxPods)`, na conta da documentação). E em pools com zonas, a zona dos nós de surge não é conhecida antes: use um surge múltiplo de três.

Sem quota para surge, existe o **max unavailable**. Ele não cria nós: drena até N nós existentes e empurra os pods para o resto do pool. O padrão é 0, não vale para pools de sistema e aumenta o conflito com PDB, porque sobra menos espaço. Combinar os dois, com fallback do surge para max unavailable, ainda é preview.

O **node soak** tem padrão 0 e vai até 30 minutos. Mantenha curto: ele aumenta a duração total do upgrade.

```bash
az aks get-upgrades \
  --resource-group rg-plataforma \
  --name aks-producao \
  --output table

az aks nodepool update \
  --resource-group rg-plataforma \
  --cluster-name aks-producao \
  --name npaplicacao \
  --max-surge 33% \
  --drain-timeout 45 \
  --node-soak-duration 5 \
  --undrainable-node-behavior Cordon
```

## O PDB que protege

Para a aplicação da abertura, bastariam dois ajustes: um PDB e uma regra que espalhe as réplicas entre nós.

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: pdb-api-pedidos
  namespace: pedidos
spec:
  maxUnavailable: 1
  selector:
    matchLabels:
      app: api-pedidos
---
# trecho do Deployment (spec.template.spec)
topologySpreadConstraints:
- maxSkew: 1
  topologyKey: kubernetes.io/hostname
  whenUnsatisfiable: ScheduleAnyway
  labelSelector:
    matchLabels:
      app: api-pedidos
```

Com `maxUnavailable: 1` e três réplicas, o drain só consegue remover uma réplica por vez. A próxima eviction espera a substituta ficar pronta em outro nó. O `topologySpreadConstraints` faz o scheduler espalhar as réplicas entre nós. Com `ScheduleAnyway` isso é preferência, não garantia; se o cluster tem nós suficientes e você quer a regra obrigatória, use `DoNotSchedule`. Com as réplicas espalhadas, o drain de um único nó deixa de ser um evento de indisponibilidade.

## O PDB que trava o upgrade

O mesmo mecanismo, mal configurado, para o upgrade. Um PDB com `maxUnavailable: 0`, ou com `minAvailable` igual ao número de réplicas, nunca permite uma eviction. O drain espera até o **drain timeout**, que tem padrão de 30 minutos e aceita de 5 minutos a 24 horas. Se o tempo acaba e ainda há pods, a operação para, e qualquer `PUT` seguinte retoma o upgrade.

O que acontece com o nó bloqueado depende do **undrainable node behavior**. No padrão, `Schedule`, o AKS apaga o nó bloqueado e cria um substituto. Com `Cordon`, que a documentação recomenda, o nó fica isolado com o rótulo `kubernetes.azure.com/upgrade-status=Quarantined` e o upgrade continua nos demais. O nó em quarentena fica na versão antiga e a resolução é sua: ajustar o PDB, remover o pod ou apagar o nó. O parâmetro `--max-blocked-nodes`, que define quantos nós bloqueados são tolerados, só existe na extensão `aks-preview`.

Existe também o `--enable-force-upgrade` no `az aks upgrade`, que ignora os PDBs. Eu trato como último recurso, porque ele pode drenar todos os pods de uma vez, que é exatamente o incidente da abertura.

## Versão do Kubernetes e imagem do nó são upgrades diferentes

O cluster tem dois canais de atualização automática, independentes.

| Canal | O que muda | Opções |
|------|-----------|--------|
| `--auto-upgrade-channel` | Versão do Kubernetes (plano de controle e pools) | `none`, `patch`, `stable`, `rapid` (`node-image` é legado) |
| `--node-os-upgrade-channel` | Imagem do sistema operacional dos nós | `None`, `Unmanaged`, `SecurityPatch`, `NodeImage` |

O canal de imagem não altera a versão do Kubernetes. Desde a API 2023-06-01, cluster Standard novo nasce com `NodeImage`, que troca o VHD dos nós semanalmente, respeitando a janela de manutenção e as configurações de surge. Ou seja: mesmo quem nunca clicou em "upgrade" tem nós sendo drenados toda semana.

Cada canal tem a sua janela. O `aksManagedAutoUpgradeSchedule` controla o upgrade de versão e o `aksManagedNodeOSUpgradeSchedule` controla a imagem. A documentação pede pelo menos quatro horas de janela e deixa claro que ela é de melhor esforço: o AKS pode sair dela em manutenção urgente. Configurar a janela também não liga o upgrade automático; ela só define quando ele acontece.

```bash
az aks update \
  --resource-group rg-plataforma \
  --name aks-producao \
  --auto-upgrade-channel patch \
  --node-os-upgrade-channel NodeImage

az aks maintenanceconfiguration add \
  --resource-group rg-plataforma \
  --cluster-name aks-producao \
  --name aksManagedAutoUpgradeSchedule \
  --schedule-type Weekly --day-of-week Sunday --interval-weeks 1 \
  --start-time 01:00 --duration 4 --utc-offset=-03:00

az aks maintenanceconfiguration add \
  --resource-group rg-plataforma \
  --cluster-name aks-producao \
  --name aksManagedNodeOSUpgradeSchedule \
  --schedule-type Weekly --day-of-week Saturday --interval-weeks 1 \
  --start-time 01:00 --duration 4 --utc-offset=-03:00
```

Eu separo as duas janelas em dias diferentes: se algo der errado, sei qual mudança causou.

## Antes da versão nova: APIs depreciadas

Em upgrades de versão menor com destino 1.26 ou superior, o AKS bloqueia a operação quando detecta uso recente de uma API depreciada ou removida na versão alvo. A detecção já vem ligada nos clusters Standard e Automatic e considera o uso das últimas 12 horas. O erro traz o subcódigo `UpgradeBlockedOnDeprecatedAPIUsage` e o nome da API.

Esse bloqueio é proteção, não falha. O caminho é abrir **Diagnose and solve problems** > **Create, Upgrade, Delete, and Scale** > **Kubernetes API deprecations**, migrar manifests e charts, esperar as 12 horas e tentar de novo. Contornar com `--enable-force-upgrade` só adia o problema até a chamada à API removida falhar em produção.

## Três erros que eu vejo com frequência

**Confiar no surge para proteger a aplicação.** O surge cria capacidade, e só isso. Sem PDB e sem espalhar as réplicas, um único drain derruba o serviço inteiro, como na abertura. Antes de mexer em max surge, eu confiro se toda aplicação crítica tem pelo menos duas réplicas em nós diferentes e um PDB que permita exatamente uma eviction por vez.

**Escrever um PDB que ninguém consegue satisfazer.** `minAvailable: 1` num Deployment com uma réplica, ou `maxUnavailable: 0` "por segurança". O resultado é o drain parado por 30 minutos, o upgrade interrompido e o cluster em estado parcial numa janela que já acabou. O AKS até valida PDBs mal configurados antes do upgrade, mas a correção é no manifest: o PDB precisa permitir pelo menos uma eviction.

**Achar que só o upgrade de versão drena nós.** O canal `NodeImage` troca a imagem dos nós toda semana, com o mesmo ciclo de cordon e drain. Quem configura só a janela do upgrade de versão e esquece o `aksManagedNodeOSUpgradeSchedule` descobre o drain no horário comercial.

## Quando a mudança é grande: um node pool novo

Para mudanças de maior risco, como subir para uma versão com muitas mudanças de API ou trocar o tamanho de VM, eu prefiro não fazer rolling upgrade no pool existente. O padrão é o blue-green de node pools: com o plano de controle já na versão alvo, criar um pool novo nessa versão, isolar o antigo e migrar no seu ritmo.

```bash
az aks nodepool add \
  --resource-group rg-plataforma \
  --cluster-name aks-producao \
  --name npverde \
  --kubernetes-version <versao-alvo> \
  --node-count 3

kubectl cordon -l kubernetes.azure.com/agentpool=npazul
kubectl drain <no-do-pool-azul> --ignore-daemonsets --delete-emptydir-data

az aks nodepool delete \
  --resource-group rg-plataforma \
  --cluster-name aks-producao \
  --name npazul
```

O `kubectl drain` respeita os mesmos PDBs, e o pool antigo serve de rollback até ser apagado: `kubectl uncordon` nos nós azuis, drain dos nós verdes e remoção do pool verde. O custo é quota em dobro na transição. Há também uma estratégia `BlueGreen` gerenciada dentro do pool, ainda em preview.

## O que fica

Upgrade sem indisponibilidade não é uma configuração do AKS, é uma propriedade da aplicação. Max surge, janela de manutenção e drain timeout decidem quando e com que velocidade os nós saem, mas quem decide se o usuário percebe é o número de réplicas, onde elas estão e o PDB que as protege. Eu não aceitaria ligar o upgrade automático num cluster em que essa conta não foi feita para cada aplicação crítica.

Se o AKS drenasse agora o nó mais carregado do seu cluster, quantas réplicas da sua aplicação principal ficariam de pé?
