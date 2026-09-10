---
layout: ../../layouts/PostLayout.astro
title: "AZ-104 na prática [11] — NSG, UDR e roteamento"
category: "Networking"
tag: "networking"
serie: "AZ-104 na prática"
serieSlug: "az104"
serieNum: 11
date: "25 Jul 2026"
readTime: "10 min"
description: "Network Security Groups e User Defined Routes para controle de tráfego nas redes Azure."
prev:
  title: "AZ-104 [10] — VNets e Subnets"
  slug: "az104-10-vnets-subnets"
next:
  title: "AZ-104 [12] — Load Balancer"
  slug: "az104-12-load-balancer"

---

NSG e UDR aparecem juntos no AZ-104 e juntos em producao. Entender como os dois interagem e o que separa quem resolve incidentes de rede rapido de quem fica horas tentando.

## NSG: o que o AZ-104 foca

NSG tem regras com prioridade numerica de 100 a 4096. Menor numero, maior prioridade. O Azure para na primeira regra que corresponde.

Tres regras default existem em todo NSG e nao podem ser removidas: `AllowVNetInBound` (65000), `AllowAzureLoadBalancerInBound` (65001), `DenyAllInBound` (65500). Para entrada vinda da internet, o padrao e bloquear. Para saida, o padrao e permitir para internet.

```bash
az network nsg rule create   --nsg-name nsg-app   --resource-group rg-app   --name allow-https   --priority 100   --protocol Tcp   --direction Inbound   --source-address-prefix Internet   --source-port-range '*'   --destination-address-prefix '*'   --destination-port-range 443   --access Allow
```

NSG pode ser associado a subnet (afeta todos os recursos) ou a NIC de VM (afeta so aquela VM). Quando os dois existem, entrada passa pelo NSG da subnet primeiro, depois pelo da NIC. Saida: NIC primeiro, subnet depois.

## UDR: quando o roteamento padrao nao basta

Por padrao, Azure roteia trafego automaticamente entre subnets, para internet e para conexoes on-premises. UDR (User Defined Route) sobrescreve esse comportamento.

O caso de uso mais comum: forcar todo o trafego a passar pelo Azure Firewall no hub antes de sair para internet ou ir para outro spoke.

```bash
az network route-table create   --name rt-spoke-app   --resource-group rg-networking   --location brazilsouth

az network route-table route create   --route-table-name rt-spoke-app   --resource-group rg-networking   --name route-to-firewall   --address-prefix 0.0.0.0/0   --next-hop-type VirtualAppliance   --next-hop-ip-address 10.0.0.4

# Associar a subnet
az network vnet subnet update   --name snet-app   --vnet-name vnet-spoke   --resource-group rg-networking   --route-table rt-spoke-app
```

## O que o AZ-104 pergunta sobre UDR

"Voce tem um Azure Firewall no hub e quer que todo trafego de saida dos spokes passe por ele. O que voce configura?"

Resposta: UDR em cada subnet dos spokes com rota 0.0.0.0/0 apontando para o IP privado do Firewall (next-hop-type VirtualAppliance).

"Um administrador criou uma UDR com next-hop-type None para um range especifico. O que acontece com o trafego para esse range?"

Resposta: o trafego e descartado (black hole). `None` significa que nao ha proximo salto valido.

NSG e UDR resolvem problemas diferentes: NSG filtra o trafego, UDR define para onde ele vai. Em incidentes de rede, verifique os dois antes de concluir qual esta causando o problema.
