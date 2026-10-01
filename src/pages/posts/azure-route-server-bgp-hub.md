---
layout: ../../layouts/PostLayout.astro
title: "Azure Route Server: rotas BGP da NVA chegando aos spokes sem UDR manual"
category: "Networking"
tag: "networking"
date: "03 Nov 2025"
readTime: "8 min"
description: "Toda vez que surge um prefixo novo atrás da NVA do hub, alguém precisa atualizar UDRs em cada spoke. Como o Azure Route Server troca rotas BGP com a NVA e as programa nas VMs, quando ele substitui a UDR estática e as armadilhas de operação que a documentação deixa em notas de rodapé."
---

Tenho uma NVA de terceiros no hub, fechando túneis com as filiais. Cada filial nova traz um prefixo novo, e o ritual se repete: abrir a route table de cada spoke, criar a rota apontando para o IP interno da NVA, conferir se ninguém esqueceu um spoke. A NVA já conhece o prefixo, porque aprendeu por BGP com o roteador da filial. Quem não conhece é a rede do Azure, que só sabe o que eu escrevo à mão.

Esse descompasso entre um equipamento que fala BGP e uma rede virtual que só aceita rota estática é exatamente o que o Azure Route Server resolve.

## Como ele funciona

O Route Server é um serviço gerenciado que fala BGP com as NVAs da VNet e programa as rotas aprendidas direto no SDN do Azure. A NVA anuncia o prefixo da filial, o Route Server recebe e as VMs passam a ter essa rota na tabela efetiva, com a NVA como próximo salto. No sentido contrário, ele anuncia para a NVA os prefixos da VNet, e a NVA pode repassá-los para a filial.

Três detalhes mudam a forma de pensar o desenho.

**Ele não está no caminho dos dados.** O Route Server só troca rotas. O tráfego vai da VM direto para a NVA e da NVA direto para o destino. Pela mesma razão, a documentação deixa claro que dois Route Servers em VNets pareadas não fazem trânsito entre NVAs: quem encaminha é sempre a NVA.

**São duas instâncias, e a NVA precisa falar com as duas.** O comando `az network routeserver show` devolve dois IPs em `virtualRouterIps` e o ASN em `virtualRouterAsn`, que é 65515. A documentação é taxativa: cada NVA faz peering com as duas instâncias e anuncia as mesmas rotas para ambas. Se uma das sessões estiver faltando, as VMs podem receber informação de roteamento inconsistente, e durante a manutenção do serviço uma das sessões pode cair.

**É eBGP multi-hop.** O Route Server fica numa sub-rede dedicada, e a NVA fica em outra. Por isso a NVA precisa suportar BGP externo multi-hop e usar um ASN diferente de 65515.

## Os spokes também recebem as rotas

O ganho de verdade está no hub-and-spoke. Quando o spoke é pareado com o hub e o peering do lado do spoke tem habilitada a opção **Use the remote virtual network's gateway or Route Server**, o Route Server faz duas coisas: aprende o espaço de endereços do spoke e anuncia para as NVAs, e programa as rotas das NVAs nas VMs do spoke. Do lado do hub, o peering precisa permitir que o gateway ou o Route Server encaminhe tráfego para a rede pareada.

Na prática, é isso que tira a UDR do spoke. A filial nova aparece na tabela efetiva de todas as VMs dos spokes sem que ninguém abra uma route table.

## Branch-to-branch: quando há VPN ou ExpressRoute no hub

Se o hub também tem um VPN Gateway ou um ExpressRoute Gateway, existe um comportamento padrão que surpreende: o Route Server não troca rotas entre as NVAs e os gateways. A NVA não aprende o que vem pelo ExpressRoute, e o on-premises do ExpressRoute não aprende o que a NVA anuncia.

Essa troca só acontece depois de habilitar o **branch-to-branch**. Com ele ligado, o Route Server também dá trânsito entre ExpressRoute e VPN site-to-site (point-to-site fica de fora). Duas condições que valem anotar: o VPN Gateway precisa estar em modo ativo-ativo com ASN 65515, e o total de rotas anunciadas para o circuito ExpressRoute, somando o espaço da VNet e o que vem do Route Server, não pode passar de 1.000.

## UDR estática ou Route Server

| Critério | UDR estática | Route Server |
|----------|--------------|--------------|
| Prefixo novo atrás da NVA | Editar a route table de cada sub-rede | Chega por BGP, sem intervenção |
| Failover entre NVAs | Depende de Load Balancer ou de automação que reescreve a UDR | ECMP ou ativo-passivo por tamanho de AS path |
| Desvio de tráfego entre sub-redes da mesma VNet | Funciona | Não funciona: rota de sistema vence |
| Pré-requisitos | Nenhum | Sub-rede /26 dedicada, IP público Standard, NVA com BGP multi-hop |
| Visibilidade | A rota está escrita na route table | A rota aparece na tabela efetiva da NIC e nas rotas aprendidas de cada peering do Route Server |

A linha do meio é a que mais engana. As rotas de sistema da própria VNet, do peering e dos service endpoints têm preferência sobre rotas BGP, mesmo quando a rota BGP é mais específica. Inspeção entre sub-redes da mesma VNet continua sendo trabalho de UDR.

Eu uso Route Server quando a NVA aprende prefixos de fora que mudam com frequência, como filiais em SD-WAN ou túneis IPsec, ou quando quero duas NVAs dividindo carga sem automação de failover. Para um hub com poucas rotas estáveis, a UDR continua mais simples e mais fácil de auditar.

