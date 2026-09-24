---
layout: ../../layouts/PostLayout.astro
title: "Grounding com dados corporativos: conectando Azure OpenAI à base de conhecimento"
category: "IA Generativa"
tag: "ia-generativa"
date: "02 Dez 2025"
readTime: "5 min"
description: "Grounding reduz a alucinação, mas não resolve sozinho. O assistente pode responder com o documento errado, com o documento vencido ou com um documento que a pessoa não deveria ver. Como montar o grounding para que a resposta seja certa, atual e permitida."
---

Um time me procurou porque o assistente de políticas internas tinha informado, com toda a segurança, uma regra de viagens que não valia mais. O modelo não inventou nada. Ele leu a política de dois anos atrás, que continuava no índice ao lado da versão nova, e respondeu com base nela.

Esse caso resume bem o que grounding é e o que ele não é. Grounding é dar ao modelo os fatos certos no momento da pergunta, para que ele responda com base neles e não no que aprendeu no treinamento. Funciona. Mas "os fatos certos" carrega três exigências que costumam ficar de fora do primeiro protótipo: o documento precisa ser relevante, atual e permitido para quem perguntou.

## O que o grounding resolve, e o que não resolve

Um modelo sem contexto externo, diante de uma pergunta sobre a sua empresa, faz uma de duas coisas: diz que não sabe, ou inventa algo plausível. A segunda é a perigosa, porque parece correta.

Com grounding, você busca os trechos relevantes na sua base e entrega ao modelo junto com a pergunta, com a instrução de responder só com base neles. A alucinação cai muito. Não zera: o modelo ainda pode combinar dois trechos de forma errada, ou completar uma lacuna com o que sabe. E, como no caso da abertura, ele pode responder perfeitamente com base no trecho errado.

Por isso eu trato grounding como um pipeline com quatro responsabilidades, não como uma chamada única:

**Encontrar o trecho certo.** Busca híbrida, vetor mais palavra-chave, com reordenação semântica.

**Filtrar o que não vale.** Documento vencido e documento que o usuário não pode ver saem antes de chegar ao modelo.

**Mostrar a fonte.** Cada afirmação da resposta aponta para o trecho de onde veio.

**Saber dizer que não sabe.** Sem trecho relevante, a resposta é "não encontrei", não um palpite.

## O pipeline em código

O exemplo usa o Azure AI Search e o Azure OpenAI pela API v1. O que importa está no filtro e na montagem do contexto:

```python
from openai import OpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizedQuery

credencial = DefaultAzureCredential()
cliente_openai = OpenAI(
    base_url="https://oai-producao.openai.azure.com/openai/v1/",
    api_key=get_bearer_token_provider(credencial, "https://ai.azure.com/.default"),
)
busca = SearchClient(
    endpoint="https://search-prod.search.windows.net",
    index_name="base-conhecimento",
    credential=credencial,
)

INSTRUCOES = (
    "Você é o assistente de políticas internas. "
    "Responda somente com base nos trechos numerados. "
    "Cite a fonte de cada afirmação no formato [1], [2]. "
    'Se a resposta não estiver nos trechos, diga: "Não encontrei isso nas políticas publicadas."'
)


def responder(pergunta: str, grupos_do_usuario: list[str]) -> dict:
    vetor = cliente_openai.embeddings.create(
        model="text-embedding-3-large", input=pergunta
    ).data[0].embedding

    # Só documentos vigentes e liberados para algum grupo do usuário.
    # Use os IDs dos grupos (GUIDs) e deixe a vírgula explícita como delimitador.
    filtro = "vigente eq true and grupos_permitidos/any(g: search.in(g, '{}', ','))".format(
        ",".join(g.replace("'", "''") for g in grupos_do_usuario)
    )

    trechos = list(busca.search(
        search_text=pergunta,
        vector_queries=[VectorizedQuery(vector=vetor, k_nearest_neighbors=20, fields="conteudo_vetor")],
        filter=filtro,
        query_type="semantic",
        semantic_configuration_name="padrao",
        select=["titulo", "conteudo", "url", "versao"],
        top=5,
    ))

    if not trechos:
        return {"resposta": "Não encontrei isso nas políticas publicadas.", "fontes": []}

    contexto = "\n\n".join(
        f"[{i}] {t['titulo']} (versão {t['versao']})\n{t['conteudo']}"
        for i, t in enumerate(trechos, start=1)
    )
    resposta = cliente_openai.responses.create(
        model="chat-prod",
        instructions=INSTRUCOES,
        input=f"Trechos:\n{contexto}\n\nPergunta: {pergunta}",
        temperature=0.1,
    )
    return {
        "resposta": resposta.output_text,
        "fontes": [{"n": i, "titulo": t["titulo"], "url": t["url"]} for i, t in enumerate(trechos, start=1)],
    }
```

