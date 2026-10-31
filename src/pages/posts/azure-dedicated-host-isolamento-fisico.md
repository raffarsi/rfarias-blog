---
layout: ../../layouts/PostLayout.astro
title: "Um servidor físico só seu no Azure: quando o Dedicated Host é exigência e quando é desperdício"
category: "Infra"
tag: "infra"
date: "19 Nov 2026"
readTime: "8 min"
description: "Isolamento físico, licença por host e controle de manutenção justificam o Azure Dedicated Host. Fora disso, você paga por um servidor inteiro que fica pela metade. Como funcionam host groups, fault domains, cobrança e capacidade, e quando uma VM isolada resolve."
---

O pedido costuma chegar por escrito, vindo da área de risco: "este sistema não pode dividir servidor físico com outro cliente". Às vezes vem do time de licenciamento, com uma planilha de cores de SQL Server que precisam ir para a nuvem sem virar uma conta nova. Às vezes vem de quem opera um sistema que não tolera nem alguns segundos de pausa.

Os três pedidos levam ao mesmo lugar: o Azure Dedicated Host. E os três escondem a mesma armadilha. A partir do momento em que o host é criado, você paga por ele inteiro, tenha uma VM ou trinta rodando em cima.

## O que você recebe de fato

O Dedicated Host é um servidor físico do datacenter do Azure entregue a uma única assinatura. O servidor é alocado quando o host é criado, e nenhuma VM de outro cliente é colocada nele.

O isolamento é do servidor, não do datacenter. A documentação deixa claro que os hosts dedicados compartilham a mesma rede e a mesma infraestrutura de armazenamento dos hosts comuns. Se o requisito de compliance fala em rede ou storage segregados, o Dedicated Host sozinho não responde a ele.

No desenho entram dois recursos novos. O **host group** é a coleção de hosts, criada numa região e, opcionalmente, numa zona. O **host** representa o servidor físico e tem um SKU que define quais tamanhos de VM cabem nele.

## Fault domain e zona: a disponibilidade agora é problema seu

Com host dedicado, o desenho de falha passa para as suas mãos. A recomendação da Microsoft é ter várias VMs espalhadas em pelo menos dois hosts.

Um host group fica numa única zona. Para alta disponibilidade entre zonas, você cria um host group por zona e distribui os hosts entre eles. Dentro do grupo, cada host recebe um fault domain, e hosts em fault domains diferentes ficam em racks físicos diferentes. As VMs não recebem fault domain próprio: ficam no do host onde estão.

![Host group em uma zona com dois fault domains, cada um com hosts dedicados da mesma família rodando várias VMs de um único cliente, em contraste com um host compartilhado que recebe VMs de vários clientes](/images/posts/azure-dedicated-host-isolamento-fisico/host-group-fault-domains.svg)

Dois detalhes que costumam passar batido. Fault domain é escopo do host group: não dá para presumir que hosts de dois grupos diferentes estão separados, a não ser que estejam em zonas diferentes. E mesmo fault domain não significa proximidade física. E o [proximity placement group](/posts/proximity-placement-groups-latencia-vms/) não combina com host dedicado: a VM precisa sair dele antes de ir para um host.

Na criação, a CLI fica assim (adaptado dos exemplos da documentação, com zona 1, dois fault domains e posicionamento automático):

```bash
az vm host group create \
   --name myHostGroup \
   -g myDHResourceGroup \
   -z 1 \
   --platform-fault-domain-count 2 \
   --automatic-placement true

az vm host create \
   --host-group myHostGroup \
   --name myHost \
   --sku DSv3-Type1 \
   --platform-fault-domain 1 \
   --auto-replace true \
   -g myDHResourceGroup
```

O **posicionamento automático** deixa o Azure escolher o host dentro do grupo, e você continua podendo apontar um host específico quando quiser. Ele é obrigatório para scale sets em host dedicado, mas a VM posicionada assim não pode ser reimplantada (redeploy), e algumas séries ficam de fora.

O `--auto-replace` merece atenção. Ligado, se o host falhar, o Azure move as VMs para um servidor saudável, com uma parada curta. Desligado, a mudança fica por sua conta. E a escolha não muda depois da criação.

## Manutenção no seu horário

Esse é o argumento técnico mais forte, e o que menos aparece nas conversas.

Com o Maintenance Configurations no escopo Host, você pode segurar as atualizações de plataforma e aplicá-las quando quiser, dentro de uma janela de 35 dias. A janela mínima é de duas horas, e dá para aplicar host por host, na ordem que fizer sentido. Passados os 35 dias, a Microsoft aplica o que estiver pendente, e aí a ordem pode não respeitar os seus fault domains.

