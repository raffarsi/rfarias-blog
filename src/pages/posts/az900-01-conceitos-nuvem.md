---
layout: ../../layouts/PostLayout.astro
title: "AZ-900 na prática [1] — Conceitos fundamentais de Cloud Computing"
category: "Azure"
tag: "azure"
serie: "AZ-900 na prática"
serieSlug: "az900"
serieNum: 1
date: "3 Mar 2026"
readTime: "8 min"
description: "IaaS, PaaS e SaaS explicados com exemplos reais. O ponto de partida para qualquer certificação Azure."
next:
  title: "AZ-900 [2] — Arquitetura Azure"
  slug: "az900-02-arquitetura-azure"

---

Cloud Computing transformou a forma como empresas consomem tecnologia. Para o AZ-900 — e para qualquer conversa séria sobre Azure — entender os modelos de serviço e implantação é o ponto de partida.

## Modelos de implantação

**Nuvem Pública** — recursos hospedados e gerenciados pelo provedor (Microsoft, AWS, Google). Você consome sob demanda, paga pelo uso, não gerencia hardware.

**Nuvem Privada** — infraestrutura dedicada para uma única organização. Pode estar on-premises ou em datacenter de terceiros. Controle total, maior custo.

**Nuvem Híbrida** — combinação de pública e privada com integração entre elas. Workloads migram conforme necessidade. É o modelo mais comum em grandes empresas.

**Multi-Cloud** — uso de múltiplos provedores públicos simultaneamente. Evita lock-in e aproveita diferenciais de cada nuvem.

## Modelos de serviço

O modelo de responsabilidade compartilhada muda conforme o serviço:

```
On-premises:  Você gerencia TUDO
IaaS:         Você gerencia SO, runtime, aplicação, dados
PaaS:         Você gerencia aplicação e dados
SaaS:         Você gerencia configurações e dados de uso
```

### IaaS — Infrastructure as a Service

Você aluga VMs, rede e armazenamento. A Microsoft gerencia o hardware físico, você gerencia tudo acima disso.

**Exemplos no Azure:** Azure Virtual Machines, Azure Virtual Network, Azure Storage

**Quando usar:** migração lift-and-shift, controle total sobre SO, workloads legados que precisam de configuração específica.

```bash
# Exemplo clássico de IaaS — criar uma VM
az vm create \
  --resource-group meu-rg \
  --name minha-vm \
  --image Ubuntu2204 \
  --size Standard_D2s_v3 \
  --admin-username azureuser \
  --generate-ssh-keys
```

### PaaS — Platform as a Service

A Microsoft gerencia SO, runtime, middleware e infraestrutura. Você foca na aplicação e nos dados.

**Exemplos no Azure:** Azure App Service, Azure SQL Database, Azure Functions, Azure Kubernetes Service

**Quando usar:** desenvolvimento de aplicações sem gerenciar infraestrutura, ciclos de deploy rápidos.

```bash
# Exemplo clássico de PaaS — deploy de app web
az webapp create \
  --resource-group meu-rg \
  --plan meu-plano \
  --name minha-app \
  --runtime "NODE:18-lts"
```

### SaaS — Software as a Service

Aplicação completa entregue pela internet. Você usa, não gerencia nada de infraestrutura.

**Exemplos:** Microsoft 365, Dynamics 365, GitHub

## Benefícios da nuvem

**Alta disponibilidade** — SLAs garantidos pelo provedor. O Azure oferece até 99,99% de uptime para serviços com Availability Zones.

**Escalabilidade** — escale verticalmente (mais recursos em uma instância) ou horizontalmente (mais instâncias). Na nuvem, escalar leva segundos, não semanas.

**Elasticidade** — recursos aumentam e diminuem automaticamente conforme a demanda, evitando desperdício.

**Agilidade** — provisione recursos em minutos. O que antes levava meses (compra de servidor, instalação, configuração) acontece via CLI ou portal.

**Distribuição geográfica** — implante em regiões ao redor do mundo para reduzir latência para usuários globais.

**Recuperação de desastre** — replicação entre regiões sem investimento em datacenter secundário.

**Modelo OpEx vs CapEx** — Cloud é despesa operacional (paga pelo uso) em vez de capital (compra de hardware). Melhora o fluxo de caixa e permite investir o capital em negócio.

<div class="callout">
<strong>Dica para o exame:</strong> O AZ-900 frequentemente testa a diferença entre escalabilidade (capacidade de escalar) e elasticidade (escalar automaticamente conforme demanda). São conceitos relacionados mas distintos.
</div>

## O que cai no exame

- Diferença entre IaaS, PaaS e SaaS com exemplos
- Modelos de implantação (público, privado, híbrido)
- Benefícios da nuvem (CapEx vs OpEx é questão recorrente)
- Responsabilidade compartilhada por modelo de serviço
