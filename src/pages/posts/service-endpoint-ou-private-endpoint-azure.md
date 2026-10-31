---
layout: ../../layouts/PostLayout.astro
title: "Service endpoint não deixa o Storage privado: como escolher entre service endpoint e private endpoint"
category: "Networking"
tag: "networking"
date: "10 Nov 2026"
readTime: "8 min"
description: "Service endpoint e private endpoint parecem duas versões da mesma coisa, mas um mantém o endpoint público do serviço e o outro coloca um IP privado dentro da VNet. O que muda no tráfego e no DNS, o que cada um protege e um guia prático para escolher."
---

A pergunta aparece em revisão de arquitetura, em auditoria, em checklist de segurança: o storage account está acessível só pela rede interna? A resposta vem rápida. Sim, a subnet tem service endpoint e o firewall do storage só libera aquela VNet.

Aí alguém abre um terminal na VM e resolve o nome da conta. Volta um IP público. Na tela de rede do storage, o acesso público continua habilitado, só que restrito a redes selecionadas.

A configuração não está errada. O que está errado é a palavra "privado". Service endpoint e private endpoint resolvem problemas parecidos de jeitos muito diferentes, e tratar um como a versão gratuita do outro é a origem de boa parte das surpresas.

## O que o service endpoint faz de verdade

O service endpoint é habilitado na subnet, por serviço: `Microsoft.Storage`, `Microsoft.Sql`, `Microsoft.KeyVault` e outros. Ele faz duas coisas.

**Muda a rota.** A subnet ganha rotas mais específicas para os prefixos do serviço, com next hop do tipo VirtualNetworkServiceEndpoint. Essas rotas têm prioridade sobre UDR e BGP para esses prefixos. Na prática, o tráfego para o serviço vai direto pelo backbone da Microsoft, mesmo com forced tunneling mandando o resto da internet para o datacenter ou para um firewall.

**Muda a identidade da origem.** Sem o endpoint, a VM chega ao serviço usando um IP público como origem. Com ele, o serviço passa a ver o IP privado da VM e a subnet de onde ela vem. É isso que permite criar, no firewall do storage, uma regra de rede virtual que libera só aquela subnet.

O que não muda: o destino. O DNS continua resolvendo o nome do serviço para o IP público, e o cliente continua batendo no endpoint público. A conta precisa manter o acesso público habilitado, no modo de redes selecionadas, para a regra de VNet ter efeito. E habilitar o endpoint na subnet não libera nada sozinho: a conta precisa da regra para aquela subnet, e a requisição continua precisando de autorização.

Um detalhe operacional que pega muita gente: quando o endpoint é habilitado, a origem do tráfego troca de IP público para IP privado. As conexões TCP abertas com o serviço são fechadas, e qualquer regra de firewall que liberava o IP público da VM para de funcionar. Vale uma janela de mudança, mesmo sendo "só um checkbox".

Service endpoint não tem cobrança adicional.

## O que o private endpoint faz

O private endpoint é uma interface de rede na sua subnet, com um IP privado, mapeada para uma instância específica do serviço: aquele storage account, aquele servidor SQL. O [artigo sobre private endpoints](/posts/private-endpoints-azure/) mostra a criação passo a passo. Aqui importa a diferença de modelo.

O nome do serviço não muda para a aplicação. O DNS público devolve um CNAME para um nome `privatelink`, e uma zona de DNS privado ligada à VNet responde esse nome com o IP do private endpoint. O tráfego não usa o endpoint público da conta. Com isso, dá para desligar o acesso público do recurso inteiro, e é o que a Microsoft orienta fazer depois de criar o private endpoint. Se o acesso público continuar ligado, o recurso continua alcançável por fora.

![Comparação lado a lado: com service endpoint, o DNS resolve para o IP público e o tráfego vai pelo backbone até o endpoint público do Storage; com private endpoint, a zona DNS privada resolve para um IP da VNet e o tráfego chega ao storage account pelo Private Link](/images/posts/service-endpoint-ou-private-endpoint-azure/service-vs-private-endpoint.svg)

## O DNS conta a verdade

Se existe uma forma rápida de saber qual dos dois está em uso, é resolver o nome de dentro da VNet. É o primeiro passo do guia de troubleshooting da Microsoft para private endpoint:

```bash
nslookup <conta>.blob.core.windows.net
```

Com service endpoint, a resposta é um IP público. É o esperado: o DNS não muda. Com private endpoint funcionando, a resposta é um IP privado da sua faixa.

