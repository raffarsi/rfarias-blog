---
layout: ../../layouts/PostLayout.astro
title: "A VM não chega ao on-premises: o roteiro que eu sigo na conectividade híbrida do Azure"
category: "Networking"
tag: "networking"
date: "27 Out 2026"
readTime: "8 min"
description: "Quando a VM no spoke não alcança o datacenter, cada time jura que o seu lado está liberado e a investigação começa pelo lugar errado. Um checklist em sete camadas, com o comando de cada uma e o sinal de problema, para VPN Gateway e ExpressRoute."
---

A VM nova no spoke subiu às dez da manhã e, ao meio-dia, a aplicação ainda não alcançava o servidor do datacenter. O time de rede do on-premises jura que está tudo liberado. O time de nuvem também. A primeira hora vai embora em prints de regra trocados, e ninguém olhou para onde o pacote realmente vai.

Hoje eu sigo sempre a mesma ordem: primeiro o caminho de ida dentro do Azure, depois o que o gateway sabe, depois o que filtra, e só então a volta e o lado de lá. Cada etapa abaixo tem o que verificar, o comando e o que indica problema.

## 1. Rotas efetivas da NIC

**O que verificar.** Vale a tabela efetiva da placa de rede, não a route table associada: rotas de sistema, do gateway e UDRs já combinadas. Só existe saída com a VM ligada.

```bash
az network nic show-effective-route-table \
  --resource-group rg-app \
  --name nic-vm-app01 \
  --output table
```

**O que procurar.** Uma rota que cubra o prefixo do on-premises com next hop Virtual network gateway (origem Virtual network gateway, estado Active). Se existe firewall no hub, o esperado é uma rota de usuário com next hop Virtual appliance apontando para o IP privado dele.

**O que indica problema.** Nenhuma rota para o prefixo do on-premises, e o tráfego cai no 0.0.0.0/0. Uma UDR 0.0.0.0/0 ou uma rota mais específica desviando para um appliance que ninguém lembrava. Uma rota do gateway com estado Invalid, sinal de que outra rota a substituiu. Next hop IP igual a None com tipo Virtual network gateway ou Virtual appliance, que a documentação associa a um dispositivo que não está rodando ou não está totalmente configurado.

**Propagação de rotas do gateway.** Se a route table da sub-rede está com a propagação desligada (`--disable-bgp-route-propagation true`), nenhuma rota do gateway entra ali, nem estática nem BGP. Isso é intencional quando tudo deve passar pelo firewall do hub, desde que exista a UDR equivalente. Detalhe importante: a UDR com next hop Virtual network gateway só é suportada com VPN Gateway. Com ExpressRoute, o caminho sem propagação é via appliance.

## 2. Peering no hub-and-spoke

**O que verificar.** O spoke não tem gateway próprio: ele usa o do hub. Para isso, o peering do hub para o spoke precisa permitir o trânsito (Allow gateway transit, no portal "Allow gateway or route server in 'vnet-hub' to forward traffic to the peered virtual network"), e o peering do spoke para o hub precisa usar o gateway remoto (Use remote gateways).

```bash
az network vnet peering show \
  --resource-group rg-rede-central \
  --vnet-name vnet-hub \
  --name hub-para-spoke-app \
  --query "{estado:peeringState, sync:peeringSyncLevel, transit:allowGatewayTransit}"

az network vnet peering show \
  --resource-group rg-app \
  --vnet-name vnet-spoke-app \
  --name spoke-app-para-hub \
  --query "{estado:peeringState, sync:peeringSyncLevel, remoto:useRemoteGateways}"
```

**O que indica problema.** Qualquer uma das duas flags desligada: as rotas do on-premises não chegam à NIC do spoke. Um spoke com gateway próprio não pode usar o remoto, e só um peering por VNet pode ter Use remote gateways. Se alguém ampliou o espaço de endereços de uma das VNets e não fez o sync do peering, o tráfego pode não ser roteado corretamente.

## 3. BGP no gateway

**O que verificar.** Com a rota certa na NIC, a pergunta passa a ser o que o gateway aprendeu e o que ele está anunciando. Antes, confirme a conexão VPN conectada, ou o circuito com Circuit status Enabled e Provider status Provisioned.

Para VPN Gateway com BGP:

```bash
az network vnet-gateway list-learned-routes \
  --resource-group rg-rede-central --name vpngw-hub --output table

az network vnet-gateway list-advertised-routes \
  --resource-group rg-rede-central --name vpngw-hub \
  --peer 172.16.255.1 --output table
```

Para ExpressRoute, a tabela de rotas do peering privado no roteador da Microsoft, caminho primário e secundário:

```bash
az network express-route list-route-tables \
  --resource-group rg-rede-central --name er-circuito-sp \
  --peering-name AzurePrivatePeering --path primary
```

**O que indica problema.** O prefixo do servidor não aparece entre as rotas aprendidas: o on-premises não está anunciando, ou uma política de saída no roteador local está suprimindo o anúncio. A faixa do spoke não aparece entre as anunciadas: volte à etapa 2, ou verifique se há prefixos resumidos configurados na VNet do hub (`summarizedGatewayPrefixes`). Com eles, o gateway anuncia os resumos e deixa de anunciar os espaços do hub e dos spokes que estão cobertos por algum resumo; o que não está coberto continua sendo anunciado. Nesse caso, procure o resumo que cobre a faixa do spoke, não a faixa em si. No ExpressRoute, compare primário e secundário.

## 4. NSG e firewall no caminho

**O que verificar.** Rota certa não significa tráfego permitido. Eu uso três ferramentas do Network Watcher.

