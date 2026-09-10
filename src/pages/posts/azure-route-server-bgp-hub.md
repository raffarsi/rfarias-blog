---
layout: ../../layouts/PostLayout.astro
title: "Azure Route Server: propagação de rotas BGP no hub sem VPN Gateway"
category: "Networking"
tag: "networking"
date: "03 Nov 2025"
readTime: "10 min"
description: "O Route Server permite que NVAs de terceiros troquem rotas BGP diretamente com o fabric do Azure. Quando usar no lugar do VPN Gateway e como configurar em topologia hub-and-spoke."
---

Se voce tem NVAs de terceiros no hub, como Fortinet ou Palo Alto, provavelmente ja passou por isso: aprender uma nova rota on-premises via BGP e ter que atualizar UDRs manualmente em cada spoke para que o trafego chegue la. Em ambientes que crescem, isso vira rotina de manutencao toda vez que surgem novos prefixos.

O Route Server resolve exatamente esse problema.

## O que o Route Server faz

Sem o Route Server, a NVA aprende rotas on-premises via BGP com o VPN/ER Gateway, mas o Azure nao propagas essas rotas para os spokes automaticamente. Voce mantem UDRs estaticas em cada spoke e atualiza manualmente quando surgem novos prefixos on-premises.

Com o Route Server, a NVA troca rotas BGP diretamente com o fabric do Azure. As rotas aprendidas sao propagadas automaticamente para todos os spokes. Chega de planilha de UDRs para atualizar.

```bash
# Criar o Route Server no hub
az network routeserver create   --name route-server-hub   --resource-group rg-networking   --location brazilsouth   --hosted-subnet $(az network vnet subnet show     --vnet-name vnet-hub     --name RouteServerSubnet     --resource-group rg-networking --query id -o tsv)

# Branch-to-Branch: rotas entre VPN e ER propagadas automaticamente
az network routeserver update   --name route-server-hub   --resource-group rg-networking   --allow-b2b-traffic true

# Peering BGP com a NVA
az network routeserver peering create   --name peering-fortinet   --routeserver route-server-hub   --resource-group rg-networking   --peer-ip 10.0.0.4   --peer-asn 65001
```

## Configurando o BGP na NVA (Fortinet)

```
config router bgp
  set as 65001
  config neighbor
    edit "10.0.0.68"    # IP primario do Route Server
      set remote-as 65515   # ASN fixo do Route Server
      set soft-reconfiguration enable
    next
    edit "10.0.0.69"    # IP secundario (HA)
      set remote-as 65515
      set soft-reconfiguration enable
    next
  end
end
```

O Route Server sempre tem dois IPs para alta disponibilidade. Configure os dois como neighbors na NVA.

## Verificando se esta funcionando

```bash
# Rotas que o Route Server aprendeu da NVA
az network routeserver peering list-learned-routes   --name peering-fortinet   --routeserver route-server-hub   --resource-group rg-networking

# Rotas que o Route Server anunciou para a NVA
az network routeserver peering list-advertised-routes   --name peering-fortinet   --routeserver route-server-hub   --resource-group rg-networking
```

## Quando vale (e quando nao vale)

Use Route Server quando a NVA precisa propagar rotas dinamicamente ou quando voce tem muitos prefixos on-premises que mudam com frequencia. UDRs estaticas ainda sao suficientes para cenarios simples com poucas rotas estaveis ou quando voce usa Azure Firewall nativo (que tem integracao direta com o fabric sem precisar de BGP).

A regra pratica que uso: se voce esta atualizando UDRs mais de uma vez por mes por causa de mudancas no roteamento on-premises, o Route Server ja se paga em tempo de operacao poupado.
