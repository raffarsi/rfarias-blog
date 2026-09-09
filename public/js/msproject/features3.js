// ============================================================================
// features3.js — Links artigos↔questões, Dashboard inteligente, Mobile fix,
//                Labs interativos, Notificações de retorno
// ============================================================================

// ─── 1. MAPEAMENTO DOMÍNIO → ARTIGO ─────────────────────────────────────────

const DOMAIN_ARTICLES = (function() {
  const base = 'https://rfarias.com/posts/';
  const url  = location.pathname;

  if (url.includes('ai901')) return {
    'IA Responsável':                               { title:'AI-901 [5] — IA Responsável e Azure AI Foundry', slug:'ai901-05-ia-responsavel-foundry' },
    'Modelos de IA Generativa e Configuração':      { title:'AI-901 [3] — Linguagem natural e IA Generativa', slug:'ai901-03-linguagem-ia-generativa' },
    'Panorama de Workloads de IA':                  { title:'AI-901 [1] — Fundamentos de IA e Machine Learning', slug:'ai901-01-fundamentos-ia' },
    'Análise de Texto e Fala':                      { title:'AI-901 [2] — Azure AI Services: visão e fala', slug:'ai901-02-azure-ai-services' },
    'Visão Computacional e Extração de Informação': { title:'AI-901 [2] — Azure AI Services: visão e fala', slug:'ai901-02-azure-ai-services' },
    'Fundamentos do Microsoft Foundry e Prompts':   { title:'AI-901 [5] — IA Responsável e Azure AI Foundry', slug:'ai901-05-ia-responsavel-foundry' },
    'Agentes e Apps com Foundry SDK':               { title:'AI-901 [4] — IA conversacional e agentes', slug:'ai901-04-ia-conversacional' },
    'Implementação de Texto e Fala com Foundry':    { title:'AI-901 [2] — Azure AI Services: visão e fala', slug:'ai901-02-azure-ai-services' },
    'Implementação de Visão e Geração de Imagem com Foundry': { title:'AI-901 [2] — Azure AI Services: visão e fala', slug:'ai901-02-azure-ai-services' },
    'Content Understanding — Extração de Informação na Prática': { title:'AI-901 [3] — Linguagem natural e IA Generativa', slug:'ai901-03-linguagem-ia-generativa' },
  };

  if (url.includes('sc900')) return {
    'Conceitos de Segurança':  { title:'SC-900 [1] — Zero Trust e defesa em profundidade', slug:'sc900-01-zero-trust-defesa' },
    'Conceitos de Conformidade':{ title:'SC-900 [4] — Conformidade e Microsoft Purview', slug:'sc900-04-conformidade-purview' },
    'Identidade e Acesso':     { title:'SC-900 [2] — Identidade e acesso com Entra ID', slug:'sc900-02-identidade-entra' },
    'Soluções de Segurança':   { title:'SC-900 [3] — Soluções de segurança Microsoft', slug:'sc900-03-solucoes-seguranca' },
    'Conformidade Microsoft':  { title:'SC-900 [5] — Governança e Service Trust Portal', slug:'sc900-05-governanca-trust' },
  };

  if (url.includes('dp900')) return {
    'Conceitos Core de Dados':              { title:'DP-900 [1] — Conceitos fundamentais de dados', slug:'dp900-01-conceitos-dados' },
    'Dados Relacionais no Azure':           { title:'DP-900 [2] — Dados relacionais no Azure', slug:'dp900-02-dados-relacionais' },
    'Dados Não Relacionais no Azure':       { title:'DP-900 [3] — Dados não relacionais e Cosmos DB', slug:'dp900-03-dados-nao-relacionais' },
    'Cargas de Trabalho de Analytics no Azure': { title:'DP-900 [4] — Analytics, Synapse e Power BI', slug:'dp900-04-analytics-powerbi' },
  };

  if (url.includes('ms-project')) return {};

  // AZ-900 (default)
  return {
    'Cloud Concepts':                  { title:'AZ-900 [1] — Conceitos fundamentais de Cloud', slug:'az900-01-conceitos-nuvem' },
    'Nuvem Pública, Privada e Híbrida':{ title:'AZ-900 [1] — Conceitos fundamentais de Cloud', slug:'az900-01-conceitos-nuvem' },
    'Modelos IaaS, PaaS e SaaS':       { title:'AZ-900 [1] — Conceitos fundamentais de Cloud', slug:'az900-01-conceitos-nuvem' },
    'Azure Architecture':              { title:'AZ-900 [2] — Arquitetura e componentes do Azure', slug:'az900-02-arquitetura-azure' },
    'Regiões e Availability Zones':    { title:'AZ-900 [2] — Arquitetura e componentes do Azure', slug:'az900-02-arquitetura-azure' },
    'Azure Resource Manager':          { title:'AZ-900 [2] — Arquitetura e componentes do Azure', slug:'az900-02-arquitetura-azure' },
    'Resource Groups':                 { title:'AZ-900 [2] — Arquitetura e componentes do Azure', slug:'az900-02-arquitetura-azure' },
    'Core Azure Services':             { title:'AZ-900 [3] — Computação e redes no Azure', slug:'az900-03-computacao-redes' },
    'Compute Services':                { title:'AZ-900 [3] — Computação e redes no Azure', slug:'az900-03-computacao-redes' },
    'Networking':                      { title:'AZ-900 [3] — Computação e redes no Azure', slug:'az900-03-computacao-redes' },
    'Well-Architected Framework':      { title:'AZ-900 [3] — Computação e redes no Azure', slug:'az900-03-computacao-redes' },
    'Storage':                         { title:'AZ-900 [4] — Storage e banco de dados', slug:'az900-04-storage-database' },
    'Identity, Access and Security':   { title:'AZ-900 [5] — Identidade, segurança e governança', slug:'az900-05-identidade-seguranca' },
    'Microsoft Entra ID':              { title:'AZ-900 [5] — Identidade, segurança e governança', slug:'az900-05-identidade-seguranca' },
    'Governance and Compliance':       { title:'AZ-900 [5] — Identidade, segurança e governança', slug:'az900-05-identidade-seguranca' },
    'Azure Policy':                    { title:'AZ-900 [5] — Identidade, segurança e governança', slug:'az900-05-identidade-seguranca' },
    'Azure Pricing':                   { title:'AZ-900 [6] — Custos, SLA e ciclo de vida', slug:'az900-06-custos-sla' },
    'Cost Management':                 { title:'AZ-900 [6] — Custos, SLA e ciclo de vida', slug:'az900-06-custos-sla' },
    'SLA':                             { title:'AZ-900 [6] — Custos, SLA e ciclo de vida', slug:'az900-06-custos-sla' },
    'Monitoring Tools':                { title:'AZ-900 [6] — Custos, SLA e ciclo de vida', slug:'az900-06-custos-sla' },
  };
})();

