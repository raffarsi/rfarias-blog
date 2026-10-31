---
layout: ../../layouts/PostLayout.astro
title: "Spot VMs no Azure: quando o desconto vale o risco de a VM sumir"
category: "Infra"
tag: "infra"
date: "05 Nov 2026"
readTime: "8 min"
description: "Spot VM é capacidade ociosa do Azure com desconto alto e sem SLA, que pode ser retomada com até 30 segundos de aviso. Como funciona o despejo, quando vale usar, quando não vale e como misturar Spot e VMs comuns no mesmo scale set sem apostar a produção."
---

A economia aparece na primeira fatura e convence todo mundo. O ambiente de testes migra para Spot, e ninguém sente diferença.

O problema começa quando a mesma lógica é aplicada a um processamento que não pode parar no meio. Num momento de demanda alta na região, as VMs são despejadas, o processamento recomeça do zero e o resultado atrasa.

A Spot VM não falhou. Ela fez exatamente o que promete. A escolha errada foi colocar ali uma carga que não podia ser interrompida.

## O que é uma Spot VM, sem marketing

Spot é capacidade que o Azure tem sobrando naquele momento, vendida com desconto alto. A documentação do Azure fala em economia de até 90% em computação. O desconto existe porque a capacidade não é sua: quando o Azure precisa dela de volta, a VM é despejada.

Três características definem o modelo:

**Não há SLA.** Nem de disponibilidade, nem de alocação. Se não houver capacidade, a VM nem sobe.

**O aviso é curto.** O Azure tenta avisar até 30 segundos antes do despejo, por meio do Scheduled Events, e mesmo esse aviso é entregue no melhor esforço.

**A decisão é tomada na criação.** Não dá para converter uma VM comum em Spot, nem uma Spot em comum. Quem quiser mudar de ideia vai recriar a VM.

## Por que a VM é despejada

São dois motivos, e vale separar.

**Capacidade.** O Azure precisa da capacidade para cargas que pagam o preço normal. Esse despejo pode acontecer a qualquer momento, independente do preço que você aceitou pagar.

**Preço.** O preço da Spot varia por região e tamanho. Ao criar a VM, você define um preço máximo. Se o preço atual passar dele, a VM é despejada. Se você definir o preço máximo como -1, a VM não é despejada por preço: você paga o preço atual da Spot, nunca acima do preço normal da VM. O despejo por capacidade continua valendo.

Um detalhe operacional: para mudar o preço máximo, é preciso desalocar a VM antes.

## Deallocate ou Delete

Ao criar a VM, você escolhe o que acontece no despejo.

**Deallocate**, o padrão, para a VM e mantém os discos. Ela pode ser religada depois, mas não há garantia de que haverá capacidade. Enquanto isso, os discos continuam sendo cobrados e a VM continua ocupando a sua cota.

**Delete** apaga a VM junto com os discos, e o armazenamento deixa de ser cobrado.

A escolha costuma ser feita no automático, e o padrão é justamente o que pode deixar custo e cota parados sem ninguém perceber.

## Quando vale

A pergunta que eu faço antes de qualquer outra: **se a VM sumir agora, o que se perde?**

Se a resposta for "um pedaço de trabalho que recomeça sozinho", Spot é uma boa escolha. É o caso de processamento em lote que salva o progresso, renderização, agentes de build e de CI, ambientes de desenvolvimento e teste, e cargas que já rodam em várias instâncias atrás de uma fila.

Se a resposta for "o usuário percebe" ou "o trabalho volta para o começo", não é.

## Quando não vale

**Uma única instância atendendo usuário.** Sem outra VM para assumir, o despejo vira indisponibilidade.

**Trabalho longo sem checkpoint.** Trinta segundos não salvam horas de processamento em memória.

**Quando você precisa da capacidade agora.** Se o despejo acontece porque falta capacidade na região, tentar criar outra Spot no mesmo momento tende a falhar pelo mesmo motivo. A própria Microsoft recomenda VM comum quando a capacidade precisa estar disponível de imediato.

## Escolha o tamanho e a região olhando o histórico

Na criação da VM pelo portal, ao marcar a opção de desconto Spot, aparece o link para ver o histórico de preço e a taxa de despejo, inclusive comparando regiões próximas. A taxa de despejo é por hora: 10% significa 10% de chance de a VM ser despejada na próxima hora, com base nos últimos sete dias.

O mesmo dado está no Azure Resource Graph, na tabela SpotResources, com histórico de preço de 90 dias e taxa de despejo dos últimos 28. Uma consulta para comparar dois tamanhos em duas regiões:

```kusto
SpotResources
| where type =~ 'microsoft.compute/skuspotevictionrate/location'
| where sku.name in~ ('standard_d2s_v5', 'standard_d4s_v5')
| where location in~ ('brazilsouth', 'eastus')
| project skuName = tostring(sku.name), location, spotEvictionRate = tostring(properties.evictionRate)
| order by skuName asc, location asc
```

Às vezes, o tamanho vizinho ou a região ao lado tem preço menor, taxa de despejo menor, ou as duas coisas.

## Produção com Spot, sem apostar tudo

Existe um meio-termo para cargas de produção que escalam horizontalmente: o **Spot Priority Mix**, nos Virtual Machine Scale Sets com orquestração Flexible. Ele mistura VMs comuns e Spot no mesmo scale set, com duas configurações:

**A base de VMs comuns** (`baseRegularPriorityCount`) é a quantidade mínima de VMs que nunca são despejadas.

**O percentual acima da base** (`regularPriorityPercentageAboveBase`) define quantas das VMs que passarem da base serão comuns. O restante é Spot.

![Spot Priority Mix com base de 10 VMs comuns e 50% acima da base: com 30 VMs, ficam 10 da base, 10 comuns e 10 Spot](/images/posts/spot-vms-azure-quando-vale-o-risco/spot-priority-mix.svg)

Com base 10 e 50%, um scale set com 30 VMs tem as 10 da base, mais 10 comuns e 10 Spot. Se todas as Spot forem despejadas ao mesmo tempo, a aplicação perde capacidade, mas não sai do ar.

Duas observações da documentação: o recurso não existe na orquestração Uniform, e mudar a configuração não rebalanceia as VMs que já existem. A nova divisão vale a partir da próxima operação de escala.

Para aproveitar os 30 segundos de aviso, a aplicação precisa ouvir o Scheduled Events e reagir: parar de aceitar trabalho novo, devolver à fila o que estava em andamento e sair do balanceador.

## Três cuidados antes de ligar

**A cota de Spot é separada.** Ter cota para VMs comuns não garante cota para Spot. O pedido de aumento segue o processo normal de cota.

**Nem todo tamanho aceita Spot.** A série B e as versões promocionais de alguns tamanhos ficam de fora.

**Deallocate tem custo invisível.** Discos cobrados e cota ocupada por VMs que talvez nunca voltem. Se a carga não precisa dos discos depois do despejo, Delete costuma ser a escolha mais honesta.

## O que fica

Spot não é uma VM barata. É uma VM com outro contrato: você paga menos e aceita que ela pode ir embora com meio minuto de aviso. Quando a arquitetura foi desenhada para isso, o desconto é dinheiro de verdade. Quando não foi, o desconto vira o custo de um incidente.

Se todas as suas VMs Spot fossem despejadas agora, o que o seu usuário perceberia?