## Configuração com Azure CLI

O Route Server exige a sub-rede com o nome exato `RouteServerSubnet`, tamanho mínimo /26, e um IP público Standard. O IP público não expõe a VNet: ele existe para a plataforma de gerenciamento do Azure falar com o serviço, com autenticação por certificado.

```bash
az network vnet subnet create \
  --resource-group rg-rede-central \
  --vnet-name vnet-hub \
  --name RouteServerSubnet \
  --address-prefixes 10.0.1.0/26

az network public-ip create \
  --resource-group rg-rede-central \
  --name pip-routeserver-hub \
  --sku Standard \
  --version IPv4

az network routeserver create \
  --resource-group rg-rede-central \
  --name rs-hub \
  --hosted-subnet $(az network vnet subnet show \
      --resource-group rg-rede-central --vnet-name vnet-hub \
      --name RouteServerSubnet --query id -o tsv) \
  --public-ip-address pip-routeserver-hub
```

Depois, um peering por instância de NVA. Os IPs e o ASN do Route Server, que vão na configuração BGP da NVA, saem do `show`:

```bash
az network routeserver peering create \
  --resource-group rg-rede-central \
  --routeserver rs-hub \
  --name nva-hub-01 \
  --peer-ip 10.0.2.4 \
  --peer-asn 65001

az network routeserver show \
  --resource-group rg-rede-central --name rs-hub \
  --query "{asn:virtualRouterAsn, ips:virtualRouterIps}"
```

Se houver gateway no hub, o branch-to-branch é um parâmetro de update:

```bash
az network routeserver update \
  --resource-group rg-rede-central \
  --name rs-hub \
  --allow-b2b-traffic true
```

O peering é configurado dos dois lados. O lado do hub usa `--allow-gateway-transit`, que permite ao gateway ou Route Server do hub encaminhar tráfego para a rede pareada. O lado do spoke usa `--use-remote-gateways`, que só pode ser habilitado se o hub tiver gateway ou Route Server e o lado do hub permitir esse trânsito:

```bash
az network vnet peering create \
  --resource-group rg-rede-central \
  --vnet-name vnet-hub \
  --name hub-para-spoke-app \
  --remote-vnet vnet-spoke-app \
  --allow-vnet-access \
  --allow-forwarded-traffic \
  --allow-gateway-transit

az network vnet peering create \
  --resource-group rg-rede-central \
  --vnet-name vnet-spoke-app \
  --name spoke-app-para-hub \
  --remote-vnet vnet-hub \
  --allow-vnet-access \
  --allow-forwarded-traffic \
  --use-remote-gateways
```

Se o peering do hub já existir, a opção entra com `az network vnet peering update --resource-group rg-rede-central --vnet-name vnet-hub --name hub-para-spoke-app --allow-gateway-transit true`.

Para conferir o que entrou e saiu de cada sessão, `az network routeserver peering list-learned-routes` e `list-advertised-routes`, com `--routeserver` e `--name` do peering.

## Armadilhas de operação

**O limite de 4.000 rotas por peer derruba a sessão.** Se a NVA anunciar mais que isso, o Route Server encerra o BGP com ela. E a conta inclui as rotas atuais mais as que chegam no update: uma NVA com 2.001 rotas que reanuncia as mesmas 2.001 é contada como 4.002. Sumarizar na NVA não é capricho.

**O 0.0.0.0/0 anunciado pela NVA volta para ela mesma.** O Route Server programa a rota padrão em todas as VMs da VNet, inclusive na NVA. Sem uma UDR de 0.0.0.0/0 com próximo salto Internet na sub-rede da NVA, ela manda o próprio tráfego de saída para si mesma.

**O próximo salto precisa ser válido.** A rota anunciada deve apontar para a própria NVA, para um Load Balancer na frente dela ou para outra NVA na mesma VNet. Se a rota anunciada tem o mesmo prefixo de uma UDR e aponta para um Load Balancer sem backend, ela é inválida, prevalece sobre a UDR e aparece na tabela efetiva com próximo salto None.

**ASN reservado não serve para a NVA.** O Azure reserva 8074, 8075 e 12076, além dos privados 65515 e de 65517 a 65520. O Route Server só aceita ASN de 16 bits e, por prevenção de loop, rejeita rotas cujo AS path já contém 65515: elas não são instaladas nem propagadas.

**Spoke a spoke exige supernet.** O Route Server não anuncia rotas com prefixo igual ou mais longo que o espaço de endereços da VNet. Para forçar o tráfego entre spokes pela NVA, ela anuncia uma rota mais curta, como um 10.0.0.0/8.

**"Propagate gateway routes" desligado bloqueia o Route Server também.** Desligar essa opção na route table do spoke impede que ele aprenda as rotas dinâmicas.

**A RouteServerSubnet não aceita UDR nem NSG.** E criar ou remover o Route Server numa VNet que já tem gateway causa cerca de 10 minutos de indisponibilidade, com implantação que pode levar de 30 a 60 minutos. Janela de manutenção, sempre.

## O que fica

O Route Server não elimina a UDR, ele muda o lugar onde a verdade do roteamento mora. Antes ela estava escrita nas route tables, visível para qualquer um. Agora está na configuração BGP da NVA, e uma rota mal anunciada chega a todos os spokes de uma vez. Isso pede que a configuração da NVA seja revisada como código, com o mesmo rigor de um pull request de infraestrutura.

Se hoje alguém perguntasse qual rota a sua NVA está anunciando para o Azure neste momento, quanto tempo levaria para alguém responder?
