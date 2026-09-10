---
layout: ../../layouts/PostLayout.astro
title: "Network Policies no AKS: isolamento de tráfego entre pods com Azure CNI"
category: "Networking"
tag: "networking"
date: "10 Nov 2025"
readTime: "10 min"
description: "Por padrão, todos os pods de um cluster AKS se comunicam livremente. Como implementar Network Policies para isolar namespaces e restringir tráfego leste-oeste em ambientes de produção."
---

Por padrão, todos os pods de um cluster AKS se comunicam livremente entre si — qualquer pod pode chamar qualquer outro, independente do namespace. Em produção, especialmente em ambientes com múltiplas equipes ou classificações de dados diferentes, isso é um risco de movimento lateral.

Network Policies são o mecanismo nativo do Kubernetes para definir quais pods podem se comunicar entre si. No AKS com Azure CNI, as políticas são implementadas pelo Azure NPM (Network Policy Manager) diretamente no kernel do nó.

## Pré-requisito: habilitar Network Policy na criação do cluster

Network Policy não pode ser habilitada em clusters existentes sem recriação:

```bash
az aks create \
  --name aks-producao \
  --resource-group rg-ia \
  --network-plugin azure \
  --network-policy azure \    # ou 'calico'
  --vnet-subnet-id $SUBNET_ID
```

## Política de default deny — isolar tudo primeiro

A abordagem recomendada é começar negando tudo e liberar explicitamente:

```yaml
# default-deny-all.yaml — aplicar em cada namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: ia-producao
spec:
  podSelector: {}        # seleciona todos os pods do namespace
  policyTypes:
  - Ingress
  - Egress
```

Depois de aplicar, **nenhum pod** do namespace `ia-producao` consegue receber ou enviar tráfego até você criar políticas explícitas.

## Liberando tráfego específico

```yaml
# Permitir que o agente de IA chame o Azure OpenAI via Private Endpoint
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-agent-to-openai
  namespace: ia-producao
spec:
  podSelector:
    matchLabels:
      app: agente-ia          # só pods com esse label
  policyTypes:
  - Egress
  egress:
  - to:
    - ipBlock:
        cidr: 10.1.2.0/26    # subnet dos Private Endpoints
    ports:
    - protocol: TCP
      port: 443
---
# Permitir que o frontend chame apenas o agente, não o banco
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-agent
  namespace: ia-producao
spec:
  podSelector:
    matchLabels:
      app: agente-ia
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend       # só o frontend pode chamar o agente
    ports:
    - protocol: TCP
      port: 8080
```

## Isolamento entre namespaces

```yaml
# Bloquear tráfego entre namespaces de domínios diferentes
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-cross-namespace
  namespace: ia-rh
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: ia-rh  # só do mesmo namespace
```

## Liberando DNS e monitoring

Não esqueça de liberar o DNS (kube-dns) e o Azure Monitor, senão os pods ficam sem resolução de nomes e sem métricas:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns-egress
  namespace: ia-producao
spec:
  podSelector: {}
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
```

<div class="callout">
<strong>Testando antes de aplicar:</strong> Use <code>kubectl exec</code> para validar conectividade antes e depois de aplicar políticas. O comando <code>nc -zv ip porta</code> dentro de um pod mostra rapidamente se a conexão está aberta ou bloqueada — muito mais rápido que depurar via logs de aplicação.
</div>

## Conclusão

Network Policies no AKS são o equivalente de NSGs para comunicação entre pods. O padrão default-deny-all seguido de liberações explícitas é o mais seguro e mais fácil de auditar — você sabe exatamente quais comunicações são permitidas porque estão documentadas em YAML versionado no Git.
