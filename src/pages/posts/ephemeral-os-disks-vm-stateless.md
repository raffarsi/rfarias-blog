---
layout: ../../layouts/PostLayout.astro
title: "Ephemeral OS Disks no Azure: o disco do sistema que você não precisa guardar"
category: "Infra"
tag: "infra"
date: "26 Nov 2026"
readTime: "7 min"
description: "Em VMs que nascem e morrem prontas da imagem, persistir o disco do sistema operacional quase sempre é peso morto. Onde o Ephemeral OS Disk fica, o que ele entrega em latência e reimage, o que você abre mão e as contas de tamanho que travam o deploy."
---

O pool de agentes de build está lento. Cada job começa numa VM que precisa voltar ao estado limpo, e o reimage demora mais do que o próprio build. Ninguém guarda nada no disco do sistema dessas máquinas.

Mesmo assim, o disco do sistema operacional de cada uma delas é um disco gerenciado, replicado no Azure Storage, cobrado e protegido como se fosse um banco de dados.

A pergunta que vale fazer é simples: se a VM pode ser destruída e recriada a qualquer momento, por que o disco dela precisa sobreviver?

## Onde o disco do sistema mora

Por padrão, o disco do SO de uma VM no Azure é um disco gerenciado, no armazenamento remoto. É por isso que ele sobrevive a desligamento, troca de host e redimensionamento.

O **Ephemeral OS Disk** muda o endereço. O disco é criado no armazenamento local da VM, no próprio host, e não é salvo no Azure Storage. Onde exatamente, depende da família da VM, e a propriedade que controla isso é a `DiffDiskPlacement`:

- **NVMe disk placement:** da geração v6 em diante, como Dadsv6 e Ddsv6.
- **Temp disk placement** (também chamado de resource disk): em VMs com disco temporário, como Dadsv5 e Ddsv5.
- **Cache disk placement:** em famílias mais antigas que tinham disco de cache, como Dsv2 e Dsv3.

Se você não escolher, o Azure escolhe pela SKU. A recomendação da Microsoft é usar as gerações mais novas (v5/v6) com temp disk ou NVMe.

![Comparação entre disco do SO gerenciado, que fica no armazenamento remoto e sobrevive a reimage e desalocação, e Ephemeral OS Disk, que fica no armazenamento local do host e volta ao estado da imagem no reimage](/images/posts/ephemeral-os-disks-vm-stateless/disco-gerenciado-vs-efemero.svg)

Um detalhe que pouca gente lê. No modo padrão, o **partial caching**, as escritas vão para um disco de diferença local, e as leituras dos arquivos originais da imagem vêm de um disco base gerenciado. O **full caching** copia o disco inteiro para o armazenamento local e elimina a dependência do armazenamento remoto em regime normal. Ele está disponível de forma geral nas regiões públicas, para tamanhos com oito ou mais vCPUs, e exige disco local maior que o dobro do disco do SO mais 1 GiB.

## O que você ganha

**Latência menor no disco do sistema.** Leitura e escrita acontecem no armazenamento local, com latência parecida com a do disco temporário. O desempenho depende desse armazenamento, e a documentação recomenda tamanhos com SSD Premium ou NVMe local.

**Reimage rápido.** O reimage devolve a VM ou a instância do scale set ao estado original de boot, e com disco efêmero isso é mais rápido.

**Custo.** A documentação do Azure Batch descreve o disco efêmero como sem custo de armazenamento, e o guia de AKS do Architecture Center diz que ele está incluído no preço da VM, como o disco temporário. A página principal faz uma ressalva: se você escolher Standard SSD ou Premium SSD como disco base (melhora o SLA e a leitura), paga a cobrança desse disco base, nos dois modos de cache.

## O que você perde

Aqui está a parte que vira chamado de suporte. A lista de operações que apagam o sistema é maior do que parece.

**Não existe stop-deallocate.** VMs com disco efêmero não podem ser desalocadas. Se você quer parar de pagar pela VM, a saída é excluir e recriar.

**Algumas operações reprovisionam o sistema.** Mudar o tamanho da VM, fazer redeploy e a manutenção por service healing apagam o disco do SO e reprovisionam a partir da imagem. A live migration preserva os dados. Qualquer coisa instalada à mão depois do boot pode sumir num evento que você não controla.

**Recursos de proteção não funcionam.** A documentação lista como não suportados: captura de imagem da VM, snapshot de disco, Azure Disk Encryption, Azure Backup, Azure Site Recovery e troca de disco do SO. Tentar abrir o disco no portal dá "Resource not Found", e isso é esperado.

