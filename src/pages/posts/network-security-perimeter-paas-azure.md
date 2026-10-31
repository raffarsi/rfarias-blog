---
layout: ../../layouts/PostLayout.astro
title: "Seu PaaS fala com a internet e ninguém controla a saída: Network Security Perimeter no Azure"
category: "Networking"
tag: "networking"
date: "17 Nov 2026"
readTime: "8 min"
description: "Firewall de recurso controla quem entra no Storage ou no Key Vault, mas não para onde o dado sai. Como o Network Security Perimeter cria uma fronteira única para PaaS fora da VNet, por que começar em Transition e as pegadinhas com Private Endpoint e trusted services."
---

A pergunta chega numa auditoria de segurança e parece simples: quais dos seus serviços PaaS conseguem mandar dados para a internet?

O ambiente tem storage accounts, um ou dois Key Vaults, um workspace do Log Analytics. Cada recurso tem o próprio firewall, configurado por pessoas diferentes em épocas diferentes. Uma lista de IPs aqui, outra ali, a opção de serviços confiáveis ligada em alguns e desligada em outros.

Ninguém consegue responder com segurança. Não por descuido, mas porque cada firewall foi pensado para controlar quem entra. Para onde o dado sai, quase ninguém olhou.

## O firewall do recurso cuida da porta da frente

O firewall de um Storage ou de um Key Vault decide quais origens podem chamar o serviço. É controle de entrada. A própria documentação de transição do Network Security Perimeter deixa isso visível: um recurso com acesso público habilitado e sem perímetro tem a entrada governada pelas regras do recurso e a saída simplesmente liberada.

Isso importa porque vários serviços PaaS fazem chamadas para fora. Um workspace do Log Analytics exporta tabelas para um storage account ou um Event Hub, um serviço de busca lê dados de uma conta de armazenamento. Se uma credencial vaza ou alguém configura um destino que não devia, o dado sai pela porta dos fundos, e o firewall de entrada nem fica sabendo.

O segundo problema é de gestão. Dez recursos com dez firewalls são dez listas para revisar, e cada uma diverge um pouco das outras com o tempo.

## O que o perímetro faz

O Network Security Perimeter (NSP) cria uma fronteira lógica em volta de recursos PaaS que ficam fora das VNets. Segundo o Microsoft Learn, o serviço está disponível de forma geral (GA) em todas as regiões públicas do Azure e em algumas regiões do Azure Government.

As peças são poucas. **O perímetro** é o recurso de nível mais alto. **O profile** é um conjunto de regras de acesso, e os recursos com as mesmas necessidades ficam no mesmo profile. **A association** é o que coloca um recurso PaaS dentro do perímetro. **As access rules** abrem exceções.

A lógica, com a association em modo enforced, é negar tudo o que é público por padrão:

- **Dentro do perímetro**, os recursos conversam entre si. A documentação pede managed identity nos recursos para esse tráfego interno.
- **Entrada pública** só passa com regra de inbound, baseada em faixa de IP ou em subscription. Regras por service tag existem, mas estão em preview.
- **Saída pública** só passa com regra de outbound, baseada em FQDN do destino.

![Network Security Perimeter em volta de Storage, Key Vault e Azure Monitor: comunicação interna liberada, entrada de IP ou subscription autorizada, entrada pública bloqueada, saída para FQDN autorizado liberada, saída para outros destinos bloqueada e Private Endpoint passando sem avaliação das regras](/images/posts/network-security-perimeter-paas-azure/perimetro-nsp-paas.svg)

A regra de saída por FQDN é o ponto que eu considero mais valioso. É a primeira vez que dá para dizer, num lugar só, para quais destinos externos um grupo de serviços PaaS pode mandar dados. O resto é negado. É exatamente a resposta que faltava naquela auditoria.

Um detalhe que pega muita gente: tráfego dentro do perímetro e regras de inbound por subscription não aceitam autenticação por SAS token. A requisição é rejeitada com erro de autenticação. Se a aplicação depende de SAS, isso precisa ser resolvido antes.

Quanto aos serviços: Storage, Key Vault, Azure Monitor, Azure AI Search, Event Hubs, Service Bus e Microsoft Foundry aparecem como GA na lista de recursos suportados. SQL Database, Cosmos DB, Event Grid, App Configuration e Azure OpenAI ainda aparecem como preview. Vale conferir a lista antes de desenhar, porque ela muda.

## Private Endpoint não passa pelo perímetro

Essa é a parte que mais gera confusão. O acesso por Private Link não é afetado pelo NSP. A documentação do Key Vault é explícita: tráfego de private endpoint é considerado altamente seguro e não está sujeito às regras do perímetro. Existe até uma categoria de log própria para ele, a NspPrivateInboundAllowed.

