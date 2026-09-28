---
layout: ../../layouts/PostLayout.astro
title: "GPU própria no Azure para inferência: a conta começa pelas horas em que ela fica parada"
category: "Infra"
tag: "infra"
date: "29 Out 2026"
readTime: "8 min"
description: "Rodar um modelo aberto numa VM com GPU troca pagamento por token por pagamento por hora, e a GPU parada custa o mesmo que a GPU ocupada. Como comparar modelo gerenciado, VM e AKS com GPU, quais famílias e recursos a documentação indica e os sinais de que vale, ou não, sair do gerenciado."
---

O time quer tirar o modelo do Microsoft Foundry e rodar um modelo aberto numa VM com GPU "para economizar". A primeira pergunta que eu faço não é sobre o modelo, nem sobre a GPU. É quantas horas por dia essa GPU vai ficar esperando requisição.

Quase nunca alguém tem a resposta, e ela decide a conta. Ao sair do gerenciado, o que muda é a estrutura de custo: você deixa de pagar pelo que consome e passa a pagar pelo tempo em que a capacidade existe.

## Token contra hora de GPU

No Foundry, a opção preferida para os modelos do catálogo é a implantação serverless, com três categorias principais. A documentação resume: *standard* é pagamento por token, *provisioned* é capacidade reservada e *batch* é processamento assíncrono com desconto. No standard, sem requisição não há token para cobrar.

O provisioned já se parece com uma GPU sua: a documentação diz que ele é cobrado por PTU por hora, independentemente dos tokens consumidos, e o medidor só para quando a implantação é apagada.

Uma VM com GPU segue a lógica do provisioned, com um agravante: o time passa a cuidar de driver, runtime de inferência, escala e patch. Desalocada, ela deixa de gerar cobrança de computação, mas os discos continuam cobrados, e a cota de vCPU conta núcleos alocados e desalocados.

Há um caminho intermediário: o *managed compute* do Foundry hospeda modelos abertos e com pesos próprios em GPU gerenciada pela Microsoft, cobrado por hora de acelerador e com escala a zero. Mas está em preview, sem SLA, e só processa de forma global; se o motivo da saída é manter dados numa geografia, ele não resolve por enquanto.

## As três opções lado a lado

| Critério | Modelo gerenciado (serverless) | VM com GPU | AKS com node pool de GPU |
|---|---|---|---|
| Controle do modelo | Catálogo do Foundry; nem todo modelo aceita todo tipo de implantação | Qualquer modelo e runtime que caibam na GPU | Qualquer modelo; o KAITO simplifica modelos abertos |
| Esforço operacional | Baixo: você consome uma API | Alto: SO, driver, runtime, escala e patch são seus | Alto, dividido: AKS cuida de parte do stack da GPU, o resto é seu |
| Escala | Cota de tokens ou PTUs reservadas | Manual, ou VMSS montada por você | Cluster autoscaler ou node auto-provisioning |
| Custo quando ocioso | Standard: sem token, sem cobrança por token. Provisioned: PTU por hora | A hora corre enquanto a VM está alocada | Node pool de usuário pode chegar a zero |
| Rede e dados | Rede privada disponível; processamento global, por data zone ou por geografia, conforme o tipo | Dentro da sua VNet | Dentro da sua VNet |

A linha que mais pesa é a quarta: ela diz quanto custa a hora em que nada acontece.

## Qual GPU, e se ela existe onde você precisa

A documentação de tamanhos ajuda a não escolher o hardware errado:

**NVadsA10 v5.** GPU NVIDIA A10, com tamanhos que vão de 1/6 de GPU, com 4 GiB de frame buffer, até a GPU inteira, com 24 GiB, e duas GPUs no maior tamanho (Standard_NV72ads_A10_v5, 48 GB). A família NV é posicionada para gráficos, visualização e desktop virtual. Não é por onde eu começaria inferência de modelo de linguagem.

**NC A100 v4.** Até 4 GPUs NVIDIA A100 PCIe com 80 GB cada. A documentação lista inferência em lote com pré e pós-processamento pesados e serviços web de IA entre os usos indicados. A página da série avisa que a capacidade nova da série NC atual está sendo implantada apenas na NCads H100 v5, então confirme a disponibilidade antes de fixar a A100 no desenho.

**NCads H100 v5.** Até 2 GPUs NVIDIA H100 NVL com 94 GB cada, com a mesma lista de usos da NC A100 v4.

**ND H100 v5.** Oito GPUs H100 de 80 GB por VM, com InfiniBand dedicado de 400 Gbps por GPU. É desenhada para treinamento de alto nível e cargas fortemente acopladas. Para inferência, só se o modelo realmente não couber em algo menor.

Depois vêm cota e capacidade, que o Azure verifica separadamente: a cota é em vCPUs por família de VM e por região, e ter cota não garante capacidade física naquela região ou zona. Antes de qualquer desenho, eu confirmo as duas:

```bash
# A série está disponível para a assinatura nesta região?
az vm list-skus \
  --location brazilsouth \
  --size Standard_NC \
  --resource-type virtualMachines \
  --output table

# Quanto de cota de vCPU cada família já tem
az vm list-usage --location brazilsouth --output table
```

Se a família não aparece na região dos dados, a discussão de custo acaba ali.

## AKS: node pool de GPU que pode chegar a zero

