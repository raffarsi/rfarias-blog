---
layout: ../../layouts/PostLayout.astro
title: "Private Link Service: entregar uma porta ao parceiro, não a sua rede inteira"
category: "Networking"
tag: "networking"
date: "13 Out 2026"
readTime: "8 min"
description: "Quando outra rede precisa de um único serviço seu, peering e VPN entregam acesso demais e brigam com faixas de IP sobrepostas. Como comparar as opções, como o Azure Private Link Service funciona por dentro e como montá-lo com Azure CLI."
---

Dois parceiros precisavam integrar sistemas. Um deles tinha uma API interna, atrás de um load balancer, e o outro só precisava chamar essa API na porta 443. A primeira proposta que apareceu na reunião foi um peering entre as VNets. Durou até alguém abrir o plano de endereçamento: as duas redes usavam 10.0.0.0/16. E, mesmo que não usassem, o peering entregaria uma rede inteira para quem precisava de uma porta só.

Essa situação se repete sempre que um time de plataforma, um fornecedor ou uma empresa parceira precisa consumir um serviço seu. A pergunta certa não é "como ligo as duas redes", e sim "qual é o menor pedaço que eu preciso expor".

## As quatro formas de entregar um serviço interno

**VNet peering.** Liga as duas redes como se fossem uma só. A documentação é direta: recursos em qualquer uma das VNets podem se conectar diretamente aos recursos da outra. E as VNets precisam ter espaços de endereço sem sobreposição. O controle de acesso fica todo em NSG, dos dois lados.

**VPN ou ExpressRoute entre as partes.** Cria roteamento entre ambientes. Também é conectividade de rede, não de serviço, e sobreposição de IP exige renumerar ou usar NAT no gateway. O NAT do VPN Gateway existe justamente para conectar redes com endereços sobrepostos, mas só em conexões IPsec site a site (cross-premises) e a partir do SKU VpnGw2; conexões VNet-to-VNet não são suportadas. Some a isso a coordenação de rotas, túneis e janelas de manutenção entre duas organizações.

**Exposição pública com firewall ou WAF.** O serviço ganha um IP público, protegido por lista de IPs de origem, WAF e autenticação. Não há conflito de endereços, mas o serviço passa a existir na internet, e a lista de IPs de origem do parceiro vira um item de manutenção eterno.

**Private Link Service.** O parceiro cria um private endpoint na rede dele, que recebe um IP privado daquela rede, e esse endpoint aponta para um único frontend do seu load balancer. Não há roteamento entre as redes.

## A comparação que eu faço antes de decidir

| Critério | VNet peering | VPN / ExpressRoute | Pública com WAF | Private Link Service |
|---|---|---|---|---|
| O que é exposto | A rede inteira | As faixas roteadas | O serviço, na internet | Um frontend do load balancer |
| IPs sobrepostos | Não suporta | Exige NAT ou renumerar | Indiferente | Suporta |
| Quem inicia a conexão | Os dois lados | Os dois lados | O cliente | Só o consumidor |
| Esforço operacional | NSG dos dois lados | Túneis, rotas e acordos entre as partes | Listas de IP, WAF e certificados | Aprovar conexões e cuidar do NAT |

A linha da direção de conexão é a que mais pesa para mim. Na documentação do private endpoint, as conexões só podem ser iniciadas pelos clientes que se conectam ao endpoint; o provedor do serviço não tem configuração de roteamento para abrir conexões para dentro da rede do consumidor. Para uma integração entre empresas, isso fecha um caminho que nenhum dos dois lados precisava ter aberto.

Peering continua sendo a escolha certa entre redes da mesma organização que precisam conversar de forma ampla, como um hub e seus spokes. Para entregar um serviço, eu começo pelo Private Link Service e só saio dele se houver motivo.

## Como funciona por dentro

O provedor coloca a aplicação atrás de um Standard Load Balancer, normalmente interno, e cria o Private Link Service apontando para um frontend desse load balancer. O Basic Load Balancer não é suportado, e o backend pool precisa ser configurado por NIC, não por endereço IP. O Private Link Service fica na mesma região da VNet e do load balancer.

Na criação, o Azure gera um **alias**, um nome globalmente único no formato prefixo, GUID e o sufixo `região.azure.privatelinkservice`. O provedor compartilha o alias, ou o resource ID, por fora do Azure. O consumidor cria o private endpoint apontando para ele e, se a assinatura dele não estiver na lista de aprovação automática, a conexão entra como pendente até o provedor aprovar. Só conexões aprovadas trafegam. Um mesmo serviço aceita private endpoints de VNets, assinaturas e tenants diferentes.

A peça que resolve a sobreposição de IP é o **NAT**. O Private Link Service usa IPs de uma sub-rede do provedor, e o tráfego do consumidor chega ao backend com um desses IPs como origem. A documentação recomenda ter pelo menos oito endereços livres nessa sub-rede. O FAQ responde a dúvida da abertura sem rodeio: o provedor não precisa garantir que os clientes tenham espaço de endereço diferente do dele.

Há restrições que entram no desenho desde o início: só IPv4, só TCP e UDP, e um idle timeout de cerca de cinco minutos, o que obriga a aplicação a usar TCP keepalive abaixo disso.

## A consequência do NAT: quem está do outro lado?

Como todo pacote chega com o IP de NAT, a aplicação e o NSG do backend deixam de enxergar o IP real do consumidor. Na prática, a regra do NSG passa a liberar a sub-rede de NAT, e o log da aplicação registra sempre os mesmos poucos endereços.

