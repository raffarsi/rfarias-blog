---
layout: ../../layouts/PostLayout.astro
title: "Como configurar Private Endpoints no Azure sem perder o acesso ao portal"
category: "Azure"
tag: "tech"
date: "27 Ago 2026"
readTime: "8 min"
description: "Passo a passo para configurar Private Endpoints no Azure, com as armadilhas de DNS que a documentação não destaca."
prev:
  title: "NSG vs ASG: quando usar cada um"
  slug: "nsg-vs-asg"
next:
  title: "Azure AI Foundry: primeiro projeto"
  slug: "azure-ai-foundry"
---

Na semana passada precisei configurar Private Endpoints para um Azure SQL Database em produção. A documentação oficial é completa, mas tem um detalhe sobre resolução DNS que quase me travou — e que não está destacado como deveria.

## O que é um Private Endpoint

Um Private Endpoint é uma interface de rede que conecta você de forma privada a um serviço do Azure. Em vez de acessar o recurso pelo IP público, o tráfego passa pela sua VNet, eliminando a exposição à internet pública.

Na prática, o Azure cria uma NIC dentro da sua subnet com um IP privado que aponta diretamente para o recurso — seja um SQL Database, Storage Account, Key Vault ou qualquer outro serviço compatível.

## Passo a passo da configuração

O comando básico para criar um Private Endpoint via CLI:

```bash
az network private-endpoint create \
  --name myPrivateEndpoint \
  --resource-group myRG \
  --vnet-name myVNet \
  --subnet mySubnet \
  --private-connection-resource-id /subscriptions/...
```

Até aqui, tudo tranquilo. O endpoint é criado, a NIC aparece na subnet, o IP privado é atribuído. Mas o problema vem agora.

## A armadilha do DNS

<div class="callout">
<strong>Armadilha:</strong> Ao criar o Private Endpoint, o DNS público do recurso continua resolvendo para o IP público. Se você não configurar a Private DNS Zone, vai achar que está acessando de forma privada, mas não está.
</div>

Esse é o ponto que me pegou. Depois de criar o Private Endpoint, fiz um `nslookup` no nome do servidor SQL e ele ainda resolvia para o IP público. Ou seja, minha aplicação continuava saindo pela internet.

A solução é criar uma **Private DNS Zone** e vinculá-la à VNet:

```bash
az network private-dns zone create \
  --resource-group myRG \
  --name privatelink.database.windows.net

az network private-dns link vnet create \
  --resource-group myRG \
  --zone-name privatelink.database.windows.net \
  --name myDnsLink \
  --virtual-network myVNet \
  --registration-enabled false
```

## Testando o acesso

Depois de configurar a DNS Zone, o `nslookup` passa a resolver para o IP privado da NIC criada pelo Private Endpoint. Aí sim o tráfego fica 100% dentro da VNet.

Para validar de dentro de uma VM na mesma VNet:

```bash
nslookup myserver.database.windows.net
# Deve retornar algo como 10.0.1.5 (IP privado)
```

## Conclusão

Private Endpoints são essenciais para ambientes corporativos com requisitos de segurança. Mas a configuração de DNS é o detalhe que separa "funcionar" de "funcionar certo". Na documentação oficial, esse passo está lá — mas não com o destaque que merece.

Se você está implementando isso em produção, meu conselho: **sempre valide a resolução DNS antes de considerar a configuração concluída**.
