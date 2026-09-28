---
layout: ../../layouts/PostLayout.astro
title: "Autoscale no VMSS: por que as instâncias novas chegaram depois do pico"
category: "Infra"
tag: "infra"
date: "01 Out 2026"
readTime: "8 min"
description: "O autoscale estava configurado, disparou no horário certo e mesmo assim a aplicação ficou lenta. As cinco causas que explicam o atraso e o que realmente ajuda em Virtual Machine Scale Sets com orquestração Flexible: perfil por horário, autoscale preditivo, standby pools e health extension."
---

A aplicação ficou lenta no horário de pico. Quando fui olhar o histórico, o autoscale tinha disparado, e no momento certo. O problema estava na linha de baixo: as instâncias novas só começaram a atender quando o pico já tinha passado. Alguém escreveu no relatório que o autoscale não funcionou. Funcionou: fez exatamente o que estava configurado.

É por isso que esse tipo de falha é traiçoeiro. Não há erro no log, não há regra quebrada. Há minutos somados em lugares diferentes, e cada um parece inofensivo sozinho. O diagnóstico que eu faço é percorrer esses lugares, um de cada vez.

## Causa 1: a métrica olhava para o lugar errado

A regra mais comum em scale set é `Percentage CPU` acima de 70%. Essa métrica vem do host, não de dentro da VM: a documentação chama isso de métricas de host, emitidas por padrão, sem agente. É prático, e é o limite dela.

Muita aplicação trava antes de a CPU subir. Pool de threads esgotado, conexões com o banco no limite, fila de mensagens crescendo. A CPU fica em 50%, as requisições esperam, e a regra nunca é atingida. Some a isso que o `statistic` padrão é `Average` entre as instâncias: se uma VM está saturada e três estão tranquilas, a média esconde a saturada.

O autoscale aceita outras fontes. Métricas de dentro do sistema operacional, pela extensão de diagnóstico. Métricas da aplicação, pelo Application Insights. E filas do Service Bus ou do Storage, que muitas vezes são o sinal mais honesto de demanda. Um detalhe que pega muita gente: em métricas de fila, o limiar é por instância. Com duas instâncias e limiar de 50 mensagens, a fila precisa chegar a 100 para o primeiro scale-out acontecer.

## Causa 2: a janela e o cooldown somaram minutos antes da decisão

O motor do autoscale roda a cada 30 a 60 segundos. Em cada execução, ele olha para trás o tamanho do `timeWindow` da regra e agrega as amostras. Uma janela de 10 minutos com média suaviza picos passageiros, mas também atrasa a reação a um pico verdadeiro: a média só cruza o limiar depois que boa parte da janela já está alta.

Depois da primeira ação, entra o cooldown. Cada regra tem o seu, avaliado de forma independente, e só volta a agir quando ele termina. No Azure CLI, o cooldown padrão de `az monitor autoscale rule create` é de 5 minutos. Se a regra adiciona uma instância por vez, cada instância extra custa uma janela inteira de cooldown. Em pico forte, escalar de uma em uma é chegar sempre atrasado.

## Causa 3: decidir não é atender

Essa é a parte que quase ninguém mede. Entre o autoscale decidir e a instância nova responder a primeira requisição, existe uma sequência inteira:

| Etapa | O que acontece | O que costuma atrasar |
|-------|----------------|-----------------------|
| Provisionamento | A VM é criada a partir do perfil do scale set | Tamanho de VM sem capacidade na zona |
| Extensões | Scripts de configuração, agentes, instalação da aplicação | Download de pacotes a cada criação |
| Aquecimento | A aplicação inicia, carrega cache, abre conexões | Primeira requisição lenta |
| Probe de saúde | O load balancer passa a enviar tráfego | Probe que libera cedo demais ou tarde demais |

Duas armadilhas específicas do Flexible aparecem aqui. A primeira: scale sets Flexible não têm acesso de saída padrão, exigem conectividade de saída explícita. Uma extensão que baixa pacotes da internet trava na instância nova se não houver NAT Gateway, firewall ou outro caminho de saída. A segunda está no probe: um probe TCP do Azure Load Balancer marca a instância como saudável quando a porta aceita conexão, mesmo que a aplicação ainda esteja fria. Eu prefiro um probe HTTP para um endpoint que só responde 200 quando a aplicação terminou de aquecer.

## Causa 4: o teto estava baixo, ou a cota acabou

O autoscale sempre escala entre o mínimo e o máximo do perfil. Se o máximo foi definido num dia calmo, o pico bate no teto e o motor para ali, sem erro nenhum. E ajuste manual fora desse intervalo é desfeito na execução seguinte.

A cota é o outro teto invisível. A documentação descreve dois níveis por assinatura e por região: o total de vCPUs regionais e o limite por família de tamanho de VM. E conta núcleos alocados e desalocados. Mesmo com cota sobrando, a criação pode falhar por falta de capacidade do tamanho escolhido na região ou na zona. Nesse caso, a ação aparece como falha na tabela `AutoscaleScaleActionsLog`.

## Causa 5: o scale-in devolveu a capacidade cedo demais

O motor tem proteção contra oscilação: antes de um scale-in, ele estima se a remoção provocaria um scale-out imediato e, se sim, adia ou remove menos instâncias. Essa estimativa é aritmética. Ela não prevê que a carga vai voltar daqui a dez minutos.

Com janela curta no scale-in, o autoscale remove instâncias no vale entre dois picos. No pico seguinte, a aplicação paga de novo todo o tempo da Causa 3. Eu uso janela e cooldown mais longos no scale-in do que no scale-out, e margem larga entre os limiares.

