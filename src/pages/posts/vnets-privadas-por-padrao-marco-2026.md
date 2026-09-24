---
layout: ../../layouts/PostLayout.astro
title: "VNets privadas por padrão a partir de março de 2026: o que isso quebra e como migrar sem downtime"
category: "Networking"
tag: "networking"
serie: "Série Azure Networking + IA Generativa"
serieNum: 5
serieSlug: "serie-azure-networking-ia"
date: "2 Set 2026"
readTime: "6 min"
description: "Com as versões de API lançadas depois de 31 de março de 2026, VNets novas nascem com sub-redes privadas. O pipeline não dá erro, a VM sobe, e ela simplesmente não sai para a internet. O que mudou, como achar o que depende do comportamento antigo e como migrar sem downtime."
prev:
  title: "Azure Networking [4]: Latência de rede em pipelines RAG"
  slug: "latencia-rede-pipelines-rag-azure"
next:
  title: "Azure Networking [6]: Azure Firewall com Explicit Proxy vs UDR"
  slug: "azure-firewall-explicit-proxy-vs-udr"

---

Já vi acontecer: o pipeline de infraestrutura roda verde, a VNet é criada, a VM sobe, e o script de inicialização trava tentando baixar um pacote. Nenhum erro de deploy. A VM só não tem saída para a internet.

Ninguém mexeu no template. O que mudou foi o comportamento padrão do Azure, e a mudança tem um detalhe que pega muita gente de surpresa: ela depende da versão de API que o seu template usa.

## O que mudou, exatamente

Durante anos, uma VM sem IP público e sem nenhum outro método de saída ainda conseguia acessar a internet. O Azure dava a ela um IP público implícito, que ninguém controlava e que podia mudar. Isso se chama default outbound access.

Com as versões de API lançadas depois de 31 de março de 2026, as sub-redes de VNets novas nascem com a propriedade `defaultOutboundAccess` igual a `false`. São as chamadas sub-redes privadas. Uma VM ali só sai para a internet se você configurar um método explícito.

Três pontos definem quem é afetado:

**VNets existentes não mudam.** VMs antigas e novas dentro delas continuam com o comportamento antigo, a menos que alguém torne a sub-rede privada.

**A versão de API decide.** Template, módulo ou ferramenta que ainda usa uma versão de API anterior continua criando VNets com o comportamento antigo. Por isso o mesmo ambiente pode ter as duas coisas, dependendo de quem criou cada rede. O portal, por sua vez, já cria sub-redes privadas por padrão, o que explica por que uma VNet criada à mão se comporta diferente da criada por um template antigo. Atualizar a versão de API de um módulo de rede, que parece uma mudança inofensiva, é o que costuma trazer a mudança para dentro de casa.

**Nem toda sub-rede é afetada.** Sub-redes delegadas ou gerenciadas, usadas por serviços PaaS, não seguem essa regra.

## O que quebra

O que para de funcionar é tudo que depende de saída para a internet ou para endpoints públicos da Microsoft sem método explícito:

**Ativação e atualização do Windows.** A própria documentação cita os dois como exemplos de serviços que não funcionam numa sub-rede privada sem saída explícita.

**Instalação de pacotes e dependências.** `apt`, `yum`, `pip`, `npm`, imagens de container de registries públicos.

**Chamadas para APIs externas.** Integrações com SaaS, webhooks, serviços de terceiros.

**Rotas com próximo salto `Internet`.** Em sub-rede privada, elas deixam de funcionar.

O que continua funcionando: acesso por Private Endpoint, que não usa a internet, e acesso a contas de Storage na mesma região, que a documentação lista como exceção. Workloads de IA que só falam com Azure OpenAI, AI Search e Storage por Private Endpoint não percebem a mudança.

## Como achar o que depende do comportamento antigo

Antes de migrar qualquer coisa, descubra quem usa default outbound access hoje. O Azure Advisor já faz isso: em Excelência Operacional, as recomendações "Add explicit outbound method to disable default outbound" listam as placas de rede de VMs e de scale sets que ainda usam o IP implícito.

Para ver o estado das sub-redes:

```bash
az network vnet subnet list \
  --resource-group rg-networking \
  --vnet-name vnet-producao \
  --query "[].{sub_rede:name, saida_padrao:defaultOutboundAccess, nat:natGateway.id}" \
  --output table
```

