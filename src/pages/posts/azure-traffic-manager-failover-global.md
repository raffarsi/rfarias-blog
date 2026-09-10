---
layout: ../../layouts/PostLayout.astro
title: "Azure Traffic Manager: roteamento global e failover automático para aplicações críticas"
category: "Networking"
tag: "networking"
date: "08 Nov 2025"
readTime: "10 min"
description: "Como configurar o Traffic Manager para distribuir tráfego entre regiões com failover automático, e as diferenças práticas entre os modos Priority, Weighted e Performance."
---

Traffic Manager e DNS. So isso. Ele nao roteia pacotes, nao esta no caminho dos dados, nao adiciona latencia as requisicoes. Ele responde consultas DNS com o IP do endpoint mais adequado segundo a politica configurada.

Esse detalhe importa porque define o que voce pode e nao pode fazer com ele.

## Como funciona na pratica

Quando um cliente resolve `meuapp.trafficmanager.net`, o Traffic Manager verifica a saude dos endpoints, aplica a politica de roteamento e retorna o IP do endpoint escolhido. O cliente conecta diretamente a esse endpoint. O Traffic Manager nao esta mais no caminho.

O tempo de failover depende do TTL configurado. Com TTL de 30 segundos, um cliente que acabou de resolver o DNS pode ficar ate 30 segundos conectando ao endpoint com problema antes de consultar novamente e receber o novo IP. Failover de DNS nao e instantaneo.

```bash
az network traffic-manager profile create   --name tm-meuapp   --resource-group rg-global   --routing-method Priority   --dns-config-relative-name meuapp   --dns-config-ttl 30   --monitor-protocol HTTPS   --monitor-port 443   --monitor-path "/health"

# Endpoint primario
az network traffic-manager endpoint create   --name ep-brazilsouth   --profile-name tm-meuapp   --resource-group rg-global   --type azureEndpoints   --target-resource-id $(az webapp show -n meuapp-br -g rg-app --query id -o tsv)   --priority 1

# Endpoint de DR (ativa quando o primario falha)
az network traffic-manager endpoint create   --name ep-eastus   --profile-name tm-meuapp   --resource-group rg-global   --type azureEndpoints   --target-resource-id $(az webapp show -n meuapp-us -g rg-app --query id -o tsv)   --priority 2
```

## O health check que realmente funciona

O Traffic Manager faz health checks no endpoint `/health` que voce configurar. Se o endpoint retornar 200, esta saudavel. Se retornar qualquer outra coisa, esta fora.

O erro mais comum: configurar `/health` que sempre retorna 200 mesmo quando o banco esta fora ou a aplicacao nao consegue processar requisicoes. O Traffic Manager considera o endpoint saudavel e continua enviando trafego para uma instancia que nao consegue servir ninguem.

```python
from fastapi import FastAPI
from fastapi.responses import JSONResponse
import httpx

app = FastAPI()

@app.get("/health")
async def health_check():
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get("https://meu-banco.database.windows.net/ping", timeout=3)
        if r.status_code != 200:
            return JSONResponse(status_code=503, content={"database": "degraded"})
    except:
        return JSONResponse(status_code=503, content={"database": "unreachable"})
    return {"status": "ok"}
```

## Traffic Manager vs Azure Front Door

| | Traffic Manager | Azure Front Door |
|---|---|---|
| Tipo | DNS-based | Anycast (layer 7) |
| Failover | ~30-60s (TTL DNS) | menos de 10s |
| WAF | Nao | Sim |
| CDN | Nao | Sim |
| Custo | Baixo | Maior |

Quando o Traffic Manager resolve: failover multi-regiao simples, aplicacoes que nao precisam de WAF ou CDN, custo e uma restricao real. Quando o Front Door faz mais sentido: voce precisa de failover rapido, WAF global ou aceleracao de conteudo. A diferenca de preço e significativa, entao vale avaliar com base nos requisitos reais, nao no que parece mais completo.
