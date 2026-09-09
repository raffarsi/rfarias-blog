// ============================================================================
// labs-interactive.js — Labs com simulação de portal Azure
// Adiciona labs interativos com formulários que simulam ações reais
// ============================================================================

const INTERACTIVE_LABS = [
  {
    id: "ilab-vm-create",
    title: "Criar uma Máquina Virtual no Azure",
    icon: "🖥️",
    difficulty: "Iniciante",
    xp: 75,
    estimatedTime: "15 min",
    description: "Simule a criação de uma VM no portal Azure, escolhendo região, tamanho e configurações de disco.",
    steps: [
      {
        id: "step-rg",
        title: "1. Resource Group",
        instruction: "Primeiro, defina em qual Resource Group a VM será criada.",
        type: "select",
        label: "Resource Group:",
        options: ["Selecione...", "rg-producao", "rg-desenvolvimento", "rg-teste"],
        correct: 0, // qualquer valor não-padrão é correto
        hint: "Resource Groups organizam recursos relacionados. Escolha um adequado ao ambiente.",
        validation: (val) => val !== "Selecione..." ? null : "Por favor, selecione um Resource Group.",
      },
      {
        id: "step-name",
        title: "2. Nome da VM",
        instruction: "Defina um nome para a VM. Deve ser único no Resource Group.",
        type: "text",
        label: "Nome da VM:",
        placeholder: "Ex: vm-webserver-01",
        hint: "Nomes de VM devem ter entre 1-15 caracteres (Windows) ou 1-64 (Linux) e não podem conter espaços.",
        validation: (val) => {
          if (!val.trim()) return "Nome obrigatório.";
          if (val.includes(" ")) return "Nomes de VM não podem conter espaços.";
          if (val.length < 2) return "Nome muito curto.";
          return null;
        },
      },
      {
        id: "step-region",
        title: "3. Região",
        instruction: "Selecione a região onde a VM será hospedada.",
        type: "select",
        label: "Região:",
        options: ["Selecione...", "Brazil South (São Paulo)", "Brazil Southeast (Rio de Janeiro)", "East US", "West Europe"],
        correct: 1,
        hint: "Brazil South está em São Paulo. Escolha a região mais próxima dos seus usuários para menor latência.",
        validation: (val) => val !== "Selecione..." ? null : "Selecione uma região.",
      },
      {
        id: "step-image",
        title: "4. Imagem do Sistema Operacional",
        instruction: "Escolha o sistema operacional para a VM.",
        type: "select",
        label: "Imagem:",
        options: ["Selecione...", "Windows Server 2022 Datacenter", "Ubuntu Server 22.04 LTS", "Red Hat Enterprise Linux 9"],
        validation: (val) => val !== "Selecione..." ? null : "Selecione uma imagem.",
        hint: "Windows Server é para aplicações .NET e ambientes Microsoft. Ubuntu é a distro Linux mais comum na nuvem.",
      },
      {
        id: "step-size",
        title: "5. Tamanho da VM",
        instruction: "Selecione o tamanho (quantidade de CPU e RAM) da VM.",
        type: "select",
        label: "Tamanho:",
        options: [
          "Selecione...",
          "Standard_B1s (1 vCPU, 1 GB RAM) — Dev/Test",
          "Standard_D2s_v3 (2 vCPU, 8 GB RAM) — Propósito Geral",
          "Standard_E4s_v3 (4 vCPU, 32 GB RAM) — Memória Otimizada",
          "Standard_F8s_v2 (8 vCPU, 16 GB RAM) — Computação Otimizada",
        ],
        hint: "Para produção web use D-series. Para bancos de dados use E-series. Para dev/test B-series é econômico.",
        validation: (val) => val !== "Selecione..." ? null : "Selecione um tamanho.",
      },
      {
        id: "step-disk",
        title: "6. Tipo de Disco OS",
        instruction: "Escolha o tipo de disco do sistema operacional.",
        type: "select",
        label: "Tipo de disco OS:",
        options: ["Premium SSD (recomendado para produção)", "Standard SSD (dev/test)", "Standard HDD (baixo custo)"],
        hint: "Premium SSD tem menor latência e maior IOPS. Necessário para SLA de 99,9% em VM única.",
        validation: () => null,
        tip: "Premium SSD em uma única VM garante SLA de 99,9%. Availability Zones eleva para 99,99%.",
      },
      {
        id: "step-availability",
        title: "7. Opções de Disponibilidade",
        instruction: "Defina como a VM será protegida contra falhas.",
        type: "select",
        label: "Disponibilidade:",
        options: [
          "Sem redundância de infraestrutura (sem SLA adicional)",
          "Availability Zone (99,99% SLA — recomendado produção)",
          "Availability Set (99,95% SLA)",
          "Scale Set (auto-scaling horizontal)",
        ],
        hint: "Para produção crítica, use Availability Zone. Availability Set protege contra falhas de rack/manutenção.",
        validation: () => null,
      },
    ],
    summary: (answers) => `
      <div class="ilab-summary">
        <h4>✅ VM configurada com sucesso!</h4>
        <p>Você configurou uma VM com as seguintes definições:</p>
        <ul>
          <li><strong>Nome:</strong> ${answers['step-name'] || 'não definido'}</li>
          <li><strong>Região:</strong> ${answers['step-region'] || 'não definida'}</li>
          <li><strong>Imagem:</strong> ${answers['step-image'] || 'não definida'}</li>
          <li><strong>Tamanho:</strong> ${answers['step-size'] || 'não definido'}</li>
          <li><strong>Disco:</strong> ${answers['step-disk'] || 'não definido'}</li>
          <li><strong>Disponibilidade:</strong> ${answers['step-availability'] || 'não definida'}</li>
        </ul>
        <p>Em um ambiente real, clicaria em <strong>"Revisar + Criar"</strong> e o Azure validaria as configurações antes do deploy.</p>
      </div>`,
    quiz: [
      { q: "Uma VM com Premium SSD e sem configuração de disponibilidade tem qual SLA?", opts: ["99,5%","99,9%","99,95%","99,99%"], correct: 1 },
      { q: "Qual série de VM é mais adequada para um banco de dados que precisa de muita RAM?", opts: ["Série B","Série D","Série E","Série N"], correct: 2 },
      { q: "Qual opção de disponibilidade oferece o maior SLA para uma VM?", opts: ["Sem redundância","Availability Set","Availability Zone","Scale Set"], correct: 2 },
    ],
  },
  {
    id: "ilab-storage-create",
    title: "Criar e configurar uma Storage Account",
    icon: "💾",
    difficulty: "Iniciante",
    xp: 60,
    estimatedTime: "12 min",
    description: "Simule a criação de uma Storage Account com as configurações corretas de redundância e acesso.",
    steps: [
      {
        id: "step-name",
        title: "1. Nome da Storage Account",
        instruction: "Defina o nome. Deve ser globalmente único, 3-24 caracteres, só letras minúsculas e números.",
        type: "text",
        label: "Nome:",
        placeholder: "Ex: meustorage2026",
        hint: "Nomes de Storage Account são globalmente únicos no Azure — não podem ter maiúsculas, espaços ou hífens.",
        validation: (val) => {
          if (!val.trim()) return "Nome obrigatório.";
          if (/[A-Z\-\s]/.test(val)) return "Use apenas letras minúsculas e números (sem hífens ou maiúsculas).";
          if (val.length < 3 || val.length > 24) return "Nome deve ter entre 3 e 24 caracteres.";
          return null;
        },
      },
      {
        id: "step-region",
        title: "2. Região",
        instruction: "Escolha a região. A Storage Account deve ficar próxima de quem a usa.",
        type: "select",
        label: "Região:",
        options: ["Selecione...", "Brazil South", "Brazil Southeast", "East US", "West Europe"],
        validation: (val) => val !== "Selecione..." ? null : "Selecione uma região.",
        hint: "Para menor latência, escolha a mesma região das VMs ou aplicações que vão usar este storage.",
      },
      {
        id: "step-sku",
        title: "3. Redundância",
        instruction: "Escolha a redundância adequada ao nível de criticidade dos dados.",
        type: "select",
        label: "Redundância:",
        options: [
          "LRS — Locally Redundant (3 cópias, mesmo datacenter) — menor custo",
          "ZRS — Zone Redundant (3 zonas na mesma região)",
          "GRS — Geo Redundant (LRS + replicação em outra região)",
          "RA-GRS — Read-Access Geo Redundant (GRS + leitura do secundário)",
        ],
        hint: "Para dados críticos que não podem ser perdidos, GRS ou RA-GRS. Para dados recriáveis, LRS é suficiente.",
        validation: () => null,
        tip: "RA-GRS protege contra desastre de região E permite leitura do secundário sem esperar failover.",
      },
      {
        id: "step-tier",
        title: "4. Camada de Acesso Padrão",
        instruction: "Defina a camada de acesso padrão para os blobs desta conta.",
        type: "select",
        label: "Camada de acesso:",
        options: [
          "Hot — Dados acessados frequentemente (maior custo de armazenamento, menor de operação)",
          "Cool — Dados acessados raramente, mín. 30 dias (menor custo de armazenamento)",
        ],
        hint: "Hot para dados de uso diário. Cool para backups ou dados de auditoria consultados raramente.",
        validation: () => null,
      },
      {
        id: "step-access",
        title: "5. Acesso público a blobs",
        instruction: "Defina se o acesso anônimo aos blobs é permitido.",
        type: "select",
        label: "Acesso público a blobs:",
        options: [
          "Desabilitado (recomendado — use SAS tokens para compartilhar)",
          "Habilitado (qualquer pessoa pode ler blobs públicos)",
        ],
        hint: "Desabilitar acesso público é a prática de segurança recomendada. Use SAS tokens para compartilhamento controlado.",
        validation: () => null,
        tip: "Nunca habilite acesso público em contas com dados sensíveis. SAS tokens permitem compartilhar com controle.",
      },
    ],
    summary: (answers) => `
      <div class="ilab-summary">
        <h4>✅ Storage Account configurada!</h4>
        <ul>
          <li><strong>Nome:</strong> ${answers['step-name'] || 'não definido'}</li>
          <li><strong>Região:</strong> ${answers['step-region'] || 'não definida'}</li>
          <li><strong>Redundância:</strong> ${answers['step-sku'] || 'não definida'}</li>
          <li><strong>Camada:</strong> ${answers['step-tier'] || 'não definida'}</li>
          <li><strong>Acesso público:</strong> ${answers['step-access'] || 'não definido'}</li>
        </ul>
      </div>`,
    quiz: [
      { q: "Qual redundância mantém 3 cópias em datacenters físicos separados da mesma região?", opts: ["LRS","ZRS","GRS","RA-GRS"], correct: 1 },
      { q: "Nomes de Storage Account podem conter:", opts: ["Letras maiúsculas e hífens","Apenas letras minúsculas e números","Qualquer caractere especial","Espaços e underscore"], correct: 1 },
      { q: "Para compartilhar um arquivo por 24h sem habilitar acesso público, o que usar?", opts: ["Account Key","Acesso anônimo","SAS Token","RBAC Reader"], correct: 2 },
    ],
  },
  {
    id: "ilab-nsg-rules",
    title: "Configurar regras de NSG",
    icon: "🛡️",
    difficulty: "Intermediário",
    xp: 80,
    estimatedTime: "15 min",
    description: "Simule a criação de regras de Network Security Group para controlar tráfego de rede.",
    steps: [
      {
        id: "step-direction",
        title: "1. Direção do Tráfego",
        instruction: "A regra que você vai criar é para tráfego de entrada ou saída?",
        type: "select",
        label: "Direção:",
        options: ["Selecione...", "Inbound (Entrada) — tráfego que chega à VM", "Outbound (Saída) — tráfego que sai da VM"],
        validation: (val) => val !== "Selecione..." ? null : "Selecione a direção.",
        hint: "Inbound: controla quem pode se conectar à VM. Outbound: controla para onde a VM pode se conectar.",
      },
      {
        id: "step-priority",
        title: "2. Prioridade",
        instruction: "Defina a prioridade da regra (100-4096). Menor número = maior prioridade.",
        type: "text",
        label: "Prioridade:",
        placeholder: "Ex: 100",
        validation: (val) => {
          const n = parseInt(val);
          if (isNaN(n)) return "Digite um número válido.";
          if (n < 100 || n > 4096) return "Prioridade deve ser entre 100 e 4096.";
          return null;
        },
        hint: "Regras são avaliadas da menor para maior prioridade. Regras padrão (65000-65500) são as de menor prioridade.",
      },
      {
        id: "step-source",
        title: "3. Origem",
        instruction: "De onde vem o tráfego que esta regra controla?",
        type: "select",
        label: "Origem:",
        options: [
          "Any (Qualquer origem)",
          "Internet (Tráfego da internet pública)",
          "VirtualNetwork (Dentro da VNet)",
          "AzureLoadBalancer (Health probes do Load Balancer)",
          "IP específico ou range CIDR",
        ],
        validation: () => null,
        hint: "Service Tags (Internet, VirtualNetwork) são grupos de IPs gerenciados pela Microsoft — mais fácil que gerenciar IPs individuais.",
      },
      {
        id: "step-port",
        title: "4. Porta de Destino",
        instruction: "Qual porta esta regra deve controlar?",
        type: "text",
        label: "Porta destino:",
        placeholder: "Ex: 80, 443, 3389, 8080, ou * para todas",
        validation: (val) => {
          if (!val.trim()) return "Porta obrigatória.";
          return null;
        },
        hint: "Portas comuns: 80 (HTTP), 443 (HTTPS), 22 (SSH), 3389 (RDP), 3306 (MySQL), 1433 (SQL Server).",
      },
      {
        id: "step-action",
        title: "5. Ação",
        instruction: "O que a regra deve fazer quando o tráfego coincidir?",
        type: "select",
        label: "Ação:",
        options: ["Allow (Permitir)", "Deny (Negar/Bloquear)"],
        validation: () => null,
        hint: "NSGs são listas de allowlist/denylist. Tráfego não coberto por nenhuma regra é negado pelas regras padrão.",
        tip: "NSGs são stateful — se você permitir tráfego de entrada, a resposta de saída é automaticamente permitida.",
      },
    ],
    summary: (answers) => `
      <div class="ilab-summary">
        <h4>✅ Regra de NSG configurada!</h4>
        <div class="nsg-rule-preview">
          <table>
            <tr><th>Propriedade</th><th>Valor</th></tr>
            <tr><td>Direção</td><td>${answers['step-direction']||'—'}</td></tr>
            <tr><td>Prioridade</td><td>${answers['step-priority']||'—'}</td></tr>
            <tr><td>Origem</td><td>${answers['step-source']||'—'}</td></tr>
            <tr><td>Porta destino</td><td>${answers['step-port']||'—'}</td></tr>
            <tr><td>Ação</td><td>${answers['step-action']||'—'}</td></tr>
          </table>
        </div>
      </div>`,
    quiz: [
      { q: "Qual é a ordem de avaliação das regras de NSG?", opts: ["Maior número primeiro","Menor número (maior prioridade) primeiro","Ordem de criação","Alfabética pelo nome"], correct: 1 },
      { q: "NSGs são stateful. O que isso significa?", opts: ["Guardam estado de autenticação","Resposta de tráfego permitido é automaticamente liberada","Regras são salvas permanentemente","Filtram por estado HTTP"], correct: 1 },
      { q: "O que a Service Tag 'Internet' representa?", opts: ["Somente IPs brasileiros","Todos os IPs públicos fora do Azure","Apenas IPs do Azure","IPs da subnet local"], correct: 1 },
    ],
  },
];

