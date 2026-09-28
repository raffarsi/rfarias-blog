---
layout: ../../layouts/PostLayout.astro
title: "Azure Virtual Network Manager: a regra de segurança que nenhum NSG consegue desfazer"
category: "Networking"
tag: "networking"
date: "29 Set 2026"
readTime: "7 min"
description: "Quando cada time cuida do próprio NSG, a regra central vira sugestão. Como as security admin rules do Azure Virtual Network Manager são avaliadas antes do NSG, como criar exceções sem abrir brecha e onde elas não chegam."
---

A varredura de segurança do fim do mês encontrou a porta 3389 aberta para a internet numa VM de homologação. Ninguém tinha agido de má-fé. Alguém do time precisou acessar a máquina com pressa, criou uma regra no NSG da própria sub-rede e esqueceu de apagar. O NSG era dele, a permissão era dele, e a política da empresa que proibia RDP exposto existia só num documento.

Essa é a situação clássica de quem dá autonomia aos times sobre a rede. E a resposta de sempre, centralizar todos os NSGs na mão de um time de rede, troca o problema de segurança por uma fila de chamados.

O Azure Virtual Network Manager resolve isso com uma camada que fica acima do NSG: as security admin rules.

## Por que só o NSG não resolve

A documentação da Microsoft descreve três modelos de gestão com NSG, e todos têm um furo.

**Time central gerencia todos os NSGs.** A regra é cumprida, mas cada mudança passa pelo mesmo time. Com centenas de NSGs, o custo operacional cresce junto.

**Cada time gerencia o próprio NSG.** Os times ganham agilidade, e a governança perde a capacidade de impor qualquer regra. A porta 3389 da abertura nasce aqui.

**NSGs criados por Azure Policy, mantidos pelos times.** Melhora o ponto de partida, mas o dono do NSG ainda pode alterar a regra padrão. A política avisa depois, e o aviso se perde no meio de muitos outros.

O que falta nos três é uma regra que o dono do NSG simplesmente não consegue sobrescrever.

## Como a security admin rule é avaliada

A security admin rule é aplicada no nível da VNet e avaliada antes de qualquer NSG. Ela tem três ações possíveis, e a diferença entre elas é a parte mais importante do artigo:

| Ação | O que acontece | O NSG é avaliado depois? |
|------|----------------|--------------------------|
| Deny | O tráfego para ali | Não |
| Always Allow | O tráfego passa direto | Não |
| Allow | O tráfego segue adiante | Sim, e o NSG ainda pode bloquear |

O Deny é a proteção da abertura: com uma regra negando 3389 vinda da internet, a regra que o time criou no NSG deixa de ter efeito, porque o tráfego nunca chega até ela.

O Always Allow é o oposto: garante que um tráfego passe mesmo que um NSG tente bloquear. Serve para o que a operação central não pode perder, como a ferramenta de varredura de vulnerabilidades ou o monitoramento. Precisa ser usado com parcimônia, porque é uma regra que o time da aplicação não consegue fechar.

O Allow é o que mais confunde. Ele não força a passagem: tira o tráfego das security admin rules de prioridade menor, como um Deny, e entrega a decisão ao NSG. Se não houver NSG, o tráfego passa. É a ação certa para exceções, como veremos adiante.

Entre as security admin rules, vale a prioridade, de 1 a 4096. Quanto menor o número, antes a regra é avaliada.

## As peças

A montagem tem quatro camadas:

**O network manager**, com um escopo, que pode ser um management group inteiro ou assinaturas específicas. Só as VNets dentro desse escopo podem receber as regras.

**Os network groups**, que dizem quais VNets recebem cada conjunto de regras. A participação pode ser estática, escolhendo VNet por VNet, ou dinâmica, por uma condição do Azure Policy, como uma tag. A dinâmica é o que faz a VNet criada amanhã entrar no grupo e receber as regras sozinha, depois de um intervalo.

**A configuração de security admin**, com coleções de regras associadas aos network groups.

**O deployment**, que aplica a configuração nas regiões escolhidas. Sem esse passo, nada acontece. É o erro mais comum de quem está começando: criar tudo e esquecer de fazer o commit.

## Na prática: bloquear RDP e SSH com uma exceção

O cenário é bloquear 3389 e 22 de entrada em todas as VNets de produção, com uma exceção: o acesso administrativo que vem da sub-rede do Azure Bastion no hub.

Primeiro o network manager, com escopo no management group, e o network group. Um pré-requisito que o portal resolve sozinho e a CLI não: com escopo de management group, o provider Microsoft.Network precisa estar registrado nesse management group antes da criação.

```bash
az network manager create \
  --name avnm-empresa \
  --resource-group rg-rede-central \
  --location brazilsouth \
  --scope-accesses "SecurityAdmin" "Connectivity" \
  --network-manager-scopes management-groups="/providers/Microsoft.Management/managementGroups/mg-producao"

az network manager group create \
  --name ng-producao \
  --network-manager-name avnm-empresa \
  --resource-group rg-rede-central
```

A participação dinâmica no `ng-producao` vem de uma definição do Azure Policy no modo `Microsoft.Network.Data`, com o efeito `addToNetworkGroup` e uma condição como a tag `ambiente=producao`, atribuída no escopo desejado.

Depois a configuração, a coleção e as regras:

```bash
az network manager security-admin-config create \
  --configuration-name sac-baseline \
  --network-manager-name avnm-empresa \
  --resource-group rg-rede-central

az network manager security-admin-config rule-collection create \
  --configuration-name sac-baseline \
  --rule-collection-name rc-portas-de-gestao \
  --network-manager-name avnm-empresa \
  --resource-group rg-rede-central \
  --applies-to-groups network-group-id="$(az network manager group show \
      --name ng-producao --network-manager-name avnm-empresa \
      --resource-group rg-rede-central --query id -o tsv)"

# A exceção: prioridade menor, avaliada primeiro
az network manager security-admin-config rule-collection rule create \
  --configuration-name sac-baseline \
  --rule-collection-name rc-portas-de-gestao \
  --rule-name permitir-bastion \
  --network-manager-name avnm-empresa \
  --resource-group rg-rede-central \
  --access Allow --direction Inbound --priority 10 --protocol Tcp \
  --sources address-prefix="10.0.1.0/26" address-prefix-type="IPPrefix" \
  --destinations address-prefix="*" address-prefix-type="IPPrefix" \
  --dest-port-ranges 22 3389

# O bloqueio para todo o resto
az network manager security-admin-config rule-collection rule create \
  --configuration-name sac-baseline \
  --rule-collection-name rc-portas-de-gestao \
  --rule-name negar-rdp-ssh \
  --network-manager-name avnm-empresa \
  --resource-group rg-rede-central \
  --access Deny --direction Inbound --priority 100 --protocol Tcp \
  --sources address-prefix="*" address-prefix-type="IPPrefix" \
  --destinations address-prefix="*" address-prefix-type="IPPrefix" \
  --dest-port-ranges 22 3389
```

Por fim, o commit na região:

```bash
az network manager post-commit \
  --network-manager-name avnm-empresa \
  --resource-group rg-rede-central \
  --commit-type "SecurityAdmin" \
  --configuration-ids "$(az network manager security-admin-config show \
      --configuration-name sac-baseline --network-manager-name avnm-empresa \
      --resource-group rg-rede-central --query id -o tsv)" \
  --target-locations brazilsouth
```

Dois detalhes desse exemplo. O Deny com origem `*` também pegaria o Bastion, que, nas portas padrão, chega às VMs justamente por 22 e 3389 a partir da AzureBastionSubnet; sem a exceção, o acesso administrativo legítimo cai junto. E a exceção usa Allow, não Always Allow: o tráfego do Bastion segue para o NSG, e o time da aplicação ainda decide se aquela VM aceita acesso administrativo.

## Onde a regra não chega

Uma regra central passa a sensação de que tudo está coberto. Não está, e a documentação lista as exceções.

**VNets com Azure SQL Managed Instance ou Azure Databricks.** Por padrão, as security admin rules não são aplicadas nessas VNets, por causa das políticas de rede que esses serviços exigem. Dá para aplicar só as regras Allow (`AllowRulesOnly`) ou pedir à Microsoft, por formulário, a aplicação completa.

**Sub-redes de serviços de rede gerenciados.** Application Gateway (salvo com isolamento de rede habilitado), Bastion, Azure Firewall, Route Server, VPN Gateway, Virtual WAN e ExpressRoute Gateway não recebem as regras na própria sub-rede. As outras sub-redes da mesma VNet recebem normalmente.

**Private endpoints de uma VNet gerenciada.** A documentação informa que, hoje, as regras não se aplicam a eles.

**Alguns service tags.** AzurePlatformDNS, AzurePlatformIMDS e AzurePlatformLKM não são aceitos nas regras.

Quem aplica uma baseline de segurança precisa saber quais VNets caem nessas exceções. Caso contrário, o relatório diz que a regra está aplicada, e a VNet mais sensível é justamente a que ficou de fora.

## O que muda na operação

**Uma configuração de security admin por região.** Cada network manager aplica uma configuração desse tipo por região. Conjuntos diferentes de regras viram coleções diferentes dentro da mesma configuração.

**O commit descreve o estado final.** Fazer o commit de uma lista de configurações numa região substitui o que estava lá para aquele tipo de configuração. Quem faz commit de uma configuração nova e esquece a antiga remove a antiga.

**A aplicação não é instantânea.** O modelo é de consistência eventual: a regra chega às VNets e aos recursos novos depois de alguns minutos. Com participação dinâmica em ambientes com mais de mil assinaturas, a entrada de uma VNet nova no grupo pode levar até 24 horas.

**Dá para ver o que está valendo.** As regras aparecem na VNet, em Network Manager, e na placa de rede da VM, em Effective security rules, separadas das regras do NSG. É o primeiro lugar a olhar quando alguém diz que "o NSG libera e mesmo assim não conecta".

**A cobrança é por VNet.** Instâncias novas pagam pelo número de VNets com alguma configuração aplicada, não pelo escopo inteiro.

## Três erros que eu vejo com frequência

**Deny amplo aplicado em tudo de uma vez.** Sem mapear quem usa aquela porta, o bloqueio derruba acesso legítimo em várias aplicações ao mesmo tempo. A Microsoft recomenda implantar região por região; eu começo por um network group pequeno, de um ambiente que não é produção, e só depois amplio.

**Usar Allow achando que é Always Allow.** A exceção é criada, o acesso continua falhando, e a investigação demora até alguém lembrar que o NSG do time também precisa liberar.

**Achar que a baseline cobre tudo.** A VNet com SQL Managed Instance fica fora do Deny por padrão, sem alarde. Se ela for a que guarda os dados mais sensíveis, a regra central protege todo o resto, menos o que mais importava.

## O que fica

O Azure Virtual Network Manager não substitui o NSG. Ele separa duas responsabilidades que costumam estar misturadas: o que a empresa não negocia, que vira security admin rule, e o que cada time decide, que continua no NSG. Com essa separação, dá autonomia aos times sem depender da boa memória de cada um.

Se alguém abrisse a porta 3389 para a internet no seu ambiente hoje à tarde, o que impediria o tráfego de chegar: uma regra ou a varredura do fim do mês?
