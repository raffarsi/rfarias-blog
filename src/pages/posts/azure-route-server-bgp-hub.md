---
layout: ../../layouts/PostLayout.astro
title: "Azure Route Server: propagação de rotas BGP no hub sem VPN Gateway"
category: "Networking"
tag: "networking"
date: "03 Nov 2025"
readTime: "10 min"
description: "O Route Server permite que NVAs de terceiros troquem rotas BGP diretamente com o fabric do Azure. Quando usar no lugar do VPN Gateway e como configurar em topologia hub-and-spoke."
---

Se você tem NVAs de terceiros no hub, como Fortinet ou Palo Alto, provavelmente já passou por isso: aprender uma nova rota on-premises via BGP e ter que atualizar UDRs manualmente em cada spoke para que o tráfego chegue la. Em ambientes que crescem, isso vira rotina de manutenção toda vez que surgem novos prefixos.

O Route Server resolve exatamente esse problema.

## O que o Route Server faz

Sem o Route Server, a NVA aprende rotas on-premises via BGP com o VPN/ER Gateway, mas o Azure não propagas essas rotas para os spokes automaticamente. Você mantém UDRs estáticas em cada spoke e atualiza manualmente quando surgem novos prefixos on-premises.

Com o Route Server, a NVA troca rotas BGP diretamente com o fabric do Azure. As rotas aprendidas são propagadas automaticamente para todos os spokes. Chega de planilha de UDRs para atualizar.

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

## Verificando se está funcionando

```bash
# Rotas que o Route Server aprendeu da NVA
az network routeserver peering list-learned-routes   --name peering-fortinet   --routeserver route-server-hub   --resource-group rg-networking

# Rotas que o Route Server anunciou para a NVA
az network routeserver peering list-advertised-routes   --name peering-fortinet   --routeserver route-server-hub   --resource-group rg-networking
```

## Quando vale (e quando não vale)

Use Route Server quando a NVA precisa propagar rotas dinamicamente ou quando você tem muitos prefixos on-premises que mudam com frequência. UDRs estáticas ainda são suficientes para cenários simples com poucas rotas estáveis ou quando você usa Azure Firewall nativo (que tem integração direta com o fabric sem precisar de BGP).

A regra prática que uso: se você está atualizando UDRs mais de uma vez por mês por causa de mudanças no roteamento on-premises, o Route Server já se paga em tempo de operação poupado.
