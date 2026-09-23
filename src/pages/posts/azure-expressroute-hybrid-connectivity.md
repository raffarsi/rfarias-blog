---
layout: ../../layouts/PostLayout.astro
title: "ExpressRoute na prática: conectividade híbrida para ambientes corporativos"
category: "Networking"
tag: "networking"
date: "01 Jan 2026"
readTime: "11 min"
description: "Como o ExpressRoute funciona, diferença entre provider e direct, peering types e o processo real de contratação e configuração."
---

VPN funciona. Para a maioria dos ambientes corporativos com tráfego razoável e sem exigência de SLA de latência, uma VPN Gateway resolve a conectividade híbrida. ExpressRoute é para quando VPN não é suficiente: volume de dados alto, latência previsível e baixa, ou requisito de compliance que exige conexão privada sem internet.

Antes de contratar, entenda o que você está realmente comprando.

## ExpressRoute Provider vs ExpressRoute Direct

**ExpressRoute Provider:** você contrata com um provedor parceiro (Equinix, Ascenty, Claro). O provedor conecta ao peering da Microsoft. É o modelo mais comum, mais rápido de contratar e com opções de bandwidth de 50 Mbps a 10 Gbps.

**ExpressRoute Direct:** você conecta diretamente ao equipamento da Microsoft em datacenter de colocation. Portas de 10 Gbps ou 100 Gbps. Mais controle, mais complexidade operacional, para quem precisa de capacidade muito alta ou quer eliminar o intermediário.

Para a maioria das empresas brasileiras, ExpressRoute via provedor no Equinix SP ou Ascenty é o caminho mais rápido.

## O processo real de contratação

```bash
# 1. Criar o circuito no Azure (gera o Service Key)
az network express-route create   --name er-circuit-producao   --resource-group rg-networking   --location brazilsouth   --bandwidth 1000   --peering-location "Equinix SP2"   --provider "Equinix"   --sku-family MeteredData   --sku-tier Standard

# 2. Pegar o Service Key
az network express-route show   --name er-circuit-producao   --resource-group rg-networking   --query serviceKey -o tsv
```

Com o Service Key em mãos, você vai ao portal do provedor e provisiona a conexão física. O circuito fica em "Not Provisioned" até o provedor concluir, tipicamente 2 a 6 semanas. Planeje com isso em projetos de migração.

## Configurando o Private Peering

```bash
az network express-route peering create   --circuit-name er-circuit-producao   --resource-group rg-networking   --peering-type AzurePrivatePeering   --peer-asn 65100   --primary-peer-address-prefix 169.254.0.0/30   --secondary-peer-address-prefix 169.254.0.4/30   --vlan-id 100
```

## Conectando ao hub

```bicep
resource erGateway 'Microsoft.Network/virtualNetworkGateways@2023-09-01' = {
  name: 'er-gateway-hub'
  location: location
  properties: {
    gatewayType: 'ExpressRoute'
    sku: { name: 'ErGw1AZ', tier: 'ErGw1AZ' }
    ipConfigurations: [{
      name: 'gwipconfig'
      properties: {
        subnet: { id: gatewaySubnet.id }
        publicIPAddress: { id: gatewayPIP.id }
      }
    }]
  }
}
```

## Alta disponibilidade: dois circuitos

A Microsoft recomenda dois circuitos em locais de peering diferentes para HA real. Um circuito único com path primário e secundário e um único ponto de falha no lado do provedor.

```
Datacenter SP
  Roteador A --- ER Circuit 1 (Equinix SP2) --- Azure Hub
  Roteador B --- ER Circuit 2 (Ascenty SP)  --- Azure Hub
```

<div class="callout">
<strong>Tempo de provisionamento:</strong> O ExpressRoute via provedor leva 2 a 8 semanas entre criar o circuito no Azure e ter conectividade funcionando. O tempo maior é do lado do provedor. Comece o processo bem antes do prazo do projeto.
</div>

ExpressRoute é a escolha certa quando VPN não atende. O processo envolve três partes (você, o provedor e a Microsoft) e requer coordenação. Se você nunca fez antes, planeje o dobro do tempo que você acha que vai levar.
