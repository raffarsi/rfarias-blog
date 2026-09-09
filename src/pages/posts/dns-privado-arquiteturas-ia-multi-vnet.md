---
layout: ../../layouts/PostLayout.astro
title: "DNS privado e resolução de nomes em arquiteturas de IA multi-VNet: os erros mais comuns"
category: "Azure"
tag: "azure"
serie: "Série Azure Networking + IA Generativa"
serieNum: 3
serieSlug: "serie-azure-networking-ia"
date: "26 Ago 2026"
readTime: "10 min"
description: "O Private Endpoint está configurado certo. O recurso responde no telnet. E mesmo assim a aplicação não resolve o nome. Os 4 erros de DNS que fazem um Private Endpoint 'configurado certo' simplesmente não funcionar."
prev:
  title: "Azure Networking [2] — Hub-and-spoke para IA generativa"
  slug: "hub-and-spoke-ia-generativa-azure"
next:
  title: "Azure Networking [4] — Latência de rede em pipelines RAG"
  slug: "latencia-rede-pipelines-rag-azure"
---

O Private Endpoint está configurado. O `telnet` na porta 443 do IP privado funciona. O agente tenta conectar — e falha com `Name or service not known`. Você já viu isso?

Na grande maioria dos incidentes de "Private Endpoint configurado mas o serviço não conecta", a causa raiz não é rede — é DNS. O Private Endpoint cria um IP privado dentro da sua subnet, mas se o cliente que está chamando o Azure OpenAI ou o Azure AI Search ainda resolve o FQDN público, ele vai tentar acessar o IP público — que agora está bloqueado porque você desabilitou `publicNetworkAccess`.

Este é o artigo 3 de 20 da série **Azure Networking + IA Generativa**. Aqui mapeio os 4 erros de DNS que fazem um Private Endpoint "configurado certo" simplesmente não funcionar.

## Por que DNS é o vilão silencioso

Quando você cria um Private Endpoint para o Azure OpenAI, o Azure automaticamente cria um registro DNS privado no formato:

```
oai-ia-prod.openai.azure.com          → CNAME → oai-ia-prod.privatelink.openai.azure.com
oai-ia-prod.privatelink.openai.azure.com → A    → 10.1.2.4  (seu IP privado)
```

Para que a aplicação resolva o IP privado em vez do público, ela precisa usar um servidor DNS que conheça a Private DNS Zone `privatelink.openai.azure.com` — e essa zona precisa estar vinculada à VNet de onde a aplicação está chamando.

Se esse encadeamento não estiver completo, a aplicação resolve o FQDN público (`oai-ia-prod.openai.azure.com → 20.x.x.x`) e tenta conectar a um IP que está bloqueado.

## Erro 1: Private DNS Zone vinculada só à VNet errada

Cada Private Endpoint precisa de um registro numa Private DNS Zone específica (por exemplo, `privatelink.openai.azure.com`), e essa zona precisa estar **vinculada a todas as VNets** de onde o serviço será acessado.

O erro mais comum em arquiteturas multi-VNet: a zona é criada e vinculada apenas à VNet onde o Private Endpoint foi provisionado — mas não aos spokes que precisam resolver o nome.

```bicep
// ERRADO: vinculando apenas à VNet onde o PE está
resource dnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  name: 'link-vnet-hub'
  parent: privateDnsZone
  location: 'global'
  properties: {
    virtualNetwork: { id: vnetHub.id }
    registrationEnabled: false
  }
}

// CORRETO: vincular também aos spokes que precisam resolver
resource dnsLinkSpokeIA 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  name: 'link-spoke-ia-financeiro'
  parent: privateDnsZone
  location: 'global'
  properties: {
    virtualNetwork: { id: vnetSpokeIAFinanceiro.id }
    registrationEnabled: false
  }
}
```

Em arquiteturas hub-and-spoke com muitos spokes, gerenciar vínculos individuais por zona e por spoke escala mal. A solução correta é centralizar a resolução no hub com um **Azure DNS Private Resolver**.

## Erro 2: usar o Azure DNS padrão em vez de um Private DNS Resolver no hub

Se cada spoke aponta para o DNS padrão do Azure (168.63.129.16) sem um encaminhamento central, cargas de trabalho on-premises — que apontam para servidores DNS internos — nunca vão resolver os nomes dos Private Endpoints no Azure.

A arquitetura correta centraliza a resolução DNS no hub:

