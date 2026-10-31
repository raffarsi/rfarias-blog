---
layout: ../../layouts/PostLayout.astro
title: "Mesma zona não é mesmo prédio: Proximity Placement Groups e a latência entre VMs"
category: "Infra"
tag: "infra"
date: "12 Nov 2026"
readTime: "8 min"
description: "Quando a aplicação conversa com o banco milhares de vezes por segundo, a distância física entre as VMs vira gargalo. Como o Proximity Placement Group coloca tudo no mesmo datacenter, o que o parâmetro intent resolve e o preço que se paga em flexibilidade."
---

É uma conversa comum depois de uma migração. A aplicação foi para o Azure com VMs do mesmo porte, o banco tem folga, a CPU está tranquila dos dois lados. E, mesmo assim, o processamento em lote demora mais do que demorava no datacenter antigo.

Ninguém acha gargalo de CPU, memória ou disco. O que mudou não aparece no painel de métricas: a distância física entre o servidor de aplicação e o banco.

Para a maioria das aplicações, essa distância não faz diferença nenhuma. Para algumas, ela é o problema inteiro.

## Quando a distância física pesa

Toda consulta pela rede paga a ida e a volta. Se a aplicação faz poucas consultas grandes, esse custo some no meio do resto. Se faz milhares de consultas pequenas, uma depois da outra, ele se acumula e vira o tempo de execução.

A documentação de SAP no Azure descreve exatamente esse padrão. Em sistemas SAP NetWeaver ou S/4HANA, a lógica de negócio roda na camada de aplicação, que dispara consultas ao banco numa taxa de milhares ou dezenas de milhares por segundo. Muitas delas rodam no banco em 500 microssegundos ou menos. Com consultas tão rápidas, o tempo de rede entre as camadas passa a pesar direto na duração dos processos de negócio.

Não é só SAP. O guia de HPC do Well-Architected Framework recomenda Proximity Placement Groups para aproximar nós de cálculo em cargas fortemente acopladas, que trocam mensagens o tempo todo. E a documentação do AKS cita jogos, simulações de engenharia e negociação de alta frequência como exemplos de aplicações que pedem baixa latência.

O traço em comum é sempre o mesmo: muitas trocas pequenas e sequenciais entre máquinas. É isso que você procura no seu ambiente antes de pensar no recurso.

## Região, zona e datacenter não são a mesma coisa

Colocar as VMs na mesma região já reduz a distância. Colocar na mesma zona de disponibilidade aproxima mais. Só que a documentação faz um alerta que passa despercebido: com o crescimento do Azure, uma única zona pode ser formada por vários datacenters físicos. Duas VMs na zona 1 podem estar em prédios diferentes.

O Proximity Placement Group (PPG) cuida dessa última camada. É um recurso do Azure que funciona como uma restrição de colocalização: as VMs que apontam para ele ficam no mesmo datacenter. A documentação de SAP detalha um pouco mais e fala em agrupar as VMs sob o mesmo network spine.

![Comparação dentro de uma mesma zona de disponibilidade: sem PPG, a VM de aplicação e a VM de banco podem cair em datacenters diferentes; com PPG, as duas ficam no mesmo datacenter, fixado pela primeira VM implantada](/images/posts/proximity-placement-groups-latencia-vms/ppg-mesmo-datacenter.svg)

O PPG vale para VMs avulsas, availability sets e scale sets, e dá para misturar tudo no mesmo grupo. O exemplo da própria documentação é um backend em série M num availability set junto com um front-end em série D num scale set, os dois no mesmo PPG. Em availability sets e scale sets, o grupo é configurado no recurso, não em cada VM. Se você precisa revisar a diferença entre esses modelos, ela está em [disponibilidade de VMs](/posts/az104-07-vm-disponibilidade/).

Um PPG não atravessa zonas. Se você combina zona com PPG, todas as VMs do grupo precisam estar na mesma zona.

## Quem chega primeiro escolhe o datacenter

Este é o detalhe que mais gera erro. O PPG não nasce preso a um datacenter. Ele é fixado quando o primeiro recurso é implantado nele, e só volta a ficar livre quando todos os recursos do grupo são desalocados ou apagados.

O problema é que nem todo tamanho de VM existe em todo datacenter. Se a primeira VM for de uma série comum, o Azure escolhe um datacenter que tem essa série. Quando a VM de banco, de uma série especial, vier em seguida, pode ser que aquele prédio não tenha o hardware. O resultado é o erro **OverconstrainedAllocationRequest**.

