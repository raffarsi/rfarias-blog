---
layout: ../../layouts/PostLayout.astro
title: "Um agente trava e os outros três caem junto: onde rodar seus agentes no Azure"
category: "Infra"
tag: "infra"
date: "24 Set 2026"
readTime: "8 min"
description: "Quatro agentes dentro do mesmo app funciona até o primeiro incidente. O que muda quando você separa, e até onde vale separar."
---

O time tinha quatro agentes em produção. Triagem, busca, resumo e ação. Todos rodando dentro do mesmo container, no mesmo app, porque foi assim que começou: um agente virou dois, dois viraram quatro, e ninguém parou para decidir se aquilo deveria continuar junto.

Numa terça à tarde, o agente de resumo recebeu um documento muito maior do que o normal, segurou tudo em memória e derrubou o processo.

Os quatro caíram. Inclusive o de triagem, que naquele momento não tinha nada a ver com o assunto.

## Por que todo mundo começa junto

Ninguém escolhe acoplar. O acoplamento é o caminho de menor resistência.

Você sobe o primeiro agente. Funciona. O segundo precisa das mesmas bibliotecas, do mesmo pipeline de deploy, das mesmas variáveis de ambiente. Colocar ele no mesmo lugar economiza meio dia. O terceiro entra pelo mesmo motivo, e a essa altura já existe um argumento pronto: é tudo o mesmo sistema.

E é mesmo o mesmo sistema. Só que organização de código e topologia de execução são decisões diferentes, tomadas por motivos diferentes. Um repositório único pode perfeitamente virar quatro coisas em execução.

## "Mesmo ambiente" quer dizer três coisas

Aqui está a parte que costuma embaralhar a discussão. Quando alguém diz que os agentes rodam no mesmo ambiente, pode estar descrevendo três arranjos bem distintos.

**Quatro agentes dentro do mesmo app.** Um processo, um container, quatro fluxos lógicos. É o caso da história lá de cima. Tudo compartilhado: memória, CPU, ciclo de vida, deploy e destino em caso de falha.

**Quatro apps dentro do mesmo ambiente.** Em Azure Container Apps, por exemplo, o ambiente é a fronteira de rede e de observabilidade, mas cada app é um deployment com escala própria. Aqui a falha de um não derruba os outros, e cada um escala pelo próprio gatilho.

**Quatro apps em ambientes separados.** Aí você separa também rede, limites de plataforma e superfície de configuração.

A pergunta útil não é se está tudo junto. É em qual desses três níveis você está, e se o que ainda está compartilhado é algo que você aceita perder de uma vez.

![Três níveis de separação entre agentes, do app único aos ambientes separados](/images/posts/onde-rodar-seus-agentes-azure-compute/tres-niveis-de-separacao.svg)

## O que o arranjo mais acoplado custa

### Falha

No primeiro nível, o raio de falha é o processo inteiro. Vazamento de memória, exceção não tratada, loop que não termina, qualquer um desses leva todo mundo junto.

E o detalhe que torna isso pior em arquitetura de agentes: o comportamento de um agente depende da entrada que ele recebe, e a entrada muitas vezes vem de fora. Um documento maior que o esperado, uma resposta de ferramenta que não voltou, um prompt que induziu um laço mais longo. São situações que você não controla totalmente, e que num processo compartilhado viram indisponibilidade de tudo.

### Escala

Os quatro agentes quase nunca têm o mesmo perfil de carga. O de busca costuma receber muito mais chamada que o de ação, porque nem toda busca vira ação.

Num app único, você dimensiona pelo pico do mais pesado. Todos os outros herdam esse tamanho. Você paga por capacidade ociosa nos três e ainda assim fica apertado no quarto, porque a instância inteira sobe e desce junta.

Separar apps resolve isso sem nenhuma sofisticação: cada um sobe pelo próprio gatilho.

### Rede

Este é o que sobrevive até o segundo nível. Apps no mesmo ambiente de Container Apps dividem a mesma sub-rede e, na prática, as mesmas regras de saída.