**Decisões que só valem na criação.** O disco efêmero só pode ser escolhido ao criar a VM ou o scale set. Não dá para converter uma VM existente, não dá para redimensionar o disco depois e não dá para mudar o placement sem recriar. Num scale set, não é possível misturar instâncias com disco efêmero e persistente.

**Segurança tem asteriscos.** Com Trusted Launch, chaves ou segredos que o vTPM gerar depois da criação podem não ser salvos e se perder num reimage ou num healing. Com chave gerenciada pelo cliente, atualizar a versão ou rotacionar a chave não é suportado: a VM precisa ser excluída e recriada.

## A conta de tamanho que trava o deploy

O disco do SO da imagem precisa caber no armazenamento local escolhido. O limite é o tamanho do cache, do temp disk ou do NVMe da VM, ou 2.040 GiB, o que for menor.

Para calibrar, pelos exemplos da documentação: uma imagem Windows Server padrão do Marketplace tem cerca de 127 GiB, e uma Ubuntu padrão, cerca de 30 GiB. As marcadas como `[smallsize]` ficam por volta de 30 GiB e cabem na maioria dos tamanhos.

Três efeitos colaterais merecem atenção:

- **No temp disk, o espaço e o desempenho são divididos.** O temp disk que sobra é o tamanho original menos o tamanho da imagem, e o disco do SO compartilha IOPS com ele.
- **No NVMe, o disco usado vai inteiro para o SO.** O espaço que sobra não volta, então a documentação sugere aumentar o disco do SO até ocupar o NVMe. Com vários discos NVMe, os não usados voltam como disco local bruto.
- **Trusted Launch reserva 1 GiB** do armazenamento local para o estado de convidado da VM. Uma imagem que cabia exatamente passa a não caber, e o deploy falha.

No AKS, essa conta é feita automaticamente: se a combinação de tamanho de VM e tamanho de disco do SO comporta disco efêmero e você não pediu disco gerenciado, o node pool já nasce com disco efêmero.

## Quando faz sentido

O perfil certo, nas palavras da Microsoft: cargas stateless, que toleram a falha de uma VM, mas sofrem com o tempo de deploy ou de reimage. Onde eu usaria sem pensar duas vezes:

**Scale sets que escalam e reciclam instâncias.** Se o [VMSS Flexible absorve picos com autoscale](/posts/vmss-flexible-autoscale-pico/), cada instância nova é descartável por definição. Pagar e esperar por um disco persistente nelas é custo sem retorno.

**Node pools do AKS.** A documentação do AKS recomenda disco efêmero sempre que possível, com ganho no scaling e nos upgrades do cluster.

**Agentes de build.** A documentação dos scale set agents do Azure Pipelines recomenda habilitar disco efêmero quando o tamanho da VM suporta, justamente para reduzir o tempo de reimage. A criação usa os mesmos parâmetros documentados para VMs:

```bash
az vmss create \
  --resource-group rg-build-agents \
  --name vmss-agentes \
  --image <imagem> \
  --vm-sku Standard_D2ads_v5 \
  --ephemeral-os-disk true \
  --ephemeral-os-disk-placement ResourceDisk \
  --os-disk-caching ReadOnly
```

O que **não** combina: VM configurada à mão, VM que precisa de backup ou Site Recovery, VM desligada à noite para economizar.

## A imagem passa a ser o estado

Se o reimage devolve a VM ao estado da imagem, tudo que a VM precisa ter tem que estar na imagem ou ser aplicado no boot.

Por isso disco efêmero e [golden image com Azure Compute Gallery e Image Builder](/posts/golden-image-azure-compute-gallery-image-builder/) andam juntos. O disco efêmero é suportado com imagens do Marketplace, imagens customizadas e imagens da Compute Gallery. A configuração vai para a imagem, o que é específico da instância vai para extensão ou custom data, e o dado que precisa sobreviver vai para um disco de dados gerenciado (que pode ser anexado normalmente) ou para fora da VM.

Um cuidado, que é dedução minha: como captura de imagem não é suportada com disco efêmero, a VM usada para construir a imagem precisa ter disco gerenciado. A esteira de imagem e a frota são coisas diferentes.

## O que fica

Na minha opinião, disco efêmero é um teste de maturidade disfarçado de otimização de disco. Ele só funciona bem em quem já trata VM como gado, com imagem versionada e configuração automatizada. Em quem ainda trata VM como animal de estimação, ele transforma um redimensionamento num incidente.

O ganho em latência e reimage é real, mas o ganho maior é outro: ele obriga o time a provar que consegue recriar a máquina do zero.

Se uma VM da sua frota sumisse agora, em quanto tempo outra igual estaria rodando sem intervenção manual?