Então o NSP não substitui o [Private Endpoint](/posts/private-endpoints-azure/). Eles resolvem problemas diferentes. O Private Endpoint leva o acesso de dentro da VNet para um IP privado. O perímetro governa tudo o que continua passando pela rede pública, nos dois sentidos, e também a comunicação entre os próprios serviços PaaS.

Na comparação entre [Service Endpoint e Private Endpoint](/posts/service-endpoint-ou-private-endpoint-azure/), o NSP entra como a terceira camada. E aqui há um cuidado. A página de conceitos lista o tráfego de service endpoint como não suportado, avisa que ele pode ser negado mesmo com uma regra de inbound liberando 0.0.0.0/0 e recomenda private endpoint para IaaS falando com PaaS. Ao mesmo tempo, a mesma página cita o standard service endpoint, um recurso pago que tem página própria, em que a subnet ganha um IP público como network identifier e o perímetro autoriza esse tráfego por regra de IP. A documentação não diz com todas as letras que a limitação vale só para o modelo clássico. Se o seu desenho depende de service endpoint, teste antes de virar para enforced.

## Comece em Transition, não em Enforced

Colocar um recurso em produção direto no modo enforced é pedir incidente. O NSP tem dois modos de acesso na association:

**Transition** (antes chamado de Learning) é o padrão. As regras do perímetro são avaliadas primeiro. Quando nenhuma regra casa, a avaliação cai para o firewall do próprio recurso, que pode liberar com as configurações que já existiam.

**Enforced** precisa ser ligado pelo administrador. Nesse modo, o recurso obedece somente às regras do perímetro.

O valor do Transition está nos logs. Com diagnostic settings habilitado no perímetro, cada acesso é registrado dizendo se foi liberado pela regra do perímetro (NspPublicInboundPerimeterRulesAllowed) ou se só passou porque o firewall do recurso permitiu (NspPublicInboundResourceRulesAllowed). Essa segunda categoria é a sua lista de regras que ainda faltam. Quando ela fica vazia por um período que faça sentido para o seu ciclo de negócio, o enforced deixa de ser um salto no escuro.

A própria CLI ainda aceita só Audit, Enforced e Learning, sem o nome novo do modo:

```bash
az network perimeter association create \
    --name network-perimeter-association \
    --perimeter-name network-security-perimeter \
    --resource-group resource-group \
    --access-mode Learning \
    --private-link-resource "{id:<PaaSArmId>}" \
    --profile "{id:<networkSecurityPerimeterProfileId>}"

az network perimeter profile access-rule create \
    --name access-rule \
    --profile-name network-perimeter-profile \
    --perimeter-name network-security-perimeter \
    --resource-group resource-group \
    --address-prefixes "[192.0.2.0/24]"
```

Para recursos novos, existe ainda o valor SecuredByPerimeter na propriedade publicNetworkAccess. Ele cria o recurso já trancado, mesmo antes de qualquer association, e só deixa passar Private Link se estiver configurado.

## As pegadinhas antes do enforced

**Trusted services deixam de funcionar.** No Key Vault, desabilitar o acesso público ainda mantém a exceção de serviços confiáveis da Microsoft. Com SecuredByPerimeter, essa exceção é sobrescrita, e mesmo os serviços confiáveis são bloqueados se não houver uma regra de perímetro que os admita. No modo enforced, o trusted access não é suportado. Se algum serviço do ambiente depende dessa exceção, ele para.

**Azure Backup e storage account no perímetro não combinam.** A documentação diz que o Azure Backup não é suportado para storage accounts com NSP e recomenda não associar a conta se houver backup habilitado ou planejado.

**Workspace com Microsoft Sentinel fica fora.** O NSP não é suportado em workspaces do Log Analytics habilitados para o Sentinel, e as analytic rules são desabilitadas automaticamente se o perímetro for ligado.

**Sair da association também tem efeito.** Removida a association, o controle volta para o firewall do recurso. Se o recurso estiver com SecuredByPerimeter, ele fica trancado.

**Perímetros separados precisam de link.** Quando um recurso de um perímetro precisa falar com outro perímetro, existe o perimeter link, que cria as regras de entrada e saída dos dois lados automaticamente. O recurso ainda está em **preview**, exige managed identity e suporta, por enquanto, só alguns serviços, como Storage, Key Vault, SQL Database, Cosmos DB, Service Bus e Azure Monitor.

## O que fica

Na minha leitura, o NSP muda a pergunta que a gente faz sobre PaaS. Durante anos a discussão foi quem consegue chegar no serviço. O perímetro obriga a responder também para onde o serviço consegue mandar dados, e coloca essa resposta num lugar só, com log de cada tentativa.

Ele não substitui Private Endpoint nem identidade. Ele fecha a parte pública que sobra depois deles. E o caminho seguro é sempre o mesmo: associar em Transition, ler os logs, escrever as regras que faltam e só então virar para Enforced.

Se o seu Storage mandasse dados para um destino externo hoje, qual controle perceberia?
