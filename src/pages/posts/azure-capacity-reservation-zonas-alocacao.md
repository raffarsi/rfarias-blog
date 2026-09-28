---
layout: ../../layouts/PostLayout.astro
title: "Capacity Reservation no Azure: o dia em que a região secundária não tinha a sua VM"
category: "Infra"
tag: "infra"
date: "08 Out 2026"
readTime: "8 min"
description: "Cota aprovada e plano de DR revisado não garantem que o Azure tenha o tamanho de VM que você escolheu quando você precisar. Como ler os erros de alocação, checar restrições de SKU por zona e usar On-demand Capacity Reservation para transformar a esperança em reserva."
---

O plano de recuperação de desastre estava aprovado havia meses. A região secundária tinha rede, imagens replicadas e cota de vCPU liberada para a família escolhida. No exercício de mesa, o failover fechava com folga. No dia do teste real, a automação começou a criar as VMs na região secundária e parou na terceira, com um erro que ninguém tinha previsto no documento: não havia capacidade para aquele tamanho naquela zona.

Nada estava quebrado. O que faltava era hardware livre para o tamanho pedido, no lugar pedido, naquele momento. E o plano inteiro partia do pressuposto de que isso nunca faltaria.

## O que o erro estava dizendo

Ao criar, iniciar uma VM desalocada ou redimensionar, o Azure precisa alocar recursos de computação para a assinatura, e esse pedido pode falhar por demanda alta numa região ou zona. Os códigos que aparecem são estes:

| Código | O que significa | Primeira coisa que eu faço |
|--------|-----------------|----------------------------|
| AllocationFailed / ZonalAllocationFailed | Não há capacidade suficiente para o tamanho pedido na região ou na zona | Tento outra zona, outro tamanho ou espero e repito |
| OverconstrainedAllocationRequest / OverconstrainedZonalAllocationRequest | A combinação de restrições do pedido não cabe em nenhum lugar disponível | Reviso as restrições: zona, PPG, rede acelerada, disco efêmero, Ultra Disk ou Premium SSD v2 |
| SkuNotAvailable | O tamanho não está disponível para a assinatura naquela região ou zona | Consulto as restrições do SKU e, se precisar, abro pedido de acesso ao suporte |
| OperationNotAllowed (limite de Core) | A cota de vCPU da assinatura estourou | Peço aumento de cota |

Os dois primeiros são capacidade física, o terceiro é restrição da assinatura, o quarto é só cota. Parecem a mesma coisa no pipeline vermelho, mas cada um tem uma saída diferente.

O detalhe que mais pesa no DR: quanto mais restrições o pedido carrega, menor o conjunto de clusters candidatos. A documentação sugere, como contorno, remover a restrição zonal para ampliar as opções para a região inteira. Num failover desenhado com VMs zonais, essa saída pode não ser aceitável.

## Cota não é capacidade

Esse é o ponto que derruba muito plano de DR. A documentação de cotas é direta: o Azure verifica cota e capacidade separadamente. Cota é a permissão da sua assinatura para implantar um certo número de vCPUs ou VMs. Capacidade é o recurso físico disponível na região ou zona selecionada. Mesmo com cota suficiente, a implantação pode falhar.

O aumento de cota aprovado não reserva nenhum servidor. Ele só remove um limite administrativo. Conferir a cota continua necessário, e é a parte fácil:

```bash
az vm list-usage --location southcentralus --output table
```

## Olhar a região antes de escolher o tamanho

Antes de discutir reserva, eu quero saber se o tamanho está liberado para a assinatura em cada zona da região secundária. Por padrão o `az vm list-skus` esconde os SKUs com restrição, e é o `--all` que mostra o que está bloqueado:

```bash
az vm list-skus \
  --location southcentralus \
  --resource-type virtualMachines \
  --size Standard_D8s_v5 \
  --zone \
  --all \
  --output table
```

O `--zone` não recebe número: filtra os SKUs que suportam zonas. A coluna que importa é a de restrições. Um `NotAvailableForSubscription, type: Zone` seguido de uma lista de zonas quer dizer que aquele tamanho existe na região, mas a sua assinatura não pode usá-lo naquelas zonas.

Para automatizar, eu prefiro JSON, já trazendo se o tamanho aceita capacity reservation:

```bash
az vm list-skus \
  --location southcentralus \
  --size Standard_D8s_v5 \
  --all \
  --query "[?name=='Standard_D8s_v5'].{tamanho:name, zonas:locationInfo[0].zones, restricoes:restrictions[].{motivo:reasonCode, tipo:type, zonas:restrictionInfo.zones}, reserva:capabilities[?name=='CapacityReservationSupported'].value | [0]}" \
  --output json
```

O limite dessa consulta: ela mostra restrições da assinatura, não capacidade livre. Um SKU sem restrição ainda pode devolver `ZonalAllocationFailed` no dia errado.

## Reservar a capacidade de verdade

O On-demand Capacity Reservation reserva capacidade de computação para um tamanho de VM, numa região ou numa zona, pelo tempo que você quiser. Não tem prazo de compromisso: você cria e apaga quando quiser, e a capacidade fica reservada até a reserva ser apagada.

A montagem tem duas peças. O **capacity reservation group** é o contêiner: define a região e, opcionalmente, as zonas elegíveis. A criação do grupo não reserva nada, então um pedido bem formado sempre funciona. A **capacity reservation** é a reserva em si: um tamanho, uma quantidade e, num grupo zonal, uma zona. O grupo aceita uma reserva por tamanho por zona.