No AKS, a GPU fica num node pool de usuário separado, com taint para que nenhuma carga comum ocupe um nó caro. Tamanho de VM e taint só podem ser definidos na criação do pool, e a documentação não aceita transformar um pool existente em pool de GPU.

```bash
az aks nodepool add \
  --resource-group rg-ia-inferencia \
  --cluster-name aks-producao \
  --name gpua100 \
  --node-vm-size Standard_NC24ads_A100_v4 \
  --node-taints sku=gpu:NoSchedule \
  --enable-cluster-autoscaler \
  --node-count 1 \
  --min-count 0 \
  --max-count 2
```

O `--min-count 0` permite, sem forçar, que o autoscaler leve o pool a zero quando nenhum pod pede GPU. É o que tira a hora ociosa da conta.

O detalhe que muda a operação está no stack da NVIDIA. Sem opção extra, o AKS instala apenas o driver: o recurso `nvidia.com/gpu` só aparece para o scheduler depois que você implanta o device plugin, por DaemonSet ou pelo NVIDIA GPU Operator. A Microsoft já recomenda o pool de GPU gerenciado (`--enable-managed-gpu=true`, na extensão aks-preview e com o recurso `ManagedGPUExperiencePreview` registrado), que instala driver, device plugin e exportador de métricas DCGM. Só que ele ainda está em preview e, durante o preview, pools criados manualmente nesse modo não aceitam o cluster autoscaler: a escala é manual, ou fica por conta do node auto-provisioning. Hoje, o `--min-count 0` do autoscaler e o stack gerenciado no mesmo pool criado manualmente ainda não andam juntos.

Para modelos abertos, o add-on AI toolchain operator, baseado no projeto KAITO, habilitado com `az aks update --enable-ai-toolchain-operator --enable-oidc-issuer`, sobe o modelo com vLLM e API compatível com OpenAI, e provisiona o node pool de GPU do workspace. Ele exige GPU NVIDIA a partir da arquitetura Ampere (T4 e V100 ficam de fora), não aceita GPU AMD e costuma estar uma versão atrás do KAITO upstream. Ao remover um workspace, o node pool criado para ele precisa ser apagado manualmente. E a própria documentação avisa que a máquina pode levar até 10 minutos para ficar pronta e o workspace até 20, conforme o modelo. Esse é o preço da escala a zero: a primeira requisição depois do silêncio espera.

## Spot para o que pode esperar

Inferência em lote, como classificar um acervo de documentos à noite, tolera interrupção. Para isso existe o node pool Spot: capacidade ociosa do Azure, sem SLA, despejada com aviso de 30 segundos quando o Azure precisa dela de volta.

```bash
az aks nodepool add \
  --resource-group rg-ia-inferencia \
  --cluster-name aks-producao \
  --name spotlote \
  --node-vm-size Standard_NC24ads_A100_v4 \
  --priority Spot \
  --eviction-policy Delete \
  --spot-max-price -1 \
  --enable-cluster-autoscaler \
  --node-count 1 \
  --min-count 0 \
  --max-count 4
```

O pool Spot recebe automaticamente o taint `kubernetes.azure.com/scalesetpriority=spot:NoSchedule`, então só o job com a toleration correspondente cai ali. Com `Delete`, o nó despejado é removido; com `Deallocate`, ele fica parado e continua contando na cota. O job precisa salvar progresso. Endpoint que atende usuário não vai para Spot.

## Sinais de que vale sair do gerenciado

**O modelo não existe no catálogo gerenciado.** Um modelo aberto específico, ou ajustado com pesos próprios, que não tem implantação serverless. Esse é o motivo mais forte, e o único que independe de volume.

**O requisito de dados não cabe nas opções de processamento.** Se nem a implantação por geografia atende e o modelo precisa rodar dentro da sua VNet, com o tráfego que você controla, a GPU própria entra na mesa.

**A GPU fica ocupada a maior parte do tempo.** Volume alto e previsível, medido e não estimado. É a mesma lógica que justifica o provisioned.

**Lote grande que tolera interrupção.** Spot com escala a zero casa bem com esse perfil.

**Existe um time que já opera Kubernetes com GPU.** Driver, runtime e métricas viram rotina, não projeto.

## Sinais de que não vale

**O tráfego é de horário comercial ou em picos.** Uma GPU ligada o mês inteiro para atender algumas horas por dia paga a noite e o fim de semana.

**O modelo do catálogo resolve.** Trocar de modelo só para mudar a forma de cobrança traz o custo operacional sem garantir a economia.

**A latência exige resposta imediata e o volume é baixo.** Escala a zero e resposta rápida na primeira requisição puxam para lados opostos; manter o nó ligado resolve a latência e volta ao problema da hora ociosa.

**Ninguém é dono da GPU.** Sem alguém responsável por driver, patch, cota e capacidade, o primeiro despejo ou a primeira falta de capacidade na região vira incidente.

## O que fica

A decisão de rodar modelo na própria GPU raramente é sobre qual serviço custa menos. É sobre qual estrutura de custo combina com o formato do seu tráfego. Quem paga por token paga pelo que usa; quem paga por hora de GPU paga pelo que reservou. Eu só aceito a segunda opção quando alguém me mostra, com métrica de uso real, que a GPU vai trabalhar a maior parte do tempo, ou quando o modelo simplesmente não existe do outro lado.

Se a sua GPU ficasse ligada o mês inteiro, em quantas dessas horas ela estaria de fato processando alguma coisa?