function getArticleLink(domain) {
  return DOMAIN_ARTICLES[domain] || null;
}

function articleLinkHtml(domain) {
  const art = getArticleLink(domain);
  if (!art) return '';
  return `<a class="art-link" href="https://rfarias.com/posts/${art.slug}" target="_blank" rel="noopener">
    📖 Leia mais: ${art.title} →
  </a>`;
}

// Patch buildFeedbackHTML para injetar link do artigo
(function patchFeedback() {
  function waitForFn() {
    if (typeof buildFeedbackHTML !== 'function') { setTimeout(waitForFn, 80); return; }
    const orig = buildFeedbackHTML;
    window.buildFeedbackHTML = function(q, userAnswerIndex) {
      let html = orig(q, userAnswerIndex);
      const link = articleLinkHtml(q.domain);
      if (link) {
        // Inject before closing of feedback div
        html = html.replace('</div>', link + '</div>');
      }
      return html;
    };
  }
  waitForFn();
})();

// ─── 2. DASHBOARD INTELIGENTE ────────────────────────────────────────────────

(function patchDashboard() {
  function waitForRenderer() {
    if (typeof RENDERERS === 'undefined' || !RENDERERS.dashboard) { setTimeout(waitForRenderer, 100); return; }
    const orig = RENDERERS.dashboard;
    RENDERERS.dashboard = function() {
      orig();
      setTimeout(() => injectSmartDashboard(), 80);
    };
  }
  waitForRenderer();
})();

