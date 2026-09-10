---
layout: ../../layouts/PostLayout.astro
title: "Seu Azure OpenAI está exposto na internet — e você provavelmente sabe"
category: "IA Generativa"
tag: "ia-generativa"
serie: "Série Azure Networking + IA Generativa"
serieNum: 1
serieSlug: "serie-azure-networking-ia"
date: "19 Ago 2026"
readTime: "9 min"
description: "Pipelines de RAG sobem com Azure OpenAI e Azure AI Search em acesso público 'por enquanto' — e o 'por enquanto' nunca acaba. Como eliminar essa exposição com Private Link de ponta a ponta."
next:
  title: "Azure Networking [2] — Hub-and-spoke para IA generativa"
  slug: "hub-and-spoke-ia-generativa-azure"
---

É mais comum do que parece. O pipeline de RAG sobe em produção com Azure OpenAI e Azure AI Search acessíveis via rede pública "só por enquanto, depois a gente fecha". Ninguém mexe depois — o pipeline já está funcionando, a entrega foi feita, e a única linha de defesa vira uma API key ou o Microsoft Entra ID.

Este é o artigo 1 de 20 da série **Azure Networking + IA Generativa**. Aqui mostro exatamente o risco disso e como eliminar a exposição com Private Link de ponta a ponta, sem travar a experiência de desenvolvimento.

## O problema: "temporariamente" vira permanente

Quando um pipeline de RAG sobe para produção, a sequência costuma ser:

1. Azure OpenAI e Azure AI Search criados com acesso público habilitado — mais rápido para testar
2. Pipeline funciona, demonstração aprovada, time comemora
3. Ticket de "fechar o acesso de rede" criado, baixa prioridade
4. Meses depois, o ticket ainda está aberto

Nesse cenário, dois dos serviços mais sensíveis da sua arquitetura ficam acessíveis via internet:

**Azure AI Search** contém todo o conhecimento corporativo indexado — documentos internos, bases de conhecimento, dados proprietários que alimentam o contexto do modelo.

**Azure OpenAI** é o modelo que gera as respostas para o usuário final — qualquer chave de API vazada dá acesso ilimitado ao modelo com a sua quota, sua cobrança.

Dependendo apenas de chave de API como linha de defesa, qualquer rotação de chave mal feita, qualquer vazamento em log ou variável de ambiente exposta, abre uma janela de exposição real.

## A solução: Private Link de ponta a ponta

A arquitetura correta não é complicada — é simplesmente consistente:

**Cada recurso PaaS recebe um Private Endpoint.** Azure OpenAI, Azure AI Search, Azure Document Intelligence, Storage — todos ficam com `publicNetworkAccess: Disabled` e um Private Endpoint dentro de uma subnet dedicada da sua VNet.

**O endpoint fica dentro da sua VNet.** O tráfego entre o agente (Azure AI Foundry / App Service) e os serviços de IA nunca sai para a internet — trafega dentro do backbone da Microsoft.

**O acesso público é desligado no próprio recurso.** Não basta criar o Private Endpoint — é necessário desabilitar o acesso público explicitamente. São duas operações distintas.

### A topologia em uma linha

```bicep
// Desabilitar acesso público — em TODOS os recursos PaaS
resource openAI 'Microsoft.CognitiveServices/accounts@2023-10-01-preview' = {
  name: 'oai-ia-prod'
  location: location
  kind: 'OpenAI'
  properties: {
    publicNetworkAccess: 'Disabled'  // <-- isso aqui
    networkAcls: {
      defaultAction: 'Deny'
    }
  }
}
```

**Subnets dedicadas dentro da VNet:**

```
VNet Hub (10.0.0.0/16)
├── snet-private-endpoints  (10.0.1.0/26)  ← PE do OpenAI, Search, Document Intelligence
└── snet-app-services       (10.0.2.0/26)  ← Azure AI Foundry / App Service / AKS
```

### Private Endpoints para os dois serviços críticos

```bicep
// Private Endpoint para Azure OpenAI
resource peOpenAI 'Microsoft.Network/privateEndpoints@2023-09-01' = {
  name: 'pe-openai'
  location: location
  properties: {
    subnet: { id: subnetPrivateEndpoints.id }
    privateLinkServiceConnections: [{
      name: 'plsc-openai'
      properties: {
        privateLinkServiceId: openAI.id
        groupIds: ['account']
      }
    }]
  }
}

// Private Endpoint para Azure AI Search
resource peSearch 'Microsoft.Network/privateEndpoints@2023-09-01' = {
  name: 'pe-search'
  location: location
  properties: {
    subnet: { id: subnetPrivateEndpoints.id }
    privateLinkServiceConnections: [{
      name: 'plsc-search'
      properties: {
        privateLinkServiceId: aiSearch.id
        groupIds: ['searchService']
      }
    }]
  }
}
```

## Antes × Depois

| | Antes | Depois |
|---|---|---|
| Acesso | Via rede pública | Private Endpoint por recurso |
| Única defesa | API key | Rede + identidade (Entra ID) |
| Tráfego | Pode passar por internet | 100% dentro do backbone |
| Exposição | Direta à internet | Zero exposição pública |
| `publicNetworkAccess` | `Enabled` | `Disabled` |

## O resultado: segurança sem sacrificar o dev

O receio mais comum ao fechar o acesso de rede é travar o time de desenvolvimento — se os serviços só respondem dentro da VNet, como o dev trabalha localmente?

A resposta é que isso não precisa travar o dev:

**Zero exposição pública.** Nenhum dos serviços PaaS responde na internet.

**Tráfego 100% privado.** Todo o tráfego do pipeline trafega dentro do backbone da Microsoft — entre o agente e os serviços, nunca toca a internet pública.

**Experiência de dev preservada.** Para desenvolvimento local, o dev pode usar:
- **Azure VPN Client** conectando ao VPN Gateway do hub — acesso à VNet de qualquer lugar
- **Dev containers com VNet integration** — o container de desenvolvimento roda dentro da própria VNet do spoke de IA
- **Jumpbox / Azure Bastion** — uma VM dentro da VNet para acesso direto durante desenvolvimento

<div class="callout">
<strong>Regra prática:</strong> Nunca suba para produção com <code>publicNetworkAccess: Enabled</code> em Azure OpenAI ou Azure AI Search. Se o pipeline precisou de acesso público para funcionar durante o desenvolvimento, o ticket de fechar a rede deve ser parte da definição de "done" da sprint — não um item de backlog.
</div>

## Conclusão

A exposição de Azure OpenAI e Azure AI Search na internet não é um problema de configuração difícil — é um problema de priorização. A solução técnica tem três passos: criar Private Endpoints, desabilitar `publicNetworkAccess` nos recursos e garantir que o DNS privado resolva corretamente os FQDNs dos serviços.

O terceiro passo — DNS privado — é onde a maioria dos problemas aparecem, e é o tema do próximo artigo da série.

---

*Série **Azure Networking + IA Generativa** — arquitetura de referência, decisões de rede e os erros mais comuns em produção. Publicado às terças e quintas.*