// ── Renderer de Labs Interativos ────────────────────────────────────────────

RENDERERS.ilabs = function renderILabs() {
  const el = document.getElementById('screen-ilabs') || createScreen('ilabs');
  const p = currentProfile();
  const completed = (p.stats?.ilabsCompleted || []);

  const cardsHtml = INTERACTIVE_LABS.map(lab => {
    const done = completed.includes(lab.id);
    return `
    <div class="ilab-card ${done ? 'ilab-done' : ''}">
      <div class="ilab-card-header">
        <span class="ilab-icon">${lab.icon}</span>
        <div>
          <div class="ilab-title">${lab.title}</div>
          <div class="ilab-meta">
            <span class="ilab-diff">${lab.difficulty}</span>
            <span>⏱ ${lab.estimatedTime}</span>
            <span>⭐ ${lab.xp} XP</span>
            ${done ? '<span class="ilab-badge-done">✅ Concluído</span>' : ''}
          </div>
        </div>
      </div>
      <p class="ilab-desc">${lab.description}</p>
      <button class="btn btn-primary" onclick="startILab('${lab.id}')">
        ${done ? '🔄 Refazer' : '▶️ Iniciar Lab'}
      </button>
    </div>`;
  }).join('');

  el.innerHTML = `
    <h2>🧪 Laboratórios Interativos</h2>
    <p class="lead">Simule ações reais no portal Azure. Preencha os formulários como se estivesse configurando recursos de verdade.</p>
    <div class="ilab-grid">${cardsHtml}</div>
  `;
};

