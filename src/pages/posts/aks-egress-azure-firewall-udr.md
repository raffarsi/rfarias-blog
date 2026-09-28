---
layout: ../../layouts/PostLayout.astro
title: "Saída do AKS pelo Azure Firewall: passo a passo com userDefinedRouting"
category: "Networking"
tag: "networking"
date: "06 Out 2026"
readTime: "7 min"
description: "Por padrão, os pods de um cluster AKS saem para qualquer destino na internet. O passo a passo para forçar essa saída pelo Azure Firewall com userDefinedRouting, liberar só o que o AKS e a aplicação precisam e não quebrar a entrada pelo caminho."
---

A auditoria pergunta para quais destinos os pods do cluster de produção podem sair. Eu abro o portal, olho o outbound type do cluster, vejo `loadBalancer` e sei que a resposta honesta é uma só: qualquer um. O Load Balancer faz SNAT para um IP público, e ninguém no meio do caminho decide se aquele destino faz sentido.

No artigo sobre [Network Policies no AKS](/posts/network-policies-aks-azure-cni/) eu tratei do tráfego entre pods. Aqui o assunto é o outro lado: o tráfego que sai do cluster. A própria documentação da Microsoft deixa claro o ponto de partida: por padrão, um cluster AKS tem acesso irrestrito de saída para a internet.

O caminho que eu uso para mudar isso é o outbound type `userDefinedRouting`, com o Azure Firewall como único ponto de saída. Vou em etapas, porque a ordem importa.

## Antes do primeiro comando: o que muda com userDefinedRouting

Com `loadBalancer`, o AKS cria um IP público de saída e monta tudo sozinho. Com `userDefinedRouting`, ele não configura caminho de saída nenhum: você entrega uma sub-rede que já tem uma rota `0.0.0.0/0` apontando para um appliance, e o AKS só valida que essa rota existe e não aponta direto para a internet.

A documentação é categórica num detalhe que eu gosto de mostrar para a auditoria: com UDR, o AKS nunca cria um IP público para requisições de saída. Se um Service do tipo `LoadBalancer` for publicado depois, o Load Balancer ganha um IP público só para entrada, sem regra de saída. A saída passa a ter um único dono: o firewall.

## Passo 1: a rede

O desenho mínimo tem duas sub-redes: a do cluster e a `AzureFirewallSubnet`, com esse nome exato e tamanho /26, que é o que a documentação do firewall pede para ele escalar instâncias. No tutorial oficial as duas ficam na mesma VNet. Em produção, o mais comum é o firewall na VNet do hub e o cluster numa spoke: a lógica é a mesma, e a route table da spoke aponta para o IP privado do firewall do hub.

```bash
az network vnet create \
  --resource-group rg-rede-central \
  --name vnet-aks \
  --location brazilsouth \
  --address-prefixes 10.42.0.0/16 \
  --subnet-name snet-aks \
  --subnet-prefix 10.42.1.0/24

az network vnet subnet create \
  --resource-group rg-rede-central \
  --vnet-name vnet-aks \
  --name AzureFirewallSubnet \
  --address-prefix 10.42.2.0/26
```

## Passo 2: o firewall, com DNS proxy

O firewall precisa de um IP público Standard e do DNS proxy ligado. Sem o DNS proxy, regra de rede com FQDN não funciona. E a VNet passa a usar o IP privado do firewall como servidor DNS: assim os nós e o firewall resolvem os FQDNs das regras de rede da mesma forma.

```bash
az extension add --name azure-firewall

az network public-ip create -g rg-rede-central -n pip-fw-saida --sku Standard
az network firewall create -g rg-rede-central -n fw-saida --location brazilsouth --enable-dns-proxy true
az network firewall ip-config create -g rg-rede-central --firewall-name fw-saida \
  --name fw-config --public-ip-address pip-fw-saida --vnet-name vnet-aks

FW_PRIVATE_IP=$(az network firewall show -g rg-rede-central -n fw-saida \
  --query "ipConfigurations[0].privateIPAddress" -o tsv)
FW_PUBLIC_IP=$(az network public-ip show -g rg-rede-central -n pip-fw-saida \
  --query ipAddress -o tsv)

az network vnet update -g rg-rede-central -n vnet-aks --dns-servers $FW_PRIVATE_IP
```

