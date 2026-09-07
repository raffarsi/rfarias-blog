// ============================================================================
// MS Project Prep Hub — Motor da Aplicação (js/app.js)
// Responsável por: identificação do aluno, navegação da SPA, Banco de
// Questões (prática), Simulado configurável (Modo Prova / Modo Estudo),
// gamificação por aluno (XP/níveis/conquistas), competição entre alunos
// (registro de atividades + rankings por modalidade), persistência em
// localStorage e alternância de tema claro/escuro.
// Depende de QUESTION_BANK (js/questions.js), Games (js/games.js) e LAB_BANK
// (js/labs.js), que devem ser carregados antes deste arquivo no index.html.
// Mesmo motor do DP-900/AZ-900/AI-901 Prep Hub; usa uma chave de
// armazenamento própria para não colidir com o progresso salvo das outras
// trilhas.
// ============================================================================

const STORAGE_KEY = "az900_prep_hub_msproject_state_v1";

// ----------------------------------------------------------------------------
// 1) ESTADO E PERSISTÊNCIA (multi-aluno)
// ----------------------------------------------------------------------------
function defaultStudentProfile(turma) {
  return {
    turma: turma || "",
    xp: 0,
    unlockedAchievements: [],
    stats: {
      totalAnswered: 0,
      totalCorrect: 0,
      domainsSeen: [],          // domínios com ao menos 1 acerto
      domainCorrectIds: {},     // domínio -> [ids de questões já acertadas] (maestria)
      simuladosCompleted: 0,
      perfectSimulados: 0,
      gamesCompleted: {
        crossword: false, crosswordCount: 0,
        wordsearch: false, wordsearchCount: 0,
        dragdropSets: [],
        lightning: false, lightningCount: 0
      },
      gamesXP: { crossword: 0, wordsearch: 0, dragdrop: 0, lightning: 0 },
      labsCompleted: [], // ids dos laboratórios concluídos (nota >= 2/3 no quiz)
      labXP: 0
    },
    history: [] // histórico de simulados
  };
}

function defaultState() {
  return {
    version: 2,
    currentStudent: null,
    theme: "light",
    students: {},
    activityLog: [] // {student, turma, type, date, xp, timeSpent, score, total, percent}
  };
}

let STATE = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (parsed.version !== 2) return defaultState();
    return Object.assign(defaultState(), parsed);
  } catch (e) {
    console.warn("Falha ao carregar estado salvo, iniciando do zero.", e);
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE));
}

function currentProfile() {
  if (!STATE.currentStudent) return null;
  return STATE.students[STATE.currentStudent];
}

function ensureStudent(name, turma) {
  if (!STATE.students[name]) {
    STATE.students[name] = defaultStudentProfile(turma);
  } else if (turma) {
    STATE.students[name].turma = turma;
  }
  STATE.currentStudent = name;
  saveState();
}

function logActivity(type, data) {
  const p = currentProfile();
  STATE.activityLog.push(Object.assign({
    student: STATE.currentStudent,
    turma: p ? p.turma : "",
    type,
    date: new Date().toISOString(),
  }, data));
  if (STATE.activityLog.length > 2000) STATE.activityLog.shift(); // evita crescimento infinito
  saveState();
}

function secondsSince(startedAtMs) {
  return Math.max(0, Math.round((Date.now() - startedAtMs) / 1000));
}

// ----------------------------------------------------------------------------
// 2) SISTEMA DE XP E NÍVEIS
// ----------------------------------------------------------------------------
function xpNeededForLevel(level) {
  return 150 * level; // custo crescente por nível
}

function levelInfo(xp) {
  let level = 1;
  let remaining = xp;
  let need = xpNeededForLevel(level);
  while (remaining >= need) {
    remaining -= need;
    level++;
    need = xpNeededForLevel(level);
  }
  return { level, xpIntoLevel: remaining, xpForNext: need, percent: Math.round((remaining / need) * 100) };
}

function addXP(amount, source) {
  const p = currentProfile();
  if (!amount || !p) return;
  const before = levelInfo(p.xp).level;
  p.xp += amount;
  const after = levelInfo(p.xp).level;
  saveState();
  updateXPIndicator();
  showToast(`+${amount} XP${source ? " · " + source : ""}`);
  if (after > before) {
    showToast(`🎉 Parabéns ${STATE.currentStudent}, você alcançou o nível ${after}!`, true);
  }
  runAchievementCheck();
}

function updateXPIndicator() {
  const p = currentProfile();
  const bar = document.getElementById("xp-bar-fill");
  const label = document.getElementById("xp-label");
  const badge = document.getElementById("student-badge");
  if (!p) { if (badge) badge.textContent = ""; return; }
  const info = levelInfo(p.xp);
  if (bar) bar.style.width = info.percent + "%";
  if (label) label.textContent = `Nível ${info.level} · ${info.xpIntoLevel}/${info.xpForNext} XP`;
  if (badge) badge.textContent = `👤 ${STATE.currentStudent}${p.turma ? " · " + p.turma : ""}`;
}

// ----------------------------------------------------------------------------
// 3) CONQUISTAS (gerais + maestria por domínio)
// ----------------------------------------------------------------------------
const GENERAL_ACHIEVEMENTS = [
  { id: "primeiro_passo", name: "Primeiro Passo", icon: "🥉", desc: "Complete seu primeiro simulado.",
    check: p => p.stats.simuladosCompleted >= 1 },
  { id: "dedicado", name: "Dedicado", icon: "📚", desc: "Complete 5 simulados.",
    check: p => p.stats.simuladosCompleted >= 5 },
  { id: "mestre_simulados", name: "Mestre dos Simulados", icon: "🏆", desc: "Complete 5+ simulados com média de acerto acima de 80%.",
    check: p => p.history.length >= 5 && (p.history.reduce((a, h) => a + h.percent, 0) / p.history.length) >= 80 },
  { id: "cem_questoes", name: "Estudioso", icon: "💯", desc: "Responda 100 questões no total (prática + simulados).",
    check: p => p.stats.totalAnswered >= 100 },
  { id: "quinhentas_questoes", name: "Enciclopédia Viva", icon: "🧠", desc: "Responda 500 questões no total.",
    check: p => p.stats.totalAnswered >= 500 },
  { id: "todos_dominios", name: "Panorama Completo", icon: "🗺️", desc: "Acerte ao menos uma questão de cada um dos 5 domínios do curso.",
    check: p => p.stats.domainsSeen.length >= 5 },
  { id: "perfeccionista", name: "Perfeccionista", icon: "🎯", desc: "Obtenha 100% de acerto em um simulado com 20 ou mais questões.",
    check: p => p.stats.perfectSimulados >= 1 },
  { id: "maratonista", name: "Maratonista", icon: "🏃", desc: "Complete um simulado de 100 questões.",
    check: p => p.history.some(h => h.total >= 100) },
  { id: "mestre_cruzadinha", name: "Mestre das Palavras", icon: "🧩", desc: "Complete a cruzadinha corretamente.",
    check: p => p.stats.gamesCompleted.crossword },
  { id: "cacador_palavras", name: "Caçador de Palavras", icon: "🔍", desc: "Encontre todas as palavras do caça-palavras.",
    check: p => p.stats.gamesCompleted.wordsearch },
  { id: "rei_caca_palavras", name: "Rei do Caça-Palavras", icon: "👑", desc: "Complete o caça-palavras 3 vezes.",
    check: p => (p.stats.gamesCompleted.wordsearchCount || 0) >= 3 },
  { id: "combinador", name: "Combinador", icon: "🎯", desc: "Complete os 4 conjuntos do jogo de associação.",
    check: p => (p.stats.gamesCompleted.dragdropSets || []).length >= 4 },
  { id: "velocista", name: "Velocista", icon: "⚡", desc: "Complete o Desafio Relâmpago.",
    check: p => p.stats.gamesCompleted.lightning },
  { id: "nivel_5", name: "Ascensão", icon: "⭐", desc: "Alcance o nível 5.",
    check: p => levelInfo(p.xp).level >= 5 },
  { id: "especialista_ia", name: "Especialista em Projetos", icon: "🌟", desc: "Alcance o nível 10.",
    check: p => levelInfo(p.xp).level >= 10 },
  { id: "praticante", name: "Praticante", icon: "🧪", desc: "Complete seu primeiro laboratório prático dentro do Microsoft Project.",
    check: p => (p.stats.labsCompleted || []).length >= 1 },
  { id: "mao_na_massa", name: "Mão na Massa", icon: "🛠️", desc: "Complete 5 laboratórios práticos.",
    check: p => (p.stats.labsCompleted || []).length >= 5 },
  { id: "arquiteto_ia", name: "Mestre em Projetos", icon: "📐", desc: "Complete todos os 10 laboratórios práticos.",
    check: p => (p.stats.labsCompleted || []).length >= LAB_BANK.length },
];

