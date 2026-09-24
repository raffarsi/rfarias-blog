---
layout: ../../layouts/PostLayout.astro
title: "Azure Private DNS Resolver: resolução de nomes centralizada no hub"
category: "Networking"
tag: "networking"
date: "18 Dez 2025"
readTime: "5 min"
description: "Funciona no primeiro spoke. No segundo já não resolve, e no on-premises também não. Como montar o Private DNS Resolver no hub, as duas formas de os spokes o usarem e os erros que criam loop de DNS."
---

Já vi essa sequência acontecer mais de uma vez. O time cria o Private Endpoint, cria a zona Private DNS, vincula à VNet. A VM do spoke resolve o nome para o IP privado e acessa o recurso. Tudo certo.

Aí entra um segundo spoke, e ele não resolve. Depois o servidor on-premises tenta acessar o mesmo serviço e recebe o IP público, que está bloqueado. Cada peça nova da topologia vira um chamado de DNS.

O problema não é o Private Endpoint. É que a resolução de nomes foi montada para uma VNet, e a topologia tem várias.

## Por que o DNS quebra quando a topologia cresce

Toda VNet usa por padrão o DNS do Azure, no IP 168.63.129.16. Ele resolve os nomes das zonas Private DNS vinculadas àquela VNet, e só delas. Spoke sem vínculo com a zona recebe a resposta pública.

Dá para vincular todas as zonas a todas as VNets, e em ambiente pequeno isso funciona. Com dezenas de spokes e uma zona por serviço PaaS, vira uma matriz de vínculos que ninguém mantém.

O on-premises tem um problema diferente: o 168.63.129.16 só atende recursos dentro de uma VNet do Azure. O DNS da empresa não tem como perguntar nada a ele, nem pela VPN, nem pelo ExpressRoute.

O Private DNS Resolver resolve os dois lados. Ele coloca um endereço IP de verdade dentro da sua VNet, que qualquer um alcança pela rede, e responde usando as zonas vinculadas à VNet onde ele está.

## As duas peças do Resolver

**Inbound endpoint.** Recebe consultas. Tem um IP privado na sua VNet, e é para ele que o on-premises e os spokes apontam. Ele responde com base nas zonas Private DNS vinculadas à VNet do resolver.

**Outbound endpoint com ruleset.** Envia consultas. Quando uma VM no Azure precisa resolver um nome da empresa, como `empresa.local`, o ruleset diz para qual servidor encaminhar, e o outbound endpoint faz a consulta sair pela rede privada até o DNS on-premises.

Cada endpoint precisa de uma sub-rede só para ele, delegada a `Microsoft.Network/dnsResolvers`, com tamanho entre /28 e /24. Inbound e outbound não dividem sub-rede. Nenhum outro recurso pode ficar nessas sub-redes. Planeje as duas junto com o endereçamento do hub, porque abrir espaço depois costuma ser mais difícil.

```
On-premises (DNS da empresa)
  -> encaminhador condicional: openai.azure.com, search.windows.net -> 10.0.4.4

Hub (VNet do resolver, zonas privatelink vinculadas aqui)
  snet-dns-inbound  10.0.4.0/28  -> inbound endpoint 10.0.4.4
  snet-dns-outbound 10.0.4.16/28 -> outbound endpoint
      ruleset: empresa.local. -> 192.168.1.10 (DNS on-premises)

Spokes
  -> perguntam ao 10.0.4.4 ou usam o ruleset vinculado
```

## Montando no hub

O resolver, os dois endpoints e o ruleset em Bicep. Uso IP estático no inbound porque esse endereço vai ficar configurado no DNS on-premises e nas VNets, e não pode mudar.

```bicep
resource resolver 'Microsoft.Network/dnsResolvers@2022-07-01' = {
  name: 'dnspr-hub'
  location: location
  properties: {
    virtualNetwork: { id: vnetHub.id }
  }
}

resource inbound 'Microsoft.Network/dnsResolvers/inboundEndpoints@2022-07-01' = {
  parent: resolver
  name: 'inbound'
  location: location
  properties: {
    ipConfigurations: [
      {
        privateIpAllocationMethod: 'Static'
        privateIpAddress: '10.0.4.4'
        subnet: { id: snetInbound.id }
      }
    ]
  }
}

resource outbound 'Microsoft.Network/dnsResolvers/outboundEndpoints@2022-07-01' = {
  parent: resolver
  name: 'outbound'
  location: location
  properties: {
    subnet: { id: snetOutbound.id }
  }
}

resource ruleset 'Microsoft.Network/dnsForwardingRulesets@2022-07-01' = {
  name: 'ruleset-hub'
  location: location
  properties: {
    dnsResolverOutboundEndpoints: [ { id: outbound.id } ]
  }
}

resource regraEmpresa 'Microsoft.Network/dnsForwardingRulesets/forwardingRules@2022-07-01' = {
  parent: ruleset
  name: 'empresa-local'
  properties: {
    domainName: 'empresa.local.'
    targetDnsServers: [ { ipAddress: '192.168.1.10', port: 53 } ]
    forwardingRuleState: 'Enabled'
  }
}

resource rulesetHub 'Microsoft.Network/dnsForwardingRulesets/virtualNetworkLinks@2022-07-01' = {
  parent: ruleset
  name: 'link-hub'
  properties: {
    virtualNetwork: { id: vnetHub.id }
  }
}
```

