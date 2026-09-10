---
layout: ../../layouts/PostLayout.astro
title: "Arquitetura multi-tenant com Azure OpenAI: isolamento e governança"
category: "IA Generativa"
tag: "ia-generativa"
date: "06 Jan 2026"
readTime: "10 min"
description: "Como servir múltiplos clientes ou departamentos com isolamento de dados, quotas separadas e auditoria individual usando Azure OpenAI."
---

Quando uma plataforma de IA precisa atender múltiplos departamentos (RH, Jurídico, Financeiro) ou múltiplos clientes externos, a questão de isolamento se torna crítica. Cada tenant precisa de garantias de que seus dados não se misturam com os de outros, seja em armazenamento, em cache de respostas ou em logs de auditoria.

## Os níveis de isolamento possíveis

**Nível 1, Isolamento lógico (mais simples):** um único recurso Azure OpenAI, múltiplos deployments, separação por `tenant_id` no código. Sem isolamento real de rede ou billing.

**Nível 2, Isolamento por deployment:** cada tenant tem seu próprio deployment com quota dedicada. Mesmo recurso, mas quotas e métricas separadas.

**Nível 3, Isolamento por recurso (mais forte):** cada tenant tem seu próprio recurso Azure OpenAI, em resource groups separados, com Private Endpoints e billing independente.

Para plataformas SaaS com requisitos de compliance, o Nível 3 é o correto. Para departamentos internos onde os dados são todos da mesma empresa, o Nível 2 frequentemente é suficiente.

## Arquitetura de referência: Nível 2 (departamentos internos)

```python
# Camada de roteamento, cada request vai para o deployment do tenant certo
TENANT_CONFIG = {
    "rh": {
        "deployment": "gpt4o-rh",
        "system_prompt": "Você é um assistente de RH da empresa...",
        "max_tokens": 1000,
        "allowed_topics": ["ferias", "beneficios", "politicas"]
    },
    "juridico": {
        "deployment": "gpt4o-juridico",
        "system_prompt": "Você é um assistente jurídico...",
        "max_tokens": 2000,
        "allowed_topics": ["contratos", "compliance", "regulatorio"]
    },
    "financeiro": {
        "deployment": "gpt4o-financeiro",
        "system_prompt": "Você é um assistente financeiro...",
        "max_tokens": 1500,
        "allowed_topics": ["orcamento", "relatorios", "analise"]
    }
}

def processar_request(tenant_id: str, user_id: str, mensagem: str) -> str:
    config = TENANT_CONFIG.get(tenant_id)
    if not config:
        raise ValueError(f"Tenant desconhecido: {tenant_id}")

    # Logar com contexto de tenant (sem conteúdo da mensagem por privacidade)
    logar_request(tenant_id=tenant_id, user_id=user_id,
                  tokens_estimados=len(mensagem.split()) * 1.3)

    response = openai_client.chat.completions.create(
        model=config["deployment"],
        messages=[
            {"role": "system", "content": config["system_prompt"]},
            {"role": "user", "content": mensagem}
        ],
        max_tokens=config["max_tokens"]
    )

    return response.choices[0].message.content
```

## Quotas separadas por tenant via Bicep

```bicep
// Deployment dedicado para cada departamento com quota própria
var deployments = [
  { name: 'gpt4o-rh', capacity: 20 }       // 20K TPM para RH
  { name: 'gpt4o-juridico', capacity: 30 }  // 30K TPM para Jurídico
  { name: 'gpt4o-financeiro', capacity: 25} // 25K TPM para Financeiro
]

resource openAIDeployments 'Microsoft.CognitiveServices/accounts/deployments@2023-10-01-preview' = [
  for dep in deployments: {
    name: dep.name
    parent: openAI
    sku: {
      name: 'GlobalStandard'
      capacity: dep.capacity
    }
    properties: {
      model: {
        format: 'OpenAI'
        name: 'gpt-4o'
        version: '2024-11-20'
      }
    }
  }
]
```

## Isolamento de dados do índice de busca

Para RAG multi-tenant, o índice do AI Search precisa de isolamento de documentos por tenant:

```python
# Opção A: campo de filtro no índice (mais simples, menor isolamento)
def buscar_documentos_tenant(pergunta: str, tenant_id: str) -> list:
    return list(search_client.search(
        search_text=pergunta,
        filter=f"tenant_id eq '{tenant_id}'",  # filtro obrigatório
        vector_queries=[...],
        top=5
    ))

# Opção B: índices separados por tenant (isolamento real)
def get_search_client(tenant_id: str) -> SearchClient:
    return SearchClient(
        endpoint=f"https://search-{tenant_id}.search.windows.net",
        index_name="base-conhecimento",
        credential=credential
    )
```

Para dados sensíveis ou requisitos de compliance rígidos (LGPD, dados financeiros), índices separados são o caminho correto, um vazamento de filtro não expõe dados de outros tenants.

## Auditoria por tenant

```kql
// Volume de uso por tenant nas últimas 24h
customEvents
| where name == "openai_request"
| extend tenant_id = tostring(customDimensions["tenant_id"])
| extend tokens = toint(customDimensions["tokens_total"])
| where timestamp > ago(24h)
| summarize
    requisicoes = count(),
    tokens_total = sum(tokens),
    custo_estimado = sum(tokens) * 0.000015
    by tenant_id
| order by tokens_total desc
```

<div class="callout">
<strong>Isolamento de logs:</strong> Em arquiteturas multi-tenant, garanta que os logs de um tenant não ficam acessíveis a administradores de outro. Use resource groups separados com RBAC granular, ou Log Analytics workspaces separados por tenant quando o isolamento de auditoria for um requisito contratual.
</div>

## Conclusão

Multi-tenant com Azure OpenAI é um espectro de isolamento, você escolhe o nível de acordo com os requisitos reais. Departamentos internos da mesma empresa raramente precisam de Nível 3; plataformas SaaS atendendo múltiplos clientes externos quase sempre precisam. O erro mais comum é começar com Nível 1 (só código) e descobrir tarde que é necessário Nível 3, a migração exige refatoração significativa de infraestrutura.
