---
layout: ../../layouts/PostLayout.astro
title: "Azure Route Server: propagação de rotas BGP no hub sem VPN Gateway"
category: "Networking"
tag: "networking"
date: "03 Nov 2025"
readTime: "10 min"
description: "O Route Server permite que NVAs de terceiros troquem rotas BGP diretamente com o fabric do Azure. Quando usar no lugar do VPN Gateway e como configurar em topologia hub-and-spoke."
---

O Azure Route Server resolve um problema específico: NVAs (Network Virtual Appliances) de terceiros. Fortinet, Palo Alto, Check Point, precisam propagar rotas para o fabric do Azure sem depender de UDRs estáticas mantidas manualmente.

## O problema sem Route Server

Sem o Route Server, quando você coloca uma NVA no hub:

1. Você cria UDRs (User Defined Routes) apontando para o IP da NVA
2. A NVA aprende rotas on-premises via BGP com o VPN/ER Gateway
3. Mas o Azure não propaga automaticamente essas rotas para os spokes
4. Você mantém UDRs estáticas em cada spoke, e atualiza manualmente quando surgem novos prefixos on-premises

Com Route Server, a NVA troca rotas BGP diretamente com o fabric do Azure, e as rotas aprendidas são propagadas automaticamente para todos os spokes.

## Arquitetura com Route Server

```
On-premises
  ↓ BGP via ExpressRoute/VPN
VPN/ER Gateway (hub)
  ↑↓ BGP
Azure Route Server (hub)
  ↑↓ BGP
NVA Fortinet/Palo Alto (hub)
  → rotas propagadas automaticamente para todos os spokes
```

## Configurando o Route Server

```bash
# Criar o Route Server no hub
az network routeserver create \
  --name route-server-hub \
  --resource-group rg-networking \
  --location brazilsouth \
  --hosted-subnet $(az network vnet subnet show \
    --vnet-name vnet-hub \
    --name RouteServerSubnet \  # nome obrigatório, /27 mínimo
    --resource-group rg-networking --query id -o tsv)

# Habilitar Branch-to-Branch (rotas entre VPN e ER)
az network routeserver update \
  --name route-server-hub \
  --resource-group rg-networking \
  --allow-b2b-traffic true

# Criar peering BGP com a NVA
az network routeserver peering create \
  --name peering-fortinet \
  --routeserver route-server-hub \
  --resource-group rg-networking \
  --peer-ip 10.0.0.4 \    # IP privado da NVA
  --peer-asn 65001          # ASN configurado na NVA
```

## Configuração na NVA (exemplo Fortinet)

Na NVA Fortinet, configure o BGP neighbor apontando para os dois IPs do Route Server (ele sempre tem dois IPs para HA):

```
config router bgp
  set as 65001
  config neighbor
    edit "10.0.0.68"    # IP primário do Route Server
      set remote-as 65515   # ASN fixo do Route Server
      set soft-reconfiguration enable
    next
    edit "10.0.0.69"    # IP secundário
      set remote-as 65515
      set soft-reconfiguration enable
    next
  end
end
```

## Verificando rotas aprendidas

```bash
# Ver rotas que o Route Server aprendeu da NVA
az network routeserver peering list-learned-routes \
  --name peering-fortinet \
  --routeserver route-server-hub \
  --resource-group rg-networking

# Ver rotas que o Route Server anunciou para a NVA
az network routeserver peering list-advertised-routes \
  --name peering-fortinet \
  --routeserver route-server-hub \
  --resource-group rg-networking
```

<div class="callout">
<strong>Branch-to-Branch:</strong> Com <code>allow-b2b-traffic</code> habilitado, rotas aprendidas de um circuito ExpressRoute são propagadas para conexões VPN e vice-versa, sem precisar de UDRs manuais. Útil quando você tem múltiplos sites conectando por tipos de circuito diferentes.
</div>

## Quando usar Route Server vs UDRs estáticas

**Use Route Server quando:**
- NVA de terceiros precisa propagar rotas dinamicamente
- Você tem muitos prefixos on-premises que mudam com frequência
- Branch-to-branch routing é necessário

**UDRs estáticas são suficientes quando:**
- Número pequeno de rotas que raramente mudam
- Você usa Azure Firewall nativo (não NVA de terceiros)
- Ambiente simples sem conectividade híbrida complexa

## Conclusão

O Route Server elimina a manutenção manual de UDRs em ambientes com NVAs de terceiros. O investimento na configuração BGP inicial retorna em horas poupadas toda vez que um novo prefixo on-premises aparece, em vez de atualizar UDRs em cada spoke manualmente.
