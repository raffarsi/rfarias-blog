const QUESTION_BANK = [
  // DOMÍNIO 1: Conceitos de Segurança, Conformidade e Identidade (25-30%)
  {
    id: "sc001", domain: "Conceitos de Segurança", difficulty: "basico",
    question: "O que é o modelo de responsabilidade compartilhada na nuvem?",
    options: [
      "A Microsoft é responsável por toda a segurança na nuvem",
      "O cliente é responsável por toda a segurança na nuvem",
      "A responsabilidade de segurança é dividida entre o provedor de nuvem e o cliente",
      "Não existe responsabilidade de segurança na nuvem"
    ],
    correct: 2,
    explanation: "No modelo de responsabilidade compartilhada, o provedor de nuvem (Microsoft) é responsável pela segurança DA nuvem (infraestrutura física, rede, hosts), enquanto o cliente é responsável pela segurança NA nuvem (dados, identidades, aplicações, configurações).",
    tip: "A divisão de responsabilidades varia de acordo com o modelo de serviço: IaaS, PaaS ou SaaS."
  },
  {
    id: "sc002", domain: "Conceitos de Segurança", difficulty: "basico",
    question: "O que representa a tríade CIA em segurança da informação?",
    options: [
      "Cyber, Intelligence, Automation",
      "Confidentiality, Integrity, Availability (Confidencialidade, Integridade, Disponibilidade)",
      "Control, Identity, Access",
      "Cloud, Infrastructure, Architecture"
    ],
    correct: 1,
    explanation: "A tríade CIA representa os três pilares fundamentais da segurança da informação: Confidencialidade (somente pessoas autorizadas acessam), Integridade (dados não são alterados indevidamente) e Disponibilidade (sistemas e dados acessíveis quando necessário).",
    tip: "CIA é a base de qualquer estratégia de segurança da informação."
  },
  {
    id: "sc003", domain: "Conceitos de Segurança", difficulty: "basico",
    question: "O que é o modelo Zero Trust?",
    options: [
      "Um modelo que não confia em nenhuma conexão de rede interna ou externa sem verificação",
      "Um modelo que confia apenas em usuários internos da organização",
      "Um modelo que bloqueia todo o tráfego de rede externo",
      "Um modelo que não requer autenticação para usuários internos"
    ],
    correct: 0,
    explanation: "Zero Trust é um modelo de segurança baseado no princípio 'nunca confie, sempre verifique'. Nenhuma solicitação é confiável por padrão, mesmo vindas de dentro da rede corporativa. Toda solicitação deve ser verificada, autenticada e autorizada.",
    tip: "Os três princípios do Zero Trust: verificar explicitamente, usar acesso de privilégio mínimo e assumir violação."
  },
  {
    id: "sc004", domain: "Conceitos de Segurança", difficulty: "intermediario",
    question: "O que é defesa em profundidade (defense in depth)?",
    options: [
      "Uma única camada de segurança muito robusta",
      "Uma estratégia que usa múltiplas camadas de segurança para proteger recursos",
      "Um firewall avançado que bloqueia todos os ataques",
      "Um sistema de backup de dados críticos"
    ],
    correct: 1,
    explanation: "Defesa em profundidade é uma estratégia que emprega múltiplas camadas de segurança. Se uma camada for comprometida, as camadas subsequentes continuam protegendo os recursos. As camadas incluem: segurança física, identidade, perímetro, rede, computação, aplicação e dados.",
    tip: "Pense como as camadas de uma cebola — cada camada adiciona uma barreira adicional."
  },
  {
    id: "sc005", domain: "Conceitos de Segurança", difficulty: "intermediario",
    question: "O que é criptografia em repouso (encryption at rest)?",
    options: [
      "Criptografia de dados durante a transmissão pela rede",
      "Criptografia de dados armazenados em disco ou banco de dados",
      "Criptografia de dados na memória RAM",
      "Criptografia de senhas de usuários"
    ],
    correct: 1,
    explanation: "Criptografia em repouso protege dados armazenados (em discos, bancos de dados, backups). Complementa a criptografia em trânsito, que protege dados durante a transmissão. Juntas, garantem que os dados estejam protegidos em todos os estados.",
    tip: "No Azure, o Storage Service Encryption aplica criptografia em repouso automaticamente."
  },
  {
    id: "sc006", domain: "Conceitos de Segurança", difficulty: "basico",
    question: "O que é o princípio do menor privilégio (least privilege)?",
    options: [
      "Dar a todos os usuários acesso de administrador para maior produtividade",
      "Conceder aos usuários apenas as permissões mínimas necessárias para realizar seu trabalho",
      "Restringir o acesso somente para usuários externos",
      "Permitir acesso total apenas para gerentes e executivos"
    ],
    correct: 1,
    explanation: "O princípio do menor privilégio determina que usuários, aplicações e sistemas devem ter apenas as permissões mínimas necessárias para realizar suas funções. Isso limita o dano potencial caso uma conta seja comprometida.",
    tip: "É um dos princípios fundamentais do Zero Trust."
  },
  {
    id: "sc007", domain: "Conceitos de Conformidade", difficulty: "basico",
    question: "O que é GDPR?",
    options: [
      "Um padrão de segurança de rede da Microsoft",
      "Um regulamento europeu de proteção de dados pessoais",
      "Um protocolo de criptografia de dados",
      "Uma ferramenta de monitoramento de segurança"
    ],
    correct: 1,
    explanation: "GDPR (General Data Protection Regulation) é o Regulamento Geral de Proteção de Dados da União Europeia, em vigor desde maio de 2018. Estabelece regras para coleta, armazenamento e processamento de dados pessoais de cidadãos europeus.",
    tip: "No Brasil, a equivalente é a LGPD (Lei Geral de Proteção de Dados)."
  },
  {
    id: "sc008", domain: "Conceitos de Conformidade", difficulty: "intermediario",
    question: "O que é o Microsoft Compliance Manager?",
    options: [
      "Uma ferramenta para gerenciar licenças do Microsoft 365",
      "Uma ferramenta que ajuda organizações a gerenciar requisitos de conformidade regulatória",
      "Um antivírus da Microsoft",
      "Uma ferramenta de backup de dados"
    ],
    correct: 1,
    explanation: "O Microsoft Compliance Manager é uma ferramenta no Microsoft Purview que ajuda organizações a gerenciar requisitos de conformidade. Fornece pontuação de conformidade, recomendações de ações e mapeamento de controles para regulamentos como GDPR, ISO 27001 e outros.",
    tip: "O Compliance Manager oferece uma pontuação que indica o nível de conformidade da organização."
  },

  // DOMÍNIO 2: Identidade e Acesso (25-30%)
  {
    id: "sc009", domain: "Identidade e Acesso", difficulty: "basico",
    question: "O que é o Microsoft Entra ID (anteriormente Azure Active Directory)?",
    options: [
      "Um sistema de arquivos na nuvem",
      "Um serviço de identidade e acesso baseado em nuvem",
      "Um firewall de rede virtual",
      "Um sistema de backup de dados"
    ],
    correct: 1,
    explanation: "O Microsoft Entra ID é o serviço de gerenciamento de identidade e acesso (IAM) baseado em nuvem da Microsoft. Permite que funcionários façam login e acessem recursos externos (Microsoft 365, Azure) e internos (aplicativos corporativos, intranet).",
    tip: "O Entra ID é o sucessor do Azure Active Directory (Azure AD)."
  },
  {
    id: "sc010", domain: "Identidade e Acesso", difficulty: "basico",
    question: "O que é autenticação multifator (MFA)?",
    options: [
      "Usar a mesma senha em múltiplos sistemas",
      "Um processo que requer duas ou mais formas de verificação de identidade",
      "Autenticação usando apenas biometria",
      "Login com múltiplos usuários ao mesmo tempo"
    ],
    correct: 1,
    explanation: "MFA (Multi-Factor Authentication) requer que o usuário apresente dois ou mais fatores de verificação: algo que você sabe (senha), algo que você tem (telefone/token), e algo que você é (biometria). Aumenta significativamente a segurança da conta.",
    tip: "O MFA pode bloquear mais de 99,9% dos ataques de comprometimento de contas."
  },
  {
    id: "sc011", domain: "Identidade e Acesso", difficulty: "intermediario",
    question: "O que é o Acesso Condicional no Microsoft Entra ID?",
    options: [
      "Um sistema que bloqueia todos os acessos externos",
      "Uma ferramenta que permite ou nega acesso com base em condições específicas como localização, dispositivo e risco",
      "Um método de autenticação sem senha",
      "Um sistema de gerenciamento de senhas"
    ],
    correct: 1,
    explanation: "O Acesso Condicional é uma ferramenta do Microsoft Entra ID que automatiza decisões de controle de acesso com base em sinais (usuário, localização, dispositivo, aplicativo, risco). Funciona como um guardião que avalia o contexto antes de conceder acesso.",
    tip: "O Acesso Condicional é o mecanismo de controle de acesso central do Zero Trust no Microsoft."
  },
  {
    id: "sc012", domain: "Identidade e Acesso", difficulty: "intermediario",
    question: "O que é o RBAC (Role-Based Access Control)?",
    options: [
      "Um sistema de controle de acesso baseado na localização geográfica do usuário",
      "Um sistema que controla o acesso com base em funções atribuídas aos usuários",
      "Um método de autenticação biométrica",
      "Um sistema de registro de acesso a logs"
    ],
    correct: 1,
    explanation: "RBAC (Controle de Acesso Baseado em Funções) concede acesso com base nas funções dos usuários dentro da organização. Em vez de atribuir permissões a indivíduos, você atribui funções que contêm as permissões necessárias. No Azure, os papéis incluem Proprietário, Contribuidor e Leitor.",
    tip: "O RBAC implementa o princípio do menor privilégio de forma escalável."
  },
  {
    id: "sc013", domain: "Identidade e Acesso", difficulty: "avancado",
    question: "O que é o Microsoft Entra Privileged Identity Management (PIM)?",
    options: [
      "Uma ferramenta para gerenciar senhas de usuários comuns",
      "Um serviço que fornece acesso privilegiado just-in-time e sob aprovação a recursos",
      "Um sistema de monitoramento de rede",
      "Uma ferramenta de backup para contas de administrador"
    ],
    correct: 1,
    explanation: "O PIM permite que você gerencie, controle e monitore o acesso a recursos importantes. Fornece acesso just-in-time (temporário quando necessário), aprovação obrigatória para ativar papéis privilegiados, e auditoria completa de quem usou privilégios e quando.",
    tip: "PIM ajuda a reduzir o risco de contas com acesso privilegiado permanente."
  },
  {
    id: "sc014", domain: "Identidade e Acesso", difficulty: "basico",
    question: "O que é Single Sign-On (SSO)?",
    options: [
      "Usar uma senha única para todos os sistemas da empresa",
      "Uma autenticação que permite ao usuário fazer login uma vez e acessar múltiplos aplicativos",
      "Um sistema que obriga a troca de senha periodicamente",
      "Login com apenas um fator de autenticação"
    ],
    correct: 1,
    explanation: "SSO permite que os usuários façam login uma única vez e acessem múltiplos aplicativos e serviços sem precisar se autenticar novamente. Melhora a experiência do usuário e reduz a fadiga de senhas, enquanto mantém a segurança centralizada.",
    tip: "O Microsoft Entra ID suporta SSO para milhares de aplicativos SaaS."
  },
  {
    id: "sc015", domain: "Identidade e Acesso", difficulty: "intermediario",
    question: "O que é o Microsoft Entra External ID?",
    options: [
      "Uma solução para gerenciar identidades de funcionários internos",
      "Uma solução para gerenciar identidades de usuários externos como clientes e parceiros",
      "Um sistema de firewall externo",
      "Uma VPN para acesso externo"
    ],
    correct: 1,
    explanation: "O Microsoft Entra External ID (anteriormente Azure AD B2B e B2C) gerencia identidades de usuários externos. Permite que parceiros de negócios (B2B) usem suas próprias credenciais para acessar recursos da sua organização, e que clientes (B2C) criem contas em seus aplicativos.",
    tip: "External ID separa a gestão de identidades externas das identidades internas dos funcionários."
  },

  // DOMÍNIO 3: Soluções de Segurança da Microsoft (35-40%)
  {
    id: "sc016", domain: "Soluções de Segurança", difficulty: "basico",
    question: "O que é o Microsoft Defender for Cloud?",
    options: [
      "Um antivírus para computadores Windows",
      "Uma plataforma de segurança que protege workloads em nuvem, on-premises e híbridas",
      "Uma ferramenta de backup na nuvem",
      "Um sistema de gerenciamento de emails"
    ],
    correct: 1,
    explanation: "O Microsoft Defender for Cloud é uma plataforma de proteção de aplicativos nativa da nuvem (CNAPP). Oferece postura de segurança unificada, proteção de workloads em Azure, AWS e GCP, e detecção de ameaças em tempo real.",
    tip: "Anteriormente chamado de Azure Security Center e Azure Defender."
  },
  {
    id: "sc017", domain: "Soluções de Segurança", difficulty: "intermediario",
    question: "O que é o Microsoft Sentinel?",
    options: [
      "Um sistema de firewall de próxima geração",
      "Uma solução SIEM e SOAR nativa da nuvem para detecção e resposta a ameaças",
      "Uma ferramenta de gerenciamento de patches",
      "Um sistema de backup e recuperação"
    ],
    correct: 1,
    explanation: "O Microsoft Sentinel é um SIEM (Security Information and Event Management) e SOAR (Security Orchestration, Automation and Response) nativo da nuvem. Coleta dados de toda a organização, detecta ameaças com IA, investiga incidentes e automatiza respostas.",
    tip: "O Sentinel usa IA e aprendizado de máquina para reduzir o ruído de alertas e priorizar ameaças reais."
  },
  {
    id: "sc018", domain: "Soluções de Segurança", difficulty: "basico",
    question: "O que é o Microsoft Defender for Endpoint?",
    options: [
      "Uma solução de segurança para dispositivos (endpoints) como computadores e smartphones",
      "Um firewall para proteção de servidores web",
      "Uma ferramenta de gerenciamento de rede",
      "Um sistema de autenticação de dois fatores"
    ],
    correct: 0,
    explanation: "O Microsoft Defender for Endpoint é uma plataforma de segurança de endpoints de nível empresarial. Oferece proteção preventiva, detecção pós-violação, investigação automatizada e resposta a ameaças em dispositivos Windows, Mac, Linux, Android e iOS.",
    tip: "Faz parte do conjunto Microsoft Defender XDR (Extended Detection and Response)."
  },
  {
    id: "sc019", domain: "Soluções de Segurança", difficulty: "intermediario",
    question: "O que é o Microsoft Purview?",
    options: [
      "Uma solução de firewall de rede",
      "Um conjunto de soluções de governança, risco e conformidade de dados",
      "Uma plataforma de desenvolvimento de aplicativos",
      "Um sistema de monitoramento de desempenho"
    ],
    correct: 1,
    explanation: "O Microsoft Purview é um conjunto unificado de soluções de governança, conformidade e segurança de dados. Inclui ferramentas para descoberta e classificação de dados, prevenção de perda de dados (DLP), gerenciamento de ciclo de vida de dados e conformidade regulatória.",
    tip: "O Microsoft Purview unificou o Microsoft Information Protection e o Microsoft Compliance."
  },
  {
    id: "sc020", domain: "Soluções de Segurança", difficulty: "intermediario",
    question: "O que é o Azure Key Vault?",
    options: [
      "Um cofre físico para armazenar hardware de segurança",
      "Um serviço para armazenar e gerenciar segredos, chaves e certificados de forma segura",
      "Um sistema de backup de senhas de usuários",
      "Uma ferramenta de gerenciamento de licenças"
    ],
    correct: 1,
    explanation: "O Azure Key Vault é um serviço de nuvem para armazenar e acessar segredos (senhas, strings de conexão), chaves criptográficas e certificados de forma segura. Centraliza o gerenciamento de segredos e elimina a necessidade de armazená-los em código ou arquivos de configuração.",
    tip: "O Key Vault integra com Managed Identity para acesso seguro sem credenciais no código."
  },
  {
    id: "sc021", domain: "Soluções de Segurança", difficulty: "basico",
    question: "O que é o Azure DDoS Protection?",
    options: [
      "Uma proteção contra vírus em máquinas virtuais Azure",
      "Uma proteção contra ataques de negação de serviço distribuído (DDoS)",
      "Uma ferramenta de criptografia de dados",
      "Um sistema de autenticação de rede"
    ],
    correct: 1,
    explanation: "O Azure DDoS Protection protege recursos Azure contra ataques DDoS (Distributed Denial of Service), que tentam tornar recursos indisponíveis sobrecarregando-os com tráfego malicioso. O serviço Basic é incluído automaticamente; o Standard oferece proteção avançada com mitigação adaptativa.",
    tip: "O DDoS Protection Standard monitora padrões de tráfego 24/7 e mitiga ataques automaticamente."
  },
  {
    id: "sc022", domain: "Soluções de Segurança", difficulty: "intermediario",
    question: "O que é o Microsoft Defender for Identity?",
    options: [
      "Um antivírus para identidades digitais",
      "Uma solução que monitora sinais do Active Directory para detectar ataques baseados em identidade",
      "Um gerenciador de senhas corporativo",
      "Uma ferramenta de provisionamento de usuários"
    ],
    correct: 1,
    explanation: "O Microsoft Defender for Identity (anteriormente Azure ATP) é uma solução de segurança baseada em nuvem que usa sinais do Active Directory on-premises para identificar, detectar e investigar ameaças avançadas, identidades comprometidas e ações maliciosas de insiders.",
    tip: "O Defender for Identity detecta técnicas de ataque como Pass-the-Hash, Pass-the-Ticket e ataques de força bruta."
  },
  {
    id: "sc023", domain: "Soluções de Segurança", difficulty: "avancado",
    question: "O que é o Microsoft Defender XDR?",
    options: [
      "Uma versão premium do Windows Defender",
      "Uma solução de detecção e resposta estendida que correlaciona alertas de múltiplos produtos Microsoft",
      "Um sistema de gerenciamento de vulnerabilidades",
      "Uma ferramenta de análise de logs"
    ],
    correct: 1,
    explanation: "O Microsoft Defender XDR (Extended Detection and Response) é uma solução unificada que combina dados de Defender for Endpoint, Defender for Office 365, Defender for Identity e Defender for Cloud Apps para fornecer visibilidade completa e resposta coordenada a ameaças.",
    tip: "XDR vai além do EDR (Endpoint Detection and Response) ao correlacionar dados de múltiplas fontes."
  },
  {
    id: "sc024", domain: "Soluções de Segurança", difficulty: "basico",
    question: "O que é o Azure Firewall?",
    options: [
      "Um firewall de hardware instalado nos datacenters Azure",
      "Um serviço de firewall de rede gerenciado e baseado em nuvem para proteger recursos Azure",
      "Um sistema de proteção de emails",
      "Uma ferramenta de monitoramento de tráfego"
    ],
    correct: 1,
    explanation: "O Azure Firewall é um serviço de segurança de rede gerenciado e baseado em nuvem que protege recursos na Azure Virtual Network. É um firewall stateful com alta disponibilidade integrada e escalabilidade irrestrita na nuvem, com filtragem de tráfego de entrada e saída.",
    tip: "O Azure Firewall é diferente dos NSGs — ele opera na camada de aplicação, não apenas na camada de rede."
  },
  {
    id: "sc025", domain: "Soluções de Segurança", difficulty: "intermediario",
    question: "O que é o Microsoft Defender for Cloud Apps (MCAS)?",
    options: [
      "Um antivírus para aplicativos móveis",
      "Um Cloud Access Security Broker (CASB) que oferece visibilidade e controle sobre aplicativos SaaS",
      "Uma loja de aplicativos corporativos",
      "Um sistema de desenvolvimento de aplicativos seguros"
    ],
    correct: 1,
    explanation: "O Microsoft Defender for Cloud Apps é um CASB (Cloud Access Security Broker) que atua como intermediário entre usuários e serviços na nuvem. Oferece visibilidade sobre Shadow IT, controle de acesso a apps SaaS, proteção de dados e detecção de ameaças em aplicativos cloud.",
    tip: "Shadow IT são aplicativos usados pelos funcionários sem aprovação do departamento de TI."
  },

  // DOMÍNIO 4: Soluções de Conformidade da Microsoft (20-25%)
  {
    id: "sc026", domain: "Conformidade Microsoft", difficulty: "basico",
    question: "O que é o Microsoft Service Trust Portal?",
    options: [
      "Um portal de suporte técnico da Microsoft",
      "Um portal que fornece informações sobre auditorias, certificações e relatórios de conformidade da Microsoft",
      "Um sistema de gerenciamento de licenças",
      "Uma plataforma de treinamento da Microsoft"
    ],
    correct: 1,
    explanation: "O Microsoft Service Trust Portal é um hub de informações sobre práticas de segurança, privacidade e conformidade da Microsoft. Fornece acesso a relatórios de auditoria, certificações (ISO 27001, SOC 2), white papers e outros documentos de conformidade.",
    tip: "É a fonte oficial para documentar a conformidade da Microsoft com padrões regulatórios."
  },
  {
    id: "sc027", domain: "Conformidade Microsoft", difficulty: "intermediario",
    question: "O que é a Prevenção de Perda de Dados (DLP) no Microsoft Purview?",
    options: [
      "Um sistema de backup de dados",
      "Uma solução que detecta e impede o compartilhamento inadequado de informações confidenciais",
      "Uma ferramenta de criptografia de emails",
      "Um sistema de arquivamento de documentos"
    ],
    correct: 1,
    explanation: "A DLP (Data Loss Prevention) do Microsoft Purview detecta, monitora e protege automaticamente informações confidenciais (números de cartão de crédito, dados de saúde, informações pessoais) em serviços como Microsoft 365, Teams, SharePoint e dispositivos Windows.",
    tip: "A DLP usa tipos de informações confidenciais para identificar dados que precisam de proteção."
  },
  {
    id: "sc028", domain: "Conformidade Microsoft", difficulty: "intermediario",
    question: "O que é o Microsoft Purview Information Protection?",
    options: [
      "Um antivírus para documentos Office",
      "Uma solução para descobrir, classificar e proteger informações confidenciais com rótulos de sensibilidade",
      "Um sistema de gerenciamento de direitos digitais para mídia",
      "Uma ferramenta de auditoria de documentos"
    ],
    correct: 1,
    explanation: "O Microsoft Purview Information Protection permite descobrir, classificar e proteger dados confidenciais usando rótulos de sensibilidade. Os rótulos podem aplicar proteção (criptografia, marcações visuais, restrições de acesso) a documentos e emails.",
    tip: "Os rótulos de sensibilidade persistem no documento mesmo quando ele é compartilhado externamente."
  },
  {
    id: "sc029", domain: "Conformidade Microsoft", difficulty: "basico",
    question: "O que é o Microsoft Secure Score?",
    options: [
      "Uma nota de crédito da Microsoft para clientes",
      "Uma métrica que mede a postura de segurança da organização e sugere melhorias",
      "Um sistema de pontuação de incidentes de segurança",
      "Uma avaliação de desempenho de segurança de funcionários"
    ],
    correct: 1,
    explanation: "O Microsoft Secure Score é uma medição da postura de segurança de uma organização. Uma pontuação mais alta indica que mais ações de melhoria foram implementadas. Fornece visibilidade sobre a configuração de segurança e recomendações priorizadas para melhorar a proteção.",
    tip: "O Secure Score está disponível no Microsoft Defender XDR e no Microsoft Purview."
  },
  {
    id: "sc030", domain: "Conformidade Microsoft", difficulty: "avancado",
    question: "O que é o Microsoft Purview Audit?",
    options: [
      "Uma ferramenta de auditoria de código de aplicativos",
      "Uma solução que registra e pesquisa atividades de usuários e administradores em serviços Microsoft 365",
      "Um sistema de auditoria financeira integrado ao Microsoft 365",
      "Uma ferramenta de revisão de políticas de segurança"
    ],
    correct: 1,
    explanation: "O Microsoft Purview Audit (anteriormente Office 365 Audit Log) registra atividades de usuários e administradores em serviços Microsoft 365 como Exchange, SharePoint, Teams e outros. Permite pesquisar eventos para investigações de segurança e conformidade regulatória.",
    tip: "O Audit Standard retém logs por 90 dias; o Audit Premium retém por até 1 ano."
  }
];

// Metadata
const PLATFORM_CONFIG = {
  name: "SC-900",
  fullName: "Microsoft Security, Compliance and Identity Fundamentals",
  totalQuestions: QUESTION_BANK.length,
  domains: [
    "Conceitos de Segurança",
    "Conceitos de Conformidade",
    "Identidade e Acesso",
    "Soluções de Segurança",
    "Conformidade Microsoft"
  ],
  passingScore: 700,
  examDuration: 60,
  questionCount: 40
};
