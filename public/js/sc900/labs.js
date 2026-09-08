// ============================================================================
// AZ-900 Prep Hub — Laboratórios Práticos (js/labs.js)
// Dados puros (sem lógica de UI). Como a plataforma é 100% estática (sem
// backend), não é possível verificar programaticamente o que o aluno faz no
// portal real do Azure. Por isso, cada laboratório segue o formato:
//   1) Passos numerados e específicos, para o aluno executar em portal.azure.com
//   2) Um "quiz de verificação" ao final — perguntas que só quem realmente
//      navegou pelas telas do laboratório consegue responder com facilidade,
//      combinadas com 1 pergunta conceitual que reforça o domínio da AZ-900.
// Cada questão do quiz segue o mesmo padrão do banco principal: opts[4],
// correct (índice) e exp (explicação da resposta correta).
// ============================================================================

const LAB_BANK = [
{
  id: 1,
  icon: `📁`,
  title: `Criar um Grupo de Recursos`,
  domain: `Resource Groups`,
  objective: `Praticar a criação de um Grupo de Recursos, entendendo como o Azure organiza recursos relacionados sob o mesmo ciclo de vida.`,
  steps: [
    `Acesse portal.azure.com e faça login com sua conta Azure (gratuita ou de testes).`,
    `Na barra de busca superior, digite "Grupos de recursos" e selecione o serviço.`,
    `Clique em "+ Criar".`,
    `Selecione sua assinatura, digite um nome (ex.: rg-lab-az900) e escolha a região "Brazil South".`,
    `Clique em "Revisar + criar" e, depois de validado, clique em "Criar".`,
    `Aguarde a notificação de conclusão e clique em "Ir para o recurso" para ver o grupo criado.`
  ],
  quiz: [
    { q: `No formulário de criação de um Grupo de Recursos, quais campos são obrigatórios?`, opts: [`Assinatura, nome do grupo de recursos e região`, `Apenas o nome do grupo`, `Cartão de crédito e senha`, `Nome de usuário e domínio`], correct: 0, exp: `Todo Grupo de Recursos precisa estar associado a uma assinatura, ter um nome único dentro dela e uma região onde os metadados serão armazenados.` },
    { q: `Depois de criado, qual aba do Grupo de Recursos mostra todos os recursos contidos nele?`, opts: [`Visão geral (Overview)`, `Diagnosticar e solucionar problemas`, `Bloqueios`, `Política de conformidade`], correct: 0, exp: `A aba "Visão geral" lista todos os recursos atualmente contidos no Grupo de Recursos.` },
    { q: `Por que organizar os recursos deste laboratório em um Grupo de Recursos dedicado é uma boa prática?`, opts: [`Facilita excluir todos os recursos do laboratório de uma só vez, ao final`, `Aumenta a velocidade da internet`, `Reduz a criptografia dos dados`, `Impede qualquer acesso de outros usuários`], correct: 0, exp: `Manter tudo em um único Grupo de Recursos permite eliminar todo o laboratório com uma única exclusão, evitando esquecer recursos gerando custo.` }
  ]
},
{
  id: 2,
  icon: `🖥️`,
  title: `Criar uma Máquina Virtual gratuita`,
  domain: `Compute Services`,
  objective: `Provisionar (ou simular a criação até a etapa de revisão) de uma VM na camada gratuita B1s e entender as opções de configuração de computação.`,
  steps: [
    `No portal, pesquise por "Máquinas Virtuais" e clique em "+ Criar" > "Máquina virtual do Azure".`,
    `Selecione o Grupo de Recursos criado no Laboratório 1 (rg-lab-az900).`,
    `Dê um nome à VM (ex.: vm-lab-az900) e escolha a imagem (ex.: Ubuntu Server ou Windows Server).`,
    `Em "Tamanho", clique em "Ver todos os tamanhos" e procure por um tamanho da série B (ex.: B1s), associado à camada gratuita.`,
    `Configure a conta de administrador e o tipo de autenticação (senha ou chave SSH).`,
    `Em "Portas de entrada públicas", mantenha apenas a porta estritamente necessária (RDP ou SSH).`,
    `Clique em "Revisar + criar" e observe o resumo de preço estimado exibido antes de confirmar a criação.`
  ],
  quiz: [
    { q: `Qual série de VM costuma estar associada à camada gratuita/baixo custo do Azure?`, opts: [`Série B (burstable)`, `Série M (memória massiva)`, `Série N (GPU)`, `Série H (alto desempenho)`], correct: 0, exp: `VMs da série B são "burstable", com custo reduzido, ideais para cargas leves e para a camada gratuita do Azure.` },
    { q: `Na tela de revisão antes de criar a VM, o que o Azure exibe para ajudar na decisão de custo?`, opts: [`Uma estimativa de custo/preço da configuração escolhida`, `O código-fonte do sistema operacional`, `A lista de todos os usuários da assinatura`, `O histórico de logins da conta`], correct: 0, exp: `A tela de revisão mostra um resumo com o custo estimado da configuração selecionada, antes de qualquer cobrança real.` },
    { q: `Por que é importante restringir as portas de entrada públicas ao criar uma VM?`, opts: [`Para reduzir a superfície de ataque e aumentar a segurança`, `Para deixar a VM mais rápida`, `Para economizar armazenamento`, `Para trocar automaticamente de região`], correct: 0, exp: `Expor apenas as portas estritamente necessárias reduz os pontos de entrada disponíveis para possíveis ataques.` }
  ]
},
{
  id: 3,
  icon: `💾`,
  title: `Storage Account e upload de Blob`,
  domain: `Storage`,
  objective: `Criar uma conta de armazenamento, um contêiner de blobs, subir um arquivo de teste e comparar as camadas de acesso disponíveis.`,
  steps: [
    `Pesquise por "Contas de armazenamento" e clique em "+ Criar".`,
    `Selecione o grupo de recursos rg-lab-az900, dê um nome único à conta (ex.: stlabaz900xxxx) e escolha a região.`,
    `Em "Redundância", observe as opções (LRS, ZRS, GRS) e escolha "LRS" para este laboratório.`,
    `Clique em "Revisar + criar" e depois em "Criar".`,
    `Após a implantação, acesse a conta, vá em "Contêineres" e crie um novo contêiner (ex.: meus-arquivos).`,
    `Faça upload de qualquer arquivo de teste para o contêiner.`,
    `Clique no arquivo enviado e explore o campo "Camada de acesso" (Hot, Cool, Archive).`
  ],
  quiz: [
    { q: `Quais camadas de acesso você encontrou disponíveis para o blob enviado?`, opts: [`Hot, Cool e Archive`, `Rápida, Média e Lenta`, `Bronze, Prata e Ouro`, `Norte, Sul e Leste`], correct: 0, exp: `O Blob Storage oferece as camadas Hot (uso frequente), Cool (uso esporádico) e Archive (arquivamento de longo prazo).` },
    { q: `Qual opção de redundância replica os dados apenas dentro do mesmo data center?`, opts: [`LRS (armazenamento localmente redundante)`, `GRS (georredundante)`, `Nenhuma delas replica dados`, `ZRS sempre replica em outro país`], correct: 0, exp: `LRS copia os dados três vezes de forma síncrona dentro de um único data center — a opção de menor custo, mas sem proteção contra a perda do data center inteiro.` },
    { q: `Para um arquivo raramente acessado, mas exigindo o menor custo possível de armazenamento, qual camada você escolheria?`, opts: [`Archive`, `Hot`, `Premium SSD`, `Cool`], correct: 0, exp: `Archive tem o menor custo de armazenamento entre as camadas, ao custo de um tempo de recuperação mais lento.` }
  ]
},
{
  id: 4,
  icon: `💰`,
  title: `Calculadora de Preços e Orçamento`,
  domain: `Cost Management`,
  objective: `Explorar a Calculadora de Preços do Azure e configurar um orçamento (Budget) no Cost Management + Billing.`,
  steps: [
    `Abra uma nova aba e acesse a Calculadora de Preços do Azure (pesquise "Azure pricing calculator").`,
    `Adicione um produto (ex.: Virtual Machines) e configure região, sistema operacional e tamanho.`,
    `Observe a estimativa de custo mensal exibida na calculadora.`,
    `Volte ao portal.azure.com e pesquise por "Cost Management + Billing".`,
    `No menu, clique em "Orçamentos" e depois em "+ Adicionar".`,
    `Defina um escopo (sua assinatura), um valor de orçamento mensal (ex.: R$ 50) e um alerta em 80% do valor.`,
    `Salve o orçamento.`
  ],
  quiz: [
    { q: `O que a Calculadora de Preços do Azure permite fazer antes de provisionar qualquer recurso?`, opts: [`Estimar o custo mensal de uma configuração de serviços`, `Criar a VM automaticamente`, `Excluir recursos antigos`, `Alterar a senha da conta`], correct: 0, exp: `A calculadora simula configurações de serviços e apresenta uma estimativa de custo, sem provisionar nada de verdade.` },
    { q: `No Cost Management + Billing, o que um Orçamento (Budget) permite configurar?`, opts: [`Um limite de gasto com alertas automáticos ao se aproximar dele`, `O número máximo de usuários administradores`, `A velocidade da rede virtual`, `O tema visual do portal`], correct: 0, exp: `Orçamentos definem um teto de gastos e disparam alertas quando o consumo se aproxima ou ultrapassa o valor definido.` },
    { q: `Por que configurar um alerta de orçamento é uma boa prática mesmo em contas de teste/gratuitas?`, opts: [`Evita surpresas na fatura, avisando antes que o gasto saia do controle`, `Aumenta automaticamente o desempenho dos recursos`, `É obrigatório para criar qualquer recurso`, `Substitui a necessidade de qualquer monitoramento`], correct: 0, exp: `Alertas de orçamento dão visibilidade proativa do gasto, permitindo agir antes que a fatura feche com um valor inesperado.` }
  ]
},
{
  id: 5,
  icon: `📜`,
  title: `Azure Policy — exigir uma tag`,
  domain: `Azure Policy`,
  objective: `Atribuir uma definição interna do Azure Policy que exige uma tag específica em novos recursos.`,
  steps: [
    `Pesquise por "Policy" (Azure Policy) no portal.`,
    `Clique em "Definições" e procure pela definição interna "Require a tag on resources" (Exigir uma tag em recursos).`,
    `Clique nela e depois em "Atribuir".`,
    `Defina o escopo como o grupo de recursos rg-lab-az900.`,
    `No parâmetro da tag, digite um nome (ex.: Projeto).`,
    `Em "Efeito de imposição de política", verifique se está como "Habilitado" (efeito Deny).`,
    `Clique em "Revisar + criar" e depois em "Criar".`,
    `Tente criar um novo recurso simples nesse grupo sem a tag e observe o bloqueio (a avaliação pode levar alguns minutos).`
  ],
  quiz: [
    { q: `Qual efeito a política "Exigir uma tag em recursos" costuma aplicar por padrão?`, opts: [`Deny (bloqueia a criação do recurso sem a tag)`, `Audit apenas, sem bloquear nada`, `Exclui o recurso automaticamente`, `Envia um e-mail para a Microsoft`], correct: 0, exp: `O efeito "Deny" impede que a solicitação de criação do recurso seja concluída quando a condição da política não é atendida.` },
    { q: `Em qual escopo você atribuiu a política neste laboratório?`, opts: [`No grupo de recursos rg-lab-az900`, `Em toda a organização`, `Em um único disco gerenciado`, `Em uma política de custo`], correct: 0, exp: `A política foi atribuída no escopo do grupo de recursos, afetando apenas os recursos criados dentro dele.` },
    { q: `Qual a diferença entre Azure Policy e RBAC, reforçada por este laboratório?`, opts: [`Policy controla a configuração/conformidade dos recursos; RBAC controla quem pode fazer o quê`, `São exatamente a mesma ferramenta`, `RBAC também bloqueia recursos sem tag`, `Policy substitui a necessidade de autenticação`], correct: 0, exp: `Policy avalia se a configuração do recurso está em conformidade (ex.: possui a tag exigida); RBAC define permissões de identidades.` }
  ]
},
{
  id: 6,
  icon: `👤`,
  title: `Microsoft Entra ID — usuários e grupos`,
  domain: `Microsoft Entra ID`,
  objective: `Explorar a criação de usuários, grupos de segurança e as opções de MFA no Microsoft Entra ID.`,
  steps: [
    `Pesquise por "Microsoft Entra ID" no portal.`,
    `Clique em "Usuários" e depois em "+ Novo usuário" > "Criar novo usuário".`,
    `Preencha um nome de usuário de teste (ex.: aluno.teste) e um nome de exibição.`,
    `Clique em "Revisar + criar" e depois em "Criar".`,
    `Volte ao menu do Entra ID e clique em "Grupos" > "+ Novo grupo".`,
    `Crie um grupo de segurança (ex.: GrupoLabAZ900) e adicione o usuário criado como membro.`,
    `Explore o menu "Segurança" > "Métodos de autenticação" para ver as opções de MFA disponíveis (sem precisar ativar).`
  ],
  quiz: [
    { q: `Qual é a função de um Grupo no Microsoft Entra ID, como observado ao criar um?`, opts: [`Simplificar o gerenciamento de permissões para vários usuários de uma vez`, `Armazenar arquivos de backup`, `Substituir a necessidade de VNets`, `Configurar regiões do Azure`], correct: 0, exp: `Grupos permitem atribuir acesso a múltiplos usuários simultaneamente, em vez de configurar cada um individualmente.` },
    { q: `O que MFA (Autenticação Multifator) adiciona ao processo de login, segundo as opções de segurança exploradas?`, opts: [`Uma ou mais verificações adicionais além da senha`, `Uma segunda senha idêntica à primeira`, `Nenhuma mudança perceptível`, `A remoção completa da necessidade de login`], correct: 0, exp: `MFA exige fatores adicionais de verificação (app autenticador, SMS, biometria) além da senha, dificultando acessos não autorizados.` },
    { q: `Qual a diferença entre o Microsoft Entra ID e o Active Directory Domain Services tradicional, reforçada neste laboratório?`, opts: [`Entra ID é um serviço de identidade baseado em nuvem; AD DS é local, baseado em LDAP/Kerberos`, `São o mesmo produto com nomes diferentes`, `AD DS só existe na nuvem`, `Entra ID exige um controlador de domínio físico`], correct: 0, exp: `Entra ID foi desenhado para cenários de nuvem (SaaS, aplicações web); AD DS gerencia redes corporativas locais tradicionais.` }
  ]
},
{
  id: 7,
  icon: `📈`,
  title: `Azure Monitor — criar um alerta`,
  domain: `Monitoring Tools`,
  objective: `Configurar uma regra de alerta básica de métrica usando o Azure Monitor sobre um recurso do laboratório.`,
  steps: [
    `Pesquise por "Monitor" (Azure Monitor) no portal.`,
    `No menu, clique em "Alertas" e depois em "+ Criar" > "Regra de alerta".`,
    `Em "Escopo", selecione um recurso do seu grupo de recursos (ex.: a VM ou a conta de armazenamento criada).`,
    `Em "Condição", escolha uma métrica disponível (ex.: "Porcentagem de CPU" para uma VM).`,
    `Defina um limite (ex.: maior que 80%).`,
    `Em "Ações", crie um novo grupo de ações com notificação por e-mail.`,
    `Dê um nome à regra de alerta e clique em "Criar regra de alerta".`
  ],
  quiz: [
    { q: `O que uma regra de alerta do Azure Monitor faz quando a condição definida é atendida?`, opts: [`Dispara uma notificação ou ação automatizada configurada`, `Exclui o recurso monitorado automaticamente`, `Aumenta o preço do recurso`, `Bloqueia o login de todos os usuários`], correct: 0, exp: `Alertas monitoram continuamente a condição definida e disparam a ação configurada (e-mail, SMS, webhook) quando ela é atendida.` },
    { q: `Qual tipo de dado você usou como condição do alerta (ex.: percentual de CPU)?`, opts: [`Uma métrica numérica coletada em intervalos regulares`, `Um log de texto livre`, `Uma política de conformidade`, `Um relatório financeiro anual`], correct: 0, exp: `Métricas são séries numéricas leves, ideais para condições de alerta quase em tempo real, como uso de CPU.` },
    { q: `Por que monitoramento proativo (alertas) é importante mesmo em ambientes de laboratório/teste?`, opts: [`Permite detectar e responder a problemas rapidamente, antes que afetem o usuário final`, `Substitui a necessidade de qualquer segurança`, `Reduz automaticamente os custos a zero`, `É exigido apenas em contas empresariais`], correct: 0, exp: `Alertas dão visibilidade em tempo real sobre problemas, permitindo ação corretiva rápida, independentemente do tamanho do ambiente.` }
  ]
},
{
  id: 8,
  icon: `🌍`,
  title: `Regiões e Availability Zones`,
  domain: `Regiões e Availability Zones`,
  objective: `Explorar a lista oficial de regiões do Azure e identificar quais regiões oferecem Availability Zones.`,
  externalLink: {
    url: `https://learn.microsoft.com/en-us/azure/reliability/regions-list`,
    label: `🌍 Abrir Lista de Regiões do Azure`
  },
  steps: [
    `Clique no botão "🌍 Abrir Lista de Regiões do Azure" abaixo (página oficial da Microsoft: learn.microsoft.com/azure/reliability/regions-list) para ver a tabela com todas as regiões.`,
    `Localize a região "Brazil South" na tabela e verifique, na coluna "Availability zone support", se ela é listada com suporte a Availability Zones.`,
    `Volte ao portal.azure.com, pesquise por "Máquinas Virtuais" e, ao iniciar a criação de uma nova (sem precisar concluir), observe se a opção "Zona de disponibilidade" aparece para a região "Brazil South".`,
    `Na mesma tabela, compare com uma região sem suporte a Availability Zones (ex.: "West US") e note a diferença na coluna "Availability zone support".`,
    `Anote quantas Availability Zones uma região com suporte geralmente oferece (veja a documentação vinculada na página, "Availability zones overview").`
  ],
  quiz: [
    { q: `Quantas Availability Zones, no mínimo, uma região com suporte a esse recurso costuma oferecer?`, opts: [`Três`, `Uma`, `Dez`, `Nenhuma`], correct: 0, exp: `Regiões com suporte a Availability Zones normalmente possuem ao menos três zonas fisicamente separadas.` },
    { q: `O que diferencia uma região do Azure de uma Availability Zone, segundo o que você explorou?`, opts: [`Uma região contém um ou mais data centers, podendo ser dividida em zonas fisicamente separadas`, `São exatamente a mesma coisa`, `Uma zona sempre contém múltiplas regiões`, `Regiões não têm relação com zonas`], correct: 0, exp: `Uma região é a unidade geográfica maior; Availability Zones são subdivisões físicas dentro de uma região com energia e rede independentes.` },
    { q: `Por que a escolha de região pode impactar tanto a latência quanto a conformidade legal de uma solução?`, opts: [`Porque a proximidade geográfica afeta a latência, e a localização física dos dados pode estar sujeita a leis locais de residência de dados`, `Porque cada região tem um preço fixo global idêntico`, `Porque a região determina apenas a cor do portal`, `Porque isso não tem nenhum impacto técnico ou legal`], correct: 0, exp: `Regiões mais próximas do usuário reduzem latência, e algumas regulamentações exigem que dados permaneçam dentro de fronteiras específicas.` }
  ]
},
{
  id: 9,
  icon: `🔑`,
  title: `RBAC — atribuir uma função`,
  domain: `Identity, Access and Security`,
  objective: `Atribuir uma função RBAC (ex.: Leitor) a um usuário no grupo de recursos do laboratório.`,
  steps: [
    `Acesse o grupo de recursos rg-lab-az900 no portal.`,
    `No menu lateral, clique em "Controle de acesso (IAM)".`,
    `Clique em "+ Adicionar" > "Adicionar atribuição de função".`,
    `Escolha a função "Leitor" (Reader) na lista de funções internas.`,
    `Em "Membros", selecione o usuário de teste criado no Laboratório 6 (aluno.teste).`,
    `Clique em "Revisar + atribuir".`,
    `Volte à aba "Controle de acesso (IAM)" > "Atribuições de função" e confirme que o usuário aparece com a função Leitor.`
  ],
  quiz: [
    { q: `O que a função "Leitor" (Reader) permite que um usuário faça, segundo o modelo RBAC?`, opts: [`Apenas visualizar recursos, sem poder alterá-los`, `Excluir qualquer recurso da assinatura`, `Alterar políticas de segurança globais`, `Redefinir a senha de outros usuários`], correct: 0, exp: `A função Leitor concede apenas permissão de visualização, sem permitir criar, modificar ou excluir recursos.` },
    { q: `Em qual escopo você atribuiu a função RBAC neste laboratório?`, opts: [`No grupo de recursos rg-lab-az900`, `Em toda a organização`, `Em um único arquivo de blob`, `Em uma política de custo`], correct: 0, exp: `A atribuição foi feita no escopo do grupo de recursos, afetando os recursos contidos nele.` },
    { q: `Se essa mesma função fosse atribuída no nível da assinatura em vez do grupo de recursos, o que aconteceria?`, opts: [`A permissão seria herdada por todos os grupos de recursos e recursos daquela assinatura`, `Nada mudaria`, `A permissão deixaria de funcionar`, `O usuário perderia acesso a tudo`], correct: 0, exp: `O RBAC segue um modelo hierárquico de herança: permissões atribuídas em escopos superiores são herdadas pelos escopos inferiores.` }
  ]
},
{
  id: 10,
  icon: `🌐`,
  title: `Virtual Network e Network Security Group`,
  domain: `Networking`,
  objective: `Criar uma Virtual Network (VNet), adicionar uma sub-rede e configurar um Network Security Group (NSG) para controlar o tráfego de entrada.`,
  steps: [
    `Pesquise por "Redes virtuais" no portal e clique em "+ Criar".`,
    `Selecione o grupo de recursos rg-lab-az900, dê um nome à VNet (ex.: vnet-lab-az900) e escolha a região "Brazil South".`,
    `Na aba "Endereços IP", observe o espaço de endereçamento padrão (ex.: 10.0.0.0/16) e a sub-rede padrão criada automaticamente.`,
    `Clique em "Revisar + criar" e depois em "Criar".`,
    `Após a implantação, acesse a VNet criada, vá em "Sub-redes" e adicione uma nova sub-rede (ex.: sub-web, intervalo 10.0.1.0/24).`,
    `Pesquise por "Grupos de segurança de rede" e crie um novo NSG (ex.: nsg-lab-az900) no mesmo grupo de recursos e região.`,
    `Abra o NSG criado, vá em "Regras de segurança de entrada" > "+ Adicionar" e crie uma regra permitindo a porta 443 (HTTPS), prioridade 100.`,
    `Volte à VNet, acesse "Sub-redes", edite a sub-rede sub-web e associe o NSG criado a ela.`
  ],
  quiz: [
    { q: `O que uma Virtual Network (VNet) fornece dentro do Azure?`, opts: [`Um ambiente de rede privado e isolado, com endereçamento IP próprio, para os recursos do Azure se comunicarem entre si e com a internet`, `Um banco de dados relacional gerenciado`, `Um sistema de arquivos compartilhado entre VMs`, `Um serviço de autenticação multifator`], correct: 0, exp: `A VNet é a construção fundamental de rede privada no Azure, permitindo isolamento, segmentação e comunicação segura entre recursos.` },
    { q: `Qual é o propósito de dividir uma VNet em sub-redes (subnets), como feito neste laboratório?`, opts: [`Organizar e segmentar os recursos logicamente, permitindo aplicar regras de segurança e roteamento específicos por segmento`, `Aumentar automaticamente a velocidade da internet`, `Reduzir o custo de armazenamento`, `Substituir a necessidade de um Grupo de Recursos`], correct: 0, exp: `Sub-redes dividem o espaço de endereçamento da VNet em segmentos menores, permitindo isolar camadas (ex.: web, banco de dados) e aplicar políticas de segurança específicas a cada uma.` },
    { q: `Qual é a função de um Network Security Group (NSG), segundo a regra criada neste laboratório?`, opts: [`Filtrar o tráfego de rede de entrada e saída com base em regras de origem, destino, porta e protocolo`, `Criptografar automaticamente todos os discos da assinatura`, `Gerenciar o orçamento e os alertas de custo`, `Definir quais usuários têm acesso de leitura ao portal`], correct: 0, exp: `NSGs atuam como um firewall básico em nível de sub-rede ou interface de rede, permitindo ou bloqueando tráfego conforme regras definidas por prioridade, protocolo, porta e origem/destino.` }
  ]
},
{
  id: 11,
  icon: `🚀`,
  title: `Azure App Service — publicar uma Web App (PaaS)`,
  domain: `Modelos IaaS, PaaS e SaaS`,
  objective: `Provisionar um App Service (PaaS) para hospedar uma aplicação web, comparando o nível de gerenciamento exigido em relação à VM (IaaS) criada no Laboratório 2.`,
  steps: [
    `Pesquise por "Serviços de Aplicativos" (App Services) no portal e clique em "+ Criar" > "Aplicativo Web".`,
    `Selecione o grupo de recursos rg-lab-az900, dê um nome único ao Web App (ex.: app-lab-az900-xxxx), escolha a pilha de runtime (ex.: .NET, Node.js ou Python) e o sistema operacional.`,
    `Em "Plano do Serviço de Aplicativo (App Service Plan)", clique em "Criar novo" e escolha a camada de preços "F1 Grátis" (Free).`,
    `Clique em "Revisar + criar" e depois em "Criar".`,
    `Após a implantação, acesse o recurso e clique na URL padrão gerada (algo.azurewebsites.net) para ver a aplicação padrão já publicada automaticamente.`,
    `No menu do App Service, explore a aba "Configuração" e observe que não há nenhuma opção de sistema operacional, patches ou discos — apenas configurações da aplicação.`,
    `Compare com o Laboratório 2: quais tarefas de manutenção você teve que decidir na VM (SO, tamanho, portas, atualizações) e quais delas simplesmente não existem aqui no App Service.`
  ],
  quiz: [
    { q: `O que a camada de preços "F1 Grátis" do App Service Plan oferece?`, opts: [`Um plano gratuito com recursos limitados, ideal para testes e cargas pequenas`, `Armazenamento em blob ilimitado`, `Um domínio personalizado com SSL pago automaticamente`, `Acesso root ao sistema operacional subjacente`], correct: 0, exp: `A camada F1 (Free) oferece computação e armazenamento limitados, sem custo, adequada para testes e protótipos, mas sem recursos como domínio customizado com SSL.` },
    { q: `Qual é a principal diferença entre o modelo PaaS (App Service) usado neste laboratório e o modelo IaaS (VM) do Laboratório 2, em termos de responsabilidade de gerenciamento?`, opts: [`No PaaS, a Microsoft gerencia o sistema operacional, o patching e a infraestrutura subjacente, deixando o cliente responsável apenas pelo código e configuração da aplicação`, `No PaaS o cliente gerencia tudo, incluindo o sistema operacional`, `Não há diferença prática entre IaaS e PaaS`, `No IaaS a Microsoft gerencia automaticamente o sistema operacional da VM`], correct: 0, exp: `PaaS abstrai a infraestrutura e o SO — o cliente foca só na aplicação. Em IaaS (a VM do Laboratório 2), o cliente é responsável por SO, patches e configuração de rede.` },
    { q: `Por que um App Service é considerado um serviço PaaS (Platform as a Service)?`, opts: [`Porque fornece uma plataforma pronta para hospedar aplicações, abstraindo a infraestrutura e o sistema operacional subjacentes`, `Porque exige que o cliente instale o próprio sistema operacional`, `Porque cobra apenas por hora de uso de hardware físico dedicado`, `Porque é hospedado fora da infraestrutura do Azure`], correct: 0, exp: `PaaS entrega uma plataforma completa (runtime, SO gerenciado, escalonamento) pronta para receber o código da aplicação, sem o cliente precisar administrar a infraestrutura.` }
  ]
},
{
  id: 12,
  icon: `💡`,
  title: `Azure Advisor — recomendações personalizadas`,
  domain: `Well-Architected Framework`,
  objective: `Explorar as recomendações do Azure Advisor sobre os recursos já criados nos laboratórios anteriores, relacionando-as aos pilares do Well-Architected Framework.`,
  steps: [
    `Pesquise por "Advisor" no portal do Azure.`,
    `Na visão geral do Advisor, observe o "Score" (pontuação) geral e os scores por categoria: Confiabilidade, Segurança, Desempenho, Excelência Operacional e Custos.`,
    `Clique na categoria "Custos" e veja se há alguma recomendação relacionada aos recursos do grupo rg-lab-az900 (ex.: redimensionar ou excluir recursos ociosos).`,
    `Clique na categoria "Segurança" e observe as recomendações (podem levar algumas horas para aparecer após a criação dos recursos; se ainda não houver nenhuma, veja os exemplos de recomendação exibidos na tela).`,
    `Abra uma recomendação qualquer e leia a descrição do "impacto" e a "ação recomendada" sugerida pelo Advisor.`,
    `Relacione cada categoria do Advisor (Confiabilidade, Segurança, Desempenho, Excelência Operacional, Custos) com os cinco pilares do Well-Architected Framework.`
  ],
  quiz: [
    { q: `O que o Azure Advisor faz?`, opts: [`Analisa a configuração dos seus recursos e sugere recomendações personalizadas de custo, segurança, confiabilidade, desempenho e excelência operacional`, `Cria automaticamente novos recursos sem intervenção do usuário`, `Substitui completamente a necessidade do Azure Monitor`, `Gerencia faturas e realiza pagamentos automaticamente`], correct: 0, exp: `O Advisor analisa continuamente a configuração e o uso dos recursos e recomenda ações personalizadas para melhorar custo, segurança, confiabilidade, desempenho e excelência operacional.` },
    { q: `Quantas categorias principais de recomendação o Azure Advisor organiza?`, opts: [`Cinco: Confiabilidade, Segurança, Desempenho, Excelência Operacional e Custos`, `Duas: Bom e Ruim`, `Dez categorias distintas`, `Apenas uma: Segurança`], correct: 0, exp: `O Advisor organiza suas recomendações em cinco categorias: Confiabilidade, Segurança, Desempenho, Excelência Operacional e Custos.` },
    { q: `Como as categorias do Azure Advisor se relacionam com o Well-Architected Framework?`, opts: [`Elas espelham diretamente os pilares do Well-Architected Framework, oferecendo recomendações práticas alinhadas a cada pilar`, `Não têm nenhuma relação entre si`, `O Advisor substitui o Well-Architected Framework como certificação`, `O Well-Architected Framework é apenas uma aba dentro do Advisor`], correct: 0, exp: `As categorias do Advisor (Confiabilidade, Segurança, Desempenho, Excelência Operacional, Custos) correspondem diretamente aos cinco pilares do Well-Architected Framework, tornando o Advisor uma ferramenta prática de aplicação desses princípios.` }
  ]
},
{
  id: 13,
  icon: `📄`,
  title: `Exportar template ARM`,
  domain: `Azure Resource Manager`,
  objective: `Exportar o template do Azure Resource Manager (ARM) de um grupo de recursos já criado, entendendo a base do provisionamento como código (Infrastructure as Code) no Azure.`,
  steps: [
    `Acesse o grupo de recursos rg-lab-az900 no portal.`,
    `No menu lateral, clique em "Exportar template".`,
    `Aguarde o Azure gerar o template JSON com base nos recursos atuais do grupo.`,
    `Explore as abas "Template", "Parâmetros" e "Interface do usuário de implantação" geradas automaticamente.`,
    `No template JSON, localize a seção "resources" e identifique ao menos dois tipos de recursos (ex.: Microsoft.Storage/storageAccounts, Microsoft.Compute/virtualMachines) que você criou nos laboratórios anteriores.`,
    `Clique em "Baixar" para salvar uma cópia do template (opcional) e observe que ele poderia ser reutilizado para recriar o mesmo ambiente automaticamente.`
  ],
  quiz: [
    { q: `O que é um template ARM (Azure Resource Manager)?`, opts: [`Um arquivo JSON que descreve declarativamente a infraestrutura e a configuração dos recursos do Azure`, `Um script executável escrito em Python`, `Um tipo específico de máquina virtual`, `Um relatório mensal de custos da assinatura`], correct: 0, exp: `Um template ARM é um arquivo JSON declarativo que define os recursos do Azure e suas propriedades, permitindo provisionamento consistente e repetível.` },
    { q: `Qual é a principal vantagem de usar templates ARM em vez de criar recursos manualmente pelo portal?`, opts: [`Permite provisionar infraestrutura de forma consistente, repetível e versionável (Infraestrutura como Código)`, `É a única forma possível de criar um Grupo de Recursos`, `Reduz automaticamente o preço dos recursos provisionados`, `Elimina a necessidade de autenticação no Azure`], correct: 0, exp: `Templates ARM permitem tratar a infraestrutura como código: versionar, revisar e reaplicar as mesmas configurações de forma consistente entre ambientes.` },
    { q: `Ao exportar o template de um grupo de recursos, o que a seção "resources" do JSON representa?`, opts: [`A lista declarativa de todos os recursos existentes naquele grupo, com seus tipos e propriedades`, `A lista de usuários com acesso ao grupo de recursos`, `O histórico de custos do grupo de recursos`, `As políticas de Azure Policy aplicadas ao grupo`], correct: 0, exp: `A seção "resources" do template ARM lista cada recurso do grupo com seu tipo (ex.: Microsoft.Storage/storageAccounts) e suas propriedades de configuração.` }
  ]
},
{
  id: 14,
  icon: `🧹`,
  title: `Limpeza — excluir o grupo de recursos`,
  domain: `Resource Groups`,
  objective: `Encerrar o laboratório excluindo todos os recursos criados de uma só vez, evitando cobranças desnecessárias.`,
  steps: [
    `Acesse o grupo de recursos rg-lab-az900 no portal.`,
    `Clique em "Excluir grupo de recursos" no menu superior.`,
    `Digite o nome do grupo de recursos para confirmar a exclusão.`,
    `Clique em "Excluir" e aguarde a conclusão do processo.`,
    `Confirme na lista de "Grupos de recursos" que ele não aparece mais.`
  ],
  quiz: [
    { q: `O que acontece com todos os recursos dentro de um Grupo de Recursos quando ele é excluído?`, opts: [`Todos são excluídos permanentemente junto com o grupo`, `Apenas o nome do grupo é removido, os recursos continuam ativos`, `Eles são movidos automaticamente para outra assinatura`, `Nada acontece até exclusão manual de cada um`], correct: 0, exp: `Excluir um Grupo de Recursos remove permanentemente todos os recursos nele contidos — por isso é uma operação irreversível.` },
    { q: `Por que excluir o grupo de recursos inteiro é mais prático do que excluir cada recurso individualmente?`, opts: [`Porque remove tudo relacionado ao laboratório em uma única operação, economizando tempo e evitando esquecer algo gerando custo`, `Porque é a única forma de excluir uma VM`, `Porque aumenta a segurança da assinatura`, `Porque reduz a necessidade de autenticação`], correct: 0, exp: `Consolidar os recursos do laboratório em um único grupo permite eliminar tudo de uma vez, reduzindo o risco de esquecer algo ativo.` },
    { q: `Qual recurso do Azure poderia ter impedido essa exclusão acidental, caso estivesse configurado?`, opts: [`Um Resource Lock (bloqueio de recurso) do tipo CanNotDelete`, `Uma política de preços`, `Um Availability Set`, `Uma tag de cor`], correct: 0, exp: `Locks do tipo "CanNotDelete" bloqueiam a exclusão de recursos mesmo para quem tem permissão via RBAC, adicionando uma camada extra de proteção.` }
  ]
}
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = LAB_BANK;
}