// Uma conquista "Expert em <domínio>" para cada um dos 5 domínios do curso,
// desbloqueada quando o aluno acerta ao menos 16 das 40 questões daquele
// domínio (contabilizando questões distintas respondidas corretamente).
const DOMAIN_ACHIEVEMENTS = allDomainsStatic().map(domain => ({
  id: "expert_" + domain.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
  name: "Expert em " + domain,
  icon: "🎓",
  desc: `Acerte ao menos 16 das 40 questões do domínio "${domain}".`,
  check: p => ((p.stats.domainCorrectIds || {})[domain] || []).length >= 16
}));

function allDomainsStatic() {
  return [...new Set(QUESTION_BANK.map(q => q.domain))];
}

const ACHIEVEMENTS = GENERAL_ACHIEVEMENTS.concat(DOMAIN_ACHIEVEMENTS);

function runAchievementCheck() {
  const p = currentProfile();
  if (!p) return;
  let changed = false;
  ACHIEVEMENTS.forEach(a => {
    if (!p.unlockedAchievements.includes(a.id) && a.check(p)) {
      p.unlockedAchievements.push(a.id);
      showToast(`🏅 Conquista desbloqueada: ${a.name}`, true);
      changed = true;
    }
  });
  if (changed) saveState();
}

// ----------------------------------------------------------------------------
// 4) TOASTS (feedback visual rápido)
// ----------------------------------------------------------------------------
function showToast(message, important) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast" + (important ? " toast-important" : "");
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast-show"));
  setTimeout(() => {
    toast.classList.remove("toast-show");
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ----------------------------------------------------------------------------
// 5) TEMA CLARO/ESCURO
// ----------------------------------------------------------------------------
function applyTheme() {
  document.documentElement.setAttribute("data-theme", STATE.theme);
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.textContent = STATE.theme === "dark" ? "☀️ Modo claro" : "🌙 Modo escuro";
}

function toggleTheme() {
  STATE.theme = STATE.theme === "dark" ? "light" : "dark";
  saveState();
  applyTheme();
}

// ----------------------------------------------------------------------------
// 6) NAVEGAÇÃO ENTRE TELAS
// ----------------------------------------------------------------------------
const RENDERERS = {}; // screenName -> function

function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const target = document.getElementById("screen-" + name);
  if (target) target.classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.screen === name));
  if (RENDERERS[name]) RENDERERS[name]();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function initNav() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => showScreen(btn.dataset.screen));
  });
  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) themeBtn.addEventListener("click", toggleTheme);
  const switchBtn = document.getElementById("switch-student-btn");
  if (switchBtn) switchBtn.addEventListener("click", goToLogin);
  const backBtn = document.getElementById("back-to-hub-btn");
  if (backBtn) backBtn.addEventListener("click", () => { window.location.href = "../index.html"; });
}

function enterApp() {
  document.body.classList.remove("pre-auth");
  updateXPIndicator();
  showScreen("dashboard");
}

function goToLogin() {
  document.body.classList.add("pre-auth");
  showScreen("login");
}

// ----------------------------------------------------------------------------
// 7) IDENTIFICAÇÃO DO ALUNO
// ----------------------------------------------------------------------------
RENDERERS.login = function renderLogin() {
  const el = document.getElementById("screen-login");
  const lastName = STATE.currentStudent || "";
  const lastTurma = (STATE.students[lastName] && STATE.students[lastName].turma) || "";
  el.innerHTML = `
    <div class="login-card">
      <h2>Identifique-se para começar</h2>
      <p class="lead">Seu nome será usado nas mensagens da plataforma, no histórico e nos rankings.</p>
      <label for="login-name">Digite seu nome:</label>
      <input type="text" id="login-name" placeholder="Ex.: Rafael" value="${lastName.replace(/"/g, "&quot;")}" autofocus />
      <label for="login-turma">Turma (opcional):</label>
      <input type="text" id="login-turma" placeholder="Ex.: 3A" value="${lastTurma.replace(/"/g, "&quot;")}" />
      <button class="btn btn-primary" id="login-enter-btn">Entrar</button>
    </div>
  `;
  const nameInput = document.getElementById("login-name");
  const doLogin = () => {
    const name = nameInput.value.trim();
    if (!name) { showToast("Digite seu nome para continuar."); return; }
    const turma = document.getElementById("login-turma").value.trim();
    ensureStudent(name, turma);
    enterApp();
    showToast(`👋 Bem-vindo(a), ${name}!`, true);
  };
  document.getElementById("login-enter-btn").addEventListener("click", doLogin);
  nameInput.addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });
};

