---
layout: ../../layouts/PostLayout.astro
title: "Firewall de terceiros em alta disponibilidade no Azure: HA Ports, Gateway Load Balancer, BGP ou troca de rota"
category: "Networking"
tag: "networking"
date: "20 Out 2026"
readTime: "7 min"
description: "Uma NVA sozinha no hub derruba todo o tráfego na primeira janela de manutenção. Um comparativo dos quatro padrões documentados para firewalls de terceiros em alta disponibilidade no Azure, com failover, simetria, SNAT e qual eu escolheria em cada cenário."
---

O firewall de terceiros funcionava bem com uma única VM no hub. As rotas dos spokes apontavam para o IP privado dela e ninguém reclamava. Até a primeira janela de manutenção do fabricante: a VM reiniciou para aplicar a atualização, e todo o tráfego do hub parou junto com ela. Internet, on-premises, spoke para spoke.

Não foi defeito do produto. Foi o desenho. O guia de arquitetura da Microsoft lembra que NVAs param em interrupções planejadas e não planejadas como qualquer VM, e que aplicação com alta disponibilidade precisa de pelo menos duas. A pergunta real é como colocar as duas no caminho do tráfego.

## Três critérios, e um que vem antes

O guia "Deploy highly available NVAs" coloca uma regra em primeiro lugar: o desenho certo é o que o fabricante da NVA validou e documentou para o Azure. Se ele suporta um padrão só, a escolha acabou. Havendo opções, a decisão passa por três critérios:

**Tempo de convergência.** Quanto tempo o tráfego leva para sair da instância que falhou.

**Topologia.** Ativo-ativo, ativo-passivo ou cluster escalável.

**Simetria de fluxo.** Se ida e volta passam pela mesma instância ou se a NVA precisa de SNAT para garantir isso.

## Os quatro padrões lado a lado

| Critério | LB interno com HA Ports | Gateway Load Balancer | Route Server com BGP | Ativo-passivo com troca de rota |
|---|---|---|---|---|
| Failover | Em geral 10 a 15 s, pelo probe | 10 a 15 s, pelo probe | Depende dos timers BGP (hold padrão de 180 s) | Um a dois minutos ou mais |
| Simetria | Só quando ida e volta passam pelo mesmo LB interno | Garantida | Não: ECMP por fluxo | Garantida: uma NVA ativa |
| SNAT | Sim na entrada pela internet | Não | Sim, em ativo-ativo stateful | Não |
| Complexidade | Baixa a média | Média, exige VXLAN na NVA | Alta: BGP em produção | Simples de montar, difícil de confiar |
| Caso típico | Firewall de hub: leste-oeste, on-premises, saída | Inspeção transparente de entrada e saída pela internet | SD-WAN e VPN que trocam rotas com o Azure | NVA sem outro suporte |

Os três primeiros suportam ativo-ativo, ativo-passivo e scale-out. O último, só ativo-passivo.

## Load Balancer interno com HA Ports

Um Standard Load Balancer interno recebe uma regra de HA Ports: protocolo All, portas de frontend e backend 0. Todo fluxo TCP e UDP, em qualquer porta, é distribuído entre as NVAs, com decisão por fluxo. As UDRs dos spokes apontam para o IP do frontend, não para uma VM.

A simetria vem de graça num caso específico: quando ida e volta passam pelo mesmo LB interno, o LB escolhe a mesma instância nas duas direções, desde que cada NIC da NVA tenha uma única configuração de IP. Isso cobre spoke para spoke e Azure para on-premises. A documentação é explícita no resto: não há simetria entre dois load balancers, e isso inclui a NVA colocada entre um LB público e um interno.

Por isso a entrada pela internet exige SNAT. O LB público (onde HA Ports não existe, e cada porta precisa de regra própria) entrega o pacote a uma instância; a resposta voltaria pelo LB interno, que pode escolher outra. Com SNAT, a NVA atrai a volta para si. Na saída, o guia recomenda NAT gateway com suporte a zonas, que devolve o retorno à mesma instância.

O probe IPv4 sai sempre de 168.63.129.16, que não pode ser bloqueado no NSG (a service tag AzureLoadBalancer já é liberada por padrão) nem na política do próprio firewall. NVA com duas NICs precisa responder pela mesma interface em que o probe chegou, o que costuma exigir mais de uma tabela de rotas no sistema operacional. Em ativo-passivo, a porta de saúde responde só na instância ativa.

```bash
az network lb create \
  --resource-group rg-rede-central \
  --name lbi-firewall \
  --sku Standard \
  --vnet-name vnet-hub \
  --subnet snet-nva \
  --private-ip-address 10.0.2.100 \
  --frontend-ip-name fe-firewall \
  --backend-pool-name bp-firewall

# Porta de saúde indicada pelo fabricante; pela CLI o intervalo padrão é 15 s
az network lb probe create \
  --resource-group rg-rede-central \
  --lb-name lbi-firewall \
  --name hp-firewall \
  --protocol Tcp \
  --port 8443 \
  --interval 5

az network lb rule create \
  --resource-group rg-rede-central \
  --lb-name lbi-firewall \
  --name ha-ports \
  --protocol All \
  --frontend-port 0 \
  --backend-port 0 \
  --frontend-ip-name fe-firewall \
  --backend-pool-name bp-firewall \
  --probe-name hp-firewall
```