window.startILab = function(labId) {
  const lab = INTERACTIVE_LABS.find(l => l.id === labId);
  if (!lab) return;
  const el = document.getElementById('screen-ilabs');
  const answers = {};
  let currentStep = 0;

  function renderStep() {
    const step = lab.steps[currentStep];
    const progress = Math.round((currentStep / lab.steps.length) * 100);
    const isLast = currentStep === lab.steps.length - 1;

    let inputHtml = '';
    if (step.type === 'select') {
      const opts = step.options.map(o => `<option value="${o}">${o}</option>`).join('');
      inputHtml = `<select id="ilab-input" class="ilab-select">${opts}</select>`;
    } else {
      inputHtml = `<input type="text" id="ilab-input" class="ilab-text" placeholder="${step.placeholder || ''}" value="${answers[step.id] || ''}">`;
    }

    el.innerHTML = `
      <div class="ilab-header">
        <button class="btn btn-outline btn-sm" onclick="RENDERERS.ilabs()">← Voltar</button>
        <span class="ilab-lab-title">${lab.icon} ${lab.title}</span>
      </div>
      <div class="ilab-progress-bar"><div style="width:${progress}%"></div></div>
      <div class="ilab-step-counter">Passo ${currentStep + 1} de ${lab.steps.length}</div>

      <div class="ilab-step-card">
        <h3>${step.title}</h3>
        <p class="ilab-instruction">${step.instruction}</p>
        <label class="ilab-label">${step.label}</label>
        ${inputHtml}
        <div class="ilab-error" id="ilab-error"></div>
        <div class="ilab-hint">💡 ${step.hint}</div>
        ${step.tip ? `<div class="ilab-tip">📌 ${step.tip}</div>` : ''}
      </div>

      <div class="ilab-nav">
        ${currentStep > 0 ? `<button class="btn btn-outline" onclick="ilabPrev()">← Anterior</button>` : '<div></div>'}
        <button class="btn btn-primary" id="ilab-next-btn">${isLast ? '✅ Concluir Lab' : 'Próximo →'}</button>
      </div>
    `;

    // Restore previous answer if exists
    const input = document.getElementById('ilab-input');
    if (answers[step.id] && step.type !== 'select') input.value = answers[step.id];

    document.getElementById('ilab-next-btn').addEventListener('click', () => {
      const val = document.getElementById('ilab-input').value;
      const error = step.validation ? step.validation(val) : null;
      if (error) {
        document.getElementById('ilab-error').textContent = error;
        return;
      }
      answers[step.id] = val;
      if (isLast) {
        showILabSummary(lab, answers);
      } else {
        currentStep++;
        renderStep();
      }
    });
  }

  window.ilabPrev = function() {
    if (currentStep > 0) { currentStep--; renderStep(); }
  };

  renderStep();
};

