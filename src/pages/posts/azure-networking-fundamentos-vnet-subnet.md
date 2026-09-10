---
layout: ../../layouts/PostLayout.astro
title: "Azure Networking: VNets e Subnets — o que você precisa saber antes de criar qualquer recurso"
category: "Networking"
tag: "azure"
date: "05 Ago 2025"
readTime: "8 min"
description: "Antes de criar uma VM, um container ou qualquer recurso no Azure, você precisa entender como as redes virtuais funcionam. Tudo começa aqui."
---

Antes de criar qualquer recurso no Azure — uma VM, um container, um banco de dados — você precisa tomar uma decisão de rede. E a decisão errada aqui custa caro para desfazer.

Uma **Virtual Network (VNet)** é a rede privada do Azure. É o isolamento fundamental que separa seus recursos dos recursos de outros clientes e da internet. Tudo que você cria no Azure fica dentro de uma VNet — ou precisa ser conectado a uma para se comunicar de forma privada com outros recursos.

## O que é uma VNet

Uma VNet no Azure é análoga a uma rede local tradicional (LAN), mas virtualizada e gerenciada pela Microsoft. Você define o espaço de endereçamento IP (ex: `10.0.0.0/16`), e dentro desse espaço cria subnets menores.

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

Diferente de uma rede física, uma VNet:
- É **regional** — existe dentro de uma região Azure específica
- É **isolada por padrão** — sem configuração explícita, recursos de VNets diferentes não se comunicam
- Tem **custo zero** — o que você paga é pelo tráfego que sai, não pela VNet em si

## Subnets: segmentando o espaço

Dentro de uma VNet, você cria subnets para organizar e segmentar recursos. Cada subnet recebe um range menor do espaço da VNet:

```
VNet: 10.0.0.0/16
├── snet-web:     10.0.1.0/24  (servidores web)
├── snet-app:     10.0.2.0/24  (lógica de negócio)
├── snet-data:    10.0.3.0/24  (bancos de dados)
└── snet-pe:      10.0.4.0/26  (Private Endpoints)
```

A subnet é onde os recursos ficam fisicamente alocados. Uma VM na `snet-web` recebe um IP privado desse range automaticamente.

**Por que segmentar em subnets?** Porque NSGs (Network Security Groups) são aplicados por subnet. Sem subnets separadas, você não consegue ter regras de firewall diferentes para a camada web vs a camada de dados.

## Espaços de endereçamento: como planejar

Use sempre ranges RFC 1918 (privados):
- `10.0.0.0/8`
- `172.16.0.0/12`
- `192.168.0.0/16`

O erro mais comum é criar VNets com ranges que se sobrepõem. Se você depois precisar conectar duas VNets (via peering) ou conectar ao on-premises (via VPN), ranges sobrepostos tornam isso impossível.

<div class="callout">
<strong>Planejamento de IP:</strong> Reserve sempre mais espaço do que você acha que vai precisar. Trocar o range de uma VNet em produção é destrutivo — você precisa recriar tudo. Use no mínimo /16 para VNets de produção, deixando headroom para crescimento.
</div>

## O que o Azure reserva automaticamente

Em cada subnet, o Azure reserva 5 endereços IP para uso interno:
- `.0` — endereço de rede
- `.1` — gateway padrão
- `.2` e `.3` — DNS do Azure
- `.255` — broadcast

Uma subnet `/29` tem 8 IPs totais, mas só 3 disponíveis para seus recursos. Planeje com isso em mente.

## Comunicação dentro e fora da VNet

Por padrão, recursos na mesma VNet se comunicam livremente (mesmo em subnets diferentes). Para restringir, você usa NSGs.

Para comunicação entre VNets ou com on-premises, as opções são:
- **VNet Peering** — conexão direta entre duas VNets (mesmo ou diferentes regiões)
- **VPN Gateway** — túnel criptografado pela internet para on-premises
- **ExpressRoute** — conexão privada dedicada para on-premises

Cada um tem casos de uso distintos — tema dos próximos artigos desta série.

## Conclusão

VNet e subnet são o alicerce de qualquer arquitetura Azure. Definir o espaço de endereçamento corretamente e segmentar em subnets com propósito claro desde o início poupa horas de refatoração depois. O investimento de 30 minutos planejando a topologia de rede antes de criar o primeiro recurso retorna muitas vezes ao longo da vida do ambiente.
