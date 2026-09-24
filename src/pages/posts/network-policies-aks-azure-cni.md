---
layout: ../../layouts/PostLayout.astro
title: "Network Policies no AKS: isolamento de tráfego entre pods com Azure CNI"
category: "Networking"
tag: "networking"
date: "10 Nov 2025"
readTime: "5 min"
description: "Por padrão, todo pod de um cluster AKS fala com todo pod. Qual motor de política escolher, como começar bloqueando tudo sem derrubar o DNS e como controlar a saída por nome de domínio."
---

O pod do frontend abre uma conexão direto com o banco de dados. Um pod de um namespace chama o serviço interno de outro time. Nada disso foi planejado, e nada disso é bloqueado: por padrão, todo pod de um cluster Kubernetes fala com todo pod.

Em desenvolvimento, isso é conveniente. Em produção, com dados sensíveis ou mais de um time no mesmo cluster, é o equivalente a uma rede plana sem NSG. Se um pod for comprometido, ele alcança todo o resto.

Network Policies são o mecanismo do Kubernetes para dizer quem pode falar com quem. No AKS, a decisão que vem antes do primeiro YAML é qual motor vai aplicar essas regras.

## Escolhendo o motor de política

O AKS oferece três motores:

**Azure Network Policy Manager (NPM).** O motor original da Microsoft. Está em aposentadoria: no Windows, o suporte termina em 30 de setembro de 2026; no Linux, em 30 de setembro de 2028. Não é uma boa escolha para cluster novo.

**Calico.** Motor de código aberto, maduro, com recursos além do padrão do Kubernetes. Continua suportado.

**Cilium, com o Azure CNI Powered by Cilium.** É o que a Microsoft recomenda hoje. Usa eBPF no lugar de iptables, o que escala melhor em clusters grandes, e é a base para políticas por nome de domínio e de camada 7.

Para um cluster novo, eu começo com Azure CNI em modo overlay e o dataplane Cilium:

```bash
az aks create \
  --name aks-producao \
  --resource-group rg-plataforma \
  --location brazilsouth \
  --network-plugin azure \
  --network-plugin-mode overlay \
  --pod-cidr 192.168.0.0/16 \
  --network-dataplane cilium \
  --generate-ssh-keys
```

Com o dataplane Cilium, a aplicação das Network Policies já vem junto. Não é preciso escolher um motor separado.

## E se o cluster já existe sem política

Durante muito tempo, habilitar network policy exigia recriar o cluster. Hoje dá para ativar o NPM ou o Calico num cluster existente com `az aks update --network-policy`, e migrar para o Cilium com `az aks update --network-dataplane cilium`, que remove o motor anterior. Os dois têm um custo operacional: a imagem de todos os pools de nós é recriada ao mesmo tempo, sem opção de fazer um pool por vez, e o Cilium só passa a aplicar as políticas depois que todos os nós terminam. A migração para o Cilium também não é possível em clusters com pools Windows. Planeje como uma janela de manutenção, não como um ajuste rápido.

## Comece bloqueando tudo

A abordagem que funciona é a mesma de um firewall: negar tudo no namespace e liberar explicitamente o que precisa.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: pagamentos
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

`podSelector: {}` seleciona todos os pods do namespace. Com os dois tipos de política listados e nenhuma regra, nada entra e nada sai.

## Não esqueça o DNS

Esse é o erro mais comum que eu vejo depois do default deny: os pods param de resolver nomes, e quase tudo quebra ao mesmo tempo. A liberação do DNS vai junto com o bloqueio, nunca depois:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: pagamentos
spec:
  podSelector: {}
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
```

## Liberando o que precisa, por identidade do pod

Com o bloqueio no lugar, cada fluxo vira uma regra. A melhor forma de escrever é por label, não por IP, porque o IP do pod muda a cada reinício:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-para-banco
  namespace: pagamentos
spec:
  podSelector:
    matchLabels:
      app: banco
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api
    ports:
    - protocol: TCP
      port: 5432
```

A regra diz: o banco só aceita conexões na porta 5432, e só de pods com a label `app: api`. O frontend, que tinha acesso direto na abertura, perdeu esse caminho.

Para destinos fora do cluster, como Private Endpoints de serviços PaaS, a regra de saída usa `ipBlock` com a faixa da sub-rede de Private Endpoints. Com o Cilium, o `ipBlock` não serve para liberar IPs de nós ou de pods; para esses casos, use seletores de pod e de namespace.

## Saída por nome de domínio

A Network Policy padrão só entende IP e porta. Isso é um problema para a saída para a internet: liberar uma API externa por IP é frágil, porque os IPs mudam.

Com o dataplane Cilium e o Advanced Container Networking Services (ACNS) habilitado, dá para escrever políticas de saída por FQDN e regras de camada 7, como permitir só determinados caminhos HTTP. O ACNS é cobrado por nó, então vale habilitar onde a exigência de controle de saída justifica, e não por padrão em todo cluster.

## Três erros que eu vejo com frequência

**Default deny sem DNS.** Já descrito acima, e responsável pela maioria dos rollbacks de política.

**Política só de entrada.** Proteger o banco contra quem chega e deixar todo pod sair para qualquer destino resolve metade do problema. Um pod comprometido continua podendo exfiltrar dados.

**Política fora do Git.** Regra aplicada à mão com `kubectl apply` e nunca versionada vira uma configuração que ninguém sabe explicar seis meses depois. As políticas vivem no mesmo repositório dos manifests da aplicação e passam por revisão.

## Como testar

Antes de ir para produção, teste cada fluxo que precisa funcionar e um que não deveria:

```bash
# Deve funcionar: a API chega ao banco
kubectl exec -n pagamentos deploy/api -- nc -zv banco 5432

# Deve falhar: o frontend não chega ao banco
kubectl exec -n pagamentos deploy/frontend -- nc -zv -w 3 banco 5432
```

O segundo teste é o que mais importa. Uma política que nunca foi vista bloqueando algo não foi testada.

## O que fica

Network Policy no AKS é o equivalente ao NSG para o tráfego entre pods, e ela só funciona com um motor por trás. Para cluster novo, Cilium; para cluster existente, uma janela de manutenção para ativar. Depois, bloqueio total, DNS liberado e cada fluxo escrito em código.

No seu cluster de produção, qual pod conseguiria chegar ao banco de dados hoje sem precisar?