```bash
az network watcher test-ip-flow \
  --resource-group rg-app --vm vm-app01 \
  --direction Outbound --protocol TCP \
  --local 10.20.1.4:* --remote 172.16.10.20:1433

az network watcher show-next-hop \
  --resource-group rg-app --vm vm-app01 \
  --source-ip 10.20.1.4 --dest-ip 172.16.10.20

az network watcher test-connectivity \
  --resource-group rg-app --source-resource vm-app01 \
  --dest-address 172.16.10.20 --dest-port 1433
```

**IP flow verify** responde se as regras dos NSGs aplicados à NIC (associados à própria NIC ou à sub-rede) e as admin rules do Azure Virtual Network Manager aplicadas à VNet da VM permitem o pacote, e qual regra decidiu. Testa só TCP e UDP; para ICMP, a documentação indica NSG diagnostics. **Next hop** devolve o tipo, o IP e a route table que decidiu o próximo salto. **Connection troubleshoot** testa a conexão de fato e aponta rotas ausentes, NSG bloqueando, firewall dentro da VM, falha de DNS, ARP ausente no ExpressRoute e servidor que não escuta na porta; a execução sem agente está em preview.

**O que indica problema.** Access denied com o nome de uma regra. Next hop apontando para um appliance, e aí a pergunta vai para as regras e os logs do firewall do hub, que o IP flow verify não avalia.

**O que está sendo aposentado.** Na documentação atual, o IP flow verify não tem aviso de aposentadoria. Quem se aposenta são os NSG flow logs: 30 de setembro de 2027, e desde já não é possível criar novos. Para registrar fluxos, use VNet flow logs.

## 5. A volta: roteamento assimétrico e GatewaySubnet

**O que verificar.** O desenho documentado para firewall no hub tem duas metades: a UDR no spoke mandando para o firewall o tráfego com destino ao on-premises (o tutorial usa uma rota padrão 0.0.0.0/0 apontando para o firewall), e uma UDR na GatewaySubnet mandando o prefixo do spoke para o firewall. Quem configura só a primeira cria um caminho assimétrico: a ida passa pelo firewall, a volta sai do gateway direto para o spoke pelo peering. Firewall stateful descarta o que não viu começar.

```bash
az network route-table route list \
  --resource-group rg-rede-central \
  --route-table-name rt-gatewaysubnet --output table
```

**O que a GatewaySubnet permite e proíbe.** UDR com destino 0.0.0.0/0 não é suportada, nem NSG. UDR contendo a faixa da própria GatewaySubnet com next hop None, ou para um appliance que descarta o tráfego, também não. A propagação de rotas BGP precisa ficar habilitada: desligada, o gateway não funciona. UDRs que se sobrepõem à faixa da GatewaySubnet ou ao IP público do gateway podem afetar diagnóstico, plano de dados e plano de controle.

**O que indica problema.** Tráfego registrado no firewall em só um sentido. Route table da GatewaySubnet com 0.0.0.0/0 ou com a propagação desligada.

## 6. Sobreposição de faixas e prefixo mais específico

**O que verificar.** O Azure escolhe a rota pelo prefixo mais longo. Com prefixos iguais, a ordem é UDR, depois BGP, depois rota de sistema. Existe uma exceção que pega muita gente: rotas de sistema de VNet e de peering são preferidas mesmo que a rota BGP seja mais específica.

**O que indica problema.** O on-premises usa uma faixa que coincide com a de alguma VNet. O tráfego nunca vai ao gateway, porque a rota de peering vence. No ExpressRoute, as faixas do peering não podem se sobrepor às das VNets. No VPN Gateway, o NAT existe justamente para ligar redes sobrepostas; com NAT dinâmico, a comunicação só pode ser iniciada pelo lado da regra interna.

## 7. O lado on-premises

**O que verificar.** O dispositivo local conhece a faixa do spoke? A documentação de troubleshooting de peering pede que o time do on-premises confirme que todos os dispositivos têm o espaço de endereços da VNet remota. Em VPN baseada em política, as faixas precisam bater exatamente entre o local network gateway e o dispositivo. O firewall local libera a faixa do spoke, e não só a do hub? Há NAT local trocando o IP de origem que o NSG espera?

**O que indica problema.** O Azure entrega o pacote e a resposta nunca volta. No ExpressRoute, o teste de conectividade do peering privado mostra isso com clareza: pacotes enviados ao on-premises sem pacotes recebidos de volta.

## Quando abrir chamado

Pelo ExpressRoute, a documentação é direta. Circuit status preso em Not enabled é chamado na Microsoft. Provider status preso em Not provisioned é com o provedor. Em Diagnose and solve problems, o circuito tem um teste de conectividade do peering privado que conta pacotes nos dois roteadores da Microsoft: se o tráfego chega ao on-premises e não volta, a orientação é acionar o provedor; se um dos dois roteadores não mostra nada, pode estar fora (BGP ou ARP caído).

No VPN Gateway, eu rodo o VPN troubleshoot do Network Watcher (suporta gateways route-based, não policy-based nem ExpressRoute). Se o túnel site-to-site não conecta, o primeiro passo da própria documentação é resetar o gateway do Azure e o túnel no dispositivo local; antes do reset, confira os itens de configuração que a documentação lista, porque o reset reinicia uma instância do gateway e causa uma interrupção breve.

## O que fica

Conectividade híbrida quebrada quase nunca é mistério: é ordem de investigação. Quando o roteiro existe e está escrito, a discussão deixa de ser "o meu lado está liberado" e vira "a rota efetiva mostra isto, o gateway aprendeu aquilo, a regra que bloqueou foi esta". Eu não aceitaria abrir chamado sem as saídas das etapas 1 a 4 anexadas.

Quando a conectividade híbrida quebra no seu ambiente, existe um roteiro, ou cada investigação começa do zero?
