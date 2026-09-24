---
layout: ../../layouts/PostLayout.astro
title: "ExpressRoute FastPath e Global Reach: quando o bypass do gateway faz diferença"
category: "Networking"
tag: "networking"
date: "01 Dez 2025"
readTime: "5 min"
description: "O circuito é grande, mas a vazão não passa de uma fração dele. Às vezes o gargalo é o gateway, e o FastPath o tira do caminho. O que o FastPath resolve, onde ele não ajuda, o que depende de ExpressRoute Direct e onde entra o Global Reach."
---

Um time me procurou com uma reclamação que eu já ouvi em mais de um lugar: o circuito ExpressRoute tinha banda de sobra, mas a transferência entre o datacenter e as VMs no Azure não passava de uma fração dela. Cogitaram trocar de provedor, falaram em aumentar o circuito, e ninguém tinha olhado para o gateway.

Todo tráfego que chega à VNet pelo private peering do ExpressRoute passa, por padrão, pelo gateway de rede virtual. E cada SKU de gateway tem o seu próprio teto de banda e de pacotes por segundo. Se o gateway é menor que o circuito, o circuito maior não muda nada.

É esse o problema que o FastPath resolve, e só esse.

## O que o FastPath faz

Sem FastPath:

```
On-premises -> borda da Microsoft -> gateway ExpressRoute -> VMs
```

Com FastPath:

```
On-premises -> borda da Microsoft -> VMs
               (gateway continua só na troca de rotas BGP)
```

O gateway sai do caminho dos dados, mas continua existindo: é ele que troca as rotas entre a VNet e o on-premises. O ganho é menos um salto, menor latência e vazão que deixa de depender do teto do gateway.

Para usar, o gateway precisa ser Ultra Performance, ErGw3AZ ou ErGwScale com pelo menos 10 unidades de escala. No Virtual WAN, o FastPath só vale para ExpressRoute Direct: vem ligado por padrão em gateways com pelo menos 5 unidades de escala.

A habilitação é feita na conexão entre o circuito e o gateway:

```powershell
$conexao = Get-AzVirtualNetworkGatewayConnection -Name "conn-er-prod" -ResourceGroupName "rg-networking"
$conexao.ExpressRouteGatewayBypass = $true
Set-AzVirtualNetworkGatewayConnection -VirtualNetworkGatewayConnection $conexao
```

Dois detalhes da documentação: numa conexão que já tinha FastPath, o suporte a peering e UDR só passa a valer depois de desligar e ligar o FastPath de novo; e o suporte a Private Link exige também `EnablePrivateLinkFastPath = $true` na conexão.

## Onde ele não ajuda

A parte que mais gera frustração é que o FastPath tem limites claros, e a maioria dos ambientes corporativos esbarra em algum deles:

**Load balancers internos e serviços PaaS em spokes.** O tráfego para eles continua passando pelo gateway. Load balancer interno no hub funciona com FastPath.

**Azure Firewall em spoke.** Só é suportado com o firewall no hub.

**Private DNS Resolver em spoke.** Mesmo caso, só no hub.

**Peering global.** Não é suportado: hub e spokes precisam estar na mesma região.

**Conectividade entre regiões.** Não é suportada para VNets, Private Endpoints e Private Link.

Se a carga que você quer acelerar mora num desses lugares, o FastPath não muda nada, e a conversa volta para o tamanho do gateway.

## O que depende de ExpressRoute Direct

Aqui mora a parte que mais confunde. Parte dos recursos do FastPath só existe para quem usa ExpressRoute Direct, que é a conexão direta às portas da Microsoft, sem um circuito de provedor no meio:

| Recurso | Circuito de provedor | ExpressRoute Direct | Situação |
|---------|:--------------------:|:-------------------:|----------|
| FastPath para VMs na VNet do hub | Sim | Sim | GA |
| FastPath para spokes via peering | Não | Sim | GA |
| FastPath com UDR | Não | Sim | GA |
| IPv6 | Não | Sim | GA |
| Private Endpoints e Private Link | Não | Sim | GA limitado, com inscrição |
| FastPath no Virtual WAN | Não | Sim | GA |

Durante muito tempo, a resposta curta foi que o FastPath não funcionava com Private Endpoints. Hoje funciona, com várias condições: só com ExpressRoute Direct, com inscrição prévia, implantação de 4 a 6 semanas depois da aprovação, numa lista fechada de regiões e para uma lista fechada de serviços (Storage, Key Vault, Cosmos DB e serviços Private Link de terceiros). Azure OpenAI e SQL não estão nessa lista, e Brazil South não aparece entre as regiões suportadas. Para quem acessa esses serviços por Private Endpoint a partir do on-premises no Brasil, o caminho ainda passa pelo gateway.

## Global Reach: outro problema, outra solução

FastPath é sobre o caminho entre on-premises e Azure. Global Reach é sobre ligar dois ambientes on-premises entre si, usando o backbone da Microsoft.

Com um datacenter em São Paulo, com circuito no peering location São Paulo, e um escritório em Lisboa, com circuito num peering location europeu, sem Global Reach o tráfego entre os dois vai por outro caminho, normalmente internet ou MPLS próprio. Com Global Reach, os dois circuitos se ligam e o tráfego passa pela rede da Microsoft.

```bash
az network express-route peering connection create \
  --resource-group rg-networking \
  --circuit-name er-circuito-saopaulo \
  --peering-name AzurePrivatePeering \
  --name conn-sp-lisboa \
  --peer-circuit $(az network express-route show --name er-circuito-lisboa --resource-group rg-networking --query id -o tsv) \
  --address-prefix 192.168.100.0/29
```

São Paulo está na lista de peering locations com Global Reach. Ligar circuitos em regiões geopolíticas diferentes, como no exemplo, exige o complemento Premium nos circuitos. Vale colocar isso na conta antes de prometer a conexão.

## E o Megaport?

Provedores com fabric de interconexão, como o Megaport, resolvem um problema diferente: em vez de contratar um circuito físico para cada destino, você tem uma porta no provedor e cria conexões virtuais para a Microsoft e para outras nuvens. É uma decisão de modelo de contratação e de operação, não de desempenho. Não confunda com FastPath: com provedor, os recursos da tabela que exigem ExpressRoute Direct continuam indisponíveis.

## Como decidir antes de gastar

| Sintoma | Primeiro passo |
|---------|----------------|
| Vazão bem abaixo do circuito, VMs no hub | Olhar o SKU do gateway; FastPath se o gateway for compatível |
| Vazão baixa para PaaS ou Private Endpoint | FastPath provavelmente não ajuda; avaliar gateway maior |
| Latência alta em todo o tráfego | Medir antes; o problema pode estar no roteamento on-premises |
| Dois datacenters falando pela internet | Global Reach |

Antes de qualquer mudança, meça. O Connection Monitor, do Network Watcher, mostra latência e perda ponta a ponta ao longo de dias. Já vi upgrade de circuito aprovado para um problema que estava num roteador on-premises.

## O que fica

FastPath é uma ferramenta boa para um problema específico: o gateway como gargalo de tráfego para VMs. Fora disso, a lista de exceções é longa, e parte do que ele promete depende de ExpressRoute Direct.

No seu ambiente, alguém já comparou o teto do gateway com o tamanho do circuito que a empresa paga?
