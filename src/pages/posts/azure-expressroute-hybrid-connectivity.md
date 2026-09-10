---
layout: ../../layouts/PostLayout.astro
title: "ExpressRoute na pratica: conectividade hibrida para ambientes corporativos"
category: "Networking"
tag: "networking"
date: "01 Jan 2026"
readTime: "11 min"
description: "Como o ExpressRoute funciona, diferenca entre provider e direct, peering types e o processo real de contratacao e configuracao."
---

VPN funciona. Para a maioria dos ambientes corporativos com trafego razoavel e sem exigencia de SLA de latencia, uma VPN Gateway resolve a conectividade hibrida. ExpressRoute e para quando VPN nao e suficiente: volume de dados alto, latencia previsivel e baixa, ou requisito de compliance que exige conexao privada sem internet.

Antes de contratar, entenda o que voce esta realmente comprando.

## ExpressRoute Provider vs ExpressRoute Direct

**ExpressRoute Provider:** voce contrata com um provedor parceiro (Equinix, Ascenty, Claro). O provedor conecta ao peering da Microsoft. E o modelo mais comum, mais rapido de contratar e com opcoes de bandwidth de 50 Mbps a 10 Gbps.

**ExpressRoute Direct:** voce conecta diretamente ao equipamento da Microsoft em datacenter de colocation. Portas de 10 Gbps ou 100 Gbps. Mais controle, mais complexidade operacional, para quem precisa de capacidade muito alta ou quer eliminar o intermediario.

Para a maioria das empresas brasileiras, ExpressRoute via provedor no Equinix SP ou Ascenty e o caminho mais rapido.

## O processo real de contratacao

```bash
# 1. Criar o circuito no Azure (gera o Service Key)
az network express-route create   --name er-circuit-producao   --resource-group rg-networking   --location brazilsouth   --bandwidth 1000   --peering-location "Equinix SP2"   --provider "Equinix"   --sku-family MeteredData   --sku-tier Standard

# 2. Pegar o Service Key
az network express-route show   --name er-circuit-producao   --resource-group rg-networking   --query serviceKey -o tsv
```

Com o Service Key em maos, voce vai ao portal do provedor e provisiona a conexao fisica. O circuito fica em "Not Provisioned" ate o provedor concluir, tipicamente 2 a 6 semanas. Planeje com isso em projetos de migracao.

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

A Microsoft recomenda dois circuitos em locais de peering diferentes para HA real. Um circuito unico com path primario e secundario e um unico ponto de falha no lado do provedor.

```
Datacenter SP
  Roteador A --- ER Circuit 1 (Equinix SP2) --- Azure Hub
  Roteador B --- ER Circuit 2 (Ascenty SP)  --- Azure Hub
```

<div class="callout">
<strong>Tempo de provisionamento:</strong> O ExpressRoute via provedor leva 2 a 8 semanas entre criar o circuito no Azure e ter conectividade funcionando. O tempo maior e do lado do provedor. Comece o processo bem antes do prazo do projeto.
</div>

ExpressRoute e a escolha certa quando VPN nao atende. O processo envolve tres partes (voce, o provedor e a Microsoft) e requer coordenacao. Se voce nunca fez antes, planeje o dobro do tempo que voce acha que vai levar.
