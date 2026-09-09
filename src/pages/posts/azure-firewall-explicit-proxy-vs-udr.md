---
layout: ../../layouts/PostLayout.astro
title: "Azure Firewall com Explicit Proxy: guia prático de configuração e quando faz sentido trocar UDR por proxy"
category: "Azure"
tag: "azure"
serie: "Série Azure Networking + IA Generativa"
serieNum: 6
serieSlug: "serie-azure-networking-ia"
date: "4 Set 2026"
readTime: "10 min"
description: "Trocar UDR por Explicit Proxy parece simples. Até você esquecer do certificado — e derrubar todo o tráfego de saída. Guia completo com a pegadinha que ninguém vê chegando."
prev:
  title: "Azure Networking [5] — VNets privadas por padrão a partir de março de 2026"
  slug: "vnets-privadas-por-padrao-marco-2026"
next:
  title: "Azure Networking [7] — Fortinet SD-WAN vs Secured Hub nativa do Azure"
  slug: "fortinet-sdwan-virtual-wan-secured-hub"

---

Trocar UDR por Explicit Proxy no Azure Firewall parece uma mudança simples. Você lê a documentação, habilita o proxy na Firewall Policy, aponta a variável `HTTPS_PROXY` nas aplicações e pronto. Até você esquecer do certificado — e derrubar todo o tráfego de saída dos containers de produção.

Este é o artigo 6 de 20 da série **Azure Networking + IA Generativa**. Aqui cubro o que o modelo tradicional não resolve, quando o Explicit Proxy genuinamente compensa e a pegadinha de TLS Inspection que já derrubou ambientes em produção.

## O modelo tradicional e sua limitação

Até recentemente, forçar tráfego de saída através do Azure Firewall exigia rotas definidas pelo usuário (UDR) apontando `0.0.0.0/0` para o IP privado do firewall. Funciona bem para a maioria dos cenários — o tráfego é redirecionado na camada de rede, de forma transparente para a aplicação.

Mas esse modelo tem uma limitação prática importante: **a aplicação cliente não sabe que está sendo interceptada**. Ela faz uma requisição direta para o destino, o tráfego é redirecionado pela rota na tabela UDR, e o firewall inspeciona com base no FQDN de destino (para regras de aplicação) ou no IP (para regras de rede).

Isso dificulta cenários onde:
- A aplicação precisa ser proxy-aware (autenticação no proxy, comportamentos diferentes por URL)
- Containers e runtimes de IA precisam de controle granular de qual tráfego passa pelo proxy e qual vai direto
- Você quer eliminar a dependência de rotas específicas para cada subnet que precisa de inspeção de saída

## Como funciona o Explicit Proxy

No modo Explicit Proxy, o Azure Firewall expõe um endpoint de proxy na porta 8080 (HTTP) e 8443 (HTTPS). As aplicações são configuradas para usar esse endpoint explicitamente — via variáveis de ambiente ou configuração do runtime.

A diferença fundamental: em vez de o tráfego ser redirecionado de forma transparente pela tabela de rotas, a aplicação **sabe** que está usando um proxy e estabelece conexão com ele diretamente usando o protocolo CONNECT para HTTPS.

## Quando escolher Explicit Proxy em vez de UDR

Para cargas de IA generativa especificamente, o Explicit Proxy tende a se encaixar bem quando:

**Agentes e runtimes em containers.** Frameworks como LangChain, Semantic Kernel e AutoGen respeitam as variáveis de ambiente `HTTP_PROXY` e `HTTPS_PROXY` nativamente. Configurar via variável de ambiente no pod é mais limpo do que gerenciar UDRs por subnet.

**Controle granular por workload.** Com UDR, toda a subnet vai pelo firewall. Com Explicit Proxy, você decide por aplicação quem usa o proxy e quem não usa — útil quando parte do tráfego deve ir direto para endpoints privados dentro da VNet.

**Ambientes multi-tenant em AKS.** Quando diferentes namespaces precisam de políticas de saída diferentes, o Explicit Proxy permite configurar por deployment em vez de criar subnets separadas para cada política.

## Configuração básica

Habilitar o Explicit Proxy na Firewall Policy via Bicep:

```bicep
resource firewallPolicy 'Microsoft.Network/firewallPolicies@2023-09-01' = {
  name: 'fwpolicy-hub'
  location: location
  properties: {
    sku: {
      tier: 'Premium'  // Explicit Proxy requer Premium
    }
    explicitProxy: {
      enableExplicitProxy: true
      httpPort: 8080
      httpsPort: 8443
      enablePacFile: false
    }
    threatIntelMode: 'Alert'
  }
}
```

