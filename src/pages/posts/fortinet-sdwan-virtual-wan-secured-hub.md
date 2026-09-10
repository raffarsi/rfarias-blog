---
layout: ../../layouts/PostLayout.astro
title: "Secured Hub nativa da Microsoft vs Fortinet SD-WAN no Virtual WAN: a migração não precisa ser tudo ou nada"
category: "Networking"
tag: "networking"
serie: "Série Azure Networking + IA Generativa"
serieNum: 7
serieSlug: "serie-azure-networking-ia"
date: "10 Set 2026"
readTime: "11 min"
description: "Você já paga pelo Fortinet SD-WAN. A Secured Hub nativa do Azure já faz metade do que você paga por ela. Vale migrar tudo? A migração não precisa ser tudo ou nada."
prev:
  title: "Azure Networking [6] — Azure Firewall com Explicit Proxy vs UDR"
  slug: "azure-firewall-explicit-proxy-vs-udr"
---

Você já paga pelo Fortinet SD-WAN. A Secured Hub nativa do Azure — com Azure Firewall Premium integrado ao Virtual WAN — já faz boa parte do que você paga por ela. Vale migrar tudo?

A resposta que a maioria das arquiteturas corporativas precisa ouvir: **não precisa ser tudo ou nada**. E entender por quê muda completamente a conversa sobre custo e complexidade operacional.

Este é o artigo 7 de 20 da série **Azure Networking + IA Generativa**.

## O contexto: por que essa comparação importa agora

O Azure Virtual WAN com Secured Hub (Azure Firewall integrado) evoluiu significativamente nos últimos dois anos. Muitas organizações que adotaram Fortinet SD-WAN como NVA (Network Virtual Appliance) no hub fizeram essa escolha quando o Virtual WAN ainda não oferecia o nível de controle de política que o Fortinet proporcionava.

Em 2026, o cenário mudou. A Secured Hub tem inspeção TLS, IDPS, Web Categories e URL Filtering — funcionalidades que antes justificavam o Fortinet exclusivamente. A questão real não é mais "qual é melhor", mas **onde cada um agrega valor único** na sua arquitetura.

## O que cada um faz bem

### Secured Hub (Azure Firewall Premium + Virtual WAN)

**Pontos fortes:**

- **Integração nativa com o ecossistema Azure** — sem overhead de gerenciamento de uma NVA separada. Políticas de roteamento, Private Endpoints, DNS Resolver e o Firewall estão no mesmo plano de controle
- **Escalabilidade automática** — o Azure Firewall escala horizontalmente sem intervenção. Sem dimensionamento manual de instâncias de NVA
- **Custo previsível** — modelo de instância + processamento de dados, sem licenças por throughput ou por feature
- **Menor latência para workloads de IA** — tráfego entre spokes e serviços PaaS (Azure OpenAI, AI Search) passa pelo Firewall sem sair do backbone Microsoft

**Limitações:**
- Sem SD-WAN nativo — zero-touch provisioning de branches, application-aware routing e link quality monitoring não existem
- Políticas de QoS para tráfego de voz e vídeo mais limitadas
- Sem DEM (Digital Experience Monitoring) integrado

### Fortinet SD-WAN como NVA no Virtual WAN

**Pontos fortes:**

- **SD-WAN completo** — application steering, link health monitoring (latência, jitter, perda de pacote por aplicação), zero-touch provisioning de branches
- **Consistência de política on-premises e cloud** — a mesma plataforma FortiManager gerencia firewalls físicos em filiais e a NVA no hub. Para empresas com dezenas de filiais Fortinet, isso é significativo
- **FortiGuard Intelligence** — threat feeds proprietários com atualizações mais frequentes que o Azure Firewall Threat Intelligence
- **Casos edge de deep inspection** — cenários onde a inspeção de protocolos industriais (OT/ICS) ou customização avançada de assinaturas é necessária

**Limitações:**
- Complexidade operacional: você gerencia a NVA (patching, sizing, HA) além do Virtual WAN
- Custo de licenciamento adicional sobre o custo do Virtual WAN
- Latência adicional para tráfego que precisa passar pela NVA antes de chegar a serviços Azure nativos

## A comparação lado a lado

| Capacidade | Secured Hub | Fortinet NVA |
|-----------|-------------|--------------|
| Inspeção L7 (HTTP/HTTPS) | ✅ Azure Firewall Premium | ✅ FortiGate |
| TLS Inspection | ✅ | ✅ |
| IDPS | ✅ (Microsoft signatures) | ✅ (FortiGuard signatures) |
| Web Categories | ✅ | ✅ |
| SD-WAN / Application Steering | ❌ | ✅ |
| Zero-touch branch provisioning | ❌ | ✅ |
| Link quality monitoring | ❌ | ✅ |
| Gestão centralizada com on-prem | Parcial (Firewall Manager) | ✅ (FortiManager unificado) |
| Integração nativa Azure PaaS | ✅ Nativa | Overhead adicional |
| Escalabilidade automática | ✅ | Manual / VMSS |
| Custo de licenciamento | Incluído no Azure Firewall | Adicional |

