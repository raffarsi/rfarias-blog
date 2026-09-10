---
layout: ../../layouts/PostLayout.astro
title: "Azure Traffic Manager: roteamento global e failover automático para aplicações críticas"
category: "Networking"
tag: "networking"
date: "08 Nov 2025"
readTime: "10 min"
description: "Como configurar o Traffic Manager para distribuir tráfego entre regiões com failover automático, e as diferenças práticas entre os modos Priority, Weighted e Performance."
---

O Azure Traffic Manager é um balanceador de carga DNS global, ele não roteia pacotes, mas responde consultas DNS com o endereço do endpoint mais adequado segundo a política configurada. Para aplicações distribuídas em múltiplas regiões, é o mecanismo de failover automático mais simples de implementar no Azure.

## Como funciona o Traffic Manager

Quando um cliente resolve `meuapp.trafficmanager.net`:

1. O Traffic Manager verifica a saúde de todos os endpoints configurados
2. Aplica a política de roteamento
3. Retorna o IP do endpoint escolhido
4. O cliente conecta diretamente a esse endpoint (Traffic Manager não está no path de dados)

TTL curto (30-60s) é essencial para que o failover seja rápido, o cliente vai cachear a resposta DNS por esse tempo antes de consultar novamente.

## Perfis de roteamento

**Priority**, failover simples:
```bash
az network traffic-manager profile create \
  --name tm-meuapp \
  --resource-group rg-global \
  --routing-method Priority \
  --dns-config-relative-name meuapp \
  --dns-config-ttl 30 \
  --monitor-protocol HTTPS \
  --monitor-port 443 \
  --monitor-path "/health"

# Endpoint primário (Priority 1)
az network traffic-manager endpoint create \
  --name ep-brazilsouth \
  --profile-name tm-meuapp \
  --resource-group rg-global \
  --type azureEndpoints \
  --target-resource-id $(az webapp show -n meuapp-br -g rg-app --query id -o tsv) \
  --priority 1

# Endpoint secundário (Priority 2, ativa só se o primário falhar)
az network traffic-manager endpoint create \
  --name ep-eastus \
  --profile-name tm-meuapp \
  --resource-group rg-global \
  --type azureEndpoints \
  --target-resource-id $(az webapp show -n meuapp-us -g rg-app --query id -o tsv) \
  --priority 2
```

**Performance**, menor latência por região:
```bash
az network traffic-manager profile create \
  --routing-method Performance \
  # Traffic Manager mede latência de cada região para o cliente
  # e retorna o endpoint mais próximo/rápido
```

**Weighted**, distribuição proporcional:
```bash
# Útil para blue/green deployments ou canary releases
az network traffic-manager endpoint create \
  --name ep-v1 --weight 90  # 90% do tráfego

az network traffic-manager endpoint create \
  --name ep-v2 --weight 10  # 10% para a nova versão
```

## Health checks: o que configurar

O Traffic Manager faz health checks HTTP/HTTPS para cada endpoint. Configure um endpoint dedicado que valida toda a stack:

```python
# /health endpoint na aplicação
from fastapi import FastAPI
import httpx

app = FastAPI()

@app.get("/health")
async def health_check():
    # Verificar dependências críticas
    checks = {}
    
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get("https://meu-banco.database.windows.net/ping", timeout=3)
        checks["database"] = "ok" if r.status_code == 200 else "degraded"
    except:
        checks["database"] = "unreachable"
    
    # Se qualquer dependência crítica falhar, retornar 503
    if any(v != "ok" for v in checks.values()):
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=503, content=checks)
    
    return checks
```

<div class="callout">
<strong>Nested profiles:</strong> Combine múltiplos perfis, um perfil Priority no nível superior escolhe entre dois perfis Performance (um por continente). Isso permite roteamento hierárquico: primeiro escolhe a região geográfica, depois o endpoint de menor latência dentro dela.
</div>

## Monitorando falhas

```kql
AzureDiagnostics
| where ResourceType == "TRAFFICMANAGERPROFILES"
| where OperationName == "ProbeResult"
| where ResultDescription != "Ok"
| project TimeGenerated, EndpointName_s, ResultDescription, ProbeResultCode_d
| order by TimeGenerated desc
```

## Traffic Manager vs Azure Front Door

| | Traffic Manager | Azure Front Door |
|---|---|---|
| Tipo | DNS-based | Anycast (layer 7) |
| Failover | ~30-60s (TTL DNS) | <10s |
| WAF | Não | Sim |
| Aceleração de conteúdo | Não | Sim (CDN) |
| Custo | Baixo | Maior |

Use Traffic Manager para failover simples e multi-região. Use Front Door quando precisar de WAF, CDN e failover mais rápido.

## Conclusão

O Traffic Manager é a opção mais simples para alta disponibilidade global no Azure, sem agentes, sem mudanças na aplicação, só configuração DNS. O ponto crítico é o health check endpoint: ele deve validar a stack completa, não apenas que o servidor está respondendo.