// ----------------------------------------------------------------------------
// 8) UTILITÁRIOS DE QUESTÕES
// ----------------------------------------------------------------------------
function shuffleArr(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function prepareQuestion(q) {
  const order = shuffleArr([0, 1, 2, 3]);
  return {
    id: q.id,
    domain: q.domain,
    nivel: q.nivel,
    q: q.q,
    concept: q.concept,
    dica: q.dica,
    opts: order.map(i => q.opts[i]),
    exp: order.map(i => q.exp[i]),
    correct: order.indexOf(q.correct),
    userAnswer: null,
    flagged: false
  };
}

function allDomains() { return allDomainsStatic(); }

function registerAnswer(domain, isCorrect, questionId) {
  const p = currentProfile();
  if (!p) return;
  p.stats.totalAnswered++;
  if (isCorrect) {
    p.stats.totalCorrect++;
    if (!p.stats.domainsSeen.includes(domain)) p.stats.domainsSeen.push(domain);
    if (!p.stats.domainCorrectIds[domain]) p.stats.domainCorrectIds[domain] = [];
    if (!p.stats.domainCorrectIds[domain].includes(questionId)) p.stats.domainCorrectIds[domain].push(questionId);
  }
  saveState();
}

// Monta o HTML padrão de feedback educacional completo de uma questão
// (usado no Banco de Questões e no Modo Estudo do simulado).
function buildFeedbackHTML(q, userIndex) {
  const isCorrect = userIndex === q.correct;
  return `
    <div class="feedback-box ${isCorrect ? "feedback-correct" : "feedback-wrong"}">
      <p class="feedback-title">${isCorrect ? "✅ Resposta correta!" : "❌ Resposta incorreta."}</p>
      <p><strong>Resposta correta:</strong> ${q.opts[q.correct]}</p>
      <h4 class="feedback-section-title">📘 Conceito relacionado</h4>
      <p>${q.concept}</p>
      <h4 class="feedback-section-title">🔎 Análise das alternativas</h4>
      <div class="explanation-list">
        ${q.opts.map((opt, i) => `
          <div class="explanation-item ${i === q.correct ? "exp-correct" : "exp-wrong"}">
            <strong>${String.fromCharCode(65 + i)}) ${opt}</strong>
            <p>${q.exp[i]}</p>
          </div>`).join("")}
      </div>
      <div class="dica-box">💡 ${q.dica}</div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 9) DASHBOARD
// ----------------------------------------------------------------------------
RENDERERS.dashboard = function renderDashboard() {
  const el = document.getElementById("screen-dashboard");
  const p = currentProfile();
  if (!p) { goToLogin(); return; }
  const info = levelInfo(p.xp);
  const accuracy = p.stats.totalAnswered
    ? Math.round((p.stats.totalCorrect / p.stats.totalAnswered) * 100)
    : 0;
  el.innerHTML = `
    <h2>Bem-vindo(a), ${STATE.currentStudent}! 👋</h2>
    <p class="lead">Estude, pratique e domine o Microsoft Project — gestão de projetos, cronogramas, recursos e custos na ferramenta mais usada do mercado.</p>
    <div class="dashboard-grid">
      <div class="stat-card"><span class="stat-value">${info.level}</span><span class="stat-label">Nível atual</span></div>
      <div class="stat-card"><span class="stat-value">${p.xp}</span><span class="stat-label">XP total</span></div>
      <div class="stat-card"><span class="stat-value">${p.stats.totalAnswered}</span><span class="stat-label">Questões respondidas</span></div>
      <div class="stat-card"><span class="stat-value">${accuracy}%</span><span class="stat-label">Taxa de acerto geral</span></div>
      <div class="stat-card"><span class="stat-value">${p.stats.simuladosCompleted}</span><span class="stat-label">Simulados concluídos</span></div>
      <div class="stat-card"><span class="stat-value">${(p.stats.labsCompleted || []).length}/${LAB_BANK.length}</span><span class="stat-label">Laboratórios concluídos</span></div>
      <div class="stat-card"><span class="stat-value">${p.unlockedAchievements.length}/${ACHIEVEMENTS.length}</span><span class="stat-label">Conquistas</span></div>
    </div>
    <div class="dashboard-actions">
      <button class="btn btn-primary" data-go="bank">📖 Praticar no Banco de Questões</button>
      <button class="btn btn-primary" data-go="simulado">📝 Fazer um Simulado</button>
      <button class="btn btn-primary" data-go="games">🎮 Jogar e Ganhar XP</button>
      <button class="btn btn-primary" data-go="labs">🧪 Laboratórios Práticos</button>
      <button class="btn btn-secondary" data-go="ranking">🏆 Ver Ranking</button>
      <button class="btn btn-secondary" data-go="history">📊 Ver Histórico e Desempenho</button>
    </div>
  `;
  el.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => showScreen(b.dataset.go)));
};

// ----------------------------------------------------------------------------
// 10) BANCO DE QUESTÕES (modo prática, com feedback imediato)
// ----------------------------------------------------------------------------
let bankState = { domain: "todos", current: null, answered: 0, correct: 0, lastIds: [] };

RENDERERS.bank = function renderBank() {
  const el = document.getElementById("screen-bank");
  el.innerHTML = `
    <h2>📖 Banco de Questões</h2>
    <p class="lead">200 questões originais, cobrindo os 5 domínios do curso de Microsoft Project (fundamentos de gestão de projetos, interface, tarefas e cronograma, recursos e custos, e controle/relatórios). Pratique com feedback detalhado a cada resposta.</p>
    <div class="bank-controls">
      <label for="bank-domain-select">Domínio:</label>
      <select id="bank-domain-select">
        <option value="todos">Todos os domínios</option>
        ${allDomains().map(d => `<option value="${d}">${d}</option>`).join("")}
      </select>
      <span class="bank-score">Acertos: <strong id="bank-score">${bankState.correct}/${bankState.answered}</strong></span>
    </div>
    <div id="bank-question-area"></div>
  `;
  const select = document.getElementById("bank-domain-select");
  select.value = bankState.domain;
  select.addEventListener("change", () => { bankState.domain = select.value; nextBankQuestion(); });
  nextBankQuestion();
};

function nextBankQuestion() {
  const pool = QUESTION_BANK.filter(q => bankState.domain === "todos" || q.domain === bankState.domain);
  let candidates = pool.filter(q => !bankState.lastIds.includes(q.id));
  if (candidates.length === 0) { bankState.lastIds = []; candidates = pool; }
  const raw = candidates[Math.floor(Math.random() * candidates.length)];
  bankState.lastIds.push(raw.id);
  if (bankState.lastIds.length > 15) bankState.lastIds.shift();
  bankState.current = prepareQuestion(raw);
  renderBankQuestion();
}

function renderBankQuestion() {
  const area = document.getElementById("bank-question-area");
  const q = bankState.current;
  area.innerHTML = `
    <div class="question-card">
      <span class="question-domain-tag">${q.domain}</span>
      <span class="question-level-tag">${q.nivel}</span>
      <p class="question-text">${q.q}</p>
      <div class="options-list" id="bank-options"></div>
      <div id="bank-feedback"></div>
    </div>
  `;
  const optsWrap = document.getElementById("bank-options");
  q.opts.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "btn btn-option";
    btn.textContent = opt;
    btn.addEventListener("click", () => answerBankQuestion(i));
    optsWrap.appendChild(btn);
  });
}

function answerBankQuestion(index) {
  const q = bankState.current;
  if (q.userAnswer !== null) return;
  q.userAnswer = index;
  const isCorrect = index === q.correct;
  bankState.answered++;
  if (isCorrect) bankState.correct++;
  registerAnswer(q.domain, isCorrect, q.id);
  document.getElementById("bank-score").textContent = `${bankState.correct}/${bankState.answered}`;

  const optsWrap = document.getElementById("bank-options");
  [...optsWrap.children].forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correct) btn.classList.add("opt-correct");
    else if (i === index) btn.classList.add("opt-wrong");
  });

  const feedback = document.getElementById("bank-feedback");
  feedback.innerHTML = buildFeedbackHTML(q, index) + `<button class="btn btn-primary" id="bank-next-btn">Próxima questão →</button>`;
  document.getElementById("bank-next-btn").addEventListener("click", () => {
    addXP(isCorrect ? 5 : 1, "Banco de Questões");
    nextBankQuestion();
  });
}

// ----------------------------------------------------------------------------
// 11) SIMULADO PERSONALIZADO — Modo Prova / Modo Estudo
// ----------------------------------------------------------------------------
let simulado = null; // sessão ativa

RENDERERS.simulado = function renderSimuladoRoot() {
  // Se já existe uma prova em andamento (não finalizada), retoma-a em vez de
  // reiniciar a tela de configuração — evita perder o progresso do aluno ao
  // navegar para outra aba e voltar.
  if (simulado && !simulado.finished) {
    renderSimuladoExam();
  } else {
    renderSimuladoSetup();
  }
};

function renderSimuladoSetup() {
  const el = document.getElementById("screen-simulado");
  el.innerHTML = `
    <h2>📝 Simulado Personalizado</h2>
    <p class="lead">Escolha quantas questões deseja responder e o modo de estudo. As alternativas são embaralhadas e as questões não se repetem na mesma sessão.</p>
    <div class="simulado-setup-card">
      <label>Quantidade de questões:</label>
      <div class="qty-options" id="qty-options">
        ${[10, 20, 30, 50, 100].map(n => `<button class="btn btn-option qty-btn" data-qty="${n}">${n}</button>`).join("")}
        <button class="btn btn-option qty-btn" data-qty="custom">Personalizado</button>
      </div>
      <div id="qty-custom-wrap" class="hidden">
        <label for="qty-custom-input">Número de questões (máx. 200):</label>
        <input type="number" id="qty-custom-input" min="1" max="200" value="15" />
      </div>
      <label>Modo:</label>
      <div class="mode-options" id="mode-options">
        <button class="btn btn-option mode-btn active" data-mode="prova">
          🎓 Modo Prova<br><small>Feedback apenas no relatório final — simula o exame real, cronometrado.</small>
        </button>
        <button class="btn btn-option mode-btn" data-mode="estudo">
          📖 Modo Estudo<br><small>Feedback completo a cada questão respondida — sem pressão de tempo.</small>
        </button>
      </div>
      <button class="btn btn-primary" id="start-simulado-btn">Iniciar Simulado</button>
    </div>
  `;
  let selectedQty = 20;
  let selectedMode = "prova";
  const qtyWrap = document.getElementById("qty-options");
  const defaultBtn = qtyWrap.querySelector('[data-qty="20"]');
  if (defaultBtn) defaultBtn.classList.add("active");
  qtyWrap.querySelectorAll(".qty-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      qtyWrap.querySelectorAll(".qty-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const customWrap = document.getElementById("qty-custom-wrap");
      if (btn.dataset.qty === "custom") {
        customWrap.classList.remove("hidden");
        selectedQty = null;
      } else {
        customWrap.classList.add("hidden");
        selectedQty = parseInt(btn.dataset.qty, 10);
      }
    });
  });
  const modeWrap = document.getElementById("mode-options");
  modeWrap.querySelectorAll(".mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      modeWrap.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedMode = btn.dataset.mode;
    });
  });
  document.getElementById("start-simulado-btn").addEventListener("click", () => {
    let qty = selectedQty;
    if (qty === null) {
      qty = parseInt(document.getElementById("qty-custom-input").value, 10);
    }
    if (!qty || qty < 1) { showToast("Escolha uma quantidade válida de questões."); return; }
    qty = Math.min(qty, QUESTION_BANK.length);
    startSimulado(qty, selectedMode);
  });
}

function startSimulado(qty, mode) {
  const pool = shuffleArr(QUESTION_BANK).slice(0, qty);
  simulado = {
    playerName: STATE.currentStudent,
    mode, // "prova" | "estudo"
    questions: pool.map(prepareQuestion),
    currentIndex: 0,
    timeLimitSeconds: mode === "prova" ? qty * 90 : null,
    remainingSeconds: mode === "prova" ? qty * 90 : 0,
    elapsedSeconds: 0,
    startedAt: Date.now(),
    timerInterval: null,
    finished: false,
  };
  renderSimuladoExam();
  simulado.timerInterval = setInterval(() => {
    if (simulado.mode === "prova") {
      simulado.remainingSeconds--;
      updateSimuladoTimer();
      if (simulado.remainingSeconds <= 0) {
        clearInterval(simulado.timerInterval);
        showToast("⏰ Tempo esgotado! Enviando simulado automaticamente.", true);
        finishSimulado();
      }
    } else {
      simulado.elapsedSeconds++;
      updateSimuladoTimer();
    }
  }, 1000);
}

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return (h > 0 ? h + "h " : "") + String(m).padStart(2, "0") + "m " + String(sec).padStart(2, "0") + "s";
}

function updateSimuladoTimer() {
  const t = document.getElementById("simulado-timer");
  if (!t) return;
  t.textContent = simulado.mode === "prova"
    ? "⏱️ " + formatTime(simulado.remainingSeconds)
    : "⏱️ " + formatTime(simulado.elapsedSeconds) + " (sem limite)";
}

function renderSimuladoExam() {
  const el = document.getElementById("screen-simulado");
  el.innerHTML = `
    <div class="simulado-exam">
      <div class="simulado-topbar">
        <span id="simulado-timer">⏱️ ${simulado.mode === "prova" ? formatTime(simulado.remainingSeconds) : formatTime(simulado.elapsedSeconds) + " (sem limite)"}</span>
        <span>${simulado.playerName} · <em>${simulado.mode === "prova" ? "Modo Prova" : "Modo Estudo"}</em></span>
        <button class="btn btn-secondary" id="finish-early-btn">Revisar e Finalizar</button>
      </div>
      <div class="question-nav-grid" id="question-nav-grid"></div>
      <div id="simulado-question-area"></div>
    </div>
  `;
  document.getElementById("finish-early-btn").addEventListener("click", renderSimuladoReview);
  renderQuestionNavGrid();
  renderCurrentSimuladoQuestion();
}

function renderQuestionNavGrid() {
  const grid = document.getElementById("question-nav-grid");
  grid.innerHTML = "";
  simulado.questions.forEach((q, i) => {
    const btn = document.createElement("button");
    btn.className = "qnav-btn" +
      (i === simulado.currentIndex ? " qnav-current" : "") +
      (q.userAnswer !== null ? " qnav-answered" : "") +
      (q.flagged ? " qnav-flagged" : "");
    btn.textContent = i + 1;
    btn.addEventListener("click", () => { simulado.currentIndex = i; renderSimuladoExam(); });
    grid.appendChild(btn);
  });
}

function renderCurrentSimuladoQuestion() {
  const area = document.getElementById("simulado-question-area");
  const q = simulado.questions[simulado.currentIndex];
  const showFeedback = simulado.mode === "estudo" && q.userAnswer !== null;

  area.innerHTML = `
    <div class="question-card">
      <span class="question-domain-tag">${q.domain}</span>
      <span class="question-level-tag">${q.nivel}</span>
      <p class="question-text">${simulado.currentIndex + 1}. ${q.q}</p>
      <div class="options-list" id="simulado-options"></div>
      <div id="simulado-feedback"></div>
      <div class="simulado-question-actions">
        <button class="btn btn-secondary" id="flag-btn">${q.flagged ? "🚩 Desmarcar revisão" : "🚩 Marcar para revisão"}</button>
        <button class="btn btn-secondary" id="prev-btn" ${simulado.currentIndex === 0 ? "disabled" : ""}>← Anterior</button>
        <button class="btn btn-secondary" id="next-btn" ${simulado.currentIndex === simulado.questions.length - 1 ? "disabled" : ""}>Próxima →</button>
      </div>
    </div>
  `;
  const optsWrap = document.getElementById("simulado-options");
  q.opts.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "btn btn-option" + (q.userAnswer === i ? " opt-selected" : "");
    btn.textContent = opt;
    btn.disabled = showFeedback;
    if (showFeedback) {
      if (i === q.correct) btn.classList.add("opt-correct");
      else if (i === q.userAnswer) btn.classList.add("opt-wrong");
    }
    btn.addEventListener("click", () => {
      if (simulado.mode === "estudo") {
        if (q.userAnswer !== null) return;
        q.userAnswer = i;
        registerAnswer(q.domain, i === q.correct, q.id);
        addXP(i === q.correct ? 5 : 1, "Simulado (Modo Estudo)");
      } else {
        q.userAnswer = i;
      }
      renderQuestionNavGrid();
      renderCurrentSimuladoQuestion();
    });
    optsWrap.appendChild(btn);
  });

  if (showFeedback) {
    document.getElementById("simulado-feedback").innerHTML = buildFeedbackHTML(q, q.userAnswer);
  }

  document.getElementById("flag-btn").addEventListener("click", () => {
    q.flagged = !q.flagged;
    renderQuestionNavGrid();
    renderCurrentSimuladoQuestion();
  });
  document.getElementById("prev-btn").addEventListener("click", () => { simulado.currentIndex--; renderSimuladoExam(); });
  document.getElementById("next-btn").addEventListener("click", () => { simulado.currentIndex++; renderSimuladoExam(); });
}

function renderSimuladoReview() {
  const el = document.getElementById("screen-simulado");
  const unanswered = simulado.questions.filter(q => q.userAnswer === null).length;
  const flagged = simulado.questions.filter(q => q.flagged).length;
  el.innerHTML = `
    <h2>Revisão antes da entrega</h2>
    <p class="lead">${unanswered} questão(ões) não respondida(s) · ${flagged} marcada(s) para revisão.</p>
    <div class="question-nav-grid" id="review-nav-grid"></div>
    <div class="simulado-question-actions">
      <button class="btn btn-secondary" id="back-to-exam-btn">← Voltar ao simulado</button>
      <button class="btn btn-primary" id="submit-simulado-btn">Entregar Simulado</button>
    </div>
  `;
  const grid = document.getElementById("review-nav-grid");
  simulado.questions.forEach((q, i) => {
    const btn = document.createElement("button");
    btn.className = "qnav-btn" + (q.userAnswer !== null ? " qnav-answered" : "") + (q.flagged ? " qnav-flagged" : "");
    btn.textContent = i + 1;
    btn.addEventListener("click", () => { simulado.currentIndex = i; renderSimuladoExam(); });
    grid.appendChild(btn);
  });
  document.getElementById("back-to-exam-btn").addEventListener("click", renderSimuladoExam);
  document.getElementById("submit-simulado-btn").addEventListener("click", () => {
    if (confirm("Tem certeza de que deseja entregar o simulado?")) finishSimulado();
  });
}

function finishSimulado() {
  if (simulado.timerInterval) clearInterval(simulado.timerInterval);
  simulado.finished = true;
  const total = simulado.questions.length;
  let correct = 0;
  const domainStats = {};
  simulado.questions.forEach(q => {
    if (!domainStats[q.domain]) domainStats[q.domain] = { correct: 0, total: 0 };
    domainStats[q.domain].total++;
    const isCorrect = q.userAnswer === q.correct;
    if (isCorrect) { correct++; domainStats[q.domain].correct++; }
    // No Modo Estudo, cada resposta já foi registrada no momento em que o
    // aluno respondeu; no Modo Prova, registramos tudo agora, ao final.
    if (simulado.mode === "prova") registerAnswer(q.domain, isCorrect, q.id);
  });
  const percent = Math.round((correct / total) * 100);
  const timeSpent = simulado.mode === "prova"
    ? simulado.timeLimitSeconds - Math.max(0, simulado.remainingSeconds)
    : simulado.elapsedSeconds;

  let performanceLevel;
  if (percent >= 90) performanceLevel = "Excelente";
  else if (percent >= 75) performanceLevel = "Muito Bom";
  else if (percent >= 60) performanceLevel = "Bom";
  else performanceLevel = "Precisa Melhorar";

  const topicsMastered = Object.entries(domainStats)
    .filter(([, s]) => s.total > 0 && s.correct / s.total >= 0.7)
    .map(([d]) => d);
  const topicsWeak = Object.entries(domainStats)
    .filter(([, s]) => s.total > 0 && s.correct / s.total < 0.7)
    .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
    .map(([d]) => d);

  const p = currentProfile();
  p.stats.simuladosCompleted++;
  if (percent === 100 && total >= 20) p.stats.perfectSimulados++;

  const record = {
    date: new Date().toISOString(),
    playerName: simulado.playerName,
    mode: simulado.mode,
    total, correct, percent, timeSpent, performanceLevel,
    domainStats, topicsMastered, topicsWeak
  };
  p.history.unshift(record);
  saveState();

  // No Modo Prova, o XP é concedido de uma vez ao final (não havia feedback
  // por questão durante a prova). No Modo Estudo, o XP já foi concedido
  // question a questão — aqui aplicamos apenas o bônus de simulado perfeito.
  let xpGained = 0;
  if (simulado.mode === "prova") xpGained = correct * 10 + (percent === 100 ? 50 : 0);
  else if (percent === 100) xpGained = 50;
  if (xpGained > 0) addXP(xpGained, "Simulado");
  else runAchievementCheck();

  logActivity("simulados", { score: correct, total, percent, xp: xpGained, timeSpent, mode: simulado.mode });

  renderSimuladoReport(record);
}

function renderSimuladoReport(record) {
  const el = document.getElementById("screen-simulado");
  const recomendacoes = record.topicsWeak.length
    ? record.topicsWeak.map(d => `Revise o domínio <strong>${d}</strong> no Banco de Questões antes de tentar outro simulado.`).join("<br>")
    : "Excelente cobertura! Continue praticando com simulados maiores para manter o ritmo.";

  el.innerHTML = `
    <h2>📊 Relatório de Desempenho</h2>
    <div class="report-summary">
      <div class="stat-card"><span class="stat-value">${record.correct}/${record.total}</span><span class="stat-label">Nota final</span></div>
      <div class="stat-card"><span class="stat-value">${record.percent}%</span><span class="stat-label">Percentual de acertos</span></div>
      <div class="stat-card"><span class="stat-value">${record.total - record.correct}</span><span class="stat-label">Erros</span></div>
      <div class="stat-card"><span class="stat-value">${formatTime(record.timeSpent)}</span><span class="stat-label">Tempo total</span></div>
      <div class="stat-card"><span class="stat-value performance-${record.performanceLevel.replace(/\s/g, "-")}">${record.performanceLevel}</span><span class="stat-label">Nível de desempenho</span></div>
    </div>
    <div class="report-topics">
      <div><h4>✅ Tópicos dominados</h4><p>${record.topicsMastered.join(", ") || "Nenhum ainda — continue praticando."}</p></div>
      <div><h4>⚠️ Tópicos com dificuldade</h4><p>${record.topicsWeak.join(", ") || "Nenhum — ótimo trabalho!"}</p></div>
      <div><h4>💡 Recomendações de estudo</h4><p>${recomendacoes}</p></div>
    </div>
    <div class="simulado-question-actions">
      <button class="btn btn-primary" id="new-simulado-btn">Fazer novo simulado</button>
      <a href="#full-review" class="btn btn-secondary">⬇ Ir para a correção completa</a>
    </div>
    <h3 id="full-review">📝 Revisão completa da prova</h3>
    <p class="lead">Confira, questão por questão, sua resposta, a resposta correta, o conceito relacionado, a análise de cada alternativa e a dica de memorização para a prova.</p>
    <div id="answer-breakdown"></div>
  `;
  document.getElementById("new-simulado-btn").addEventListener("click", renderSimuladoSetup);

  const box = document.getElementById("answer-breakdown");
  box.innerHTML = simulado.questions.map((q, i) => {
    const isCorrect = q.userAnswer === q.correct;
    const statusText = q.userAnswer === null ? "⚪ Não respondida" : (isCorrect ? "✅ Correta" : "❌ Incorreta");
    return `
      <div class="question-card review-card">
        <h4>Questão ${i + 1}</h4>
        <span class="question-domain-tag">${q.domain}</span>
        <span class="question-level-tag">${q.nivel}</span>
        <p class="question-text">${q.q}</p>
        <p><strong>Sua resposta:</strong> ${q.userAnswer !== null ? String.fromCharCode(65 + q.userAnswer) + ") " + q.opts[q.userAnswer] : "(não respondida)"}</p>
        <p><strong>Resposta correta:</strong> ${String.fromCharCode(65 + q.correct)}) ${q.opts[q.correct]}</p>
        <p><strong>Status:</strong> ${statusText}</p>
        <h4 class="feedback-section-title">📘 Conceito relacionado</h4>
        <p>${q.concept}</p>
        <h4 class="feedback-section-title">🔎 Análise das alternativas</h4>
        <div class="explanation-list">
          ${q.opts.map((opt, oi) => `
            <div class="explanation-item ${oi === q.correct ? "exp-correct" : "exp-wrong"}">
              <strong>${String.fromCharCode(65 + oi)}) ${opt}</strong>
              <p>${q.exp[oi]}</p>
            </div>`).join("")}
        </div>
        <h4 class="feedback-section-title">🧠 Resumo para memorização</h4>
        <div class="dica-box">💡 ${q.dica}</div>
      </div>
    `;
  }).join("");
}

// ----------------------------------------------------------------------------
// 12) JOGOS
// ----------------------------------------------------------------------------
RENDERERS.games = function renderGamesMenu() {
  const el = document.getElementById("screen-games");
  el.innerHTML = `
    <h2>🎮 Gamificação Educacional</h2>
    <p class="lead">Aprenda conceitos do Microsoft Project de forma divertida e ganhe XP.</p>
    <div class="games-grid">
      <div class="game-card" data-game="crossword"><span class="game-icon">🧩</span><h3>Cruzadinha</h3><p>Preencha os termos a partir das dicas.</p></div>
      <div class="game-card" data-game="wordsearch"><span class="game-icon">🔍</span><h3>Caça-Palavras</h3><p>Encontre termos de gestão de projetos escondidos no quadro.</p></div>
      <div class="game-card" data-game="dragdrop"><span class="game-icon">🎯</span><h3>Associação de Conceitos</h3><p>Combine termos com suas definições.</p></div>
      <div class="game-card" data-game="lightning"><span class="game-icon">⚡</span><h3>Desafio Relâmpago</h3><p>Responda rápido e ganhe bônus de velocidade.</p></div>
    </div>
    <div id="game-play-area"></div>
  `;
  el.querySelectorAll(".game-card").forEach(card => {
    card.addEventListener("click", () => openGame(card.dataset.game));
  });
};

function openGame(key) {
  const area = document.getElementById("game-play-area");
  area.scrollIntoView({ behavior: "smooth" });
  const startedAt = Date.now();
  const p = currentProfile();

  function onComplete(xp, info) {
    if (xp) { addXP(xp, "Jogo"); }
    if (!info) return;

    if (info.game === "crossword") {
      p.stats.gamesXP.crossword += xp || 0;
      if (info.correctWords === info.total) {
        p.stats.gamesCompleted.crossword = true;
        p.stats.gamesCompleted.crosswordCount = (p.stats.gamesCompleted.crosswordCount || 0) + 1;
      }
      if (info.correctWords > 0) {
        logActivity("cruzadinha", { score: info.correctWords, total: info.total, xp: p.stats.gamesXP.crossword, timeSpent: secondsSince(startedAt) });
      }
      saveState(); runAchievementCheck();
    }

    if (info.game === "wordsearch") {
      p.stats.gamesXP.wordsearch += xp || 0;
      if (info.bonus) {
        p.stats.gamesCompleted.wordsearch = true;
        p.stats.gamesCompleted.wordsearchCount = (p.stats.gamesCompleted.wordsearchCount || 0) + 1;
        logActivity("cacapalavras", { score: 12, total: 12, xp: p.stats.gamesXP.wordsearch, timeSpent: secondsSince(startedAt) });
        showToast(`🔍 ${STATE.currentStudent} encontrou todas as palavras!`, true);
      }
      saveState(); runAchievementCheck();
    }

    if (info.game === "dragdrop") {
      p.stats.gamesXP.dragdrop += xp || 0;
      if (info.setComplete) {
        const sets = p.stats.gamesCompleted.dragdropSets || [];
        if (!sets.includes(info.setIndex)) sets.push(info.setIndex);
        p.stats.gamesCompleted.dragdropSets = sets;
        logActivity("dragdrop", { score: sets.length, total: 4, xp: p.stats.gamesXP.dragdrop, timeSpent: secondsSince(startedAt) });
      }
      saveState(); runAchievementCheck();
    }

    if (info.game === "lightning") {
      p.stats.gamesXP.lightning += xp || 0;
      if (info.finished) {
        p.stats.gamesCompleted.lightning = true;
        p.stats.gamesCompleted.lightningCount = (p.stats.gamesCompleted.lightningCount || 0) + 1;
        logActivity("lightning", { score: p.stats.gamesXP.lightning, total: null, xp: p.stats.gamesXP.lightning, timeSpent: secondsSince(startedAt) });
      }
      saveState(); runAchievementCheck();
    }
  }

  if (key === "crossword") Games.Crossword.render(area, onComplete);
  else if (key === "wordsearch") Games.WordSearch.render(area, onComplete);
  else if (key === "dragdrop") Games.DragDrop.render(area, onComplete);
  else if (key === "lightning") Games.Lightning.render(area, onComplete, QUESTION_BANK);
}

// ----------------------------------------------------------------------------
// 13) LABORATÓRIOS PRÁTICOS (dentro do Microsoft Project Desktop)
// ----------------------------------------------------------------------------
RENDERERS.labs = function renderLabsMenu() {
  const el = document.getElementById("screen-labs");
  const p = currentProfile();
  el.innerHTML = `
    <h2>🧪 Laboratórios Práticos</h2>
    <p class="lead">Coloque a mão na massa dentro do próprio Microsoft Project (Desktop ou Project para a Web). Cada laboratório traz um passo a passo guiado e, ao final, um pequeno teste de verificação — só quem realmente seguiu os passos no aplicativo responde com facilidade.</p>
    <div class="labs-warning">💡 Você vai precisar do Microsoft Project instalado (ou de uma licença do Project para a Web). Salve seu arquivo .mpp ao final de cada laboratório para poder continuar de onde parou no próximo.</div>
    <div class="games-grid" id="labs-grid"></div>
    <div id="lab-detail-area"></div>
  `;
  const grid = document.getElementById("labs-grid");
  LAB_BANK.forEach(lab => {
    const done = p && (p.stats.labsCompleted || []).includes(lab.id);
    const card = document.createElement("div");
    card.className = "game-card lab-card" + (done ? " lab-done" : "");
    card.innerHTML = `<span class="game-icon">${lab.icon}</span><h3>${lab.id}. ${lab.title}</h3><p>${lab.domain}</p>${done ? `<span class="lab-done-badge">✅ Concluído</span>` : ``}`;
    card.addEventListener("click", () => openLab(lab.id));
    grid.appendChild(card);
  });
};

function openLab(id) {
  const lab = LAB_BANK.find(l => l.id === id);
  const area = document.getElementById("lab-detail-area");
  area.scrollIntoView({ behavior: "smooth" });
  renderLabDetail(lab, area);
}

function renderLabDetail(lab, area) {
  area.innerHTML = `
    <div class="question-card lab-detail-card">
      <span class="question-domain-tag">${lab.domain}</span>
      <h3>${lab.icon} Laboratório ${lab.id}: ${lab.title}</h3>
      <p><strong>Objetivo:</strong> ${lab.objective}</p>
      <h4 class="feedback-section-title">📋 Passo a passo</h4>
      <ol class="lab-steps">${lab.steps.map(s => `<li>${s}</li>`).join("")}</ol>
      <div class="game-actions">
        ${lab.externalLink ? `<a class="btn btn-primary" href="${lab.externalLink.url}" target="_blank" rel="noopener">${lab.externalLink.label}</a>` : ``}
        <button class="btn btn-secondary" id="lab-start-quiz-btn">✅ Já completei os passos — iniciar verificação</button>
      </div>
      <div id="lab-quiz-area"></div>
    </div>
  `;
  document.getElementById("lab-start-quiz-btn").addEventListener("click", () => renderLabQuiz(lab, area));
}

function renderLabQuiz(lab, area) {
  const quizArea = document.getElementById("lab-quiz-area");
  quizArea.innerHTML = `
    <h4 class="feedback-section-title">🔎 Verificação de conclusão</h4>
    <p class="lead">Responda com base no que você viu no portal.</p>
    <div id="lab-quiz-questions"></div>
    <button class="btn btn-primary" id="lab-submit-quiz-btn">Verificar respostas</button>
    <div id="lab-quiz-result"></div>
  `;
  const qWrap = document.getElementById("lab-quiz-questions");
  lab.quiz.forEach((q, qi) => {
    const block = document.createElement("div");
    block.className = "lab-quiz-question";
    block.innerHTML = `<p class="question-text">${qi + 1}. ${q.q}</p>`;
    const optsWrap = document.createElement("div");
    optsWrap.className = "options-list";
    q.opts.forEach((opt, oi) => {
      const btn = document.createElement("button");
      btn.className = "btn btn-option";
      btn.textContent = opt;
      btn.dataset.qi = qi;
      btn.dataset.oi = oi;
      btn.addEventListener("click", () => {
        optsWrap.querySelectorAll(".btn-option").forEach(b => b.classList.remove("opt-selected"));
        btn.classList.add("opt-selected");
        block.dataset.selected = oi;
      });
      optsWrap.appendChild(btn);
    });
    block.appendChild(optsWrap);
    qWrap.appendChild(block);
  });

  document.getElementById("lab-submit-quiz-btn").addEventListener("click", () => {
    const blocks = [...qWrap.querySelectorAll(".lab-quiz-question")];
    if (blocks.some(b => b.dataset.selected === undefined)) {
      showToast("Responda todas as perguntas antes de verificar.");
      return;
    }
    let correctCount = 0;
    blocks.forEach((block, qi) => {
      const q = lab.quiz[qi];
      const selected = parseInt(block.dataset.selected, 10);
      const isCorrect = selected === q.correct;
      if (isCorrect) correctCount++;
      const optsWrap = block.querySelector(".options-list");
      [...optsWrap.children].forEach((btn, oi) => {
        btn.disabled = true;
        if (oi === q.correct) btn.classList.add("opt-correct");
        else if (oi === selected) btn.classList.add("opt-wrong");
      });
      const expBox = document.createElement("div");
      expBox.className = "dica-box";
      expBox.innerHTML = `💡 ${Array.isArray(q.exp) ? q.exp[q.correct] : q.exp}`;
      block.appendChild(expBox);
    });

    const total = lab.quiz.length;
    const passed = correctCount >= Math.ceil(total * 2 / 3);
    const xp = correctCount * 15 + (passed ? 20 : 0);
    const result = document.getElementById("lab-quiz-result");
    result.className = "game-result " + (passed ? "result-perfect" : "result-partial");
    result.textContent = passed
      ? `✅ Laboratório concluído! Você acertou ${correctCount}/${total} e ganhou ${xp} XP.`
      : `Você acertou ${correctCount}/${total}. Revise os passos no portal e tente novamente para concluir o laboratório.`;

    addXP(xp, `Laboratório: ${lab.title}`);

    const p = currentProfile();
    p.stats.labXP += xp;
    if (passed && !(p.stats.labsCompleted || []).includes(lab.id)) {
      p.stats.labsCompleted = p.stats.labsCompleted || [];
      p.stats.labsCompleted.push(lab.id);
      logActivity("laboratorios", { score: p.stats.labsCompleted.length, total: LAB_BANK.length, xp: p.stats.labXP, timeSpent: 0, lab: lab.title });
    }
    saveState();
    runAchievementCheck();
  });
}

// ----------------------------------------------------------------------------
// 14) HISTÓRICO E DESEMPENHO
// ----------------------------------------------------------------------------
RENDERERS.history = function renderHistory() {
  const el = document.getElementById("screen-history");
  const p = currentProfile();
  el.innerHTML = `
    <h2>📊 Histórico de Simulados — ${STATE.currentStudent}</h2>
    ${!p || p.history.length === 0 ? "<p>Você ainda não completou nenhum simulado.</p>" : `
      <table class="history-table">
        <thead><tr><th>Data</th><th>Modo</th><th>Nota</th><th>%</th><th>Tempo</th><th>Nível</th></tr></thead>
        <tbody>
          ${p.history.map(h => `
            <tr>
              <td>${new Date(h.date).toLocaleString("pt-BR")}</td>
              <td>${h.mode === "estudo" ? "📖 Estudo" : "🎓 Prova"}</td>
              <td>${h.correct}/${h.total}</td>
              <td>${h.percent}%</td>
              <td>${formatTime(h.timeSpent)}</td>
              <td>${h.performanceLevel}</td>
            </tr>`).join("")}
        </tbody>
      </table>`}
  `;
};

// ----------------------------------------------------------------------------
// 15) CONQUISTAS
// ----------------------------------------------------------------------------
RENDERERS.achievements = function renderAchievements() {
  const el = document.getElementById("screen-achievements");
  const p = currentProfile();
  if (!p) { goToLogin(); return; }
  const info = levelInfo(p.xp);
  el.innerHTML = `
    <h2>🏅 Conquistas de ${STATE.currentStudent}</h2>
    <div class="level-progress-card">
      <p>Nível ${info.level} — ${info.xpIntoLevel}/${info.xpForNext} XP para o próximo nível</p>
      <div class="xp-bar-outer"><div class="xp-bar-fill" style="width:${info.percent}%"></div></div>
    </div>
    <h3>Conquistas gerais (${GENERAL_ACHIEVEMENTS.filter(a => p.unlockedAchievements.includes(a.id)).length}/${GENERAL_ACHIEVEMENTS.length})</h3>
    <div class="achievements-grid">
      ${GENERAL_ACHIEVEMENTS.map(a => achievementCardHTML(a, p)).join("")}
    </div>
    <h3>Maestria por domínio (${DOMAIN_ACHIEVEMENTS.filter(a => p.unlockedAchievements.includes(a.id)).length}/${DOMAIN_ACHIEVEMENTS.length})</h3>
    <div class="achievements-grid">
      ${DOMAIN_ACHIEVEMENTS.map(a => achievementCardHTML(a, p)).join("")}
    </div>
  `;
};

function achievementCardHTML(a, p) {
  const unlocked = p.unlockedAchievements.includes(a.id);
  return `<div class="achievement-card ${unlocked ? "unlocked" : "locked"}">
    <span class="achievement-icon">${a.icon}</span>
    <strong>${a.name}</strong>
    <p>${a.desc}</p>
  </div>`;
}

// ----------------------------------------------------------------------------
// 16) RANKING — competição entre alunos (por modalidade)
// ----------------------------------------------------------------------------
const RANKING_TABS = [
  { key: "geral", label: "🏆 Geral" },
  { key: "cruzadinha", label: "🧩 Cruzadinha" },
  { key: "cacapalavras", label: "🔍 Caça-Palavras" },
  { key: "dragdrop", label: "🎯 Drag and Drop" },
  { key: "simulados", label: "📝 Simulados" },
  { key: "laboratorios", label: "🧪 Laboratórios" },
];

RENDERERS.ranking = function renderRanking() {
  const el = document.getElementById("screen-ranking");
  el.innerHTML = `
    <h2>🏆 Ranking Local — Competição entre Alunos</h2>
    <p class="lead">Registrado localmente neste computador. Cada aluno que se identificar aqui entra automaticamente na disputa.</p>
    <div class="dragdrop-selector" id="ranking-tabs"></div>
    <div id="ranking-content"></div>
  `;
  const tabsWrap = document.getElementById("ranking-tabs");
  RANKING_TABS.forEach((tab, idx) => {
    const btn = document.createElement("button");
    btn.className = "btn btn-tab" + (idx === 0 ? " active" : "");
    btn.textContent = tab.label;
    btn.addEventListener("click", () => {
      tabsWrap.querySelectorAll(".btn-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderRankingTable(tab.key);
    });
    tabsWrap.appendChild(btn);
  });
  renderRankingTable("geral");
};

function renderRankingTable(key) {
  const content = document.getElementById("ranking-content");
  let rows = [];

  if (key === "geral") {
    rows = Object.entries(STATE.students)
      .map(([name, p]) => ({ name, turma: p.turma, value: p.xp, extra: `Nível ${levelInfo(p.xp).level}` }))
      .sort((a, b) => b.value - a.value);
    renderRankingRows(content, rows, "XP Total", row => `${row.value} XP · ${row.extra}`);
    return;
  }

  const typeMap = { cruzadinha: "cruzadinha", cacapalavras: "cacapalavras", dragdrop: "dragdrop", simulados: "simulados", laboratorios: "laboratorios" };
  const entries = STATE.activityLog.filter(e => e.type === typeMap[key]);
  const bestByStudent = {};
  entries.forEach(e => {
    const currentBest = bestByStudent[e.student];
    const metric = key === "simulados" ? e.percent : e.score;
    if (!currentBest || metric > currentBest._metric) {
      bestByStudent[e.student] = Object.assign({}, e, { _metric: metric });
    }
  });
  rows = Object.values(bestByStudent).sort((a, b) => b._metric - a._metric);

  if (key === "simulados") {
    renderRankingRows(content, rows.map(r => ({ name: r.student, turma: r.turma, value: r.percent, extra: `${r.score}/${r.total} · ${formatTime(r.timeSpent)}` })),
      "Melhor % de acerto", row => `${row.value}% (${row.extra})`);
  } else {
    renderRankingRows(content, rows.map(r => ({ name: r.student, turma: r.turma, value: r.score, extra: `${r.xp} XP · ${formatTime(r.timeSpent)}` })),
      "Melhor pontuação", row => `${row.value} pontos · ${row.extra}`);
  }
}

function renderRankingRows(container, rows, columnLabel, formatRow) {
  if (rows.length === 0) {
    container.innerHTML = "<p>Nenhum registro ainda nesta modalidade.</p>";
    return;
  }
  const medals = ["🥇", "🥈", "🥉"];
  container.innerHTML = `
    <table class="history-table">
      <thead><tr><th>#</th><th>Aluno</th><th>Turma</th><th>${columnLabel}</th></tr></thead>
      <tbody>
        ${rows.slice(0, 15).map((row, i) => `
          <tr class="${row.name === STATE.currentStudent ? "ranking-you" : ""}">
            <td>${medals[i] || (i + 1)}</td>
            <td>${row.name}</td>
            <td>${row.turma || "—"}</td>
            <td>${formatRow(row)}</td>
          </tr>`).join("")}
      </tbody>
    </table>
  `;
}

// ----------------------------------------------------------------------------
// 17) INICIALIZAÇÃO
// ----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  initNav();
  RENDERERS.login();
  if (STATE.currentStudent && STATE.students[STATE.currentStudent]) {
    enterApp();
  } else {
    goToLogin();
  }
});
