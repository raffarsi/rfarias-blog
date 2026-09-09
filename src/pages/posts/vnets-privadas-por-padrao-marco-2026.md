---
layout: ../../layouts/PostLayout.astro
title: "VNets privadas por padrão a partir de março de 2026: o que isso quebra e como migrar sem downtime"
category: "Azure"
tag: "azure"
serie: "Série Azure Networking + IA Generativa"
serieNum: 5
serieSlug: "serie-azure-networking-ia"
date: "2 Set 2026"
readTime: "9 min"
description: "A partir de 31 de março de 2026, VNets criadas no Azure nascem privadas por padrão. Se sua automação depende do comportamento antigo, ela vai quebrar. Guia completo de migração sem downtime."
next:
  title: "Azure Firewall com Explicit Proxy: quando faz sentido trocar UDR por proxy"
  slug: "azure-firewall-explicit-proxy-vs-udr"
---

Em março de 2026 o Azure muda o comportamento padrão de Virtual Networks: recursos implantados em VNets novas não terão mais acesso implícito à internet por padrão. Se sua automação, seus pipelines de CI/CD ou seus templates de IaC dependem do comportamento antigo, eles vão quebrar — silenciosamente, na maioria dos casos.

Este é o artigo 5 de 20 da série **Azure Networking + IA Generativa**. Aqui explico exatamente o que muda, o que não é afetado, por que essa mudança é positiva para segurança e como migrar sem causar downtime.

## A mudança

A partir de **31 de março de 2026**, o comportamento padrão para novas Virtual Networks criadas no Azure muda: recursos implantados em VNets sem configuração explícita de saída não terão mais o que a Microsoft chama de *default outbound access* — o acesso implícito à internet via IP público efêmero que o Azure atribuía automaticamente.

É uma mudança de postura de segurança *secure by default*, alinhada ao que o Cloud Adoption Framework (CAF) já recomendava como boa prática — mas que agora deixa de ser recomendação e passa a ser o padrão.

**O que exatamente muda:** antes, uma VM criada em uma subnet sem NAT Gateway, sem Azure Firewall e sem IP público ainda conseguia acessar a internet. O Azure atribuía um IP público efêmero e roteava o tráfego de saída. A partir de março, isso não acontece mais para VNets novas.

## O que quebra

Qualquer recurso que dependa da saída padrão implícita para acessar a internet — sem NAT Gateway, sem Azure Firewall e sem IP público explícito — vai perder a conectividade de saída.

Isso inclui tipicamente:

- **VMs sem IP público e sem NAT Gateway** que fazem chamadas para APIs externas, baixam pacotes de sistemas operacionais ou enviam dados para endpoints fora da VNet
- **Pods em AKS** em clusters onde o outbound type não foi configurado explicitamente (`loadBalancer` ou `userDefinedRouting`)
- **Azure Container Instances** criadas em VNets sem saída explícita configurada
- **Scripts de inicialização (cloud-init, custom script extension)** que baixam dependências da internet durante o provisionamento da VM
- **Pipelines de CI/CD** que provisionam recursos em VNets novas e assumem conectividade de saída disponível imediatamente após a criação

O cenário mais perigoso é o último: um pipeline que cria uma VNet, implanta recursos e tenta validar conectividade — tudo funcionava em testes porque os testes usavam VNets antigas. Na primeira execução após 31 de março, falha.

## O que NÃO é afetado

Importante deixar claro o que a mudança **não** afeta:

**VNets já existentes** antes da data de corte mantêm o comportamento atual — a mudança vale apenas para VNets criadas após 31 de março de 2026 e não é retroativa.

**Recursos atrás de Private Endpoints** não usam saída padrão para serem acessados. O Private Endpoint é tráfego de entrada privado, não saída — não é impactado.

**Ambientes que já usam Azure Firewall, NAT Gateway ou IPs públicos explícitos** para saída não são impactados, porque já não dependem do default outbound access. Quem segue o padrão hub-and-spoke com NAT Gateway ou Firewall central já está preparado.

## Por que isso é bom — mesmo doendo no curto prazo

A saída padrão implícita sempre foi um ponto de confusão em auditorias de segurança. A pergunta clássica: *"esse recurso tem IP público?"* — e a resposta era tecnicamente "não tem um IP público permanente, mas tem acesso à internet via IP efêmero que você não controla e não consegue rastrear facilmente."

Isso tornava difícil bloquear exfiltração de dados por padrão. Um atacante com acesso a uma VM podia extrair dados para qualquer endpoint externo sem que isso fosse visível nas regras de firewall — porque não passava por firewall nenhum.

