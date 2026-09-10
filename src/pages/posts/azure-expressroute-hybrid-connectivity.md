---
layout: ../../layouts/PostLayout.astro
title: "ExpressRoute na pratica: conectividade hibrida para ambientes corporativos"
category: "Networking"
tag: "networking"
date: "01 Jan 2026"
readTime: "11 min"
description: "Como o ExpressRoute funciona, diferenca entre provider e direct, peering types e o processo real de contratacao e configuracao."
---

O ExpressRoute e a conexao dedicada entre o seu datacenter e o Azure -- sem internet publica, sem criptografia necessaria (embora seja recomendada), com SLA de disponibilidade. Para ambientes corporativos com grandes volumes de dados ou requisitos de latencia e compliance, e a alternativa correta ao VPN Gateway.

## ExpressRoute Provider vs ExpressRoute Direct

**ExpressRoute Provider:** voce contrata um circuito com um provedor parceiro (Equinix, Ascenty, Claro, etc.). O provedor estabelece a conexao fisica com a Microsoft. Opcoes de bandwidth: 50 Mbps a 10 Gbps.

**ExpressRoute Direct:** voce conecta diretamente ao equipamento da Microsoft em um datacenter de colocation (nao precisa de provedor intermediario). Portas de 10 Gbps ou 100 Gbps. Mais controle, mais complexidade operacional.

Para a maioria das empresas brasileiras, ExpressRoute via provedor (Equinix SP ou Ascenty) e o caminho mais rapido.

## Peering types

**Azure Private Peering:** acesso a VNets e servicos dentro das VNets. Este e o peering que voce usa para conectar on-premises a recursos Azure privados.

**Microsoft Peering:** acesso a servicos PaaS publicos da Microsoft (Microsoft 365, Dynamics, Azure PaaS endpoints publicos) pelo backbone Microsoft em vez da internet.

A maioria das empresas precisa apenas do Private Peering.

## Processo de contratacao e configuracao

```bash
# 1. Criar o circuito no Azure (gera o Service Key)
az network express-route create   --name er-circuit-producao   --resource-group rg-networking   --location brazilsouth   --bandwidth 1000   --peering-location "Equinix SP2"   --provider "Equinix"   --sku-family MeteredData   --sku-tier Standard

# 2. Obter o Service Key para passar ao provedor
az network express-route show   --name er-circuit-producao   --resource-group rg-networking   --query serviceKey -o tsv
```

Com o Service Key, o provedor provisiona a conexao fisica no lado deles. O circuito fica em estado "Not Provisioned" ate o provedor concluir -- tipicamente 2-6 semanas.

## Configurando o Private Peering

```bash
# Apos o provedor concluir o provisionamento:
az network express-route peering create   --circuit-name er-circuit-producao   --resource-group rg-networking   --peering-type AzurePrivatePeering   --peer-asn 65100 \           # ASN do seu roteador on-premises
  --primary-peer-address-prefix 169.254.0.0/30   --secondary-peer-address-prefix 169.254.0.4/30   --vlan-id 100
```

## Criando o VNet Gateway e conectando

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

resource erConnection 'Microsoft.Network/connections@2023-09-01' = {
  name: 'conn-er-producao'
  location: location
  properties: {
    connectionType: 'ExpressRoute'
    virtualNetworkGateway1: { id: erGateway.id }
    peer: { id: erCircuit.id }
    authorizationKey: erCircuit.properties.authorizations[0].authorizationKey
  }
}
```

## Monitorando a conexao

```bash
# Status do circuito
az network express-route show   --name er-circuit-producao   --resource-group rg-networking   --query "{Status:circuitProvisioningState,Peering:peerings[0].state,Bandwidth:serviceProviderProperties.bandwidthInMbps}"

# Verificar rotas BGP aprendidas
az network express-route list-route-tables   --path primary   --peering-name AzurePrivatePeering   --name er-circuit-producao   --resource-group rg-networking
```

## Redundancia: dois circuitos para producao

A Microsoft recomenda dois circuitos ExpressRoute (em locais de peering diferentes) para alta disponibilidade real. Um circuito unico, mesmo com o path primario e secundario, e um unico ponto de falha no lado do provedor.

```
Datacenter SP          Equinix SP2 (Peering Location 1)
  Roteador A  ------- ER Circuit 1 -------> Azure Hub
  Roteador B  ------- ER Circuit 2 -------> Azure Hub
                       Ascenty SP (Peering Location 2)
```

<div class="callout">
<strong>Tempo de provisionamento:</strong> O ExpressRoute via provedor leva tipicamente 2 a 8 semanas entre a criacao do circuito no Azure e a conectividade funcionando -- o tempo maior e no lado do provedor estabelecendo a conexao fisica. Planeje com antecedencia em projetos de migracao.
</div>

## Conclusao

O ExpressRoute e a fundacao de redes hibridas corporativas no Azure. O processo envolve tres partes -- voce, o provedor e a Microsoft -- e requer coordenacao. Para ambientes de producao com requisitos de latencia, compliance ou alto throughput, a complexidade adicional se justifica pela confiabilidade e previsibilidade da conexao dedicada.