function injectSmartDashboard() {
  const p = currentProfile();
  if (!p) return;
  const el = document.getElementById('screen-dashboard');
  if (!el) return;
  const existing = document.getElementById('smart-dashboard');
  if (existing) existing.remove();

  // Calcular domínio mais fraco
  const domStats = {};
  QUESTION_BANK.forEach(q => { if (!domStats[q.domain]) domStats[q.domain] = { correct:0, total:0, seen:0 }; domStats[q.domain].total++; });
  (p.history || []).forEach(h => (h.results||[]).forEach(r => {
    const q = QUESTION_BANK.find(q => q.id === r.id);
    if (!q) return;
    domStats[q.domain].seen++;
    if (r.correct) domStats[q.domain].correct++;
  }));

  const seenDomains = Object.entries(domStats).filter(([,s]) => s.seen > 0);
  const weakest = seenDomains.sort((a,b) => (a[1].correct/a[1].seen) - (b[1].correct/b[1].seen))[0];
  const notStudied = Object.entries(domStats).filter(([,s]) => s.seen === 0);

  // Próxima conquista
  const achievements = typeof ACHIEVEMENTS !== 'undefined' ? ACHIEVEMENTS : [];
  const nextAch = achievements.find(a => !p.unlockedAchievements?.includes(a.id));

  // Streak
  const history = p.history || [];
  const days = [...new Set(history.map(h => h.date?.slice(0,10)).filter(Boolean))].sort().reverse();
  const today = new Date().toISOString().slice(0,10);
  const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
  let streak = 0;
  for (let i=0; i<days.length; i++) {
    if (i===0 && days[0]!==today && days[0]!==yesterday) break;
    if (i===0) { streak=1; continue; }
    const diff = Math.round((new Date(days[i-1])-new Date(days[i]))/86400000);
    if (diff===1) streak++; else break;
  }

  // Última sessão
  const lastSim = history[0];
  const lastPct = lastSim?.percent || 0;

  // Sugestão de hoje
  let suggestion, suggestionAction, suggestionIcon;
  if (notStudied.length > 0) {
    suggestion = `Você ainda não estudou <strong>${notStudied[0][0]}</strong>. Que tal começar agora?`;
    suggestionAction = `startSimuladoDominio('${notStudied[0][0].replace(/'/g,"\\'")}')`;
    suggestionIcon = '🆕';
  } else if (weakest && weakest[1].correct/weakest[1].seen < 0.6) {
    const pct = Math.round(weakest[1].correct/weakest[1].seen*100);
    suggestion = `Seu ponto mais fraco é <strong>${weakest[0]}</strong> (${pct}% de acertos). Pratique agora para melhorar.`;
    suggestionAction = `startSimuladoDominio('${weakest[0].replace(/'/g,"\\'")}')`;
    suggestionIcon = '🎯';
  } else if (history.length === 0) {
    suggestion = `Você ainda não fez nenhum simulado. Comece pelo banco de questões!`;
    suggestionAction = `showScreen('bank')`;
    suggestionIcon = '🚀';
  } else {
    suggestion = `Está indo bem! Que tal um simulado oficial para testar seu preparo?`;
    suggestionAction = `showScreen('oficial')`;
    suggestionIcon = '🏆';
  }

  // Dias até o exame (configurável)
  const examDateKey = 'examDate_' + STATE.currentStudent;
  const savedDate = localStorage.getItem(examDateKey);
  let daysLeft = null;
  if (savedDate) {
    const diff = Math.ceil((new Date(savedDate) - new Date()) / 86400000);
    if (diff > 0) daysLeft = diff;
  }

  const smartHtml = `
  <div id="smart-dashboard" class="smart-dash">

    <!-- Sugestão do dia -->
    <div class="smart-card suggestion-card">
      <div class="suggestion-icon">${suggestionIcon}</div>
      <div class="suggestion-body">
        <div class="suggestion-label">Sugestão para hoje</div>
        <div class="suggestion-text">${suggestion}</div>
        <button class="btn btn-primary suggestion-btn" onclick="${suggestionAction}">Começar agora →</button>
      </div>
    </div>

    <!-- Métricas rápidas -->
    <div class="smart-metrics">
      <div class="smart-metric">
        <span class="metric-icon">${streak >= 3 ? '🔥' : '📅'}</span>
        <span class="metric-val">${streak}</span>
        <span class="metric-label">Streak</span>
      </div>
      <div class="smart-metric">
        <span class="metric-icon">📝</span>
        <span class="metric-val">${history.length}</span>
        <span class="metric-label">Simulados</span>
      </div>
      <div class="smart-metric">
        <span class="metric-icon">📊</span>
        <span class="metric-val">${lastPct}%</span>
        <span class="metric-label">Última nota</span>
      </div>
      <div class="smart-metric clickable" onclick="showExamDatePicker()">
        <span class="metric-icon">🗓️</span>
        <span class="metric-val">${daysLeft !== null ? daysLeft : '—'}</span>
        <span class="metric-label">Dias p/ prova</span>
      </div>
    </div>

    <!-- Domínios em destaque -->
    ${seenDomains.length > 0 ? `
    <div class="smart-domains">
      <div class="smart-section-title">Seus domínios</div>
      <div class="smart-domain-bars">
        ${seenDomains.sort((a,b) => a[1].correct/a[1].seen - b[1].correct/b[1].seen).slice(0,5).map(([d,s]) => {
          const pct = Math.round(s.correct/s.seen*100);
          const color = pct>=70?'#0E7A0D':pct>=50?'#D14B00':'#c0392b';
          return `<div class="smart-domain-row" onclick="startSimuladoDominio('${d.replace(/'/g,"\\'")}')">
            <span class="sdr-name">${d}</span>
            <div class="sdr-bar-bg"><div class="sdr-bar-fill" style="width:${pct}%;background:${color}"></div></div>
            <span class="sdr-pct" style="color:${color}">${pct}%</span>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}

    <!-- Próxima conquista -->
    ${nextAch ? `
    <div class="smart-next-ach">
      <div class="smart-section-title">Próxima conquista</div>
      <div class="ach-preview">
        <span class="ach-icon">${nextAch.icon || '🏅'}</span>
        <div class="ach-body">
          <strong>${nextAch.label || nextAch.name}</strong>
          <p>${nextAch.description || nextAch.desc || ''}</p>
        </div>
      </div>
    </div>` : ''}

    <!-- Config data do exame (modal inline) -->
    <div id="exam-date-picker" class="exam-date-modal hidden">
      <div class="edp-inner">
        <h3>📅 Quando é seu exame?</h3>
        <input type="date" id="exam-date-input" min="${today}" />
        <div class="edp-actions">
          <button class="btn btn-primary" onclick="saveExamDate()">Salvar</button>
          <button class="btn btn-outline" onclick="document.getElementById('exam-date-picker').classList.add('hidden')">Cancelar</button>
        </div>
      </div>
    </div>

  </div>`;

  // Inserir no topo do dashboard
  const firstChild = el.firstChild;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = smartHtml;
  el.insertBefore(wrapper.firstElementChild, firstChild);

  // Restore saved exam date
  if (savedDate) document.getElementById('exam-date-input').value = savedDate;
}

window.showExamDatePicker = function() {
  document.getElementById('exam-date-picker')?.classList.toggle('hidden');
};

window.saveExamDate = function() {
  const val = document.getElementById('exam-date-input').value;
  if (!val) return;
  localStorage.setItem('examDate_' + STATE.currentStudent, val);
  document.getElementById('exam-date-picker').classList.add('hidden');
  injectSmartDashboard();
};

// ─── 3. MOBILE RESPONSIVO ────────────────────────────────────────────────────

(function mobileNav() {
  function apply() {
    const nav = document.querySelector('.app-nav');
    if (!nav) { setTimeout(apply, 200); return; }
    if (nav.querySelector('.nav-hamburger')) return;

    // Criar hamburger toggle
    const toggle = document.createElement('button');
    toggle.className = 'nav-hamburger';
    toggle.innerHTML = '☰ Menu';
    toggle.setAttribute('aria-label', 'Abrir menu');
    toggle.addEventListener('click', () => {
      nav.classList.toggle('nav-open');
      toggle.innerHTML = nav.classList.contains('nav-open') ? '✕ Fechar' : '☰ Menu';
    });
    nav.parentElement.insertBefore(toggle, nav);

    // Fechar ao clicar em item
    nav.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        nav.classList.remove('nav-open');
        toggle.innerHTML = '☰ Menu';
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();

// ─── 4. LABS INTERATIVOS ────────────────────────────────────────────────────

// Banco de labs interativos por certificação
const INTERACTIVE_LABS = (function() {
  const url = location.pathname;

  const az900Labs = [
    {
      id: 'ilab-az900-01',
      title: 'Criar uma Storage Account no Azure Portal',
      domain: 'Storage',
      intro: 'Neste lab simulado, você vai criar uma Storage Account seguindo as boas práticas de nomenclatura e redundância.',
      steps: [
        {
          instruction: 'Qual é o nome correto para uma Storage Account de produção de uma empresa chamada "Contoso"?',
          type: 'choice',
          options: ['Contoso Storage Account', 'contosoprod2026', 'CONTOSO-STORAGE', 'contoso storage'],
          correct: 1,
          feedback: 'Correto! Nomes de Storage Account devem ser únicos globalmente, conter apenas letras minúsculas e números, entre 3 e 24 caracteres.',
        },
        {
          instruction: 'Você precisa garantir que os dados sobrevivam a uma falha de datacenter inteiro na mesma região. Qual redundância escolher?',
          type: 'choice',
          options: ['LRS (Locally Redundant Storage)', 'ZRS (Zone Redundant Storage)', 'GRS (Geo Redundant Storage)', 'Sem redundância'],
          correct: 1,
          feedback: 'Correto! ZRS replica os dados em 3 zonas de disponibilidade diferentes na mesma região. Se um datacenter cair, os outros dois continuam respondendo.',
        },
        {
          instruction: 'Para armazenar imagens de produtos que são acessadas com frequência, qual camada de acesso escolher?',
          type: 'choice',
          options: ['Archive', 'Cool', 'Hot', 'Cold'],
          correct: 2,
          feedback: 'Correto! A camada Hot é otimizada para dados acessados com frequência. Tem maior custo de armazenamento mas menor custo por operação de leitura.',
        },
        {
          instruction: 'Qual serviço do Azure Storage é o correto para armazenar imagens (arquivos binários)?',
          type: 'choice',
          options: ['Azure Files', 'Azure Table Storage', 'Azure Queue Storage', 'Azure Blob Storage'],
          correct: 3,
          feedback: 'Correto! Azure Blob Storage é o serviço para objetos não estruturados como imagens, vídeos, backups e documentos.',
        },
        {
          instruction: 'Para aplicar as configurações, em qual grupo de recursos você deve criar a Storage Account?',
          type: 'text',
          placeholder: 'Ex: rg-contoso-producao',
          validate: v => v.toLowerCase().startsWith('rg-') || v.toLowerCase().startsWith('rg'),
          feedback: 'Bom! A convenção recomendada é prefixar Resource Groups com "rg-" seguido do nome do projeto/ambiente. Isso facilita a organização e busca.',
        },
      ],
    },
    {
      id: 'ilab-az900-02',
      title: 'Configurar acesso com RBAC',
      domain: 'Identity, Access and Security',
      intro: 'Neste lab você vai aprender a dar o acesso correto a um usuário seguindo o princípio do menor privilégio.',
      steps: [
        {
          instruction: 'Um desenvolvedor precisa fazer deploy de aplicações no App Service, mas não deve poder apagar recursos. Qual papel atribuir?',
          type: 'choice',
          options: ['Owner', 'Reader', 'Contributor', 'User Access Administrator'],
          correct: 2,
          feedback: 'Correto! Contributor permite criar e gerenciar recursos mas não pode alterar permissões de acesso nem apagar recursos protegidos por lock.',
        },
        {
          instruction: 'Em qual escopo você deve atribuir o papel para que o desenvolvedor só acesse o Resource Group de desenvolvimento?',
          type: 'choice',
          options: ['Management Group', 'Subscription', 'Resource Group', 'Resource individual'],
          correct: 2,
          feedback: 'Correto! Sempre atribua no escopo mais restrito possível. Resource Group limita o acesso apenas aos recursos daquele grupo.',
        },
        {
          instruction: 'Um auditor precisa ver todos os recursos e logs mas sem poder modificar nada. Qual papel?',
          type: 'choice',
          options: ['Contributor', 'Reader', 'Owner', 'Security Reader'],
          correct: 1,
          feedback: 'Correto! O papel Reader concede acesso de leitura a todos os recursos sem permissão de criar, modificar ou deletar.',
        },
        {
          instruction: 'Quantas atribuições de papel (role assignments) são permitidas por subscription no Azure?',
          type: 'choice',
          options: ['500', '1.000', '2.000', '10.000'],
          correct: 2,
          feedback: 'Correto! O Azure suporta até 2.000 atribuições de papel por subscription. Por isso, use grupos em vez de atribuições individuais para escalar.',
        },
      ],
    },
    {
      id: 'ilab-az900-03',
      title: 'Estimar custos com Azure Pricing Calculator',
      domain: 'Azure Pricing',
      intro: 'Vamos simular o uso da calculadora de preços para estimar o custo de uma infraestrutura simples.',
      steps: [
        {
          instruction: 'Você precisa estimar o custo de recursos ANTES de criá-los no Azure. Qual ferramenta usar?',
          type: 'choice',
          options: ['Azure Cost Management', 'Azure Pricing Calculator', 'TCO Calculator', 'Azure Advisor'],
          correct: 1,
          feedback: 'Correto! O Azure Pricing Calculator (azure.microsoft.com/pricing/calculator) permite estimar custos de recursos antes de provisioná-los.',
        },
        {
          instruction: 'Uma VM Standard_D2s_v3 rodando 24h por dia durante 30 dias custa mais ou menos que a mesma VM rodando apenas 8h por dia?',
          type: 'choice',
          options: ['O mesmo — VMs têm custo fixo', 'Mais cara (24h) — cobrança por hora de uso', 'Menos cara (24h) — desconto por uso contínuo', 'Depende apenas do SO instalado'],
          correct: 1,
          feedback: 'Correto! VMs são cobradas por hora de alocação. 24h × 30 dias = 720 horas vs 8h × 30 dias = 240 horas. A VM 24h custa 3x mais.',
        },
        {
          instruction: 'Para comparar o custo de manter servidores físicos na empresa versus migrar para Azure, qual calculadora usar?',
          type: 'choice',
          options: ['Azure Pricing Calculator', 'Azure Cost Management', 'TCO Calculator', 'Azure Advisor'],
          correct: 2,
          feedback: 'Correto! O TCO (Total Cost of Ownership) Calculator compara custos on-premises vs Azure, incluindo hardware, energia, mão de obra e espaço físico.',
        },
        {
          instruction: 'Qual estratégia pode reduzir em até 72% o custo de uma VM que rodará por 3 anos?',
          type: 'choice',
          options: ['Usar uma VM menor', 'Desligar nos fins de semana', 'Reserved Instance de 3 anos', 'Mover para outra região'],
          correct: 2,
          feedback: 'Correto! Reserved Instances com compromisso de 1 ou 3 anos oferecem descontos de até 72% em relação ao preço pay-as-you-go.',
        },
      ],
    },
  ];

  const sc900Labs = [
    {
      id: 'ilab-sc900-01',
      title: 'Configurar MFA no Microsoft Entra ID',
      domain: 'Identidade e Acesso',
      intro: 'Neste lab simulado você vai configurar autenticação multifator seguindo as boas práticas de segurança.',
      steps: [
        {
          instruction: 'Qual é o método de MFA mais seguro contra ataques de phishing?',
          type: 'choice',
          options: ['SMS (código por texto)', 'Email com link de verificação', 'Chave de segurança FIDO2 (hardware)', 'Pergunta de segurança'],
          correct: 2,
          feedback: 'Correto! Chaves FIDO2 são resistentes a phishing porque a autenticação é vinculada ao domínio específico do site. SMS e email podem ser interceptados.',
        },
        {
          instruction: 'Um usuário esqueceu o celular em casa e não consegue receber o código MFA. O que o administrador deve fazer seguindo a política de Zero Trust?',
          type: 'choice',
          options: ['Desativar MFA permanentemente para esse usuário', 'Gerar um código de acesso temporário (TAP) com prazo de validade', 'Compartilhar a senha do admin com o usuário', 'Remover o usuário do Azure AD'],
          correct: 1,
          feedback: 'Correto! O Temporary Access Pass (TAP) permite acesso temporário sem MFA por um período configurável, mantendo o registro de auditoria sem comprometer a política.',
        },
        {
          instruction: 'Você quer bloquear automaticamente logins de países onde a empresa não opera. Qual recurso usar?',
          type: 'choice',
          options: ['Azure Firewall', 'Acesso Condicional com condição de localização', 'Network Security Group', 'Azure DDoS Protection'],
          correct: 1,
          feedback: 'Correto! O Acesso Condicional do Entra ID permite criar políticas baseadas em localização geográfica, bloqueando ou exigindo MFA para acessos de regiões não autorizadas.',
        },
      ],
    },
  ];

  const dp900Labs = [
    {
      id: 'ilab-dp900-01',
      title: 'Escolher o banco de dados certo no Azure',
      domain: 'Conceitos Core de Dados',
      intro: 'Neste lab você vai praticar a escolha do serviço de dados correto para cada cenário.',
      steps: [
        {
          instruction: 'Um e-commerce precisa de um banco para armazenar pedidos com tabelas de produtos, clientes e itens relacionados. Qual serviço escolher?',
          type: 'choice',
          options: ['Azure Cosmos DB', 'Azure Blob Storage', 'Azure SQL Database', 'Azure Data Lake'],
          correct: 2,
          feedback: 'Correto! Azure SQL Database é ideal para dados relacionais estruturados com tabelas e relacionamentos. Pedidos, produtos e clientes se encaixam perfeitamente no modelo relacional.',
        },
        {
          instruction: 'Uma rede social global precisa armazenar perfis de usuários com campos diferentes para cada perfil e latência abaixo de 10ms em qualquer país. Qual serviço?',
          type: 'choice',
          options: ['Azure SQL Database', 'Azure Cosmos DB', 'Azure Table Storage', 'Azure Files'],
          correct: 1,
          feedback: 'Correto! Azure Cosmos DB foi projetado para distribuição global com latência garantida abaixo de 10ms e esquema flexível — perfeito para perfis de usuários variados.',
        },
        {
          instruction: 'Um analista precisa rodar consultas complexas sobre 5 anos de dados de vendas para um relatório anual. Qual serviço é mais adequado?',
          type: 'choice',
          options: ['Azure SQL Database', 'Azure Cosmos DB', 'Azure Synapse Analytics', 'Azure Cache for Redis'],
          correct: 2,
          feedback: 'Correto! Azure Synapse Analytics (OLAP) é otimizado para queries analíticas sobre grandes volumes históricos. Azure SQL Database (OLTP) é para transações do dia a dia.',
        },
      ],
    },
  ];

  if (url.includes('sc900')) return sc900Labs;
  if (url.includes('dp900')) return dp900Labs;
  if (url.includes('ai901')) return [];
  if (url.includes('ms-project')) return [];
  return az900Labs; // AZ-900 default
})();

// Patch renderLabsMenu para adicionar labs interativos
(function patchLabs() {
  function waitForRenderer() {
    if (typeof RENDERERS === 'undefined' || !RENDERERS.labs) { setTimeout(waitForRenderer, 100); return; }
    const orig = RENDERERS.labs;
    RENDERERS.labs = function() {
      orig();
      if (!INTERACTIVE_LABS.length) return;
      setTimeout(() => {
        const el = document.getElementById('screen-labs');
        if (!el) return;
        const existing = document.getElementById('interactive-labs-section');
        if (existing) existing.remove();

        const p = currentProfile();
        const completed = p?.stats?.interactiveLabsCompleted || [];

        const section = document.createElement('div');
        section.id = 'interactive-labs-section';
        section.innerHTML = `
          <h3 class="ilab-section-title">🎮 Labs Interativos Simulados</h3>
          <p class="ilab-section-desc">Simule o portal Azure tomando decisões reais. Cada lab valida suas escolhas e explica o porquê.</p>
          <div class="ilab-grid">
            ${INTERACTIVE_LABS.map(lab => {
              const done = completed.includes(lab.id);
              return `
              <div class="ilab-card ${done ? 'ilab-done' : ''}">
                <div class="ilab-card-header">
                  <span class="ilab-domain-tag">${lab.domain}</span>
                  ${done ? '<span class="ilab-done-badge">✅ Concluído</span>' : ''}
                </div>
                <h4 class="ilab-title">${lab.title}</h4>
                <p class="ilab-intro">${lab.intro}</p>
                <div class="ilab-meta">${lab.steps.length} etapas interativas</div>
                <button class="btn btn-primary ilab-start-btn" onclick="startInteractiveLab('${lab.id}')">
                  ${done ? '🔄 Refazer lab' : '▶ Iniciar lab'}
                </button>
              </div>`;
            }).join('')}
          </div>`;
        el.appendChild(section);
      }, 100);
    };
  }
  waitForRenderer();
})();

window.startInteractiveLab = function(labId) {
  const lab = INTERACTIVE_LABS.find(l => l.id === labId);
  if (!lab) return;

  const el = document.getElementById('screen-labs');
  el.innerHTML = `
    <div class="ilab-session">
      <div class="ilab-session-header">
        <button class="btn btn-outline ilab-back" onclick="showScreen('labs')">← Voltar</button>
        <h2>${lab.title}</h2>
        <div class="ilab-progress-wrap">
          <div class="ilab-progress-bar">
            <div class="ilab-progress-fill" id="ilab-fill" style="width:0%"></div>
          </div>
          <span id="ilab-step-counter">Etapa 1/${lab.steps.length}</span>
        </div>
      </div>
      <div class="ilab-portal-frame">
        <div class="ilab-portal-header">
          <span class="ilab-portal-icon">🌐</span>
          <span class="ilab-portal-url">portal.azure.com</span>
        </div>
        <div id="ilab-step-area" class="ilab-step-area"></div>
      </div>
    </div>`;

  let stepIdx = 0;
  let correctCount = 0;

  function renderStep() {
    const step = lab.steps[stepIdx];
    const fill = Math.round((stepIdx / lab.steps.length) * 100);
    document.getElementById('ilab-fill').style.width = fill + '%';
    document.getElementById('ilab-step-counter').textContent = `Etapa ${stepIdx+1}/${lab.steps.length}`;

    const area = document.getElementById('ilab-step-area');
    area.innerHTML = `
      <div class="ilab-instruction">
        <span class="ilab-step-num">Etapa ${stepIdx+1}</span>
        <p>${step.instruction}</p>
      </div>
      ${step.type === 'choice' ? `
        <div class="ilab-choices" id="ilab-choices">
          ${step.options.map((opt, i) => `
            <button class="ilab-choice-btn" data-idx="${i}">${opt}</button>
          `).join('')}
        </div>
      ` : `
        <div class="ilab-text-input">
          <input type="text" id="ilab-text" placeholder="${step.placeholder || 'Digite sua resposta'}" />
          <button class="btn btn-primary" id="ilab-text-submit">Confirmar</button>
        </div>
      `}
      <div id="ilab-feedback" class="ilab-feedback hidden"></div>
    `;

    if (step.type === 'choice') {
      area.querySelectorAll('.ilab-choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const chosen = parseInt(btn.dataset.idx);
          const correct = chosen === step.correct;
          if (correct) correctCount++;
          area.querySelectorAll('.ilab-choice-btn').forEach((b, i) => {
            b.disabled = true;
            if (i === step.correct) b.classList.add('ilab-correct');
            else if (i === chosen && !correct) b.classList.add('ilab-wrong');
          });
          showFeedback(correct, step.feedback, stepIdx === lab.steps.length - 1);
        });
      });
    } else {
      document.getElementById('ilab-text-submit').addEventListener('click', () => {
        const val = document.getElementById('ilab-text').value.trim();
        const correct = step.validate ? step.validate(val) : val.length > 0;
        if (correct) correctCount++;
        document.getElementById('ilab-text').disabled = true;
        document.getElementById('ilab-text-submit').disabled = true;
        showFeedback(correct, step.feedback, stepIdx === lab.steps.length - 1);
      });
    }
  }

  function showFeedback(correct, text, isLast) {
    const fb = document.getElementById('ilab-feedback');
    fb.classList.remove('hidden');
    fb.className = `ilab-feedback ${correct ? 'ilab-fb-correct' : 'ilab-fb-wrong'}`;
    fb.innerHTML = `
      <span class="fb-icon">${correct ? '✅' : '💡'}</span>
      <span>${text}</span>
      <button class="btn btn-primary fb-next-btn" onclick="${isLast ? 'finishInteractiveLab()' : 'nextStep()'}">
        ${isLast ? '🏁 Concluir lab' : 'Próxima etapa →'}
      </button>`;
  }

  window.nextStep = function() { stepIdx++; renderStep(); };

  window.finishInteractiveLab = function() {
    const pct = Math.round(correctCount / lab.steps.length * 100);
    const xp = correctCount * 15;

    // Salvar conclusão
    const p = currentProfile();
    if (!p.stats.interactiveLabsCompleted) p.stats.interactiveLabsCompleted = [];
    if (!p.stats.interactiveLabsCompleted.includes(lab.id)) {
      p.stats.interactiveLabsCompleted.push(lab.id);
    }
    addXP(xp, 'Lab Interativo');

    document.getElementById('ilab-step-area').innerHTML = `
      <div class="ilab-result">
        <div class="ilab-result-icon">${pct >= 75 ? '🏆' : '📚'}</div>
        <h3>${pct >= 75 ? 'Excelente!' : 'Bom esforço!'}</h3>
        <p>Você acertou <strong>${correctCount} de ${lab.steps.length}</strong> etapas (${pct}%)</p>
        <p class="ilab-xp-gained">+${xp} XP ganhos</p>
        <div class="ilab-result-actions">
          <button class="btn btn-primary" onclick="showScreen('labs')">← Voltar aos labs</button>
          <button class="btn btn-outline" onclick="startInteractiveLab('${lab.id}')">🔄 Refazer</button>
        </div>
      </div>`;
    document.getElementById('ilab-fill').style.width = '100%';
    document.getElementById('ilab-step-counter').textContent = `✅ Concluído`;
  };

  renderStep();
};

// ─── 5. NOTIFICAÇÕES DE RETORNO ──────────────────────────────────────────────

(function checkReturnNotification() {
  function run() {
    if (typeof STATE === 'undefined' || !STATE.currentStudent) { setTimeout(run, 500); return; }
    const p = currentProfile();
    if (!p) return;

    const history = p.history || [];
    if (!history.length) return;

    const lastDate = history[0].date ? new Date(history[0].date) : null;
    if (!lastDate) return;

    const daysSince = Math.floor((Date.now() - lastDate.getTime()) / 86400000);
    const NOTIF_KEY = 'lastNotif_' + STATE.currentStudent;
    const lastNotif = localStorage.getItem(NOTIF_KEY);
    const today = new Date().toISOString().slice(0,10);
    if (lastNotif === today) return; // já mostrou hoje

    let msg = null;
    let action = null;

    if (daysSince === 0) return; // estudou hoje, sem notificação

    if (daysSince === 1) {
      // Perdeu o streak?
      const days = [...new Set(history.map(h => h.date?.slice(0,10)).filter(Boolean))].sort().reverse();
      let streak = 0;
      for (let i=0; i<days.length; i++) {
        if (i===0) { streak=1; continue; }
        if (Math.round((new Date(days[i-1])-new Date(days[i]))/86400000)===1) streak++;
        else break;
      }
      if (streak >= 2) {
        msg = `🔥 Você estava em uma sequência de <strong>${streak} dias</strong>! Estude hoje para não perder seu streak.`;
        action = { label: 'Estudar agora', screen: 'bank' };
      }
    } else if (daysSince >= 3 && daysSince < 7) {
      msg = `📚 Faz <strong>${daysSince} dias</strong> que você não estuda. Que tal 10 minutos no banco de questões?`;
      action = { label: 'Começar agora', screen: 'bank' };
    } else if (daysSince >= 7) {
      msg = `⚠️ Você ficou <strong>${daysSince} dias</strong> sem estudar. Retome com um simulado rápido de 10 questões!`;
      action = { label: 'Fazer simulado', screen: 'simulado' };
    }

    if (!msg) return;
    localStorage.setItem(NOTIF_KEY, today);

    // Exibir notificação
    setTimeout(() => {
      const notif = document.createElement('div');
      notif.id = 'return-notif';
      notif.className = 'return-notif';
      notif.innerHTML = `
        <div class="rn-body">
          <span class="rn-close" onclick="document.getElementById('return-notif').remove()">✕</span>
          <div class="rn-msg">${msg}</div>
          ${action ? `<button class="btn btn-primary rn-btn" onclick="showScreen('${action.screen}');document.getElementById('return-notif').remove()">${action.label}</button>` : ''}
        </div>`;
      document.body.appendChild(notif);
      // Auto-dismiss após 12s
      setTimeout(() => notif?.remove(), 12000);
    }, 1500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();

// ─── CSS ─────────────────────────────────────────────────────────────────────
(function injectStyles3() {
  const s = document.createElement('style');
  s.textContent = `
  /* LINK ARTIGO */
  .art-link { display:inline-flex; align-items:center; gap:0.375rem; margin-top:0.75rem; padding:0.5rem 1rem; background:var(--blue-light,#EBF3FF); border:1px solid var(--blue,#1A56DB); border-radius:8px; color:var(--blue,#1A56DB); font-size:0.8125rem; font-weight:600; text-decoration:none; transition:all 0.15s; }
  .art-link:hover { background:var(--blue,#1A56DB); color:#fff; }

  /* DASHBOARD INTELIGENTE */
  .smart-dash { margin-bottom:1.5rem; }
  .smart-card { display:flex; gap:1rem; background:var(--surface,#fff); border:1px solid var(--border,#e0e0e0); border-radius:14px; padding:1.25rem; margin-bottom:1rem; }
  .suggestion-card { border-left:4px solid var(--blue,#1A56DB); }
  .suggestion-icon { font-size:2rem; flex-shrink:0; }
  .suggestion-label { font-size:0.75rem; font-weight:700; color:var(--blue,#1A56DB); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:0.25rem; }
  .suggestion-text { font-size:0.9375rem; line-height:1.5; margin-bottom:0.75rem; }
  .suggestion-btn { font-size:0.8125rem; padding:0.4rem 1rem; }
  .smart-metrics { display:grid; grid-template-columns:repeat(4,1fr); gap:0.75rem; margin-bottom:1rem; }
  .smart-metric { background:var(--surface,#fff); border:1px solid var(--border,#e0e0e0); border-radius:12px; padding:0.875rem 0.5rem; text-align:center; }
  .smart-metric.clickable { cursor:pointer; transition:border-color 0.15s; }
  .smart-metric.clickable:hover { border-color:var(--blue,#1A56DB); }
  .metric-icon { display:block; font-size:1.25rem; margin-bottom:0.25rem; }
  .metric-val { display:block; font-size:1.375rem; font-weight:800; color:var(--blue,#1A56DB); }
  .metric-label { display:block; font-size:0.6875rem; color:var(--text-muted,#555); margin-top:0.125rem; }
  .smart-section-title { font-size:0.75rem; font-weight:700; color:var(--text-muted,#555); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:0.625rem; }
  .smart-domains { background:var(--surface,#fff); border:1px solid var(--border,#e0e0e0); border-radius:12px; padding:1rem; margin-bottom:1rem; }
  .smart-domain-bars { display:flex; flex-direction:column; gap:0.5rem; }
  .smart-domain-row { display:grid; grid-template-columns:160px 1fr 42px; gap:0.625rem; align-items:center; cursor:pointer; padding:4px; border-radius:6px; transition:background 0.15s; }
  .smart-domain-row:hover { background:var(--surface-alt,#f5f5f5); }
  .sdr-name { font-size:0.8125rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sdr-bar-bg { height:8px; background:var(--border,#e0e0e0); border-radius:4px; overflow:hidden; }
  .sdr-bar-fill { height:100%; border-radius:4px; transition:width 0.6s; }
  .sdr-pct { font-size:0.8125rem; font-weight:700; text-align:right; }
  .smart-next-ach { background:var(--surface,#fff); border:1px solid var(--border,#e0e0e0); border-radius:12px; padding:1rem; margin-bottom:1rem; }
  .ach-preview { display:flex; gap:1rem; align-items:center; }
  .ach-icon { font-size:2rem; }
  .ach-body strong { display:block; margin-bottom:0.25rem; }
  .ach-body p { font-size:0.8125rem; color:var(--text-muted,#555); margin:0; }
  .exam-date-modal { position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:200; display:flex; align-items:center; justify-content:center; }
  .exam-date-modal.hidden { display:none; }
  .edp-inner { background:#fff; border-radius:16px; padding:2rem; max-width:340px; width:90%; text-align:center; }
  .edp-inner h3 { margin-bottom:1rem; }
  .edp-inner input { width:100%; padding:0.625rem; border:1px solid var(--border,#e0e0e0); border-radius:8px; font-size:1rem; margin-bottom:1rem; }
  .edp-actions { display:flex; gap:0.75rem; justify-content:center; }
  @media(max-width:600px) { .smart-metrics { grid-template-columns:repeat(2,1fr); } .smart-domain-row { grid-template-columns:1fr 1fr 36px; } .sdr-name { font-size:0.75rem; } }

  /* MOBILE NAV */
  .nav-hamburger { display:none; background:var(--blue,#1A56DB); color:#fff; border:none; border-radius:8px; padding:0.5rem 1rem; font-size:0.875rem; font-weight:700; cursor:pointer; margin-bottom:0.375rem; }
  @media(max-width:768px) {
    .nav-hamburger { display:block; }
    .app-nav { display:none; flex-direction:column; gap:0.375rem; width:100%; background:var(--surface,#fff); border:1px solid var(--border,#e0e0e0); border-radius:12px; padding:0.75rem; margin-bottom:0.5rem; }
    .app-nav.nav-open { display:flex; }
    .app-nav .nav-btn { width:100%; text-align:left; border-radius:8px; }
    .oficial-body { grid-template-columns:1fr; }
    .oficial-nav-panel { position:static; }
    .table-wrap { overflow-x:auto; }
    .relatorio-table { min-width:600px; }
    .domains-grid { grid-template-columns:1fr; }
    .result-stats-row { grid-template-columns:repeat(2,1fr); }
    .rule-card { min-width:80px; padding:0.875rem 1rem; }
  }

  /* LABS INTERATIVOS */
  .ilab-section-title { font-size:1.125rem; font-weight:700; margin:2rem 0 0.375rem; }
  .ilab-section-desc { font-size:0.875rem; color:var(--text-muted,#555); margin-bottom:1rem; }
  .ilab-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1rem; }
  .ilab-card { background:var(--surface,#fff); border:1px solid var(--border,#e0e0e0); border-radius:12px; padding:1.25rem; }
  .ilab-card.ilab-done { border-color:#0E7A0D; background:#f0faf0; }
  .ilab-card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; }
  .ilab-domain-tag { font-size:0.7rem; font-weight:700; color:var(--blue,#1A56DB); text-transform:uppercase; letter-spacing:0.08em; }
  .ilab-done-badge { font-size:0.7rem; font-weight:700; color:#0E7A0D; }
  .ilab-title { font-size:0.9375rem; font-weight:700; margin-bottom:0.5rem; }
  .ilab-intro { font-size:0.8125rem; color:var(--text-muted,#555); line-height:1.5; margin-bottom:0.5rem; }
  .ilab-meta { font-size:0.75rem; color:var(--text-muted,#888); margin-bottom:0.75rem; }
  .ilab-session { padding-bottom:2rem; }
  .ilab-session-header { display:flex; align-items:center; gap:1rem; margin-bottom:1rem; flex-wrap:wrap; }
  .ilab-session-header h2 { flex:1; font-size:1rem; margin:0; }
  .ilab-progress-wrap { display:flex; align-items:center; gap:0.5rem; }
  .ilab-progress-bar { width:120px; height:6px; background:var(--border,#e0e0e0); border-radius:3px; overflow:hidden; }
  .ilab-progress-fill { height:100%; background:var(--blue,#1A56DB); border-radius:3px; transition:width 0.4s; }
  .ilab-portal-frame { border:2px solid var(--border,#e0e0e0); border-radius:12px; overflow:hidden; }
  .ilab-portal-header { background:#f3f4f6; padding:0.625rem 1rem; display:flex; align-items:center; gap:0.5rem; font-size:0.8125rem; color:var(--text-muted,#555); border-bottom:1px solid var(--border,#e0e0e0); }
  .ilab-portal-icon { font-size:1rem; }
  .ilab-portal-url { font-family:monospace; font-size:0.8125rem; }
  .ilab-step-area { padding:1.5rem; }
  .ilab-instruction { margin-bottom:1.25rem; }
  .ilab-step-num { display:inline-block; font-size:0.7rem; font-weight:700; color:var(--blue,#1A56DB); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:0.375rem; }
  .ilab-instruction p { font-size:1rem; font-weight:600; line-height:1.5; }
  .ilab-choices { display:flex; flex-direction:column; gap:0.625rem; margin-bottom:1rem; }
  .ilab-choice-btn { padding:0.75rem 1rem; border:1.5px solid var(--border,#e0e0e0); border-radius:10px; background:var(--surface,#fff); text-align:left; cursor:pointer; font-size:0.9375rem; transition:all 0.15s; }
  .ilab-choice-btn:hover:not(:disabled) { border-color:var(--blue,#1A56DB); background:var(--blue-light,#EBF3FF); }
  .ilab-choice-btn.ilab-correct { border-color:#0E7A0D; background:#d4edda; color:#0E7A0D; font-weight:700; }
  .ilab-choice-btn.ilab-wrong { border-color:#c0392b; background:#f8d7da; color:#c0392b; }
  .ilab-text-input { display:flex; gap:0.625rem; margin-bottom:1rem; flex-wrap:wrap; }
  .ilab-text-input input { flex:1; padding:0.625rem 0.875rem; border:1.5px solid var(--border,#e0e0e0); border-radius:8px; font-size:0.9375rem; min-width:200px; }
  .ilab-feedback { display:flex; align-items:flex-start; gap:0.75rem; padding:1rem; border-radius:10px; margin-top:0.75rem; flex-wrap:wrap; }
  .ilab-feedback.hidden { display:none; }
  .ilab-fb-correct { background:#d4edda; color:#0E7A0D; }
  .ilab-fb-wrong { background:#fff9e6; color:#D14B00; }
  .fb-icon { font-size:1.25rem; flex-shrink:0; }
  .fb-next-btn { margin-left:auto; font-size:0.8125rem; padding:0.4rem 1rem; }
  .ilab-result { text-align:center; padding:2rem; }
  .ilab-result-icon { font-size:3rem; margin-bottom:0.75rem; }
  .ilab-result h3 { font-size:1.375rem; margin-bottom:0.5rem; }
  .ilab-result p { color:var(--text-muted,#555); margin-bottom:0.375rem; }
  .ilab-xp-gained { font-size:1rem; font-weight:700; color:var(--blue,#1A56DB); margin-top:0.75rem; }
  .ilab-result-actions { display:flex; gap:0.75rem; justify-content:center; margin-top:1.5rem; flex-wrap:wrap; }

  /* NOTIFICAÇÃO DE RETORNO */
  .return-notif { position:fixed; bottom:1.5rem; right:1.5rem; z-index:300; max-width:360px; width:calc(100vw - 3rem); animation:slideUp 0.3s ease; }
  .rn-body { background:#fff; border:1px solid var(--border,#e0e0e0); border-left:4px solid var(--blue,#1A56DB); border-radius:12px; padding:1.25rem; box-shadow:0 8px 24px rgba(0,0,0,0.12); position:relative; }
  .rn-close { position:absolute; top:0.75rem; right:0.875rem; cursor:pointer; color:var(--text-muted,#888); font-size:1rem; line-height:1; }
  .rn-msg { font-size:0.9rem; line-height:1.5; margin-bottom:0.875rem; padding-right:1.5rem; }
  .rn-btn { font-size:0.8125rem; padding:0.4rem 1rem; }
  @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
  @media(max-width:480px) { .return-notif { bottom:1rem; right:1rem; left:1rem; width:auto; } }
  `;
  document.head.appendChild(s);
})();

console.log('[features3.js] Links artigos, Dashboard inteligente, Mobile, Labs interativos, Notificações carregados.');