```bash
az capacity reservation group create \
  -n crg-dr-southcentralus \
  --resource-group rg-dr-compute \
  --location southcentralus \
  --zones 1 2 3

az capacity reservation create \
  --capacity-reservation-group crg-dr-southcentralus \
  --name cr-d8sv5-zona1 \
  --resource-group rg-dr-compute \
  --location southcentralus \
  --sku Standard_D8s_v5 \
  --capacity 4 \
  --zone 1
```

A criação da reserva é tudo ou nada: se você pede quatro instâncias e o Azure só consegue três, ela falha inteira. E exige cota, como se você criasse as VMs. A diferença para a abertura é que essa falha acontece hoje, numa terça-feira qualquer, e não no meio do desastre.

A reserva só é consumida por quem pede. A VM precisa referenciar o grupo explicitamente, e o tamanho e a zona precisam casar com uma reserva do grupo:

```bash
az vm create \
  --resource-group rg-dr-app \
  --name vm-app-dr-01 \
  --location southcentralus \
  --zone 1 \
  --size Standard_D8s_v5 \
  --image Ubuntu2204 \
  --capacity-reservation-group /subscriptions/<id-assinatura>/resourceGroups/rg-dr-compute/providers/Microsoft.Compute/capacityReservationGroups/crg-dr-southcentralus
```

Num grupo regional, sem zonas, o Azure escolhe a zona e as VMs associadas são criadas sem especificar zona. Para scale sets, o parâmetro também existe no `az vmss create` e no `az vmss update`: no modo Uniform a associação é no próprio scale set, com `singlePlacementGroup` em `false`; no Flexible, vai no perfil de VM do scale set (ou, sem perfil, na VM implantada) e, num scale set que já existe, também em cada VM já implantada.

Para VMs zonais já rodando, há um caminho sem desalocar, ainda em preview: criar reservas com quantidade zero em cada zona, associar as VMs (a reserva fica sobrealocada) e subir a quantidade até o número de VMs. VMs regionais precisam ser desalocadas.

## Quanto custa ter a vaga guardada

A reserva é cobrada no preço do tamanho de VM, usada ou não. Reservou dez e roda seis VMs: paga seis VMs e quatro reservas vazias, no mesmo preço. Quando a VM ocupa a vaga, você paga só a VM, sem cobrança dupla.

Reserved Instances e Savings Plan entram como desconto sobre essa cobrança, inclusive sobre a reserva vazia. O que eles não fazem é garantir capacidade. A documentação é explícita sobre as Reserved Instances: dão desconto de cobrança e não garantem capacidade. Nelas existe a opção de prioridade de capacidade, só com escopo de assinatura única, mas ela não tem SLA. O Savings Plan é descrito como oferta de cobrança, que não afeta o estado dos recursos. Quem garante é a capacity reservation, que tem SLA próprio.

Para o DR, o compartilhamento do grupo entre assinaturas, hoje em preview, permite que ambientes menos críticos usem a capacidade reservada enquanto o desastre não vem.

## Onde a reserva não chega

A lista de limitações precisa ser lida antes do projeto:

**Só algumas séries de VM são suportadas.** A lista muda, então eu confio na capability `CapacityReservationSupported` do SKU, e não numa tabela copiada.

**Tipos de implantação fora.** Spot, Dedicated Host e availability sets não são suportados.

**Restrições de posicionamento fora.** Proximity placement group, update domains, scale set com single placement group, Ultra Disk e VMs retomando de hibernação.

**Tamanho e local não mudam.** A reserva só aceita mudança de quantidade; trocar de tamanho é criar outra, migrar as VMs e apagar a antiga. Se um aumento não puder ser atendido, a reserva pode ficar *Failed* até a quantidade voltar ao valor anterior, com as VMs associadas seguindo normalmente.

**Sobrealocação não tem garantia.** Você pode alocar mais VMs do que reservou, mas o excedente passa pela checagem de cota e depende de capacidade livre, sem SLA.

## Antes do dia em que você vai precisar

Para cargas críticas na região principal:

**Escolha o tamanho olhando o SKU, não o catálogo.** Rode o `list-skus` com `--all` na região, confira as restrições das zonas que você usa e confirme `CapacityReservationSupported`.

**Reserve o mínimo que a aplicação precisa para ficar de pé.** O resto pode escalar sob demanda. A reserva paga o piso, não o pico.

**Associe as VMs existentes.** Para VMs zonais, o caminho da reserva de quantidade zero evita desalocar, mas ainda está em preview.

**Tenha um tamanho alternativo testado.** Trocar de tamanho é um dos contornos documentados para falha de alocação, e só serve se a aplicação já foi validada nele.

Para DR em outra região:

**Separe cota de capacidade no plano.** Cota aprovada é pré-requisito, não garantia.

**Reserve na região secundária o que o RTO exige.** Se a aplicação precisa estar de pé em uma hora, a capacidade para isso não pode depender de sorte.

**Faça a automação de failover apontar para o grupo.** Uma reserva que a VM não referencia é dinheiro gasto sem proteção.

**Teste criando VMs de verdade contra a reserva.** Documento revisado não aloca servidor.

**Reveja as reservas quando o tamanho mudar.** Trocou a família na produção, troque a reserva no DR no mesmo ciclo.

## O que fica

Eu não aceitaria mais um plano de DR que lista a região secundária como destino sem dizer de onde vem a capacidade. Nuvem elástica não quer dizer estoque infinito em toda zona, para todo tamanho, a qualquer hora. A reserva custa o mesmo que a VM ligada, e essa conta assusta até ser comparada com descobrir a falta de capacidade no meio de um incidente. Para cada carga crítica, a decisão honesta é escolher entre pagar pela vaga ou aceitar, por escrito, que o failover pode não ter onde rodar.

O seu plano de DR assume que as VMs vão existir na outra região no momento do desastre. O que garante isso hoje?
