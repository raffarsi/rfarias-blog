---
layout: ../../layouts/PostLayout.astro
title: "AZ-900 na prática [3] — Computação e redes no Azure"
category: "Azure"
tag: "azure"
serie: "AZ-900 na prática"
serieSlug: "az900"
serieNum: 3
date: "10 Mar 2026"
readTime: "10 min"
description: "VMs, containers, serverless e redes virtuais — os principais serviços de computação e rede do Azure para o AZ-900."
prev:
  title: "AZ-900 [2] — Arquitetura Azure"
  slug: "az900-02-arquitetura-azure"
next:
  title: "AZ-900 [4] — Storage e Banco de Dados"
  slug: "az900-04-storage-database"

---

O AZ-900 cobre os principais serviços de computação e rede do Azure em nível conceitual. Você não precisa configurar tudo, mas precisa saber o que cada serviço faz e quando usar.

## Computação

### Azure Virtual Machines

IaaS puro. Você controla o SO, instala o que quiser, paga pela alocação (mesmo desligada).

```bash
# Criar VM Windows Server
az vm create \
  --resource-group meu-rg \
  --name vm-windows \
  --image Win2022Datacenter \
  --size Standard_B2s \
  --admin-username azureuser \
  --admin-password "Senha@Segura123"

# Verificar status
az vm show \
  --resource-group meu-rg \
  --name vm-windows \
  --query "powerState"
```

### Azure App Service

PaaS para hospedar aplicações web, APIs e backends. Gerencia SO, runtime e infraestrutura.

```bash
az webapp create \
  --resource-group meu-rg \
  --plan plano-basico \
  --name minha-api-2026 \
  --runtime "PYTHON:3.11"
```

### Azure Container Instances (ACI)

Containers sem servidor — não gerencia clusters. Ideal para tarefas isoladas e batch.

```bash
az container create \
  --resource-group meu-rg \
  --name meu-container \
  --image python:3.11-slim \
  --command-line "python -c 'print(\"Hello Azure!\")'"
```

### Azure Kubernetes Service (AKS)

Orquestração de containers em escala. Control plane gerenciado pela Microsoft.

### Azure Functions

Serverless — execute código sem gerenciar infraestrutura. Paga por execução.

```bash
# Criar Function App
az functionapp create \
  --resource-group meu-rg \
  --consumption-plan-location brazilsouth \
  --runtime python \
  --runtime-version 3.11 \
  --functions-version 4 \
  --name minha-function-2026 \
  --storage-account meustorage
```

### Azure Virtual Desktop

Desktop Windows na nuvem. Usuários acessam de qualquer dispositivo via browser ou cliente RDP.

## Comparativo de serviços de computação

| Serviço | Modelo | Gerencia SO? | Escalabilidade | Uso |
|---------|--------|-------------|----------------|-----|
| VMs | IaaS | Você | Manual/Auto | Lift-and-shift, controle total |
| App Service | PaaS | Não | Auto | Apps web, APIs |
| ACI | PaaS | Não | Manual | Containers simples |
| AKS | PaaS | Não | Auto | Containers em escala |
| Functions | Serverless | Não | Automática | Eventos, triggers |

## Redes

### Azure Virtual Network (VNet)

Rede privada isolada no Azure. Todo recurso que precisa de comunicação privada fica dentro de uma VNet.

```bash
az network vnet create \
  --resource-group meu-rg \
  --name minha-vnet \
  --address-prefix 10.0.0.0/16 \
  --subnet-name subnet-web \
  --subnet-prefix 10.0.1.0/24
```

### Azure Load Balancer vs Application Gateway

- **Load Balancer (L4)** — distribui tráfego TCP/UDP por IP e porta
- **Application Gateway (L7)** — distribui tráfego HTTP/HTTPS com roteamento por URL, com WAF

### Azure VPN Gateway

Conecta redes on-premises ao Azure via túnel IPsec criptografado pela internet.

### Azure ExpressRoute

Conexão privada dedicada ao Azure, sem passar pela internet pública. Maior performance e confiabilidade.

### Azure DNS

Hospeda domínios DNS no Azure, integrado com outros recursos.

```bash
# Criar zona DNS
az network dns zone create \
  --resource-group meu-rg \
  --name rfarias.com

# Criar registro A
az network dns record-set a add-record \
  --resource-group meu-rg \
  --zone-name rfarias.com \
  --record-set-name www \
  --ipv4-address 1.2.3.4
```

<div class="callout">
<strong>Dica para o exame:</strong> O AZ-900 frequentemente pergunta a diferença entre VPN Gateway (sobre internet, criptografado, menor custo) e ExpressRoute (privado, sem internet, maior performance e custo). Para compliance que exige dados nunca saírem pela internet, ExpressRoute é a resposta.
</div>

## O que cai no exame

- Diferença entre VM (IaaS), App Service (PaaS) e Functions (Serverless)
- VNet como rede privada isolada
- Load Balancer vs Application Gateway (L4 vs L7)
- VPN Gateway vs ExpressRoute (custo vs performance/privacidade)
- Azure DNS para hospedagem de domínios