function showILabSummary(lab, answers) {
  const el = document.getElementById('screen-ilabs');

  // Quiz
  const quizHtml = lab.quiz.map((q, qi) => `
    <div class="ilab-quiz-q" id="qlq-${qi}">
      <p><strong>${qi + 1}. ${q.q}</strong></p>
      <div class="ilab-quiz-opts">
        ${q.opts.map((o, oi) => `
          <button class="ilab-quiz-opt" onclick="checkILabQuiz(${qi}, ${oi}, ${q.correct})" id="qlq-${qi}-${oi}">
            ${String.fromCharCode(65+oi)}) ${o}
          </button>`).join('')}
      </div>
      <div class="ilab-quiz-feedback" id="qlqf-${qi}"></div>
    </div>`).join('');

  el.innerHTML = `
    ${lab.summary(answers)}
    <h3 style="margin-top:1.5rem">📝 Verificação de Aprendizagem</h3>
    <p>Responda as questões para finalizar o lab e ganhar ${lab.xp} XP.</p>
    <div class="ilab-quiz">${quizHtml}</div>
    <button class="btn btn-primary btn-block" id="finish-ilab-btn" style="display:none" onclick="finishILab('${lab.id}', ${lab.xp})">
      🏆 Finalizar e ganhar ${lab.xp} XP
    </button>
  `;

  window._ilabCorrect = 0;
  window._ilabTotal = lab.quiz.length;
}