Um IP público serve para testar. Para produção, a documentação recomenda partir de pelo menos 20 IPs de frontend no firewall, para não esgotar portas de SNAT, e considerar a integração com NAT Gateway em clusters com muitas conexões para os mesmos destinos.

## Passo 3: a route table

Duas rotas. A primeira manda tudo para o IP privado do firewall. A segunda manda o IP público do próprio firewall direto para a internet; ela existe por causa da entrada, que eu explico mais adiante.

```bash
az network route-table create -g rg-rede-central -n rt-aks-saida --location brazilsouth

az network route-table route create -g rg-rede-central --route-table-name rt-aks-saida \
  -n padrao-para-firewall --address-prefix 0.0.0.0/0 \
  --next-hop-type VirtualAppliance --next-hop-ip-address $FW_PRIVATE_IP

az network route-table route create -g rg-rede-central --route-table-name rt-aks-saida \
  -n ip-publico-firewall --address-prefix $FW_PUBLIC_IP/32 --next-hop-type Internet

az network vnet subnet update -g rg-rede-central --vnet-name vnet-aks \
  -n snet-aks --route-table rt-aks-saida
```

A route table vai para a sub-rede antes de o cluster existir: o AKS exige essa rota para aceitar o `userDefinedRouting` e valida que ela aponta para um appliance, não para a internet.

## Passo 4: as regras obrigatórias do AKS

As dependências do AKS são quase todas FQDNs sem endereço fixo, e é por isso que NSG não resolve esse problema. O Azure Firewall simplifica com a FQDN tag `AzureKubernetesService`, que contém todos os FQDNs da página de regras de saída do AKS e é atualizada automaticamente. Entre eles estão `*.hcp.<região>.azmk8s.io` (comunicação dos nós com o API server), `mcr.microsoft.com`, `management.azure.com`, `login.microsoftonline.com` e `packages.aks.azure.com`.

```bash
az network firewall application-rule create -g rg-rede-central --firewall-name fw-saida \
  --collection-name aks-obrigatorio --name fqdn-tag-aks \
  --source-addresses 10.42.1.0/24 --protocols 'http=80' 'https=443' \
  --fqdn-tags AzureKubernetesService --action allow --priority 100
```

As regras de rede merecem atenção, porque a lista mudou. Na nuvem global do Azure, as portas UDP 1194 e TCP 9000 para o plano de controle não são necessárias em clusters privados nem em clusters com o konnectivity-agent, que é o caso do cluster do tutorial oficial. O NTP em UDP 123 também não é exigido para nós provisionados depois de março de 2021. O que continua valendo: se você usa DNS customizado, os nós precisam alcançá-lo em TCP e UDP 53. E se algum pod fora de `kube-system` e `gatekeeper-system` conversa com o API server, como um ingress controller, você precisa de uma regra de rede para TCP 443 no IP do API server ou, com firewall de camada 7, da anotação `kubernetes.azure.com/set-kube-service-host-fqdn` no pod, que faz ele usar o FQDN do API server.

## Passo 5: o cluster com userDefinedRouting

```bash
SUBNET_ID=$(az network vnet subnet show -g rg-rede-central --vnet-name vnet-aks \
  -n snet-aks --query id -o tsv)

az aks create \
  --resource-group rg-plataforma \
  --name aks-producao \
  --location brazilsouth \
  --network-plugin azure \
  --network-plugin-mode overlay \
  --outbound-type userDefinedRouting \
  --vnet-subnet-id $SUBNET_ID \
  --api-server-authorized-ip-ranges $FW_PUBLIC_IP \
  --generate-ssh-keys
```

