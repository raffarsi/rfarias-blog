// ============================================================================
// DP-900 Prep Hub — Banco de Laboratórios Práticos (js/labs.js)
// 10 laboratórios guiados no portal do Azure (portal.azure.com), cobrindo os
// 4 domínios do banco de questões. Cada lab assume que o aluno já possui uma
// assinatura Azure ativa (não inclui passos de criação de conta) e vai direto
// para a prática dentro do portal.
// Estrutura idêntica à do AZ-900/AI-901: {id, icon, title, domain, objective,
// steps[], quiz[3 itens com opts[4]/correct/exp]}.
// ============================================================================

const LAB_BANK = [
  {
    id: 1,
    icon: "🗄️",
    title: "Criar um Azure SQL Database",
    domain: "Dados Relacionais no Azure",
    objective: "Provisionar um Azure SQL Database totalmente gerenciado e explorar suas configurações básicas.",
    steps: [
      "Acesse portal.azure.com e entre com sua conta.",
      "No menu, selecione 'Criar um recurso' e busque por 'SQL Database'.",
      "Preencha o nome do banco de dados, crie (ou selecione) um servidor lógico e defina as credenciais de administrador.",
      "Na aba 'Rede', configure a regra de firewall para permitir o acesso do seu IP atual (ou dos serviços do Azure).",
      "Escolha o modelo de compra (DTU ou vCore) e revise o nível de desempenho antes de criar o recurso.",
    ],
    quiz: [
      {
        q: "Qual é a principal vantagem de usar o Azure SQL Database em vez de instalar o SQL Server em uma máquina virtual?",
        opts: [
          "É um serviço totalmente gerenciado (PaaS), que elimina a necessidade de administrar o sistema operacional e patches",
          "É a única forma de usar T-SQL no Azure",
          "É sempre gratuito, independentemente do uso",
          "Não permite conexões externas de forma alguma",
        ],
        correct: 0,
        exp: [
          "Correto — o Azure SQL Database é PaaS, reduzindo a carga operacional de administração.",
          "Incorreto — o SQL Server em VMs também usa T-SQL.",
          "Incorreto — o serviço tem custo conforme o nível de desempenho escolhido.",
          "Incorreto — conexões externas são permitidas conforme as regras de firewall configuradas.",
        ],
      },
      {
        q: "Por que é necessário configurar uma regra de firewall ao criar um Azure SQL Database?",
        opts: [
          "Porque, por padrão, o acesso de qualquer endereço IP é bloqueado até que seja explicitamente permitido",
          "Porque o firewall determina o preço do banco de dados",
          "Porque sem firewall o banco de dados não pode ser criado",
          "Porque o firewall substitui a necessidade de senha de administrador",
        ],
        correct: 0,
        exp: [
          "Correto — o firewall bloqueia todo o tráfego por padrão, exigindo liberação explícita de IPs.",
          "Incorreto — o firewall não determina o preço do serviço.",
          "Incorreto — o banco pode ser criado sem regras de firewall configuradas inicialmente.",
          "Incorreto — firewall e senha de administrador são mecanismos de segurança complementares, não substitutos.",
        ],
      },
      {
        q: "Qual é a diferença entre os modelos de compra DTU e vCore ao provisionar um Azure SQL Database?",
        opts: [
          "DTU combina CPU, memória e E/S em uma métrica única; vCore permite configurar CPU e memória de forma independente",
          "DTU só está disponível para bancos de dados não relacionais",
          "vCore elimina completamente a necessidade de backups",
          "Não existe diferença real entre os dois modelos",
        ],
        correct: 0,
        exp: [
          "Correto — descreve corretamente a diferença entre os dois modelos de compra.",
          "Incorreto — DTU é um modelo específico para bancos relacionais do Azure SQL.",
          "Incorreto — backups continuam sendo necessários em ambos os modelos.",
          "Incorreto — os dois modelos têm características e vantagens distintas.",
        ],
      },
    ],
  },
  {
    id: 2,
    icon: "📝",
    title: "Consultar Dados com o Editor de Consultas",
    domain: "Dados Relacionais no Azure",
    objective: "Usar o Query Editor do portal do Azure para executar comandos T-SQL básicos em um Azure SQL Database.",
    steps: [
      "No recurso do Azure SQL Database criado no laboratório anterior, abra o menu 'Editor de consultas (versão prévia)'.",
      "Faça login usando as credenciais de administrador do SQL definidas na criação do banco.",
      "Execute um comando CREATE TABLE para criar uma tabela simples, como 'Produtos' com colunas Id, Nome e Preco.",
      "Execute comandos INSERT INTO para adicionar algumas linhas de exemplo à tabela.",
      "Execute um comando SELECT com WHERE e ORDER BY para consultar e ordenar os dados inseridos.",
    ],
    quiz: [
      {
        q: "Qual comando SQL é usado para criar a estrutura de uma nova tabela no banco de dados?",
        opts: [
          "CREATE TABLE",
          "SELECT",
          "DELETE",
          "GRANT",
        ],
        correct: 0,
        exp: [
          "Correto — CREATE TABLE é o comando DDL usado para criar tabelas.",
          "Incorreto — SELECT consulta dados, não cria estruturas.",
          "Incorreto — DELETE remove linhas, não cria tabelas.",
          "Incorreto — GRANT concede permissões, não cria tabelas.",
        ],
      },
      {
        q: "Qual comando SQL é usado para adicionar novas linhas à tabela recém-criada?",
        opts: [
          "INSERT INTO",
          "ALTER TABLE",
          "DROP TABLE",
          "CREATE INDEX",
        ],
        correct: 0,
        exp: [
          "Correto — INSERT INTO adiciona novas linhas a uma tabela.",
          "Incorreto — ALTER TABLE modifica a estrutura, não insere linhas.",
          "Incorreto — DROP TABLE exclui a tabela inteira.",
          "Incorreto — CREATE INDEX cria um índice, não insere dados.",
        ],
      },
      {
        q: "Ao executar 'SELECT * FROM Produtos WHERE Preco > 100 ORDER BY Preco DESC', o que essa consulta faz?",
        opts: [
          "Retorna os produtos com preço acima de 100, ordenados do mais caro para o mais barato",
          "Exclui todos os produtos com preço acima de 100",
          "Cria uma nova tabela chamada Produtos",
          "Concede permissão de acesso à tabela Produtos",
        ],
        correct: 0,
        exp: [
          "Correto — WHERE filtra por preço > 100 e ORDER BY ... DESC ordena de forma decrescente.",
          "Incorreto — SELECT consulta dados, não os exclui.",
          "Incorreto — SELECT não cria tabelas.",
          "Incorreto — SELECT não concede permissões.",
        ],
      },
    ],
  },
  {
    id: 3,
    icon: "⚙️",
    title: "Configurar o Nível de Desempenho do Banco de Dados",
    domain: "Dados Relacionais no Azure",
    objective: "Explorar as opções de escala vertical (scale up/down) de um Azure SQL Database no portal.",
    steps: [
      "No recurso do Azure SQL Database, acesse o menu 'Escala de computação e armazenamento' (Compute + storage).",
      "Observe o nível de desempenho atual (ex.: quantidade de DTUs ou vCores configurados).",
      "Explore as opções disponíveis para aumentar ou reduzir os recursos (sem necessariamente aplicar a mudança, se estiver em ambiente de testes com custo).",
      "Verifique a opção de habilitar o modelo 'Serverless' (sem servidor), caso disponível para o tier escolhido, e observe as configurações de pausa automática.",
      "Anote a diferença de custo estimado entre os diferentes níveis de desempenho exibidos na tela.",
    ],
    quiz: [
      {
        q: "O que significa 'escalar verticalmente' (scale up) um Azure SQL Database?",
        opts: [
          "Aumentar os recursos de computação (CPU, memória) de uma única instância do banco",
          "Criar várias réplicas idênticas do banco de dados",
          "Migrar o banco de dados para outra assinatura do Azure",
          "Excluir o banco de dados atual e criar um novo do zero",
        ],
        correct: 0,
        exp: [
          "Correto — escala vertical aumenta os recursos de uma única instância.",
          "Incorreto — criar réplicas é escala horizontal, não vertical.",
          "Incorreto — não envolve migração de assinatura.",
          "Incorreto — não envolve exclusão e recriação do banco.",
        ],
      },
      {
        q: "Qual é a principal vantagem do modelo 'Serverless' no Azure SQL Database?",
        opts: [
          "Ele pode pausar automaticamente durante períodos de inatividade, reduzindo custos em cargas de trabalho intermitentes",
          "Ele elimina completamente a necessidade de backups",
          "Ele só pode ser usado para bancos de dados não relacionais",
          "Ele impede qualquer conexão externa ao banco de dados",
        ],
        correct: 0,
        exp: [
          "Correto — o modelo serverless pode pausar automaticamente, economizando custos em cargas intermitentes.",
          "Incorreto — backups continuam sendo realizados normalmente.",
          "Incorreto — serverless é uma opção específica do Azure SQL Database, um serviço relacional.",
          "Incorreto — conexões externas continuam possíveis conforme as regras de firewall.",
        ],
      },
      {
        q: "Por que a escolha do nível de desempenho de um banco de dados é uma decisão importante?",
        opts: [
          "Porque impacta diretamente o custo do serviço e a capacidade de atender à carga de trabalho esperada",
          "Porque determina automaticamente a linguagem de consulta que pode ser usada",
          "Porque impede qualquer alteração futura no banco de dados",
          "Porque só afeta a cor da interface do portal",
        ],
        correct: 0,
        exp: [
          "Correto — o nível de desempenho afeta diretamente custo e capacidade de atender à carga de trabalho.",
          "Incorreto — a linguagem de consulta (T-SQL) não depende do nível de desempenho escolhido.",
          "Incorreto — o nível de desempenho pode ser ajustado posteriormente.",
          "Incorreto — não está relacionado à interface visual do portal.",
        ],
      },
    ],
  },
  {
    id: 4,
    icon: "🌐",
    title: "Criar uma Conta do Azure Cosmos DB",
    domain: "Dados Não Relacionais no Azure",
    objective: "Provisionar uma conta do Azure Cosmos DB usando a API NoSQL e explorar suas configurações.",
    steps: [
      "No portal do Azure, selecione 'Criar um recurso' e busque por 'Azure Cosmos DB'.",
      "Escolha a opção de API 'Azure Cosmos DB for NoSQL'.",
      "Preencha o nome da conta, selecione a região e o modo de capacidade (provisionado ou serverless).",
      "Revise as opções de replicação geográfica (Geo-Redundancy) disponíveis na criação da conta.",
      "Crie o recurso e aguarde a implantação ser concluída.",
    ],
    quiz: [
      {
        q: "O que é o Azure Cosmos DB?",
        opts: [
          "Um banco de dados NoSQL multimodelo, globalmente distribuído e totalmente gerenciado",
          "Um serviço exclusivo para hospedar sites estáticos",
          "Um tipo de máquina virtual otimizada para jogos",
          "Um serviço de backup de arquivos locais",
        ],
        correct: 0,
        exp: [
          "Correto — define corretamente o Azure Cosmos DB.",
          "Incorreto — não é um serviço de hospedagem de sites.",
          "Incorreto — não é um tipo de máquina virtual.",
          "Incorreto — não é um serviço de backup local.",
        ],
      },
      {
        q: "Qual é a API nativa e original do Azure Cosmos DB, usada para dados de documento JSON?",
        opts: [
          "API NoSQL (anteriormente chamada de Core (SQL))",
          "API para MongoDB",
          "API para Cassandra",
          "API para Table exclusivamente",
        ],
        correct: 0,
        exp: [
          "Correto — a API NoSQL é a API nativa e mais completa do Cosmos DB.",
          "Incorreto — a API para MongoDB é uma camada de compatibilidade.",
          "Incorreto — a API para Cassandra é voltada a compatibilidade com coluna larga.",
          "Incorreto — a API para Table é voltada a compatibilidade com o Azure Table Storage.",
        ],
      },
      {
        q: "Qual é a vantagem do modo de capacidade 'serverless' ao criar uma conta do Cosmos DB para um ambiente de testes?",
        opts: [
          "Cobra com base no uso real (Request Units consumidas), sendo mais econômico para cargas de trabalho baixas ou imprevisíveis",
          "Elimina completamente a necessidade de configurar uma chave de partição",
          "Só pode ser usado com a API para Gremlin",
          "Impede qualquer replicação geográfica dos dados",
        ],
        correct: 0,
        exp: [
          "Correto — o modo serverless cobra pelo consumo real, sendo econômico para cargas baixas/imprevisíveis.",
          "Incorreto — a chave de partição continua sendo necessária independentemente do modo de capacidade.",
          "Incorreto — o modo serverless está disponível para as diferentes APIs do Cosmos DB, não só Gremlin.",
          "Incorreto — a replicação geográfica é uma configuração independente do modo de capacidade.",
        ],
      },
    ],
  },
  {
    id: 5,
    icon: "🔍",
    title: "Explorar o Data Explorer do Cosmos DB",
    domain: "Dados Não Relacionais no Azure",
    objective: "Criar um container e itens no Cosmos DB e consultá-los usando o Data Explorer no portal.",
    steps: [
      "Na conta do Cosmos DB criada, acesse o menu 'Data Explorer'.",
      "Crie um novo banco de dados (database) e, dentro dele, um novo container, definindo uma chave de partição (ex.: '/categoria').",
      "Adicione alguns itens (documentos JSON) manualmente através da opção 'New Item'.",
      "Use a aba de consulta (Query) do Data Explorer para executar uma consulta simples, como 'SELECT * FROM c WHERE c.categoria = \"exemplo\"'.",
      "Observe as métricas de Request Units (RU) consumidas exibidas após a execução da consulta.",
    ],
    quiz: [
      {
        q: "O que é uma 'chave de partição' (partition key) em um container do Cosmos DB?",
        opts: [
          "Um atributo usado para distribuir os itens entre partições lógicas, permitindo escalabilidade horizontal",
          "Uma senha usada para acessar a conta do Cosmos DB",
          "Um tipo de índice usado apenas para buscas de texto completo",
          "Um protocolo de criptografia de dados em repouso",
        ],
        correct: 0,
        exp: [
          "Correto — define corretamente a chave de partição.",
          "Incorreto — não é uma senha de acesso.",
          "Incorreto — não é um tipo de índice de texto completo.",
          "Incorreto — não é um protocolo de criptografia.",
        ],
      },
      {
        q: "O que representa uma 'Request Unit' (RU) consumida ao executar uma consulta no Cosmos DB?",
        opts: [
          "Uma medida normalizada do custo de processamento necessário para realizar aquela operação",
          "Uma unidade de armazenamento em disco utilizada",
          "O tempo, em milissegundos, que a consulta levou para ser escrita",
          "O número de usuários conectados simultaneamente à conta",
        ],
        correct: 0,
        exp: [
          "Correto — RU mede o custo de processamento (CPU, memória, IOPS) de uma operação.",
          "Incorreto — não é uma medida de armazenamento em disco.",
          "Incorreto — não é uma medida direta de tempo de digitação.",
          "Incorreto — não é uma medida de usuários conectados.",
        ],
      },
      {
        q: "Por que os itens armazenados no Cosmos DB (API NoSQL) são geralmente representados como documentos JSON?",
        opts: [
          "Porque documentos JSON permitem uma estrutura flexível, com campos que podem variar entre itens diferentes",
          "Porque o Cosmos DB exige que todos os itens tenham exatamente o mesmo esquema",
          "Porque JSON é o único formato aceito por qualquer serviço do Azure",
          "Porque documentos JSON não podem ser indexados",
        ],
        correct: 0,
        exp: [
          "Correto — JSON permite flexibilidade de esquema entre documentos.",
          "Incorreto — o Cosmos DB não exige esquema idêntico entre itens.",
          "Incorreto — outros serviços do Azure aceitam diversos formatos, não apenas JSON.",
          "Incorreto — o Cosmos DB indexa automaticamente os campos dos documentos por padrão.",
        ],
      },
    ],
  },
  {
    id: 6,
    icon: "🧊",
    title: "Criar uma Conta de Armazenamento e Explorar Blob Storage",
    domain: "Dados Não Relacionais no Azure",
    objective: "Provisionar uma conta de armazenamento do Azure e explorar contêineres e camadas de acesso do Blob Storage.",
    steps: [
      "No portal do Azure, crie um novo recurso do tipo 'Conta de armazenamento' (Storage account).",
      "Defina o nome da conta, a região e o nível de redundância (ex.: LRS — armazenamento com redundância local).",
      "Após a criação, acesse o menu 'Contêineres' e crie um novo contêiner de blobs.",
      "Faça upload de um arquivo de exemplo para o contêiner criado.",
      "No blob enviado, acesse as propriedades e altere a camada de acesso (tier) entre Hot, Cool e Archive, observando as diferenças descritas na interface.",
    ],
    quiz: [
      {
        q: "Quais são as três camadas de acesso disponíveis para blobs no Azure Blob Storage?",
        opts: [
          "Hot, Cool e Archive",
          "Rápido, Médio e Lento",
          "Básico, Padrão e Premium exclusivamente",
          "Norte, Sul e Central",
        ],
        correct: 0,
        exp: [
          "Correto — são as três camadas oficiais de acesso do Blob Storage.",
          "Incorreto — não são os nomes oficiais das camadas.",
          "Incorreto — não são os nomes oficiais das camadas de acesso.",
          "Incorreto — essas são regiões geográficas, não camadas de acesso.",
        ],
      },
      {
        q: "Qual camada de acesso é mais indicada para dados raramente acessados, priorizando o menor custo de armazenamento possível, mesmo que a recuperação leve horas?",
        opts: [
          "Archive",
          "Hot",
          "Cool",
          "Premium",
        ],
        correct: 0,
        exp: [
          "Correto — Archive é a camada mais barata, mas exige reidratação (horas) para acesso.",
          "Incorreto — Hot é a camada de maior custo de armazenamento, com acesso imediato.",
          "Incorreto — Cool tem acesso imediato, sem necessidade de reidratação.",
          "Incorreto — 'Premium' não é uma das três camadas de acesso padrão do Blob Storage.",
        ],
      },
      {
        q: "O que a opção de redundância 'LRS' (Locally Redundant Storage) garante em uma conta de armazenamento do Azure?",
        opts: [
          "Que os dados sejam replicados de forma síncrona três vezes dentro de um único data center",
          "Que os dados sejam replicados automaticamente para outro continente",
          "Que os dados nunca sejam armazenados fisicamente em disco",
          "Que apenas um único administrador possa acessar os dados",
        ],
        correct: 0,
        exp: [
          "Correto — LRS replica os dados três vezes dentro de um único data center para proteção contra falhas de hardware.",
          "Incorreto — replicação entre continentes é oferecida por opções como GRS, não por LRS.",
          "Incorreto — os dados são armazenados fisicamente em disco, apenas replicados para redundância.",
          "Incorreto — LRS não está relacionado a controle de acesso de usuários.",
        ],
      },
    ],
  },
  {
    id: 7,
    icon: "🗂️",
    title: "Habilitar o Azure Data Lake Storage Gen2",
    domain: "Dados Não Relacionais no Azure",
    objective: "Criar uma conta de armazenamento com namespace hierárquico habilitado, transformando-a em um Data Lake Storage Gen2.",
    steps: [
      "Ao criar uma nova conta de armazenamento no portal do Azure, acesse a aba 'Avançado'.",
      "Localize a opção 'Namespace hierárquico' (Hierarchical namespace) e habilite-a.",
      "Conclua a criação da conta de armazenamento.",
      "Após a criação, acesse o menu 'Contêineres' e observe que agora é possível criar pastas e subpastas reais dentro do contêiner.",
      "Crie uma estrutura de pastas de exemplo (ex.: /bronze, /silver, /gold) para simular uma arquitetura medallion de data lake.",
    ],
    quiz: [
      {
        q: "O que é o 'namespace hierárquico' habilitado em uma conta de Data Lake Storage Gen2?",
        opts: [
          "Um recurso que organiza os blobs em uma estrutura real de pastas e subpastas, melhorando o desempenho de operações de diretório",
          "Um recurso que criptografa automaticamente todos os arquivos armazenados",
          "Um protocolo usado exclusivamente para VPN",
          "Um tipo de índice usado apenas em bancos relacionais",
        ],
        correct: 0,
        exp: [
          "Correto — define corretamente namespace hierárquico.",
          "Incorreto — não é um recurso de criptografia automática.",
          "Incorreto — não é um protocolo de VPN.",
          "Incorreto — não é um tipo de índice de banco relacional.",
        ],
      },
      {
        q: "Por que o Azure Data Lake Storage Gen2 é frequentemente escolhido para cargas de trabalho de big data e analytics?",
        opts: [
          "Porque combina a escalabilidade e o baixo custo do Blob Storage com um namespace hierárquico, sendo bem integrado com Synapse e Databricks",
          "Porque é o único serviço do Azure que aceita arquivos CSV",
          "Porque elimina totalmente a necessidade de qualquer processamento posterior dos dados",
          "Porque restringe o armazenamento a no máximo 10 arquivos",
        ],
        correct: 0,
        exp: [
          "Correto — descreve corretamente as vantagens do Data Lake Storage Gen2 para big data.",
          "Incorreto — outros serviços também podem armazenar arquivos CSV.",
          "Incorreto — os dados armazenados normalmente ainda passam por processamento (ETL/ELT).",
          "Incorreto — não há esse limite de arquivos.",
        ],
      },
      {
        q: "O que representam as camadas 'bronze', 'silver' e 'gold' organizadas na estrutura de pastas de um data lake?",
        opts: [
          "Estágios progressivos de qualidade dos dados: bruto, limpo/validado e agregado para consumo, respectivamente",
          "Três regiões geográficas diferentes do Azure",
          "Três níveis de preço de uma conta de armazenamento",
          "Três tipos diferentes de máquina virtual",
        ],
        correct: 0,
        exp: [
          "Correto — descreve corretamente a arquitetura medallion (Bronze/Silver/Gold).",
          "Incorreto — não são regiões geográficas.",
          "Incorreto — não são níveis de preço de armazenamento.",
          "Incorreto — não são tipos de máquina virtual.",
        ],
      },
    ],
  },
  {
    id: 8,
    icon: "🧪",
    title: "Explorar o Azure Synapse Analytics (Serverless SQL Pool)",
    domain: "Cargas de Trabalho de Analytics no Azure",
    objective: "Criar um workspace do Azure Synapse Analytics e executar uma consulta usando o pool SQL sem servidor (serverless).",
    steps: [
      "No portal do Azure, crie um recurso do tipo 'Azure Synapse Analytics' (workspace).",
      "Associe o workspace a uma conta de Data Lake Storage Gen2 (pode ser a criada no laboratório anterior).",
      "Após a criação, acesse o Synapse Studio a partir do workspace.",
      "No Synapse Studio, abra a seção 'Dados' e explore o pool 'Built-in' (serverless SQL pool) já disponível por padrão.",
      "Escreva e execute uma consulta T-SQL simples usando o serverless SQL pool sobre um arquivo de exemplo no data lake associado.",
    ],
    quiz: [
      {
        q: "O que é o Azure Synapse Analytics?",
        opts: [
          "Um serviço de análise unificado que combina data warehousing, big data (Spark) e integração de dados em uma única plataforma",
          "Um serviço exclusivo para hospedar sites institucionais",
          "Um tipo de máquina virtual otimizada para jogos",
          "Um serviço de backup de arquivos pessoais",
        ],
        correct: 0,
        exp: [
          "Correto — define corretamente o Azure Synapse Analytics.",
          "Incorreto — não é um serviço de hospedagem de sites.",
          "Incorreto — não é um tipo de máquina virtual para jogos.",
          "Incorreto — não é um serviço de backup pessoal.",
        ],
      },
      {
        q: "Qual é a principal característica do 'serverless SQL pool' explorado neste laboratório?",
        opts: [
          "Permite executar consultas T-SQL sob demanda diretamente sobre arquivos no data lake, cobrando por dados processados, sem infraestrutura dedicada",
          "Exige que uma máquina virtual dedicada esteja sempre ativa e ligada",
          "Só pode ser usado para backups de bancos relacionais",
          "Não permite qualquer tipo de consulta SQL",
        ],
        correct: 0,
        exp: [
          "Correto — define corretamente serverless SQL pool.",
          "Incorreto — o modelo serverless não exige infraestrutura dedicada sempre ativa.",
          "Incorreto — não é um serviço de backup.",
          "Incorreto — o serverless SQL pool permite consultas T-SQL normalmente.",
        ],
      },
      {
        q: "Por que o Synapse Studio associa o workspace a uma conta de Data Lake Storage Gen2?",
        opts: [
          "Porque o data lake serve como área de armazenamento primária para os dados que serão processados e consultados pelo Synapse",
          "Porque essa associação é opcional e nunca é usada na prática",
          "Porque o Data Lake Storage substitui totalmente a necessidade do Synapse Studio",
          "Porque essa é a única forma de criar uma conta do Azure",
        ],
        correct: 0,
        exp: [
          "Correto — o data lake associado serve como área de armazenamento primária integrada ao workspace.",
          "Incorreto — essa associação é uma etapa central na configuração do workspace.",
          "Incorreto — o Data Lake Storage é um componente de armazenamento, não substitui as ferramentas de análise do Synapse Studio.",
          "Incorreto — não está relacionado à criação geral de contas do Azure.",
        ],
      },
    ],
  },
  {
    id: 9,
    icon: "🔄",
    title: "Criar uma Pipeline no Azure Data Factory",
    domain: "Cargas de Trabalho de Analytics no Azure",
    objective: "Criar uma instância do Azure Data Factory e construir uma pipeline simples com uma atividade de cópia de dados.",
    steps: [
      "No portal do Azure, crie um recurso do tipo 'Data Factory'.",
      "Após a criação, abra o Azure Data Factory Studio.",
      "Crie dois 'linked services': um apontando para uma origem de dados (ex.: um contêiner de Blob Storage) e outro para um destino (ex.: outro contêiner ou tabela).",
      "Crie uma nova pipeline e adicione uma atividade 'Copy Data', configurando a origem e o destino usando os linked services criados.",
      "Execute a pipeline manualmente ('Debug' ou 'Trigger now') e acompanhe o status de execução no monitor de pipelines.",
    ],
    quiz: [
      {
        q: "O que é uma 'pipeline' no Azure Data Factory?",
        opts: [
          "Um agrupamento lógico de atividades que juntas realizam uma tarefa completa, como extrair, transformar e carregar dados",
          "Um tipo de índice de banco de dados",
          "Um protocolo de rede para conexões seguras",
          "Um relatório de custos do Azure",
        ],
        correct: 0,
        exp: [
          "Correto — define corretamente pipeline no Data Factory.",
          "Incorreto — não é um tipo de índice de banco de dados.",
          "Incorreto — não é um protocolo de rede.",
          "Incorreto — não é um relatório de custos.",
        ],
      },
      {
        q: "O que é um 'linked service' no Azure Data Factory?",
        opts: [
          "Uma definição de conexão que armazena as informações necessárias para o Data Factory se conectar a uma fonte ou destino de dados externo",
          "Um tipo de índice de banco de dados",
          "Um relatório de auditoria de segurança",
          "Um protocolo de criptografia de disco",
        ],
        correct: 0,
        exp: [
          "Correto — define corretamente linked service.",
          "Incorreto — não é um tipo de índice.",
          "Incorreto — não é um relatório de auditoria.",
          "Incorreto — não é um protocolo de criptografia de disco.",
        ],
      },
      {
        q: "Qual é o propósito da atividade 'Copy Data' usada nesta pipeline?",
        opts: [
          "Mover dados de uma origem para um destino, com possibilidade de mapeamento e conversão básica de formatos",
          "Excluir permanentemente todos os dados da origem",
          "Criar automaticamente um relatório do Power BI",
          "Configurar regras de firewall de rede",
        ],
        correct: 0,
        exp: [
          "Correto — Copy Data move dados de uma origem para um destino, com mapeamentos de esquema/formato.",
          "Incorreto — a atividade de cópia não exclui os dados da origem por padrão.",
          "Incorreto — não cria relatórios do Power BI diretamente.",
          "Incorreto — não configura regras de firewall de rede.",
        ],
      },
    ],
  },
  {
    id: 10,
    icon: "📊",
    title: "Conectar o Power BI a uma Fonte de Dados e Criar um Relatório",
    domain: "Cargas de Trabalho de Analytics no Azure",
    objective: "Usar o Power BI Desktop para se conectar a uma fonte de dados do Azure e criar uma visualização básica.",
    steps: [
      "Abra o Power BI Desktop (ou use a versão web do Power BI Service, se disponível).",
      "Selecione 'Obter Dados' e conecte-se ao Azure SQL Database criado no primeiro laboratório, informando o nome do servidor e as credenciais.",
      "Selecione a tabela 'Produtos' criada anteriormente e carregue os dados no modelo.",
      "No painel de visualizações, crie um gráfico de colunas simples mostrando o preço de cada produto.",
      "Publique o relatório em um workspace do Power BI Service (caso tenha uma licença disponível) ou salve o arquivo .pbix localmente.",
    ],
    quiz: [
      {
        q: "O que é o Power BI Desktop?",
        opts: [
          "Uma aplicação instalada localmente, usada para conectar-se a fontes de dados, transformá-las e criar relatórios",
          "Um serviço exclusivo de hospedagem de bancos de dados",
          "Um protocolo de rede para VPN corporativa",
          "Um tipo de máquina virtual do Azure",
        ],
        correct: 0,
        exp: [
          "Correto — define corretamente o Power BI Desktop.",
          "Incorreto — não é um serviço de hospedagem de bancos de dados.",
          "Incorreto — não é um protocolo de rede.",
          "Incorreto — não é um tipo de máquina virtual.",
        ],
      },
      {
        q: "Qual ferramenta integrada ao Power BI é usada para transformar e limpar os dados antes de carregá-los no modelo?",
        opts: [
          "Power Query",
          "Azure Bastion",
          "Azure Key Vault",
          "Azure Content Delivery Network",
        ],
        correct: 0,
        exp: [
          "Correto — Power Query é a ferramenta de preparação/transformação de dados do Power BI.",
          "Incorreto — Bastion é um serviço de acesso remoto seguro a VMs.",
          "Incorreto — Key Vault é um serviço de gerenciamento de segredos.",
          "Incorreto — CDN é um serviço de distribuição de conteúdo estático.",
        ],
      },
      {
        q: "Depois de criar um relatório no Power BI Desktop, qual é o propósito de publicá-lo no Power BI Service?",
        opts: [
          "Permitir que o relatório seja compartilhado, visualizado e colaborado por outros usuários através da nuvem",
          "Excluir permanentemente o arquivo .pbix local",
          "Criptografar automaticamente todos os dados do Azure SQL Database",
          "Configurar regras de firewall do banco de dados",
        ],
        correct: 0,
        exp: [
          "Correto — publicar no Power BI Service permite compartilhamento e colaboração na nuvem.",
          "Incorreto — o arquivo local não é excluído automaticamente ao publicar.",
          "Incorreto — publicar um relatório não configura criptografia do banco de dados.",
          "Incorreto — publicar um relatório não configura regras de firewall.",
        ],
      },
    ],
  },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = LAB_BANK;
}
