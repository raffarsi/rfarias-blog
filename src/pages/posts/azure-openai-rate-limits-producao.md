---
layout: ../../layouts/PostLayout.astro
title: "Rate limits do Azure OpenAI em producao: como dimensionar e lidar com throttling"
category: "IA Generativa"
tag: "ia-generativa"
date: "28 Out 2025"
readTime: "9 min"
description: "Artigo tecnico sobre rate limits do azure openai em producao: como dimensionar e lidar com throttling — parte da serie de conteudo Azure no blog rfarias.com."
---

Em desenvolvimento, rate limit e inconveniente. Em producao, e incidente.

Voce vai atingir rate limit. A questao e se o sistema vai degradar graciosamente ou mostrar HTTP 429 direto para o usuario.

## O que cada limite significa

**TPM (Tokens Per Minute):** cada token no prompt mais tokens na resposta conta. Um System Prompt longo que voce nao esta medindo pode estar consumindo muito mais TPM do que percebe.

**RPM (Requests Per Minute):** em aplicacoes com muitos usuarios simultaneos, voce atinge RPM antes de TPM, mesmo com prompts curtos.

O header `Retry-After` da resposta 429 diz quantos segundos esperar. Nao ignore esse header.

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

## Multiplos deployments para alta disponibilidade

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

## PTU: quando o pay-as-you-go nao e suficiente

Provisioned Throughput Units garantem throughput sem throttling. Voce paga por hora de capacidade reservada. Faz sentido quando voce usa mais de 60-70% da capacidade de forma consistente.

<div class="callout">
<strong>Monitore TPM e RPM separadamente.</strong> Rate limit por RPM = distribuir requisicoes. Rate limit por TPM = reduzir o contexto. Saber qual dos dois e qual define a solucao certa.
</div>

Rate limit bem tratado e invisivel para o usuario. Mal tratado, vira 429 na tela.