## O que ajuda de verdade

Primeiro, a base reativa bem feita: scale-out mais agressivo, scale-in mais paciente.

```bash
az monitor autoscale create \
  --resource-group rg-app-web \
  --resource vmss-app-web \
  --resource-type Microsoft.Compute/virtualMachineScaleSets \
  --name autoscale-app-web \
  --min-count 3 --count 3 --max-count 20

az monitor autoscale rule create \
  --resource-group rg-app-web \
  --autoscale-name autoscale-app-web \
  --condition "Percentage CPU > 65 avg 5m" \
  --scale out 3 --cooldown 5

az monitor autoscale rule create \
  --resource-group rg-app-web \
  --autoscale-name autoscale-app-web \
  --condition "Percentage CPU < 30 avg 20m" \
  --scale in 1 --cooldown 20
```

**Perfil por horário.** Se o pico tem hora marcada, a forma mais barata de vencer a Causa 3 é não depender dela. Um perfil recorrente sobe o mínimo antes do expediente e mantém as regras:

```bash
az monitor autoscale profile create \
  --resource-group rg-app-web \
  --autoscale-name autoscale-app-web \
  --name horario-comercial \
  --copy-rules default \
  --min-count 8 --count 8 --max-count 20 \
  --recurrence week mon tue wed thu fri \
  --start 07:30 --end 19:00 \
  --timezone "E. South America Standard Time"
```

**Autoscale preditivo.** Existe para scale sets e só para eles. Usa aprendizado de máquina sobre o histórico de CPU, precisa de pelo menos sete dias de dados e atinge a melhor precisão com 15. Tem restrições que eu deixo claras antes de qualquer promessa: só aceita `Percentage CPU` com agregação `Average`, só faz scale-out e exige uma regra reativa de CPU configurada. Se a sua causa é a 1, o preditivo não resolve. Eu começo sempre em modo de previsão, que mostra o gráfico previsto contra o real sem escalar nada:

```bash
az monitor autoscale update \
  --resource-group rg-app-web \
  --name autoscale-app-web \
  --scale-mode ForecastOnly \
  --scale-look-ahead-time PT30M
```

Quando a previsão acompanhar o real, troque para `Enabled`. O `scale-look-ahead-time` antecipa a criação das instâncias em relação ao pico previsto.

**Standby pools.** É o recurso que ataca a Causa 3 de frente. O pool mantém VMs já provisionadas, com extensões e aplicação instaladas, em estado running, deallocated ou hibernated (este último ainda em preview). No scale-out, o scale set puxa do pool em vez de criar do zero. Só funciona com orquestração Flexible, não é suportado com contagem de fault domains maior que 1, e a documentação recomenda pools deallocated ou hibernated junto com autoscale, porque VMs running no pool entram no cálculo do autoscale. Lembre da Causa 4: núcleos desalocados também consomem cota.

```bash
az standby-vm-pool create \
  --resource-group rg-app-web \
  --location <regiao-do-scale-set> \
  --name pool-app-web \
  --max-ready-capacity 20 \
  --min-ready-capacity 5 \
  --vm-state Deallocated \
  --vmss-id "/subscriptions/<id>/resourceGroups/rg-app-web/providers/Microsoft.Compute/virtualMachineScaleSets/vmss-app-web"
```

O comando vem da extensão `standbypool` do Azure CLI, e o provider `Microsoft.StandbyPool` precisa estar registrado e com as permissões configuradas. O pool precisa ficar na mesma região e na mesma assinatura do scale set; confirme a disponibilidade do recurso na sua região antes de desenhar em cima dele.

**Health extension e reparo automático.** Para monitorar a saúde da aplicação em scale sets Flexible, a documentação de modos de orquestração pede a Application Health Extension, instalada em cada instância, e é esse sinal que alimenta o reparo automático. Com Rich Health States, a instância nova fica em *Initializing* até estabilizar, e o reparo não age sobre ela nesse período. Na prática, a instância que provisionou mas cuja aplicação ficou doente é reparada sozinha, depois do período de carência do reparo automático, em vez de ocupar uma vaga do máximo sem atender ninguém. Falha de provisionamento fica de fora: a documentação diz que o reparo automático não trata a instância marcada como não saudável por erro de provisionamento. Quem decide se ela recebe tráfego continua sendo o probe do load balancer.

## Por que Flexible, e não Uniform

A documentação atual é direta: Flexible é o modo de orquestração recomendado. As instâncias são VMs padrão do Azure, gerenciadas com as mesmas APIs, e o modo aceita misturar Spot e sob demanda. E é o único modo que suporta standby pools, que para esse diagnóstico é o argumento que decide. Desde novembro de 2023, o Azure CLI e o PowerShell já criam scale sets em Flexible quando o modo não é informado.

Uniform ainda tem lugar: Service Fabric e AKS dependem dele. O modo é definido na criação e não pode ser alterado depois, então essa escolha precisa acontecer no desenho, não no incidente.

## O que fica

Limiar de CPU é a última coisa que eu ajusto nesse tipo de incidente. Antes, eu meço quanto tempo a instância leva para nascer útil, e decido a estratégia a partir desse número: se ele é maior que a duração do pico, nenhuma regra reativa vai salvar o horário, e a resposta passa a ser horário, previsão ou pool.

Quanto tempo leva, no seu ambiente, entre o autoscale decidir escalar e a instância nova atender a primeira requisição? Você já mediu?
