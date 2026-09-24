---
layout: ../../layouts/PostLayout.astro
title: "Rate limits do Azure OpenAI em produção: como dimensionar e lidar com throttling"
category: "IA Generativa"
tag: "ia-generativa"
date: "28 Out 2025"
readTime: "9 min"
description: "Você vai atingir o rate limit. A questão é se o sistema degrada em silêncio ou entrega um 429 na cara do usuário."
---

Em desenvolvimento, rate limit é inconveniente. Em produção, é incidente.

Você vai atingir rate limit. A questão é se o sistema vai degradar graciosamente ou mostrar HTTP 429 direto para o usuário.

## O que cada limite significa

**TPM (Tokens Per Minute):** cada token no prompt mais tokens na resposta conta. Um System Prompt longo que você não está medindo pode estar consumindo muito mais TPM do que percebe.

**RPM (Requests Per Minute):** em aplicações com muitos usuários simultâneos, você atinge RPM antes de TPM, mesmo com prompts curtos.

O header `Retry-After` da resposta 429 diz quantos segundos esperar. Não ignore esse header.

## Retry com backoff que funciona

```python
import time, random
from openai import RateLimitError, APIError

def call_with_retry(func, max_retries=5, base_delay=1):
    for attempt in range(max_retries):
        try:
            return func()
        except RateLimitError as e:
            if attempt == max_retries - 1:
                raise
            retry_after = int(
                e.response.headers.get('Retry-After', base_delay * (2 ** attempt))
            )
            # Jitter para evitar que todas as instancias tentem ao mesmo tempo
            wait = retry_after + random.uniform(0, 1)
            time.sleep(wait)
        except APIError as e:
            if e.status_code >= 500 and attempt < max_retries - 1:
                time.sleep(base_delay * (2 ** attempt))
            else:
                raise
```

## Múltiplos deployments para alta disponibilidade

```python
DEPLOYMENTS = [
    {'endpoint': 'https://oai-prod-br.openai.azure.com', 'deployment': 'gpt4o-br'},
    {'endpoint': 'https://oai-prod-us.openai.azure.com', 'deployment': 'gpt4o-us'},
]

def chamar_com_fallback(messages: list) -> str:
    configs = DEPLOYMENTS.copy()
    random.shuffle(configs)  # distribuicao aleatoria, nao sempre o mesmo primeiro
    for config in configs:
        try:
            c = AzureOpenAI(
                azure_endpoint=config['endpoint'],
                azure_deployment=config['deployment'],
                azure_ad_token_provider=token_provider,
                api_version='2024-02-01'
            )
            return c.chat.completions.create(
                model=config['deployment'], messages=messages
            ).choices[0].message.content
        except RateLimitError:
            continue
    raise Exception('Todos os deployments com rate limit')
```

## PTU: quando o pay-as-you-go não é suficiente

Provisioned Throughput Units garantem throughput sem throttling. Você paga por hora de capacidade reservada. Faz sentido quando você usa mais de 60-70% da capacidade de forma consistente.

<div class="callout">
<strong>Monitore TPM e RPM separadamente.</strong> Rate limit por RPM = distribuir requisições. Rate limit por TPM = reduzir o contexto. Saber qual dos dois é qual define a solução certa.
</div>

Rate limit bem tratado é invisível para o usuário. Mal tratado, vira 429 na tela.
