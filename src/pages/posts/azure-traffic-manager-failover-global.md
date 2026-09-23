---
layout: ../../layouts/PostLayout.astro
title: "Azure Traffic Manager: roteamento global e failover automático para aplicações críticas"
category: "Networking"
tag: "networking"
date: "08 Nov 2025"
readTime: "10 min"
description: "Como configurar o Traffic Manager para distribuir tráfego entre regiões com failover automático, e as diferenças práticas entre os modos Priority, Weighted e Performance."
---

Traffic Manager e DNS. Só isso. Ele não roteia pacotes, não está no caminho dos dados, não adiciona latência as requisições. Ele responde consultas DNS com o IP do endpoint mais adequado segundo a política configurada.

Esse detalhe importa porque define o que você pode e não pode fazer com ele.

## Como funciona na prática

Quando um cliente resolve `meuapp.trafficmanager.net`, o Traffic Manager verifica a saúde dos endpoints, aplica a política de roteamento e retorna o IP do endpoint escolhido. O cliente conecta diretamente a esse endpoint. O Traffic Manager não está mais no caminho.

O tempo de failover depende do TTL configurado. Com TTL de 30 segundos, um cliente que acabou de resolver o DNS pode ficar até 30 segundos conectando ao endpoint com problema antes de consultar novamente e receber o novo IP. Failover de DNS não é instantâneo.

```bash
az network traffic-manager profile create   --name tm-meuapp   --resource-group rg-global   --routing-method Priority   --dns-config-relative-name meuapp   --dns-config-ttl 30   --monitor-protocol HTTPS   --monitor-port 443   --monitor-path "/health"

# Endpoint primario
az network traffic-manager endpoint create   --name ep-brazilsouth   --profile-name tm-meuapp   --resource-group rg-global   --type azureEndpoints   --target-resource-id $(az webapp show -n meuapp-br -g rg-app --query id -o tsv)   --priority 1

# Endpoint de DR (ativa quando o primario falha)
az network traffic-manager endpoint create   --name ep-eastus   --profile-name tm-meuapp   --resource-group rg-global   --type azureEndpoints   --target-resource-id $(az webapp show -n meuapp-us -g rg-app --query id -o tsv)   --priority 2
```

## O health check que realmente funciona

O Traffic Manager faz health checks no endpoint `/health` que você configurar. Se o endpoint retornar 200, está saudável. Se retornar qualquer outra coisa, está fora.

O erro mais comum: configurar `/health` que sempre retorna 200 mesmo quando o banco está fora ou a aplicação não consegue processar requisições. O Traffic Manager considera o endpoint saudável e continua enviando tráfego para uma instância que não consegue servir ninguém.

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
| WAF | Não | Sim |
| CDN | Não | Sim |
| Custo | Baixo | Maior |

Quando o Traffic Manager resolve: failover multi-região simples, aplicações que não precisam de WAF ou CDN, custo é uma restrição real. Quando o Front Door faz mais sentido: você precisa de failover rápido, WAF global ou aceleração de conteúdo. A diferença de preço é significativa, então vale avaliar com base nos requisitos reais, não no que parece mais completo.
