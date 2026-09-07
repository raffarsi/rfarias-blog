// ============================================================================
// MS Project Prep Hub — Banco de Laboratórios Práticos (js/labs.js)
// 10 laboratórios guiados dentro do próprio Microsoft Project Desktop (ou
// Project para a Web), cobrindo os 5 domínios do banco de questões. Cada lab
// assume que o aluno já tem o Microsoft Project instalado/acessível e vai
// direto para a prática dentro do aplicativo — sem custo de assinatura
// envolvido, diferente de laboratórios em nuvem.
// Estrutura idêntica à do DP-900/AZ-900/AI-901: {id, icon, title, domain,
// objective, steps[], quiz[3 itens com opts[4]/correct/exp], externalLink
// (opcional, aponta para a documentação oficial do Microsoft Project)}.
// ============================================================================

const LAB_BANK = [
  {
    id: 1,
    icon: "🆕",
    title: "Criar um Novo Projeto e Configurar Informações Básicas",
    domain: "Interface, Configuração e Calendário do MS Project",
    objective: "Criar um arquivo de projeto do zero e configurar sua data de início e propriedades gerais.",
    steps: [
      "Abra o Microsoft Project e selecione 'Projeto em Branco' para iniciar um novo arquivo.",
      "Vá até a guia Projeto e clique em 'Informações do Projeto'.",
      "Defina a data de início do projeto para a data de hoje e confirme que o agendamento está configurado 'A Partir da Data de Início'.",
      "Acesse Arquivo → Informações → Propriedades e preencha o título do projeto e o nome do gerente responsável.",
      "Salve o arquivo com um nome descritivo (ex.: 'Meu Primeiro Projeto.mpp') em uma pasta de sua preferência.",
    ],
    quiz: [
      {
        q: "Onde no Microsoft Project é possível definir a data de início do projeto?",
        opts: [
          "Guia Projeto → Informações do Projeto",
          "Guia Exibir → Zoom",
          "Guia Formatar → Estilos de Barra",
          "Guia Tarefa → Fonte",
        ],
        correct: 0,
        exp: [
          "Correto — 'Informações do Projeto', na guia Projeto, é onde se configura a data de início/término.",
          "Incorreto — Zoom controla apenas a visualização do Gráfico de Gantt.",
          "Incorreto — Estilos de Barra formata a aparência visual das barras, não datas do projeto.",
          "Incorreto — a guia Fonte trata de formatação de texto.",
        ],
      },
      {
        q: "O que significa agendar um projeto 'A Partir da Data de Início'?",
        opts: [
          "O MS Project calcula as datas das tarefas para frente, a partir da data inicial informada",
          "O MS Project calcula as datas retroativamente a partir de uma data de término fixa",
          "Todas as tarefas passam a ter duração fixa automaticamente",
          "O calendário do projeto é bloqueado para qualquer edição",
        ],
        correct: 0,
        exp: [
          "Correto — o agendamento a partir do início calcula as datas das tarefas 'para frente' no tempo.",
          "Incorreto — esse comportamento descreve o agendamento 'a partir da data de término'.",
          "Incorreto — o tipo de duração é uma configuração independente do sentido do agendamento.",
          "Incorreto — agendar a partir do início não bloqueia a edição do calendário.",
        ],
      },
      {
        q: "Qual é a extensão de arquivo padrão usada para salvar um projeto no Microsoft Project?",
        opts: [
          ".mpp",
          ".docx",
          ".xlsx",
          ".pptx",
        ],
        correct: 0,
        exp: [
          "Correto — .mpp é a extensão nativa dos arquivos de projeto do Microsoft Project.",
          "Incorreto — .docx é a extensão de documentos do Word.",
          "Incorreto — .xlsx é a extensão de planilhas do Excel.",
          "Incorreto — .pptx é a extensão de apresentações do PowerPoint.",
        ],
      },
    ],
  },
  {
    id: 2,
    icon: "📅",
    title: "Configurar o Calendário do Projeto e Adicionar um Feriado",
    domain: "Interface, Configuração e Calendário do MS Project",
    objective: "Personalizar o calendário do projeto, adicionando um dia de exceção (feriado) e verificando o impacto no cronograma.",
    steps: [
      "No arquivo criado no laboratório anterior, acesse a guia Projeto e clique em 'Alterar Período de Trabalho'.",
      "Certifique-se de que o calendário selecionado é o 'Padrão' (Standard), usado como base do projeto.",
      "Na aba 'Exceções', adicione uma nova linha com o nome 'Feriado de Teste' e defina uma data específica dentro do próximo mês.",
      "Confirme que esse dia passa a ser marcado como não útil no calendário (normalmente exibido em uma cor diferenciada).",
      "Insira uma tarefa de 5 dias que atravesse essa data e observe como o MS Project ajusta automaticamente a data de término, pulando o dia não útil.",
    ],
    quiz: [
      {
        q: "Qual comando permite adicionar um feriado ou dia de exceção ao calendário do projeto?",
        opts: [
          "Guia Projeto → Alterar Período de Trabalho",
          "Guia Exibir → Nova Janela",
          "Guia Formatar → Estilos de Texto",
          "Guia Tarefa → Informações → aba Avançado",
        ],
        correct: 0,
        exp: [
          "Correto — 'Alterar Período de Trabalho' é a ferramenta correta para adicionar exceções de calendário.",
          "Incorreto — 'Nova Janela' apenas abre outra visualização da mesma aplicação.",
          "Incorreto — 'Estilos de Texto' formata a aparência do texto, sem relação com calendário.",
          "Incorreto — a aba Avançado de uma tarefa trata de configurações específicas daquela tarefa.",
        ],
      },
      {
        q: "O que acontece com uma tarefa de agendamento automático cuja duração atravessa um novo dia marcado como não útil?",
        opts: [
          "O MS Project recalcula automaticamente a data de término, pulando o dia não útil",
          "A tarefa é excluída automaticamente do projeto",
          "A duração da tarefa é reduzida para caber antes do feriado",
          "Nada muda, pois feriados não afetam tarefas já criadas",
        ],
        correct: 0,
        exp: [
          "Correto — tarefas automáticas recalculam a data de término considerando os novos dias não úteis.",
          "Incorreto — adicionar um feriado não exclui nenhuma tarefa do projeto.",
          "Incorreto — a duração planejada da tarefa permanece a mesma; o que muda é a data final calculada.",
          "Incorreto — alterações no calendário do projeto afetam sim o recálculo das tarefas automáticas.",
        ],
      },
      {
        q: "O que é o 'calendário do projeto' no MS Project?",
        opts: [
          "A base de dias e horários de trabalho usada para calcular durações e datas do cronograma",
          "A lista de reuniões agendadas da equipe do projeto",
          "O histórico de alterações feitas no arquivo .mpp",
          "Um relatório financeiro consolidado do projeto",
        ],
        correct: 0,
        exp: [
          "Correto — o calendário do projeto define os dias/horas úteis usados em todos os cálculos de cronograma.",
          "Incorreto — reuniões da equipe não são gerenciadas pelo calendário do projeto do MS Project.",
          "Incorreto — histórico de alterações é uma funcionalidade diferente.",
          "Incorreto — relatório financeiro consolidado é gerado em outra área do sistema.",
        ],
      },
    ],
  },
  {
    id: 3,
    icon: "🌳",
    title: "Criar a EAP e Inserir Tarefas em Estrutura Hierárquica",
    domain: "Tarefas, Cronograma e Dependências",
    objective: "Construir a Estrutura Analítica do Projeto (EAP) inserindo tarefas e organizando-as em fases usando recuo (indentação).",
    steps: [
      "No Gráfico de Gantt, insira três tarefas de fase de alto nível: 'Iniciação', 'Planejamento' e 'Execução'.",
      "Abaixo de 'Planejamento', insira duas subtarefas: 'Definir Escopo' e 'Elaborar Cronograma'.",
      "Selecione as duas subtarefas e clique em 'Recuar Tarefa' (Indent) na guia Tarefa, transformando 'Planejamento' automaticamente em uma Tarefa de Resumo.",
      "Repita o processo para a fase 'Execução', adicionando ao menos duas subtarefas próprias.",
      "Observe como a duração, as datas e (futuramente) o custo da Tarefa de Resumo são calculados automaticamente a partir das subtarefas.",
    ],
    quiz: [
      {
        q: "O que acontece ao recuar (indentar) uma tarefa em relação à tarefa imediatamente acima dela?",
        opts: [
          "A tarefa recuada se torna uma subtarefa, e a tarefa acima passa a ser automaticamente uma Tarefa de Resumo",
          "A tarefa recuada é excluída do projeto",
          "O custo da tarefa recuada é zerado",
          "A tarefa recuada se torna automaticamente um marco",
        ],
        correct: 0,
        exp: [
          "Correto — recuar cria uma relação hierárquica, transformando a tarefa superior em Tarefa de Resumo.",
          "Incorreto — recuar uma tarefa não a exclui do projeto.",
          "Incorreto — o custo da tarefa recuada não é zerado; ele passa a compor o total da Tarefa de Resumo.",
          "Incorreto — recuar uma tarefa não a transforma automaticamente em marco.",
        ],
      },
      {
        q: "Por que não é recomendado editar manualmente a duração ou o custo de uma Tarefa de Resumo?",
        opts: [
          "Porque esses valores são calculados automaticamente a partir das subtarefas que ela agrupa",
          "Porque o MS Project bloqueia tecnicamente qualquer tentativa de edição",
          "Porque Tarefas de Resumo nunca podem ter subtarefas",
          "Porque isso sempre gera um erro fatal no arquivo",
        ],
        correct: 0,
        exp: [
          "Correto — os valores da Tarefa de Resumo refletem automaticamente o agregado das subtarefas.",
          "Incorreto — o sistema não bloqueia totalmente a edição, mas ela é sobrescrita pelo cálculo automático.",
          "Incorreto — o próprio conceito de Tarefa de Resumo pressupõe ter subtarefas recuadas abaixo dela.",
          "Incorreto — não gera um erro fatal, apenas um valor que será recalculado.",
        ],
      },
      {
        q: "O que é a EAP (Estrutura Analítica do Projeto)?",
        opts: [
          "Uma decomposição hierárquica de todo o escopo do projeto em pacotes de trabalho gerenciáveis",
          "A lista de todos os riscos identificados no projeto",
          "O organograma dos cargos da empresa",
          "O cronograma final aprovado pelo patrocinador",
        ],
        correct: 0,
        exp: [
          "Correto — a EAP organiza hierarquicamente todo o trabalho do projeto em pacotes gerenciáveis.",
          "Incorreto — a lista de riscos é o registro de riscos, um artefato diferente.",
          "Incorreto — organograma de cargos é uma estrutura organizacional, não uma decomposição de escopo.",
          "Incorreto — o cronograma é derivado da EAP, mas não é a mesma coisa.",
        ],
      },
    ],
  },
  {
    id: 4,
    icon: "🔗",
    title: "Definir Dependências entre Tarefas (Predecessoras)",
    domain: "Tarefas, Cronograma e Dependências",
    objective: "Criar relações de dependência Término-Início entre tarefas e observar o recálculo automático das datas.",
    steps: [
      "Selecione as tarefas 'Definir Escopo' e 'Elaborar Cronograma' (criadas no laboratório anterior), na ordem correta.",
      "Na guia Tarefa, clique em 'Vincular Tarefas' para criar uma dependência Término-Início entre elas.",
      "Observe, na coluna 'Predecessoras', que o ID da tarefa 'Definir Escopo' agora aparece ao lado de 'Elaborar Cronograma'.",
      "Edite a duração da tarefa 'Definir Escopo' para um valor maior e observe como a data de início de 'Elaborar Cronograma' se ajusta automaticamente.",
      "Experimente adicionar um lag de 2 dias na dependência (digitando algo como '3TI+2 dias' na coluna Predecessoras) e observe o novo intervalo entre as tarefas.",
    ],
    quiz: [
      {
        q: "O que significa uma dependência do tipo Término-Início (Finish-to-Start) entre a Tarefa A e a Tarefa B?",
        opts: [
          "A Tarefa B só pode começar depois que a Tarefa A terminar",
          "A Tarefa B deve terminar antes que a Tarefa A comece",
          "As duas tarefas devem começar exatamente ao mesmo tempo",
          "As duas tarefas devem terminar exatamente ao mesmo tempo",
        ],
        correct: 0,
        exp: [
          "Correto — essa é exatamente a definição de Término-Início: a sucessora espera o término da predecessora.",
          "Incorreto — essa descrição corresponde à relação Início-Término, um tipo raro e diferente.",
          "Incorreto — início simultâneo corresponde à relação Início-Início.",
          "Incorreto — término simultâneo corresponde à relação Término-Término.",
        ],
      },
      {
        q: "O que é um 'lag' aplicado a uma dependência entre tarefas?",
        opts: [
          "Um intervalo de tempo adicional inserido entre a predecessora e a sucessora, atrasando o início da sucessora",
          "O tempo total gasto revisando o cronograma",
          "Uma tarefa marcada incorretamente como concluída",
          "O tempo de férias de um recurso específico",
        ],
        correct: 0,
        exp: [
          "Correto — lag é exatamente esse intervalo de espera adicional inserido entre predecessora e sucessora.",
          "Incorreto — tempo gasto revisando o cronograma não é o conceito de lag.",
          "Incorreto — uma tarefa marcada incorretamente como concluída é um erro de dados, não um lag.",
          "Incorreto — férias de um recurso são tratadas no calendário do recurso, não como lag entre tarefas.",
        ],
      },
      {
        q: "Como é possível vincular rapidamente duas tarefas selecionadas no MS Project?",
        opts: [
          "Selecionando as duas tarefas na ordem desejada e clicando em 'Vincular Tarefas' na guia Tarefa",
          "Alterando manualmente a cor da barra de Gantt de cada tarefa",
          "Renomeando as duas tarefas com o mesmo nome",
          "Movendo fisicamente uma tarefa para cima da outra na lista",
        ],
        correct: 0,
        exp: [
          "Correto — 'Vincular Tarefas' é o comando padrão para criar dependências rapidamente entre tarefas selecionadas.",
          "Incorreto — alterar a cor da barra é apenas formatação visual, sem criar dependência lógica.",
          "Incorreto — renomear tarefas com o mesmo nome não cria nenhuma relação de dependência.",
          "Incorreto — apenas mover a posição de uma tarefa na lista não cria automaticamente uma dependência.",
        ],
      },
    ],
  },
  {
    id: 5,
    icon: "🚩",
    title: "Adicionar Marcos e Organizar Tarefas em Fases",
    domain: "Tarefas, Cronograma e Dependências",
    objective: "Inserir tarefas do tipo marco para sinalizar pontos de controle importantes no cronograma do projeto.",
    steps: [
      "Ao final da fase 'Planejamento', insira uma nova tarefa chamada 'Aprovação do Planejamento'.",
      "Defina a duração dessa tarefa como '0 dias' — o MS Project deve exibi-la automaticamente com o símbolo de losango (marco) no Gráfico de Gantt.",
      "Vincule esse marco como sucessor das tarefas de planejamento relevantes, usando dependência Término-Início.",
      "Repita o processo criando um marco 'Fim do Projeto' ao término da última fase (Execução).",
      "Aplique um filtro para exibir apenas os marcos do projeto (Guia Exibir → Filtro → Marcos, se disponível) e confira se todos aparecem corretamente.",
    ],
    quiz: [
      {
        q: "O que caracteriza uma tarefa do tipo 'Marco' no MS Project?",
        opts: [
          "Tem duração zero e representa um evento ou ponto de controle importante no cronograma",
          "Sempre tem a maior duração entre todas as tarefas do projeto",
          "É automaticamente definida como tarefa crítica",
          "Não pode ter predecessoras nem sucessoras",
        ],
        correct: 0,
        exp: [
          "Correto — duração zero e função de 'ponto de controle' são as características centrais de um marco.",
          "Incorreto — marcos têm duração zero, exatamente o oposto de ter a maior duração do projeto.",
          "Incorreto — um marco só é considerado crítico se estiver no caminho crítico, não é automático.",
          "Incorreto — marcos podem (e geralmente têm) predecessoras e sucessoras normalmente.",
        ],
      },
      {
        q: "Como o Gráfico de Gantt representa visualmente um marco, por padrão?",
        opts: [
          "Como um símbolo de losango, já que a duração é zero",
          "Como uma barra longa e vermelha",
          "Como um ícone de cadeado",
          "Marcos não aparecem visualmente no Gráfico de Gantt",
        ],
        correct: 0,
        exp: [
          "Correto — marcos são representados por um símbolo de losango no Gráfico de Gantt, devido à duração zero.",
          "Incorreto — uma barra longa representaria uma tarefa com duração significativa, não um marco.",
          "Incorreto — o ícone de cadeado está associado a restrições de data, não à representação padrão de marcos.",
          "Incorreto — marcos aparecem sim visualmente no Gráfico de Gantt, através do símbolo de losango.",
        ],
      },
      {
        q: "Qual é a utilidade prática de organizar tarefas em fases dentro do cronograma?",
        opts: [
          "Facilita a organização visual e o acompanhamento do progresso de grandes blocos de trabalho do projeto",
          "É uma exigência técnica obrigatória do MS Project para salvar o arquivo",
          "Elimina a necessidade de definir dependências entre tarefas",
          "Transforma automaticamente todas as tarefas em marcos",
        ],
        correct: 0,
        exp: [
          "Correto — organizar em fases melhora a legibilidade e o acompanhamento visual de grandes blocos de trabalho.",
          "Incorreto — organizar em fases não é uma exigência técnica obrigatória do software.",
          "Incorreto — dependências entre tarefas continuam sendo necessárias mesmo com a organização em fases.",
          "Incorreto — organizar tarefas em fases não transforma automaticamente nenhuma tarefa em marco.",
        ],
      },
    ],
  },
  {
    id: 6,
    icon: "👥",
    title: "Cadastrar Recursos na Planilha de Recursos",
    domain: "Recursos, Custos e Atribuições",
    objective: "Usar a Planilha de Recursos para cadastrar recursos de Trabalho e Material com suas respectivas taxas de custo.",
    steps: [
      "Na guia Exibir, mude para a visualização 'Planilha de Recursos' (Resource Sheet).",
      "Cadastre dois recursos do tipo Trabalho (ex.: 'Analista de Projetos' e 'Desenvolvedor'), definindo a Taxa Padrão de cada um (ex.: R$ 60/hora e R$ 80/hora).",
      "Cadastre um recurso do tipo Material (ex.: 'Licença de Software'), definindo o custo por unidade.",
      "Defina a Capacidade Máxima do 'Analista de Projetos' como 50% (meio período) e a do 'Desenvolvedor' como 100%.",
      "Configure um calendário de recurso personalizado para o 'Analista de Projetos', marcando um dia de folga específico dentro do próximo mês.",
    ],
    quiz: [
      {
        q: "Quais são os três tipos de recurso que podem ser cadastrados na Planilha de Recursos do MS Project?",
        opts: [
          "Trabalho, Material e Custo",
          "Interno, Externo e Terceirizado",
          "Crítico, Não Crítico e Recorrente",
          "Fixo, Variável e Nulo",
        ],
        correct: 0,
        exp: [
          "Correto — Trabalho, Material e Custo são os três tipos formais de recurso no MS Project.",
          "Incorreto — interno/externo/terceirizado são classificações organizacionais, não tipos formais de recurso.",
          "Incorreto — crítico/não crítico/recorrente são conceitos relacionados a tarefas, não a recursos.",
          "Incorreto — fixo/variável/nulo não são os tipos formais de recurso reconhecidos pelo MS Project.",
        ],
      },
      {
        q: "O que representa o campo 'Capacidade Máxima' (Max Units) de um recurso?",
        opts: [
          "A disponibilidade percentual máxima daquele recurso para o projeto (ex.: 100% = tempo integral)",
          "O número máximo de tarefas que o recurso pode ter em toda a sua carreira",
          "O limite de custo total que o recurso pode gerar no projeto",
          "A quantidade máxima de material disponível em estoque",
        ],
        correct: 0,
        exp: [
          "Correto — Capacidade Máxima define, em percentual, a disponibilidade daquele recurso para o projeto.",
          "Incorreto — não se trata de um limite de tarefas na carreira do recurso.",
          "Incorreto — Capacidade Máxima não é uma medida de custo, mas sim de tempo/disponibilidade.",
          "Incorreto — quantidade de material em estoque é controlada de outra forma.",
        ],
      },
      {
        q: "Qual é a diferença fundamental entre um recurso do tipo 'Trabalho' e um do tipo 'Material'?",
        opts: [
          "'Trabalho' consome tempo e é reutilizável entre tarefas; 'Material' é consumido em unidades e geralmente não é reutilizável",
          "Não existe diferença prática entre os dois tipos",
          "'Material' só pode ser usado em uma única tarefa durante todo o projeto",
          "'Trabalho' nunca pode ter um custo associado",
        ],
        correct: 0,
        exp: [
          "Correto — essa é a distinção central entre os dois tipos, em unidade de medida e reutilização.",
          "Incorreto — há diferenças importantes de comportamento e cálculo entre os dois tipos de recurso.",
          "Incorreto — recursos de Material podem ser usados (consumidos) em múltiplas tarefas ao longo do projeto.",
          "Incorreto — recursos de Trabalho normalmente têm custo associado via Taxa Padrão/Hora Extra.",
        ],
      },
    ],
  },
  {
    id: 7,
    icon: "📌",
    title: "Atribuir Recursos às Tarefas e Identificar Superalocação",
    domain: "Recursos, Custos e Atribuições",
    objective: "Atribuir os recursos cadastrados às tarefas do cronograma e usar o Gráfico de Recursos para identificar superalocação.",
    steps: [
      "Selecione a tarefa 'Definir Escopo' e, na guia Recurso, abra 'Atribuir Recursos', marcando o 'Analista de Projetos'.",
      "Atribua o 'Desenvolvedor' à tarefa 'Elaborar Cronograma' e a outra subtarefa da fase Execução criada anteriormente.",
      "Atribua o 'Analista de Projetos' também a uma segunda tarefa que ocorra no mesmo período da primeira, gerando uma superalocação proposital.",
      "Mude para a visualização 'Gráfico de Recursos' (guia Exibir) e observe o destaque em vermelho indicando a superalocação do 'Analista de Projetos'.",
      "Use a funcionalidade de Nivelar Recursos (guia Recurso → Nivelar Tudo) e observe como o MS Project ajusta as datas para resolver o conflito.",
    ],
    quiz: [
      {
        q: "O que é 'superalocação' de um recurso no MS Project?",
        opts: [
          "Quando um recurso é atribuído a mais trabalho do que sua capacidade disponível permite em um período",
          "Quando um recurso não possui nenhuma tarefa atribuída",
          "Quando o custo do recurso excede o orçamento total do projeto",
          "Quando um recurso é do tipo Material em vez de Trabalho",
        ],
        correct: 0,
        exp: [
          "Correto — superalocação ocorre quando o trabalho atribuído excede a capacidade disponível do recurso.",
          "Incorreto — recurso sem nenhuma tarefa atribuída seria subutilização, o oposto de superalocação.",
          "Incorreto — superalocação é uma questão de tempo/capacidade, não diretamente de custo total.",
          "Incorreto — o tipo do recurso não define, por si só, superalocação.",
        ],
      },
      {
        q: "Qual visualização ajuda a identificar visualmente recursos superalocados?",
        opts: [
          "Gráfico de Recursos (Resource Graph) ou a visão 'Uso de Recursos'",
          "O Diagrama de Rede",
          "A Linha do Tempo",
          "O Dicionário da EAP",
        ],
        correct: 0,
        exp: [
          "Correto — Gráfico de Recursos e Uso de Recursos são as ferramentas específicas para identificar superalocação.",
          "Incorreto — o Diagrama de Rede foca na lógica de dependências entre tarefas.",
          "Incorreto — a Linha do Tempo é uma visão resumida de fases/marcos.",
          "Incorreto — o Dicionário da EAP é um conceito de gestão de escopo.",
        ],
      },
      {
        q: "O que pode acontecer ao usar 'Nivelar Tudo' para resolver uma superalocação?",
        opts: [
          "O MS Project pode atrasar tarefas não críticas — ou até mesmo o caminho crítico — para eliminar o conflito",
          "O recurso superalocado é automaticamente excluído do projeto",
          "O custo do projeto é reduzido automaticamente pela metade",
          "Todas as tarefas do projeto se tornam marcos",
        ],
        correct: 0,
        exp: [
          "Correto — o nivelamento redistribui trabalho para eliminar superalocação, podendo atrasar tarefas.",
          "Incorreto — nivelar recursos não exclui o recurso do projeto, apenas ajusta a distribuição do trabalho dele.",
          "Incorreto — nivelamento de recursos não reduz automaticamente o custo do projeto.",
          "Incorreto — nivelamento não transforma tarefas normais em marcos.",
        ],
      },
    ],
  },
  {
    id: 8,
    icon: "💰",
    title: "Definir Custos Fixos e Analisar o Custo Total do Projeto",
    domain: "Recursos, Custos e Atribuições",
    objective: "Adicionar um custo fixo a uma tarefa e consultar o custo total consolidado do projeto nas Estatísticas do Projeto.",
    steps: [
      "Mude para a visualização 'Gráfico de Gantt' e insira a coluna 'Custo Fixo' na tabela de tarefas (clique direito no cabeçalho de uma coluna → Inserir Coluna).",
      "Na tarefa 'Aprovação do Planejamento', digite um valor de Custo Fixo (ex.: R$ 500), representando uma taxa administrativa.",
      "Insira também a coluna 'Custo' e observe como ela soma automaticamente o custo dos recursos atribuídos com o custo fixo de cada tarefa.",
      "Acesse Guia Projeto → Informações do Projeto → Estatísticas do Projeto e anote o custo total consolidado do projeto.",
      "Altere a Taxa Padrão de um dos recursos cadastrados e observe como o custo total nas Estatísticas do Projeto é recalculado automaticamente.",
    ],
    quiz: [
      {
        q: "O que é um 'Custo Fixo' associado diretamente a uma tarefa?",
        opts: [
          "Um valor monetário digitado diretamente na tarefa, independente dos recursos atribuídos a ela",
          "O custo mínimo obrigatório de qualquer tarefa do projeto",
          "O custo automático gerado ao vincular duas tarefas",
          "Um custo que só existe em tarefas do tipo marco",
        ],
        correct: 0,
        exp: [
          "Correto — Custo Fixo é um valor monetário direto na tarefa, independente do cálculo baseado em recursos.",
          "Incorreto — Custo Fixo não é um valor mínimo obrigatório; é opcional e específico a cada tarefa.",
          "Incorreto — vincular tarefas (criar dependência) não gera automaticamente nenhum custo fixo.",
          "Incorreto — Custo Fixo pode ser aplicado a qualquer tipo de tarefa, não é exclusivo de marcos.",
        ],
      },
      {
        q: "Onde é possível visualizar rapidamente o custo total consolidado de todo o projeto?",
        opts: [
          "Guia Projeto → Informações do Projeto → Estatísticas do Projeto",
          "Guia Exibir → Zoom",
          "Guia Formatar → Estilos de Barra",
          "Guia Tarefa → Fonte",
        ],
        correct: 0,
        exp: [
          "Correto — Estatísticas do Projeto reúne os totais consolidados, incluindo o custo total do projeto.",
          "Incorreto — o controle de Zoom altera apenas a visualização do Gantt.",
          "Incorreto — Estilos de Barra tratam de formatação visual das barras de Gantt.",
          "Incorreto — a guia Fonte trata de formatação de texto.",
        ],
      },
      {
        q: "O que acontece ao custo de uma tarefa quando se altera a Taxa Padrão de um recurso já atribuído a ela?",
        opts: [
          "O custo da tarefa é recalculado automaticamente com base na nova taxa",
          "O custo da tarefa permanece congelado no valor original",
          "A tarefa é automaticamente excluída do projeto",
          "O recurso é automaticamente removido da tarefa",
        ],
        correct: 0,
        exp: [
          "Correto — o MS Project recalcula automaticamente o custo com base na taxa atualizada do recurso, por padrão.",
          "Incorreto — o custo não fica congelado automaticamente; ele é recalculado.",
          "Incorreto — alterar a taxa de um recurso não exclui automaticamente a tarefa do projeto.",
          "Incorreto — alterar a taxa não remove o recurso da atribuição existente na tarefa.",
        ],
      },
    ],
  },
  {
    id: 9,
    icon: "📸",
    title: "Salvar uma Linha de Base e Acompanhar o Progresso",
    domain: "Controle, Linha de Base, Relatórios e Análises",
    objective: "Salvar a linha de base do projeto, registrar progresso real em algumas tarefas e comparar com o planejado.",
    steps: [
      "Com o cronograma completo do laboratório anterior, acesse a guia Projeto → Definir Linha de Base → Definir Linha de Base e confirme para todo o projeto.",
      "Insira a coluna 'Início da Linha de Base' e 'Término da Linha de Base' na tabela de tarefas para visualizar os valores salvos.",
      "Marque a tarefa 'Definir Escopo' como 100% concluída, usando a coluna '% Concluída' ou o botão de progresso na guia Tarefa.",
      "Registre 50% de progresso na tarefa 'Elaborar Cronograma' e observe a Barra de Progresso preenchida parcialmente dentro da barra de Gantt.",
      "Insira a coluna 'Variação de Duração' e verifique se alguma tarefa já apresenta desvio em relação à linha de base salva.",
    ],
    quiz: [
      {
        q: "Como se define (salva) uma linha de base no Microsoft Project?",
        opts: [
          "Guia Projeto → Definir Linha de Base → Definir Linha de Base",
          "Guia Exibir → Zoom → 100%",
          "Guia Tarefa → Fonte → Negrito",
          "Guia Arquivo → Imprimir",
        ],
        correct: 0,
        exp: [
          "Correto — 'Definir Linha de Base', na guia Projeto, é o comando exato para salvar essa referência.",
          "Incorreto — controle de Zoom afeta apenas a visualização, sem relação com linha de base.",
          "Incorreto — negrito é uma opção de formatação de texto.",
          "Incorreto — o menu de Imprimir trata da impressão do arquivo, não da criação de uma linha de base.",
        ],
      },
      {
        q: "Qual é o propósito de comparar a Linha de Base com os dados Reais durante o acompanhamento do projeto?",
        opts: [
          "Identificar variações entre o que foi planejado e o que está realmente acontecendo, permitindo ações corretivas",
          "Apenas cumprir uma exigência burocrática sem valor prático",
          "Substituir permanentemente os dados planejados pelos dados reais",
          "Gerar automaticamente um novo cronograma do zero",
        ],
        correct: 0,
        exp: [
          "Correto — identificar variações entre planejado e real é o objetivo central dessa comparação.",
          "Incorreto — essa comparação tem valor prático significativo, longe de ser apenas burocrática.",
          "Incorreto — os dados reais não substituem a linha de base; ambos coexistem para comparação.",
          "Incorreto — comparar linha de base com dados reais não gera automaticamente um cronograma novo.",
        ],
      },
      {
        q: "O que representa a Barra de Progresso exibida dentro das barras de Gantt?",
        opts: [
          "Um preenchimento interno que mostra visualmente quanto da tarefa já foi concluído, com base na % Concluída",
          "Uma barra que mostra apenas o nome do recurso responsável",
          "Um indicador exclusivo de tarefas críticas",
          "Uma barra usada apenas para tarefas do tipo marco",
        ],
        correct: 0,
        exp: [
          "Correto — a Barra de Progresso mostra visualmente o avanço real da tarefa, proporcional à % Concluída.",
          "Incorreto — o nome do recurso é exibido separadamente, não representado pela barra de progresso.",
          "Incorreto — a barra de progresso pode aparecer em qualquer tarefa, não é exclusiva de tarefas críticas.",
          "Incorreto — marcos, por terem duração zero, normalmente não exibem uma barra de progresso interna.",
        ],
      },
    ],
  },
  {
    id: 10,
    icon: "📈",
    title: "Identificar o Caminho Crítico e Gerar um Relatório Visual",
    domain: "Controle, Linha de Base, Relatórios e Análises",
    objective: "Visualizar o caminho crítico do cronograma e usar os painéis prontos da guia Relatório para comunicar o status do projeto.",
    steps: [
      "No Gráfico de Gantt, observe as barras destacadas em vermelho (cor padrão), que indicam as tarefas do caminho crítico.",
      "Use Guia Exibir → Agrupar Por → Crítica para reorganizar as tarefas em dois blocos: críticas e não críticas.",
      "Acesse a guia Relatório → Painéis e abra o relatório pronto 'Visão Geral do Projeto', observando os indicadores exibidos.",
      "Explore também o relatório pronto 'Tarefas Críticas', disponível na mesma guia, e compare com o que você identificou manualmente no Gantt.",
      "Use Arquivo → Imprimir → Visualizar Impressão para gerar uma prévia do Gráfico de Gantt pronta para compartilhar em PDF.",
    ],
    quiz: [
      {
        q: "O que representa a barra vermelha (cor padrão) no Gráfico de Gantt do MS Project?",
        opts: [
          "Tarefas que fazem parte do caminho crítico do cronograma",
          "Tarefas já concluídas com 100% de progresso",
          "Tarefas atribuídas ao gerente do projeto",
          "Tarefas com custo acima do orçamento",
        ],
        correct: 0,
        exp: [
          "Correto — a cor vermelha padrão indica tarefas críticas, sem folga no cronograma.",
          "Incorreto — tarefas concluídas geralmente são representadas com preenchimento sólido de progresso.",
          "Incorreto — a cor da barra não indica quem é o responsável pela tarefa.",
          "Incorreto — estouro de orçamento é sinalizado por indicadores específicos de custo.",
        ],
      },
      {
        q: "O que é o 'Caminho Crítico' de um cronograma?",
        opts: [
          "A sequência de tarefas dependentes que determina a menor duração possível do projeto",
          "A lista de tarefas mais caras do orçamento",
          "As tarefas atribuídas ao gerente de projetos",
          "As tarefas que já foram concluídas",
        ],
        correct: 0,
        exp: [
          "Correto — o caminho crítico é a cadeia de tarefas sem folga que determina a duração mínima do projeto.",
          "Incorreto — custo das tarefas não define o caminho crítico.",
          "Incorreto — o caminho crítico não depende de quem está atribuído às tarefas.",
          "Incorreto — tarefas concluídas fazem parte do histórico, mas o caminho crítico é uma análise da rede completa.",
        ],
      },
      {
        q: "Qual é a finalidade da guia Relatório → Painéis no MS Project?",
        opts: [
          "Fornecer visualizações gráficas prontas, resumindo o status do projeto sem necessidade de configuração manual",
          "Alterar permanentemente o calendário do projeto",
          "Excluir automaticamente tarefas concluídas",
          "Configurar senhas de acesso ao arquivo",
        ],
        correct: 0,
        exp: [
          "Correto — os Painéis fornecem visualizações gráficas prontas para comunicação rápida do status.",
          "Incorreto — acessar os painéis de relatório não altera o calendário do projeto.",
          "Incorreto — usar os painéis não exclui automaticamente nenhuma tarefa do projeto.",
          "Incorreto — configuração de senha de acesso é feita em outra área, não relacionada aos Painéis.",
        ],
      },
    ],
    externalLink: { url: "https://support.microsoft.com/pt-br/project", label: "📘 Ver documentação oficial do Microsoft Project" },
  },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = LAB_BANK;
}
