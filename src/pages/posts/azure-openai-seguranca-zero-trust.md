---
layout: ../../layouts/PostLayout.astro
title: "Segurança Zero Trust para aplicações Azure OpenAI"
category: "IA Generativa"
tag: "ia-generativa"
date: "24 Fev 2026"
readTime: "5 min"
description: "Uma chave de API no repositório, um recurso com acesso público e nenhum log: é assim que a maioria dos incidentes com IA começa. Zero Trust aplicado a uma aplicação com Azure OpenAI, camada por camada, e por onde começar quando o ambiente já existe."
---

Já vi acontecer: uma varredura de segredos encontra uma chave do Azure OpenAI num repositório. A chave estava num arquivo de configuração de um protótipo, o protótipo virou produção, e o recurso aceitava chamadas de qualquer lugar da internet. Ninguém sabia dizer se a chave tinha sido usada por outra pessoa, porque não havia log de quem chamava o modelo.

Nada disso é um problema do modelo. É a forma como ele foi conectado ao resto do mundo.

Zero Trust para IA não é desconfiar do modelo. É assumir que qualquer camada pode falhar, e desenhar o sistema para que uma falha isolada não vire um incidente. Na prática, são três camadas que precisam funcionar juntas, mais a visibilidade para saber quando uma delas falhou.

## Identidade: sem chave de API

A chave de API é a credencial mais fácil de vazar e a mais difícil de rastrear. Ela não diz quem chamou, só que alguém tinha a chave. O primeiro passo é trocá-la por identidade gerenciada, e o segundo é desligar as chaves de vez.

A aplicação usa a própria identidade gerenciada para pedir um token ao Microsoft Entra:

```python
from openai import OpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

cliente = OpenAI(
    base_url="https://oai-producao.openai.azure.com/openai/v1/",
    api_key=get_bearer_token_provider(DefaultAzureCredential(), "https://ai.azure.com/.default"),
)
```

Essa identidade recebe um papel de RBAC no recurso, e só o necessário para chamar o modelo. O papel certo depende do tipo de recurso. O recurso deste artigo é um recurso do Microsoft Foundry (o `kind: 'AIServices'` do Bicep abaixo), e para ele a documentação orienta os papéis próprios do Foundry, como o Foundry User, e não os papéis que começam com "Cognitive Services". Num recurso Azure OpenAI clássico, o papel de uso continua sendo o Cognitive Services OpenAI User. Os recursos Azure OpenAI estão sendo convertidos automaticamente em recursos Foundry, e a conversão mantém endpoint e atribuições de papel, então o que já funciona continua funcionando.

Com todas as aplicações usando identidade, desligue a autenticação local, que é o que aceita chave:

```bash
az resource update \
  --ids $(az cognitiveservices account show --name oai-producao --resource-group rg-ia --query id -o tsv) \
  --set properties.disableLocalAuth=true
```

A partir daí, uma chave vazada não abre nada.

## Rede: sem acesso público

Com a identidade resolvida, a segunda camada tira o recurso da internet. O acesso público é desligado no próprio recurso, e as aplicações chegam a ele por Private Endpoint, de dentro da rede:

```bicep
resource ia 'Microsoft.CognitiveServices/accounts@2024-10-01' = {
  name: 'oai-producao'
  location: location
  kind: 'AIServices'
  sku: { name: 'S0' }
  properties: {
    customSubDomainName: 'oai-producao'
    publicNetworkAccess: 'Disabled'
    networkAcls: { defaultAction: 'Deny' }
    disableLocalAuth: true
  }
}
```

Com o acesso público desligado, uma chamada de fora da rede é recusada mesmo com credencial válida. É isso que "não confiar na identidade sozinha" significa na prática: uma credencial roubada, sozinha, não basta.

