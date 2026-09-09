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

// ── QUESTÕES ADICIONAIS SC-900 (sc031 → sc200) ─────────────────────────────

const QUESTION_BANK_EXTRA = [
  // CONCEITOS DE SEGURANÇA
  {id:"sc031",domain:"Conceitos de Segurança",difficulty:"basico",
   question:"O que é uma ameaça persistente avançada (APT)?",
   options:["Um vírus comum que se espalha rapidamente","Um ataque sofisticado e prolongado conduzido por agentes bem financiados que visam organizações específicas","Um ataque de força bruta a senhas","Uma falha de software não corrigida"],
   correct:1,explanation:"APT (Advanced Persistent Threat) são ataques altamente sofisticados, geralmente patrocinados por estados ou crime organizado, que infiltram redes e permanecem sem detecção por longos períodos para roubar dados ou causar danos.",tip:"APTs usam técnicas de movimento lateral para se espalharem dentro da rede após a entrada inicial."},

  {id:"sc032",domain:"Conceitos de Segurança",difficulty:"intermediario",
   question:"O que é um ataque de phishing?",
   options:["Um ataque que sobrecarrega servidores com tráfego","Uma tentativa de enganar usuários para revelar informações confidenciais através de comunicações falsas","Um ataque que explora vulnerabilidades de software","Um ataque que intercepta comunicações de rede"],
   correct:1,explanation:"Phishing é uma técnica de engenharia social onde atacantes se passam por entidades confiáveis (bancos, Microsoft, etc.) via email, SMS ou sites falsos para roubar credenciais, dados financeiros ou instalar malware.",tip:"Spear phishing é o phishing direcionado a indivíduos específicos com informações personalizadas."},

  {id:"sc033",domain:"Conceitos de Segurança",difficulty:"basico",
   question:"O que é ransomware?",
   options:["Um software que monitora atividades do usuário","Um malware que criptografa dados da vítima e exige pagamento para descriptografar","Um vírus que se replica automaticamente pela rede","Um spyware que rouba senhas"],
   correct:1,explanation:"Ransomware é um tipo de malware que criptografa os arquivos da vítima ou bloqueia o acesso ao sistema, exigindo um resgate (geralmente em criptomoeda) para restaurar o acesso. É uma das ameaças mais impactantes para organizações.",tip:"Backups offline e atualizados são a principal defesa contra ransomware."},

  {id:"sc034",domain:"Conceitos de Segurança",difficulty:"intermediario",
   question:"O que é engenharia social em segurança?",
   options:["O processo de projetar sistemas de segurança","Técnicas de manipulação psicológica para enganar pessoas e obter acesso não autorizado","A engenharia de software com foco em segurança","O desenvolvimento de políticas de segurança"],
   correct:1,explanation:"Engenharia social explora o comportamento humano em vez de vulnerabilidades técnicas. Os atacantes manipulam pessoas para revelar informações, realizar ações ou conceder acesso. Inclui phishing, pretexting, baiting e tailgating.",tip:"O fator humano é frequentemente o elo mais fraco na segurança da informação."},

  {id:"sc035",domain:"Conceitos de Segurança",difficulty:"basico",
   question:"O que é autenticação sem senha (passwordless)?",
   options:["Login sem nenhuma verificação de identidade","Autenticação que usa biometria, chaves de segurança ou aplicativos em vez de senhas tradicionais","Um sistema que gera senhas automaticamente","Autenticação baseada apenas em IP de rede"],
   correct:1,explanation:"Autenticação passwordless elimina senhas tradicionais usando métodos como Windows Hello (biometria), chaves de segurança FIDO2 ou o aplicativo Microsoft Authenticator com notificações push. É mais segura pois elimina riscos de senhas fracas ou reutilizadas.",tip:"O Microsoft Entra ID suporta autenticação passwordless de forma nativa."},

  {id:"sc036",domain:"Conceitos de Segurança",difficulty:"intermediario",
   question:"O que é um certificado digital?",
   options:["Uma licença de software digital","Um documento eletrônico que vincula uma chave pública a uma identidade, emitido por uma Autoridade Certificadora","Um tipo de assinatura eletrônica simples","Uma senha criptografada"],
   correct:1,explanation:"Um certificado digital é um documento eletrônico que usa criptografia de chave pública para vincular uma chave pública a uma identidade (pessoa, organização ou servidor). São emitidos por Autoridades Certificadoras (CAs) confiáveis e usados em HTTPS, email seguro e assinaturas digitais.",tip:"O Azure Key Vault pode gerenciar certificados digitais de forma centralizada."},

  {id:"sc037",domain:"Conceitos de Segurança",difficulty:"basico",
   question:"O que é um firewall de aplicação web (WAF)?",
   options:["Um firewall que protege apenas computadores Windows","Um firewall que filtra, monitora e bloqueia tráfego HTTP malicioso direcionado a aplicações web","Um sistema de filtragem de emails","Um antivírus para servidores web"],
   correct:1,explanation:"Um WAF (Web Application Firewall) protege aplicações web filtrando e monitorando o tráfego HTTP entre a internet e a aplicação. Protege contra ataques como SQL Injection, Cross-Site Scripting (XSS) e outros do OWASP Top 10.",tip:"O Azure oferece WAF integrado ao Application Gateway e ao Azure Front Door."},

  {id:"sc038",domain:"Conceitos de Segurança",difficulty:"intermediario",
   question:"O que é SIEM?",
   options:["Um tipo de firewall de nova geração","Uma solução que coleta, correlaciona e analisa logs de segurança para detectar ameaças","Um sistema de gerenciamento de identidade","Uma ferramenta de varredura de vulnerabilidades"],
   correct:1,explanation:"SIEM (Security Information and Event Management) coleta dados de log de toda a organização, correlaciona eventos para identificar padrões suspeitos e gera alertas. O Microsoft Sentinel é o SIEM nativo da nuvem da Microsoft.",tip:"SIEM + SOAR = detecção + resposta automatizada a incidentes."},

  {id:"sc039",domain:"Conceitos de Segurança",difficulty:"intermediario",
   question:"O que é um ataque de injeção SQL (SQL Injection)?",
   options:["Um ataque que sobrecarrega um banco de dados com consultas","Um ataque que insere código SQL malicioso em campos de entrada para manipular o banco de dados","Um ataque que criptografa bancos de dados","Um ataque que copia bancos de dados para servidores externos"],
   correct:1,explanation:"SQL Injection ocorre quando um atacante insere comandos SQL maliciosos em campos de entrada de uma aplicação. Se a aplicação não valida a entrada, o banco de dados executa os comandos, podendo expor, modificar ou deletar dados.",tip:"Usar consultas parametrizadas e ORM é a principal defesa contra SQL Injection."},

  {id:"sc040",domain:"Conceitos de Segurança",difficulty:"basico",
   question:"O que significa 'confidencialidade' na tríade CIA?",
   options:["Garantir que os dados estejam sempre disponíveis","Garantir que apenas pessoas autorizadas tenham acesso às informações","Garantir que os dados não sejam alterados indevidamente","Garantir que as informações sejam precisas"],
   correct:1,explanation:"Confidencialidade garante que informações sejam acessíveis apenas a pessoas autorizadas. É implementada através de controles como criptografia, controle de acesso, autenticação e classificação de dados.",tip:"Violações de confidencialidade incluem vazamentos de dados e acesso não autorizado."},

  // IDENTIDADE E ACESSO - mais questões
  {id:"sc041",domain:"Identidade e Acesso",difficulty:"basico",
   question:"O que é um tenant no Microsoft Entra ID?",
   options:["Um usuário administrador da organização","Uma instância dedicada do Microsoft Entra ID que representa uma organização","Um tipo de licença do Microsoft 365","Um grupo de segurança no Azure"],
   correct:1,explanation:"Um tenant é uma instância dedicada e isolada do Microsoft Entra ID que é criada quando uma organização se inscreve em um serviço Microsoft como Azure ou Microsoft 365. Cada organização tem seu próprio tenant com seus usuários, grupos e aplicativos.",tip:"O tenant é identificado por um domínio (ex: empresa.onmicrosoft.com) e um Tenant ID (GUID)."},

  {id:"sc042",domain:"Identidade e Acesso",difficulty:"intermediario",
   question:"O que é o Microsoft Entra ID Protection?",
   options:["Um antivírus para contas do Entra ID","Um serviço que detecta riscos de identidade e automatiza respostas a identidades comprometidas","Um sistema de backup de identidades","Uma ferramenta de gerenciamento de senhas"],
   correct:1,explanation:"O Microsoft Entra ID Protection usa aprendizado de máquina para detectar comportamentos suspeitos e riscos de identidade, como login de localização improvável ou uso de credenciais vazadas. Pode automaticamente bloquear acesso ou exigir MFA quando risco é detectado.",tip:"O ID Protection alimenta o Acesso Condicional com sinais de risco em tempo real."},

  {id:"sc043",domain:"Identidade e Acesso",difficulty:"basico",
   question:"Qual a diferença entre autenticação e autorização?",
   options:["São a mesma coisa em segurança de TI","Autenticação verifica quem você é; autorização determina o que você pode fazer","Autorização verifica quem você é; autenticação determina o que você pode fazer","Autenticação é para sistemas internos; autorização é para sistemas externos"],
   correct:1,explanation:"Autenticação (AuthN) verifica a identidade do usuário — 'você é quem diz ser?' Autorização (AuthZ) determina quais recursos o usuário autenticado pode acessar e o que pode fazer com eles. Autenticação sempre precede a autorização.",tip:"Pense: autentiCar = Credenciais; autoriZar = aZure RBAC."},

  {id:"sc044",domain:"Identidade e Acesso",difficulty:"intermediario",
   question:"O que são Managed Identities no Azure?",
   options:["Contas de serviço gerenciadas por um administrador","Identidades atribuídas automaticamente a recursos Azure, eliminando a necessidade de credenciais no código","Um tipo de conta de usuário sem senha","Identidades de convidados gerenciadas pelo Azure"],
   correct:1,explanation:"Managed Identities fornecem uma identidade gerenciada automaticamente pelo Azure para recursos como VMs, App Services e Functions. O recurso pode se autenticar em outros serviços Azure (como Key Vault) sem armazenar credenciais no código ou configuração.",tip:"Existem dois tipos: System-assigned (vinculada ao recurso) e User-assigned (independente)."},

  {id:"sc045",domain:"Identidade e Acesso",difficulty:"intermediario",
   question:"O que é o Azure AD B2B (Business to Business)?",
   options:["Um serviço para criar aplicativos de negócio","Uma funcionalidade que permite convidar usuários externos para colaborar usando suas próprias identidades","Um sistema de faturamento entre empresas","Uma solução de VPN para parceiros de negócios"],
   correct:1,explanation:"O Azure AD B2B permite que você convide usuários externos (parceiros, fornecedores, consultores) para colaborar em seus recursos Azure usando suas próprias credenciais organizacionais ou pessoais. Os convidados aparecem como usuários no seu diretório com tipo 'Convidado'.",tip:"B2B é para colaboração com parceiros externos; B2C é para clientes de aplicativos."},

  {id:"sc046",domain:"Identidade e Acesso",difficulty:"avancado",
   question:"O que é o protocolo OAuth 2.0 no contexto do Microsoft Entra ID?",
   options:["Um protocolo de criptografia de dados","Um protocolo de autorização que permite que aplicativos obtenham acesso limitado a recursos em nome de um usuário","Um protocolo de autenticação multifator","Um protocolo de sincronização de diretórios"],
   correct:1,explanation:"OAuth 2.0 é um protocolo de autorização que permite que aplicativos obtenham tokens de acesso para acessar recursos protegidos em nome de um usuário, sem expor as credenciais do usuário ao aplicativo. O Microsoft Entra ID usa OAuth 2.0 para autorização e OpenID Connect para autenticação.",tip:"OAuth = autorização de acesso a recursos; OpenID Connect = verificação de identidade."},

  {id:"sc047",domain:"Identidade e Acesso",difficulty:"basico",
   question:"O que são grupos de segurança no Microsoft Entra ID?",
   options:["Grupos de usuários com o mesmo nível de risco de segurança","Coleções de usuários usadas para gerenciar acesso a recursos e aplicativos de forma coletiva","Grupos de políticas de segurança","Grupos de dispositivos monitorados"],
   correct:1,explanation:"Grupos de segurança no Entra ID agrupam usuários e outros objetos para facilitar a atribuição de acesso. Em vez de atribuir permissões a cada usuário individualmente, você adiciona o usuário ao grupo e o grupo recebe as permissões. Simplifica o gerenciamento em escala.",tip:"Grupos dinâmicos adicionam membros automaticamente com base em atributos como departamento ou cargo."},

  {id:"sc048",domain:"Identidade e Acesso",difficulty:"intermediario",
   question:"O que é o Microsoft Entra Connect?",
   options:["Uma ferramenta para conectar dispositivos móveis ao Entra ID","Uma solução que sincroniza identidades do Active Directory on-premises com o Microsoft Entra ID","Um conector VPN para acesso remoto","Uma ferramenta de migração de email"],
   correct:1,explanation:"O Microsoft Entra Connect sincroniza objetos (usuários, grupos, contatos) do Active Directory local com o Microsoft Entra ID na nuvem. Permite SSO híbrido onde os usuários usam as mesmas credenciais on-premises e na nuvem.",tip:"O Entra Connect suporta sincronização de hash de senha, autenticação de passagem e federação com AD FS."},

  {id:"sc049",domain:"Identidade e Acesso",difficulty:"basico",
   question:"O que é o Microsoft Authenticator?",
   options:["Um aplicativo para criar senhas fortes","Um aplicativo móvel que fornece verificação de identidade via notificações push, OTP e login sem senha","Um gerenciador de senhas da Microsoft","Um VPN client da Microsoft"],
   correct:1,explanation:"O Microsoft Authenticator é um aplicativo de autenticação disponível para iOS e Android. Suporta MFA via notificações push (aprovação com um toque), códigos TOTP (6 dígitos rotacionados) e autenticação passwordless via biometria do dispositivo.",tip:"O Authenticator pode ser usado para proteger contas pessoais da Microsoft e contas corporativas Entra ID."},

  {id:"sc050",domain:"Identidade e Acesso",difficulty:"intermediario",
   question:"O que são funções (roles) administrativas no Microsoft Entra ID?",
   options:["Grupos de usuários com responsabilidades administrativas","Permissões predefinidas que concedem privilégios administrativos para gerenciar recursos do Entra ID","Scripts de automação administrativa","Políticas de segurança para administradores"],
   correct:1,explanation:"As funções administrativas do Entra ID concedem permissões para gerenciar recursos do diretório. Exemplos: Administrador Global (controle total), Administrador de Usuários (gerencia usuários e grupos), Administrador de Segurança (gerencia políticas de segurança). Seguem o princípio do menor privilégio.",tip:"Use PIM para ativar funções administrativas apenas quando necessário, em vez de atribuição permanente."},

  // SOLUÇÕES DE SEGURANÇA - mais questões
  {id:"sc051",domain:"Soluções de Segurança",difficulty:"basico",
   question:"O que é o Microsoft Defender for Office 365?",
   options:["Um antivírus para instalação local do Office","Uma solução que protege email, Teams e SharePoint contra ameaças avançadas como phishing e malware","Um firewall para servidores Exchange","Um sistema de backup do Office 365"],
   correct:1,explanation:"O Microsoft Defender for Office 365 protege serviços do Microsoft 365 contra ameaças avançadas. Inclui proteção contra phishing, links maliciosos (Safe Links), anexos maliciosos (Safe Attachments) e comprometimento de email corporativo (BEC).",tip:"Faz parte do Microsoft Defender XDR junto com Defender for Endpoint e Defender for Identity."},

  {id:"sc052",domain:"Soluções de Segurança",difficulty:"intermediario",
   question:"O que é o Azure Policy?",
   options:["Uma política de uso aceitável para funcionários Azure","Um serviço que cria, atribui e gerencia políticas para enforçar regras e efeitos nos recursos Azure","Um sistema de faturamento do Azure","Uma ferramenta de monitoramento de desempenho"],
   correct:1,explanation:"O Azure Policy permite definir e enforçar padrões organizacionais para recursos Azure. Avalia recursos em relação a políticas e garante conformidade. Pode auditar recursos não conformes ou impedir sua criação. Ex: exigir que VMs usem discos gerenciados ou que todos os recursos tenham tags.",tip:"Azure Policy é fundamental para governança e conformidade em escala no Azure."},

  {id:"sc053",domain:"Soluções de Segurança",difficulty:"basico",
   question:"O que é o Microsoft Defender Antivirus?",
   options:["Um antivírus pago da Microsoft para uso doméstico","A proteção antimalware integrada ao Windows, que detecta e remove vírus, spyware e outros malwares","Um serviço de nuvem para análise de malware","Um sistema de quarentena de emails"],
   correct:1,explanation:"O Microsoft Defender Antivirus é a solução antimalware nativa do Windows, incluída gratuitamente no Windows 10/11 e Windows Server. Oferece proteção em tempo real, varredura programada e proteção baseada em nuvem, integrado ao Microsoft Defender for Endpoint para recursos empresariais.",tip:"Quando o Defender for Endpoint é implantado, o Defender Antivirus serve como cliente antimalware principal ou secundário."},

  {id:"sc054",domain:"Soluções de Segurança",difficulty:"intermediario",
   question:"O que é o Azure Bastion?",
   options:["Um serviço de firewall premium do Azure","Um serviço que fornece acesso RDP e SSH seguro a VMs Azure sem expor IPs públicos","Um sistema de backup de máquinas virtuais","Uma solução de VPN site-to-site"],
   correct:1,explanation:"O Azure Bastion é um serviço PaaS que permite conectar-se a VMs Azure via RDP e SSH diretamente pelo portal Azure, usando TLS. Elimina a necessidade de IPs públicos nas VMs e protege contra varredura de portas e outros ataques direcionados a RDP/SSH exposto.",tip:"O Bastion protege contra ataques de força bruta em portas RDP (3389) e SSH (22) expostas à internet."},

  {id:"sc055",domain:"Soluções de Segurança",difficulty:"basico",
   question:"O que são Network Security Groups (NSG) no Azure?",
   options:["Grupos de profissionais de segurança de rede","Filtros de tráfego de rede que controlam tráfego de entrada e saída para recursos Azure","Grupos de políticas de segurança empresarial","Ferramentas de monitoramento de rede"],
   correct:1,explanation:"NSGs são listas de controle de acesso que filtram o tráfego de rede de e para recursos Azure. Contêm regras de segurança que permitem ou negam tráfego com base em IP de origem/destino, porta e protocolo. Podem ser associados a subnets ou NICs individuais.",tip:"NSGs são stateful — se você permitir tráfego de entrada, o tráfego de resposta de saída é permitido automaticamente."},

  {id:"sc056",domain:"Soluções de Segurança",difficulty:"intermediario",
   question:"O que é o Microsoft Cloud App Security / Defender for Cloud Apps?",
   options:["Um serviço de hospedagem de aplicativos na nuvem","Um CASB que fornece visibilidade, controle e proteção para aplicativos SaaS usados na organização","Um sistema de desenvolvimento seguro de aplicativos","Uma plataforma de testes de segurança"],
   correct:1,explanation:"O Microsoft Defender for Cloud Apps é um CASB (Cloud Access Security Broker) que atua como intermediário entre usuários e serviços na nuvem. Descobre Shadow IT, avalia riscos de aplicativos, protege dados e detecta comportamentos anômalos em aplicativos SaaS como Salesforce, Box e Google Workspace.",tip:"Shadow IT são aplicativos usados pelos funcionários sem conhecimento ou aprovação do departamento de TI."},

  {id:"sc057",domain:"Soluções de Segurança",difficulty:"avancado",
   question:"O que é o Secure Score no Microsoft Defender for Cloud?",
   options:["Uma pontuação de crédito para fornecedores de nuvem","Uma métrica agregada que representa a postura de segurança dos workloads no Azure e outras nuvens","Uma classificação de vulnerabilidades de software","Uma pontuação de desempenho de servidores"],
   correct:1,explanation:"O Secure Score do Defender for Cloud avalia a postura de segurança dos workloads e fornece recomendações priorizadas para melhorá-la. A pontuação aumenta conforme recomendações são implementadas. Abrange recursos Azure, AWS e GCP, além de workloads on-premises.",tip:"Diferente do Microsoft Secure Score (para Microsoft 365), o Secure Score do Defender for Cloud foca em workloads de nuvem."},

  {id:"sc058",domain:"Soluções de Segurança",difficulty:"basico",
   question:"O que é o Azure Private Link?",
   options:["Um serviço de link encurtado para URLs do Azure","Um serviço que permite acesso privado a serviços Azure pela sua rede virtual, sem expor tráfego à internet","Um sistema de monitoramento de conectividade","Uma solução de DNS privado para Azure"],
   correct:1,explanation:"O Azure Private Link permite conectar-se a serviços Azure (como Storage, SQL Database, Key Vault) e serviços de parceiros de forma privada, usando Private Endpoints dentro da sua VNet. O tráfego nunca sai para a internet pública, aumentando a segurança e reduzindo a exposição.",tip:"Private Link é diferente de Service Endpoints — com Private Link, o serviço recebe um IP privado na sua VNet."},

  {id:"sc059",domain:"Soluções de Segurança",difficulty:"intermediario",
   question:"O que é o Microsoft Defender Vulnerability Management?",
   options:["Um sistema de gerenciamento de patches de segurança","Uma solução que descobre, prioriza e corrige vulnerabilidades em ativos da organização","Um antivírus focado em vulnerabilidades de dia zero","Uma ferramenta de varredura de rede"],
   correct:1,explanation:"O Microsoft Defender Vulnerability Management fornece descoberta contínua de ativos, avaliação de vulnerabilidades baseada em risco, e recomendações de remediação integradas. Prioriza vulnerabilidades com base na exposição real, severidade e valor do ativo para focar nos riscos mais críticos.",tip:"Integrado ao Defender for Endpoint, fornece visibilidade de vulnerabilidades sem necessidade de scanners externos."},

  {id:"sc060",domain:"Soluções de Segurança",difficulty:"basico",
   question:"O que é o Microsoft Intune?",
   options:["Uma solução de monitoramento de rede","Uma plataforma de gerenciamento de endpoints (dispositivos) baseada em nuvem","Um sistema de backup de dispositivos móveis","Uma ferramenta de desenvolvimento mobile"],
   correct:1,explanation:"O Microsoft Intune é uma solução MDM (Mobile Device Management) e MAM (Mobile Application Management) baseada em nuvem. Gerencia e protege dispositivos corporativos e pessoais (BYOD), garante conformidade, distribui aplicativos e protege dados corporativos em dispositivos móveis e PCs.",tip:"O Intune é fundamental para estratégias de Zero Trust ao garantir que apenas dispositivos conformes acessem recursos corporativos."},

  // CONFORMIDADE MICROSOFT - mais questões
  {id:"sc061",domain:"Conformidade Microsoft",difficulty:"intermediario",
   question:"O que é o Microsoft Purview eDiscovery?",
   options:["Uma ferramenta de descoberta de bugs em software","Uma solução para identificar, coletar e exportar conteúdo eletrônico para investigações legais e de conformidade","Um sistema de descoberta de novos serviços no Azure","Uma ferramenta de descoberta de ativos na nuvem"],
   correct:1,explanation:"O Microsoft Purview eDiscovery permite que organizações identifiquem, coletem, revisem e exportem conteúdo eletrônico do Microsoft 365 (emails, Teams, SharePoint) para uso em processos legais, investigações de conformidade e regulatórias.",tip:"eDiscovery Standard oferece recursos básicos; eDiscovery Premium adiciona análise avançada com IA."},

  {id:"sc062",domain:"Conformidade Microsoft",difficulty:"basico",
   question:"O que são rótulos de retenção no Microsoft Purview?",
   options:["Etiquetas físicas em documentos físicos","Configurações que controlam por quanto tempo conteúdo é mantido ou quando deve ser excluído","Classificações de confidencialidade de documentos","Marcações de propriedade de documentos"],
   correct:1,explanation:"Rótulos de retenção do Microsoft Purview controlam o ciclo de vida do conteúdo: por quanto tempo deve ser mantido e o que acontece no final do período (exclusão automática ou revisão de disposição). Atendem a requisitos regulatórios que exigem retenção mínima de registros.",tip:"Diferente dos rótulos de sensibilidade, os rótulos de retenção controlam quanto tempo o conteúdo existe, não quem pode acessá-lo."},

  {id:"sc063",domain:"Conformidade Microsoft",difficulty:"intermediario",
   question:"O que é o Microsoft Purview Communication Compliance?",
   options:["Um sistema de monitoramento de velocidade de comunicação","Uma solução que monitora comunicações para detectar violações de políticas como assédio, insider trading ou divulgação não autorizada","Uma ferramenta de melhoria de comunicação entre equipes","Um sistema de backup de comunicações"],
   correct:1,explanation:"O Communication Compliance monitora comunicações em email, Teams e Yammer para identificar violações de políticas corporativas e regulatórias. Usa IA para detectar linguagem de assédio, ameaças, informações confidenciais compartilhadas inadequadamente ou possível insider trading.",tip:"Importante para organizações em setores regulados como serviços financeiros e saúde."},

  {id:"sc064",domain:"Conformidade Microsoft",difficulty:"basico",
   question:"O que é o Microsoft Purview Insider Risk Management?",
   options:["Um sistema de controle de acesso físico","Uma solução que identifica e age sobre riscos de segurança gerados por usuários internos da organização","Uma ferramenta de treinamento de segurança para funcionários","Um sistema de investigação de candidatos a emprego"],
   correct:1,explanation:"O Insider Risk Management identifica, investiga e age sobre riscos criados por usuários internos (funcionários, contratados). Correlaciona sinais de comportamento como volume incomum de downloads, acesso a dados sensíveis fora do horário ou uso de dispositivos USB para identificar possíveis ameaças internas.",tip:"Usuários de risco interno podem ser acidentais, negligentes ou maliciosos — o sistema abrange todos os cenários."},

  {id:"sc065",domain:"Conformidade Microsoft",difficulty:"intermediario",
   question:"O que é o Azure Blueprints?",
   options:["Um serviço de design de arquitetura do Azure","Uma solução para definir um conjunto repetível de recursos Azure que implementa e cumpre padrões organizacionais","Um sistema de documentação de infraestrutura","Uma ferramenta de planejamento de migração"],
   correct:1,explanation:"O Azure Blueprints permite que arquitetos de nuvem definam conjuntos repetíveis de recursos Azure (políticas, atribuições de funções, templates ARM) que cumprem padrões organizacionais. Facilita a criação consistente de novos ambientes em conformidade com requisitos de segurança e governança.",tip:"Blueprints orquestra a implantação de múltiplos recursos e políticas de forma coordenada."},

  {id:"sc066",domain:"Conformidade Microsoft",difficulty:"basico",
   question:"O que são as Zonas de Disponibilidade do Azure e como contribuem para conformidade?",
   options:["Regiões geográficas onde o Azure opera","Datacenters fisicamente separados dentro de uma região Azure, que garantem alta disponibilidade e resiliência para requisitos de continuidade de negócios","Zonas de acesso restrito para dados confidenciais","Áreas geográficas com regulamentações específicas"],
   correct:1,explanation:"Zonas de Disponibilidade são datacenters fisicamente separados (energia, resfriamento, rede independentes) dentro de uma região Azure. Protegem contra falhas de datacenter e ajudam organizações a atender requisitos de SLA e continuidade de negócios exigidos por regulamentações como DORA no setor financeiro.",tip:"Zonas de Disponibilidade oferecem SLA de 99,99% de disponibilidade para VMs quando implantadas em múltiplas zonas."},

  {id:"sc067",domain:"Conformidade Microsoft",difficulty:"intermediario",
   question:"O que são as Políticas de Privacidade de Dados da Microsoft para conformidade?",
   options:["Regras internas sobre como os funcionários da Microsoft usam dados","Compromissos legalmente vinculantes sobre como a Microsoft coleta, usa e protege dados de clientes, incluindo conformidade com GDPR","Políticas de uso aceitável para serviços Microsoft","Regulamentos de exportação de dados da Microsoft"],
   correct:1,explanation:"A Microsoft oferece compromissos contratuais de proteção de dados através dos Termos de Serviços Online (OST) e Adendo de Proteção de Dados (DPA). Esses documentos especificam como a Microsoft processa dados de clientes, suporta conformidade com GDPR, LGPD e outras regulamentações.",tip:"O Microsoft Service Trust Portal é onde você encontra esses documentos e certificações de conformidade."},

  {id:"sc068",domain:"Conformidade Microsoft",difficulty:"basico",
   question:"O que é o Gerenciamento de Riscos de Privacidade no Microsoft Purview?",
   options:["Um sistema de seguro contra violações de privacidade","Uma solução que identifica e ajuda a remediar riscos de privacidade de dados pessoais na organização","Uma ferramenta de conformidade com LGPD apenas","Um sistema de anonimização de dados"],
   correct:1,explanation:"O Gerenciamento de Riscos de Privacidade do Microsoft Purview ajuda organizações a encontrar e proteger dados pessoais, identificar e remediar riscos de privacidade, criar relatórios de conformidade e responder a solicitações de titulares de dados (DSARs) exigidas pelo GDPR e LGPD.",tip:"Inclui templates de políticas pré-construídos para regulamentos como GDPR e CCPA."},

  // CONCEITOS DE CONFORMIDADE - mais questões
  {id:"sc069",domain:"Conceitos de Conformidade",difficulty:"intermediario",
   question:"O que é ISO 27001?",
   options:["Uma norma para desenvolvimento de software seguro","Um padrão internacional para sistemas de gestão de segurança da informação (SGSI)","Uma regulamentação europeia de proteção de dados","Uma certificação para profissionais de segurança"],
   correct:1,explanation:"ISO 27001 é o padrão internacional que especifica requisitos para estabelecer, implementar, manter e melhorar um Sistema de Gestão de Segurança da Informação (SGSI). Organizações podem ser certificadas ISO 27001 demonstrando que gerenciam sistematicamente a segurança da informação. A Microsoft Azure é certificada ISO 27001.",tip:"A certificação ISO 27001 da Microsoft está disponível para download no Service Trust Portal."},

  {id:"sc070",domain:"Conceitos de Conformidade",difficulty:"basico",
   question:"O que é SOC 2?",
   options:["Um tipo de firewall de segunda geração","Um relatório de auditoria que avalia controles de segurança, disponibilidade, integridade, confidencialidade e privacidade de provedores de serviço","Uma certificação de segurança para desenvolvedores","Um padrão de criptografia de dados"],
   correct:1,explanation:"SOC 2 (Service Organization Control 2) é um relatório de auditoria desenvolvido pelo AICPA que avalia os controles de um provedor de serviço relacionados a segurança, disponibilidade, integridade de processamento, confidencialidade e privacidade. Importante para provedores de nuvem como a Microsoft.",tip:"SOC 2 Type I avalia o design dos controles; Type II avalia a efetividade operacional ao longo do tempo."},

  {id:"sc071",domain:"Conceitos de Conformidade",difficulty:"intermediario",
   question:"O que é NIST Cybersecurity Framework?",
   options:["Uma ferramenta de software de segurança do governo americano","Um framework voluntário de boas práticas para gerenciar e reduzir riscos de cibersegurança em organizações","Uma regulamentação obrigatória de segurança para empresas americanas","Um padrão de criptografia desenvolvido pelo NIST"],
   correct:1,explanation:"O NIST Cybersecurity Framework (CSF) fornece um conjunto de padrões, diretrizes e práticas para gerenciar risco de cibersegurança. Organizado em cinco funções principais: Identificar, Proteger, Detectar, Responder e Recuperar. Amplamente adotado como referência por organizações globais.",tip:"O Microsoft Defender for Cloud mapeia suas recomendações para o NIST CSF e outros frameworks."},

  {id:"sc072",domain:"Conceitos de Conformidade",difficulty:"basico",
   question:"O que é PCI DSS?",
   options:["Um protocolo de comunicação segura para redes","Um padrão de segurança para organizações que processam dados de cartões de pagamento","Uma certificação de segurança para desenvolvedores de aplicativos","Um sistema de detecção de intrusão"],
   correct:1,explanation:"PCI DSS (Payment Card Industry Data Security Standard) é um conjunto de requisitos de segurança para organizações que processam, armazenam ou transmitem dados de cartões de crédito. Define controles técnicos e operacionais para proteger dados de titulares de cartões. O Azure é certificado PCI DSS.",tip:"Organizações que processam cartões de crédito devem estar em conformidade com PCI DSS ou enfrentam penalidades das bandeiras."},

  {id:"sc073",domain:"Conceitos de Conformidade",difficulty:"intermediario",
   question:"O que é HIPAA?",
   options:["Uma lei americana de proteção de dados de saúde que estabelece padrões para privacidade e segurança de informações médicas","Uma certificação de segurança para hospitais","Um padrão técnico de interoperabilidade em saúde","Uma regulamentação europeia para dados médicos"],
   correct:0,explanation:"HIPAA (Health Insurance Portability and Accountability Act) é uma lei federal americana que protege informações de saúde de pacientes (PHI - Protected Health Information). Estabelece requisitos para como entidades de saúde protegem, usam e divulgam informações médicas. O Azure oferece serviços em conformidade com HIPAA.",tip:"Business Associate Agreements (BAAs) são contratos que a Microsoft assina com clientes cobertos pelo HIPAA."},

  {id:"sc074",domain:"Conceitos de Conformidade",difficulty:"basico",
   question:"O que é um Plano de Continuidade de Negócios (BCP)?",
   options:["Um plano de expansão dos negócios da empresa","Um documento que descreve como uma organização continuará operando durante e após uma interrupção ou desastre","Um plano de treinamento de funcionários de TI","Um orçamento para investimentos em segurança"],
   correct:1,explanation:"Um BCP (Business Continuity Plan) define como uma organização manterá funções críticas de negócios durante e após um desastre ou interrupção. Inclui RPO (Recovery Point Objective - quanto de dado pode ser perdido) e RTO (Recovery Time Objective - quanto tempo para restaurar). Complementado pelo DRP (Disaster Recovery Plan).",tip:"Azure oferece recursos como Zonas de Disponibilidade e Azure Site Recovery para suportar estratégias de BCP/DRP."},

  {id:"sc075",domain:"Conceitos de Conformidade",difficulty:"intermediario",
   question:"O que é o conceito de 'Privacy by Design'?",
   options:["Um método de design de interfaces de usuário para privacidade","Um princípio que incorpora proteção de privacidade desde o início do desenvolvimento de sistemas, não como uma adição posterior","Um padrão visual para avisos de privacidade","Uma técnica de anonimização de dados de design"],
   correct:1,explanation:"Privacy by Design é um princípio que exige que a privacidade seja incorporada em sistemas e processos desde a fase de design, não adicionada posteriormente. É um dos princípios fundamentais do GDPR. Envolve minimização de dados, propósito limitado, transparência e controles técnicos de privacidade desde o início.",tip:"O GDPR exige Privacy by Design e Privacy by Default como abordagem padrão para desenvolvimento de sistemas."},

  // MAIS QUESTÕES DE IDENTIDADE E ACESSO
  {id:"sc076",domain:"Identidade e Acesso",difficulty:"avancado",
   question:"O que é FIDO2 no contexto de autenticação?",
   options:["Uma versão atualizada do protocolo de autenticação FIDO","Um padrão aberto para autenticação forte sem senha usando chaves de segurança de hardware ou biometria de dispositivo","Um algoritmo de criptografia de senhas","Um protocolo de sincronização de diretórios"],
   correct:1,explanation:"FIDO2 é um padrão aberto de autenticação forte que usa criptografia de chave pública para eliminação de senhas. Inclui o protocolo WebAuthn (W3C) e o protocolo CTAP2. Suportado pelo Microsoft Entra ID, permite autenticação com chaves de segurança físicas (YubiKey) ou biometria do dispositivo (Windows Hello).",tip:"FIDO2 é resistente a phishing porque as credenciais são vinculadas ao domínio específico do site."},

  {id:"sc077",domain:"Identidade e Acesso",difficulty:"intermediario",
   question:"O que é o Acesso Just-in-Time (JIT) a VMs no Defender for Cloud?",
   options:["Um sistema de provisionamento automático de VMs","Uma funcionalidade que bloqueia portas de gerenciamento de VMs e as abre apenas quando necessário e por tempo limitado","Um sistema de backup agendado de VMs","Uma técnica de escalabilidade automática de VMs"],
   correct:1,explanation:"O acesso JIT a VMs bloqueia portas de gerenciamento inbound (RDP 3389, SSH 22, WinRM 5985/5986) por padrão e as abre apenas quando um usuário autorizado solicita acesso, por um período de tempo limitado (ex: 3 horas) e para o IP específico. Reduz drasticamente a superfície de ataque.",tip:"O acesso JIT é uma implementação prática do princípio do menor privilégio para acesso a máquinas virtuais."},

  {id:"sc078",domain:"Identidade e Acesso",difficulty:"basico",
   question:"O que é um Service Principal no Microsoft Entra ID?",
   options:["O administrador principal de um serviço","Uma identidade criada para aplicativos, serviços e automações para acessar recursos do Azure","Um tipo de conta de usuário privilegiada","Um serviço de autenticação principal do Entra ID"],
   correct:1,explanation:"Um Service Principal é a representação local de uma aplicação global (App Registration) dentro de um tenant específico. Funciona como a 'identidade' de um aplicativo ou serviço no Azure, com suas próprias permissões e credenciais (segredos ou certificados). É usado por aplicativos para autenticar e acessar recursos Azure.",tip:"App Registration (global) → Service Principal (por tenant). Use Managed Identity quando possível para evitar gerenciar credenciais."},

  {id:"sc079",domain:"Identidade e Acesso",difficulty:"intermediario",
   question:"O que é o Microsoft Entra Verified ID?",
   options:["Uma verificação de identidade feita por funcionários Microsoft","Uma solução de credenciais verificáveis descentralizadas baseada em padrões abertos de identidade digital","Um nível premium de verificação de identidade no Entra ID","Uma verificação de segurança para apps publicados na Azure Marketplace"],
   correct:1,explanation:"O Microsoft Entra Verified ID é uma solução de credenciais verificáveis descentralizadas (DID - Decentralized Identifiers). Permite que organizações emitam credenciais digitais verificáveis (como diplomas, certificações, comprovantes de emprego) que os usuários controlam em sua própria carteira digital.",tip:"Verified ID implementa o conceito de Self-Sovereign Identity (SSI) — o usuário controla suas próprias credenciais."},

  {id:"sc080",domain:"Identidade e Acesso",difficulty:"basico",
   question:"O que é Privileged Access Workstation (PAW)?",
   options:["Um cargo de trabalho para funcionários de TI privilegiados","Uma estação de trabalho dedicada e endurecida, usada exclusivamente para tarefas administrativas privilegiadas","Um tipo de laptop com segurança física aprimorada","Uma estação de trabalho virtual no Azure"],
   correct:1,explanation:"Uma PAW é uma estação de trabalho dedicada com controles de segurança rigorosos, usada exclusivamente para tarefas administrativas. Isolada da internet geral e de tarefas cotidianas, reduz o risco de comprometimento de credenciais privilegiadas por malware ou phishing.",tip:"PAWs são recomendadas para administradores de sistemas, domain admins e outros com acesso privilegiado crítico."},

  // QUESTÕES AVANÇADAS E CENÁRIOS
  {id:"sc081",domain:"Soluções de Segurança",difficulty:"avancado",
   question:"Uma organização quer monitorar e controlar o uso de aplicativos SaaS não sancionados pelos funcionários. Qual solução Microsoft é mais adequada?",
   options:["Microsoft Defender for Endpoint","Microsoft Defender for Cloud Apps (CASB)","Azure Firewall","Microsoft Sentinel"],
   correct:1,explanation:"O Microsoft Defender for Cloud Apps (CASB) é a solução correta para Shadow IT. Ele descobre automaticamente todos os aplicativos SaaS em uso (sancionados e não sancionados), avalia seus riscos de segurança e conformidade, e permite bloquear ou restringir o uso de apps não aprovados.",tip:"O Defender for Cloud Apps pode se integrar com outros produtos Defender para visibilidade completa."},

  {id:"sc082",domain:"Identidade e Acesso",difficulty:"avancado",
   question:"Uma empresa quer garantir que funcionários só possam acessar o Microsoft 365 de dispositivos corporativos gerenciados. Qual combinação de recursos implementa isso?",
   options:["Azure Firewall + NSG","Acesso Condicional do Entra ID + Microsoft Intune","Azure VPN + MFA","Azure Policy + RBAC"],
   correct:1,explanation:"A combinação de Acesso Condicional (que pode exigir que o dispositivo seja 'conformante') + Microsoft Intune (que gerencia e verifica a conformidade de dispositivos) é a solução ideal. O Acesso Condicional nega o acesso se o dispositivo não estiver registrado e em conformidade com as políticas do Intune.",tip:"Esta é uma implementação clássica de Zero Trust: verificar identidade E dispositivo antes de conceder acesso."},

  {id:"sc083",domain:"Conceitos de Segurança",difficulty:"avancado",
   question:"Uma organização sofreu um ataque onde credenciais legítimas de um funcionário foram usadas para acessar recursos fora do horário normal, de um país diferente. Qual conceito descreve melhor esse tipo de detecção?",
   options:["Detecção de malware tradicional","Análise de comportamento de usuário e entidade (UEBA)","Varredura de vulnerabilidades","Análise de logs de firewall"],
   correct:1,explanation:"UEBA (User and Entity Behavior Analytics) analisa padrões de comportamento de usuários e sistemas para detectar anomalias. Login fora do horário normal, de localização atípica, são exemplos de anomalias comportamentais. O Microsoft Sentinel e o Entra ID Protection usam UEBA para detectar ameaças avançadas.",tip:"UEBA complementa ferramentas tradicionais de segurança ao detectar ameaças que não acionam regras de assinatura."},

  {id:"sc084",domain:"Conformidade Microsoft",difficulty:"avancado",
   question:"Uma empresa precisa provar para auditores que emails relacionados a um processo judicial de 3 anos atrás foram preservados. Qual recurso do Microsoft Purview é mais adequado?",
   options:["Rótulos de sensibilidade","Retenção por Litígio (Litigation Hold) ou eDiscovery","Prevenção de Perda de Dados (DLP)","Communication Compliance"],
   correct:1,explanation:"O Retenção por Litígio (Litigation Hold) preserva todo o conteúdo de uma caixa de correio, impedindo sua exclusão mesmo quando políticas de retenção normais se aplicariam. O eDiscovery então permite pesquisar e exportar esse conteúdo preservado para uso em processos legais.",tip:"Litigation Hold deve ser aplicado assim que a organização tem ciência de possível litígio, para preservar evidências."},

  {id:"sc085",domain:"Soluções de Segurança",difficulty:"avancado",
   question:"Qual é a principal diferença entre o Azure Firewall e os Network Security Groups (NSGs)?",
   options:["O Azure Firewall é gratuito e NSGs são pagos","Azure Firewall opera na camada de aplicação (L7) com filtragem FQDN e inteligência de ameaças; NSGs operam na camada de transporte (L4) com regras de IP/porta","NSGs protegem recursos PaaS; Azure Firewall protege IaaS","Azure Firewall é para tráfego interno; NSGs são para tráfego externo"],
   correct:1,explanation:"Azure Firewall é um firewall gerenciado de camada 7 que suporta filtragem por FQDN (nome de domínio), categorias de URL, inteligência de ameaças e regras de aplicação. NSGs são filtros simples de camada 4 baseados em IP/porta/protocolo. Azure Firewall é mais poderoso mas tem custo adicional; NSGs são básicos e gratuitos.",tip:"Use NSGs para microsegmentação básica e Azure Firewall para proteção avançada de perímetro e inspeção de tráfego."},

  // QUESTÕES CONCEITUAIS ADICIONAIS
  {id:"sc086",domain:"Conceitos de Segurança",difficulty:"basico",
   question:"O que é o princípio de 'assumir a violação' (assume breach) no Zero Trust?",
   options:["Aceitar que violações de segurança são inevitáveis e não fazer nada","Projetar sistemas assumindo que os controles já foram violados, minimizando o impacto e melhorando a detecção","Assumir que todos os usuários são potencialmente maliciosos","Considerar que a rede perimetral já foi comprometida e desativá-la"],
   correct:1,explanation:"'Assumir a violação' é um dos três princípios do Zero Trust. Significa projetar sistemas como se os atacantes já estivessem dentro da rede, minimizando o raio de impacto através de segmentação, criptografia de tráfego east-west, visibilidade completa e detecção/resposta rápida.",tip:"Os 3 princípios Zero Trust: Verificar explicitamente | Usar menor privilégio | Assumir violação."},

  {id:"sc087",domain:"Conceitos de Segurança",difficulty:"intermediario",
   question:"O que é o modelo STRIDE para modelagem de ameaças?",
   options:["Um framework de resposta a incidentes em 6 etapas","Uma metodologia de classificação de ameaças: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service e Elevation of Privilege","Um padrão de codificação segura para desenvolvedores","Um modelo de avaliação de risco de segurança"],
   correct:1,explanation:"STRIDE é uma metodologia criada pela Microsoft para categorizar ameaças de segurança: Spoofing (falsificação de identidade), Tampering (adulteração de dados), Repudiation (negar ações), Information Disclosure (vazamento de informações), Denial of Service (negação de serviço) e Elevation of Privilege (escalonamento de privilégios).",tip:"STRIDE é usado na fase de modelagem de ameaças durante o desenvolvimento de software (SDL - Security Development Lifecycle)."},

  {id:"sc088",domain:"Conceitos de Segurança",difficulty:"basico",
   question:"O que é um ataque Man-in-the-Middle (MitM)?",
   options:["Um ataque onde um funcionário intermediário acessa dados não autorizados","Um ataque onde o atacante intercepta e possivelmente altera a comunicação entre duas partes sem que elas saibam","Um ataque de força bruta conduzido por um agente intermediário","Um ataque de engenharia social por telefone"],
   correct:1,explanation:"Em um ataque MitM, o atacante se posiciona entre duas partes que comunicam (ex: usuário e servidor), interceptando e possivelmente modificando as mensagens. HTTPS com certificados válidos, VPNs e criptografia end-to-end são proteções contra MitM.",tip:"O HSTS (HTTP Strict Transport Security) e certificate pinning são medidas adicionais contra ataques MitM."},

  {id:"sc089",domain:"Conceitos de Segurança",difficulty:"intermediario",
   question:"O que é um ataque de força bruta (brute force)?",
   options:["Um ataque físico a servidores","Uma tentativa sistemática de descobrir senhas ou chaves testando todas as combinações possíveis","Um ataque de sobrecarga de rede","Um ataque de engenharia social intensivo"],
   correct:1,explanation:"Ataques de força bruta tentam descobrir senhas testando sistematicamente todas as combinações possíveis ou usando listas de senhas comuns (dictionary attack). Proteções incluem: lockout de conta após tentativas falhas, MFA, captcha, monitoramento de tentativas e senhas longas/complexas.",tip:"A autenticação sem senha (passwordless) elimina completamente a vulnerabilidade a ataques de força bruta."},

  {id:"sc090",domain:"Conceitos de Segurança",difficulty:"basico",
   question:"O que é criptografia assimétrica?",
   options:["Criptografia que usa chaves de tamanhos diferentes","Criptografia que usa um par de chaves matematicamente relacionadas: uma pública (para criptografar) e uma privada (para descriptografar)","Criptografia que funciona de forma diferente em diferentes sistemas operacionais","Criptografia que usa algoritmos diferentes para dados diferentes"],
   correct:1,explanation:"Criptografia assimétrica (chave pública) usa um par de chaves: a chave pública pode ser compartilhada livremente e é usada para criptografar dados; a chave privada é secreta e é usada para descriptografar. RSA e ECC são exemplos. Usada em HTTPS, certificados digitais e assinaturas digitais.",tip:"Criptografia simétrica (mesma chave para cifrar e decifrar) é mais rápida; assimétrica é usada para troca segura de chaves."},

  // QUESTÕES DE NÍVEL AVANÇADO
  {id:"sc091",domain:"Soluções de Segurança",difficulty:"avancado",
   question:"O que é o Microsoft Security Copilot?",
   options:["Um piloto automático para aeronaves com sistemas Microsoft","Uma solução de IA generativa para profissionais de segurança que acelera investigações e resposta a ameaças","Um assistente virtual para usuários finais de produtos Microsoft","Uma ferramenta de automação de testes de segurança"],
   correct:1,explanation:"O Microsoft Security Copilot é uma plataforma de IA generativa para operações de segurança. Ajuda analistas de segurança a investigar incidentes mais rapidamente, resumir alertas, criar relatórios e obter orientações passo a passo. Integra com Microsoft Sentinel, Defender XDR e outros produtos de segurança.",tip:"Security Copilot usa os modelos GPT da OpenAI treinados com dados de segurança da Microsoft e inteligência de ameaças global."},

  {id:"sc092",domain:"Identidade e Acesso",difficulty:"avancado",
   question:"O que é o conceito de 'Token Theft' e como o Microsoft Entra ID o combate?",
   options:["Roubo de tokens físicos de autenticação hardware","Um ataque onde tokens de sessão são roubados e usados por atacantes para se passar por usuários legítimos sem precisar de credenciais","Roubo de tokens de criptomoeda","Um ataque que invalida tokens de autenticação de usuários legítimos"],
   correct:1,explanation:"Token theft (roubo de tokens) ocorre quando atacantes obtêm tokens de acesso válidos (ex: via malware AiTM - Adversary-in-the-Middle) e os usam para acessar recursos sem precisar de credenciais. O Entra ID combate isso com Token Protection (vincula tokens a dispositivos específicos) e sinais de anomalia do ID Protection.",tip:"MFA não protege contra token theft — o token já foi obtido após a autenticação bem-sucedida. Token Protection é a resposta."},

  {id:"sc093",domain:"Conformidade Microsoft",difficulty:"avancado",
   question:"O que são Managed Keys vs Customer Managed Keys (CMK) no Azure?",
   options:["Tipos de chaves de licença do Azure","Microsoft Managed Keys: Microsoft gerencia o ciclo de vida das chaves; CMK: cliente controla e gerencia suas próprias chaves de criptografia no Azure Key Vault","Chaves de acesso para serviços gerenciados vs não gerenciados","Tipos de chaves SSH para acesso a VMs"],
   correct:1,explanation:"Por padrão, o Azure usa chaves gerenciadas pela Microsoft para criptografia em repouso. Com CMK (Customer Managed Keys), você gera e gerencia suas próprias chaves no Azure Key Vault, com controle total sobre rotação, expiração e revogação. CMK atende a requisitos regulatórios que exigem controle do cliente sobre chaves de criptografia.",tip:"CMK é fundamental para setores regulados onde a organização precisa provar controle exclusivo sobre chaves de criptografia."},

  {id:"sc094",domain:"Soluções de Segurança",difficulty:"intermediario",
   question:"O que é o Microsoft Defender for Containers?",
   options:["Um antivírus para containers Docker","Uma solução de segurança para ambientes de containers que protege clusters Kubernetes, imagens e workloads em execução","Um sistema de gerenciamento de containers","Uma ferramenta de monitoramento de performance de containers"],
   correct:1,explanation:"O Microsoft Defender for Containers protege ambientes de containers multi-cloud incluindo AKS (Azure Kubernetes Service), EKS (AWS) e GKE (Google). Oferece avaliação de vulnerabilidades em imagens, proteção em tempo de execução, endurecimento de clusters e detecção de ameaças específicas para containers.",tip:"Containers introduzem superfícies de ataque únicas — imagens vulneráveis, configurações inseguras e ataques runtime."},

  {id:"sc095",domain:"Conceitos de Conformidade",difficulty:"intermediario",
   question:"O que é o conceito de 'Data Residency' (residência de dados)?",
   options:["O local físico onde os servidores de uma empresa estão instalados","O requisito legal ou regulatório de que dados sejam armazenados e processados em uma localização geográfica específica","O tempo que dados ficam armazenados em cache","A política de onde dados de backup são mantidos"],
   correct:1,explanation:"Data Residency refere-se ao requisito de que dados sejam mantidos dentro de fronteiras geográficas específicas (país ou região). Muitas regulamentações exigem que dados de cidadãos permaneçam no país (ex: GDPR na UE). O Azure oferece regiões geográficas e opções de residência de dados para atender esses requisitos.",tip:"O Azure permite especificar a região onde dados são armazenados e geralmente não move dados para fora da região sem consentimento."},

  {id:"sc096",domain:"Soluções de Segurança",difficulty:"basico",
   question:"O que é o Microsoft Defender for IoT?",
   options:["Um antivírus para dispositivos IoT domésticos","Uma solução de segurança especializada para proteger ambientes de IoT e OT (Tecnologia Operacional) industriais","Um sistema de gerenciamento de dispositivos IoT","Uma plataforma de desenvolvimento IoT seguro"],
   correct:1,explanation:"O Microsoft Defender for IoT protege dispositivos IoT e OT (sistemas industriais como SCADA, PLCs, HMIs) que frequentemente não suportam agentes de segurança convencionais. Usa análise passiva de tráfego de rede para detectar ameaças sem impactar a operação dos dispositivos.",tip:"Ambientes OT/ICS têm requisitos únicos de segurança — disponibilidade é frequentemente mais crítica que confidencialidade."},

  {id:"sc097",domain:"Identidade e Acesso",difficulty:"intermediario",
   question:"O que é o Self-Service Password Reset (SSPR) no Microsoft Entra ID?",
   options:["Um sistema onde administradores redefinem senhas automaticamente","Uma funcionalidade que permite aos usuários redefinir suas próprias senhas sem precisar do help desk, usando métodos de verificação pré-configurados","Um sistema de geração automática de senhas fortes","Um portal para gerentes resetarem senhas de seus funcionários"],
   correct:1,explanation:"O SSPR permite que usuários redefinam suas próprias senhas com segurança usando métodos verificados (email alternativo, telefone, aplicativo autenticador, perguntas de segurança) sem contatar o suporte de TI. Reduz custos de help desk e melhora a experiência do usuário.",tip:"Organizações que implementaram SSPR relatam redução significativa em chamados de help desk relacionados a senhas."},

  {id:"sc098",domain:"Soluções de Segurança",difficulty:"basico",
   question:"O que é o Azure Information Protection (AIP) / Microsoft Purview Information Protection?",
   options:["Um sistema de proteção física de servidores Azure","Uma solução que classifica e protege documentos e emails com rótulos de sensibilidade, independente de onde estejam","Um firewall para proteção de dados em trânsito","Um sistema de criptografia de banco de dados"],
   correct:1,explanation:"O Microsoft Purview Information Protection (anteriormente AIP) classifica dados com rótulos de sensibilidade (ex: Público, Confidencial, Altamente Confidencial) que persistem no documento. Os rótulos podem aplicar criptografia, marcas d'água e restrições de acesso, protegendo dados mesmo quando compartilhados externamente.",tip:"Os rótulos de sensibilidade seguem o documento — se você enviar por email, a proteção vai junto."},

  {id:"sc099",domain:"Conformidade Microsoft",difficulty:"intermediario",
   question:"O que é o Microsoft Purview Data Catalog?",
   options:["Um catálogo de serviços disponíveis no Azure","Uma solução de governança de dados que ajuda a descobrir, classificar e entender dados em toda a organização","Uma listagem de tipos de dados suportados pelo Azure","Um sistema de documentação de esquemas de banco de dados"],
   correct:1,explanation:"O Microsoft Purview Data Catalog (parte do Microsoft Purview Governance) cria um mapa unificado dos dados da organização através de múltiplas fontes (Azure, AWS, on-premises). Permite descobrir dados, entender sua linhagem, classificação e qualidade, facilitando governança e conformidade.",tip:"O Data Catalog usa classificadores automáticos e rótulos de sensibilidade para catalogar e proteger dados automaticamente."},

  {id:"sc100",domain:"Conceitos de Segurança",difficulty:"avancado",
   question:"O que é Threat Intelligence (Inteligência de Ameaças) e como a Microsoft a usa?",
   options:["Dados sobre usuários que representam ameaças internas","Conhecimento baseado em evidências sobre ameaças existentes e emergentes, usado para informar decisões de segurança","Um sistema de pontuação de risco para aplicativos","Uma técnica de teste de penetração avançada"],
   correct:1,explanation:"Threat Intelligence é o conhecimento sobre atores de ameaça, suas táticas, técnicas e procedimentos (TTPs), indicadores de comprometimento (IoCs) e vulnerabilidades. A Microsoft processa trilhões de sinais diariamente para alimentar sua TI, usada no Microsoft Sentinel, Defender XDR e outros produtos para detecção proativa de ameaças.",tip:"O Microsoft Threat Intelligence Center (MSTIC) pesquisa e rastreia atores de ameaça avançados globalmente."},
];

