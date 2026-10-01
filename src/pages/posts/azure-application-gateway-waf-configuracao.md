---
layout: ../../layouts/PostLayout.astro
title: "Azure Application Gateway com WAF: do modo Detection ao Prevention sem bloquear quem não devia"
category: "Networking"
tag: "networking"
date: "01 Nov 2025"
readTime: "8 min"
description: "Habilitar o WAF é fácil; o difícil é chegar ao modo Prevention sem bloquear usuário legítimo. Como o anomaly scoring decide, como ler os logs antes de bloquear, como fazer exclusões estreitas e onde entram custom rules, rate limit e políticas por site."
---

O WAF do Application Gateway costuma ser habilitado no dia da entrega, marcado como "feito" no checklist de segurança e esquecido. Meses depois, um usuário preenche o campo de observações de um formulário com um texto que tem aspas, um hífen duplo e a palavra "select". A requisição volta com 403, o time da aplicação abre um incidente achando que é bug no código, e alguém passa a tarde procurando o erro no lugar errado.

O WAF fez exatamente o que foi configurado para fazer. O problema é que ninguém olhou o que ele faria antes de deixar ele bloquear. Eu não considero um WAF configurado enquanto não existe um processo para chegar ao modo Prevention com os falsos positivos já tratados.

## Primeiro, a política certa e o ruleset certo

Toda a configuração mora numa WAF Policy, um recurso separado do gateway que contém managed rules, custom rules, exclusões e limites de requisição. A configuração legada, feita direto no Application Gateway WAF v2, está depreciada: desde março de 2025 não é possível criar novas, e ela se aposenta em março de 2027. Se o seu gateway ainda usa WAF config, o portal tem a opção de upgrade para policy sem downtime. Faça isso antes de mexer em qualquer regra.

O ruleset gerenciado recomendado hoje é o Default Rule Set 2.2, baseado no OWASP CRS 3.3.4 com regras adicionais da Microsoft Threat Intelligence. O DRS 2.1 continua disponível, e o CRS 3.2 aparece na documentação como legado. Para política nova, a Microsoft é direta: use DRS 2.2. Um detalhe que pega quem usa CLI: o `az network application-gateway waf-policy create` assume DRS 2.1 se você não informar a versão.

```bash
az network application-gateway waf-policy create \
  --name waf-loja-producao \
  --resource-group rg-app-producao \
  --location brazilsouth \
  --type Microsoft_DefaultRuleSet \
  --version 2.2

az network application-gateway waf-policy policy-setting update \
  --policy-name waf-loja-producao \
  --resource-group rg-app-producao \
  --state Enabled \
  --mode Detection

az network application-gateway waf-policy managed-rule rule-set add \
  --policy-name waf-loja-producao \
  --resource-group rg-app-producao \
  --type Microsoft_BotManagerRuleSet \
  --version 1.1
```

O terceiro comando adiciona o Bot Manager 1.1, que roda ao lado do DRS e classifica o tráfego em bots ruins, bons e desconhecidos. Por padrão ele bloqueia os maliciosos, permite crawlers de busca verificados, bloqueia crawlers de busca desconhecidos e só registra os demais bots desconhecidos. Eu ligo junto desde o início, porque ele também passa pela fase de observação.

## Como o WAF decide o que bloquear

Aqui está o ponto que explica a maioria das surpresas. Com DRS e CRS, o WAF não bloqueia quando uma regra casa. Ele soma pontos. Cada regra tem uma severidade, e cada severidade contribui com um valor para o anomaly score da requisição:

| Severidade | Pontos |
|------------|--------|
| Critical | 5 |
| Error | 4 |
| Warning | 3 |
| Notice | 2 |

O limiar é 5. Uma única regra Critical já basta para bloquear em Prevention. Uma Warning sozinha soma 3 e não bloqueia, mas duas Warnings na mesma requisição chegam a 6 e bloqueiam.