window.checkILabQuiz = function(qi, chosen, correct) {
  const feedbackEl = document.getElementById(`qlqf-${qi}`);
  const opts = document.querySelectorAll(`#qlq-${qi} .ilab-quiz-opt`);
  opts.forEach(b => b.disabled = true);
  opts[correct].classList.add('ilab-quiz-correct');
  if (chosen !== correct) {
    opts[chosen].classList.add('ilab-quiz-wrong');
    feedbackEl.textContent = '❌ Incorreto. Veja a resposta correta destacada.';
    feedbackEl.style.color = '#c0392b';
  } else {
    feedbackEl.textContent = '✅ Correto!';
    feedbackEl.style.color = '#0E7A0D';
    window._ilabCorrect++;
  }
  // Check if all answered
  const allAnswered = document.querySelectorAll('.ilab-quiz-opt:disabled').length === window._ilabTotal * 4;
  if (document.querySelectorAll('.ilab-quiz-feedback:not(:empty)').length === window._ilabTotal) {
    document.getElementById('finish-ilab-btn').style.display = 'block';
  }
};

window.finishILab = function(labId, xp) {
  const p = currentProfile();
  if (!p.stats.ilabsCompleted) p.stats.ilabsCompleted = [];
  if (!p.stats.ilabsCompleted.includes(labId)) {
    p.stats.ilabsCompleted.push(labId);
    addXP(xp, 'Lab Interativo');
    showToast(`🎉 Lab concluído! +${xp} XP`);
  }
  saveState();
  RENDERERS.ilabs();
};