A documentação aponta três saídas. Implantar as VMs numa sequência e, se uma falhar, recomeçar pelo tamanho que falhou. Colocar todos os tamanhos no mesmo template ARM. Ou, a melhor delas, usar o parâmetro **intent**.

Com intent, você informa na criação do PPG a lista de tamanhos que pretende usar e, se quiser, uma zona. O Azure só cria o grupo se encontrar pelo menos um datacenter que suporte todos os tamanhos da lista. Se não houver, a falha acontece ali, antes de existir qualquer VM:

```bash
az ppg create \
   -n myPPG \
   -g myPPGGroup \
   -l eastus \
   -t standard \
   --intent-vm-sizes Standard_E64s_v4 Standard_M416ms_v2 \
   -z 1
```

Algumas regras do intent. A zona só pode ser informada junto com o intent, é uma zona só, e ela não muda depois da criação. O intent não está disponível no portal: vai por ARM, CLI ou PowerShell, com API 2021-11-01 ou mais nova. Num PPG que já existe, ele pode ser incluído ou alterado depois que todas as VMs forem desalocadas.

E o que o intent não faz: reservar capacidade. A documentação deixa isso em destaque. Ele escolhe um datacenter que tem os tamanhos, mas não garante que vai haver máquina livre na hora do deploy.

## O preço da proximidade

O PPG é mais uma restrição na alocação. E toda restrição a mais aumenta a chance de a alocação falhar.

Cargas elásticas sentem primeiro. Um scale set que cresce e encolhe dentro de um PPG pode receber **AllocationFailure** ao tentar crescer, porque só pode crescer naquele datacenter. Isso conversa mal com o desenho de [scale set que absorve pico](/posts/vmss-flexible-autoscale-pico/). O mesmo vale para quem economiza desalocando VMs fora do horário: a capacidade não fica guardada, e a VM pode não voltar a ligar.

A reação natural seria reservar capacidade, mas aqui não dá. O On-demand Capacity Reservation, que eu discuti em [capacidade e zonas](/posts/azure-capacity-reservation-zonas-alocacao/), não suporta deploy com PPG. Também não dá para usar PPG com Dedicated Host.

Redimensionar fica mais arriscado. A documentação de SAP avisa que o tamanho novo pode não existir no datacenter em que o grupo está.

Há ainda a manutenção planejada. Quando o Azure desativa hardware de um datacenter, recursos do grupo podem ir para outro prédio, e a colocalização se perde sem ninguém mexer em nada. Dá para acompanhar pelo status de colocalização, que mostra Aligned, Unknown (alguma VM desalocada) ou Not aligned:

```bash
az ppg show --name myPPG --resource-group myPPGGroup --include-colocation-status
```

Se aparecer Not aligned, a correção é desalocar e ligar de novo os recursos afetados. Em availability set ou scale set, todas as VMs do conjunto precisam ser desalocadas antes de religar.

## Quando eu não usaria

**Sem medição de latência.** PPG é resposta para um problema medido, não otimização preventiva. A documentação de SAP é direta: usar quando a latência entre aplicação e banco é alta demais e afeta a carga. E acrescenta que, na maioria das situações, o deploy zonal sozinho já atende.

**Para agrupar um ambiente inteiro.** A orientação é um PPG por sistema, com o mínimo de tipos e de quantidade de VMs. Quanto mais coisa no grupo, maior a chance de faltar um tamanho no datacenter escolhido.

**Quando resiliência vem antes de latência.** A documentação coloca nesses termos: se latência é a prioridade, PPG e a solução inteira numa zona; se resiliência é a prioridade, instâncias espalhadas entre zonas. Para SAP em alta disponibilidade entre duas zonas, cada zona tem o seu próprio PPG.

**Em carga muito elástica.** Se o scale set dobra de tamanho no pico, cada expansão depende de capacidade num único prédio.

E, quando usar, combine com accelerated networking. É a primeira boa prática da lista da Microsoft para chegar à menor latência possível.

## O que fica

O PPG não deixa nada mais rápido por mágica. Ele tira da mesa uma variável, a distância física, e cobra por isso em flexibilidade: menos tamanhos possíveis, mais chance de falha na alocação, escala presa a um prédio, nenhuma reserva de capacidade. Na minha opinião, vale quando a medição mostra que essa variável é o gargalo. Fora disso, é risco sem retorno.

O caminho que eu defendo é este: zona primeiro, accelerated networking, medição real entre as camadas e, só então, PPG com intent, um sistema por vez.

Você já mediu a latência entre a sua aplicação e o banco, ou o PPG entraria no projeto por precaução?
