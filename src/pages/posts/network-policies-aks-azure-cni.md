---
layout: ../../layouts/PostLayout.astro
title: "Network Policies no AKS: isolamento de tráfego entre pods com Azure CNI"
category: "Networking"
tag: "networking"
date: "10 Nov 2025"
readTime: "10 min"
description: "Por padrão, todos os pods de um cluster AKS se comunicam livremente. Como implementar Network Policies para isolar namespaces e restringir tráfego leste-oeste em ambientes de produção."
---

Por padrao, todos os pods de um cluster AKS se comunicam livremente. O pod do frontend consegue chamar diretamente o banco de dados. O pod de um namespace consegue chamar servicos de outro. Num ambiente de desenvolvimento isso e conveniente. Em producao com dados sensiveis ou multiplas equipes, e um risco.

Network Policies sao o mecanismo para definir exatamente quem pode falar com quem.

## Pre-requisito que nao da para ignorar

Network Policy nao pode ser habilitada em clusters existentes sem recriacao. Se o cluster ja existe sem Network Policy, voce vai precisar recriar para habilitar. Decida isso antes de subir o primeiro cluster.

```bash
az aks create   --name aks-producao   --resource-group rg-ia   --network-plugin azure   --network-policy azure   --vnet-subnet-id $SUBNET_ID
```

## Default deny: comece bloqueando tudo

A abordagem que funciona: começa negando tudo no namespace, depois abre explicitamente o que precisa.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: ia-producao
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

## Abrindo trafego especifico

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-agent-to-endpoints
  namespace: ia-producao
spec:
  podSelector:
    matchLabels:
      app: agente-ia
  policyTypes:
  - Egress
  egress:
  - to:
    - ipBlock:
        cidr: 10.1.2.0/26
    ports:
    - protocol: TCP
      port: 443
```

## Nao esqueca o DNS

Depois de aplicar default deny, os pods param de resolver nomes. Isso quebra praticamente tudo.

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

Aplique essa politica antes ou junto com o default deny.

```bash
# Testando dentro de um pod
kubectl exec -it pod-teste -n ia-producao -- nc -zv 10.1.2.4 443
```

Network Policies sao o equivalente de NSGs para comunicacao entre pods. Default-deny-all seguido de liberacoes explicitas em YAML versionado no Git e o mais facil de auditar: voce sabe o que e permitido porque esta documentado em codigo.
