---
layout: ../../layouts/PostLayout.astro
title: "Azure OpenAI Service: primeiros passos em ambiente corporativo"
category: "IA"
tag: "azure"
date: "14 Ago 2025"
readTime: "8 min"
description: "Como provisionar, autenticar e fazer as primeiras chamadas ao Azure OpenAI dentro dos requisitos de segurança de uma empresa."
---

O Azure OpenAI Service é a versão corporativa dos modelos da OpenAI (GPT-4o, GPT-4, embeddings) hospedada na infraestrutura Azure da sua organização. A diferença fundamental em relação à API direta da OpenAI: seus dados ficam no seu tenant Azure, dentro dos controles de governança e conformidade que você já tem.

## Provisionamento

O Azure OpenAI requer aprovação de acesso — você submete uma solicitação no portal Microsoft. Depois de aprovado, o recurso é criado como qualquer outro serviço Azure:

```bash
az cognitiveservices account create \
  --name oai-producao \
  --resource-group rg-ia \
  --kind OpenAI \
  --sku S0 \
  --location eastus \
  --custom-domain oai-producao
```

Depois de criar o recurso, você provisiona **deployments** — instâncias específicas de modelos com suas próprias quotas:

```bash
az cognitiveservices account deployment create \
  --name oai-producao \
  --resource-group rg-ia \
  --deployment-name gpt4o-prod \
  --model-name gpt-4o \
  --model-version "2024-11-20" \
  --model-format OpenAI \
  --sku-capacity 10 \
  --sku-name "GlobalStandard"
```

A capacidade (`--sku-capacity`) é medida em **RPM** (requests por minuto) ou **TPM** (tokens por minuto) dependendo do modelo.

## Autenticação: API Key vs Managed Identity

O Azure OpenAI suporta dois métodos de autenticação:

**API Key** — mais simples, mas menos seguro:
```python
from openai import AzureOpenAI

client = AzureOpenAI(
    api_key="sua-api-key",
    api_version="2024-02-01",
    azure_endpoint="https://oai-producao.openai.azure.com"
)
```

**Managed Identity** — padrão recomendado em produção:
```python
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from openai import AzureOpenAI

credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(
    credential, "https://cognitiveservices.azure.com/.default"
)

client = AzureOpenAI(
    azure_ad_token_provider=token_provider,
    api_version="2024-02-01",
    azure_endpoint="https://oai-producao.openai.azure.com"
)
```

Com Managed Identity, não há secrets para rotacionar ou vazar em logs. A aplicação recebe um token temporário automaticamente.

## Primeira chamada

```python
response = client.chat.completions.create(
    model="gpt4o-prod",  # nome do deployment, não do modelo
    messages=[
        {"role": "system", "content": "Você é um assistente técnico especializado em Azure."},
        {"role": "user", "content": "Explique a diferença entre NSG e Azure Firewall."}
    ],
    max_tokens=500,
    temperature=0.7
)

print(response.choices[0].message.content)
```

Note: o parâmetro `model` recebe o **nome do deployment**, não o nome do modelo (ex: `gpt4o-prod`, não `gpt-4o`).

## Configurações de rede para ambiente corporativo

Por padrão, o Azure OpenAI aceita chamadas de qualquer IP. Em produção, isso deve ser restringido:

```bicep
resource openAI 'Microsoft.CognitiveServices/accounts@2023-10-01-preview' = {
  properties: {
    publicNetworkAccess: 'Disabled'  // ou 'Enabled' com ACLs
    networkAcls: {
      defaultAction: 'Deny'
      ipRules: []  // adicione IPs específicos se necessário
      virtualNetworkRules: [
        {
          id: subnetApp.id
          ignoreMissingVnetServiceEndpoint: false
        }
      ]
    }
  }
}
```

<div class="callout">
<strong>Recomendação para produção:</strong> Use <code>publicNetworkAccess: Disabled</code> com Private Endpoints. Isso garante que todas as chamadas ao Azure OpenAI trafeguem dentro da rede privada Azure, sem passar pela internet pública.
</div>

## Monitoramento básico

Configure diagnósticos para ter visibilidade de uso e erros:

```bash
az monitor diagnostic-settings create \
  --resource $(az cognitiveservices account show \
    --name oai-producao -g rg-ia --query id -o tsv) \
  --name diag-openai \
  --logs '[{"category":"Audit","enabled":true},{"category":"RequestResponse","enabled":true}]' \
  --metrics '[{"category":"AllMetrics","enabled":true}]' \
  --workspace $(az monitor log-analytics workspace show \
    --workspace-name law-ia -g rg-ia --query id -o tsv)
```

As métricas mais importantes: `TokensUsed`, `TotalRequests`, `SuccessfulRequests` e `ServerErrors`.

## Conclusão

O Azure OpenAI combina o poder dos modelos da OpenAI com os controles de governança do Azure — residência de dados, Managed Identity, Private Endpoints e integração com Azure Monitor. A configuração inicial leva menos de uma hora; a parte que exige atenção é a estratégia de rede e autenticação, que deve ser definida antes do primeiro deploy em produção.