Três detalhes que fazem diferença. Os grupos do usuário vêm do token de login (ou do Microsoft Graph, quando o token não traz todos os grupos), nunca do corpo da requisição. Quando a busca não traz nada, o código responde sem chamar o modelo, o que é mais barato e mais honesto. E a temperatura baixa mantém o modelo perto do texto: aqui o objetivo é fidelidade, não criatividade.

## Permissão por documento

O filtro de segurança do exemplo é o padrão consolidado no Azure AI Search, e a alternativa recomendada enquanto o controle nativo não é GA: cada trecho carrega, num campo filtrável, os grupos que podem vê-lo, e a busca filtra pelos grupos de quem perguntou. É simples, é GA e funciona bem quando a indexação preenche esse campo a partir das permissões da origem.

O AI Search também tem hoje controle de acesso nativo por documento, usando as permissões do Microsoft Entra e ACLs de origens como o SharePoint, com o token do usuário passado na consulta. Essa parte ainda está em preview. Para produção em ambiente regulado, eu fico com o filtro de segurança e acompanho o nativo.

O ponto que não muda: se a permissão não é aplicada na busca, ela não existe. Instrução no prompt dizendo "não mostre documentos confidenciais" não é controle de acesso. Escrevi mais sobre essa decisão no artigo sobre [Assistants API e RAG customizado](/posts/azure-openai-assistants-api/).

## Versão e vigência

O erro da abertura é o mais comum que eu vejo em bases de conhecimento corporativas: documento substituído que continua no índice. Três cuidados resolvem a maior parte:

**Metadados de vigência.** Cada documento indexado carrega versão e se está vigente. O filtro `vigente eq true` tira o antigo da busca sem apagar o histórico.

**Exclusão que acompanha a origem.** Documento apagado ou arquivado na origem precisa sair do índice. Com indexadores do AI Search, isso depende de configurar a política de detecção de exclusão; com um pipeline próprio, é uma etapa que precisa existir de propósito.

**Versão visível na resposta.** Mostrar "versão 3, de março" junto da fonte faz o próprio usuário perceber quando algo está desatualizado.

## Citação de fonte

Pedir ao modelo que cite `[1]`, `[2]` e devolver a lista de fontes junto com a resposta tem dois ganhos. O usuário consegue conferir. E você consegue auditar: quando alguém reclama de uma resposta, dá para ver qual trecho a sustentou e se o problema foi a busca ou a geração.

Para uma camada extra, o Azure AI Content Safety tem detecção de groundedness, que compara a resposta com os trechos e aponta afirmações sem apoio neles. Parte da documentação ainda marca o recurso como preview, então eu uso como verificação amostral e alerta, não como bloqueio em produção.

## Três erros que eu vejo com frequência

**Trecho sem contexto.** O chunking corta o documento no meio de uma seção, e o trecho "o prazo é de 30 dias" chega ao modelo sem dizer prazo de quê. Repetir o título do documento e da seção em cada trecho resolve boa parte disso.

**Contexto demais.** Mandar vinte trechos "para garantir" dilui o que importa e aumenta custo e latência. Cinco trechos bem ranqueados costumam responder melhor que vinte.

**Não medir o "não encontrei".** A taxa de perguntas sem trecho relevante é o melhor indicador de que a base parou de cobrir o que as pessoas perguntam. Se ela não aparece em nenhum painel, ninguém percebe.

## O que fica

Grounding bem feito não é só conectar o modelo a uma base. É garantir que o trecho que chega ao modelo é o certo, o atual e o permitido, e que a resposta mostra de onde veio.

No seu assistente, se uma política fosse substituída hoje, quanto tempo a versão antiga continuaria respondendo?