Se o agente de ação precisa alcançar um sistema interno que os outros três não deveriam nem enxergar, compartilhar sub-rede significa que a regra que libera para um libera para todos. É o mesmo raciocínio de permissão que eu discuti em identidade: o menor denominador comum some, e o que fica é a união.

## Os quatro caminhos

### Azure Container Apps

Escala a zero, revisões para rollout controlado, e integração com VNet. Para agente que não roda o tempo todo, e boa parte deles não roda, é o caminho mais direto.

Vários apps podem dividir o mesmo ambiente, e isso já te dá o segundo nível de separação sem custo adicional de operação. Quando você precisa do terceiro nível, cria ambientes separados.

### App Service

Familiar, estável, e para muitos times já está lá com pipeline montado.

O ponto de atenção é o plano. Apps no mesmo App Service Plan dividem a mesma capacidade de compute, então um app que consome o plano afeta os vizinhos. Separar de verdade exige plano separado, e aí o custo sobe de um jeito que nem sempre compensa comparado a Container Apps.

### AKS

Controle total. Namespaces, quotas de recurso, node pools dedicados, políticas de rede por pod. Se você precisa de isolamento fino e já tem essa necessidade em outros lugares, faz sentido.

O custo do AKS raramente é a fatura. É o tempo de time. Cluster pede upgrade, capacity planning, gente que saiba depurar quando a rede do pod não resolve nome. Se ninguém opera Kubernetes hoje, adotar por causa de quatro agentes é trocar um problema de acoplamento por um problema de operação, e o segundo é mais caro.

### Azure AI Foundry Agent Service

O gerenciado. Você não escolhe nem dimensiona compute, e o isolamento entre agentes vem pronto.

Vale dizer com honestidade o que isso significa. A decisão não desaparece, ela muda de lugar: em vez de desenhar a topologia, você passa a depender do que o serviço expõe de rede, de observabilidade e de configuração. Para muitos casos isso é exatamente o que você quer, porque você não estava querendo operar infraestrutura. Para quem tem exigência específica de isolamento de rede, vale confirmar antes que o serviço atende, em vez de descobrir depois.

## Como decidir sem transformar isso em projeto

Três perguntas resolvem a maioria dos casos.

**Falha.** O incidente de um agente pode parar os outros? Se a resposta for sim e isso não for aceitável, ele sai do app compartilhado.

**Escala.** Eles crescem pelo mesmo gatilho? Se um recebe dez vezes mais chamada que o outro, dimensionar junto é desperdício de um lado e gargalo do outro.

**Rede.** Eles precisam alcançar coisas diferentes? Se sim, dividir sub-rede significa dar a todos o acesso que só um precisava.

Se qualquer uma dessas for sim para um agente específico, aquele agente merece o próprio espaço. Note que a resposta é por agente, não para o conjunto. É comum terminar com três agentes convivendo bem e um separado, e isso é um desenho legítimo, não meio termo.

## Dois erros que eu vejo sempre

**Deixar tudo no mesmo app porque é um sistema só.** Já comentei acima, mas vale insistir porque é o mais comum. O argumento é verdadeiro e a conclusão não decorre dele. Sistema é conceito de domínio. App é unidade de implantação e de falha. Misturar os dois é como dizer que todas as tabelas precisam ficar no mesmo banco porque fazem parte do mesmo produto.

**Ir direto para AKS porque parece mais sério.** Kubernetes vira a resposta padrão quando a conversa é isolamento, e para muita gente é sobredimensionado. Container Apps com apps separados resolve falha e escala, que é o que dói primeiro, e custa uma fração do esforço operacional. AKS entra quando a exigência de rede ou de densidade justifica, não quando o problema é só que quatro agentes estão no mesmo processo.

## O que fica

Separar compute não é excesso de engenharia. É decidir, de forma explícita e antes do incidente, quem cai junto com quem.

O custo de fazer isso no início é uma tarde de configuração. O custo de fazer depois, com quatro agentes em produção e um pipeline que ninguém quer tocar, é bem maior, e normalmente a conversa só acontece na semana seguinte a uma indisponibilidade.

Se o agente que mais escala no seu sistema dobrasse de tráfego amanhã, o que ia junto sem precisar?
