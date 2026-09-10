---
layout: ../../layouts/PostLayout.astro
title: "Segurança Zero Trust para aplicações Azure OpenAI"
category: "IA Generativa"
tag: "ia-generativa"
date: "24 Fev 2026"
readTime: "11 min"
description: "Como aplicar os princípios de Zero Trust em toda a stack de uma aplicação com Azure OpenAI — rede, identidade e dados. Guia prático com Bicep e Python."
---

Zero Trust não é um produto — é uma postura. Para aplicações de IA generativa com Azure OpenAI, aplicar Zero Trust significa questionar cada chamada, cada identidade e cada caminho de rede, independente de onde a requisição vem. Este artigo mapeia como esse modelo se traduz em configuração concreta.

## Os três pilares aplicados ao Azure OpenAI

A Microsoft define Zero Trust em três princípios: **verificar explicitamente**, **usar acesso com menor privilégio** e **assumir violação**. Para uma aplicação com Azure OpenAI, cada princípio tem implicações específicas:

**Verificar explicitamente:** toda chamada ao Azure OpenAI deve ser autenticada via Microsoft Entra ID — não via API key. API keys são credenciais compartilhadas sem rastreabilidade por identidade.

**Menor privilégio:** o agente de IA recebe apenas a role `Cognitive Services OpenAI User` — não `Contributor`, não `Owner`. Isso limita o que um token comprometido pode fazer.

**Assumir violação:** o Azure OpenAI fica atrás de um Private Endpoint com `publicNetworkAccess: Disabled`. Mesmo que um token vaze, não há endpoint público para explorar.

## Camada de rede: eliminando exposição pública

```bicep
resource openAI 'Microsoft.CognitiveServices/accounts@2023-10-01-preview' = {
  name: 'oai-producao'
  location: location
  kind: 'OpenAI'
  sku: { name: 'S0' }
  properties: {
    publicNetworkAccess: 'Disabled'   // nenhuma chamada aceita da internet
    networkAcls: {
      defaultAction: 'Deny'
    }
    customSubDomainName: 'oai-producao'
  }
}

// Private Endpoint — único ponto de acesso
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

// Private DNS Zone para resolução interna
resource dnsZoneOpenAI 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.openai.azure.com'
  location: 'global'
}
```

Com `publicNetworkAccess: Disabled`, qualquer chamada de fora da VNet recebe `403 Forbidden` — mesmo com uma API key válida.

## Camada de identidade: Managed Identity + RBAC

Nunca use API keys em produção. Use Managed Identity com a role mínima necessária:

```bash
# Managed Identity do App Service / Container / AKS
APP_IDENTITY=$(az webapp show \
  --name meu-agente \
  --resource-group rg-ia \
  --query identity.principalId -o tsv)

# Role mínima: só pode chamar completions e embeddings
az role assignment create \
  --assignee $APP_IDENTITY \
  --role "Cognitive Services OpenAI User" \
  --scope $(az cognitiveservices account show \
    --name oai-producao \
    --resource-group rg-ia \
    --query id -o tsv)
```

No código, sem nenhuma credencial hardcoded:

```python
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from openai import AzureOpenAI

credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(
    credential,
    "https://cognitiveservices.azure.com/.default"
)

client = AzureOpenAI(
    azure_ad_token_provider=token_provider,
    api_version="2024-02-01",
    azure_endpoint="https://oai-producao.openai.azure.com"
)
```

`DefaultAzureCredential` usa Managed Identity em produção e Azure CLI localmente — o mesmo código funciona nos dois ambientes sem modificação.

## Diferença de roles — escolha a mínima

| Role | Pode fazer | Quando usar |
|------|-----------|-------------|
| `Cognitive Services OpenAI User` | Chat completions, embeddings | Aplicações de produção |
| `Cognitive Services OpenAI Contributor` | + criar deployments, fine-tuning | Pipelines de MLOps |
| `Cognitive Services Contributor` | Gerenciar o recurso inteiro | Administradores |

A maioria das aplicações só precisa de `User`. Usar `Contributor` para "simplificar" viola diretamente o princípio de menor privilégio.

## Camada de dados: proteção do contexto e do output

Zero Trust para IA generativa inclui proteger o que entra e o que sai do modelo:

