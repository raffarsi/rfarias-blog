---
layout: ../../layouts/PostLayout.astro
title: "Azure AI Foundry: a plataforma unificada para agentes de IA"
category: "IA Generativa"
tag: "ia-generativa"
date: "21 Out 2025"
readTime: "9 min"
description: "Recurso, projetos, catálogo de modelos e avaliação resolvem problemas que uma chamada direta à API não tem. Quando a plataforma compensa e quando ela só acrescenta camada."
---

*Atualizado em setembro de 2026: o Azure AI Foundry hoje se chama Microsoft Foundry, os projetos baseados em Hub viraram modelo clássico e o Prompt Flow está em aposentadoria. O texto abaixo já reflete o modelo atual.*

O primeiro caso de uso de IA generativa dentro de uma empresa quase nunca precisa de plataforma. Alguém provisiona um Azure OpenAI, pega a chave, escreve trinta linhas de Python e mostra o protótipo funcionando na reunião seguinte. Funciona, impressiona, e a conversa vira "vamos colocar em produção".

O problema aparece no terceiro caso de uso.

A essa altura existem três times mexendo com o mesmo recurso, cada um com sua chave, cada um com seu prompt versionado no repositório de alguém. Aí alguém de segurança pergunta quem tem acesso ao modelo. Alguém de finanças pergunta qual área gastou o quê. E alguém de negócio pergunta por que a resposta mudou desde a semana passada.

Ninguém sabe responder. Não porque o time é ruim, mas porque nenhuma dessas perguntas tem onde ser respondida quando cada projeto fala direto com a API.

O Microsoft Foundry, que nasceu como Azure AI Foundry, existe para ser esse lugar.

## O que ele é, na prática

Descrição de marketing você encontra na documentação. O que importa entender é que o Foundry não substitui o Azure OpenAI nem acrescenta inteligência nenhuma ao modelo. Ele coloca uma camada de organização em volta do que você já usaria de qualquer jeito: quais modelos existem, quem pode chamar cada um, com quais dados, sob quais políticas, e quanto isso custou.

É a diferença entre ter três pessoas com a chave do cofre e ter um controle de acesso.

## Recurso e projeto: onde mora a governança

Essa é a parte que mais confunde quem chega, e é a que mais importa.

O **recurso Foundry** é o pai. Nele ficam as coisas que fazem sentido compartilhar: os deployments de modelos, a configuração de rede (acesso público, Private Endpoint), as conexões com serviços como o Azure AI Search, e o controle de acesso. Você configura uma vez, no lugar certo, com quem entende de rede e de identidade junto.

O **projeto** é o espaço de cada time dentro do recurso. Usa os modelos e a rede do recurso, mas mantém separados os agentes, os arquivos, os índices e as avaliações daquele time.

A consequência prática é a que interessa. Quando a auditoria perguntar quem pode chamar o modelo, a resposta está no RBAC do recurso e dos projetos, não espalhada em chaves de API. Quando o time de dados quiser saber qual projeto consumiu mais, o uso já está segmentado. E quando chegar o quarto time, ele não recomeça do zero: ganha um projeto, herda a rede privada e os modelos, e começa a trabalhar.

Quem começou com o modelo anterior, baseado em **Hub**, precisa saber que ele virou "clássico": o portal novo do Foundry não suporta projetos de Hub, e a Microsoft tem um guia de migração para os projetos atuais. Se você está começando agora, não comece por ele.

Um erro comum continua valendo no modelo novo: criar um recurso por projeto. Isso devolve exatamente a bagunça que a plataforma deveria resolver, só que com mais recursos para pagar e mais redes para configurar. A regra que uso é simples: um recurso por fronteira de governança, normalmente por unidade de negócio ou por ambiente, e um projeto por time ou por caso de uso.

## O SDK muda menos do que parece

Quem já escreveu contra o Azure OpenAI costuma achar que vai ter que reescrever tudo. Não vai.

Chamando direto:

```python
from openai import OpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

client = OpenAI(
    base_url="https://oai-producao.openai.azure.com/openai/v1/",
    api_key=get_bearer_token_provider(
        DefaultAzureCredential(), "https://ai.azure.com/.default"
    ),
)
```

Chamando pelo projeto:

```python
import os
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential

project = AIProjectClient(
    endpoint=os.environ["FOUNDRY_PROJECT_ENDPOINT"],  # https://<recurso>.services.ai.azure.com/api/projects/<projeto>
    credential=DefaultAzureCredential(),
)

client = project.get_openai_client()
```

O objeto que você usa para conversar com o modelo é o mesmo. O que mudou foi de onde vem a configuração. No primeiro caso o endpoint está no código. No segundo, o código só conhece o endereço do projeto, e é o projeto que entrega o cliente já configurado.

Parece detalhe. Não é. É o que permite trocar de deployment, mover para outra região ou girar credencial sem abrir pull request em cinco repositórios.

## Catálogo de modelos, orquestração e avaliação

Três recursos que só fazem sentido quando o uso amadurece.

O **Model Catalog** mostra os modelos disponíveis além dos da OpenAI, com a informação que interessa na hora de escolher: janela de contexto, modalidade, forma de cobrança e onde pode ser implantado. Serve para ter a conversa de custo com dados em vez de intuição.

Para orquestrar fluxos com várias etapas, a peça que existia era o **Prompt Flow**. Ele será aposentado em 20 de abril de 2027, e a Microsoft indica o **Microsoft Agent Framework** para desenvolvimento novo. A ideia que vale guardar continua a mesma: o prompt sair do código solto e virar um artefato com versão e histórico.

A **avaliação** é o que mais gente ignora e o que mais faz falta. Rodar um conjunto de perguntas contra métricas como groundedness e relevância, de forma repetível, é o que transforma "achei que ficou melhor" em evidência. Sem isso, toda mudança de prompt é aposta.

## Quando não usar

Vale dizer, porque plataforma também tem custo.

Se é uma aplicação só, mantida por uma pessoa, com um prompt estável e latência crítica, chamar a API direto continua sendo a escolha certa. O Foundry acrescenta uma camada de configuração que, nesse cenário, você paga sem receber nada em troca.

A régua que uso: se você não consegue nomear quem vai fazer a segunda aplicação, ainda não é hora.

## O que eu faria no lugar de quem está começando

Provisione o recurso Foundry com a fronteira certa antes do segundo caso de uso, não depois do quarto. A migração de três projetos que já estão em produção, cada um com sua chave e sua rede, custa muito mais do que acertar isso no começo.

E a pergunta que eu faria para o meu próprio ambiente hoje: se um modelo precisasse ser desativado amanhã por questão de custo ou de política, quantos repositórios você precisaria abrir para descobrir quem o usa?
