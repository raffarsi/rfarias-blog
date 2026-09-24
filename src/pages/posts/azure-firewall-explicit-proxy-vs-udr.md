---
layout: ../../layouts/PostLayout.astro
title: "Azure Firewall com Explicit Proxy: guia prático de configuração e quando faz sentido trocar UDR por proxy"
category: "Networking"
tag: "networking"
serie: "Série Azure Networking + IA Generativa"
serieNum: 6
serieSlug: "serie-azure-networking-ia"
date: "4 Set 2026"
readTime: "10 min"
description: "Trocar UDR por Explicit Proxy parece simples. Até você esquecer do certificado e derrubar todo o tráfego de saída. Guia completo com a pegadinha que ninguém vê chegando."
prev:
  title: "Azure Networking [5]: VNets privadas por padrão a partir de março de 2026"
  slug: "vnets-privadas-por-padrao-marco-2026"
next:
  title: "Azure Networking [7]: Fortinet SD-WAN vs Secured Hub nativa do Azure"
  slug: "fortinet-sdwan-virtual-wan-secured-hub"

---

Trocar UDR por Explicit Proxy no Azure Firewall parece uma mudança simples. Você lê a documentação, habilita o proxy na Firewall Policy, aponta a variável `HTTPS_PROXY` nas aplicações e pronto. Até você esquecer do certificado, e derrubar todo o tráfego de saída dos containers de produção.

## O modelo tradicional e sua limitação

Até recentemente, forçar tráfego de saída através do Azure Firewall exigia rotas definidas pelo usuário (UDR) apontando `0.0.0.0/0` para o IP privado do firewall. Funciona bem para a maioria dos cenários, o tráfego é redirecionado na camada de rede, de forma transparente para a aplicação.

Mas esse modelo tem uma limitação prática importante: **a aplicação cliente não sabe que está sendo interceptada**. Ela faz uma requisição direta para o destino, o tráfego é redirecionado pela rota na tabela UDR, e o firewall inspeciona com base no FQDN de destino (para regras de aplicação) ou no IP (para regras de rede).

Isso dificulta cenários onde:
- A aplicação precisa ser proxy-aware (autenticação no proxy, comportamentos diferentes por URL)
- Containers e runtimes de IA precisam de controle granular de qual tráfego passa pelo proxy e qual vai direto
- Você quer eliminar a dependência de rotas específicas para cada subnet que precisa de inspeção de saída

## Como funciona o Explicit Proxy

No modo Explicit Proxy, que hoje é GA e funciona nos tiers Standard e Premium, o Azure Firewall expõe um endpoint de proxy nas portas que você define na política (neste exemplo, 8080 para HTTP e 8443 para HTTPS; uma única porta também pode atender os dois). As aplicações são configuradas para usar esse endpoint explicitamente, via variáveis de ambiente ou configuração do runtime.

A diferença fundamental: em vez de o tráfego ser redirecionado de forma transparente pela tabela de rotas, a aplicação **sabe** que está usando um proxy e estabelece conexão com ele diretamente usando o protocolo CONNECT para HTTPS.

## Quando escolher Explicit Proxy em vez de UDR

Para cargas de IA generativa especificamente, o Explicit Proxy tende a se encaixar bem quando:

**Agentes e runtimes em containers.** Frameworks como LangChain e Microsoft Agent Framework (sucessor do Semantic Kernel e do AutoGen) respeitam as variáveis de ambiente `HTTP_PROXY` e `HTTPS_PROXY` nativamente. Configurar via variável de ambiente no pod é mais limpo do que gerenciar UDRs por subnet.

**Controle granular por workload.** Com UDR, toda a subnet vai pelo firewall. Com Explicit Proxy, você decide por aplicação quem usa o proxy e quem não usa, útil quando parte do tráfego deve ir direto para endpoints privados dentro da VNet.

**Ambientes multi-tenant em AKS.** Quando diferentes namespaces precisam de políticas de saída diferentes, o Explicit Proxy permite configurar por deployment em vez de criar subnets separadas para cada política.

## Configuração básica

Habilitar o Explicit Proxy na Firewall Policy via Bicep:

```bicep
resource firewallPolicy 'Microsoft.Network/firewallPolicies@2025-09-01' = {
  name: 'fwpolicy-hub'
  location: location
  properties: {
    sku: {
      tier: 'Standard'  // Explicit Proxy funciona no Standard; Premium só se for usar TLS Inspection
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
    value: "169.254.169.254,168.63.129.16,10.0.0.0/8,.svc,.cluster.local,.internal.empresa.com"
```

<div class="callout">
<strong>Atenção ao NO_PROXY:</strong> Sempre inclua o IMDS (169.254.169.254), o IP da plataforma Azure (168.63.129.16), os ranges privados da VNet, os sufixos internos do Kubernetes (<code>.svc</code> e <code>.cluster.local</code>) e os endpoints internos. Sem isso, esse tráfego tenta passar pelo proxy e falha de forma silenciosa. Cuidado também com faixas em notação CIDR: nem todo runtime entende CIDR no NO_PROXY (o curl e o Python, por exemplo), então teste no runtime que você usa.
</div>