Sub-rede com `saida_padrao` vazio ou `true`, sem NAT Gateway e sem rota para firewall ou NVA é candidata a depender do comportamento antigo, a menos que as VMs tenham IP público ou estejam atrás de um Load Balancer com regras de saída. Cruze com a lista do Advisor antes de mexer.

## Os quatro métodos de saída explícita

**NAT Gateway na sub-rede.** O método que a Microsoft recomenda para a maioria dos cenários. Saída com IPs fixos que você conhece e pode liberar em firewall de parceiro, sem expor nada para entrada.

**Load Balancer Standard com regras de saída.** Faz sentido quando as VMs já estão atrás de um Load Balancer e você quer controlar a saída no mesmo lugar.

**IP público Standard na placa de rede.** Serve para uma VM específica que realmente precisa ser alcançável de fora. Como padrão de saída, expõe mais do que precisa.

**Firewall ou NVA com rota definida pelo usuário.** O desenho comum em hub-and-spoke corporativo: toda saída passa pelo Azure Firewall no hub, com inspeção e log. Se esse já é o seu padrão, a mudança afeta pouco, com uma exceção importante: rotas para service tags com próximo salto `Internet`, muito usadas para pular a inspeção, deixam de funcionar em sub-rede privada.

## Migrando sem downtime

A migração segura adiciona o método explícito antes de tirar o implícito. A ordem que eu uso:

1. **Inventário.** Advisor e a consulta acima, sub-rede por sub-rede.
2. **Método explícito.** Associe o NAT Gateway ou a rota para o firewall. A partir daí, a saída passa a usar o método explícito, que tem precedência sobre o implícito.
3. **Validação.** De dentro de uma VM, confira qual IP a internet enxerga (`curl ifconfig.me`) e se atualizações e pacotes funcionam.
4. **Sub-rede privada.** Só então marque a sub-rede como privada (`az network vnet subnet update ... --default-outbound false`). Isso evita que uma VM nova, criada sem querer fora do padrão, volte a depender do IP implícito. Atenção: a mudança só chega às VMs que já existem depois que elas forem paradas e desalocadas. Até lá elas mantêm o IP implícito, sem usá-lo enquanto o método explícito estiver lá. Programe essa desalocação na próxima janela de manutenção.

O NAT Gateway em Bicep, com a sub-rede já privada. Na sub-rede uso a versão de API 2023-11-01, a mesma do exemplo da documentação; na referência de versões anteriores, a propriedade aparece como definível só na criação da sub-rede:

```bicep
resource pipNat 'Microsoft.Network/publicIPAddresses@2023-09-01' = {
  name: 'pip-nat-producao'
  location: location
  sku: { name: 'Standard' }
  properties: { publicIPAllocationMethod: 'Static' }
}

resource nat 'Microsoft.Network/natGateways@2023-09-01' = {
  name: 'nat-producao'
  location: location
  sku: { name: 'Standard' }
  properties: {
    idleTimeoutInMinutes: 4
    publicIpAddresses: [ { id: pipNat.id } ]
  }
}

resource snetApp 'Microsoft.Network/virtualNetworks/subnets@2023-11-01' = {
  parent: vnet
  name: 'snet-app'
  properties: {
    addressPrefix: '10.1.1.0/24'
    natGateway: { id: nat.id }
    defaultOutboundAccess: false
  }
}
```

## Se você usa Terraform ou Bicep

Declare a saída de forma explícita em todo template de rede, mesmo quando o comportamento padrão ainda te atende. Assim o resultado não muda quando alguém atualizar a versão de API ou do provider.

No Terraform, a associação que liga o NAT Gateway à sub-rede é um recurso separado, e é ela que costuma faltar:

```hcl
resource "azurerm_subnet" "app" {
  name                            = "snet-app"
  resource_group_name             = azurerm_resource_group.rede.name
  virtual_network_name            = azurerm_virtual_network.producao.name
  address_prefixes                = ["10.1.1.0/24"]
  default_outbound_access_enabled = false
}

resource "azurerm_subnet_nat_gateway_association" "app" {
  subnet_id      = azurerm_subnet.app.id
  nat_gateway_id = azurerm_nat_gateway.producao.id
}
```

## O que fica

A mudança está certa do ponto de vista de segurança: saída para a internet tem que ser uma decisão, não um efeito colateral. O risco está em descobrir isso num deploy que passou verde e numa VM que não atualiza.

No seu ambiente, alguém sabe dizer quais VMs ainda saem para a internet por um IP que ninguém configurou?