O contraponto: pelo FAQ da documentação, hosts dedicados não têm live migration. Se o hardware falha, o caminho é o service healing para outro servidor, com reinício das VMs.

## Como a cobrança funciona

A cobrança é por host, não importa quantas VMs ele tenha. As VMs continuam aparecendo na fatura, com preço zero. O preço do host depende da família, do tipo de hardware e da região, e é proporcional ao maior tamanho de VM que o host suporta.

Licença de software, armazenamento e rede são cobrados à parte, como sempre. E o host vazio é cobrado igual: a documentação recomenda apagar o que não está em uso. Para quem vai manter o servidor por muito tempo, existe instância reservada (Reserved Instance) de Dedicated Host.

Antes de criar o primeiro host, olhe a cota. Um host consome cota de vCPU de Dedicated Host e cota da família de VM correspondente. Assinaturas de avaliação gratuita e MSDN não têm cota para o serviço.

## Licença: onde a conta pode virar

Para quem tem Windows Server e SQL Server com Software Assurance (ou licenças por assinatura qualificadas), o Azure Hybrid Benefit vale no Dedicated Host. A documentação do SQL Server em host dedicado diz que clientes de Windows Server Datacenter e SQL Server Enterprise que licenciam o host inteiro com Azure Hybrid Benefit têm virtualização ilimitada: quantas VMs couberem na capacidade física do servidor.

Para licenças de SQL Server adquiridas antes de 1º de outubro de 2019, existem também regras próprias de alocação por host, detalhadas nos Product Terms.

Minha opinião: aqui o arquiteto para e chama quem cuida de licenças. O que vale é o seu contrato e os Product Terms, não o diagrama.

## Encher o host é o trabalho

O SKU do host define a série de VM e o tipo de hardware, como DSv3-Type1. Um host roda VMs de tamanhos diferentes desde que sejam da mesma série. Num host Dsv3, cabem D2s_v3, D8s_v3 e D16s_v3 ao mesmo tempo, mas não uma VM de outra família.

Para saber quanto espaço ainda sobra, a documentação mostra este comando:

```bash
az vm host get-instance-view \
   -g myDHResourceGroup \
   --host-group myHostGroup \
   --name myHost
```

A saída traz, para cada tamanho da série, quantas VMs ainda cabem. Vale olhar antes de criar: se o host não tiver recurso suficiente, a VM é criada em estado FAILED.

A família do host não muda depois de criado. O tipo de hardware só muda por resize, e só para uma geração mais nova da mesma família, com o host e as VMs indisponíveis durante a operação e perda dos dados não persistentes, como o disco temporário.

## Limitações que entram no desenho

- VMs com rede acelerada (accelerated networking) não podem ser criadas em host dedicado.
- Para mover uma VM existente, ela precisa estar desalocada, ser da mesma família do host, estar na mesma região e na mesma zona, e não pode estar num availability set nem num proximity placement group.
- Ultra Disk é configurado no host group, na criação, e não muda depois.

## Quando é desperdício

Se o requisito é só "nenhum outro cliente no mesmo servidor" e a carga é uma VM grande, existem os tamanhos isolados. Eles garantem que a sua VM é a única naquele servidor e também aceitam maintenance control. A documentação cita um prêmio de cerca de 10% sobre o tamanho não isolado e avisa que esses tamanhos têm vida útil ligada ao hardware.

Se a preocupação é proteger os dados enquanto são processados, a documentação aponta as Confidential VMs, com criptografia baseada em hardware e sem isolamento físico.

E se não há requisito, só a sensação de que "dedicado é mais seguro", o host vira um servidor caro pela metade.

## O que fica

Na minha leitura, o Dedicated Host se paga em três situações: um requisito formal de isolamento físico, uma estratégia de licença por host que de fato reduz a conta e uma carga que precisa decidir quando a manutenção acontece. Fora delas, é capacidade parada com fatura cheia.

O ponto que mais pesa no dia a dia não é a criação do host. É mantê-lo cheio, com a família certa, em pelo menos dois fault domains. Isso é capacidade planejada, como a [reserva de capacidade em zonas](/posts/azure-capacity-reservation-zonas-alocacao/), só que com o servidor inteiro na sua conta.

Seu requisito de isolamento fala mesmo de servidor físico, ou alguém leu "isolado" e parou de ler?