Nos logs, isso aparece em duas camadas. Cada regra que casou gera uma linha com ação `Matched`. Quando a soma chega a 5, uma regra obrigatória de avaliação gera outra linha: `Blocked` em Prevention, `Detected` em Detection. Quem filtra só por `Blocked`, como eu já vi em muita query copiada, enxerga o veredito mas não as regras que o causaram.

Vale saber também que o DRS 2.2 vem em paranoia level 1, com as regras de PL2 desabilitadas. É uma linha de base que gera poucos falsos positivos. Subir para PL2 é decisão consciente, regra a regra, e de preferência com ação Log primeiro.

## Do Detection para o Prevention

Em Detection, o WAF avalia tudo e registra o que bloquearia, sem bloquear. A documentação recomenda rodar assim por um período em produção antes de virar a chave. Ela não fixa um prazo, e eu não fixaria em horas: o período certo é o que cobre um ciclo real de uso da aplicação, incluindo as rotinas que só rodam no fechamento do mês.

Com o diagnóstico enviado ao Log Analytics no modo resource-specific (o padrão hoje), os logs vão para a tabela `AGWFirewallLogs`. A query que eu uso cruza as requisições que seriam bloqueadas com as regras que as levaram até lá, pelo `TransactionId`:

```kql
let bloqueariam = AGWFirewallLogs
    | where TimeGenerated > ago(7d)
    | where Action == "Detected"
    | distinct TransactionId;
AGWFirewallLogs
| where TimeGenerated > ago(7d)
| where Action == "Matched" and TransactionId in (bloqueariam)
| summarize Requisicoes = dcount(TransactionId), Exemplo = take_any(DetailedData)
    by RuleId, Message, RequestUri
| order by Requisicoes desc
```

O resultado é uma lista de regra, URI e um exemplo do dado que casou. Para cada linha, a pergunta é uma só: isso é ataque ou é a aplicação funcionando? Se o diagnóstico ainda grava em `AzureDiagnostics`, a lógica é a mesma, filtrando `Category == "ApplicationGatewayFirewallLog"` e usando os campos com sufixo, como `ruleId_s` e `action_s`.

Quando a lista só tem ataque de verdade, a chave vira:

```bash
az network application-gateway waf-policy policy-setting update \
  --policy-name waf-loja-producao \
  --resource-group rg-app-producao \
  --state Enabled \
  --mode Prevention
```

## Exclusões estreitas

Confirmado o falso positivo, o reflexo comum é desabilitar a regra. É a pior saída: a regra para de proteger todos os campos de todas as requisições. A exclusão é melhor, porque tira um atributo específico da avaliação e deixa o resto da requisição ser inspecionado normalmente.

A exclusão tem dois eixos, e os dois devem ser os mais estreitos possíveis. O primeiro é o escopo: uma regra, um grupo de regras, o ruleset inteiro ou global. A própria documentação recomenda per-rule sempre que der. O segundo é o atributo, definido por match variable, operador e seletor. Nos rulesets atuais, prefira as variáveis de valor (`RequestArgValues`, `RequestHeaderValues`, `RequestCookieValues`) às antigas de nome, mantidas por compatibilidade.

No caso da abertura, o campo `observacao` do corpo JSON disparava a regra 942100 (SQL injection via libinjection):

```bash
az network application-gateway waf-policy managed-rule exclusion rule-set add \
  --policy-name waf-loja-producao \
  --resource-group rg-app-producao \
  --type Microsoft_DefaultRuleSet \
  --version 2.2 \
  --group-name SQLI \
  --rule-ids 942100 \
  --match-variable RequestArgValues \
  --match-operator Equals \
  --selector observacao
```

No DRS, o grupo se chama `SQLI`. O nome `REQUEST-942-APPLICATION-ATTACK-SQLI`, que aparece nos exemplos de exclusão da documentação, é o nome do grupo no CRS 3.2.