// Mesclar com o banco principal
QUESTION_BANK.push(...QUESTION_BANK_EXTRA);

// Atualizar metadata
PLATFORM_CONFIG.totalQuestions = QUESTION_BANK.length;

const QUESTION_BANK_EXTRA2 = [
  {id:"sc101",domain:"Conceitos de Segurança",difficulty:"basico",question:"O que é um ataque de negação de serviço distribuído (DDoS)?",options:["Um ataque que rouba senhas de múltiplos usuários","Um ataque que usa múltiplos sistemas para sobrecarregar um alvo, tornando-o indisponível para usuários legítimos","Um ataque que distribui malware por redes corporativas","Um ataque que interrompe comunicações de rede entre filiais"],correct:1,explanation:"Um ataque DDoS usa uma rede de dispositivos comprometidos (botnet) para enviar volumes massivos de tráfego a um alvo, esgotando seus recursos e tornando-o indisponível. O Azure DDoS Protection mitiga esses ataques automaticamente.",tip:"O Azure DDoS Protection Standard usa algoritmos adaptativos de mitigação baseados em ML."},

  {id:"sc102",domain:"Conceitos de Segurança",difficulty:"intermediario",question:"O que é um ataque de Cross-Site Scripting (XSS)?",options:["Um ataque que copia scripts entre servidores web","Um ataque que injeta scripts maliciosos em páginas web vistas por outros usuários","Um ataque que intercepta scripts de autenticação","Um ataque que explora falhas em frameworks JavaScript"],correct:1,explanation:"XSS permite que atacantes injetem código JavaScript malicioso em páginas web. Quando outros usuários visitam a página comprometida, o script executa no navegador deles, podendo roubar cookies, sessões ou redirecionar para sites falsos. WAF e validação de entrada são proteções principais.",tip:"O Azure WAF tem regras do OWASP Core Rule Set que protegem contra XSS e outros ataques web comuns."},

  {id:"sc103",domain:"Conformidade Microsoft",difficulty:"basico",question:"O que é o Centro de Confiança da Microsoft (Microsoft Trust Center)?",options:["Um data center de alta segurança da Microsoft","Um portal web que fornece informações sobre segurança, privacidade e conformidade dos produtos e serviços Microsoft","Um centro de suporte para questões de segurança","Um laboratório de pesquisa de cibersegurança da Microsoft"],correct:1,explanation:"O Microsoft Trust Center é o hub central para informações de segurança, privacidade, conformidade e transparência da Microsoft. Fornece documentação sobre como os produtos Microsoft protegem dados, certificações de conformidade e recursos para ajudar clientes a atender seus próprios requisitos regulatórios.",tip:"O Trust Center leva ao Service Trust Portal para documentos específicos de auditoria e conformidade."},

  {id:"sc104",domain:"Soluções de Segurança",difficulty:"intermediario",question:"O que é o Microsoft Defender for SQL?",options:["Um antivírus para servidores SQL Server","Uma solução que detecta anomalias e ameaças em bancos de dados SQL, como injeção SQL e acesso suspeito","Um sistema de backup para SQL Server","Uma ferramenta de otimização de performance SQL"],correct:1,explanation:"O Microsoft Defender for SQL protege bancos de dados SQL Server (on-premises e Azure SQL) detectando atividades anômalas que indicam tentativas incomuns e potencialmente prejudiciais de acessar ou explorar bancos de dados. Inclui detecção de SQL Injection, acesso de localização incomum e anomalias de comportamento.",tip:"Parte do conjunto Microsoft Defender for Cloud, estendendo proteção para camada de dados."},

  {id:"sc105",domain:"Identidade e Acesso",difficulty:"basico",question:"O que é um token de acesso no Microsoft Entra ID?",options:["Um token físico para autenticação multifator","Um JSON Web Token (JWT) que contém claims sobre a identidade do usuário e suas permissões, usado para acessar APIs protegidas","Uma senha temporária para acesso de convidados","Um certificado digital para autenticação de serviços"],correct:1,explanation:"Tokens de acesso são JWTs emitidos pelo Microsoft Entra ID após autenticação bem-sucedida. Contêm informações (claims) sobre a identidade do usuário, papéis e escopos autorizados. APIs protegidas validam esses tokens para autorizar chamadas sem precisar re-autenticar o usuário a cada requisição.",tip:"Tokens de acesso têm vida curta (geralmente 1 hora); tokens de atualização permitem obter novos tokens de acesso."},

  {id:"sc106",domain:"Conceitos de Segurança",difficulty:"intermediario",question:"O que é o conceito de 'Kill Chain' em cibersegurança?",options:["Um método para desligar sistemas comprometidos rapidamente","Um modelo que descreve as etapas de um ataque cibernético, desde reconhecimento até exfiltração de dados","Uma técnica de resposta a incidentes em etapas sequenciais","Um framework para classificar tipos de malware"],correct:1,explanation:"A Cyber Kill Chain (desenvolvida pela Lockheed Martin) descreve as etapas de um ataque cibernético: Reconhecimento, Armamento, Entrega, Exploração, Instalação, Comando e Controle, e Ações nos Objetivos. Entender o Kill Chain ajuda defensores a interromper ataques em estágios iniciais.",tip:"O Microsoft Sentinel mapeia alertas para as táticas do MITRE ATT&CK, que é uma evolução do conceito de Kill Chain."},

  {id:"sc107",domain:"Soluções de Segurança",difficulty:"basico",question:"O que é o Azure Security Center / Microsoft Defender for Cloud postura de segurança?",options:["Um centro de operações de segurança (SOC) gerenciado pela Microsoft","Uma avaliação contínua da configuração de segurança dos recursos Azure para identificar e remediar vulnerabilidades","Um sistema de monitoramento de performance de segurança","Um serviço de consultoria de segurança da Microsoft"],correct:1,explanation:"O Defender for Cloud avalia continuamente a configuração de segurança dos recursos Azure, AWS e GCP, identificando configurações incorretas e vulnerabilidades. Fornece recomendações priorizadas com passos de remediação e um Secure Score que mede a postura de segurança geral.",tip:"O Secure Score aumenta conforme você implementa as recomendações — é uma gamificação da melhoria de segurança."},

  {id:"sc108",domain:"Conceitos de Conformidade",difficulty:"intermediario",question:"O que é análise de impacto nos negócios (BIA)?",options:["Uma análise financeira do impacto de novos produtos","Um processo que identifica e avalia os efeitos de interrupções nas funções críticas de negócio","Uma avaliação do impacto ambiental das operações de TI","Uma análise de risco de parceiros de negócios"],correct:1,explanation:"A BIA (Business Impact Analysis) identifica funções críticas de negócio e determina o impacto financeiro e operacional de sua interrupção. Define RTO (Recovery Time Objective) e RPO (Recovery Point Objective) para cada função. É o fundamento para desenvolver planos de continuidade de negócios e recuperação de desastres.",tip:"BIA → identifica o que é crítico; BCP → como manter operações; DRP → como recuperar sistemas de TI."},

  {id:"sc109",domain:"Identidade e Acesso",difficulty:"avancado",question:"O que é o Continuous Access Evaluation (CAE) no Microsoft Entra ID?",options:["Uma avaliação contínua de performance de usuários","Uma funcionalidade que permite revogar sessões de usuários quase em tempo real quando condições de risco mudam, sem esperar a expiração do token","Um sistema de avaliação contínua de políticas de acesso","Uma técnica de renovação automática de tokens de acesso"],correct:1,explanation:"CAE permite que serviços Microsoft 365 e o Entra ID se comuniquem em tempo real para aplicar mudanças de política quase instantaneamente. Se um usuário é desabilitado, sua senha muda ou o Acesso Condicional detecta risco, as sessões ativas podem ser encerradas em segundos, em vez de esperar a expiração do token (até 1 hora).",tip:"Sem CAE, um token válido continua funcionando por até 1 hora mesmo após a conta ser desabilitada."},

  {id:"sc110",domain:"Soluções de Segurança",difficulty:"intermediario",question:"O que é o Microsoft Defender External Attack Surface Management (EASM)?",options:["Um sistema de gerenciamento de ataques internos","Uma solução que descobre e analisa a superfície de ataque externa da organização, identificando ativos expostos à internet","Um sistema de monitoramento de redes externas","Uma ferramenta de testes de penetração automatizados"],correct:1,explanation:"O Defender EASM descobre automaticamente ativos expostos à internet pertencentes à organização (domínios, IPs, certificados, aplicativos web) que muitas vezes são desconhecidos do time de segurança — Shadow IT externo. Avalia riscos e vulnerabilidades nesses ativos para reduzir a superfície de ataque.",tip:"Você não pode proteger o que não conhece — o EASM resolve o problema de ativos externos desconhecidos."},

  {id:"sc111",domain:"Conceitos de Segurança",difficulty:"basico",question:"O que é autenticação baseada em risco?",options:["Autenticação que exige mais fatores quando o nível de risco detectado é maior","Autenticação que avalia riscos financeiros antes de conceder acesso","Autenticação que restringe acesso em regiões de alto risco","Autenticação que desativa contas com comportamento de risco"],correct:0,explanation:"Autenticação baseada em risco ajusta os requisitos de autenticação com base no risco detectado. Logins de baixo risco (dispositivo conhecido, localização habitual) podem usar autenticação simples; logins de alto risco (localização atípica, dispositivo desconhecido) exigem MFA ou são bloqueados. O Entra ID Protection implementa isso.",tip:"É uma implementação inteligente de MFA — aplicado apenas quando realmente necessário, sem friction para usuários em situações normais."},

  {id:"sc112",domain:"Conformidade Microsoft",difficulty:"basico",question:"O que é o conceito de transparência no contexto de privacidade de dados?",options:["Tornar o código-fonte de sistemas Microsoft público","Informar claramente aos titulares de dados como suas informações são coletadas, usadas e compartilhadas","Publicar relatórios financeiros sobre receita de dados","Permitir que qualquer pessoa acesse dados da empresa"],correct:1,explanation:"Transparência é um princípio fundamental do GDPR e outras regulamentações de privacidade. Exige que organizações sejam claras e honestas sobre quais dados coletam, para que finalidade, por quanto tempo retêm e com quem compartilham. Isso é comunicado através de políticas de privacidade e avisos de coleta de dados.",tip:"O Microsoft Trust Center demonstra o compromisso da Microsoft com transparência sobre como processa dados de clientes."},

  {id:"sc113",domain:"Soluções de Segurança",difficulty:"intermediario",question:"O que são Log Analytics Workspaces no contexto do Microsoft Sentinel?",options:["Áreas de trabalho físicas para analistas de segurança","Repositórios de dados que coletam e armazenam logs de segurança de múltiplas fontes para análise no Sentinel","Grupos de usuários que analisam logs de segurança","Ferramentas de visualização de logs do Azure Monitor"],correct:1,explanation:"Log Analytics Workspaces são repositórios centralizados no Azure Monitor que coletam dados de log de múltiplas fontes. O Microsoft Sentinel é construído sobre o Log Analytics e usa esses workspaces para armazenar e analisar dados de segurança. A linguagem KQL (Kusto Query Language) é usada para consultar os dados.",tip:"O Sentinel usa workspaces do Log Analytics — os custos incluem ingestão e retenção de dados de log."},

  {id:"sc114",domain:"Identidade e Acesso",difficulty:"basico",question:"O que é provisionamento de usuários (user provisioning)?",options:["Fornecer computadores e equipamentos para novos funcionários","O processo automatizado de criar, atualizar e remover contas de usuário e suas permissões em sistemas e aplicativos","Provisionar espaço em disco para dados de usuários","A criação manual de contas de usuário pelo administrador"],correct:1,explanation:"Provisionamento de usuários automatiza o ciclo de vida de identidades: cria contas quando alguém entra na organização, atualiza permissões quando o papel muda e remove acesso quando alguém sai. O Microsoft Entra ID suporta provisionamento automático para milhares de aplicativos SaaS via SCIM.",tip:"Provisionamento automatizado reduz erros, acelera o onboarding e garante que ex-funcionários percam acesso imediatamente."},

  {id:"sc115",domain:"Conceitos de Segurança",difficulty:"intermediario",question:"O que é um Indicador de Comprometimento (IoC)?",options:["Um indicador de performance de sistemas comprometidos","Evidências forenses que indicam que um sistema pode ter sido comprometido, como hashes de malware, IPs maliciosos ou domínios suspeitos","Um relatório de auditoria de sistemas comprometidos","Um alerta de sistema sobre atividade suspeita"],correct:1,explanation:"IoCs (Indicators of Compromise) são evidências que indicam que um sistema foi comprometido ou que um ataque está em andamento. Exemplos: hashes de arquivos maliciosos, endereços IP de C2 (comando e controle), domínios de phishing, strings de registro específicas. Sistemas SIEM como o Sentinel usam IoCs para detecção.",tip:"A Microsoft compartilha IoCs através do Microsoft Threat Intelligence Center e integra no Sentinel e Defender XDR."},

  {id:"sc116",domain:"Soluções de Segurança",difficulty:"avancado",question:"O que é o Microsoft Sentinel SOAR (Security Orchestration, Automation and Response)?",options:["Um sistema de relatórios automáticos de segurança","Uma funcionalidade do Sentinel que automatiza respostas a incidentes através de playbooks baseados em Azure Logic Apps","Um sistema de orquestração de patches de segurança","Uma ferramenta de automação de testes de segurança"],correct:1,explanation:"O SOAR do Microsoft Sentinel usa playbooks (fluxos de trabalho automatizados baseados em Azure Logic Apps) para automatizar respostas a incidentes de segurança. Por exemplo: quando um alerta de phishing é detectado, um playbook pode automaticamente bloquear o usuário, revogar tokens e notificar o SOC.",tip:"Playbooks reduzem o tempo de resposta a incidentes de horas para segundos através de automação."},

  {id:"sc117",domain:"Conformidade Microsoft",difficulty:"intermediario",question:"O que é o Modelo de Responsabilidade Compartilhada aplicado à conformidade?",options:["A Microsoft é responsável por toda a conformidade dos clientes","Em IaaS o cliente tem mais responsabilidade de conformidade; em SaaS a Microsoft assume mais responsabilidade, mas o cliente ainda é responsável por seus dados e acessos","A conformidade é responsabilidade exclusiva do cliente em todos os modelos","A conformidade é gerenciada por auditores externos independentemente do modelo"],correct:1,explanation:"No modelo de responsabilidade compartilhada para conformidade: em IaaS, o cliente é responsável pelo SO, middleware, runtime, dados e conformidade de suas aplicações; em PaaS, a Microsoft gerencia mais da pilha; em SaaS, a Microsoft gerencia a plataforma mas o cliente ainda é responsável por dados, identidades e configurações de acesso.",tip:"Mesmo usando SaaS como Microsoft 365, o cliente é responsável por quem tem acesso e como os dados são usados."},

  {id:"sc118",domain:"Identidade e Acesso",difficulty:"intermediario",question:"O que são permissões delegadas vs permissões de aplicativo no Microsoft Entra ID?",options:["Permissões temporárias vs permanentes no Azure","Delegadas: o aplicativo age em nome de um usuário específico; de aplicativo: o aplicativo age com sua própria identidade sem usuário presente","Delegadas são para usuários externos; de aplicativo são para usuários internos","Delegadas requerem MFA; de aplicativo não requerem"],correct:1,explanation:"Permissões delegadas permitem que um aplicativo acesse recursos em nome de um usuário conectado — o aplicativo 'herda' as permissões do usuário. Permissões de aplicativo permitem que um aplicativo acesse recursos com sua própria identidade (sem usuário), geralmente em processos de background ou daemons.",tip:"Permissões de aplicativo são mais poderosas e requerem aprovação de um administrador do tenant."},

  {id:"sc119",domain:"Conceitos de Segurança",difficulty:"basico",question:"O que é uma VPN (Virtual Private Network)?",options:["Uma rede virtual exclusiva para servidores de alta performance","Uma tecnologia que cria um túnel criptografado sobre uma rede pública para conexão segura e privada","Uma rede privada dentro de um data center","Uma rede virtual para desenvolvimento e testes"],correct:1,explanation:"Uma VPN cria um túnel criptografado sobre a internet (rede pública), permitindo que usuários remotos se conectem com segurança à rede corporativa como se estivessem fisicamente presentes. No Azure, o VPN Gateway conecta redes on-premises à Azure VNet de forma segura.",tip:"Azure ExpressRoute é uma alternativa à VPN que usa uma conexão privada dedicada (sem internet) para maior performance e confiabilidade."},

  {id:"sc120",domain:"Soluções de Segurança",difficulty:"intermediario",question:"O que é o Microsoft Purview Data Loss Prevention para endpoints?",options:["Um sistema de backup para endpoints","Uma solução que detecta e impede o compartilhamento de dados sensíveis em dispositivos Windows, incluindo upload para nuvem não aprovada, impressão ou cópia para USB","Um antivírus para proteção de dados em endpoints","Uma ferramenta de criptografia de discos em endpoints"],correct:1,explanation:"O DLP para endpoints do Microsoft Purview (integrado ao Defender for Endpoint) monitora atividades em dispositivos Windows: upload de arquivos sensíveis para serviços de nuvem não aprovados (Dropbox, Google Drive pessoal), impressão, cópia para USB ou compartilhamento por email, podendo bloquear ou alertar.",tip:"O DLP de endpoint complementa o DLP de serviços Microsoft 365, estendendo a proteção para dispositivos locais."},

  {id:"sc121",domain:"Conceitos de Segurança",difficulty:"intermediario",question:"O que é análise de vulnerabilidades (vulnerability scanning)?",options:["Uma técnica de hacking ético para invasão controlada de sistemas","Um processo automatizado que identifica fraquezas de segurança conhecidas em sistemas, redes e aplicativos","Uma análise de comportamento de usuários suspeitos","Um teste de carga para identificar limites de sistemas"],correct:1,explanation:"Análise de vulnerabilidades usa ferramentas automatizadas para verificar sistemas contra bancos de dados de vulnerabilidades conhecidas (CVEs). Identifica patches ausentes, configurações incorretas e versões de software vulneráveis. O Microsoft Defender Vulnerability Management integra essa capacidade no ecossistema Defender.",tip:"Diferente do pentest (que tenta explorar vulnerabilidades), o scan apenas as identifica."},

  {id:"sc122",domain:"Identidade e Acesso",difficulty:"basico",question:"O que é federação de identidade?",options:["A criação de um sistema de identidade federal para governo","Um acordo entre organizações para confiar mutuamente em identidades, permitindo SSO entre diferentes domínios","A sincronização de identidades entre múltiplos diretórios","A fusão de múltiplos sistemas de identidade em um único"],correct:1,explanation:"Federação de identidade estabelece confiança entre diferentes sistemas de identidade (provedores de identidade), permitindo que usuários de uma organização acessem recursos de outra sem criar novas credenciais. O Entra ID pode federar com provedores como ADFS, Okta, ou suportar identidades sociais (Google, Facebook) para cenários B2C.",tip:"SAML 2.0 e OpenID Connect são protocolos comuns usados em federação de identidade."},

  {id:"sc123",domain:"Soluções de Segurança",difficulty:"basico",question:"O que é o Azure Monitor?",options:["Um sistema de segurança que monitora tentativas de invasão","Uma plataforma abrangente de monitoramento que coleta, analisa e age sobre dados de telemetria de ambientes Azure e on-premises","Um serviço de monitoramento de desempenho de rede exclusivo","Uma ferramenta de monitoramento de custos do Azure"],correct:1,explanation:"O Azure Monitor coleta métricas e logs de recursos Azure, aplicativos e sistemas on-premises. Permite criar alertas, dashboards e análises. Para segurança, alimenta o Microsoft Sentinel com dados de log. Inclui o Log Analytics para análise avançada de logs com KQL.",tip:"Azure Monitor é a fundação sobre a qual o Microsoft Sentinel e outros serviços de observabilidade são construídos."},

  {id:"sc124",domain:"Conceitos de Conformidade",difficulty:"avancado",question:"O que é o conceito de 'Right to be Forgotten' (Direito ao Esquecimento) no GDPR?",options:["O direito de esquecer senhas sem penalidade","O direito de titulares de dados de solicitar a exclusão de seus dados pessoais quando não há mais justificativa legal para mantê-los","O direito de não ser rastreado online","O direito de anonimizar dados pessoais em sistemas"],correct:1,explanation:"O 'Direito ao Esquecimento' (Artigo 17 do GDPR) permite que titulares de dados solicitem a exclusão de seus dados pessoais. As organizações devem cumprir quando: o propósito original não existe mais, o consentimento é retirado, ou o processamento era ilegal. Exceções incluem obrigações legais de retenção.",tip:"O Microsoft Purview oferece recursos de DSR (Data Subject Requests) para ajudar organizações a responder a solicitações de direito ao esquecimento."},

  {id:"sc125",domain:"Soluções de Segurança",difficulty:"intermediario",question:"O que é o Adaptive Application Control no Microsoft Defender for Cloud?",options:["Um sistema que adapta aplicativos automaticamente para melhor performance","Uma funcionalidade que cria regras de lista de permissão para aplicativos que podem executar em VMs, usando ML para recomendar aplicativos legítimos","Um sistema de controle de versão adaptativo para aplicativos","Uma ferramenta de teste adaptativo de aplicativos"],correct:1,explanation:"O Adaptive Application Control usa ML para analisar quais aplicativos rodam habitualmente nas VMs e criar listas de permissão (allowlists). Alerta quando aplicativos não aprovados tentam executar — útil para detectar malware ou uso não autorizado de software.",tip:"Implementa o conceito de 'default deny' para execução de aplicativos, complementando o antivírus."},

  {id:"sc126",domain:"Identidade e Acesso",difficulty:"intermediario",question:"O que é Entitlement Management no Microsoft Entra ID?",options:["Um sistema de gerenciamento de direitos autorais","Uma funcionalidade que automatiza o ciclo de vida de acesso, permitindo que usuários solicitem acesso a pacotes de recursos com aprovação e expiração automática","Um sistema de gestão de licenças de software","Um controle de acesso para ambientes de desenvolvimento"],correct:1,explanation:"O Entitlement Management organiza recursos (grupos, aplicativos, sites SharePoint) em 'pacotes de acesso'. Usuários solicitam acesso, aprovadores revisam, e o acesso é concedido por tempo limitado com renovação opcional. Automatiza o processo de onboarding, offboarding e revisão periódica de acessos.",tip:"Entitlement Management implementa o princípio de menor privilégio com acesso baseado em tempo."},

  {id:"sc127",domain:"Conceitos de Segurança",difficulty:"basico",question:"O que é um honeypot em segurança da informação?",options:["Uma armadilha física para capturar hackers","Um sistema ou recurso deliberadamente vulnerável usado para atrair atacantes, permitindo estudar suas técnicas e detectar intrusões","Um repositório de senhas comprometidas","Um sistema de backup disfarçado como recurso principal"],correct:1,explanation:"Um honeypot é um recurso de segurança projetado para parecer um alvo legítimo e valioso para atacantes. Quando um atacante interage com o honeypot, o time de segurança é alertado e pode estudar as técnicas do atacante. Não tem valor legítimo — qualquer acesso é suspeito por definição.",tip:"Microsoft usa tecnologias de deception (engano) similares a honeypots no Defender for Identity para detectar movimento lateral."},

  {id:"sc128",domain:"Soluções de Segurança",difficulty:"intermediario",question:"O que é o Azure Sentinel Hunting?",options:["Uma funcionalidade de busca de documentos no Azure","Uma capacidade proativa do Microsoft Sentinel que permite que analistas busquem ameaças ocultas nos dados antes que alertas sejam disparados","Um sistema de caça a vulnerabilidades em código","Uma ferramenta de pesquisa de ameaças em relatórios de segurança"],correct:1,explanation:"Threat Hunting no Sentinel permite que analistas de segurança proativamente busquem ameaças nos dados de log usando queries KQL, sem esperar por alertas automatizados. Caçadores de ameaças formulam hipóteses sobre possíveis ataques e pesquisam evidências, descobrindo ameaças avançadas que evadem detecção automática.",tip:"Hunting é proativo; investigação de alertas é reativo. Ambos são necessários em um SOC maduro."},

  {id:"sc129",domain:"Conformidade Microsoft",difficulty:"basico",question:"O que é o Microsoft 365 Compliance Center / Microsoft Purview compliance portal?",options:["Um portal para compra de licenças de conformidade","Um hub centralizado para soluções de conformidade, privacidade e governança de dados no Microsoft 365","Um sistema de helpdesk para questões de conformidade","Uma plataforma de treinamento em conformidade"],correct:1,explanation:"O Microsoft Purview compliance portal (anteriormente Microsoft 365 Compliance Center) é o hub centralizado para gerenciar conformidade no Microsoft 365. Oferece acesso ao Compliance Manager, DLP, Information Protection, eDiscovery, Insider Risk Management e outras soluções de conformidade em um único local.",tip:"O Compliance Manager dentro do portal fornece pontuação de conformidade e recomendações de ação."},

  {id:"sc130",domain:"Conceitos de Segurança",difficulty:"intermediario",question:"O que é o conceito de segurança em camadas para email?",options:["Usar múltiplos provedores de email simultaneamente","Aplicar múltiplas camadas de proteção ao email: filtro de spam, anti-phishing, anti-malware, sandboxing de anexos e análise de links","Criptografar emails em múltiplas camadas sequenciais","Distribuir emails entre múltiplos servidores por segurança"],correct:1,explanation:"Proteção de email em camadas combina: filtragem de spam e vírus (EOP - Exchange Online Protection), proteção contra phishing avançado, sandboxing de anexos (Safe Attachments) para executar e analisar arquivos suspeitos, e verificação de links em tempo de clique (Safe Links). O Microsoft Defender for Office 365 implementa essas camadas.",tip:"EOP (incluído no Microsoft 365) + Defender for Office 365 (P1/P2) = proteção de email em camadas completa."},

  {id:"sc131",domain:"Identidade e Acesso",difficulty:"avancado",question:"O que é o Azure AD Application Proxy?",options:["Um servidor proxy para acesso à internet corporativo","Um serviço que permite publicar aplicativos web on-premises na internet de forma segura, sem abrir portas no firewall","Um proxy de cache para otimização de aplicativos Azure","Um gateway de API para aplicativos Microsoft 365"],correct:1,explanation:"O Azure AD Application Proxy (agora Entra ID Application Proxy) permite acesso remoto seguro a aplicativos web on-premises sem VPN. O conector no ambiente on-premises estabelece uma conexão de saída com o Azure; os usuários externos acessam através de URLs no Azure com autenticação Entra ID e MFA.",tip:"Application Proxy é ideal para organizações com aplicativos legados que não podem ser migrados para nuvem imediatamente."},

  {id:"sc132",domain:"Soluções de Segurança",difficulty:"basico",question:"O que é o Microsoft Defender SmartScreen?",options:["Uma tela de bloqueio inteligente do Windows","Um recurso de proteção que avalia sites e downloads em tempo real, bloqueando conteúdo malicioso e phishing em navegadores Microsoft","Um filtro de tela para proteção de privacidade visual","Uma ferramenta de filtragem de emails no Outlook"],correct:1,explanation:"O SmartScreen é um recurso de segurança integrado ao Windows e navegadores Microsoft Edge/IE que analisa sites e downloads em tempo real. Compara com listas de sites de phishing e malware conhecidos, e usa análise heurística para detectar ameaças desconhecidas. Protege contra phishing, malware e download de software malicioso.",tip:"SmartScreen usa a inteligência de ameaças da Microsoft, processando trilhões de URLs e arquivos globalmente."},

  {id:"sc133",domain:"Conceitos de Conformidade",difficulty:"intermediario",question:"O que é gerenciamento de registros (records management) no Microsoft Purview?",options:["O gerenciamento de registros de funcionários de RH","Uma solução para gerenciar o ciclo de vida de registros organizacionais — declarando, retendo e descartando conforme requisitos legais e regulatórios","O gerenciamento de logs de sistema de TI","Um sistema de arquivamento de emails corporativos"],correct:1,explanation:"O Gerenciamento de Registros do Microsoft Purview identifica e gerencia registros organizacionais (contratos, registros financeiros, correspondências regulatórias) declarando-os imutáveis, aplicando políticas de retenção obrigatória e gerenciando a disposição ao final do período de retenção, com trilha de auditoria completa.",tip:"Registros são diferentes de documentos comuns — uma vez declarados como registros, não podem ser modificados ou excluídos antes do fim do período de retenção."},

  {id:"sc134",domain:"Soluções de Segurança",difficulty:"intermediario",question:"O que é File Integrity Monitoring (FIM) no Microsoft Defender for Cloud?",options:["Um sistema de monitoramento de tamanho de arquivos","Uma solução que monitora mudanças em arquivos críticos do sistema operacional, registro e aplicativos para detectar possíveis ataques","Um sistema de verificação de integridade de backups","Uma ferramenta de controle de versão de arquivos de configuração"],correct:1,explanation:"O FIM (File Integrity Monitoring) no Defender for Cloud monitora mudanças em arquivos críticos do sistema operacional Windows e Linux, chaves de registro e aplicativos. Alterações não autorizadas em arquivos do sistema podem indicar comprometimento — malware modificando binários do sistema ou atacantes criando backdoors.",tip:"FIM é especialmente importante para conformidade com PCI DSS, que exige monitoramento de integridade de arquivos críticos."},

  {id:"sc135",domain:"Identidade e Acesso",difficulty:"basico",question:"O que é licença do Microsoft Entra ID P1 vs P2?",options:["P1 é para pequenas empresas; P2 é para grandes corporações","P1 inclui recursos como Acesso Condicional e SSPR; P2 adiciona Identity Protection, Privileged Identity Management e Access Reviews","P1 é a versão gratuita; P2 requer assinatura paga","P1 suporta usuários internos; P2 suporta usuários externos também"],correct:1,explanation:"Microsoft Entra ID P1 adiciona: Acesso Condicional, SSPR, Identity Governance básico, autenticação de múltiplos fatores. Entra ID P2 adiciona: Identity Protection (detecção de risco em tempo real), Privileged Identity Management (PIM) e Access Reviews. Existe também um tier gratuito com recursos básicos.",tip:"Entra ID P2 é necessário para implementar Zero Trust completo com todos os controles de identidade da Microsoft."},

  {id:"sc136",domain:"Conceitos de Segurança",difficulty:"intermediario",question:"O que é SOAR e como se diferencia de SIEM?",options:["SOAR é mais antigo que SIEM; SIEM é mais moderno","SIEM coleta e analisa dados para detecção; SOAR adiciona automação e orquestração de respostas a incidentes","SOAR é para ambientes on-premises; SIEM é para nuvem","SIEM é gratuito; SOAR requer licença adicional"],correct:1,explanation:"SIEM (coleta, correlação e análise de logs) foca em detecção de ameaças. SOAR (orquestração, automação e resposta) automatiza e agiliza a resposta a incidentes detectados. O Microsoft Sentinel combina as duas capacidades: SIEM para detectar + SOAR (via Logic Apps playbooks) para responder automaticamente.",tip:"SIEM + SOAR = detectar E responder. Sentinela combina ambos em uma plataforma nativa da nuvem."},

  {id:"sc137",domain:"Soluções de Segurança",difficulty:"basico",question:"O que é o Azure Defender for Storage?",options:["Um antivírus para arquivos armazenados no Azure","Uma solução que detecta atividades incomuns e potencialmente prejudiciais em contas de armazenamento Azure, como acesso anômalo ou upload de malware","Um sistema de backup para Azure Storage","Uma ferramenta de criptografia para Azure Blob Storage"],correct:1,explanation:"O Microsoft Defender for Storage detecta tentativas incomuns de acesso a contas de armazenamento Azure, como acesso de localização atípica, explorações de permissão, upload de arquivos maliciosos e exfiltração de dados. Analisa logs de diagnóstico do Azure Storage para identificar ameaças.",tip:"O Defender for Storage pode detectar arquivos maliciosos (malware) enviados para Azure Blob Storage usando hash reputation."},

  {id:"sc138",domain:"Conformidade Microsoft",difficulty:"avancado",question:"O que são controles técnicos vs controles administrativos vs controles físicos em conformidade?",options:["Três categorias de custo de conformidade","Controles técnicos: implementados em tecnologia (firewall, criptografia); administrativos: políticas e procedimentos; físicos: proteção física de instalações e equipamentos","Três níveis de severidade de controles de conformidade","Controles aplicados a diferentes departamentos da organização"],correct:1,explanation:"A tríade de controles de segurança: Técnicos (firewalls, MFA, criptografia, RBAC), Administrativos (políticas de segurança, treinamento, procedimentos de resposta a incidentes) e Físicos (controle de acesso a instalações, câmeras, destruição de mídia). Conformidade efetiva requer os três tipos trabalhando juntos.",tip:"Regulamentos como ISO 27001 e PCI DSS mapeiam requisitos para controles técnicos, administrativos e físicos."},

  {id:"sc139",domain:"Identidade e Acesso",difficulty:"intermediario",question:"O que são Access Reviews no Microsoft Entra ID?",options:["Relatórios de auditoria de tentativas de acesso mal-sucedidas","Processos periódicos de revisão onde aprovadores verificam se usuários ainda precisam do acesso que têm, removendo acessos desnecessários","Revisões de política de acesso condicional","Análises de performance do sistema de controle de acesso"],correct:1,explanation:"Access Reviews automatiza revisões periódicas de acessos para garantir que usuários mantenham apenas permissões necessárias. Proprietários de recursos ou gerentes revisam acessos e decidem manter ou revogar. Se nenhuma decisão é tomada, o acesso pode ser revogado automaticamente. Suporta revisão de membros de grupos, acesso a aplicativos e funções privilegiadas.",tip:"Access Reviews implementam o princípio de menor privilégio de forma contínua — não apenas no provisionamento inicial."},

  {id:"sc140",domain:"Conceitos de Segurança",difficulty:"basico",question:"O que é segregação de funções (Separation of Duties)?",options:["A divisão do departamento de TI em equipes especializadas","O princípio que divide tarefas críticas entre múltiplas pessoas para evitar fraude ou erro não detectado","A separação de funções de desenvolvimento e operações","A divisão de responsabilidades entre TI e negócios"],correct:1,explanation:"Segregação de Funções divide tarefas críticas entre diferentes pessoas de forma que nenhum indivíduo tenha controle completo de um processo. Exemplo: quem solicita pagamentos não deve aprovar os mesmos. Em TI: quem desenvolve código não deveria fazer deploy em produção. Reduz risco de fraude e erros não detectados.",tip:"No Azure, RBAC implementa segregação de funções ao separar papéis de administrador, operador e auditor."},

  {id:"sc141",domain:"Soluções de Segurança",difficulty:"intermediario",question:"O que é Microsoft Defender Threat Intelligence (MDTI)?",options:["Um relatório trimestral de ameaças da Microsoft","Uma plataforma que fornece inteligência de ameaças abrangente sobre atores de ameaça, infraestrutura maliciosa e indicadores de comprometimento","Um sistema de detecção de ameaças para endpoints","Uma ferramenta de análise de logs de ameaças"],correct:1,explanation:"O Microsoft Defender Threat Intelligence fornece visibilidade abrangente sobre o panorama de ameaças: perfis de atores de ameaça (APTs, grupos criminosos), infraestrutura maliciosa (IPs, domínios, certificados), TTPs (táticas, técnicas e procedimentos) e feeds de IoCs. Integra com Sentinel e Defender XDR.",tip:"MDTI combina inteligência de ameaças da Microsoft com dados de parceiros e fontes abertas (OSINT)."},

  {id:"sc142",domain:"Conformidade Microsoft",difficulty:"basico",question:"O que é o Data Protection Addendum (DPA) da Microsoft?",options:["Um documento técnico sobre proteção de dados de backup","Um adendo contratual que descreve os compromissos da Microsoft para processar e proteger dados de clientes, incluindo suporte ao GDPR","Uma adição ao contrato de suporte técnico Microsoft","Uma política interna sobre proteção de dados de funcionários Microsoft"],correct:1,explanation:"O DPA (Data Protection Addendum) da Microsoft é um compromisso contratual que descreve como a Microsoft processa dados de clientes em serviços cloud. Inclui obrigações de processamento de dados pessoais, medidas técnicas e organizacionais de segurança, suporte a DSARs e conformidade com GDPR, LGPD e outras regulamentações.",tip:"O DPA é o documento que você referencia para provar que a Microsoft processa seus dados em conformidade com regulamentações de privacidade."},

  {id:"sc143",domain:"Identidade e Acesso",difficulty:"intermediario",question:"O que é o Microsoft Entra Permissions Management?",options:["Um sistema para gerenciar senhas de permissões","Uma solução CIEM (Cloud Infrastructure Entitlement Management) que descobre, corrige e monitora permissões excessivas em Azure, AWS e GCP","Um gerenciador de permissões para aplicativos Microsoft 365","Uma ferramenta de análise de permissões de arquivos"],correct:1,explanation:"O Entra Permissions Management é uma solução CIEM (Cloud Infrastructure Entitlement Management) que provê visibilidade e controle sobre permissões em múltiplas nuvens (Azure, AWS, GCP). Identifica permissões excessivas ou não utilizadas, sugere o 'right-size' de permissões e detecta atividades anômalas baseadas em permissões.",tip:"CIEM estende o princípio do menor privilégio para permissões de identidades de nuvem em escala multi-cloud."},

  {id:"sc144",domain:"Conceitos de Segurança",difficulty:"basico",question:"O que é uma lista de controle de acesso (ACL)?",options:["Uma lista de todos os usuários da organização","Uma lista que especifica quais usuários ou sistemas têm permissão para acessar objetos específicos e que operações podem realizar","Uma lista de vulnerabilidades conhecidas em sistemas","Uma lista de tentativas de acesso mal-sucedidas"],correct:1,explanation:"Uma ACL é um conjunto de permissões associadas a um objeto (arquivo, pasta, recurso de rede). Especifica quais usuários ou grupos podem acessar o objeto e com quais permissões (leitura, escrita, execução, exclusão). NSGs no Azure são essencialmente ACLs para tráfego de rede.",tip:"ACLs implementam o controle de acesso discricionário (DAC) — o proprietário do recurso define quem pode acessá-lo."},

  {id:"sc145",domain:"Soluções de Segurança",difficulty:"avancado",question:"O que é o Microsoft Defender for APIs?",options:["Um sistema de teste de segurança de APIs","Uma solução que descobre, classifica e protege APIs expostas, detectando uso anômalo, ataques e vazamentos de dados sensíveis","Uma ferramenta de documentação de APIs seguras","Um gateway de API com funcionalidades de segurança"],correct:1,explanation:"O Microsoft Defender for APIs (parte do Defender for Cloud) protege APIs gerenciadas pelo Azure API Management. Descobre automaticamente APIs, analisa o tráfego para detectar anomalias, ataques (como injeção de API, scraping excessivo, uso não autorizado) e vazamento de dados sensíveis nas respostas de API.",tip:"APIs são frequentemente um vetor de ataque negligenciado — o Defender for APIs traz visibilidade de segurança específica para esse contexto."},

  {id:"sc146",domain:"Conformidade Microsoft",difficulty:"intermediario",question:"O que é o Azure Resource Lock?",options:["Um sistema de segurança física para servidores Azure","Um mecanismo que evita exclusão ou modificação acidental de recursos Azure críticos","Um controle de acesso baseado em tempo para recursos","Uma ferramenta de auditoria de mudanças em recursos"],correct:1,explanation:"Os Azure Resource Locks impedem que recursos sejam acidentalmente excluídos ou modificados. Existem dois tipos: 'CanNotDelete' (usuários podem ler e modificar, mas não excluir) e 'ReadOnly' (usuários podem ler, mas não modificar nem excluir). Locks se aplicam a todos os usuários, independente do papel RBAC.",tip:"Resource Locks são especialmente importantes para recursos críticos de rede (VNets, gateways) e armazenamento (Key Vaults)."},

  {id:"sc147",domain:"Identidade e Acesso",difficulty:"basico",question:"O que é o Microsoft Entra ID Free tier?",options:["Uma versão de avaliação gratuita por 30 dias","O nível gratuito do Entra ID, incluído com qualquer assinatura Microsoft como Microsoft 365 ou Azure, com recursos básicos de gerenciamento de identidade","Uma versão gratuita com limitação de 50 usuários","O nível gratuito disponível apenas para organizações sem fins lucrativos"],correct:1,explanation:"O Microsoft Entra ID Free está incluído em qualquer assinatura de serviços cloud da Microsoft. Oferece: gerenciamento de usuários e grupos, SSO para aplicativos SaaS, sincronização com AD local (Entra Connect), MFA básico via autenticador, relatórios básicos de segurança. Para recursos avançados como Acesso Condicional, é necessário P1 ou P2.",tip:"Free → P1 → P2: cada nível adiciona recursos de segurança e governança mais avançados."},

  {id:"sc148",domain:"Conceitos de Segurança",difficulty:"intermediario",question:"O que é o MITRE ATT&CK Framework?",options:["Um framework de desenvolvimento de software seguro","Uma base de conhecimento das táticas, técnicas e procedimentos (TTPs) usados por atores de ameaça reais, baseada em observações do mundo real","Um sistema de avaliação de vulnerabilidades de hardware","Um padrão de comunicação entre sistemas de segurança"],correct:1,explanation:"O MITRE ATT&CK (Adversarial Tactics, Techniques & Common Knowledge) é uma base de conhecimento globalmente acessível sobre comportamentos de adversários cibernéticos. Organizado em matrizes (Enterprise, Mobile, ICS), descreve táticas (objetivos do atacante) e técnicas (como alcançam esses objetivos). O Microsoft Sentinel mapeia alertas para o ATT&CK.",tip:"ATT&CK é a linguagem comum entre defensores para descrever e analisar ataques — substitui descrições vagas por técnicas específicas e referenciadas."},

  {id:"sc149",domain:"Soluções de Segurança",difficulty:"basico",question:"O que é o Microsoft Entra ID Protection Risky Users report?",options:["Um relatório de usuários com comportamento de risco financeiro","Um relatório que lista usuários sinalizados como comprometidos ou em risco, com base em detecções de anomalias de comportamento e credenciais vazadas","Um relatório de usuários com muitas tentativas de login falhas","Um relatório de usuários com permissões excessivas"],correct:1,explanation:"O relatório Risky Users do Entra ID Protection lista usuários cujas contas apresentam indicadores de comprometimento: credenciais encontradas em vazamentos (leaked credentials), logins de anonimizadores, comportamento atípico. Administradores podem investigar e forçar mudança de senha ou bloquear o usuário.",tip:"O ID Protection também gera relatórios de Risky Sign-ins para eventos de login suspeitos específicos."},

  {id:"sc150",domain:"Conformidade Microsoft",difficulty:"intermediario",question:"O que é o Azure Trusted Launch?",options:["Um processo de validação de parceiros Microsoft","Uma funcionalidade que protege VMs contra rootkits e ataques de firmware com Secure Boot, vTPM e monitoramento de integridade","Um serviço de lançamento confiável de aplicativos no Azure","Uma certificação de segurança para aplicativos publicados na Azure Marketplace"],correct:1,explanation:"O Azure Trusted Launch protege VMs de segunda geração contra técnicas de ataque sofisticadas como rootkits de bootloader e malware de firmware. Usa Secure Boot (verifica integridade do boot), vTPM (Trusted Platform Module virtual) e Monitored Boot para garantir que a VM inicializa em estado conhecido e seguro.",tip:"Trusted Launch adiciona uma camada de segurança abaixo do sistema operacional, protegendo o processo de boot em si."},

  {id:"sc151",domain:"Conceitos de Segurança",difficulty:"basico",question:"O que é hardening de sistema?",options:["Aumentar a capacidade de hardware de servidores","O processo de reduzir a superfície de ataque de um sistema removendo funcionalidades desnecessárias, aplicando patches e configurando controles de segurança rigorosos","Um processo de backup reforçado de sistemas críticos","A instalação de hardware de segurança físico em servidores"],correct:1,explanation:"Hardening reduz a superfície de ataque de sistemas: removendo serviços e software desnecessários, desabilitando contas padrão, aplicando patches de segurança, configurando permissões mínimas, habilitando logging e usando configurações de segurança reforçadas. O Center for Internet Security (CIS) publica benchmarks de hardening para Windows, Linux e outros sistemas.",tip:"O Microsoft Defender for Cloud fornece recomendações de hardening baseadas em benchmarks como CIS e NIST."},

  {id:"sc152",domain:"Soluções de Segurança",difficulty:"intermediario",question:"O que é o Microsoft Defender for Cloud DevSecOps?",options:["Uma metodologia de desenvolvimento seguro de aplicativos","Uma solução que integra segurança no pipeline de CI/CD, verificando código, configurações de IaC e imagens de container por vulnerabilidades antes do deploy","Um sistema de segurança para ambientes de desenvolvimento","Uma ferramenta de conformidade para equipes DevOps"],correct:1,explanation:"O Defender for Cloud DevSecOps (via integrações com GitHub, Azure DevOps e GitLab) verifica automaticamente pull requests em busca de: vulnerabilidades em código, segredos expostos (senhas, chaves API), configurações incorretas em IaC (Terraform, ARM), e vulnerabilidades em imagens de container. Segurança integrada ao fluxo de desenvolvimento.",tip:"'Shift left' em segurança significa detectar e corrigir vulnerabilidades no desenvolvimento, não em produção — muito mais barato e eficaz."},

  {id:"sc153",domain:"Identidade e Acesso",difficulty:"avancado",question:"O que é o protocolo SCIM (System for Cross-domain Identity Management)?",options:["Um protocolo de segurança para comunicações entre domínios","Um padrão aberto para automatizar o provisionamento e desprovisionamento de usuários entre um provedor de identidade e aplicativos SaaS","Um sistema de gerenciamento de certificados entre domínios","Um protocolo de sincronização de senhas entre sistemas"],correct:1,explanation:"SCIM é um padrão aberto (RFC 7642-7644) que define um schema e API para automatizar o provisionamento de identidades entre sistemas. Permite que o Microsoft Entra ID provisione e desprovisione automaticamente usuários em aplicativos SaaS que suportam SCIM (como Salesforce, ServiceNow, Slack), eliminando provisionamento manual.",tip:"SCIM + SSO via SAML/OIDC = integração completa de identidade com aplicativos SaaS, do acesso ao provisionamento."},

  {id:"sc154",domain:"Conceitos de Segurança",difficulty:"basico",question:"O que é um ataque de dicionário (dictionary attack)?",options:["Um ataque que usa termos técnicos para confundir sistemas de segurança","Uma variante de ataque de força bruta que testa senhas comuns e palavras de dicionário antes de tentar combinações aleatórias","Um ataque que traduz mensagens criptografadas usando dicionários linguísticos","Um ataque que usa documentação técnica para encontrar vulnerabilidades"],correct:1,explanation:"Um ataque de dicionário é uma forma de força bruta que usa listas de senhas comuns, palavras do dicionário e variações (substituindo 'a' por '@', adicionando números ao final). É mais eficiente que força bruta pura porque a maioria das pessoas usa senhas baseadas em palavras reconhecíveis.",tip:"Senhas longas e randômicas (ou frases longas) e MFA são as melhores proteções contra ataques de dicionário."},

  {id:"sc155",domain:"Soluções de Segurança",difficulty:"basico",question:"O que é o Microsoft Defender for Cloud recomendações de segurança?",options:["Recomendações de produtos Microsoft para compra","Sugestões priorizadas e acionáveis para melhorar a postura de segurança dos recursos Azure, com passos detalhados de remediação","Recomendações de configuração de performance de recursos","Alertas de segurança sobre ameaças detectadas"],correct:1,explanation:"O Defender for Cloud analisa continuamente a configuração dos recursos e gera recomendações de segurança priorizadas. Cada recomendação inclui: severidade, impacto no Secure Score se implementada, recursos afetados e passos detalhados de remediação. Algumas recomendações podem ser remediadas automaticamente com um clique.",tip:"Recomendações são agrupadas por controles de segurança — implementar um controle pode impactar múltiplas recomendações simultaneamente."},

  {id:"sc156",domain:"Conformidade Microsoft",difficulty:"intermediario",question:"O que é o Microsoft Purview Compliance Score?",options:["Uma pontuação de crédito para compliance officers","Uma pontuação que mede o progresso da organização na implementação de controles de conformidade mapeados para regulamentos relevantes","Uma avaliação de fornecedores quanto à conformidade","Uma métrica de performance do departamento jurídico"],correct:1,explanation:"O Compliance Score no Microsoft Purview Compliance Manager quantifica a postura de conformidade da organização (0 a 1000+). É calculado com base na conclusão de ações de aperfeiçoamento. As ações são mapeadas para controles de múltiplos regulamentos (GDPR, ISO 27001, NIST, etc.) e categorizadas entre responsabilidade da Microsoft e do cliente.",tip:"Uma pontuação maior indica implementação mais completa dos controles — mas conformidade completa depende do contexto regulatório específico."},

  {id:"sc157",domain:"Identidade e Acesso",difficulty:"basico",question:"O que é Kerberos e sua relação com o Active Directory?",options:["Um antivírus para proteção do Active Directory","Um protocolo de autenticação de rede que o Active Directory usa para autenticar usuários e serviços no domínio Windows","Um tipo de conta de serviço no Active Directory","Um algoritmo de criptografia usado pelo Active Directory"],correct:1,explanation:"Kerberos é o protocolo de autenticação padrão em ambientes Windows Active Directory. Usa um sistema de tickets: o DC emite tickets que permitem que usuários se autentiquem em serviços sem re-inserir credenciais (SSO). Ataques como Pass-the-Ticket e Golden Ticket exploram vulnerabilidades no Kerberos para comprometer ambientes AD.",tip:"O Microsoft Defender for Identity detecta ataques específicos ao Kerberos, como Pass-the-Ticket e Golden/Silver Ticket."},

  {id:"sc158",domain:"Soluções de Segurança",difficulty:"intermediario",question:"O que são Workbooks no Microsoft Sentinel?",options:["Cadernos de anotações para analistas de segurança","Dashboards interativos e personalizáveis no Sentinel para visualização de dados de segurança, baseados no Azure Monitor Workbooks","Manuais de resposta a incidentes do Sentinel","Livros de regras de detecção do Sentinel"],correct:1,explanation:"Workbooks no Microsoft Sentinel são dashboards interativos que visualizam dados de segurança coletados. Permitem criar gráficos, tabelas e visualizações de dados de log usando KQL. A galeria do Sentinel inclui dezenas de workbooks pré-construídos para produtos populares (Office 365, Azure AD, Defender for Endpoint).",tip:"Workbooks são para visualização e análise; Playbooks são para automação de resposta — ferramentas complementares no Sentinel."},

  {id:"sc159",domain:"Conceitos de Conformidade",difficulty:"avancado",question:"O que é o princípio de minimização de dados no GDPR?",options:["Minimizar o custo de armazenamento de dados","O princípio que determina que apenas dados estritamente necessários para a finalidade especificada devem ser coletados e processados","Minimizar o número de pessoas que acessam dados","Reduzir o período de retenção de dados ao mínimo legal"],correct:1,explanation:"A minimização de dados (Artigo 5(1)(c) do GDPR) exige que apenas dados 'adequados, relevantes e limitados ao necessário' para a finalidade declarada sejam coletados. Organizações não devem coletar dados 'por precaução' ou para fins futuros indefinidos. Complementa o princípio de limitação de finalidade.",tip:"Privacy by Design implementa minimização de dados desde o início: sistemas são desenhados para coletar apenas o necessário."},

  {id:"sc160",domain:"Soluções de Segurança",difficulty:"basico",question:"O que é o Microsoft Security Response Center (MSRC)?",options:["Um centro de suporte técnico de segurança para usuários domésticos","A equipe da Microsoft responsável por receber e responder a relatórios de vulnerabilidades em produtos Microsoft, coordenando divulgação e patches","Um centro de operações de segurança gerenciado pela Microsoft","Uma certificadora de produtos de segurança Microsoft"],correct:1,explanation:"O MSRC gerencia o processo de resposta a vulnerabilidades da Microsoft. Recebe relatórios de pesquisadores (divulgação responsável), investiga, desenvolve e distribui patches. Opera o programa Microsoft Bug Bounty, pagando recompensas por vulnerabilidades reportadas. Comunica vulnerabilidades através de Security Advisories e Patch Tuesday.",tip:"Patch Tuesday é a segunda terça-feira de cada mês, quando a Microsoft lança atualizações de segurança regulares."},

  {id:"sc161",domain:"Identidade e Acesso",difficulty:"intermediario",question:"O que são políticas de senha do Microsoft Entra ID?",options:["Regras que determinam quais caracteres são proibidos em senhas","Configurações que definem requisitos de complexidade, comprimento e expiração de senhas, além de proteção contra senhas banidas","Políticas que determinam com que frequência senhas devem ser compartilhadas","Configurações de bloqueio de conta após tentativas falhas"],correct:1,explanation:"As políticas de senha do Entra ID incluem: requisitos de comprimento e complexidade, verificação contra lista de senhas banidas (incluindo variações de 'Microsoft' e 'password'), Smart Lockout (bloqueia conta após tentativas falhas protegendo contra força bruta) e opcionalmente, integração com lista de senhas proibidas personalizada.",tip:"A Microsoft recomenda senhas longas (14+ caracteres) sem expiração obrigatória, em vez de senhas complexas curtas que expiram frequentemente."},

  {id:"sc162",domain:"Conceitos de Segurança",difficulty:"basico",question:"O que é um certificado SSL/TLS?",options:["Um certificado de segurança física para data centers","Um certificado digital que estabelece conexões criptografadas entre navegadores e servidores, garantindo confidencialidade e autenticidade","Uma licença de software de segurança","Um certificado de conformidade para sites de e-commerce"],correct:1,explanation:"Certificados SSL/TLS são certificados digitais que habilitam HTTPS em sites e serviços. Garantem: autenticidade (o site é quem diz ser), confidencialidade (dados são criptografados em trânsito) e integridade (dados não foram alterados). O Azure Key Vault pode gerenciar certificados TLS automaticamente com renovação automática.",tip:"TLS 1.2 e 1.3 são as versões modernas e seguras; SSL e TLS 1.0/1.1 são considerados inseguros e depreciados."},

  {id:"sc163",domain:"Soluções de Segurança",difficulty:"intermediario",question:"O que é o Azure Application Gateway?",options:["Um gateway para integração de aplicativos legados com Azure","Um balanceador de carga de camada 7 (HTTP/HTTPS) que inclui WAF, terminação SSL, roteamento baseado em URL e proteção contra ataques web","Um gateway de API para publicação de microsserviços","Um sistema de gerenciamento de aplicativos empresariais"],correct:1,explanation:"O Azure Application Gateway é um balanceador de carga de aplicação web (Layer 7) com recursos como: terminação SSL/TLS, roteamento baseado em URL/host, afinidade de sessão, redirecionamentos e WAF integrado. O WAF protege aplicativos contra ataques OWASP Top 10 como SQL Injection e XSS.",tip:"Application Gateway é melhor para tráfego regional; Azure Front Door é preferível para presença global com WAF."},

  {id:"sc164",domain:"Conformidade Microsoft",difficulty:"basico",question:"O que é o Microsoft Privacy Dashboard?",options:["Um dashboard de análise de dados de privacidade para desenvolvedores","Um portal onde usuários podem visualizar, baixar e gerenciar dados pessoais associados à sua conta Microsoft","Um sistema de relatórios de privacidade para administradores corporativos","Uma ferramenta de conformidade de privacidade para auditores"],correct:1,explanation:"O Microsoft Privacy Dashboard (privacy.microsoft.com) permite que usuários visualizem atividades associadas à sua conta Microsoft (pesquisas, histórico de navegação Edge, uso de Cortana, localização), baixem seus dados e gerenciem preferências de privacidade. Implementa o direito de acesso e portabilidade de dados do GDPR.",tip:"O Privacy Dashboard demonstra o compromisso da Microsoft com transparência e controle do usuário sobre dados pessoais."},

  {id:"sc165",domain:"Identidade e Acesso",difficulty:"avancado",question:"O que é o Global Secure Access no Microsoft Entra?",options:["Um VPN global gerenciado pela Microsoft","Um Security Service Edge (SSE) que combina Acesso Privado (substituindo VPN) e Acesso à Internet (substituindo Secure Web Gateway) com identidade do Entra como plano de controle","Um sistema de acesso global para administradores Microsoft","Uma solução de autenticação para usuários de múltiplos países"],correct:1,explanation:"O Microsoft Entra Global Secure Access é a solução SSE da Microsoft, combinando: Entra Private Access (acesso Zero Trust a aplicativos privados sem VPN) e Entra Internet Access (secure web gateway para controle de acesso à internet). Usa identidade do Entra ID como plano de controle, integrando-se com Acesso Condicional.",tip:"Global Secure Access é parte da estratégia SASE (Secure Access Service Edge) da Microsoft — rede e segurança convergidas na nuvem."},

  {id:"sc166",domain:"Conceitos de Segurança",difficulty:"intermediario",question:"O que é threat modeling (modelagem de ameaças)?",options:["A criação de modelos 3D de infraestrutura de segurança","Um processo estruturado para identificar, quantificar e endereçar riscos de segurança em sistemas durante a fase de design","Um modelo preditivo de ataques futuros baseado em ML","Uma técnica de simulação de ataques em ambiente controlado"],correct:1,explanation:"A modelagem de ameaças é um processo proativo realizado durante o design de sistemas para identificar ameaças potenciais, vulnerabilidades e contramedidas. Usa frameworks como STRIDE, PASTA ou LINDDUN. O SDL (Security Development Lifecycle) da Microsoft exige modelagem de ameaças para produtos de segurança.",tip:"A modelagem de ameaças no design é muito mais barata que corrigir vulnerabilidades em produção."},

  {id:"sc167",domain:"Soluções de Segurança",difficulty:"basico",question:"O que é o Microsoft Intune endpoint compliance?",options:["Um relatório de conformidade de licenças de software","Políticas que definem os requisitos que dispositivos devem atender para serem considerados 'conformes' e poderem acessar recursos corporativos","Um sistema de conformidade de configurações de rede","Uma auditoria de conformidade de aplicativos instalados"],correct:1,explanation:"As políticas de conformidade do Intune definem condições que dispositivos devem atender: versão mínima do SO, criptografia de disco habilitada (BitLocker), antivírus ativo e atualizado, PIN configurado, jailbreak/root não detectado. Dispositivos não conformes são marcados e o Acesso Condicional do Entra ID pode bloquear seu acesso a recursos corporativos.",tip:"Conformidade do Intune + Acesso Condicional = verificação de dispositivo no modelo Zero Trust."},

  {id:"sc168",domain:"Conformidade Microsoft",difficulty:"intermediario",question:"O que são alertas analíticos no Microsoft Purview Communication Compliance?",options:["Alertas de desempenho de sistemas de comunicação","Detecções automáticas de conteúdo que viola políticas, como linguagem ofensiva, informações confidenciais compartilhadas inadequadamente ou possível insider trading em comunicações corporativas","Alertas de volume excessivo de emails","Notificações de falha em comunicações de TI"],correct:1,explanation:"O Communication Compliance usa classificadores treináveis e palavras-chave para detectar automaticamente violações de políticas em emails, Teams e Yammer. Gera alertas que revisores designados investigam. Inclui detecção de linguagem de ameaças, assédio, compartilhamento de informações regulatórias sensíveis e outros riscos de comunicação.",tip:"Revisores veem apenas o conteúdo relevante para sua função de revisão — o acesso é controlado para garantir privacidade."},

  {id:"sc169",domain:"Identidade e Acesso",difficulty:"basico",question:"O que é um grupo dinâmico no Microsoft Entra ID?",options:["Um grupo que muda sua composição manualmente com frequência","Um grupo cujos membros são adicionados e removidos automaticamente com base em atributos de usuário como departamento, cargo ou localização","Um grupo de segurança que responde dinamicamente a ameaças","Um grupo temporário criado para projetos específicos"],correct:1,explanation:"Grupos dinâmicos no Entra ID adicionam e removem membros automaticamente baseando-se em regras de atributos. Por exemplo: 'todos os usuários do departamento Financeiro' ou 'todos os usuários com cargo de Gerente'. Quando um atributo muda, a associação ao grupo é atualizada automaticamente, eliminando gerenciamento manual de membros.",tip:"Grupos dinâmicos são ideais para aplicar políticas automaticamente conforme usuários mudam de função ou departamento."},

  {id:"sc170",domain:"Conceitos de Segurança",difficulty:"basico",question:"O que é um ataque de watering hole?",options:["Um ataque que inunda sistemas com dados inválidos","Um ataque que compromete sites frequentemente visitados pelo público-alvo, infecting os visitantes com malware","Um ataque que explora vulnerabilidades em sistemas de armazenamento de água","Um ataque de phishing direcionado a executivos (C-suite)"],correct:1,explanation:"Um ataque de watering hole compromete um site legítimo frequentado pelo público-alvo (como um site de associação profissional ou fornecedor). Quando membros do grupo alvo visitam o site comprometido, seu dispositivo é infectado. É mais eficaz que phishing porque explora sites que a vítima já confia.",tip:"APTs usam ataques watering hole para alcançar alvos difíceis — como funcionários de organizações governamentais que não abrem emails suspeitos."},

  {id:"sc171",domain:"Soluções de Segurança",difficulty:"intermediario",question:"O que é o Azure Policy Regulatory Compliance?",options:["Uma ferramenta para garantir que o Azure esteja em conformidade com regulamentações governamentais","Uma funcionalidade que avalia o nível de conformidade dos recursos Azure com regulamentos específicos como PCI DSS, ISO 27001 e HIPAA, baseando-se em políticas predefinidas","Um serviço de consultoria para conformidade regulatória","Um sistema de relatórios de auditoria para órgãos reguladores"],correct:1,explanation:"O Azure Policy Regulatory Compliance mapeia políticas do Azure para controles de regulamentos conhecidos (NIST SP 800-53, PCI DSS 3.2.1, ISO 27001, HIPAA, CIS). Fornece uma visão consolidada do percentual de conformidade para cada regulamento, identificando controles não implementados e recursos não conformes.",tip:"Esta funcionalidade simplifica a preparação para auditorias ao fornecer evidências de conformidade diretamente do Azure."},

  {id:"sc172",domain:"Identidade e Acesso",difficulty:"intermediario",question:"O que é o Passwordless Phone Sign-in no Microsoft Authenticator?",options:["Login usando o número de telefone como nome de usuário","Uma funcionalidade que permite fazer login em contas Microsoft e corporativas usando apenas o aplicativo Authenticator no smartphone, sem digitar senha","Um sistema de autenticação via SMS sem senha","Login usando reconhecimento de voz no aplicativo"],correct:1,explanation:"O Passwordless Phone Sign-in transforma o smartphone em um fator de autenticação forte. O usuário insere seu nome de usuário, recebe uma notificação no Authenticator, confirma um número exibido na tela de login com biometria ou PIN do dispositivo. Elimina a senha completamente, sendo resistente a phishing.",tip:"Combina 'algo que você tem' (telefone) + 'algo que você é' (biometria) = dois fatores sem senha."},

  {id:"sc173",domain:"Conceitos de Conformidade",difficulty:"basico",question:"O que é um DPO (Data Protection Officer)?",options:["Um oficial de segurança de dados de TI","Um papel exigido pelo GDPR para certas organizações, responsável por supervisionar o programa de proteção de dados e ser ponto de contato com autoridades regulatórias","Um tipo de software de proteção de dados","Um consultor externo de conformidade com GDPR"],correct:1,explanation:"O DPO (Responsável pela Proteção de Dados) é exigido pelo GDPR para organizações que: processam dados em larga escala, processam categorias especiais de dados (saúde, biometria) ou são autoridades públicas. O DPO supervisiona conformidade com GDPR, treinamento de funcionários e é o ponto de contato para autoridades de proteção de dados.",tip:"Na Microsoft, o Chief Privacy Officer exerce funções similares ao DPO para dados de clientes."},

  {id:"sc174",domain:"Soluções de Segurança",difficulty:"avancado",question:"O que é o Microsoft Defender for Cloud multicloud?",options:["Uma solução de segurança exclusiva para múltiplas regiões Azure","Uma plataforma que estende proteção de segurança e conformidade do Defender for Cloud para workloads em AWS e Google Cloud Platform, além do Azure","Um sistema de backup multicloud","Uma solução de monitoramento para ambientes multicloud"],correct:1,explanation:"O Defender for Cloud é verdadeiramente multicloud: protege recursos em Azure, AWS e GCP de forma unificada. Descobre automaticamente recursos nessas nuvens, avalia sua postura de segurança, fornece recomendações específicas por plataforma e detecção de ameaças. O Secure Score agrega a postura de segurança de todas as nuvens.",tip:"O Defender for Cloud é a única solução nativa Microsoft que oferece CSPM (Cloud Security Posture Management) multicloud."},

  {id:"sc175",domain:"Conformidade Microsoft",difficulty:"basico",question:"O que é o Microsoft Purview Information Barriers?",options:["Barreiras físicas para proteção de informações confidenciais","Políticas que impedem comunicação e colaboração entre grupos específicos de usuários no Microsoft 365 para evitar conflitos de interesse","Um sistema de filtragem de informações para usuários externos","Controles de acesso para documentos classificados"],correct:1,explanation:"Information Barriers são políticas que restringem comunicação e colaboração entre segmentos de usuários no Microsoft Teams, SharePoint e OneDrive. Importantes em setores como serviços financeiros, onde regulamentos proíbem comunicação entre certas equipes (ex: investment banking e sales) para evitar insider trading.",tip:"Information Barriers implementam restrições regulatórias de comunicação diretamente nas ferramentas de colaboração Microsoft 365."},

  {id:"sc176",domain:"Identidade e Acesso",difficulty:"intermediario",question:"O que é o Microsoft Entra ID Governance?",options:["A governança interna do serviço Entra ID pela Microsoft","Um conjunto de capacidades para gerenciar o ciclo de vida de identidades e acessos, garantindo que as pessoas certas tenham o acesso certo pelo tempo necessário","Um sistema de governança de TI baseado em identidades","Um framework de políticas para gestão de usuários"],correct:1,explanation:"O Microsoft Entra ID Governance ajuda organizações a equilibrar segurança e produtividade: pessoas precisam de acesso para trabalhar, mas o acesso deve ser controlado e revisado. Inclui: Entitlement Management (ciclo de vida de acesso), Access Reviews (revisão periódica), PIM (acesso privilegiado JIT) e Lifecycle Workflows (automatização de onboarding/offboarding).",tip:"ID Governance resolve o desafio de manter o princípio do menor privilégio ao longo do tempo conforme as funções das pessoas mudam."},

  {id:"sc177",domain:"Conceitos de Segurança",difficulty:"basico",question:"O que é um patch de segurança?",options:["Um adesivo de identificação em servidores físicos","Uma atualização de software que corrige vulnerabilidades de segurança conhecidas em sistemas operacionais e aplicativos","Um script de verificação de segurança automatizado","Uma atualização de hardware para sistemas antigos"],correct:1,explanation:"Patches de segurança são atualizações que corrigem vulnerabilidades descobertas em software. A Microsoft lança patches regulares no Patch Tuesday e patches de emergência (out-of-band) para vulnerabilidades críticas. O gerenciamento de patches (garantir que sistemas estejam atualizados) é fundamental para reduzir a superfície de ataque.",tip:"O Microsoft Defender Vulnerability Management rastreia patches faltantes e prioriza-os por criticidade e exploração ativa."},

  {id:"sc178",domain:"Soluções de Segurança",difficulty:"intermediario",question:"O que é o Microsoft Defender for Business?",options:["Uma versão do Defender para usuários domésticos","Uma solução de segurança de endpoint simplificada projetada para pequenas e médias empresas (até 300 usuários), com proteção de endpoint de nível empresarial","Um antivírus para dispositivos de negócios pessoais","Uma ferramenta de conformidade para pequenas empresas"],correct:1,explanation:"O Microsoft Defender for Business oferece proteção de endpoint de nível empresarial adaptada para PMEs (até 300 usuários). Inclui: antivírus de próxima geração, proteção baseada em comportamento, resposta a incidentes automatizada e recomendações de configuração simplificadas. Disponível standalone ou incluído no Microsoft 365 Business Premium.",tip:"Defender for Business torna proteção Enterprise acessível para PMEs sem precisar de um SOC dedicado."},

  {id:"sc179",domain:"Conformidade Microsoft",difficulty:"avancado",question:"O que é o Microsoft Purview Customer Key?",options:["Uma chave de ativação de produtos Microsoft para clientes","Uma solução que permite aos clientes controlar as chaves raiz de criptografia usadas pela Microsoft para proteger seus dados em repouso no Microsoft 365","Um sistema de autenticação de clientes Microsoft","Uma chave de API para acesso aos serviços Microsoft Purview"],correct:1,explanation:"O Customer Key permite que clientes forneçam e controlem as chaves de criptografia raiz usadas para criptografar dados em repouso no Exchange Online, SharePoint Online, Teams e outros serviços Microsoft 365. As chaves são armazenadas no Azure Key Vault do cliente. Se o cliente revogar as chaves, a Microsoft não pode acessar os dados.",tip:"Customer Key é mais restritivo que CMK — aplica-se a dados em repouso nos serviços Microsoft 365, não apenas Azure Storage."},

  {id:"sc180",domain:"Identidade e Acesso",difficulty:"basico",question:"O que é o Windows Hello for Business?",options:["Um recurso de boas-vindas personalizado no Windows","Um sistema de autenticação sem senha para dispositivos Windows usando biometria (facial, impressão digital) ou PIN vinculado ao dispositivo, com criptografia de chave pública","Um assistente virtual do Windows para configuração de negócios","Um sistema de login automático para ambientes corporativos"],correct:1,explanation:"O Windows Hello for Business substitui senhas por autenticação forte usando biometria (reconhecimento facial, leitor de impressão digital) ou PIN vinculado ao dispositivo específico. Usa criptografia de chave pública — a chave privada nunca sai do dispositivo. Integra com Microsoft Entra ID para SSO corporativo.",tip:"Windows Hello for Business é uma implementação FIDO2 que oferece autenticação passwordless de nível empresarial."},

  {id:"sc181",domain:"Conceitos de Segurança",difficulty:"intermediario",question:"O que é criptografia de ponta a ponta (end-to-end encryption)?",options:["Criptografia do início ao fim de um processo de TI","Criptografia onde apenas o remetente e destinatário podem ler as mensagens — nem o provedor de serviço pode acessar o conteúdo","Criptografia de dados do endpoint ao datacenter","Criptografia que abrange todos os endpoints de uma organização"],correct:1,explanation:"Na criptografia E2E, as mensagens são criptografadas no dispositivo do remetente e só podem ser descriptografadas pelo dispositivo do destinatário. O serviço intermediário (provedor de mensagens, operadora) não tem acesso ao conteúdo. Microsoft Teams oferece criptografia E2E para chamadas 1:1.",tip:"E2E difere de criptografia em trânsito (TLS) — com TLS, o servidor pode ver o conteúdo descriptografado; com E2E, não pode."},

  {id:"sc182",domain:"Soluções de Segurança",difficulty:"basico",question:"O que é o Microsoft Defender for Cloud Security Alerts?",options:["Alertas de cobrança quando custos de segurança excedem o orçamento","Notificações em tempo real sobre ameaças detectadas nos recursos Azure, com informações sobre a ameaça, recursos afetados e etapas recomendadas de remediação","Alertas de performance de sistemas de segurança","Notificações sobre atualizações de políticas de segurança"],correct:1,explanation:"Os Security Alerts do Defender for Cloud são notificações geradas quando atividade suspeita ou maliciosa é detectada em recursos Azure. Incluem: severidade, descrição da ameaça, táticas MITRE ATT&CK associadas, recursos afetados e etapas de investigação e remediação. Podem ser exportados para o Sentinel para correlação.",tip:"Alertas de alta severidade requerem atenção imediata; use Secure Score para priorizar melhorias preventivas."},

  {id:"sc183",domain:"Conformidade Microsoft",difficulty:"intermediario",question:"O que é o conceito de 'Privacy by Default' (Privacidade como Padrão)?",options:["Configurações de privacidade que não podem ser alteradas pelos usuários","O princípio de que as configurações padrão de qualquer sistema devem oferecer máxima proteção de privacidade, sem que usuários precisem fazer nada","A configuração padrão de privacidade nos produtos Microsoft","Privacidade implementada automaticamente sem intervenção humana"],correct:1,explanation:"Privacy by Default exige que as configurações padrão de sistemas e aplicativos sejam as mais protetoras de privacidade possível. Usuários não precisam 'optar por sair' de coleta de dados — eles precisam 'optar por entrar' se quiserem compartilhar mais. É um requisito do GDPR e complementa o Privacy by Design.",tip:"Privacy by Design (no projeto) + Privacy by Default (nas configurações padrão) = abordagem holística de privacidade desde o início."},

  {id:"sc184",domain:"Identidade e Acesso",difficulty:"avancado",question:"O que é o Microsoft Entra Workload Identity?",options:["Identidades para funcionários que trabalham remotamente","Identidades para aplicativos, serviços e pipelines CI/CD — incluindo Service Principals e Managed Identities — com recursos de gerenciamento e segurança específicos para workloads","Um sistema de identificação de cargas de trabalho no Azure","Identidades corporativas para estações de trabalho de alta performance"],correct:1,explanation:"O Microsoft Entra Workload Identity gerencia identidades para workloads não-humanos (aplicativos, serviços, pipelines). Oferece: Workload Identity Federation (aplicativos externos se autenticam sem segredos, usando tokens de identidade de plataformas como GitHub, AWS ou Kubernetes), Managed Identities e Service Principals com recursos de governança.",tip:"Workload Identity Federation elimina segredos armazenados em pipelines CI/CD — substituídos por tokens de curta duração."},

  {id:"sc185",domain:"Conceitos de Segurança",difficulty:"basico",question:"O que é um plano de resposta a incidentes?",options:["Um plano de contingência para falhas de hardware","Um documento que define procedimentos para detectar, responder e recuperar de incidentes de segurança, minimizando seu impacto","Um plano de treinamento de segurança para funcionários","Um roteiro de implementação de controles de segurança"],correct:1,explanation:"Um Plano de Resposta a Incidentes define como a organização responderá a eventos de segurança. Geralmente segue fases: Preparação, Identificação, Contenção, Erradicação, Recuperação e Lições Aprendidas (PICERL ou variações). Define papéis, responsabilidades, canais de comunicação e procedimentos para diferentes tipos de incidentes.",tip:"O Microsoft Sentinel automatiza partes do processo de resposta a incidentes via playbooks SOAR."},

  {id:"sc186",domain:"Soluções de Segurança",difficulty:"intermediario",question:"O que é o Microsoft Purview Insider Risk Management Adaptive Protection?",options:["Uma proteção adaptativa contra malware interno","Uma funcionalidade que ajusta automaticamente o nível de proteção DLP e outras políticas com base no nível de risco individual de cada usuário detectado pelo Insider Risk Management","Uma proteção que se adapta a novos tipos de risco interno","Um sistema adaptativo de treinamento de segurança para usuários de risco"],correct:1,explanation:"A Adaptive Protection integra o Insider Risk Management com DLP e outros controles. Usuários identificados como de alto risco pelo Insider Risk Management recebem automaticamente controles DLP mais restritivos (ex: bloqueio de download para USB) sem intervenção manual. Controles relaxam quando o risco diminui.",tip:"Adaptive Protection é um exemplo prático de automação de segurança baseada em risco contextual — a proteção se ajusta ao comportamento real do usuário."},

  {id:"sc187",domain:"Identidade e Acesso",difficulty:"basico",question:"O que é o Microsoft Entra ID Sign-in Logs?",options:["Um sistema de log de tentativas de invasão","Registros de todas as tentativas de autenticação no tenant Entra ID, incluindo usuário, aplicativo, localização, resultado e detalhes de risco","Um log de atividades de administradores do Entra ID","Um registro de alterações em políticas de acesso"],correct:1,explanation:"Os Sign-in Logs do Entra ID registram todas as tentativas de autenticação no tenant: data/hora, usuário, aplicativo acessado, IP de origem, localização, resultado (sucesso/falha), método de autenticação usado e nível de risco detectado. Essenciais para investigações de segurança, detecção de compromissos e auditoria de conformidade.",tip:"Sign-in Logs ficam disponíveis por 30 dias no Entra ID P1/P2; para retenção maior, exporte para Log Analytics/Sentinel."},

  {id:"sc188",domain:"Conceitos de Segurança",difficulty:"intermediario",question:"O que é criptografia homomórfica?",options:["Criptografia que usa algoritmos similares em todos os sistemas","Uma forma avançada de criptografia que permite realizar operações em dados criptografados sem precisar descriptografá-los, mantendo a privacidade durante o processamento","Criptografia que mantém a mesma chave em múltiplos sistemas","Um método de criptografia baseado em padrões de homologia"],correct:1,explanation:"Criptografia homomórfica permite computações em dados criptografados, com resultados que, quando descriptografados, correspondem às operações realizadas em texto claro. Permite que dados sensíveis sejam processados por terceiros (como serviços de nuvem) sem nunca serem descriptografados. Ainda computacionalmente intensiva, mas com aplicações crescentes em privacidade.",tip:"Embora avançada, é relevante para o futuro da computação confidencial — área em que a Microsoft investe com Azure Confidential Computing."},

  {id:"sc189",domain:"Soluções de Segurança",difficulty:"basico",question:"O que é o Microsoft Defender for Cloud enhanced security features?",options:["Recursos premium do Microsoft Defender disponíveis com subscrição extra","Planos pagos do Defender for Cloud que habilitam proteção avançada de workloads específicos como VMs, SQL, Storage, Kubernetes, App Service e outros, além do CSPM gratuito","Recursos de segurança avançada exclusivos para clientes Enterprise","Funcionalidades adicionais de segurança disponíveis apenas para organizações governamentais"],correct:1,explanation:"O Defender for Cloud oferece um nível básico gratuito (CSPM, recomendações de segurança, Secure Score). Os planos pagos habilitam proteção de workloads específicos: Defender for Servers, Defender for SQL, Defender for Storage, Defender for Containers, etc. Cada plano adiciona detecção de ameaças e proteção específica para o tipo de workload.",tip:"O Defender for Cloud Plans são habilitados por assinatura Azure e tipo de workload — você paga apenas pelo que precisa proteger."},

  {id:"sc190",domain:"Conformidade Microsoft",difficulty:"intermediario",question:"O que é o Azure Lighthouse?",options:["Um serviço de monitoramento de infraestrutura Azure","Uma solução que permite provedores de serviços gerenciados (MSPs) gerenciar múltiplos tenants de clientes com maior automação, escalabilidade e governança","Um sistema de iluminação inteligente gerenciado pelo Azure","Um portal de visibilidade de serviços Azure para clientes"],correct:1,explanation:"O Azure Lighthouse permite que MSPs e empresas com múltiplos tenants gerenciem recursos de clientes diretamente do seu próprio tenant Azure, sem precisar fazer login em cada tenant separadamente. Oferece visibilidade unificada, controle de acesso granular com RBAC delegado e auditoria completa das ações realizadas.",tip:"O Lighthouse usa Azure Delegated Resource Management para permitir gestão cross-tenant sem compartilhar credenciais."},

  {id:"sc191",domain:"Identidade e Acesso",difficulty:"intermediario",question:"O que são Lifecycle Workflows no Microsoft Entra ID Governance?",options:["Fluxos de trabalho para gerenciamento de ciclo de vida de aplicativos","Automações que executam tarefas relacionadas ao ingresso, movimentação e saída de funcionários, como configurar acesso no primeiro dia ou remover acesso ao sair","Fluxos de trabalho para aprovação de mudanças de identidade","Processos automatizados de renovação de licenças de usuário"],correct:1,explanation:"Os Lifecycle Workflows automatizam tarefas de RH/TI ao longo do ciclo de vida de um funcionário. Exemplos: 'Joiner' (novo funcionário: enviar email de boas-vindas, adicionar a grupos, provisionar acesso), 'Mover' (mudança de função: ajustar acessos), 'Leaver' (saída: desabilitar conta, remover grupos, notificar gerente). Integra com HR systems.",tip:"Lifecycle Workflows reduzem erros de provisionamento e aceleram onboarding/offboarding, garantindo que o acesso seja gerenciado consistentemente."},

  {id:"sc192",domain:"Conceitos de Segurança",difficulty:"basico",question:"O que é um Security Operations Center (SOC)?",options:["Um centro de desenvolvimento de software de segurança","Uma unidade centralizada que monitora, detecta, analisa e responde a incidentes de cibersegurança 24/7","Um centro de certificação de profissionais de segurança","Um servidor central de segurança em data centers"],correct:1,explanation:"Um SOC é uma equipe dedicada que monitora continuamente a postura de segurança de uma organização. Usa tecnologias como SIEM (Microsoft Sentinel), EDR (Defender for Endpoint) e outras ferramentas para detectar ameaças em tempo real, investigar alertas e coordenar resposta a incidentes. Pode ser interno ou terceirizado (MSSP).",tip:"O Microsoft Sentinel foi projetado para ser o SIEM/SOAR central de SOCs modernos, com suporte a automação via playbooks."},

  {id:"sc193",domain:"Soluções de Segurança",difficulty:"avancado",question:"O que é o Microsoft Defender XDR Unified RBAC?",options:["Um sistema unificado de relatórios do Defender XDR","Um modelo de controle de acesso unificado que gerencia permissões em todos os produtos do Defender XDR (Defender for Endpoint, Office 365, Identity, Cloud Apps) em um único lugar","Um sistema de backup de permissões dos produtos Defender","Uma funcionalidade de RBAC exclusiva para ambientes XDR"],correct:1,explanation:"O Defender XDR Unified RBAC permite gerenciar permissões de acesso para todos os produtos Microsoft Defender XDR em um único lugar no portal Microsoft Defender. Substitui os múltiplos portais e modelos de permissão separados de cada produto, simplificando a gestão de acesso para equipes de segurança.",tip:"Antes do Unified RBAC, cada produto Defender tinha seu próprio modelo de permissões — a unificação simplifica operações de SOC."},

  {id:"sc194",domain:"Conformidade Microsoft",difficulty:"basico",question:"O que é o Microsoft Purview Data Map?",options:["Um mapa geográfico de onde os dados Microsoft estão armazenados","Um componente do Microsoft Purview que cria um inventário automatizado de ativos de dados em toda a organização, mapeando fontes, classificações e linhagem de dados","Uma ferramenta de visualização de fluxo de dados","Um diagrama de arquitetura de dados corporativos"],correct:1,explanation:"O Data Map é o núcleo do Microsoft Purview governance, criando um mapa unificado dos ativos de dados da organização através de múltiplas fontes (Azure SQL, Blob Storage, Power BI, SAP, AWS S3, etc.). Usa scans automatizados para descobrir e classificar dados, gerando metadados ricos e mapeando a linhagem de dados.",tip:"O Data Map alimenta o Data Catalog com descoberta e classificação automatizada de dados."},

  {id:"sc195",domain:"Identidade e Acesso",difficulty:"basico",question:"O que é autenticação baseada em certificado (CBA) no Microsoft Entra ID?",options:["Autenticação que verifica certificados de conformidade do usuário","Uma forma de autenticação multifator que usa certificados de cliente X.509 (em smartcard ou dispositivo) como fator de autenticação forte, sem senha","Uma autenticação que valida certificados de treinamento profissional","Autenticação que usa certificados SSL do dispositivo do usuário"],correct:1,explanation:"A CBA (Certificate-based Authentication) permite que usuários se autentiquem no Entra ID usando certificados X.509 em smartcards (PIV/CAC) ou armazenados em dispositivos. É especialmente usada em organizações governamentais e setores regulados que exigem autenticação forte com smartcard. Elimina a senha e é resistente a phishing.",tip:"CBA é o método de autenticação exigido pelo governo americano (FICAM) e é suportado nativamente pelo Entra ID sem infra adicional."},

  {id:"sc196",domain:"Conceitos de Segurança",difficulty:"intermediario",question:"O que é um ataque de desvio de SSRF (Server-Side Request Forgery)?",options:["Um ataque de falsificação de identidade em servidor","Um ataque que força um servidor a fazer requisições para recursos internos ou externos não intencionais, explorando a posição confiável do servidor na rede","Um ataque que redireciona tráfego do servidor para um proxy malicioso","Um ataque de injeção em formulários de servidor"],correct:1,explanation:"SSRF permite que um atacante induza o servidor a fazer requisições HTTP para um destino arbitrário, explorando a confiança do servidor na rede interna. Pode ser usado para acessar metadados de instâncias de cloud (como credenciais IAM em AWS/Azure), varrer redes internas ou acessar serviços internos protegidos por firewall.",tip:"Em Azure, a proteção contra SSRF inclui Instance Metadata Service access control e validação rigorosa de URLs no lado do servidor."},

  {id:"sc197",domain:"Soluções de Segurança",difficulty:"basico",question:"O que é o Microsoft Secure Score para Dispositivos?",options:["Uma pontuação de performance de dispositivos corporativos","Uma métrica no Microsoft Defender XDR que avalia a configuração de segurança dos dispositivos gerenciados pelo Defender for Endpoint e Intune","Uma certificação de segurança para dispositivos aprovados para uso corporativo","Uma pontuação de risco para dispositivos individuais"],correct:1,explanation:"O Secure Score para Dispositivos (parte do Microsoft Defender XDR) avalia a postura de segurança dos endpoints gerenciados. Analisa configurações de segurança como Antivírus ativo, BitLocker habilitado, firewall ativo, patches atualizados e fornece recomendações priorizadas para melhorar a pontuação, reduzindo a superfície de ataque.",tip:"Secure Score para Dispositivos + Microsoft Secure Score (para identidades) + Defender for Cloud Secure Score (para nuvem) = visão holística da postura de segurança."},

  {id:"sc198",domain:"Conformidade Microsoft",difficulty:"intermediario",question:"O que são as Regiões Soberanas do Azure (Sovereign Clouds)?",options:["Regiões Azure de maior soberania técnica (performance)","Instâncias separadas do Azure (Azure Government, Azure China, Azure Germany) com isolamento físico, operacional e jurídico para atender requisitos regulatórios soberanos específicos","Regiões Azure controladas por governos locais","Zonas de disponibilidade com maior nível de segurança física"],correct:1,explanation:"As Sovereign Clouds são instâncias separadas e isoladas do Azure para mercados com requisitos regulatórios específicos: Azure Government (EUA - atende FedRAMP High, ITAR), Azure China (operada pela 21Vianet, atende regulamentos chineses) e Azure Germany (Telekom como trustee, para GDPR alemão). Fisicamente separadas da nuvem pública global.",tip:"Dados nas Sovereign Clouds não transitam para a nuvem pública global — garantindo soberania de dados para requisitos governamentais."},

  {id:"sc199",domain:"Identidade e Acesso",difficulty:"avancado",question:"O que é Decentralized Identity e como o Microsoft Entra ID suporta esse conceito?",options:["Uma identidade gerenciada por múltiplos departamentos sem coordenação central","Um modelo onde indivíduos controlam suas próprias credenciais digitais usando DIDs e VCs, sem depender de um provedor centralizado — suportado pelo Entra Verified ID","Identidades distribuídas por múltiplos sistemas sem sincronização","Um modelo de identidade para organizações descentralizadas"],correct:1,explanation:"Decentralized Identity usa DIDs (Decentralized Identifiers) e VCs (Verifiable Credentials) — padrões do W3C — para que indivíduos controlem suas próprias credenciais digitais em uma 'carteira'. O Microsoft Entra Verified ID implementa esse modelo, permitindo que organizações emitam credenciais verificáveis (ex: certificados profissionais) que os usuários apresentam quando necessário.",tip:"Com Verified ID, o usuário não precisa confiar em um único provedor de identidade centralizado — os dados ficam na carteira digital do próprio usuário."},

  {id:"sc200",domain:"Conceitos de Segurança",difficulty:"intermediario",question:"O que é o conceito de 'Security by Design' (Segurança pelo Design)?",options:["Um design visual de interfaces de segurança","O princípio de incorporar segurança como componente fundamental desde o início do desenvolvimento de sistemas, não como camada adicional posterior","Um design de hardware com componentes de segurança integrados","A estética visual de dashboards de segurança"],correct:1,explanation:"Security by Design (análogo a Privacy by Design) incorpora segurança desde a fase de concepção e design de sistemas, processos e produtos. Inclui: modelagem de ameaças, arquitetura de segurança, requisitos de segurança funcionais e não-funcionais, e validação de segurança durante todo o ciclo de vida de desenvolvimento. O SDL (Security Development Lifecycle) da Microsoft implementa este princípio.",tip:"Microsoft SDL, OWASP SAMM e BSIMM são frameworks que implementam Security by Design no desenvolvimento de software."}
];

QUESTION_BANK.push(...QUESTION_BANK_EXTRA2);
PLATFORM_CONFIG.totalQuestions = QUESTION_BANK.length;

// ─── Normalizar schema para o formato esperado pelo app.js ───────────────────
// SC-900 usa {question, options, explanation, tip, difficulty}
// app.js espera {q, opts, exp, dica, nivel, concept, domain}
(function normalizeQuestionBank() {
  for (let i = 0; i < QUESTION_BANK.length; i++) {
    const q = QUESTION_BANK[i];
    if (q.question && !q.q) {
      q.q       = q.question;
      q.opts    = q.options || [];
      q.dica    = q.tip || '';
      q.nivel   = q.difficulty || 'basico';
      q.concept = q.explanation || '';
      // exp: uma explicação por opção (só temos a geral, repetimos para todas)
      q.exp     = (q.opts || []).map((_, idx) =>
        idx === q.correct
          ? (q.explanation || 'Esta é a resposta correta.')
          : 'Esta alternativa está incorreta. ' + (q.explanation || '')
      );
    }
  }
})();
