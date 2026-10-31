---
layout: ../../layouts/PostLayout.astro
title: "Criptografado segundo quem? VNet encryption e a prova que mora no flow log"
category: "Networking"
tag: "networking"
date: "24 Nov 2026"
readTime: "8 min"
description: "Marcar a criptografia na VNet não garante que um único pacote entre VMs foi criptografado. Como o Azure Virtual Network encryption funciona, quais requisitos decidem se ele age, o que fica de fora e como comprovar com o campo de criptografia dos VNet flow logs."
---

A pergunta chega num questionário de segurança, numa auditoria interna ou no contrato de um cliente regulado: o tráfego entre as VMs é criptografado? A resposta mais rápida é abrir o portal, mostrar a VNet com **Encryption: Enabled** e anexar o print.

O print prova que alguém marcou uma caixa. Não prova que algum pacote saiu criptografado.

Com o Azure Virtual Network encryption, essa diferença não é detalhe. A configuração fica na VNet, mas quem decide se a criptografia acontece é cada VM, cada host e cada caminho do tráfego. Dá para ter a opção ligada e parte do tráfego passando em claro, sem erro nenhum no portal.

## O que o recurso faz

O Virtual Network encryption cria um túnel DTLS entre as VMs e criptografa o tráfego entre elas de forma transparente. A criptografia termina na SmartNIC/FPGA do host do Azure, e os certificados do DTLS são gerenciados pela Microsoft, por região.

O escopo é: VMs e scale sets na mesma VNet, e VMs em VNets com peering regional ou global. O recurso é gratuito (você paga só pelos recursos que já usa) e está em GA em todas as regiões públicas do Azure. Em Azure Government e no Azure operado pela 21Vianet, ainda está em preview pública.

Não confunda com outra camada que já existe: o tráfego entre datacenters, fora de limites físicos controlados pela Microsoft, já usa MACsec na camada de enlace, inclusive no peering. O VNet encryption vai além e criptografa de VM para VM, mesmo dentro da VNet.

## Os requisitos que decidem se a criptografia acontece

Aqui está a primeira armadilha. Habilitar na VNet é a parte fácil. O resto depende de cada VM.

**Tamanho de VM suportado.** As séries D e E v5 e mais novas são suportadas como um todo. Para as demais famílias, vale uma lista específica: algumas séries D e E v4, séries F v6, Lsv3, M v2 e v3 e alguns tamanhos de GPU, como NC-H100 v5. A Microsoft acrescenta tamanhos conforme valida. VM fora da lista não criptografa, mesmo dentro de uma VNet com a opção ligada.

**Accelerated Networking habilitado na placa de rede.** É obrigatório. A criptografia é feita em hardware no host, e sem Accelerated Networking a VM fica de fora.

**Start/stop das VMs que já existiam.** Depois de habilitar a criptografia, as VMs existentes precisam ser paradas e iniciadas de novo. É o tipo de passo que costuma ficar para "a próxima janela".

**Só IP privado para IP privado.** A criptografia vale para o tráfego entre VMs, de endereço privado para endereço privado. O que sai para a internet não entra.

## O que fica de fora

A documentação traz uma tabela de cenários com duas colunas que precisam ser lidas separadas: **Supported** (a conectividade continua funcionando com a criptografia ligada) e **Encrypted** (o tráfego é criptografado de fato). A própria Microsoft avisa: um cenário pode ser suportado e mesmo assim não criptografado.

![Diagrama com a VNet A com criptografia habilitada: duas VMs suportadas trocando tráfego criptografado (X), uma VM sem suporte com tráfego não criptografado, peering com a VNet B criptografado (X) e saída para a internet sem criptografia (NX)](/images/posts/vnet-encryption-trafego-entre-vms/cobertura-vnet-encryption.svg)

Alguns casos dessa tabela que costumam surpreender:

- **Private Endpoint e Private Link Service:** suportados, mas o tráfego de e para eles não é criptografado. Se a sua arquitetura usa [private endpoints](/posts/private-endpoints-azure/) para tudo, esse trecho fica fora.
- **Application Gateway e gateways de ExpressRoute:** suportados, não criptografados.
- **Azure Firewall:** o Premium criptografa, o Standard não, porque roda em tamanhos de VM sem suporte.
- **VPN Gateway:** não suportado. A documentação alerta que caminhos parcialmente criptografados, como NVAs ativo/passivo com retorno passando por um Load Balancer, podem causar perda de pacotes e falha de conexão.
- **Internal Load Balancer:** criptografa se todas as VMs do backend forem de tamanhos suportados. Com SKUs misturados no backend, o cenário não é suportado.
- **Azure DNS Private Resolver:** não suportado.
- **PaaS:** depende da VM que hospeda o serviço.