// CSS dos labs interativos
(function() {
  const s = document.createElement('style');
  s.textContent = `
  .ilab-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1rem; }
  .ilab-card { background:var(--surface,#fff); border:1px solid var(--border,#e0e0e0); border-radius:14px; padding:1.25rem; }
  .ilab-card.ilab-done { border-color:#0E7A0D; }
  .ilab-card-header { display:flex; gap:0.875rem; align-items:flex-start; margin-bottom:0.75rem; }
  .ilab-icon { font-size:2rem; flex-shrink:0; }
  .ilab-title { font-weight:700; font-size:0.9375rem; margin-bottom:0.25rem; }
  .ilab-meta { display:flex; gap:0.5rem; flex-wrap:wrap; font-size:0.75rem; color:var(--text-muted,#555); }
  .ilab-diff { background:var(--blue-light,#EBF3FF); color:var(--blue,#1A56DB); font-weight:700; padding:1px 8px; border-radius:20px; }
  .ilab-badge-done { background:#d4edda; color:#0E7A0D; font-weight:700; padding:1px 8px; border-radius:20px; }
  .ilab-desc { font-size:0.875rem; color:var(--text-muted,#555); margin-bottom:0.875rem; line-height:1.5; }
  .ilab-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem; }
  .ilab-lab-title { font-weight:700; font-size:0.9375rem; }
  .ilab-progress-bar { height:6px; background:var(--border,#e0e0e0); border-radius:3px; margin-bottom:0.375rem; overflow:hidden; }
  .ilab-progress-bar div { height:100%; background:var(--blue,#1A56DB); border-radius:3px; transition:width 0.4s; }
  .ilab-step-counter { font-size:0.75rem; color:var(--text-muted,#555); margin-bottom:1rem; }
  .ilab-step-card { background:var(--surface,#fff); border:1px solid var(--border,#e0e0e0); border-radius:12px; padding:1.5rem; margin-bottom:1rem; }
  .ilab-step-card h3 { margin-bottom:0.5rem; font-size:1rem; }
  .ilab-instruction { color:var(--text-muted,#555); margin-bottom:1rem; line-height:1.6; }
  .ilab-label { display:block; font-weight:600; font-size:0.875rem; margin-bottom:0.375rem; }
  .ilab-select, .ilab-text { width:100%; padding:0.625rem 0.875rem; border:1.5px solid var(--border,#e0e0e0); border-radius:8px; font-size:0.9375rem; background:var(--surface,#fff); color:var(--text,#1a1a1a); margin-bottom:0.5rem; }
  .ilab-select:focus, .ilab-text:focus { outline:none; border-color:var(--blue,#1A56DB); }
  .ilab-error { color:#c0392b; font-size:0.8125rem; min-height:1.2em; margin-bottom:0.25rem; }
  .ilab-hint { background:#f8f9fa; border-radius:8px; padding:0.5rem 0.75rem; font-size:0.8125rem; color:var(--text-muted,#555); margin-top:0.5rem; }
  .ilab-tip { background:#fff9e6; border-left:3px solid #f39c12; border-radius:0 8px 8px 0; padding:0.5rem 0.75rem; font-size:0.8125rem; margin-top:0.5rem; }
  .ilab-nav { display:flex; justify-content:space-between; align-items:center; }
  .ilab-summary { background:var(--surface,#fff); border:1px solid #0E7A0D; border-radius:12px; padding:1.25rem; margin-bottom:1.25rem; }
  .ilab-summary h4 { color:#0E7A0D; margin-bottom:0.5rem; }
  .ilab-summary ul { padding-left:1.25rem; line-height:2; font-size:0.875rem; }
  .nsg-rule-preview table { width:100%; border-collapse:collapse; font-size:0.875rem; }
  .nsg-rule-preview th, .nsg-rule-preview td { padding:0.375rem 0.75rem; border:1px solid var(--border,#e0e0e0); }
  .nsg-rule-preview th { background:var(--blue,#1A56DB); color:#fff; }
  .ilab-quiz { display:flex; flex-direction:column; gap:1rem; margin-bottom:1rem; }
  .ilab-quiz-q { background:var(--surface,#fff); border:1px solid var(--border,#e0e0e0); border-radius:10px; padding:1rem; }
  .ilab-quiz-opts { display:flex; flex-direction:column; gap:0.375rem; margin:0.625rem 0; }
  .ilab-quiz-opt { text-align:left; padding:0.5rem 0.875rem; border:1.5px solid var(--border,#e0e0e0); border-radius:8px; cursor:pointer; background:var(--surface,#fff); transition:all 0.15s; font-size:0.875rem; }
  .ilab-quiz-opt:hover:not(:disabled) { border-color:var(--blue,#1A56DB); }
  .ilab-quiz-opt.ilab-quiz-correct { border-color:#0E7A0D; background:#d4edda; color:#0E7A0D; font-weight:700; }
  .ilab-quiz-opt.ilab-quiz-wrong { border-color:#c0392b; background:#f8d7da; color:#c0392b; }
  .ilab-quiz-feedback { font-size:0.8125rem; margin-top:0.25rem; }
  @media(max-width:640px) { .ilab-grid { grid-template-columns:1fr; } }
  `;
  document.head.appendChild(s);
})();

console.log('[labs-interactive.js] 3 labs interativos carregados.');
