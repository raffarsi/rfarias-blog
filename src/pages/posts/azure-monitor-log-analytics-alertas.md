---
layout: ../../layouts/PostLayout.astro
title: "Azure Monitor e Log Analytics: monitoramento que realmente funciona"
category: "Infra"
tag: "infra"
date: "09 Out 2025"
readTime: "5 min"
description: "Os dados que você não coletou antes do incidente não existem depois dele. O que coletar desde o primeiro dia, como pagar menos pelos logs que quase ninguém consulta e como montar alertas que o time não aprende a ignorar."
---

O incidente começa de madrugada. De manhã, alguém pergunta o que aconteceu, e a resposta é que o servidor não estava enviando logs para lugar nenhum. A configuração de diagnóstico foi feita às pressas depois, e ela só coleta daqui para frente. Os dados daquela madrugada nunca vão existir.

Monitoramento é o tipo de coisa que todo mundo configura, pouca gente revisa e quase todo mundo só estuda de verdade depois de precisar. Este artigo é sobre o que deixar pronto antes: o que coletar, onde guardar, quanto pagar e como alertar sem criar ruído.

## O que coletar desde o primeiro dia

São três fontes, e cada uma tem o seu mecanismo.

**O Activity Log** registra quem criou, alterou ou apagou recursos. Ele existe por padrão, mas guarda pouco tempo; enviá-lo para um workspace do Log Analytics é o que permite investigar mudanças de semanas atrás.

**Os logs de recursos PaaS**, como Key Vault, Storage, SQL e Application Gateway, saem por configurações de diagnóstico, uma por recurso. Sem elas, o recurso não registra nada do que acontece nele.

```bash
az monitor diagnostic-settings create \
  --name diag-central \
  --resource $(az keyvault show --name kv-producao --query id -o tsv) \
  --workspace $(az monitor log-analytics workspace show --workspace-name law-producao --resource-group rg-monitor --query id -o tsv) \
  --logs '[{"category":"AuditEvent","enabled":true}]' \
  --metrics '[{"category":"AllMetrics","enabled":true}]'
```

**O que acontece dentro das VMs**, como contadores de desempenho, logs do sistema e eventos, é coletado pelo Azure Monitor Agent, com regras de coleta de dados (Data Collection Rules) que dizem o que coletar e para onde enviar. O agente antigo, o Log Analytics Agent, foi aposentado em agosto de 2024. Se ainda existe algum em uso, a migração deixou de ser opcional.

Configurar isso recurso por recurso não escala. O caminho é Azure Policy: as iniciativas nativas de monitoramento instalam o agente, associam a regra de coleta e criam as configurações de diagnóstico em tudo que for criado a partir dali. Para o que já existe, a política precisa de uma tarefa de correção (remediation), que aplica a configuração nos recursos antigos.

## Um workspace ou vários

A tentação é criar um workspace por time ou por aplicação. Na hora de investigar um incidente que atravessa três sistemas, isso vira três consultas em três lugares.

O desenho que eu uso é um workspace central por ambiente, com controle de acesso por recurso: cada time enxerga os logs dos recursos em que tem permissão, sem precisar de workspaces separados. Workspace dedicado fica para exigência real, como dados que por contrato não podem ficar junto com os outros. Um detalhe que conversa com a seção seguinte: o acesso por recurso não funciona para tabelas nos planos Basic e Auxiliary, que só podem ser consultadas com permissão no workspace inteiro.

## Pagando menos pelo que quase ninguém consulta

O custo do Log Analytics é quase todo de ingestão, e nem todo log merece o mesmo preço. Os planos de tabela existem para isso:

**Analytics.** Consultas incluídas no preço, alertas completos. Para o que é consultado com frequência e alimenta alertas.

**Basic.** Ingestão mais barata, consulta cobrada à parte e alertas simples. Para logs de investigação, que são consultados quando algo dá errado.

**Auxiliary** (hoje chamado de Auxiliary/Lake na documentação). O menor custo de ingestão, consultas mais lentas e cobradas, sem alertas. Para logs verbosos que precisam ser guardados por auditoria ou conformidade.

Revisar quais tabelas estão no plano certo costuma ser a economia mais rápida de um ambiente com monitoramento maduro.

## Consultas que eu uso em investigação

Quem mudou o quê nas últimas 24 horas:

```kql
AzureActivity
| where TimeGenerated > ago(24h)
| where OperationNameValue has_any ("write", "delete")
| where ActivityStatusValue == "Success"
| project TimeGenerated, Caller, OperationNameValue, ResourceGroup, _ResourceId
| order by TimeGenerated desc
```

As VMs com maior uso de CPU, a partir dos contadores coletados pelo agente:

```kql
Perf
| where TimeGenerated > ago(24h)
| where ObjectName == "Processor" and CounterName == "% Processor Time" and InstanceName == "_Total"
| summarize cpu_media = avg(CounterValue), cpu_p95 = percentile(CounterValue, 95) by Computer
| top 10 by cpu_p95 desc
```

Sem o filtro de `_Total`, os valores de cada núcleo se misturam ao total e distorcem a conta. Se o VM insights estiver ativo, os mesmos dados ficam na tabela `InsightsMetrics`. O percentil 95 conta uma história diferente da média: uma VM com média de 30% e p95 de 98% tem picos que a média esconde.

## Alertas que o time não aprende a ignorar

O alerta que dispara toda hora ensina o time a ignorar alertas. Quatro práticas evitam isso:

**Janela de avaliação que faz sentido.** CPU acima de 90% por um minuto é ruído. Por quinze minutos, é sinal.

**Limites dinâmicos.** Em vez de um número fixo, o Azure Monitor aprende o comportamento normal da métrica e alerta quando ela sai do padrão. Resolve o problema do servidor que roda sempre em 85% e do que nunca passa de 20%:

```bash
az monitor metrics alert create \
  --name alerta-cpu-anomala \
  --resource-group rg-monitor \
  --scopes $(az vm show --name vm-app01 --resource-group rg-app --query id -o tsv) \
  --condition "avg Percentage CPU > dynamic medium 2 of 4 since 2025-10-01T00:00:00.000Z" \
  --window-size 15m \
  --evaluation-frequency 5m \
  --action $(az monitor action-group show --name ag-plantao --resource-group rg-monitor --query id -o tsv)
```

**Silêncio em janela de manutenção.** As regras de processamento de alertas suprimem notificações num horário programado. A janela de manutenção de domingo não precisa acordar ninguém.

**Um runbook por alerta.** Se ninguém sabe o que fazer quando o alerta chega, ele é só barulho. Cada alerta aponta para o procedimento de resposta.

Para não começar do zero, o Azure Monitor Baseline Alerts, mantido pela Microsoft, é um catálogo de alertas recomendados por serviço, implantável por Azure Policy. É um bom ponto de partida para depois ajustar ao seu ambiente.

## Três erros que eu vejo com frequência

**Diagnóstico configurado depois do incidente.** O dado de antes da configuração não existe. A política que configura tudo automaticamente é o que impede isso.

**Tudo no plano mais caro.** Logs verbosos de firewall e de aplicação em Analytics, consultados duas vezes por ano, costumam ser a maior linha da fatura.

**Alerta por e-mail para uma lista que ninguém lê.** Alerta crítico vai para o canal de plantão, com responsável. O resto vira relatório.

## O que fica

Monitoramento que funciona é decidido antes do incidente: o que coletar, por política; onde guardar, num workspace central; quanto pagar, pelo plano certo de cada tabela; e quando acordar alguém, com poucos alertas bem calibrados.

Se um recurso de produção tivesse um problema esta noite, os logs de antes do problema existiriam?