Duas limitações completam o quadro. A primeira: não habilite o recurso em VNets com VMs de Azure confidential computing. Se precisar delas numa VNet com criptografia, habilite Accelerated Networking na placa, se o tamanho permitir, ou troque para um tamanho que suporte. A segunda está no FAQ: pacotes UDP fragmentados não são tratados no hardware e são descartados. Pacotes acima do MTU também são descartados, não fragmentados. A orientação é usar o flag Don't Fragment e evitar fragmentação saindo da VM.

## Enforcement: hoje, só "permitir sem criptografia"

O recurso tem uma política de enforcement. Na GA, a única opção suportada é **AllowUnencrypted**. A **DropUnencrypted**, que descartaria o tráfego sem criptografia, aparece na documentação como suporte futuro.

Traduzindo para a auditoria: hoje o Azure não bloqueia nada que deixe de ser criptografado. Uma VM sem suporte conversa com as outras em claro, e nada falha. Bom para não quebrar aplicação, ruim para quem precisa afirmar que todo o tráfego é criptografado.

A habilitação numa VNet existente pela CLI, como está na documentação:

```bash
az network vnet update \
  --resource-group test-rg \
  --name vnet-1 \
  --enable-encryption true \
  --encryption-enforcement-policy allowUnencrypted
```

## A prova está no flow log

A própria página do recurso diz como confirmar: com os VNet flow logs do Network Watcher. Os NSG flow logs não identificam a criptografia, os VNet flow logs sim.

Cada fluxo registrado tem um campo de estado de criptografia, o nono valor da tupla, logo depois do estado do fluxo. Os valores documentados que mais interessam:

- **X:** conexão criptografada. É o que você quer ver.
- **NX:** não criptografada. Aparece quando a criptografia não está configurada ou quando uma VM com criptografia fala com um destino sem criptografia, como um endpoint na internet. É o padrão de qualquer VNet.
- **NX_HW_NOT_SUPPORTED:** a criptografia está configurada, mas a VM está num host cujo hardware não suporta. A orientação é reportar à Microsoft.
- **NX_SW_NOT_READY:** o componente de software do host ainda não está pronto, comum no boot ou após redeploy. O pacote é descartado e o problema deve ser temporário.
- **NX_LOCAL_DST:** origem e destino estão no mesmo host físico. Por design, não há criptografia.
- **NX_FALLBACK:** com AllowUnencrypted, o sistema tentou criptografar, teve um problema e deixou passar sem criptografia.

Repare no NX_LOCAL_DST. Duas VMs suportadas, na mesma VNet, com tudo certo, podem conversar sem criptografia porque o Azure colocou as duas no mesmo host. Nenhuma configuração mostra isso. Só o log.

Com traffic analytics habilitado, o mesmo dado aparece na tabela NTANetAnalytics, no campo **FlowEncryption**, com valores como Encrypted, Unencrypted e Fall back to no encryption. Daí sai uma consulta com os pares de IPs privados sem criptografia.

Os flow logs são cobrados por GB coletado, com franquia mensal gratuita por assinatura, e o armazenamento é à parte. Para evidência de auditoria, é um custo que eu aceito sem discutir.

## Como eu auditaria

Na minha visão de auditor, "criptografado" é uma afirmação sobre o tráfego, não sobre a configuração. Então a evidência também precisa vir do tráfego.

O roteiro que eu seguiria:

1. **Configuração:** a VNet tem a criptografia habilitada? Qual a política de enforcement? (Hoje será AllowUnencrypted.)
2. **Inventário:** quais VMs estão em tamanhos suportados e com Accelerated Networking? Quais já existiam antes da habilitação e passaram por start/stop?
3. **Caminho:** o tráfego passa por Private Endpoint, Application Gateway ou Firewall Standard? Esses trechos ficam fora e precisam de outro controle, como TLS na aplicação. Se passa por VPN Gateway, o cuidado é maior: ele não é suportado e pode causar perda de pacotes.
4. **Evidência:** VNet flow logs ligados, com amostra de um período, mostrando a proporção de X e NX entre IPs privados, e explicação para cada NX encontrado.

O item 4 é o que transforma "está habilitado" em "está funcionando". Sem ele, a resposta honesta ao questionário é "configurado, não verificado".

## O que fica

O VNet encryption é um recurso bom e barato de ligar. O problema não está nele, está em como ele costuma ser apresentado: uma caixa marcada vira a frase "todo o tráfego interno é criptografado" num relatório, e ninguém volta para conferir. Com AllowUnencrypted como única opção, VMs sem suporte e cenários que não criptografam, essa frase quase sempre é otimista.

Se você cuida de um ambiente com requisito de criptografia em trânsito, trate o flow log como a fonte da verdade e o portal como intenção. E, se o tráfego atravessa um [hub com firewall](/posts/azure-firewall-explicit-proxy-vs-udr/), confira o SKU antes de prometer qualquer coisa.

Se o auditor pedir a prova de que o tráfego entre as VMs é criptografado, você mostra um print ou um log?
