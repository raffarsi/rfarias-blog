---
layout: ../../layouts/PostLayout.astro
title: "Azure Networking: VNets e Subnets — o que você precisa saber antes de criar qualquer recurso"
category: "Networking"
tag: "networking"
date: "05 Ago 2025"
readTime: "8 min"
description: "Antes de criar uma VM, um container ou qualquer recurso no Azure, você precisa entender como as redes virtuais funcionam. Tudo começa aqui."
---

Todo mundo cria a primeira VNet sem pensar muito. Escolhe um /16 qualquer, coloca tudo em uma subnet, e funciona. O problema aparece dois anos depois, quando a empresa cresce, precisa conectar ao on-premises ou separar ambientes, e descobre que o range de IP conflita com tudo. Daí o custo de refatorar e recriar recursos numa rede nova.

Vale 30 minutos planejando antes de criar a primeira VNet.

## O que e uma VNet, sem enrolacao

Uma VNet e a rede privada do Azure. Isolamento fundamental que separa seus recursos dos de outros clientes e da internet. Tudo que voce cria no Azure fica dentro de uma VNet ou precisa ser conectado a uma para se comunicar de forma privada.

Diferente de uma rede fisica, uma VNet e regional (existe dentro de uma regiao Azure), isolada por padrao (sem configuracao explicita, VNets diferentes nao se comunicam) e tem custo zero. O que voce paga e pelo trafego que sai.

```bicep
resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: 'vnet-producao'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: ['10.0.0.0/16']
    }
  }
}
```

## Subnets: o erro que parece simples

Dentro de uma VNet voce cria subnets para segmentar recursos. O erro mais comum: criar tudo em uma subnet so porque e mais simples. O problema e que NSGs sao aplicados por subnet. Sem subnets separadas, voce nao consegue ter regras de firewall diferentes para a camada web e para o banco de dados.

```
VNet: 10.0.0.0/16
+-- snet-web:     10.0.1.0/24  (servidores web)
+-- snet-app:     10.0.2.0/24  (logica de negocio)
+-- snet-data:    10.0.3.0/24  (bancos de dados)
+-- snet-pe:      10.0.4.0/26  (Private Endpoints)
```

Essa separacao parece burocracia ate o dia que voce precisa bloquear todo o acesso direto ao banco de dados sem afetar a aplicacao. Com subnets separadas, e uma regra de NSG. Sem elas, e uma semana de refatoracao.

## Planejamento de IP: o que nao te contam

Use sempre ranges RFC 1918 (privados): 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16.

O que importa de verdade: ranges sobrepostos inviabilizam peering e conectividade com on-premises. Se a VNet A usa 10.0.0.0/16 e a VNet B tambem usa 10.0.0.0/16, voce nunca vai conseguir conectar as duas. E trocar o range de uma VNet em producao e destrutivo, voce precisa recriar tudo.

Reserve mais espaco do que voce acha que vai precisar. Use /16 para VNets de producao no minimo. O espaco de IP nao custa nada, a refatoracao custa muito.

## O que o Azure reserva (e voce esquece de contar)

Em cada subnet, o Azure reserva 5 enderecos para uso interno: .0 (rede), .1 (gateway), .2 e .3 (DNS), .255 (broadcast). Uma subnet /29 tem 8 IPs totais e so 3 disponiveis para seus recursos. Planeje com isso.

## Como os recursos se comunicam

Por padrao, recursos na mesma VNet se comunicam livremente, mesmo em subnets diferentes. Para restringir, use NSGs. Para conectar VNets diferentes ou ao on-premises:

- **VNet Peering**: conexao direta entre duas VNets, mesmo entre regioes
- **VPN Gateway**: tunel criptografado pela internet para on-premises
- **ExpressRoute**: conexao privada dedicada para on-premises

Cada um tem custo e caso de uso diferente. O peering e o mais simples para conectar VNets no Azure. Para on-premises, a escolha entre VPN e ExpressRoute depende do volume de dados e dos requisitos de SLA.

Planejamento de IP bem feito desde o inicio e o tipo de decisao que nao aparece em nenhum relatorio, mas evita semanas de trabalho emergencial depois.