Essa camada tem uma dependência que derruba muita implantação: o DNS privado. Um recurso Foundry responde em três nomes (`openai.azure.com`, `services.ai.azure.com` e `cognitiveservices.azure.com`), e cada um precisa da sua zona privada. Sem a zona certa, a aplicação resolve o nome para o IP público, que está bloqueado, e a chamada falha. Os erros mais comuns estão no artigo sobre [DNS privado em arquiteturas de IA](/posts/dns-privado-arquiteturas-ia-multi-vnet/).

## Dados: o que entra e o que sai do modelo

A terceira camada olha o conteúdo. Uma aplicação com identidade e rede perfeitas ainda pode ser usada para extrair o que não devia, se o que entra e o que sai do modelo não for verificado.

**Na entrada**, os filtros de conteúdo do Azure AI Content Safety e o Prompt Shields, que detecta tentativas de manipular o modelo, inclusive escondidas em documentos. No Microsoft Foundry, os dois aparecem como guardrails do deployment. O tema tem um artigo próprio, sobre [prompt injection em agentes](/posts/prompt-injection-seguranca-agentes-ia/).

**Nos dados de contexto**, permissão por documento na busca. Um assistente com RAG só deve receber trechos que o usuário que perguntou pode ver. Isso se resolve no índice de busca, não no prompt.

**Na saída**, a mesma verificação de conteúdo, e cuidado com o que a interface renderiza a partir da resposta.

## Visibilidade: saber quando uma camada falhou

Zero Trust parte do princípio de que algo vai falhar. Sem log, você não sabe quando.

Os logs de diagnóstico do recurso vão para um workspace do Log Analytics; as operações de gestão sobre o recurso, como mudança de rede ou de papel, ficam no Activity Log:

```bash
az monitor diagnostic-settings create \
  --name diag-ia \
  --resource $(az cognitiveservices account show --name oai-producao --resource-group rg-ia --query id -o tsv) \
  --workspace $(az monitor log-analytics workspace show --workspace-name law-seguranca --resource-group rg-monitor --query id -o tsv) \
  --logs '[{"category":"Audit","enabled":true},{"category":"RequestResponse","enabled":true}]'
```

Com identidade gerenciada em todas as aplicações, o acesso passa a ser concedido, revisto e revogado por identidade, coisa que uma chave compartilhada não permite. Os alertas que eu considero básicos: chamadas recusadas por rede ou por permissão fora do padrão, uma identidade chamando um deployment que ela não costuma chamar e picos de consumo fora do horário.

## Quando o ambiente já existe

Quase ninguém começa do zero. A ordem que eu uso para não quebrar o que funciona:

1. **Visibilidade primeiro.** Ligue os logs. Sem eles, você não sabe quem usa o recurso e vai quebrar alguém sem perceber.
2. **Identidade.** Migre cada aplicação para identidade gerenciada. Os logs mostram quando a última chave parou de ser usada.
3. **Desligue as chaves.** Só depois do passo anterior.
4. **Rede.** Private Endpoint e DNS privado, testados de cada ambiente, e só então o acesso público desligado.
5. **Conteúdo.** Guardrails e permissão por documento, calibrados com tráfego real.

## Checklist

- Identidade gerenciada em todas as aplicações, com o menor papel necessário
- `disableLocalAuth` ligado, sem chaves de API em uso
- `publicNetworkAccess` desligado e acesso por Private Endpoint
- Zonas de DNS privado vinculadas e testadas de cada rede que chama o recurso
- Prompt Shields na entrada e filtros de conteúdo na entrada e na saída
- Permissão por documento aplicada na busca, não no prompt
- Logs de diagnóstico num workspace central, com alertas definidos

## O que fica

Zero Trust não é um estado que se alcança. É eliminar, uma camada por vez, as suposições de confiança que o protótipo deixou para trás. A maioria dos incidentes que eu vejo teria parado já na primeira camada, se a chave de API não existisse.

No seu ambiente, se uma chave do Azure OpenAI vazasse hoje, ela ainda funcionaria?