Se você criou o private endpoint e o nome ainda resolve para IP público, o problema mais comum é a zona DNS privada não estar ligada à VNet de onde vem a consulta, ou o DNS customizado não encaminhar para o Azure. Nesse caso a aplicação ignora o private endpoint e tenta o caminho público. Se o acesso público estiver desligado, a conexão falha. Se estiver ligado, funciona por fora sem ninguém perceber, o que é pior.

Um ponto que costuma gerar alarme falso: o nome da conta continua resolvendo no DNS público mesmo com o acesso público desligado. A documentação do Private Link trata isso como esperado (a nota mais explícita está na página do Key Vault). Resolver o nome não dá acesso; quem bloqueia é a configuração de acesso público do recurso.

## O que cada um protege, e o que não protege

**Exfiltração de dados.** Aqui está a diferença mais importante, e a menos lembrada. O service endpoint vale para o serviço inteiro, não para a sua conta. Uma subnet com service endpoint de Storage consegue chegar a qualquer storage account que aceite aquele tráfego, inclusive uma conta de fora da empresa configurada para aceitar qualquer rede. O private endpoint é mapeado para uma instância só: pelo IP dele, não se chega a outra conta. Na tabela comparativa da Microsoft, proteção nativa contra exfiltração aparece como "não" para service endpoint e "sim" para private endpoint.

Para Storage existe um meio-termo: as **service endpoint policies**. Elas se aplicam à subnet e funcionam como lista de permissão: só as contas listadas (por assinatura, por resource group ou conta a conta) ficam acessíveis pelo service endpoint, e o resto é negado. Não têm cobrança adicional. Têm limitações que precisam entrar na conta: não valem para tráfego vindo do ambiente local, a maioria dos serviços gerenciados implantados na VNet não é suportada (a exceção documentada é o SQL Managed Instance), e contas clássicas são negadas. Como é lista de permissão, uma dependência esquecida vira indisponibilidade.

**Acesso do ambiente local.** Service endpoint não funciona para tráfego que vem do datacenter pela VPN ou pelo ExpressRoute. A alternativa documentada é liberar no firewall do serviço os IPs públicos (normalmente de NAT) de onde esse tráfego sai. Private endpoint tem IP roteável na VNet, então é alcançável pela VPN ou pelo ExpressRoute, desde que o DNS local saiba encaminhar a consulta. É aí que entra um [DNS Private Resolver bem desenhado](/posts/azure-private-dns-resolver-arquitetura/).

**Outras regiões.** Para Storage, existe o `Microsoft.Storage.Global`, que permite chegar a contas em qualquer região, e a documentação recomenda preferi-lo ao regional. Uma subnet não usa os dois tipos ao mesmo tempo. Para Azure SQL, o service endpoint só vale dentro da mesma região. O private endpoint fica na região da VNet, mas o recurso de destino pode estar em outra região.

## Custo, em conceito

Service endpoint e service endpoint policies não têm cobrança adicional. Private endpoint tem custo por hora de cada endpoint e por GB de dados processados, e a arquitetura em volta (zonas DNS privadas, consultas, tráfego entre regiões) também entra na fatura. Multiplicado por dezenas de contas em vários spokes, isso vira linha de orçamento, e a decisão deixa de ser só técnica.

## Como eu escolho

A própria Microsoft recomenda Private Link para acesso privado a PaaS, e eu concordo com a direção. Mas recomendação geral não substitui pergunta específica. O roteiro que uso:

**Os dados são sensíveis, ou existe exigência de compliance sobre exfiltração?** Private endpoint, com acesso público desligado. Service endpoint não fecha esse risco.

**Precisa acessar do ambiente local por rede privada?** Private endpoint. Service endpoint não atende esse tráfego.

**É restrição simples de VNet, baixo risco, ou o serviço não tem Private Link?** Service endpoint resolve, é gratuito e sobe em minutos. Se for Storage, avalie as policies para limitar quais contas a subnet alcança.

**Está em dúvida?** Na minha opinião, para desenho novo, private endpoint deveria ser o padrão e service endpoint uma exceção justificada, não o contrário.

## O que fica

Service endpoint não é um private endpoint barato. Ele melhora a rota e dá identidade à sua subnet, mas o serviço continua com endereço público e a subnet continua podendo falar com contas que não são suas. Isso pode ser suficiente. O problema é quando ele é registrado como "acesso privado" num relatório de segurança.

E mesmo o private endpoint resolve o caminho de rede, não a fronteira do PaaS como um todo. Esse é o espaço do Network Security Perimeter, que merece uma conversa própria.

Se alguém perguntar se o seu storage está privado, você responde pelo portal ou pelo nslookup?