Nos pods do AKS, configurar via variáveis de ambiente:

```yaml
env:
  - name: HTTP_PROXY
    value: "http://10.0.1.4:8080"   # IP privado do Azure Firewall
  - name: HTTPS_PROXY
    value: "http://10.0.1.4:8080"
  - name: NO_PROXY
    value: "169.254.169.254,10.0.0.0/8,*.internal.empresa.com"
```

<div class="callout">
<strong>Atenção ao NO_PROXY:</strong> Sempre inclua o IMDS (169.254.254.254), os ranges privados da VNet e os endpoints internos. Sem isso, o tráfego para o Azure Instance Metadata Service e para serviços internos vai tentar passar pelo proxy — causando falhas silenciosas difíceis de diagnosticar.
</div>

## A pegadinha: TLS Inspection e certificados

Aqui está o ponto que derruba ambientes em produção — e que raramente aparece na documentação de forma destacada.

Se você habilitar **TLS Inspection** no Explicit Proxy (necessária para inspecionar o conteúdo de tráfego HTTPS, não só o FQDN via SNI), o Azure Firewall passa a atuar como man-in-the-middle: ele termina o TLS da aplicação, inspeciona o conteúdo, e re-criptografa para o destino usando um certificado intermediário.

O problema: esse certificado intermediário precisa ser confiado pelos clientes. Se não for, cada requisição HTTPS vai falhar com erro de certificado — exatamente o comportamento que você vai ver depois de habilitar TLS Inspection sem preparar os containers.

**Como resolver:**

1. Gere ou importe um certificado CA intermediário no Key Vault:

```bash
# Criar certificado CA no Key Vault
az keyvault certificate create \
  --vault-name kv-hub \
  --name fw-tls-ca \
  --policy "$(az keyvault certificate get-default-policy)" 

# Referenciar na Firewall Policy
az network firewall policy update \
  --name fwpolicy-hub \
  --resource-group rg-hub \
  --key-vault-secret-id "https://kv-hub.vault.azure.net/secrets/fw-tls-ca"
```

2. Distribua o certificado CA como trusted nos containers:

```dockerfile
# No Dockerfile da aplicação
COPY fw-ca.crt /usr/local/share/ca-certificates/fw-ca.crt
RUN update-ca-certificates
```

Ou via ConfigMap no AKS:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fw-ca-cert
data:
  fw-ca.crt: |
    -----BEGIN CERTIFICATE-----
    # Conteúdo do certificado CA do Azure Firewall
    -----END CERTIFICATE-----
```

**Este é o motivo mais comum de "erro de certificado" depois de habilitar TLS Inspection em ambientes de container.** O container usa o trust store do SO — se o certificado CA do firewall não estiver lá, toda requisição HTTPS via proxy vai falhar.

## Explicit Proxy vs UDR: quando cada um faz sentido

| Critério | UDR (Forced Tunneling) | Explicit Proxy |
|----------|----------------------|----------------|
| Aplicação proxy-aware | Não necessário | Necessário |
| Controle por pod/deployment | Não | Sim |
| Interceptação transparente de toda subnet | Sim | Não |
| TLS Inspection em containers | Complexo | Mais direto |
| Ambientes legados sem suporte a proxy | Funciona | Pode não funcionar |

**Explicit Proxy não substitui o forced tunneling via UDR em todos os cenários** — para interceptação transparente de subnets inteiras (incluindo workloads que não suportam configuração de proxy), o UDR continua sendo o modelo correto.

Mas para plataformas de containers e agentes de IA que já operam bem com variáveis de proxy padrão, o Explicit Proxy elimina a fragilidade de gerenciar tabelas de rotas por subnet e permite controle mais granular por workload.

## Conclusão

O Explicit Proxy no Azure Firewall é uma adição bem-vinda — especialmente para ambientes containerizados e agentes de IA. A configuração em si não é complexa. O ponto crítico é **preparar o trust store dos containers antes de habilitar TLS Inspection**, não depois.

Se você seguir a ordem correta — distribuir o certificado CA, validar em ambiente de teste, depois habilitar a inspeção — a transição de UDR para Explicit Proxy é tranquila. Se inverter essa ordem, vai gastar algumas horas entendendo por que todas as requisições HTTPS estão falhando ao mesmo tempo.

---

*Série **Azure Networking + IA Generativa** — arquitetura de referência, decisões de rede e os erros mais comuns em produção. Publicado às terças e quintas.*
