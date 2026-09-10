---
layout: ../../layouts/PostLayout.astro
title: "NSG na prática: como criar regras de segurança de rede que realmente protegem"
category: "Networking"
tag: "networking"
date: "12 Ago 2025"
readTime: "9 min"
description: "NSG parece simples — até você entender precedência de regras, stateful e os erros que bloqueiam tráfego legítimo em produção."
---

NSG parece simples. Ate voce travar o acesso de producao porque uma regra de prioridade mais baixa esta liberando o que voce tentou bloquear, ou descobrir que o trafego entre duas subnets da mesma VNet passou por cima das suas restricoes por causa do AllowVNetInBound padrao.

Entender como o NSG avalia regras evita esses incidentes.

## Como as regras sao avaliadas

Cada regra tem uma prioridade numerica. O Azure avalia em ordem crescente e para na primeira que corresponde. Se nenhuma corresponder, aplica as regras padrao, que incluem bloquear todo trafego de entrada da internet e permitir trafego de saida para internet.

O que muita gente nao percebe: toda regra Deny que voce cria precisa ter prioridade MENOR que qualquer regra Allow que voce quer sobrescrever. Ao contrario do que parece intuitivo.

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

## As regras padrao que derrubam planos

Todo NSG tem regras padrao com prioridade 65000+. A mais traicoeira: **AllowVNetInBound** (prioridade 65000) permite trafego de qualquer VNet, incluindo outras subnets da mesma VNet.

Se voce quer bloquear trafego entre subnets, precisa criar uma regra Deny explicita com prioridade menor que 65000. Muita gente cria um Deny generico na prioridade 4000 pensando que bloqueou tudo, e ainda assim o trafego interno passa porque AllowVNetInBound tem precedencia sobre o que o usuario configurou se mal estruturado.

## Service Tags: pare de manter listas de IP

Em vez de manter listas de IPs de servicos Azure, use Service Tags:

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

Tags uteis: `Internet`, `VirtualNetwork`, `AzureLoadBalancer`, `Storage`, `AzureMonitor`. A Microsoft atualiza os ranges de IP por tras de cada tag automaticamente.

## NSG em subnet vs NIC: onde colocar

Voce pode associar NSGs a subnets (afeta todos os recursos) ou a NICs de VMs especificas. Quando os dois existem, trafego de entrada passa primeiro pelo NSG da subnet, depois pelo da NIC. Saida: inverso.

Na pratica: use NSG na subnet como regra geral. NSG na NIC so quando uma VM especifica precisa de regras diferentes das outras da subnet. Manter NSGs em dois lugares torna o troubleshooting muito mais dificil.

## Diagnosticando bloqueios com IP Flow Verify

Quando o trafego esta sendo bloqueado e voce nao sabe por qual regra:

```bash
az network watcher test-ip-flow   --vm minha-vm   --direction Inbound   --protocol TCP   --local 10.0.1.4:443   --remote 203.0.113.1:54321   --out table
```

O resultado mostra Allow ou Deny e qual regra especifica tomou a decisao. Economiza horas de analise manual de regras.

NSG bem configurado e o que separa um ambiente que "nao foi comprometido ainda" de um ambiente que tem controle real sobre o que trafega na rede.
