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
  title: "Azure Networking [4] — Latência de rede em pipelines RAG"
  slug: "latencia-rede-pipelines-rag-azure"
next:
  title: "Azure Networking [6] — Azure Firewall com Explicit Proxy vs UDR"
  slug: "azure-firewall-explicit-proxy-vs-udr"

---

Em marco de 2026, o Azure mudou o comportamento padrao de Virtual Networks: recursos criados em VNets novas nao recebem mais acesso publico por padrao. Se voce tem automacao de infraestrutura, scripts de deploy ou pipelines que assumem que VMs e outros recursos vao ter conectividade de saida sem configuracao explicita, isso quebrou silenciosamente.

Vale auditar o que voce tem antes de descobrir num incidente.

## O que mudou exatamente

Antes de marco de 2026: VNets novas tinham "default outbound access" habilitado. VMs sem IP publico conseguiam acessar a internet via um IP efemero gerenciado pelo Azure.

Depois: VNets novas nao tem esse comportamento. VMs sem IP publico e sem NAT Gateway ou Load Balancer configurado nao tem saida para internet.

VNets existentes criadas antes da mudanca continuam funcionando como antes. O impacto e so em VNets criadas apos a mudanca.

## Como identificar o que esta afetado

```bash
# Listar VMs sem IP publico e sem NAT Gateway
az vm list --query "[].{Nome:name,RG:resourceGroup,IP:publicIps}"   --show-details -o table | grep None

# Verificar subnets sem NAT Gateway associado
az network vnet subnet list   --vnet-name vnet-producao   --resource-group rg-networking   --query "[?natGateway==null].{Nome:name,Prefix:addressPrefix}"   --output table
```

## Configurando saida corretamente com NAT Gateway

A solucao correta para saida de internet em VNets novas e NAT Gateway:

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

## O que fazer se voce usa IaC

Se voce usa Terraform, Bicep ou ARM templates para criar VNets, inclua explicitamente a configuracao de saida em todos os templates. Nao assuma o comportamento padrao porque ele mudou.

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

## Workloads que so acessam servicos privados

Se voce tem VMs ou containers que so precisam acessar recursos via Private Endpoints (OpenAI, AI Search, Storage) e nunca acessam a internet, voce nao precisa de NAT Gateway. Esses recursos continuam funcionando sem configuracao de saida.

O problema aparece em workloads que precisam baixar dependencias, acessar APIs externas, atualizar pacotes ou qualquer coisa que saia da VNet para a internet. Esses sao os cenarios que quebraram.

A mudanca e correta do ponto de vista de segurança: saida para internet deve ser configurada explicitamente, nao habilitada por padrao. Mas se voce nao estava acompanhando, e uma surpresa desagradavel.