O último bloco é o que mais se esquece. Um ruleset só vale para as VNets vinculadas a ele. Sem o vínculo com o hub, as consultas que chegam ao inbound endpoint pedindo `empresa.local` nunca seguem para o on-premises. Esse ruleset do hub tem só regras para domínios da empresa, nunca uma regra apontando para o próprio inbound endpoint.

As zonas `privatelink` ficam vinculadas à VNet do hub. É daí que o inbound endpoint tira as respostas.

## Duas formas de os spokes usarem o resolver

**Opção 1: DNS customizado na VNet do spoke.** Você configura o 10.0.4.4 como servidor DNS do spoke. Toda consulta vai para o hub, que responde as zonas privadas e, pelo ruleset, os domínios da empresa. É o desenho mais simples de explicar e de auditar: um lugar só responde tudo.

**Opção 2: ruleset vinculado ao spoke.** O spoke continua com o DNS padrão do Azure, e você vincula a ele um ruleset próprio para os spokes, separado do ruleset do hub. O que casa com uma regra é encaminhado; o resto segue o caminho normal. Nesse ruleset dos spokes ficam as regras das zonas privadas apontando para o inbound endpoint, além das regras dos domínios da empresa. Ele nunca pode ser vinculado ao hub, senão a consulta volta para o mesmo lugar. Um ruleset aceita até 500 VNets vinculadas, sempre na mesma região.

Na maior parte dos ambientes corporativos eu fico com a opção 1, pela previsibilidade. A opção 2 faz sentido quando você não quer que uma indisponibilidade do hub derrube a resolução de nomes públicos nos spokes, ou quando os spokes são de times que não aceitam DNS customizado.

## Do on-premises para o Azure

No DNS da empresa, crie encaminhadores condicionais para o inbound endpoint. O detalhe que mais gera chamado: a Microsoft recomenda encaminhar a zona pública do serviço, como `openai.azure.com`, e não a zona `privatelink.openai.azure.com`.

```powershell
Add-DnsServerConditionalForwarderZone -Name "openai.azure.com" -MasterServers 10.0.4.4
Add-DnsServerConditionalForwarderZone -Name "search.windows.net" -MasterServers 10.0.4.4
```

O cliente pergunta pelo nome público, e o Azure responde com um CNAME para o nome `privatelink`. Encaminhando a zona pública, a consulta inteira passa pelo resolver, que conhece a zona privada e devolve o IP interno. Se os seus modelos estão em recursos do Microsoft Foundry, inclua também `cognitiveservices.azure.com` e `services.ai.azure.com`.

## Três erros que eu vejo com frequência

**Vincular o ruleset à VNet do inbound endpoint.** Se o ruleset tem uma regra apontando para o inbound endpoint e é vinculado à VNet onde esse endpoint está, a consulta volta para o mesmo lugar e entra em loop. A documentação é explícita: nesse caso, não vincule o ruleset àquela VNet.

**Zona privatelink vinculada ao spoke e não ao hub.** Funciona para aquele spoke e esconde o problema dos outros. Quando o inbound endpoint responde, ele usa as zonas vinculadas à VNet do resolver. Zona fora do hub é zona que o on-premises não enxerga.

**Esquecer a alta disponibilidade.** O resolver tem alta disponibilidade e redundância de zona nativas. Mas se toda a resolução de nomes da empresa depende de um único resolver, em uma única região, uma indisponibilidade regional vira indisponibilidade de tudo. Em ambiente multi-região, cada região tem o seu resolver e o DNS on-premises aponta para mais de um.

## O que fica

Com o resolver no hub, um novo Private Endpoint só precisa da zona vinculada no hub. Nenhum spoke, nenhum servidor on-premises precisa ser tocado. É isso que faz a topologia escalar.

No seu ambiente, quantos lugares precisam mudar quando alguém cria um Private Endpoint novo?
