---
layout: ../../layouts/PostLayout.astro
title: "Azure AI Foundry: a plataforma unificada para agentes de IA"
category: "IA Generativa"
tag: "ia-generativa"
date: "21 Out 2025"
readTime: "9 min"
description: "Hub, Project, Model Catalog e Prompt Flow resolvem problemas que uma chamada direta à API não tem. Quando a plataforma compensa e quando ela só acrescenta camada."
---

O primeiro caso de uso de IA generativa dentro de uma empresa quase nunca precisa de plataforma. Alguém provisiona um Azure OpenAI, pega a chave, escreve trinta linhas de Python e mostra o protótipo funcionando na reunião seguinte. Funciona, impressiona, e a conversa vira "vamos colocar em produção".

O problema aparece no terceiro caso de uso.

A essa altura existem três times mexendo com o mesmo recurso, cada um com sua chave, cada um com seu prompt versionado no repositório de alguém. Aí alguém de segurança pergunta quem tem acesso ao modelo. Alguém de finanças pergunta qual área gastou o quê. E alguém de negócio pergunta por que a resposta mudou desde a semana passada.

Ninguém sabe responder. Não porque o time é ruim, mas porque nenhuma dessas perguntas tem onde ser respondida quando cada projeto fala direto com a API.

O Azure AI Foundry existe para ser esse lugar.

## O que ele é, na prática

Descrição de marketing você encontra na documentação. O que importa entender é que o AI Foundry não substitui o Azure OpenAI nem acrescenta inteligência nenhuma ao modelo. Ele coloca uma camada de organização em volta do que você já usaria de qualquer jeito: quais modelos existem, quem pode chamar cada um, com quais dados, sob quais políticas, e quanto isso custou.

É a diferença entre ter três pessoas com a chave do cofre e ter um controle de acesso.

## Hub e Project: onde mora a governança

Essa é a parte que mais confunde quem chega, e é a que mais importa.

O **Hub** é o recurso pai. Nele ficam as coisas que fazem sentido compartilhar: as conexões com Azure OpenAI e Azure AI Search, a Storage Account, o Key Vault, a configuração de rede, as políticas de segurança. Você configura uma vez, no lugar certo, com quem entende de rede e de identidade junto.

O **Project** é o espaço de cada time dentro do Hub. Herda as conexões e as políticas, mas mantém separados os prompts, os índices, as avaliações e os deployments daquele time.

A consequência prática é a que interessa. Quando a auditoria perguntar quem pode chamar o modelo, a resposta está no RBAC do Hub, não espalhada em chaves de API. Quando o time de dados quiser saber qual projeto consumiu mais tokens, o custo já está segmentado por Project. E quando chegar o quarto time, ele não recomeça do zero: cria um Project, herda a rede privada e as conexões, e começa a trabalhar.

Um erro comum aqui é criar um Hub por projeto. Isso devolve exatamente a bagunça que o Hub deveria resolver, só que com mais recursos para pagar. A regra que uso é simples: um Hub por fronteira de governança, normalmente por unidade de negócio ou por ambiente, e um Project por time ou por caso de uso.

## O SDK muda menos do que parece

Quem já escreveu contra o Azure OpenAI costuma achar que vai ter que reescrever tudo. Não vai.

Chamando direto:

```python
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

client = AzureOpenAI(
    azure_endpoint='https://oai-producao.openai.azure.com',
    azure_ad_token_provider=get_bearer_token_provider(
        DefaultAzureCredential(), 'https://cognitiveservices.azure.com/.default'
    ),
    api_version='2024-02-01',
)
```

Chamando pelo Project:

```python
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential

project = AIProjectClient.from_connection_string(
    conn_str=os.environ['AZURE_AI_PROJECT_CONNECTION_STRING'],
    credential=DefaultAzureCredential(),
)

client = project.inference.get_azure_openai_client(api_version='2024-02-01')
```

O objeto que você usa para conversar com o modelo é o mesmo. O que mudou foi de onde vem a configuração. No primeiro caso o endpoint está no código. No segundo, o código pede ao Project e o Project responde com a conexão que o Hub configurou.

Parece detalhe. Não é. É o que permite trocar de deployment, mover para outra região ou girar credencial sem abrir pull request em cinco repositórios.

## Model Catalog, Prompt Flow e avaliação

Três recursos que só fazem sentido quando o uso amadurece.

O **Model Catalog** mostra os modelos disponíveis além dos da OpenAI, com a informação que interessa na hora de escolher: janela de contexto, modalidade, forma de cobrança e onde pode ser implantado. Serve para ter a conversa de custo com dados em vez de intuição.

O **Prompt Flow** é a orquestração visual e versionada de um fluxo com várias etapas. O ganho real não é o desenho bonito, é o prompt sair do código e virar um artefato com histórico.

A **avaliação** é o que mais gente ignora e o que mais faz falta. Rodar um conjunto de perguntas contra métricas como groundedness e relevância, de forma repetível, é o que transforma "achei que ficou melhor" em evidência. Sem isso, toda mudança de prompt é aposta.

## Quando não usar

Vale dizer, porque plataforma também tem custo.

Se é uma aplicação só, mantida por uma pessoa, com um prompt estável e latência crítica, chamar a API direto continua sendo a escolha certa. O AI Foundry acrescenta uma camada de configuração que, nesse cenário, você paga sem receber nada em troca.

A régua que uso: se você não consegue nomear quem vai fazer a segunda aplicação, ainda não é hora.

## O que eu faria no lugar de quem está começando

Provisione o Hub antes do segundo caso de uso, não depois do quarto. A migração de três projetos que já estão em produção, cada um com sua chave e sua rede, custa muito mais do que configurar a fronteira certa no começo.

E a pergunta que eu faria para o meu próprio ambiente hoje: se um modelo precisasse ser desativado amanhã por questão de custo ou de política, quantos repositórios você precisaria abrir para descobrir quem o usa?