## Topologias de coexistência — a migração não é tudo ou nada

### Topologia 1: Secured Hub para cloud, Fortinet para branches

A divisão mais comum e que faz mais sentido para a maioria:

```
Filiais com Fortinet SD-WAN
  ↓ SD-WAN overlay (aplicação-aware)
Fortinet Hub On-Premises (FortiGate)
  ↓ ExpressRoute / VPN
Azure Virtual WAN Hub
  └── Azure Firewall Premium (Secured Hub)
       ├── Spoke IA (Azure AI Foundry, OpenAI)
       ├── Spoke App (workloads corporativos)
       └── Spoke Data (bancos de dados, Storage)
```

**Por que funciona:** o Fortinet continua gerenciando o que faz melhor — SD-WAN entre filiais, QoS para voz/vídeo, zero-touch provisioning. O Azure Firewall cuida do tráfego dentro do Azure e da saída controlada para internet dos workloads cloud.

### Topologia 2: Fortinet NVA no hub do Virtual WAN + Secured Hub em spokes críticos

Para organizações que precisam de consistência de política FortiManager em todo o stack:

```bicep
// Hub com Fortinet NVA
resource vwanHub 'Microsoft.Network/virtualHubs@2023-09-01' = {
  name: 'hub-corporativo'
  properties: {
    virtualWan: { id: vwan.id }
    addressPrefix: '10.0.0.0/24'
    // NVA Fortinet provisionada via Azure Marketplace
    // Roteamento configurado via VirtualHubRouteTableV2
  }
}

// Spoke de IA com Private Endpoints — tráfego não passa pela NVA
resource spokeIA 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: 'vnet-spoke-ia'
  properties: {
    addressSpace: { addressPrefixes: ['10.1.0.0/16'] }
    // Peering com o hub via Virtual WAN
    // Private Endpoints do OpenAI e AI Search ficam aqui
    // Tráfego IA → OpenAI é privado, não passa pela NVA
  }
}
```

### Topologia 3: migração gradual com coexistência temporária

Para quem quer migrar do Fortinet para Secured Hub sem big bang:

```
Fase 1 (atual): Fortinet NVA no hub → inspeção de todo o tráfego
Fase 2: Secured Hub paralelo → tráfego de spokes de IA vai direto pelo Secured Hub
Fase 3: migração das políticas de aplicação para Azure Firewall Policy
Fase 4: descomissionamento da NVA Fortinet no hub Azure
        (mantendo Fortinet nas filiais on-premises)
```

## Quando manter o Fortinet no hub Azure

Mantenha o Fortinet como NVA no hub do Virtual WAN quando:

- **Sua equipe de rede gerencia FortiManager para 20+ filiais** e a consistência operacional de ter a mesma ferramenta no Azure é um requisito real, não uma preferência
- **Você tem tráfego OT/ICS** que requer inspeção de protocolos industriais que o Azure Firewall não suporta
- **SLA de suporte Fortinet** cobre requisitos regulatórios que o suporte Microsoft não atende para o seu setor

## Quando migrar para Secured Hub

Migre quando:

- **Seus branches já não são o foco** — a maioria do tráfego é cloud-to-cloud ou usuário → cloud, não filial → filial
- **Workloads de IA generativa são a prioridade** — o overhead da NVA adiciona latência desnecessária para tráfego que poderia ir direto pelo backbone Microsoft para Azure OpenAI e AI Search
- **Custo de licenciamento e operação da NVA** supera o valor incremental das features SD-WAN que você realmente usa

<div class="callout">
<strong>O custo real da NVA:</strong> Além do licenciamento Fortinet, considere: horas de engenharia para sizing e patching, custo de VMs para HA (mínimo 2 instâncias), e o overhead de latência para tráfego que passa pela NVA antes de chegar a serviços Azure nativos. Em ambientes onde 80% do tráfego é cloud-native, esse custo raramente se paga.
</div>

## Conclusão

A Secured Hub nativa do Azure chegou em um ponto onde cobre a maioria dos casos de uso de inspeção de tráfego cloud sem a complexidade operacional de uma NVA. O Fortinet SD-WAN continua sendo a melhor escolha para o problema que ele foi feito para resolver: conectividade inteligente entre filiais com visibilidade de qualidade de link por aplicação.

A arquitetura que faz mais sentido para a maioria das empresas em 2026 é a coexistência: **Fortinet gerenciando branches e SD-WAN on-premises, Secured Hub gerenciando o perímetro cloud**. Não é rendição de um para o outro — é cada ferramenta no problema certo.

---

*Série **Azure Networking + IA Generativa** — arquitetura de referência, decisões de rede e os erros mais comuns em produção. Publicado às terças e quintas.*