## A pegadinha: TLS Inspection e certificados

Aqui está o ponto que derruba ambientes em produção, e que raramente aparece na documentação de forma destacada.

Se você habilitar **TLS Inspection** no Explicit Proxy (necessária para inspecionar o conteúdo de tráfego HTTPS, não só o FQDN via SNI), o Azure Firewall passa a atuar como man-in-the-middle: ele termina o TLS da aplicação, inspeciona o conteúdo, e re-criptografa para o destino usando um certificado intermediário.

O problema: esse certificado intermediário precisa ser confiado pelos clientes. Se não for, cada requisição HTTPS vai falhar com erro de certificado, exatamente o comportamento que você vai ver depois de habilitar TLS Inspection sem preparar os containers.

**Como resolver:**

1. Emita um certificado de CA intermediária, de preferência pela PKI corporativa, que já distribui a CA raiz para as máquinas. A política padrão do Key Vault não serve: ela gera um certificado comum, e o firewall exige uma CA intermediária com requisitos específicos (flag de CA ligada, `KeyCertSign` e `BasicConstraints` críticos, path length maior ou igual a 1, chave RSA de pelo menos 4096 bits, PFX sem senha). Importe no Key Vault, crie uma identidade gerenciada atribuída pelo usuário com permissão Get e List em segredos, e referencie o certificado na política, que precisa ser Premium:

```bicep
resource firewallPolicy 'Microsoft.Network/firewallPolicies@2025-09-01' = {
  name: 'fwpolicy-hub'
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${idFirewall.id}': {} }
  }
  properties: {
    sku: { tier: 'Premium' }   // TLS Inspection exige Premium
    transportSecurity: {
      certificateAuthority: {
        name: 'fw-tls-ca'
        keyVaultSecretId: 'https://kv-hub.vault.azure.net/secrets/fw-tls-ca'
      }
    }
    explicitProxy: {
      enableExplicitProxy: true
      httpPort: 8080
      httpsPort: 8443
      enablePacFile: false
    }
  }
}
```

Depois disso, a inspeção é ligada regra a regra, nas regras de aplicação (`terminateTLS: true`). Só o tráfego dessas regras é descriptografado. Para ambientes de teste, o portal tem uma opção que gera automaticamente a identidade, o Key Vault e uma CA autoassinada.

2. Distribua o certificado CA como trusted nos containers:

```dockerfile
# No Dockerfile da aplicação
COPY fw-ca.crt /usr/local/share/ca-certificates/fw-ca.crt
RUN update-ca-certificates
```

Ou via ConfigMap no AKS, montado como volume no pod. O ConfigMap sozinho não instala nada: é preciso montar o arquivo e apontar o runtime para ele. No AKS, a configuração de proxy do cluster (`--http-proxy-config`, com o campo `trustedCa`) instala a CA nos nós e injeta as variáveis de proxy nos pods, mas o trust store da imagem do container continua precisando da CA, ou das variáveis de bundle descritas abaixo.

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

**Este é o motivo mais comum de "erro de certificado" depois de habilitar TLS Inspection em ambientes de container.** E tem uma armadilha a mais para quem trabalha com IA em Python: `requests`, `httpx` e o SDK da OpenAI não usam o trust store do sistema operacional, usam o pacote `certifi`. Instalar a CA no sistema não basta. Aponte as variáveis `SSL_CERT_FILE` e `REQUESTS_CA_BUNDLE` para um bundle que inclua a CA do firewall.

## Explicit Proxy vs UDR: quando cada um faz sentido

| Critério | UDR (Forced Tunneling) | Explicit Proxy |
|----------|----------------------|----------------|
| Aplicação proxy-aware | Não necessário | Necessário |
| Controle por pod/deployment | Não | Sim |
| Interceptação transparente de toda subnet | Sim | Não |
| TLS Inspection em containers | Exige a CA do firewall no trust store | Exige a CA do firewall no trust store |
| Ambientes legados sem suporte a proxy | Funciona | Pode não funcionar |

**Explicit Proxy não substitui o forced tunneling via UDR em todos os cenários**, para interceptação transparente de subnets inteiras (incluindo workloads que não suportam configuração de proxy), o UDR continua sendo o modelo correto.

Mas para plataformas de containers e agentes de IA que já operam bem com variáveis de proxy padrão, o Explicit Proxy elimina a fragilidade de gerenciar tabelas de rotas por subnet e permite controle mais granular por workload.

## O que fica

A configuração do Explicit Proxy é simples. O ponto crítico é a ordem: distribuir a CA do firewall nos trust stores dos containers e dos runtimes, validar em ambiente de teste e só então ligar a TLS Inspection. Na ordem inversa, todas as requisições HTTPS passam a falhar ao mesmo tempo, e o diagnóstico leva horas.

Se a TLS Inspection fosse ligada hoje no seu firewall, quantas das suas aplicações confiariam no certificado dele?