```
On-premises DNS ──forward──> Azure DNS Private Resolver (hub)
                               ├── Regra: *.privatelink.openai.azure.com → Azure DNS
                               ├── Regra: *.privatelink.search.windows.net → Azure DNS
                               └── Default: → resolver on-premises ou Azure DNS público
```

```bicep
// Azure DNS Private Resolver no hub
resource dnsResolver 'Microsoft.Network/dnsResolvers@2022-07-01' = {
  name: 'resolver-hub'
  location: location
  properties: {
    virtualNetwork: { id: vnetHub.id }
  }
}

// Inbound endpoint — recebe queries de on-premises
resource inboundEndpoint 'Microsoft.Network/dnsResolvers/inboundEndpoints@2022-07-01' = {
  name: 'inbound'
  parent: dnsResolver
  location: location
  properties: {
    ipConfigurations: [{
      privateIpAllocationMethod: 'Dynamic'
      subnet: { id: subnetDnsInbound.id }
    }]
  }
}

// Forwarding ruleset para encaminhar queries de privatelink
resource forwardingRuleset 'Microsoft.Network/dnsForwardingRulesets@2022-07-01' = {
  name: 'frs-hub'
  location: location
  properties: {
    dnsResolvers: [{ id: dnsResolver.id }]
  }
}
```

## Erro 3: conflito entre zona pública e zona privada — o famoso split-brain DNS

Ao criar a Private DNS Zone, o Azure automaticamente adiciona um registro CNAME no domínio público apontando para o sufixo `privatelink`. O problema aparece quando alguém, sem saber disso, cria manualmente um registro A para o mesmo nome dentro da zona privada com um IP diferente.

Resultado: clientes dentro da VNet resolvem um IP inesperado, enquanto clientes externos resolvem outro. O sistema "funciona" de formas diferentes dependendo de onde a chamada vem — o diagnóstico fica confuso porque a conectividade parece intermitente.

Para verificar se você tem um split-brain DNS:

```bash
# Testar de dentro da VNet
nslookup oai-ia-prod.openai.azure.com 168.63.129.16
# Deve retornar o IP privado (10.x.x.x)

# Testar de fora da VNet (máquina local, por exemplo)
nslookup oai-ia-prod.openai.azure.com 8.8.8.8
# Deve retornar o IP público (20.x.x.x)

# Se os dois retornam o mesmo IP privado, você tem um problema
# Se retornam IPs diferentes como esperado, está correto
```

<div class="callout">
<strong>Regra de ouro:</strong> Nunca crie registros A manuais dentro de Private DNS Zones de serviços PaaS. Deixe o Azure criar automaticamente durante o provisionamento do Private Endpoint. Registros manuais criam conflitos silenciosos difíceis de diagnosticar.
</div>

## Erro 4: cache de DNS do lado do cliente/agente

Aplicações .NET, Python e Node.js frequentemente fazem cache agressivo de resolução DNS dentro do próprio processo — o runtime guarda a resolução por horas ou indefinidamente, ignorando o TTL do servidor.

Isso significa que, mesmo depois de corrigir a zona privada, um agente do Azure AI Foundry que já está em execução pode continuar tentando conectar ao IP antigo (público, bloqueado) por horas — até ser reiniciado.

Em pipelines de CI/CD, sempre inclua um passo de **health check pós-deploy** que force uma nova resolução, e documente para o time que problemas de DNS após mudanças de rede geralmente exigem restart dos pods ou da aplicação:

```yaml
# Exemplo: health check pós-deploy no GitHub Actions
- name: Verify DNS resolution after deploy
  run: |
    kubectl rollout restart deployment/ia-agent -n ia-prod
    kubectl rollout status deployment/ia-agent -n ia-prod --timeout=5m
    # Testar resolução do nome privado
    kubectl exec -n ia-prod deployment/ia-agent -- \
      nslookup oai-ia-prod.openai.azure.com
```

## Conclusão

Em arquiteturas de IA multi-VNet, o desenho de rede raramente falha pela parte de roteamento — falha pela parte de nomes. Private Endpoints ficam prontos em minutos; DNS privado configurado corretamente, versionado em IaC e testado em todos os spokes é o que leva mais tempo e é mais frágil.

Tratar o DNS privado como um componente de arquitetura de primeira classe — documentado, versionado em IaC com dono claro e verificado em pipeline — evita a maioria dos incidentes pós-deploy que aparecem como "problema de rede" mas são, na verdade, problema de resolução de nomes.

---

*Série **Azure Networking + IA Generativa** — arquitetura de referência, decisões de rede e os erros mais comuns em produção. Publicado às terças e quintas.*