O parâmetro `--api-server-authorized-ip-ranges` merece uma explicação. Num cluster não privado, a documentação avisa que o tráfego para o API server passa pelo outbound type do cluster, ou seja, pelo firewall. Os nós chegam ao API server com o IP público do firewall, e por isso ele entra na lista autorizada. Quem administra de fora precisa ter o próprio IP incluído ou usar um jumpbox na VNet. Se a exigência for não expor o API server como tráfego público, a documentação aponta dois caminhos: cluster privado ou API Server VNet Integration. Eu prefiro um deles em produção.

## Passo 6: as dependências da aplicação, uma por uma

Com o cluster no ar, tudo que não está na FQDN tag é bloqueado. É aqui que a resposta para a auditoria deixa de ser "qualquer um". Cada dependência externa vira uma regra de aplicação, com FQDN e porta:

```bash
az network firewall application-rule create -g rg-rede-central --firewall-name fw-saida \
  --collection-name app-producao --name api-externa \
  --source-addresses 10.42.1.0/24 --protocols 'https=443' \
  --target-fqdns api.exemplo.com --action allow --priority 200
```

Um limite que eu deixo explícito: com Azure CNI em overlay, o tráfego do pod que sai do cluster usa SNAT para o IP do nó. O firewall enxerga o nó, não o pod. Ele responde "o que o cluster pode acessar"; "qual pod pode acessar" continua sendo trabalho da Network Policy.

## O Load Balancer público e o roteamento assimétrico

Este é o problema que derruba a primeira aplicação publicada. Com a rota `0.0.0.0/0` apontando para o firewall, um Service `LoadBalancer` público recebe a requisição pelo IP público dele, mas a resposta sai pela rota padrão e chega ao firewall. Como o Azure Firewall é stateful e não conhece aquela sessão, ele descarta o pacote.

A documentação oferece dois desenhos. Nos dois, a entrada passa pelo firewall. No primeiro, o Service continua com Load Balancer público: uma regra DNAT traduz o IP público do firewall para o IP público de frontend do Load Balancer, e a rota `/32` do passo 3 garante que o retorno para o IP público do firewall não volte pelo caminho errado. O segundo, que a documentação do firewall chama de design preferido, é usar um Load Balancer interno e apontar o DNAT para o IP privado dele: o retorno volta pelo mesmo caminho e a rota `/32` deixa de ser necessária.

```bash
az network firewall nat-rule create -g rg-rede-central --firewall-name fw-saida \
  --collection-name entrada-publica --name app-web --action Dnat --priority 100 \
  --protocols TCP --source-addresses '*' \
  --destination-addresses $FW_PUBLIC_IP --destination-ports 80 \
  --translated-address <IP-de-frontend-do-Service> --translated-port 80
```

## E o cluster que já existe?

Durante muito tempo, trocar o outbound type exigia recriar o cluster. Hoje o `az aks update --outbound-type userDefinedRouting` funciona, com Azure CLI 2.56 ou superior. Em VNet própria, a migração de `loadBalancer` ou `userAssignedNATGateway` para `userDefinedRouting` é suportada; em VNet gerenciada pelo AKS, `userDefinedRouting` não aparece entre os destinos de migração. O cluster precisa usar Virtual Machine Scale Sets e Load Balancer Standard, e a rota `0.0.0.0/0` precisa estar na sub-rede antes do comando. O custo é explícito na documentação: a troca interrompe a conectividade, muda o IP de saída e derruba as conexões existentes. Se o cluster usa authorized IP ranges, o novo IP de saída tem que entrar na lista. Eu trato como janela de manutenção, com as regras do firewall prontas e testadas antes.

## O que fica

Controlar a saída do AKS não é colocar um firewall no desenho; é aceitar que toda dependência nova da aplicação passa a ser uma regra revisada. No começo isso incomoda os times, e é exatamente esse incômodo que transforma "qualquer um" numa lista que alguém consegue ler, auditar e defender. Eu começo pela FQDN tag e pelos logs do firewall, olhando o que é negado antes de abrir qualquer coisa.

Se um pod do seu cluster fosse comprometido agora, para quantos destinos na internet ele conseguiria mandar dados?
