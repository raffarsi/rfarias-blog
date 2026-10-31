---
layout: ../../layouts/PostLayout.astro
title: "O peering falhou porque duas VNets usam a mesma faixa: IPAM no Azure Virtual Network Manager"
category: "Networking"
tag: "networking"
date: "03 Nov 2026"
readTime: "8 min"
description: "Sobreposição de endereço só aparece quando você tenta conectar as redes, e aí corrigir custa caro. Como o IPAM do Azure Virtual Network Manager distribui faixas sem conflito, como fechar a porta com Azure Policy e os limites que precisam entrar no planejamento."
---

É um pedido comum para quem cuida de rede: conectar a VNet de um projeto novo ao hub. O peering falha na primeira tentativa, com a mensagem que ninguém gosta de ler: o espaço de endereço se sobrepõe ao de uma rede já conectada.

A VNet já está no ar, com aplicação rodando. As duas redes usam a mesma faixa, e cada uma foi criada por um time diferente, sem que um soubesse do outro.

Nada está quebrado. Só não dá para ligar uma coisa na outra. E, a partir daí, qualquer saída passa por renumerar uma das redes.

## Por que a sobreposição nasce sem ninguém perceber

Endereço IP numa VNet isolada não incomoda ninguém. A rede funciona, as VMs conversam, a aplicação sobe. O conflito só aparece quando alguém tenta conectar essa rede a outra: um peering com o hub, uma VPN com o datacenter, um circuito ExpressRoute.

O Azure não aceita peering entre VNets com faixas que se sobrepõem. A operação simplesmente falha. Com o ambiente local, o problema é o roteamento: se a mesma faixa existe dos dois lados, não há como decidir para onde o pacote vai.

A causa quase sempre é organizacional, não técnica. O controle de endereços mora numa planilha que poucos conhecem, cada time cria a própria rede quando precisa, e a faixa escolhida é a primeira que aparece. Funciona até o dia em que as redes precisam conversar, que é justamente quando mudar o endereço sai mais caro.

## O que o IPAM faz

O IPAM (IP address management) é um recurso do Azure Virtual Network Manager que tira o controle de endereços da planilha e coloca dentro da plataforma. A peça central é o pool de endereços.

**O pool raiz** representa todo o espaço de endereço da organização. **Os pools filhos** são pedaços dele, e podem ser divididos de novo, em até sete níveis. Uma divisão comum é por região e, dentro de cada região, por ambiente.

![Hierarquia de pools do IPAM: pool raiz dividido em pools por região e ambiente, VNets recebendo faixas automaticamente e um static CIDR reservado para o datacenter](/images/posts/ipam-virtual-network-manager-sobreposicao-ip/hierarquia-pools-ipam.svg)

Quando alguém cria uma VNet a partir de um pool, informa só o tamanho, e o IPAM entrega uma faixa livre. Não há escolha manual de endereço, então não há como pegar uma faixa já usada dentro do pool. Quando a VNet é apagada, a faixa volta para o pool.

VNets que já existem podem ser associadas a um pool, e o IPAM passa a contar o espaço delas como ocupado. Um mesmo pool pode atender VNets de regiões diferentes (essa associação entre regiões é feita pela CLI ou pelo PowerShell), e o recurso trabalha com IPv4 e IPv6.

O detalhe que mais importa num ambiente híbrido é o **static CIDR**. Ele reserva dentro do pool uma faixa que o IPAM não enxerga como recurso do Azure: o datacenter, outra nuvem, um hub do Virtual WAN, um Azure VMware Solution. O IPAM só evita sobreposição com o que ele conhece. Se a faixa do datacenter não estiver registrada, ele vai entregá-la a uma VNet nova com toda a tranquilidade.

## Na prática

Com o pool criado, a criação de uma VNet passa a pedir um tamanho em vez de uma faixa. No portal, é uma caixa de seleção na aba de endereços. Na CLI, a alocação vai como parâmetro:

```bash
alocacao='[{
  "numberOfIpAddresses": 256,
  "id": "/subscriptions/<id>/resourceGroups/rg-rede-central/providers/Microsoft.Network/networkManagers/avnm-empresa/ipamPools/pool-brazilsouth-producao"
}]'

az network vnet create \
  --name vnet-app-pagamentos \
  --resource-group rg-app-pagamentos \
  --location brazilsouth \
  --ipam-allocations "$alocacao"
```

Cada VNet pode usar no máximo um pool IPv4 e um pool IPv6.

Para os times usarem os pools sem poder alterá-los, existe o papel **IPAM Pool User**. Ele permite ver o pool e alocar espaço dele, mas não mexer na estrutura. Se o time não enxergar o pool depois da atribuição, a documentação orienta conceder também o **Network Manager Read** no escopo do network manager. Quem cria e administra os pools precisa de **Network Contributor** no network manager.

## Pool sem Policy é sugestão

Aqui está o ponto que separa o IPAM que funciona do IPAM que só aparece em apresentação.

Criar os pools não impede ninguém de criar uma VNet do jeito antigo, digitando a faixa à mão. O próprio guia da Microsoft deixa isso explícito: o Virtual Network Manager não bloqueia sobreposição sozinho na criação ou na alteração de uma VNet.

O que fecha a porta é o Azure Policy. A Microsoft publica um exemplo de definição que nega a criação ou a alteração de qualquer VNet que não tenha alocação de um pool designado. Como o pool só entrega faixas livres, nenhuma VNet com faixa repetida consegue nascer no escopo da política.

Sem essa política, o IPAM vira mais um lugar para consultar, e a planilha continua sendo a fonte da verdade.

## O que precisa entrar no planejamento

**O espaço gerenciado pelo IPAM não pode ser removido.** Hoje não dá para remover de uma VNet ou de uma sub-rede o espaço de endereço que o IPAM gerencia, e também não dá para remover espaço de um pool. Uma divisão mal planejada no começo fica com você. Vale gastar tempo no desenho dos pools antes de associar a primeira VNet.

**A cobrança é por IP ativo, por hora.** O que é cobrado é cada endereço associado a uma placa de rede, numa VNet ligada a um pool. Um pool grande e pouco usado, portanto, não pesa na conta pelo tamanho. Essa cobrança é separada da cobrança do próprio Virtual Network Manager.

**A disponibilidade tem exceções.** O IPAM está disponível onde o Virtual Network Manager está, menos em Chile Central, Jio India West, Malaysia West, Qatar Central, South Africa West e West India. Brazil South está coberta.

## Três erros que eu vejo com frequência

**Criar os pools e esquecer a Policy.** O desenho fica bonito no portal, e a VNet seguinte é criada com 10.0.0.0/16 digitado à mão. Meses depois, o problema da abertura acontece de novo, agora com o IPAM instalado.

**Não registrar o que está fora do Azure.** O datacenter, a faixa da VPN de usuários, o ambiente da outra nuvem. O IPAM protege contra o que conhece, e só.

**Fatiar o espaço pequeno demais.** Pools e VNets do tamanho exato da necessidade de hoje parecem economia. Como o espaço gerenciado não pode ser removido da VNet, a que precisar crescer vai pedir uma faixa nova, e o desenho perde a lógica que tinha no começo.

## O que fica

Sobreposição de IP não é um erro de configuração. É a consequência de muitas decisões pequenas, cada uma tomada por alguém que não tinha como enxergar as outras. O IPAM resolve isso porque tira a escolha da faixa das mãos de quem cria a rede e a coloca num lugar que conhece todas as faixas.

Se você já usa o Virtual Network Manager para as [security admin rules](/posts/azure-virtual-network-manager-security-admin-rules/), o IPAM está no mesmo lugar e segue a mesma lógica: a regra central deixa de depender da memória de cada time.

Quem no seu ambiente consegue dizer agora, sem abrir uma planilha, qual faixa a próxima VNet vai usar?
