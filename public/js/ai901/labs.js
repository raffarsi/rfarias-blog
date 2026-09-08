// ============================================================================
// AI-901 Prep Hub — Banco de Laboratórios Práticos (js/labs.js)
// 10 laboratórios guiados no portal do Microsoft Foundry (ai.azure.com),
// cobrindo os 10 domínios do banco de questões. Cada lab assume que o aluno
// já possui uma assinatura Azure ativa (não inclui passos de criação de
// conta) e vai direto para a prática dentro do Foundry.
// Estrutura idêntica à do AZ-900: {id, icon, title, domain, objective,
// steps[], quiz[3 itens com opts[4]/correct/exp]}.
// ============================================================================

const LAB_BANK = [
  {
    id: 1,
    icon: "🗂️",
    title: "Explorar o Catálogo de Modelos",
    domain: "Fundamentos do Microsoft Foundry e Prompts",
    objective: "Navegar pelo Catálogo de Modelos do Microsoft Foundry e comparar modelos de fundação disponíveis.",
    steps: [
      "Acesse o portal do Microsoft Foundry em ai.azure.com e entre no seu projeto (ou crie um novo projeto, caso ainda não tenha um).",
      "No menu lateral, abra 'Catálogo de Modelos' (Model Catalog).",
      "Use os filtros por 'Modality' (texto, imagem, fala) e 'Provider' para restringir a lista de modelos.",
      "Selecione um modelo, como o GPT-4o ou o Phi-3, e abra a página de detalhes do modelo.",
      "Compare as informações de 'Licença', 'Janela de contexto' (context window) e 'Casos de uso recomendados' entre dois modelos diferentes.",
    ],
    quiz: [
      {
        q: "Qual é a principal função do Catálogo de Modelos no Microsoft Foundry?",
        opts: [
          "Armazenar backups de dados dos projetos",
          "Permitir a descoberta e comparação de modelos de fundação disponíveis para implantação",
          "Gerenciar o faturamento da assinatura Azure",
          "Configurar regras de firewall da rede virtual",
        ],
        correct: 1,
        exp: [
          "Incorreto — o catálogo não lida com backups.",
          "Correto — o catálogo centraliza modelos de fundação de diversos provedores para descoberta e comparação.",
          "Incorreto — faturamento é tratado em outra área do portal Azure.",
          "Incorreto — não é uma ferramenta de rede.",
        ],
      },
      {
        q: "O que representa a 'janela de contexto' (context window) de um modelo de linguagem?",
        opts: [
          "O tempo máximo de resposta do modelo",
          "A quantidade de tokens que o modelo consegue considerar em uma única interação",
          "O número de usuários simultâneos suportados",
          "O custo por requisição do modelo",
        ],
        correct: 1,
        exp: [
          "Incorreto — não se refere a tempo de resposta.",
          "Correto — é a quantidade de tokens (entrada + saída) que o modelo consegue processar de uma vez.",
          "Incorreto — não mede concorrência de usuários.",
          "Incorreto — não é uma métrica de custo.",
        ],
      },
      {
        q: "Além de modelos de texto, que outros tipos de modalidade podem aparecer no Catálogo de Modelos?",
        opts: [
          "Apenas modelos de texto estão disponíveis",
          "Modelos de imagem, fala e visão, entre outros",
          "Somente modelos de aprendizado por reforço",
          "Apenas modelos de séries temporais",
        ],
        correct: 1,
        exp: [
          "Incorreto — o catálogo é multimodal.",
          "Correto — o catálogo inclui modelos de texto, imagem, fala, visão e mais.",
          "Incorreto — não é o foco do catálogo.",
          "Incorreto — não é o foco do catálogo.",
        ],
      },
    ],
  },
  {
    id: 2,
    icon: "💬",
    title: "Testar Prompts no Playground",
    domain: "Fundamentos do Microsoft Foundry e Prompts",
    objective: "Usar o Playground do Foundry para testar prompts e ajustar parâmetros de geração.",
    steps: [
      "Dentro do seu projeto no Foundry, abra 'Playground' > 'Chat'.",
      "Selecione um modelo de chat implantado (ou implante um modelo gratuito/de baixo custo, como o gpt-4o-mini).",
      "Escreva uma mensagem de sistema (system message) definindo o comportamento do assistente, por exemplo: 'Você é um assistente que responde apenas sobre Azure'.",
      "Envie um prompt de usuário e observe a resposta gerada.",
      "Ajuste o parâmetro 'Temperature' para um valor alto (ex.: 1.0) e reenvie o mesmo prompt; compare a variação da resposta com uma Temperature baixa (ex.: 0.1).",
    ],
    quiz: [
      {
        q: "Qual o efeito de aumentar o parâmetro Temperature em um modelo generativo?",
        opts: [
          "Reduz o custo por token",
          "Aumenta a aleatoriedade e criatividade das respostas",
          "Aumenta a velocidade de resposta do modelo",
          "Diminui o tamanho máximo da resposta",
        ],
        correct: 1,
        exp: [
          "Incorreto — não afeta custo.",
          "Correto — Temperature mais alta torna as respostas mais variadas e criativas; mais baixa, mais previsíveis.",
          "Incorreto — não afeta velocidade.",
          "Incorreto — não limita o tamanho da resposta.",
        ],
      },
      {
        q: "Qual é o papel da 'mensagem de sistema' (system message) em um prompt de chat?",
        opts: [
          "Define o comportamento e as regras gerais que o assistente deve seguir na conversa",
          "Registra erros técnicos do servidor",
          "Armazena o histórico de faturamento",
          "Define a região de hospedagem do modelo",
        ],
        correct: 0,
        exp: [
          "Correto — a mensagem de sistema orienta o tom, o escopo e as regras do assistente.",
          "Incorreto — não é um log de erros.",
          "Incorreto — não tem relação com faturamento.",
          "Incorreto — não define região.",
        ],
      },
      {
        q: "Por que é útil testar prompts no Playground antes de integrá-los via código?",
        opts: [
          "Porque o Playground é a única forma de implantar um modelo",
          "Porque permite iterar rapidamente sobre o prompt e os parâmetros sem escrever código",
          "Porque o Playground treina um novo modelo automaticamente",
          "Porque reduz o número de tokens cobrados para sempre",
        ],
        correct: 1,
        exp: [
          "Incorreto — a implantação pode ser feita de outras formas também.",
          "Correto — o Playground acelera a experimentação de prompts e parâmetros antes da integração via SDK.",
          "Incorreto — o Playground não treina modelos.",
          "Incorreto — não altera o custo por token permanentemente.",
        ],
      },
    ],
  },
  {
    id: 3,
    icon: "🚀",
    title: "Implantar um Modelo e Obter um Endpoint",
    domain: "Agentes e Apps com Foundry SDK",
    objective: "Implantar um modelo de linguagem no Foundry e localizar as informações de endpoint e chave para uso via código.",
    steps: [
      "No seu projeto do Foundry, abra 'Implantações' (Deployments) e clique em 'Nova implantação'.",
      "Escolha um modelo do catálogo (ex.: gpt-4o-mini) e confirme a implantação.",
      "Aguarde o status da implantação mudar para 'Succeeded'.",
      "Abra os detalhes da implantação e localize a 'Target URI' (endpoint) e a chave de API.",
      "Anote esses valores — eles serão usados para chamar o modelo a partir do Foundry SDK ou de uma requisição REST.",
    ],
    quiz: [
      {
        q: "O que é necessário obter após implantar um modelo no Foundry para poder chamá-lo via código?",
        opts: [
          "Apenas o nome do projeto",
          "O endpoint (Target URI) e a chave de API (ou credencial equivalente)",
          "O número de tokens contratados",
          "O endereço IP do datacenter",
        ],
        correct: 1,
        exp: [
          "Incorreto — só o nome do projeto não é suficiente.",
          "Correto — o endpoint e a chave/credencial são necessários para autenticar as chamadas.",
          "Incorreto — não existe 'número de tokens contratados' como credencial.",
          "Incorreto — o IP do datacenter não é usado diretamente.",
        ],
      },
      {
        q: "O que indica o status 'Succeeded' em uma implantação de modelo?",
        opts: [
          "Que o modelo foi excluído",
          "Que a implantação está pronta e o modelo pode receber requisições",
          "Que houve uma falha de autenticação",
          "Que o modelo está sendo treinado do zero",
        ],
        correct: 1,
        exp: [
          "Incorreto — não indica exclusão.",
          "Correto — 'Succeeded' significa que a implantação está ativa e pronta para uso.",
          "Incorreto — não indica falha.",
          "Incorreto — implantar um modelo de catálogo não é treiná-lo do zero.",
        ],
      },
      {
        q: "Qual componente do Foundry SDK normalmente usa o endpoint e a chave da implantação?",
        opts: [
          "O cliente que envia as chamadas de inferência ao modelo implantado",
          "O painel de faturamento da assinatura",
          "O serviço de backup de dados",
          "O firewall da rede virtual",
        ],
        correct: 0,
        exp: [
          "Correto — o cliente de inferência do SDK usa endpoint e chave para autenticar e chamar o modelo.",
          "Incorreto — não é o painel de faturamento.",
          "Incorreto — não é um serviço de backup.",
          "Incorreto — não é uma configuração de firewall.",
        ],
      },
    ],
  },
  {
    id: 4,
    icon: "🤖",
    title: "Criar um Agente com o Foundry Agent Service",
    domain: "Agentes e Apps com Foundry SDK",
    objective: "Criar um agente de IA simples usando o Foundry Agent Service, com uma instrução e uma ferramenta.",
    steps: [
      "No projeto do Foundry, abra 'Agentes' (Agents) e clique em 'Novo agente'.",
      "Dê um nome ao agente e escreva instruções, como: 'Você é um agente que ajuda a resumir textos técnicos em português'.",
      "Selecione o modelo que o agente deve usar (por exemplo, o modelo já implantado no lab anterior).",
      "Habilite uma ferramenta (tool), como 'Code Interpreter' ou uma busca de arquivos (File Search).",
      "Teste o agente enviando uma pergunta no painel de testes e observe se ele usa a ferramenta habilitada quando necessário.",
    ],
    quiz: [
      {
        q: "O que diferencia um agente de IA de uma simples chamada de chat a um modelo?",
        opts: [
          "O agente é sempre mais barato",
          "O agente pode usar ferramentas e tomar ações para atingir um objetivo, além de apenas responder texto",
          "O agente não usa nenhum modelo de linguagem",
          "O agente só funciona offline",
        ],
        correct: 1,
        exp: [
          "Incorreto — custo não é o diferencial.",
          "Correto — agentes combinam um modelo com ferramentas e podem executar ações para cumprir um objetivo.",
          "Incorreto — agentes são construídos sobre um modelo de linguagem.",
          "Incorreto — agentes dependem de conectividade com os serviços de IA.",
        ],
      },
      {
        q: "Para que serve a ferramenta 'Code Interpreter' em um agente do Foundry?",
        opts: [
          "Para traduzir o agente para outros idiomas",
          "Para permitir que o agente escreva e execute código a fim de resolver tarefas, como cálculos ou análise de dados",
          "Para criptografar as mensagens do agente",
          "Para gerar imagens automaticamente",
        ],
        correct: 1,
        exp: [
          "Incorreto — não é uma ferramenta de tradução.",
          "Correto — Code Interpreter permite ao agente executar código para resolver tarefas específicas.",
          "Incorreto — não é uma ferramenta de criptografia.",
          "Incorreto — geração de imagem é uma ferramenta/modelo diferente.",
        ],
      },
      {
        q: "Qual é a função das 'instruções' definidas ao criar um agente?",
        opts: [
          "Definir o preço cobrado por chamada",
          "Orientar o comportamento, o tom e o escopo de atuação do agente",
          "Configurar a rede virtual do projeto",
          "Definir o número máximo de usuários",
        ],
        correct: 1,
        exp: [
          "Incorreto — não define preço.",
          "Correto — as instruções funcionam como uma mensagem de sistema, orientando como o agente deve se comportar.",
          "Incorreto — não é configuração de rede.",
          "Incorreto — não limita usuários.",
        ],
      },
    ],
  },
  {
    id: 5,
    icon: "📝",
    title: "Análise de Texto com Azure AI Language",
    domain: "Implementação de Texto e Fala com Foundry",
    objective: "Usar o recurso Azure AI Language para detectar sentimento e extrair frases-chave de um texto.",
    steps: [
      "No Foundry (ou no portal Azure), localize ou crie um recurso do tipo 'Azure AI Language'.",
      "Abra o 'Language Studio' associado ao recurso, ou use o teste rápido dentro do Foundry.",
      "Selecione a funcionalidade 'Análise de Sentimento' e cole um texto de exemplo em português, como uma avaliação de produto.",
      "Execute a análise e observe a classificação (positivo, negativo, neutro ou misto) e os escores de confiança.",
      "Repita o teste usando a funcionalidade 'Extração de Frases-Chave' (Key Phrase Extraction) sobre o mesmo texto.",
    ],
    quiz: [
      {
        q: "O que a funcionalidade de Análise de Sentimento do Azure AI Language retorna?",
        opts: [
          "Uma tradução do texto para outro idioma",
          "A classificação do texto como positivo, negativo, neutro ou misto, com escores de confiança",
          "Uma imagem gerada a partir do texto",
          "O número de tokens do texto",
        ],
        correct: 1,
        exp: [
          "Incorreto — não é um serviço de tradução.",
          "Correto — a análise de sentimento classifica o tom do texto com escores de confiança.",
          "Incorreto — não gera imagens.",
          "Incorreto — não é o foco dessa funcionalidade.",
        ],
      },
      {
        q: "Para que serve a Extração de Frases-Chave (Key Phrase Extraction)?",
        opts: [
          "Para identificar os principais tópicos e termos relevantes em um texto",
          "Para converter texto em fala",
          "Para detectar objetos em uma imagem",
          "Para gerar um resumo em vídeo",
        ],
        correct: 0,
        exp: [
          "Correto — identifica os termos e tópicos mais relevantes do texto.",
          "Incorreto — isso é conversão de texto em fala, um serviço diferente.",
          "Incorreto — isso é visão computacional.",
          "Incorreto — não gera vídeo.",
        ],
      },
      {
        q: "A qual workload de IA pertence a Análise de Sentimento?",
        opts: [
          "Visão computacional",
          "Análise de texto (processamento de linguagem natural)",
          "Geração de imagem",
          "Reconhecimento de fala",
        ],
        correct: 1,
        exp: [
          "Incorreto — visão computacional trabalha com imagens.",
          "Correto — análise de sentimento é uma tarefa de análise de texto/NLP.",
          "Incorreto — não é geração de imagem.",
          "Incorreto — não envolve áudio diretamente.",
        ],
      },
    ],
  },
  {
    id: 6,
    icon: "🎙️",
    title: "Conversão de Fala em Texto (Speech to Text)",
    domain: "Implementação de Texto e Fala com Foundry",
    objective: "Usar o recurso Azure AI Speech para transcrever um áudio de fala em texto.",
    steps: [
      "Localize ou crie um recurso do tipo 'Azure AI Speech' no seu projeto.",
      "Abra o 'Speech Studio' associado ao recurso.",
      "Selecione a funcionalidade 'Fala em texto em tempo real' (Real-time Speech to Text).",
      "Use o microfone (ou carregue um arquivo de áudio de exemplo) para gerar uma transcrição.",
      "Observe a pontuação automática, a segmentação em frases e o nível de confiança da transcrição.",
    ],
    quiz: [
      {
        q: "Qual é a função principal do serviço Fala em Texto (Speech to Text)?",
        opts: [
          "Gerar áudio a partir de texto escrito",
          "Transcrever áudio de fala para texto escrito",
          "Traduzir um vídeo para outro idioma",
          "Detectar objetos em uma imagem",
        ],
        correct: 1,
        exp: [
          "Incorreto — essa é a função do Texto em Fala (Text to Speech), o inverso.",
          "Correto — Speech to Text converte áudio falado em texto.",
          "Incorreto — não é tradução de vídeo.",
          "Incorreto — não é visão computacional.",
        ],
      },
      {
        q: "A que workload de IA pertence a transcrição de fala em texto?",
        opts: [
          "Fala (Speech)",
          "Geração de imagem",
          "Extração de informação de documentos",
          "Visão computacional",
        ],
        correct: 0,
        exp: [
          "Correto — é uma capacidade do workload de Fala.",
          "Incorreto — não é geração de imagem.",
          "Incorreto — não é extração de documentos.",
          "Incorreto — não é visão computacional.",
        ],
      },
      {
        q: "Qual recurso do Azure AI hospeda as funcionalidades de fala, como transcrição e síntese de voz?",
        opts: [
          "Azure AI Vision",
          "Azure AI Speech",
          "Azure AI Search",
          "Azure AI Content Safety",
        ],
        correct: 1,
        exp: [
          "Incorreto — Vision trata de imagens.",
          "Correto — Azure AI Speech reúne as capacidades de fala.",
          "Incorreto — Search é para indexação e busca.",
          "Incorreto — Content Safety trata de moderação de conteúdo.",
        ],
      },
    ],
  },
  {
    id: 7,
    icon: "🖼️",
    title: "Analisar uma Imagem com Visão Computacional",
    domain: "Implementação de Visão e Geração de Imagem com Foundry",
    objective: "Usar o Azure AI Vision para gerar uma legenda e identificar objetos em uma imagem.",
    steps: [
      "Localize ou crie um recurso do tipo 'Azure AI Vision' no seu projeto.",
      "Abra a ferramenta de teste rápido (Vision Studio ou o teste integrado no Foundry).",
      "Carregue uma imagem de exemplo, como uma foto de uma rua com carros e pessoas.",
      "Execute a análise de 'Legendagem de imagem' (Image Captioning) e observe a descrição gerada.",
      "Execute também a 'Detecção de objetos' (Object Detection) e observe as caixas delimitadoras (bounding boxes) e os rótulos identificados.",
    ],
    quiz: [
      {
        q: "O que a funcionalidade de Legendagem de Imagem (Image Captioning) faz?",
        opts: [
          "Gera uma descrição textual do conteúdo da imagem",
          "Converte a imagem em um arquivo de áudio",
          "Remove o fundo da imagem",
          "Traduz o texto contido na imagem",
        ],
        correct: 0,
        exp: [
          "Correto — a legendagem gera uma frase descrevendo o conteúdo da imagem.",
          "Incorreto — não gera áudio.",
          "Incorreto — não é remoção de fundo.",
          "Incorreto — isso seria uma tarefa de OCR + tradução, não legendagem.",
        ],
      },
      {
        q: "O que representam as 'bounding boxes' na Detecção de Objetos?",
        opts: [
          "Os limites do arquivo de imagem",
          "As áreas retangulares que delimitam a posição de cada objeto identificado na imagem",
          "O nível de compressão da imagem",
          "A resolução máxima suportada pelo serviço",
        ],
        correct: 1,
        exp: [
          "Incorreto — não são limites do arquivo.",
          "Correto — bounding boxes marcam a posição de cada objeto detectado na imagem.",
          "Incorreto — não indicam compressão.",
          "Incorreto — não indicam resolução máxima.",
        ],
      },
      {
        q: "A que workload de IA pertence a análise de imagens, como legendagem e detecção de objetos?",
        opts: [
          "Visão computacional",
          "Análise de texto",
          "Fala",
          "IA responsável",
        ],
        correct: 0,
        exp: [
          "Correto — são capacidades do workload de visão computacional.",
          "Incorreto — análise de texto trabalha com linguagem escrita.",
          "Incorreto — fala trabalha com áudio.",
          "Incorreto — IA responsável é um princípio transversal, não um workload.",
        ],
      },
    ],
  },
  {
    id: 8,
    icon: "🎨",
    title: "Gerar uma Imagem a partir de Texto",
    domain: "Implementação de Visão e Geração de Imagem com Foundry",
    objective: "Implantar um modelo de geração de imagem no Foundry e gerar uma imagem a partir de um prompt de texto.",
    steps: [
      "No Catálogo de Modelos do Foundry, filtre por modalidade 'Image generation' e implante um modelo de geração de imagem (ex.: um modelo da família DALL-E).",
      "Abra o Playground de imagem correspondente à implantação.",
      "Escreva um prompt descritivo, como 'um robô simpático estudando em uma biblioteca, estilo ilustração digital'.",
      "Gere a imagem e observe o resultado.",
      "Modifique o prompt adicionando detalhes de estilo (ex.: 'aquarela', 'fotorrealista') e compare como o resultado muda.",
    ],
    quiz: [
      {
        q: "O que é necessário fornecer a um modelo de geração de imagem para produzir um resultado?",
        opts: [
          "Um arquivo de áudio",
          "Um prompt de texto descrevendo a imagem desejada",
          "Uma planilha de dados numéricos",
          "Um vídeo de referência obrigatório",
        ],
        correct: 1,
        exp: [
          "Incorreto — não é entrada de áudio.",
          "Correto — modelos de geração de imagem (text-to-image) recebem um prompt textual como entrada principal.",
          "Incorreto — não é entrada tabular.",
          "Incorreto — vídeo de referência não é obrigatório nesse tipo de modelo.",
        ],
      },
      {
        q: "Como detalhes de estilo no prompt (ex.: 'aquarela', 'fotorrealista') afetam a geração de imagem?",
        opts: [
          "Não têm nenhum efeito no resultado",
          "Influenciam a estética e o estilo visual da imagem gerada",
          "Alteram apenas a resolução da imagem",
          "Determinam o idioma da interface",
        ],
        correct: 1,
        exp: [
          "Incorreto — detalhes de estilo têm efeito direto no resultado.",
          "Correto — palavras de estilo no prompt orientam a estética da imagem gerada.",
          "Incorreto — não controlam resolução diretamente.",
          "Incorreto — não afetam o idioma da interface.",
        ],
      },
      {
        q: "A geração de imagem a partir de texto é um exemplo de qual tipo de IA?",
        opts: [
          "IA generativa",
          "IA preditiva tradicional (regressão)",
          "Processamento de linguagem natural apenas",
          "Reconhecimento de fala",
        ],
        correct: 0,
        exp: [
          "Correto — é uma aplicação clássica de IA generativa (text-to-image).",
          "Incorreto — não é um modelo de regressão preditiva.",
          "Incorreto — vai além de NLP puro, pois gera imagens.",
          "Incorreto — não envolve áudio.",
        ],
      },
    ],
  },
  {
    id: 9,
    icon: "📄",
    title: "Extração de Informação de Documentos",
    domain: "Content Understanding — Extração de Informação na Prática",
    objective: "Usar o Content Understanding do Foundry para extrair campos estruturados de um documento.",
    steps: [
      "No Foundry, abra a ferramenta 'Content Understanding' (ou o serviço Azure AI Document Intelligence, se estiver usando o portal clássico).",
      "Carregue um documento de exemplo, como uma nota fiscal ou um recibo em PDF/imagem.",
      "Escolha um modelo pré-construído adequado (ex.: modelo de recibo/invoice) ou defina um esquema personalizado de campos a extrair.",
      "Execute a análise e observe os campos extraídos (data, valor total, fornecedor) junto com o nível de confiança de cada campo.",
      "Exporte o resultado em formato JSON estruturado.",
    ],
    quiz: [
      {
        q: "Qual é o objetivo principal do Content Understanding / Document Intelligence?",
        opts: [
          "Gerar novos documentos automaticamente do zero",
          "Extrair dados estruturados (campos, tabelas) a partir de documentos não estruturados",
          "Traduzir documentos para outros idiomas",
          "Compactar arquivos PDF",
        ],
        correct: 1,
        exp: [
          "Incorreto — não é sobre criar documentos novos.",
          "Correto — a ferramenta transforma conteúdo não estruturado (como um PDF) em dados estruturados.",
          "Incorreto — tradução não é a função principal.",
          "Incorreto — não é uma ferramenta de compactação.",
        ],
      },
      {
        q: "O que indica o 'nível de confiança' associado a um campo extraído?",
        opts: [
          "O preço cobrado pela extração daquele campo",
          "A probabilidade estimada de que o valor extraído esteja correto",
          "O tempo que levou para processar o documento",
          "O tamanho do arquivo em megabytes",
        ],
        correct: 1,
        exp: [
          "Incorreto — não representa custo.",
          "Correto — o nível de confiança indica a probabilidade estimada de exatidão da extração.",
          "Incorreto — não mede tempo de processamento.",
          "Incorreto — não mede tamanho de arquivo.",
        ],
      },
      {
        q: "Por que usar um esquema personalizado de campos pode ser útil no Content Understanding?",
        opts: [
          "Porque é obrigatório para qualquer documento",
          "Porque permite extrair campos específicos do negócio que não estão em um modelo pré-construído",
          "Porque reduz o tamanho do documento original",
          "Porque converte o documento automaticamente em áudio",
        ],
        correct: 1,
        exp: [
          "Incorreto — modelos pré-construídos também são válidos e não é sempre obrigatório.",
          "Correto — um esquema personalizado permite mapear campos específicos que não constam em modelos prontos.",
          "Incorreto — não reduz o tamanho do arquivo.",
          "Incorreto — não converte para áudio.",
        ],
      },
    ],
  },
  {
    id: 10,
    icon: "🛡️",
    title: "Avaliação e Segurança de um Modelo",
    domain: "IA Responsável",
    objective: "Executar uma avaliação de segurança de conteúdo e revisar métricas de qualidade de um modelo no Foundry.",
    steps: [
      "No projeto do Foundry, abra a seção 'Avaliação' (Evaluation).",
      "Crie uma nova avaliação para a implantação de modelo criada em um lab anterior, selecionando métricas como 'Groundedness', 'Relevance' e 'Coerência'.",
      "Execute a avaliação sobre um pequeno conjunto de perguntas e respostas de exemplo.",
      "Revise os resultados e identifique respostas com baixa pontuação de 'Groundedness' (fundamentação).",
      "Abra também o painel de 'Content Safety' e teste como o serviço classifica um texto com conteúdo potencialmente ofensivo, observando as categorias de risco retornadas.",
    ],
    quiz: [
      {
        q: "O que mede a métrica de 'Groundedness' (fundamentação) em uma avaliação de modelo?",
        opts: [
          "A velocidade de resposta do modelo",
          "O quanto a resposta gerada está baseada e é consistente com as fontes de dados fornecidas",
          "O custo da chamada ao modelo",
          "O idioma da resposta",
        ],
        correct: 1,
        exp: [
          "Incorreto — não mede velocidade.",
          "Correto — Groundedness avalia se a resposta é consistente com os dados/contexto fornecidos, ajudando a detectar alucinações.",
          "Incorreto — não mede custo.",
          "Incorreto — não mede idioma.",
        ],
      },
      {
        q: "Qual é a função do Content Safety no contexto de IA responsável?",
        opts: [
          "Aumentar a velocidade de geração de texto",
          "Detectar e classificar conteúdo potencialmente prejudicial, como discurso de ódio ou violência",
          "Reduzir o tamanho do modelo implantado",
          "Traduzir automaticamente o conteúdo gerado",
        ],
        correct: 1,
        exp: [
          "Incorreto — não é sobre velocidade.",
          "Correto — Content Safety identifica e classifica categorias de conteúdo prejudicial em texto e imagem.",
          "Incorreto — não reduz o tamanho do modelo.",
          "Incorreto — não é uma ferramenta de tradução.",
        ],
      },
      {
        q: "Por que avaliar um modelo antes de colocá-lo em produção é uma prática de IA responsável?",
        opts: [
          "Porque é exigido apenas para modelos gratuitos",
          "Porque ajuda a identificar respostas incorretas, enviesadas ou não fundamentadas antes que afetem usuários reais",
          "Porque reduz o número de parâmetros do modelo",
          "Porque acelera o treinamento do modelo do zero",
        ],
        correct: 1,
        exp: [
          "Incorreto — vale para qualquer modelo, pago ou gratuito.",
          "Correto — a avaliação prévia ajuda a identificar riscos de qualidade, viés e alucinação antes da produção.",
          "Incorreto — não altera a arquitetura do modelo.",
          "Incorreto — não envolve treinar um modelo do zero.",
        ],
      },
    ],
  },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = LAB_BANK;
}