O intervalo importa: o portal usa 5 segundos, mas CLI, ARM e PowerShell usam 15, e a estimativa de 10 a 15 segundos do guia parte do probe a cada 5. Duas limitações aparecem tarde: o idle timeout de TCP não é suportado em HA Ports quando o tráfego chega por UDR, e fragmentação de IP não é suportada.

## Gateway Load Balancer: o firewall no fio

O Gateway Load Balancer é um SKU feito para inserir NVAs de forma transparente. Em vez de UDR, o frontend de um Standard Load Balancer público, ou o IP público de uma VM, passa a referenciar o frontend do Gateway Load Balancer. Todo tráfego que entra ou sai por aquele IP passa primeiro pelas NVAs, encapsulado em VXLAN, e chega à aplicação com o IP de origem preservado.

O backend usa dois túneis: o externo, para o tráfego que chega ao pool, e o interno, para o que segue da NVA para a aplicação. As regras só podem ser HA Ports, o frontend é sempre privado, e a VNet das NVAs dispensa peering com a da aplicação, que pode estar em outra assinatura ou outro tenant. O serviço prende o fluxo à mesma instância nas duas direções, sem SNAT.

```bash
feid=$(az network lb frontend-ip show \
  --resource-group rg-inspecao \
  --lb-name lbg-firewall \
  --name fe-gwlb \
  --query id --output tsv)

az network lb frontend-ip update \
  --resource-group rg-app-web \
  --lb-name lbe-app-web \
  --name fe-publico \
  --public-ip-address pip-app-web \
  --gateway-lb $feid
```

As limitações definem onde ele cabe. Não serve para leste-oeste entre VMs do Azure. O frontend não pode ser próximo salto de UDR. Não funciona com o tier global do Load Balancer. O NAT gateway não se encadeia a ele e tem precedência na saída: com NAT gateway, a saída vai direto para a internet, sem inspeção; para inspecioná-la, o encadeamento precisa estar no frontend das outbound rules ou no IP público da VM. E a NVA precisa suportar VXLAN: numa NVA própria, o tutorial pede MTU de pelo menos 1.550 bytes.

## Route Server com BGP

As NVAs fazem peering BGP com o Azure Route Server, que programa as rotas delas nas VMs do hub e dos spokes, sem route table. Em ativo-ativo, todas anunciam as mesmas rotas e as VMs usam ECMP. Em ativo-passivo, a secundária anuncia com AS path mais longo.

O ECMP quebra a simetria: cada VM escolhe a NVA sozinha, e o firewall stateful precisa de SNAT. A convergência depende dos timers: keepalive de 60 segundos e hold de 180 no Route Server, com a NVA podendo negociar valores menores, sob o risco de instabilidade no BGP. Cada NVA faz peering com as duas instâncias do Route Server, e acima de 4.000 rotas anunciadas por peer a sessão cai.

O Route Server também não sobrepõe rotas de sistema: tráfego dentro da VNet ou entre VNets pareadas continua dependendo de UDR ou de LB com HA Ports. Onde ele brilha é com NVAs de SD-WAN e VPN, que precisam aprender os prefixos do Azure e anunciar rotas de volta.

## Ativo-passivo com troca de rota por script

O padrão mais antigo: uma NVA ativa, dona do IP público e alvo das UDRs, e uma passiva monitorando. Quando a ativa cai, a passiva chama a API do Azure para mover o IP público e reescrever as UDRs para si.

A simetria é garantida porque só uma trabalha. O custo está no failover: a tabela do guia fala em um a dois minutos, e o texto admite que as chamadas podem levar vários minutos para ter efeito. Há risco de split brain, quando as duas perdem contato e cada uma conclui que a outra caiu. E para ganhar banda, só aumentando as duas VMs.

## Qual eu escolheria em cada cenário

**Firewall de hub para leste-oeste, on-premises e saída.** LB interno com HA Ports, NVAs de uma NIC em zonas de disponibilidade e NAT gateway na saída.

**Entrada da internet para aplicações publicadas.** Se a NVA suporta, Gateway Load Balancer: sem SNAT, o firewall e a aplicação veem o IP real do cliente. Se não suporta, LB público na frente e SNAT na NVA, aceitando que o servidor veja o IP da NVA.

**SD-WAN ou VPN de terceiros no hub.** Route Server com BGP. Esses appliances costumam ser stateless, e a simetria deixa de ser problema.

**NVA que não suporta nada disso.** Ativo-passivo com troca de rota, com o tempo de failover medido e aceito por escrito. Para algo novo, eu não escolheria.

Se o hub for um Virtual WAN, a conversa é outra, com regras próprias para NVAs no hub, como no [SD-WAN de terceiros no hub seguro do Virtual WAN](/posts/fortinet-sdwan-virtual-wan-secured-hub/).

## O que fica

Alta disponibilidade de NVA não é colocar a segunda VM no pool: é decidir quem detecta a falha e quem reescreve o caminho. No LB, é o probe em segundos. No BGP, são os timers que você negociou. No script, é uma chamada de API que alguém escreveu anos atrás e ninguém testou desde então. Eu não aceitaria nenhum desses desenhos em produção sem derrubar uma instância de propósito e cronometrar a volta.

Se a VM do seu firewall reiniciasse agora, quanto tempo o tráfego ficaria parado, e alguém já mediu esse número?
