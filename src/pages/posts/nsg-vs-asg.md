---
layout: ../../layouts/PostLayout.astro
title: "Network Security Groups vs Application Security Groups: quando usar cada um"
category: "Azure"
tag: "tech"
date: "13 Ago 2026"
readTime: "10 min"
description: "Entenda as diferenças entre NSG e ASG no Azure e em quais cenários cada um se destaca."
prev:
  title: "Simulado gamificado AZ-900"
  slug: "simulado-gamificado-az900"
next:
  title: "17 anos na mesma empresa"
  slug: "17-anos-mesma-empresa"
---

Uma dúvida que aparece com frequência nos treinamentos e nas implementações que faço é: qual a diferença entre Network Security Groups (NSG) e Application Security Groups (ASG)? E mais importante: quando usar cada um?

Vou direto ao ponto com cenários reais.

## NSG: o filtro de rede clássico

O NSG é uma lista de regras de entrada e saída que você associa a uma subnet ou a uma NIC. Cada regra filtra por IP de origem/destino, porta e protocolo.

```bash
az network nsg rule create \
  --resource-group myRG \
  --nsg-name myNSG \
  --name AllowHTTPS \
  --priority 100 \
  --source-address-prefixes 10.0.0.0/24 \
  --destination-port-ranges 443 \
  --access Allow \
  --protocol Tcp
```

Funciona bem quando suas regras são baseadas em ranges de IP. Mas em ambientes dinâmicos — com auto-scaling, múltiplas VMs servindo funções diferentes na mesma subnet — gerenciar IPs vira um pesadelo.

## ASG: agrupamento lógico

O ASG resolve exatamente esse problema. Ele permite agrupar NICs por função (web servers, app servers, db servers) e usar esses grupos como origem ou destino nas regras do NSG.

```bash
# Criar os ASGs
az network asg create --name WebServers --resource-group myRG
az network asg create --name DbServers --resource-group myRG

# Regra: WebServers podem acessar DbServers na porta 1433
az network nsg rule create \
  --resource-group myRG \
  --nsg-name myNSG \
  --name Web-to-DB \
  --priority 200 \
  --source-asgs WebServers \
  --destination-asgs DbServers \
  --destination-port-ranges 1433 \
  --access Allow \
  --protocol Tcp
```

Agora, quando uma nova VM de web server é criada, basta associar a NIC ao ASG `WebServers` — a regra se aplica automaticamente.

## Quando usar o quê

| Cenário | Recomendação |
|---------|-------------|
| Regras baseadas em IPs fixos | NSG puro |
| Ambiente com auto-scaling | NSG + ASG |
| Microsegmentação por função | ASG obrigatório |
| Subnet única com múltiplos papéis | ASG simplifica muito |
| Regras entre VNets (peering) | NSG (ASG não cruza VNets) |

<div class="callout">
<strong>Limitação importante:</strong> ASGs só funcionam dentro da mesma VNet. Se você precisa de regras entre VNets via peering, vai precisar usar IPs ou prefixos de serviço no NSG.
</div>

## Conclusão

NSG e ASG não são concorrentes — são complementares. O NSG é o mecanismo de filtragem; o ASG é uma forma mais inteligente de definir os alvos dessas regras.

Na prática, em ambientes corporativos, uso os dois juntos em 100% dos casos.
