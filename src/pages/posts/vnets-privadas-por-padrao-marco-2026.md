---
layout: ../../layouts/PostLayout.astro
title: "VNets privadas por padrão a partir de março de 2026: o que isso quebra e como migrar sem downtime"
category: "Networking"
tag: "networking"
serie: "Série Azure Networking + IA Generativa"
serieNum: 5
serieSlug: "serie-azure-networking-ia"
date: "2 Set 2026"
readTime: "9 min"
description: "A partir de 31 de março de 2026, VNets criadas no Azure nascem privadas por padrão. Se sua automação depende do comportamento antigo, ela vai quebrar. Guia completo de migração sem downtime."
prev:
  title: "Azure Networking [4]: Latência de rede em pipelines RAG"
  slug: "latencia-rede-pipelines-rag-azure"
next:
  title: "Azure Networking [6]: Azure Firewall com Explicit Proxy vs UDR"
  slug: "azure-firewall-explicit-proxy-vs-udr"

---

Em marco de 2026, o Azure mudou o comportamento padrão de Virtual Networks: recursos criados em VNets novas não recebem mais acesso público por padrão. Se você tem automação de infraestrutura, scripts de deploy ou pipelines que assumem que VMs e outros recursos vão ter conectividade de saída sem configuração explicita, isso quebrou silenciosamente.

Vale auditar o que você tem antes de descobrir num incidente.

## O que mudou exatamente

Antes de marco de 2026: VNets novas tinham "default outbound access" habilitado. VMs sem IP público conseguiam acessar a internet via um IP efêmero gerenciado pelo Azure.

Depois: VNets novas não tem esse comportamento. VMs sem IP público e sem NAT Gateway ou Load Balancer configurado não tem saída para internet.

VNets existentes criadas antes da mudança continuam funcionando como antes. O impacto e só em VNets criadas apos a mudança.

## Como identificar o que está afetado

```bash
# Listar VMs sem IP publico e sem NAT Gateway
az vm list --query "[].{Nome:name,RG:resourceGroup,IP:publicIps}"   --show-details -o table | grep None

# Verificar subnets sem NAT Gateway associado
az network vnet subnet list   --vnet-name vnet-producao   --resource-group rg-networking   --query "[?natGateway==null].{Nome:name,Prefix:addressPrefix}"   --output table
```

## Configurando saída corretamente com NAT Gateway

A solução correta para saída de internet em VNets novas e NAT Gateway:

```bicep
resource publicIpNat 'Microsoft.Network/publicIPAddresses@2023-09-01' = {
  name: 'pip-nat-producao'
  location: location
  sku: { name: 'Standard' }
  properties: { publicIPAllocationMethod: 'Static' }
}

resource natGateway 'Microsoft.Network/natGateways@2023-09-01' = {
  name: 'nat-producao'
  location: location
  sku: { name: 'Standard' }
  properties: {
    idleTimeoutInMinutes: 4
    publicIpAddresses: [{ id: publicIpNat.id }]
  }
}

// Associar a cada subnet que precisa de saida para internet
resource subnet 'Microsoft.Network/virtualNetworks/subnets@2023-09-01' = {
  name: 'snet-app'
  parent: vnet
  properties: {
    addressPrefix: '10.1.1.0/24'
    natGateway: { id: natGateway.id }
  }
}
```

## O que fazer se você usa IaC

Se você usa Terraform, Bicep ou ARM templates para criar VNets, inclua explicitamente a configuração de saída em todos os templates. Não assuma o comportamento padrão porque ele mudou.

```hcl
# Terraform: adicionar explicitamente
resource "azurerm_subnet" "app" {
  name                 = "snet-app"
  # ... outros parametros
}

resource "azurerm_nat_gateway_public_ip_association" "app" {
  nat_gateway_id       = azurerm_nat_gateway.producao.id
  public_ip_address_id = azurerm_public_ip.nat.id
}
```

## Workloads que só acessam serviços privados

Se você tem VMs ou containers que só precisam acessar recursos via Private Endpoints (OpenAI, AI Search, Storage) e nunca acessam a internet, você não precisa de NAT Gateway. Esses recursos continuam funcionando sem configuração de saída.

O problema aparece em workloads que precisam baixar dependências, acessar APIs externas, atualizar pacotes ou qualquer coisa que saia da VNet para a internet. Esses são os cenários que quebraram.

A mudança e correta do ponto de vista de segurança: saída para internet deve ser configurada explicitamente, não habilitada por padrão. Mas se você não estava acompanhando, e uma surpresa desagradável.
