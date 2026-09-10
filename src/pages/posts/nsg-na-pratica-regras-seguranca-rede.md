---
layout: ../../layouts/PostLayout.astro
title: "NSG na prática: como criar regras de segurança de rede que realmente protegem"
category: "Networking"
tag: "azure"
date: "12 Ago 2025"
readTime: "9 min"
description: "NSG parece simples — até você entender precedência de regras, stateful e os erros que bloqueiam tráfego legítimo em produção."
---

O Network Security Group (NSG) é o firewall de camada 3/4 do Azure. Ele filtra tráfego de entrada e saída com base em IP de origem/destino, porta e protocolo. Parece simples — e é, até aparecer o primeiro caso de "funciona no dev, não funciona em produção".

## Como o NSG funciona

Um NSG contém regras de segurança, cada uma com:
- **Prioridade** — número entre 100 e 4096. Quanto menor, maior a prioridade
- **Origem e destino** — IP, range CIDR, Service Tag ou Application Security Group
- **Protocolo** — TCP, UDP, ICMP ou Any
- **Ação** — Allow ou Deny

O Azure avalia as regras em ordem de prioridade e para na primeira que corresponde. Se nenhuma regra corresponder, o tráfego é bloqueado (para inbound) ou permitido (para outbound) pelas regras padrão.

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

## Regras padrão que você não pode apagar

Todo NSG tem regras padrão com prioridade 65000+:
- `AllowVNetInBound` (65000) — permite tráfego de qualquer VNet
- `AllowAzureLoadBalancerInBound` (65001) — permite health probes do Load Balancer
- `DenyAllInBound` (65500) — bloqueia todo o resto

O erro mais comum: criar uma regra Deny com prioridade alta sem perceber que `AllowVNetInBound` (65000) ainda permite tráfego vindo de outras subnets da mesma VNet.

## Service Tags — não use IPs fixos

Em vez de manter listas de IPs de serviços Azure, use Service Tags:

```bicep
// Permitir acesso apenas do Azure Bastion
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

Service Tags importantes:
- `Internet` — tráfego vindo da internet
- `VirtualNetwork` — todo o espaço de endereçamento da VNet e peerings
- `AzureLoadBalancer` — health probes do Load Balancer
- `Storage` — endpoints públicos do Azure Storage
- `AzureMonitor` — telemetria para Azure Monitor

## NSG em subnet vs NSG em NIC

Você pode associar NSGs à subnet (afeta todos os recursos da subnet) ou à NIC de uma VM específica. Quando os dois existem, o tráfego de entrada passa primeiro pelo NSG da subnet, depois pelo NSG da NIC. Para saída, é o inverso.

<div class="callout">
<strong>Recomendação:</strong> Use NSG na subnet como regra geral. NSG na NIC só quando precisar de regras específicas para uma VM dentro de uma subnet com regras mais permissivas. Manter NSGs em dois lugares aumenta a complexidade de troubleshooting.
</div>

## Diagnóstico com IP Flow Verify

Quando o tráfego está sendo bloqueado e você não sabe por qual regra, use o IP Flow Verify do Network Watcher:

```bash
az network watcher test-ip-flow \
  --vm minha-vm \
  --direction Inbound \
  --protocol TCP \
  --local 10.0.1.4:443 \
  --remote 203.0.113.1:54321 \
  --out table
```

O resultado mostra se o tráfego seria permitido ou bloqueado e qual regra tomou a decisão.

## Conclusão

NSG é a primeira linha de defesa de rede no Azure. Regras bem planejadas com Service Tags, uso de Application Security Groups para agrupar VMs por função e associação no nível de subnet são as práticas que diferenciam um ambiente seguro de um ambiente que "funciona por enquanto".