Repare no que eu não fiz: não usei `EqualsAny`, que exclui todos os campos, nem `Contains` com um seletor genérico, nem exclusão global. E um cuidado que costuma passar batido: no engine novo, o seletor é sensível a maiúsculas e minúsculas para corpo, query string e cookies. `Observacao` e `observacao` são campos diferentes.

## Custom rules: o que roda antes de tudo

Custom rules são avaliadas antes das managed rules, em ordem de prioridade (de 1 a 100, menor primeiro, sem repetir). Se uma delas casa com ação Allow ou Block, a avaliação para ali. Com ação Log, ela registra e deixa o resto seguir. E em Detection, até um Block só registra.

São dois tipos. A `MatchRule` age quando as condições casam; condições dentro da mesma regra são combinadas com E, e para OU você cria regras separadas. Um exemplo clássico é o geo-filtro, liberando só o Brasil:

```bash
az network application-gateway waf-policy custom-rule create \
  --policy-name waf-loja-producao \
  --resource-group rg-app-producao \
  --name somente-brasil \
  --priority 10 \
  --rule-type MatchRule \
  --action Block

az network application-gateway waf-policy custom-rule match-condition add \
  --policy-name waf-loja-producao \
  --resource-group rg-app-producao \
  --name somente-brasil \
  --match-variables RemoteAddr \
  --operator GeoMatch \
  --negate true \
  --values BR ZZ
```

O `ZZ` não é enfeite. Ele representa os IPs ainda não mapeados para um país, e a documentação pede que ele esteja sempre presente em geo-filtros para evitar falso positivo.

A `RateLimitRule` conta requisições numa janela de um ou cinco minutos, agrupadas por IP do cliente, por geografia ou por nada. Para proteger um login:

```bash
az network application-gateway waf-policy custom-rule create \
  --policy-name waf-loja-producao \
  --resource-group rg-app-producao \
  --name limite-login \
  --priority 20 \
  --rule-type RateLimitRule \
  --action Block \
  --rate-limit-duration OneMin \
  --rate-limit-threshold 100 \
  --group-by-user-session "[{group-by-variables:[{variable-name:ClientAddr}]}]"

az network application-gateway waf-policy custom-rule match-condition add \
  --policy-name waf-loja-producao \
  --resource-group rg-app-producao \
  --name limite-login \
  --match-variables RequestUri \
  --operator BeginsWith \
  --values /conta/login
```

Não trate o limite como exato. Cada instância do gateway mantém o próprio contador, então com várias instâncias ativas o volume total pode passar do limiar sem disparar. Rate limit serve para conter excesso anômalo, não para controle fino de tráfego. E mais um detalhe: regras de redirect configuradas no gateway passam por fora das custom rules.

## Uma política por site, ou por rota

Uma política associada ao gateway vale para todos os sites atrás dele. Mas a mesma WAF Policy, ou outra, pode ser associada a um listener (per-site) ou a uma regra de path (per-URI), e a mais específica vence. É assim que a API recebe um limite de upload diferente do portal, ou que uma rota de integração legada fica com exclusões que eu não quero no resto.

```bash
az network application-gateway http-listener update \
  --gateway-name agw-producao \
  --resource-group rg-app-producao \
  --name listener-api \
  --waf-policy waf-api-producao
```

Nos logs, as colunas `PolicyScope` (Global, Listener ou Location) e `PolicyScopeName` mostram qual política tratou cada requisição. E o rate limit é contado separadamente em cada ponto onde a política está associada.

## O que fica

O WAF que bloqueia usuário legítimo não é um problema de ferramenta, é um problema de processo: alguém pulou a fase de olhar os logs, ou resolveu o primeiro falso positivo desligando uma regra inteira. O trabalho que importa não está no comando que habilita o Prevention, está nas semanas anteriores, transformando cada linha da query em uma exclusão estreita ou na confirmação de que aquilo era ataque.

Das exclusões que existem hoje na sua WAF Policy, quantas você conseguiria justificar, uma por uma?