Com a mudança, **qualquer saída para internet passa a ser uma decisão explícita e auditável** — exatamente o tipo de controle que regulamentações como LGPD, PCI DSS e frameworks de segurança como NIST CSF exigem. Você sabe exatamente por onde o tráfego sai, consegue logar e consegue bloquear seletivamente.

<div class="callout">
<strong>Perspectiva de auditoria:</strong> Do ponto de vista de IT Audit, essa mudança simplifica enormemente a demonstração de conformidade. Em vez de precisar provar que o default outbound access estava sendo controlado por NSG (o que era frágil), você demonstra que não existe saída implícita — qualquer saída tem um recurso explícito associado com logs.
</div>

## Como migrar sem quebrar nada

O processo correto tem três etapas, nesta ordem:

**1. Inventarie o que depende de saída implícita hoje.**

Use o Azure Network Watcher e os logs de fluxo de NSG para identificar quais recursos estão usando saída padrão:

```bash
# Habilitar flow logs no NSG das subnets
az network watcher flow-log create \
  --location brazilsouth \
  --name flowlog-subnet-app \
  --nsg meu-nsg \
  --storage-account meu-storage \
  --enabled true \
  --format JSON \
  --log-version 2

# Consultar no Log Analytics quais IPs de destino são externos
# (fora dos ranges privados RFC 1918)
```

No Log Analytics, execute:

```kql
AzureNetworkAnalytics_CL
| where SubType_s == "FlowLog"
| where DestIP_s !startswith "10." 
    and DestIP_s !startswith "172.16."
    and DestIP_s !startswith "192.168."
| summarize count() by VM_s, DestIP_s, DestPort_d
| order by count_ desc
```

Isso mostra quais VMs estão fazendo saída para internet e para quais destinos — sua lista de dependências.

**2. Escolha a estratégia de saída adequada para cada cenário.**

Não existe uma resposta única — depende do workload:

| Cenário | Estratégia recomendada |
|---------|----------------------|
| VMs que precisam de patches e updates | NAT Gateway na subnet |
| Workloads com requisitos de segurança e inspeção | Azure Firewall como saída centralizada |
| AKS clusters | `outboundType: userDefinedRouting` + UDR para Firewall |
| Recursos que só precisam de saída para endpoints específicos | Service Endpoints ou Private Endpoints |

**3. Provisione a saída explícita antes de criar a VNet ou junto com ela.**

Para NAT Gateway — a opção mais simples para a maioria dos casos:

```bicep
resource natGateway 'Microsoft.Network/natGateways@2023-09-01' = {
  name: 'nat-spoke-ia'
  location: location
  sku: { name: 'Standard' }
  properties: {
    idleTimeoutInMinutes: 4
    publicIpAddresses: [
      { id: publicIpNat.id }
    ]
  }
}

resource subnetApp 'Microsoft.Network/virtualNetworks/subnets@2023-09-01' = {
  name: 'snet-app'
  parent: vnet
  properties: {
    addressPrefix: '10.1.1.0/24'
    natGateway: {
      id: natGateway.id  // Associar NAT Gateway na criação da subnet
    }
  }
}
```

A ordem importa: **crie o NAT Gateway antes ou junto com a subnet** — não depois que os recursos já estão implantados sem saída.

**Para AKS**, defina o outbound type na criação do cluster:

```bash
az aks create \
  --resource-group rg-spoke-ia \
  --name aks-ia \
  --outbound-type userDefinedRouting \
  --vnet-subnet-id /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Network/virtualNetworks/{vnet}/subnets/snet-aks
  # UDR na subnet deve apontar 0.0.0.0/0 para o Azure Firewall antes da criação
```

## Conclusão

Essa mudança é um bom exemplo de como boas práticas de rede deixam de ser "recomendação" e passam a ser "obrigatório por padrão" — o mesmo caminho que o Azure já fez com IPs públicos em VMs (agora cobrados separadamente e não criados por padrão).

Quem já segue o padrão hub-and-spoke com NAT Gateway ou Firewall central não sente o impacto. Quem depende do comportamento implícito — geralmente ambientes criados organicamente sem uma estratégia de rede definida — tem até março de 2026 para ajustar os templates e pipelines.

A janela de 6 meses é suficiente para fazer a migração com calma, testando em ambientes de desenvolvimento e homologação antes de tocar em produção.

---

*Série **Azure Networking + IA Generativa** — arquitetura de referência, decisões de rede e os erros mais comuns em produção. Publicado às terças e quintas.*