Quando a origem importa, a saída é o **TCP Proxy Protocol v2**, habilitado com `--enable-proxy-protocol true`. O cabeçalho passa a trazer o IP de origem do consumidor e o LinkID do private endpoint, que corresponde à propriedade `linkIdentifier` da conexão. Como consumidores podem ter IPs sobrepostos, é a combinação dos dois que identifica quem é quem.

O cuidado é que isso não é transparente. A aplicação atrás do load balancer precisa interpretar o cabeçalho, e a requisição falha nos dois sentidos: com o protocolo ligado e a aplicação sem suporte, ou com a aplicação esperando o cabeçalho e o protocolo desligado. Os health probes também passam a receber o cabeçalho. E se dois Private Link Services compartilham o mesmo load balancer ou backend pool, os dois precisam ter a opção ligada, ou os probes falham.

## Visibilidade e aprovação

A **visibilidade** controla quem consegue enxergar o serviço, do mais restrito ao mais aberto: somente quem tem permissão RBAC, uma lista de assinaturas confiáveis, ou qualquer um que tenha o alias. Para parceiros em outro tenant, eu uso a lista de assinaturas.

A **aprovação automática** é um subconjunto dessa lista. Assinaturas que estão nela são aprovadas na hora; as que estão só na visibilidade geram uma conexão pendente para o provedor decidir. Cada lista aceita até 100 assinaturas.

## Montando com Azure CLI

Do lado do provedor, a sub-rede que fornece os IPs de NAT precisa ter a network policy de Private Link Service desabilitada. O portal faz isso sozinho; a CLI, não.

```bash
az network vnet subnet update \
  --resource-group rg-servicos-parceiros \
  --vnet-name vnet-servicos \
  --name snet-pls-nat \
  --private-link-service-network-policies Disabled

az network private-link-service create \
  --resource-group rg-servicos-parceiros \
  --name pls-api-pedidos \
  --location brazilsouth \
  --vnet-name vnet-servicos \
  --subnet snet-pls-nat \
  --lb-name lbi-api-pedidos \
  --lb-frontend-ip-configs fe-api-pedidos \
  --visibility "$SUB_PARCEIRO_A" "$SUB_PARCEIRO_B" \
  --auto-approval "$SUB_PARCEIRO_A"

az network private-link-service show \
  --resource-group rg-servicos-parceiros \
  --name pls-api-pedidos \
  --query alias --output tsv
```

Do lado do consumidor, que não tem permissão na assinatura do provedor, o private endpoint é criado com pedido manual, usando o alias recebido:

```bash
az network private-endpoint create \
  --resource-group rg-integracao \
  --name pe-api-pedidos \
  --vnet-name vnet-integracao \
  --subnet snet-endpoints \
  --private-connection-resource-id "$ALIAS_DO_PROVEDOR" \
  --connection-name conn-api-pedidos \
  --manual-request true \
  --request-message "Integração de pedidos, time de plataforma"
```

O parceiro B, fora da aprovação automática, fica pendente. O provedor aprova pelo nome da conexão, listado em `privateEndpointConnections`:

```bash
az network private-link-service connection update \
  --resource-group rg-servicos-parceiros \
  --service-name pls-api-pedidos \
  --name "$NOME_DA_CONEXAO" \
  --connection-status Approved \
  --description "Aprovado após validação do contrato"
```

## Além do Standard Load Balancer

**Application Gateway com Private Link.** Para HTTP e HTTPS, o Application Gateway aceita private endpoints de outras VNets, assinaturas e tenants, com todos os recursos de camada 7. Aqui o IP e a porta de origem do cliente são preservados, e o gateway adiciona o cabeçalho `X-Azure-PrivateEndpoint-ID` com o LinkID. A diferença prática: não há alias, a conexão é feita pelo resource ID, e a sub-rede da configuração de Private Link não pode ser a sub-rede do gateway.

**Private Link Service Direct Connect.** Aponta o serviço para qualquer IP privado roteável, sem load balancer. Está em preview público, em regiões selecionadas, exige no mínimo duas configurações de IP e ainda restringe private endpoint, serviço e cliente à mesma região. Brazil South não está na lista de regiões do preview. Eu acompanharia, mas não colocaria uma integração de produção em cima dele hoje.

## Limites que entram no desenho

Cada Standard Load Balancer aceita até oito Private Link Services, cada um ligado a uma configuração de IP de frontend diferente. Cada serviço aceita até oito IPs de NAT e até 1.000 private endpoints, e a assinatura comporta até 800 serviços. Cada IP de NAT oferece 64 mil portas TCP por VM do backend; para escalar conexões, adicione IPs de NAT ou VMs.

## O que fica

Peering e VPN resolvem conectividade entre redes. Quando a necessidade é consumir um serviço, eles resolvem o problema errado e deixam uma superfície de acesso que ninguém vai revisar depois. O Private Link Service inverte a conversa: o provedor decide exatamente qual frontend expõe e quem pode se conectar, o consumidor enxerga um IP da própria rede, e a sobreposição de endereços deixa de ser assunto de reunião. O custo real está no NAT, e é ele que precisa ser discutido com o time da aplicação antes, não depois.

Quando outro time ou parceiro precisa de um serviço seu, o que você entrega hoje: uma porta ou uma rede inteira?