```python
from azure.ai.contentsafety import ContentSafetyClient
from azure.ai.contentsafety.models import AnalyzeTextOptions, TextCategory

safety_client = ContentSafetyClient(
    endpoint="https://content-safety-prod.cognitiveservices.azure.com",
    credential=DefaultAzureCredential()
)

def verificar_conteudo(texto: str) -> bool:
    result = safety_client.analyze_text(AnalyzeTextOptions(
        text=texto,
        categories=[TextCategory.HATE, TextCategory.VIOLENCE,
                   TextCategory.SEXUAL, TextCategory.SELF_HARM]
    ))
    # Bloquear se qualquer categoria tiver severidade >= 2
    return all(c.severity < 2 for c in result.categories_analysis)

# Pipeline Zero Trust completo
def processar_requisicao(user_input: str, user_id: str) -> str:
    # 1. Verificar input
    if not verificar_conteudo(user_input):
        raise ValueError("Conteúdo rejeitado pela política de segurança")

    # 2. Chamar o modelo (via Managed Identity, Private Endpoint)
    response = client.chat.completions.create(
        model="gpt4o-prod",
        messages=[
            {"role": "system", "content": "Você é um assistente corporativo."},
            {"role": "user", "content": user_input}
        ]
    )
    output = response.choices[0].message.content

    # 3. Verificar output antes de retornar
    if not verificar_conteudo(output):
        return "Não posso fornecer essa resposta de acordo com as políticas da empresa."

    # 4. Logar para auditoria (sem logar o conteúdo completo em prod)
    logar_requisicao(user_id, len(user_input), len(output))

    return output
```

## Auditoria: logs de acesso ao Azure OpenAI

Sem logs, não há como verificar "assumir violação". Configure diagnósticos para capturar todas as chamadas:

```bash
az monitor diagnostic-settings create \
  --resource $(az cognitiveservices account show \
    --name oai-producao --resource-group rg-ia --query id -o tsv) \
  --name diag-openai \
  --workspace $(az monitor log-analytics workspace show \
    --workspace-name law-seguranca --resource-group rg-security --query id -o tsv) \
  --logs '[
    {"category":"Audit","enabled":true},
    {"category":"RequestResponse","enabled":true,"retentionPolicy":{"days":90,"enabled":true}}
  ]' \
  --metrics '[{"category":"AllMetrics","enabled":true}]'
```

Consulta KQL para detectar padrões anômalos:

```kql
// Usuários ou IPs com volume anormal de chamadas
AzureDiagnostics
| where ResourceType == "ACCOUNTS" and ResourceProvider == "MICROSOFT.COGNITIVESERVICES"
| where OperationName == "ChatCompletions_Create"
| summarize chamadas = count(), tokens = sum(toint(properties_s)) by CallerIPAddress, bin(TimeGenerated, 1h)
| where chamadas > 100  // ajustar threshold por ambiente
| order by chamadas desc
```

<div class="callout">
<strong>API Keys: desabilite completamente.</strong> Em vez de apenas não usar API keys, desabilite-as no recurso:

```bash
az cognitiveservices account update \
  --name oai-producao \
  --resource-group rg-ia \
  --api-properties disableLocalAuth=true
```

Com `disableLocalAuth=true`, API keys deixam de funcionar mesmo que alguém tente usá-las — só Entra ID é aceito.
</div>

## Checklist Zero Trust para Azure OpenAI

- [ ] `publicNetworkAccess: Disabled` no recurso
- [ ] Private Endpoint provisionado e DNS privado configurado
- [ ] `disableLocalAuth: true` — API keys desabilitadas
- [ ] Managed Identity com role `Cognitive Services OpenAI User` (não Contributor)
- [ ] Content Safety verificando input e output
- [ ] Diagnósticos enviando para Log Analytics com retenção ≥ 90 dias
- [ ] Alerta configurado para volume anormal de chamadas

## Conclusão

Zero Trust para Azure OpenAI é a combinação de três camadas independentes: rede (Private Endpoint + sem acesso público), identidade (Managed Identity + role mínima + sem API keys) e dados (Content Safety + auditoria). Cada camada falha de formas diferentes — a segurança real vem da sobreposição das três, não de qualquer uma delas isoladamente.
