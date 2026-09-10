---
layout: ../../layouts/PostLayout.astro
title: "Segurança Zero Trust para aplicações Azure OpenAI"
category: "IA Generativa"
tag: "ia-generativa"
date: "24 Fev 2026"
readTime: "11 min"
description: "Como aplicar os princípios de Zero Trust em toda a stack de uma aplicação com Azure OpenAI — rede, identidade e dados. Guia prático com Bicep e Python."
---

Toda semana aparece uma noticia de vazamento de dados envolvendo IA. E quando voce vai ler os detalhes, quase sempre o problema nao foi o modelo. Foi a forma como ele foi conectado ao mundo.

API key hardcoded no repositorio. Azure OpenAI com acesso publico habilitado. Sem logs de auditoria. Sem validacao do que entra e do que sai.

Zero Trust para IA nao e sobre desconfiar do modelo. E sobre assumir que qualquer camada pode ser comprometida e projetar o sistema para sobreviver a isso.

## As tres camadas que precisam funcionar juntas

**Rede:** acesso publico desabilitado, trafego so via Private Endpoint.
**Identidade:** sem API keys, Managed Identity com role minima.
**Dados:** Content Safety validando entrada e saida, logs de auditoria.

## Camada de rede

```bicep
resource openAI 'Microsoft.CognitiveServices/accounts@2023-10-01-preview' = {
  name: 'oai-producao'
  location: location
  kind: 'OpenAI'
  sku: { name: 'S0' }
  properties: {
    publicNetworkAccess: 'Disabled'
    networkAcls: { defaultAction: 'Deny' }
    customSubDomainName: 'oai-producao'
  }
}
```

Com `publicNetworkAccess: Disabled`, qualquer chamada de fora da VNet recebe 403, mesmo com API key valida.

## Camada de identidade: sem API keys em producao

```bash
APP_IDENTITY=$(az webapp show \
  --name meu-agente --resource-group rg-ia \
  --query identity.principalId -o tsv)

az role assignment create \
  --assignee $APP_IDENTITY \
  --role "Cognitive Services OpenAI User" \
  --scope $(az cognitiveservices account show \
    --name oai-producao --resource-group rg-ia --query id -o tsv)
```

```python
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from openai import AzureOpenAI

credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(
    credential, 'https://cognitiveservices.azure.com/.default'
)

client = AzureOpenAI(
    azure_ad_token_provider=token_provider,
    api_version='2024-02-01',
    azure_endpoint='https://oai-producao.openai.azure.com'
)
```

Desabilite as API keys completamente para que ninguem possa usa-las:

```bash
az cognitiveservices account update \
  --name oai-producao --resource-group rg-ia \
  --api-properties disableLocalAuth=true
```

## Camada de dados

```python
from azure.ai.contentsafety import ContentSafetyClient
from azure.ai.contentsafety.models import AnalyzeTextOptions, TextCategory

safety_client = ContentSafetyClient(
    endpoint='https://content-safety-prod.cognitiveservices.azure.com',
    credential=DefaultAzureCredential()
)

def verificar(texto: str) -> bool:
    result = safety_client.analyze_text(AnalyzeTextOptions(
        text=texto,
        categories=[TextCategory.HATE, TextCategory.VIOLENCE,
                   TextCategory.SEXUAL, TextCategory.SELF_HARM]
    ))
    return all(c.severity < 2 for c in result.categories_analysis)

def processar(user_input: str) -> str:
    if not verificar(user_input):
        raise ValueError('Conteudo rejeitado')
    response = client.chat.completions.create(
        model='gpt4o-prod',
        messages=[{'role': 'user', 'content': user_input}]
    )
    output = response.choices[0].message.content
    if not verificar(output):
        return 'Nao posso fornecer essa resposta.'
    return output
```

## Checklist Zero Trust para Azure OpenAI

- [ ] `publicNetworkAccess: Disabled`
- [ ] Private Endpoint provisionado com DNS privado configurado
- [ ] `disableLocalAuth: true` (API keys desabilitadas)
- [ ] Managed Identity com role `Cognitive Services OpenAI User`
- [ ] Content Safety verificando input e output
- [ ] Logs de auditoria no Log Analytics

Zero Trust nao e um estado que voce atinge. E um processo de eliminar suposicoes de confianca, uma camada por vez. A maioria dos comprometimentos que leio poderia ser evitada com so a primeira camada implementada corretamente.
