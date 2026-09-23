---
layout: ../../layouts/PostLayout.astro
title: "NSG na prática: como criar regras de segurança de rede que realmente protegem"
category: "Networking"
tag: "networking"
date: "12 Ago 2025"
readTime: "9 min"
description: "NSG parece simples até você entender precedência de regras, stateful e os erros que bloqueiam tráfego legítimo em produção."
---

NSG parece simples. Até você travar o acesso de produção porque uma regra de prioridade mais baixa está liberando o que você tentou bloquear, ou descobrir que o tráfego entre duas subnets da mesma VNet passou por cima das suas restrições por causa do AllowVNetInBound padrão.

Entender como o NSG avalia regras evita esses incidentes.

## Como as regras são avaliadas

Cada regra tem uma prioridade numérica. O Azure avalia em ordem crescente e para na primeira que corresponde. Se nenhuma corresponder, aplica as regras padrão, que incluem bloquear todo tráfego de entrada da internet e permitir tráfego de saída para internet.

O que muita gente não percebe: toda regra Deny que você cria precisa ter prioridade MENOR que qualquer regra Allow que você quer sobrescrever. Ao contrário do que parece intuitivo.

```bicep
resource nsg 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: 'nsg-app'
  location: location
  properties: {
    securityRules: [
      {
        name: 'allow-https-inbound'
        properties: {
          priority: 100
          protocol: 'Tcp'
          access: 'Allow'
          direction: 'Inbound'
          sourceAddressPrefix: 'Internet'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '443'
        }
      }
      {
        name: 'deny-all-inbound'
        properties: {
          priority: 4000
          protocol: '*'
          access: 'Deny'
          direction: 'Inbound'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
    ]
  }
}
```

## As regras padrão que derrubam planos

Todo NSG tem regras padrão com prioridade 65000+. A mais traiçoeira: **AllowVNetInBound** (prioridade 65000) permite tráfego de qualquer VNet, incluindo outras subnets da mesma VNet.

Se você quer bloquear tráfego entre subnets, precisa criar uma regra Deny explícita com prioridade menor que 65000. Muita gente cria um Deny genérico na prioridade 4000 pensando que bloqueou tudo, e ainda assim o tráfego interno passa porque AllowVNetInBound tem precedência sobre o que o usuário configurou se mal estruturado.

## Service Tags: pare de manter listas de IP

Em vez de manter listas de IPs de serviços Azure, use Service Tags:

```bicep
{
  name: 'allow-bastion'
  properties: {
    priority: 200
    protocol: 'Tcp'
    access: 'Allow'
    direction: 'Inbound'
    sourceAddressPrefix: 'AzureBastionSubnet'
    sourcePortRange: '*'
    destinationAddressPrefix: '*'
    destinationPortRanges: ['22', '3389']
  }
}
```

Tags úteis: `Internet`, `VirtualNetwork`, `AzureLoadBalancer`, `Storage`, `AzureMonitor`. A Microsoft atualiza os ranges de IP por trás de cada tag automaticamente.

## NSG em subnet vs NIC: onde colocar

Você pode associar NSGs a subnets (afeta todos os recursos) ou a NICs de VMs específicas. Quando os dois existem, tráfego de entrada passa primeiro pelo NSG da subnet, depois pelo da NIC. Saída: inverso.

Na prática: use NSG na subnet como regra geral. NSG na NIC só quando uma VM específica precisa de regras diferentes das outras da subnet. Manter NSGs em dois lugares torna o troubleshooting muito mais difícil.

## Diagnosticando bloqueios com IP Flow Verify

Quando o tráfego está sendo bloqueado e você não sabe por qual regra:

```bash
az network watcher test-ip-flow   --vm minha-vm   --direction Inbound   --protocol TCP   --local 10.0.1.4:443   --remote 203.0.113.1:54321   --out table
```

O resultado mostra Allow ou Deny e qual regra específica tomou a decisão. Economiza horas de análise manual de regras.

NSG bem configurado é o que separa um ambiente que "não foi comprometido ainda" de um ambiente que tem controle real sobre o que trafega na rede.
