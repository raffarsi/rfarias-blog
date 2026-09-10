---
layout: ../../layouts/PostLayout.astro
title: "Azure Bastion: acesso seguro a VMs sem expor portas RDP/SSH"
category: "Azure"
tag: "azure"
date: "15 Jan 2026"
readTime: "8 min"
description: "Como o Azure Bastion elimina a necessidade de IPs públicos para acesso administrativo a VMs e como configurá-lo corretamente."
---
Expor portas RDP (3389) e SSH (22) diretamente na internet é um dos riscos mais comuns em ambientes Azure mal configurados. O Azure Bastion resolve isso de forma simples: acesso às VMs pelo navegador, via HTTPS na porta 443, sem nenhum IP público na VM.

## Como o Bastion funciona

O Bastion é um serviço PaaS provisionado dentro da sua VNet, em uma subnet dedicada chamada `AzureBastionSubnet`. Quando você acessa uma VM pelo Bastion:

1. Você se autentica no portal Azure (com MFA, Acesso Condicional, etc.)
2. O Bastion estabelece a sessão RDP/SSH internamente, dentro da VNet
3. A interface aparece no browser via HTML5 — sem client RDP instalado

A VM nunca precisa de IP público, e as portas 3389/22 ficam fechadas nos NSGs.

## Provisionando o Bastion

```bicep
// Subnet obrigatória — nome fixo AzureBastionSubnet, mínimo /26
resource bastionSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-09-01' = {
  name: 'AzureBastionSubnet'
  parent: vnet
  properties: {
    addressPrefix: '10.0.255.0/26'
  }
}

// IP público dedicado para o Bastion
resource bastionPublicIP 'Microsoft.Network/publicIPAddresses@2023-09-01' = {
  name: 'pip-bastion'
  location: location
  sku: { name: 'Standard' }
  properties: { publicIPAllocationMethod: 'Static' }
}

// O recurso Bastion em si
resource bastion 'Microsoft.Network/bastionHosts@2023-09-01' = {
  name: 'bastion-hub'
  location: location
  sku: { name: 'Standard' }  // Standard tem tunneling nativo
  properties: {
    ipConfigurations: [{
      name: 'ipconfig'
      properties: {
        subnet: { id: bastionSubnet.id }
        publicIPAddress: { id: bastionPublicIP.id }
      }
    }]
    enableTunneling: true      // permite client SSH/RDP nativo além do browser
    enableIpConnect: true      // acesso por IP privado direto
    enableShareableLink: false // links temporários (avaliar risco)
  }
}
```

## SKUs disponíveis

| SKU | Browser | Native Client | Shareable Links | File Transfer |
|-----|---------|---------------|-----------------|---------------|
| Basic | Sim | Não | Não | Não |
| Standard | Sim | Sim | Sim | Sim |
| Premium | Sim | Sim | Sim | Sim + gravação |

Para uso corporativo, **Standard** é o mínimo recomendado — o Native Client permite usar seu cliente SSH/RDP habitual em vez da interface browser.

## Usando o Native Client (Standard+)

Com tunneling habilitado, você usa seu cliente SSH normalmente:

```bash
# Instalar extensão do Azure CLI
az extension add --name bastion

# Tunel SSH via Bastion
az network bastion ssh   --name bastion-hub   --resource-group rg-networking   --target-resource-id $(az vm show -n minha-vm -g rg-app --query id -o tsv)   --auth-type AAD  # autenticação via Entra ID, sem senha

# Ou com RDP
az network bastion rdp   --name bastion-hub   --resource-group rg-networking   --target-resource-id $(az vm show -n minha-vm-windows -g rg-app --query id -o tsv)
```

## NSG na AzureBastionSubnet

A subnet do Bastion precisa de regras NSG específicas para funcionar:

```bicep
resource nsgBastion 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: 'nsg-bastion'
  properties: {
    securityRules: [
      // Entrada: HTTPS da internet (portal Azure)
      { name: 'AllowHttpsInbound', properties: {
        priority: 120, access: 'Allow', direction: 'Inbound',
        protocol: 'Tcp', sourceAddressPrefix: 'Internet',
        sourcePortRange: '*', destinationAddressPrefix: '*',
        destinationPortRange: '443'
      }},
      // Entrada: Gateway Manager
      { name: 'AllowGatewayManagerInbound', properties: {
        priority: 130, access: 'Allow', direction: 'Inbound',
        protocol: 'Tcp', sourceAddressPrefix: 'GatewayManager',
        sourcePortRange: '*', destinationAddressPrefix: '*',
        destinationPortRange: '443'
      }},
      // Saída: RDP/SSH para VMs
      { name: 'AllowRdpSshOutbound', properties: {
        priority: 100, access: 'Allow', direction: 'Outbound',
        protocol: 'Tcp', sourceAddressPrefix: '*',
        sourcePortRange: '*', destinationAddressPrefix: 'VirtualNetwork',
        destinationPortRanges: ['22', '3389']
      }}
    ]
  }
}
```

<div class="callout">
<strong>Bastion não substitui JIT VM Access.</strong> O Bastion elimina IPs públicos — mas qualquer pessoa com acesso ao portal Azure e permissão RBAC na VM pode conectar a qualquer hora. Para restringir quando as conexões são permitidas, combine Bastion com JIT VM Access do Defender for Cloud: a porta fica fechada até que o usuário solicite acesso explicitamente.
</div>

## Custo

O Bastion SKU Standard custa ~$0.19/hora de instância + $0.10/GB de dados transferidos. Para VMs de uso ocasional, considere desprovisionar o Bastion fora do horário de uso com Azure Automation — mas mantenha a subnet reservada para reprovisionar rapidamente.

## Conclusão

O Azure Bastion é a solução correta para acesso administrativo a VMs no Azure. Zero IPs públicos nas VMs, autenticação via Entra ID (com MFA e Acesso Condicional aplicados), auditoria completa de sessões — sem necessidade de VPN separada para acesso de administradores.
