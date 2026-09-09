// ============================================================================
// features2.js — Simulado Oficial, Refazer Erros, Streak, Plano de Estudo,
//                Exportar Relatório (5 plataformas)
// ============================================================================

// ─── CONFIG POR CERTIFICAÇÃO ─────────────────────────────────────────────────
const EXAM_CONFIG = (function() {
  const url = location.pathname;
  if (url.includes('ai901'))     return { name:'AI-901', qty:60, time:45*60, pass:700, total:1000 };
  if (url.includes('dp900'))     return { name:'DP-900', qty:60, time:45*60, pass:700, total:1000 };
  if (url.includes('sc900'))     return { name:'SC-900', qty:60, time:45*60, pass:700, total:1000 };
  if (url.includes('ms-project'))return { name:'MS Project', qty:50, time:60*60, pass:70, total:100 };
  return { name:'AZ-900', qty:45, time:45*60, pass:700, total:1000 }; // default
})();

// ─── 1. SIMULADO OFICIAL ─────────────────────────────────────────────────────

RENDERERS.oficial = function renderOficial() {
  const el = document.getElementById('screen-oficial') || createScreen('oficial');
  const cfg = EXAM_CONFIG;
  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const passScore = cfg.total === 1000 ? cfg.pass : cfg.pass;

  el.innerHTML = `
    <div class="oficial-hero">
      <div class="oficial-badge">🎓 Simulado Oficial</div>
      <h2>${cfg.name} — Simulação do Exame Real</h2>
      <p class="lead">Reproduz exatamente as condições do exame Microsoft: ${cfg.qty} questões, ${Math.floor(cfg.time/60)} minutos, pontuação 0–${cfg.total}. Aprovado com ${cfg.pass}+ pontos.</p>
    </div>
    <div class="oficial-rules">
      <div class="rule-card"><div class="rule-icon">📝</div><div class="rule-val">${cfg.qty}</div><div class="rule-label">Questões</div></div>
      <div class="rule-card"><div class="rule-icon">⏱️</div><div class="rule-val">${Math.floor(cfg.time/60)} min</div><div class="rule-label">Tempo limite</div></div>
      <div class="rule-card"><div class="rule-icon">🎯</div><div class="rule-val">${cfg.pass}</div><div class="rule-label">Nota mínima</div></div>
      <div class="rule-card"><div class="rule-icon">📊</div><div class="rule-val">0–${cfg.total}</div><div class="rule-label">Pontuação</div></div>
    </div>
    <div class="oficial-rules-text">
      <h3>Regras do exame</h3>
      <ul>
        <li>Sem feedback durante o exame — resultado apenas ao final</li>
        <li>Questões embaralhadas aleatoriamente</li>
        <li>Você pode marcar questões para revisão e voltar a elas</li>
        <li>Ao acabar o tempo, o exame é entregue automaticamente</li>
        <li>Pontuação calculada proporcionalmente (acertos × ${Math.round(cfg.total/cfg.qty)})</li>
      </ul>
    </div>
    <button class="btn btn-primary btn-lg" onclick="startOficialSimulado()">🚀 Iniciar Simulado Oficial</button>
  `;
};

window.startOficialSimulado = function() {
  const cfg = EXAM_CONFIG;
  const qty = Math.min(cfg.qty, QUESTION_BANK.length);
  const pool = shuffleArr([...QUESTION_BANK]).slice(0, qty);
  simulado = {
    playerName: STATE.currentStudent,
    mode: 'oficial',
    oficial: true,
    examConfig: cfg,
    questions: pool.map(prepareQuestion),
    currentIndex: 0,
    timeLimitSeconds: cfg.time,
    remainingSeconds: cfg.time,
    elapsedSeconds: 0,
    startedAt: Date.now(),
    timerInterval: null,
    finished: false,
  };
  renderOficialExam();
};

function renderOficialExam() {
  const cfg = simulado.examConfig;
  const el = document.getElementById('screen-oficial');
  const total = simulado.questions.length;
  const answered = simulado.questions.filter(q => q.userAnswer !== null).length;
  const flagged = simulado.questions.filter(q => q.flagged).length;

  const fmt = s => {
    const m = Math.floor(s/60), sec = s%60;
    return `${m}:${String(sec).padStart(2,'0')}`;
  };

  el.innerHTML = `
    <div class="oficial-exam-header">
      <div class="oficial-exam-title">🎓 ${cfg.name} — Exame Oficial</div>
      <div class="oficial-exam-meta">
        <span id="oficial-answered">${answered}/${total} respondidas</span>
        <span id="oficial-flagged">${flagged} marcadas</span>
        <span class="oficial-timer" id="oficial-timer">${fmt(simulado.remainingSeconds)}</span>
      </div>
    </div>
    <div class="oficial-progress">
      <div class="oficial-progress-fill" id="oficial-prog" style="width:${Math.round(answered/total*100)}%"></div>
    </div>
    <div class="oficial-body">
      <div class="oficial-question-area" id="oficial-q-area"></div>
      <div class="oficial-nav-panel">
        <div class="oficial-nav-title">Navegação</div>
        <div class="oficial-nav-grid" id="oficial-nav-grid"></div>
        <button class="btn btn-danger btn-block" id="oficial-submit-btn">Entregar Exame</button>
      </div>
    </div>
  `;

  renderOficialQuestion();
  renderOficialNavGrid();

  // Timer
  if (simulado.timerInterval) clearInterval(simulado.timerInterval);
  simulado.timerInterval = setInterval(() => {
    simulado.remainingSeconds--;
    simulado.elapsedSeconds++;
    const timerEl = document.getElementById('oficial-timer');
    if (timerEl) {
      timerEl.textContent = fmt(simulado.remainingSeconds);
      if (simulado.remainingSeconds <= 300) timerEl.style.color = '#c0392b';
      if (simulado.remainingSeconds <= 60) timerEl.style.animation = 'pulse 1s infinite';
    }
    if (simulado.remainingSeconds <= 0) {
      clearInterval(simulado.timerInterval);
      finishOficial();
    }
  }, 1000);

  document.getElementById('oficial-submit-btn').addEventListener('click', () => {
    const un = simulado.questions.filter(q => q.userAnswer === null).length;
    const msg = un > 0
      ? `Você tem ${un} questão(ões) não respondida(s). Deseja mesmo entregar?`
      : 'Deseja entregar o exame?';
    if (confirm(msg)) finishOficial();
  });
}

function renderOficialQuestion() {
  const area = document.getElementById('oficial-q-area');
  if (!area) return;
  const q = simulado.questions[simulado.currentIndex];
  const total = simulado.questions.length;
  const idx = simulado.currentIndex;

  area.innerHTML = `
    <div class="oficial-q-header">
      <span class="oficial-q-num">Questão ${idx+1} de ${total}</span>
      <span class="oficial-q-domain">${q.domain}</span>
      <button class="btn-flag ${q.flagged ? 'flagged' : ''}" id="flag-btn" title="Marcar para revisão">
        ${q.flagged ? '🚩 Marcada' : '⚐ Marcar'}
      </button>
    </div>
    <p class="oficial-q-text">${q.q}</p>
    <div class="oficial-opts" id="oficial-opts"></div>
    <div class="oficial-q-nav">
      <button class="btn btn-outline" id="prev-btn" ${idx===0?'disabled':''}>← Anterior</button>
      <button class="btn btn-outline" id="next-btn" ${idx===total-1?'disabled':''}>Próximo →</button>
    </div>
  `;

  const optsEl = document.getElementById('oficial-opts');
  q.opts.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'oficial-opt' + (q.userAnswer === i ? ' selected' : '');
    btn.innerHTML = `<span class="opt-letter">${'ABCD'[i]}</span>${opt}`;
    btn.addEventListener('click', () => {
      q.userAnswer = i;
      renderOficialQuestion();
      renderOficialNavGrid();
      updateOficialMeta();
    });
    optsEl.appendChild(btn);
  });

  document.getElementById('flag-btn').addEventListener('click', () => {
    q.flagged = !q.flagged;
    renderOficialQuestion();
    renderOficialNavGrid();
    updateOficialMeta();
  });
  document.getElementById('prev-btn').addEventListener('click', () => {
    if (simulado.currentIndex > 0) { simulado.currentIndex--; renderOficialQuestion(); renderOficialNavGrid(); }
  });
  document.getElementById('next-btn').addEventListener('click', () => {
    if (simulado.currentIndex < total-1) { simulado.currentIndex++; renderOficialQuestion(); renderOficialNavGrid(); }
  });
}

function renderOficialNavGrid() {
  const grid = document.getElementById('oficial-nav-grid');
  if (!grid) return;
  grid.innerHTML = '';
  simulado.questions.forEach((q, i) => {
    const btn = document.createElement('button');
    btn.className = 'onav-btn'
      + (i === simulado.currentIndex ? ' current' : '')
      + (q.userAnswer !== null ? ' answered' : '')
      + (q.flagged ? ' flagged' : '');
    btn.textContent = i + 1;
    btn.addEventListener('click', () => { simulado.currentIndex = i; renderOficialQuestion(); renderOficialNavGrid(); });
    grid.appendChild(btn);
  });
}

function updateOficialMeta() {
  const answered = simulado.questions.filter(q => q.userAnswer !== null).length;
  const flagged = simulado.questions.filter(q => q.flagged).length;
  const total = simulado.questions.length;
  const ansEl = document.getElementById('oficial-answered');
  const flagEl = document.getElementById('oficial-flagged');
  const prog = document.getElementById('oficial-prog');
  if (ansEl) ansEl.textContent = `${answered}/${total} respondidas`;
  if (flagEl) flagEl.textContent = `${flagged} marcadas`;
  if (prog) prog.style.width = `${Math.round(answered/total*100)}%`;
}

function finishOficial() {
  if (simulado.timerInterval) clearInterval(simulado.timerInterval);
  simulado.finished = true;
  const cfg = simulado.examConfig;
  const total = simulado.questions.length;
  let correct = 0;
  const domainStats = {};

  simulado.questions.forEach(q => {
    if (!domainStats[q.domain]) domainStats[q.domain] = { correct:0, total:0 };
    domainStats[q.domain].total++;
    const ok = q.userAnswer === q.correct;
    if (ok) { correct++; domainStats[q.domain].correct++; }
    registerAnswer(q.domain, ok, q.id);
  });

  const pct = Math.round(correct / total * 100);
  // Escala Microsoft: 0-1000 (não é linear simples, mas aproximamos)
  const score = cfg.total === 1000
    ? Math.round((correct / total) * 1000)
    : Math.round((correct / total) * 100);
  const passed = score >= cfg.pass;
  const timeSpent = cfg.time - simulado.remainingSeconds;

  const results = simulado.questions.map(q => ({
    id: q.id,
    correct: q.userAnswer !== null && q.userAnswer === q.correct,
    chosenIdx: q.userAnswer !== null && q.order ? q.order[q.userAnswer] : q.userAnswer,
  }));

  const record = {
    date: new Date().toISOString(),
    playerName: simulado.playerName,
    mode: 'oficial',
    oficial: true,
    score, passed, total, correct, percent: pct, timeSpent,
    performanceLevel: passed ? 'Aprovado' : 'Reprovado',
    domainStats, results,
    topicsMastered: Object.entries(domainStats).filter(([,s])=>s.correct/s.total>=0.7).map(([d])=>d),
    topicsWeak: Object.entries(domainStats).filter(([,s])=>s.total>0&&s.correct/s.total<0.7).sort((a,b)=>a[1].correct/a[1].total-b[1].correct/b[1].total).map(([d])=>d),
  };

  const p = currentProfile();
  p.stats.simuladosCompleted++;
  p.history.unshift(record);
  saveState();

  const xp = correct * 10 + (passed ? 100 : 0);
  if (xp > 0) addXP(xp, 'Simulado Oficial');

  renderOficialResult(record, cfg);
}

function renderOficialResult(record, cfg) {
  const el = document.getElementById('screen-oficial');
  const passed = record.passed;
  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  const domainRows = Object.entries(record.domainStats).map(([d, s]) => {
    const pct = Math.round(s.correct/s.total*100);
    const color = pct>=70?'#0E7A0D':pct>=50?'#D14B00':'#c0392b';
    return `<tr>
      <td>${d}</td>
      <td>${s.correct}/${s.total}</td>
      <td style="color:${color};font-weight:700">${pct}%</td>
      <td><div class="mini-bar"><div style="width:${pct}%;background:${color}"></div></div></td>
    </tr>`;
  }).join('');

  el.innerHTML = `
    <div class="result-hero ${passed?'result-pass':'result-fail'}">
      <div class="result-icon">${passed?'🏆':'📚'}</div>
      <div class="result-status">${passed?'APROVADO':'REPROVADO'}</div>
      <div class="result-score">${record.score} <span>/ ${cfg.total}</span></div>
      <div class="result-score-label">Pontuação</div>
      <div class="result-pass-line">Mínimo para aprovação: ${cfg.pass} pontos</div>
    </div>
    <div class="result-stats-row">
      <div class="result-stat"><strong>${record.correct}</strong><span>Acertos</span></div>
      <div class="result-stat"><strong>${record.total-record.correct}</strong><span>Erros</span></div>
      <div class="result-stat"><strong>${record.percent}%</strong><span>Aproveitamento</span></div>
      <div class="result-stat"><strong>${fmt(record.timeSpent)}</strong><span>Tempo usado</span></div>
    </div>
    <h3 class="section-title">Desempenho por domínio</h3>
    <table class="domain-result-table">
      <thead><tr><th>Domínio</th><th>Acertos</th><th>%</th><th>Barra</th></tr></thead>
      <tbody>${domainRows}</tbody>
    </table>
    ${record.topicsWeak.length ? `
    <div class="weak-alert">
      <strong>⚠️ Domínios para reforçar:</strong>
      ${record.topicsWeak.map(d=>`<span class="weak-tag">${d}</span>`).join('')}
    </div>` : ''}
    <div class="result-actions">
      <button class="btn btn-primary" onclick="RENDERERS.oficial()">🔄 Refazer Simulado Oficial</button>
      <button class="btn btn-outline" onclick="showScreen('erros')">📋 Revisar Erros</button>
      <button class="btn btn-outline" onclick="showScreen('dominios')">📊 Ver Progresso</button>
    </div>
  `;
}

// ─── 2. REFAZER ERROS (dentro do relatório e tela erros) ─────────────────────

window.refarzerErros = function(results) {
  if (!results || !results.length) { showToast('Sem erros para refazer.'); return; }
  const erradosIds = results.filter(r => !r.correct).map(r => r.id);
  const pool = QUESTION_BANK.filter(q => erradosIds.includes(q.id));
  if (!pool.length) { showToast('Sem questões para refazer.'); return; }
  simulado = {
    playerName: STATE.currentStudent,
    mode: 'estudo',
    refazendo: true,
    questions: shuffleArr([...pool]).map(prepareQuestion),
    currentIndex: 0,
    timeLimitSeconds: null,
    remainingSeconds: 0,
    elapsedSeconds: 0,
    startedAt: Date.now(),
    timerInterval: null,
    finished: false,
  };
  showScreen('simulado');
  renderSimuladoExam();
};

// Patch: adicionar botão "Refazer só os erros" no relatório final
const _origFinishSimulado = finishSimulado;
window.finishSimulado = function() {
  _origFinishSimulado();
};

// Patch renderSimuladoReport para incluir botão refazer
const _origReport = renderSimuladoReport;
window.renderSimuladoReport = function(record) {
  _origReport(record);
  // Adicionar botão refazer erros após o relatório existente
  setTimeout(() => {
    const container = document.getElementById('screen-simulado');
    if (!container) return;
    const erros = (record.results || []).filter(r => !r.correct);
    if (!erros.length) return;
    const existing = container.querySelector('.refazer-btn-wrap');
    if (existing) return;
    const wrap = document.createElement('div');
    wrap.className = 'refazer-btn-wrap';
    wrap.innerHTML = `
      <button class="btn btn-warning" onclick="refarzerErros(${JSON.stringify(record.results)})">
        🔁 Refazer só os ${erros.length} erros
      </button>`;
    container.appendChild(wrap);
  }, 100);
};

// Botão refazer no topo da tela de erros
const _origRenderErros = RENDERERS.erros;
RENDERERS.erros = function() {
  _origRenderErros();
  setTimeout(() => {
    const p = currentProfile();
    const allResults = (p.history || []).flatMap(h => h.results || []);
    if (!allResults.length) return;
    const el = document.getElementById('screen-erros');
    if (!el) return;
    const h2 = el.querySelector('h2');
    if (!h2) return;
    const btn = document.createElement('button');
    btn.className = 'btn btn-warning';
    btn.style.marginLeft = '1rem';
    btn.textContent = '🔁 Refazer todos os erros';
    btn.onclick = () => refarzerErros(allResults);
    h2.appendChild(btn);
  }, 50);
};

// ─── 3. STREAK ───────────────────────────────────────────────────────────────

function getStreak(p) {
  const history = p.history || [];
  if (!history.length) return { current: 0, best: 0 };

  // Coletar dias únicos em que estudou
  const days = [...new Set(history.map(h => h.date ? h.date.slice(0, 10) : null).filter(Boolean))].sort().reverse();
  if (!days.length) return { current: 0, best: 0 };

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Calcular streak atual
  let current = 0;
  let checkDay = days[0] === today || days[0] === yesterday ? days[0] : null;
  if (!checkDay) return { current: 0, best: calcBestStreak(days) };

  for (let i = 0; i < days.length; i++) {
    if (i === 0) { current = 1; continue; }
    const prev = new Date(days[i-1]);
    const curr = new Date(days[i]);
    const diff = Math.round((prev - curr) / 86400000);
    if (diff === 1) current++;
    else break;
  }

  return { current, best: calcBestStreak(days) };
}

function calcBestStreak(days) {
  let best = 1, cur = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i-1]);
    const curr = new Date(days[i]);
    if (Math.round((prev - curr) / 86400000) === 1) { cur++; best = Math.max(best, cur); }
    else cur = 1;
  }
  return best;
}

function renderStreak() {
  const p = currentProfile();
  if (!p) return;
  const { current, best } = getStreak(p);
  const existingStreak = document.getElementById('streak-widget');
  if (existingStreak) { existingStreak.remove(); }

  const widget = document.createElement('div');
  widget.id = 'streak-widget';
  widget.className = 'streak-widget' + (current >= 3 ? ' streak-hot' : '');
  widget.innerHTML = `
    <span class="streak-fire">${current >= 7 ? '🔥' : current >= 3 ? '⚡' : '📅'}</span>
    <span class="streak-count">${current}</span>
    <span class="streak-label">dia${current !== 1 ? 's' : ''} seguido${current !== 1 ? 's' : ''}</span>
    ${best > current ? `<span class="streak-best">Recorde: ${best}</span>` : ''}
  `;

  // Injetar no header
  const headerRight = document.querySelector('.header-right');
  if (headerRight) headerRight.prepend(widget);
}

// Atualizar streak ao entrar no app
const _origEnterApp = typeof enterApp === 'function' ? enterApp : null;
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (STATE.currentStudent) renderStreak();
  }, 600);
});

// Atualizar após cada simulado
const _origSaveState = saveState;
window.saveState = function() {
  _origSaveState();
  if (STATE.currentStudent) setTimeout(renderStreak, 100);
};

// ─── 4. PLANO DE ESTUDO ──────────────────────────────────────────────────────

RENDERERS.plano = function renderPlano() {
  const el = document.getElementById('screen-plano') || createScreen('plano');
  const p = currentProfile();
  const cfg = EXAM_CONFIG;

  // Calcular progresso por domínio
  const domStats = {};
  QUESTION_BANK.forEach(q => {
    if (!domStats[q.domain]) domStats[q.domain] = { total:0, correct:0, seen:0 };
    domStats[q.domain].total++;
  });
  (p.history || []).forEach(h => {
    (h.results || []).forEach(r => {
      const q = QUESTION_BANK.find(q => q.id === r.id);
      if (!q) return;
      domStats[q.domain].seen++;
      if (r.correct) domStats[q.domain].correct++;
    });
  });

  // Ordenar domínios: não estudados primeiro, depois piores
  const domains = Object.entries(domStats).map(([d, s]) => ({
    domain: d,
    pct: s.seen ? Math.round(s.correct/s.seen*100) : null,
    seen: s.seen,
    total: s.total,
    priority: s.seen === 0 ? 0 : s.correct/s.seen < 0.5 ? 1 : s.correct/s.seen < 0.7 ? 2 : 3,
  })).sort((a, b) => a.priority - b.priority || (a.pct||0) - (b.pct||0));

  // Gerar plano com base nos dias
  const setupHtml = `
    <h2>📅 Plano de Estudo Personalizado</h2>
    <p class="lead">Com base no seu progresso, vou gerar um plano de estudos focado nos seus pontos fracos.</p>
    <div class="plano-setup">
      <label>Quando você pretende fazer o exame?</label>
      <div class="plano-days">
        ${[7, 14, 21, 30].map(d => `<button class="btn btn-option plano-day-btn" data-days="${d}">${d} dias</button>`).join('')}
      </div>
      <label>Quanto tempo por dia você tem?</label>
      <div class="plano-time">
        ${['15 min', '30 min', '1 hora', '2 horas'].map(t => `<button class="btn btn-option plano-time-btn" data-time="${t}">${t}</button>`).join('')}
      </div>
      <button class="btn btn-primary" id="gerar-plano-btn">Gerar meu plano</button>
    </div>
  `;

  el.innerHTML = setupHtml;

  let selectedDays = 14, selectedTime = '30 min';
  el.querySelector('[data-days="14"]').classList.add('active');
  el.querySelector('[data-time="30 min"]').classList.add('active');

  el.querySelectorAll('.plano-day-btn').forEach(btn => btn.addEventListener('click', () => {
    el.querySelectorAll('.plano-day-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedDays = parseInt(btn.dataset.days);
  }));

  el.querySelectorAll('.plano-time-btn').forEach(btn => btn.addEventListener('click', () => {
    el.querySelectorAll('.plano-time-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedTime = btn.dataset.time;
  }));

  document.getElementById('gerar-plano-btn').addEventListener('click', () => {
    gerarPlano(el, domains, selectedDays, selectedTime);
  });
};

function gerarPlano(el, domains, days, timeStr) {
  const questoesPorSessao = { '15 min': 10, '30 min': 20, '1 hora': 40, '2 horas': 80 }[timeStr] || 20;
  const semanas = Math.ceil(days / 7);

  // Distribuir domínios ao longo dos dias
  const prioritarios = domains.filter(d => d.priority <= 1); // não estudados + fracos
  const medios = domains.filter(d => d.priority === 2);
  const bons = domains.filter(d => d.priority === 3);

  // Construir plano por semana
  const semanaPlans = [];
  let domIdx = 0;
  const allOrdered = [...prioritarios, ...medios, ...bons];

  for (let s = 0; s < semanas; s++) {
    const isLastWeek = s === semanas - 1;
    const daysInWeek = isLastWeek ? (days - s * 7) : 7;
    const activities = [];

    if (isLastWeek) {
      activities.push({ icon:'🎯', title:'Simulado Oficial Completo', desc:'Faça o simulado oficial cronometrado para medir seu preparo real.' });
      activities.push({ icon:'📋', title:'Revisar todos os erros', desc:'Vá em Revisão de Erros e releia todas as explicações.' });
      activities.push({ icon:'🃏', title:'Flashcards de revisão geral', desc:'Revise todos os domínios com os flashcards.' });
    } else {
      // Focar em 2-3 domínios por semana
      const weekDomains = allOrdered.slice(domIdx, domIdx + Math.min(3, allOrdered.length - domIdx));
      domIdx = (domIdx + 3) % allOrdered.length;

      weekDomains.forEach(d => {
        const icon = d.pct === null ? '🆕' : d.pct < 50 ? '🔴' : '🟡';
        activities.push({
          icon,
          title: d.domain,
          desc: d.pct === null
            ? `Você ainda não estudou este domínio. Faça ${questoesPorSessao} questões focadas.`
            : `Você acertou ${d.pct}% das questões. Pratique mais ${questoesPorSessao} questões.`,
          action: d.domain,
        });
      });

      if (s % 2 === 1) {
        activities.push({ icon:'📝', title:'Simulado de revisão (20 questões)', desc:'Simulado rápido para consolidar o que estudou na semana.' });
      }
    }

    semanaPlans.push({ semana: s + 1, activities, daysInWeek });
  }

  const hoje = new Date();
  const semanasHtml = semanaPlans.map(({ semana, activities, daysInWeek }) => {
    const startDay = new Date(hoje);
    startDay.setDate(hoje.getDate() + (semana-1)*7);
    const endDay = new Date(startDay);
    endDay.setDate(startDay.getDate() + daysInWeek - 1);
    const fmtDate = d => `${d.getDate()}/${d.getMonth()+1}`;

    const actsHtml = activities.map(a => `
      <div class="plano-activity">
        <div class="plano-act-icon">${a.icon}</div>
        <div class="plano-act-body">
          <strong>${a.title}</strong>
          <p>${a.desc}</p>
          ${a.action ? `<button class="btn btn-sm btn-outline" onclick="startSimuladoDominio('${a.action.replace(/'/g,"\\'")}')">Praticar agora →</button>` : ''}
        </div>
      </div>`).join('');

    return `
      <div class="plano-semana">
        <div class="plano-semana-header">
          <span class="plano-semana-num">Semana ${semana}</span>
          <span class="plano-semana-date">${fmtDate(startDay)} – ${fmtDate(endDay)}</span>
          <span class="plano-semana-time">~${timeStr}/dia</span>
        </div>
        ${actsHtml}
      </div>`;
  }).join('');

  el.innerHTML = `
    <h2>📅 Seu Plano de Estudo — ${days} dias</h2>
    <p class="lead">Plano personalizado baseado no seu progresso atual. Clique em "Praticar agora" para ir direto ao domínio.</p>
    <div class="plano-legend">
      <span>🆕 Não estudado</span>
      <span>🔴 Precisa melhorar (&lt;50%)</span>
      <span>🟡 Em desenvolvimento (50–70%)</span>
      <span>✅ Bom (&gt;70%)</span>
    </div>
    <div class="plano-semanas">${semanasHtml}</div>
    <button class="btn btn-outline" onclick="RENDERERS.plano()">↩ Novo plano</button>
  `;
}

// ─── 5. EXPORTAR RELATÓRIO ───────────────────────────────────────────────────

RENDERERS.relatorio = function renderRelatorio() {
  const el = document.getElementById('screen-relatorio') || createScreen('relatorio');
  const allStudents = Object.entries(STATE.students || {});

  if (!allStudents.length) {
    el.innerHTML = `<h2>📤 Relatório da Turma</h2><p>Nenhum aluno cadastrado ainda.</p>`;
    return;
  }

  const rows = allStudents.map(([name, p]) => {
    const history = p.history || [];
    const simulados = history.length;
    const oficiais = history.filter(h => h.oficial).length;
    const avgScore = simulados
      ? Math.round(history.reduce((a, h) => a + (h.percent || 0), 0) / simulados)
      : 0;
    const lastDate = history.length ? new Date(history[0].date).toLocaleDateString('pt-BR') : '—';
    const { current } = getStreak(p);

    // Progresso por domínio
    const domStats = {};
    history.forEach(h => (h.results||[]).forEach(r => {
      const q = QUESTION_BANK.find(q => q.id === r.id);
      if (!q) return;
      if (!domStats[q.domain]) domStats[q.domain] = { correct:0, total:0 };
      domStats[q.domain].total++;
      if (r.correct) domStats[q.domain].correct++;
    }));

    const weakDomains = Object.entries(domStats)
      .filter(([,s]) => s.total > 0 && s.correct/s.total < 0.6)
      .map(([d]) => d).join(', ') || '—';

    return { name, turma: p.turma||'—', simulados, oficiais, avgScore, lastDate, current, weakDomains };
  });

  const tableRows = rows.map(r => `
    <tr>
      <td><strong>${r.name}</strong></td>
      <td>${r.turma}</td>
      <td>${r.simulados}</td>
      <td>${r.oficiais}</td>
      <td class="${r.avgScore>=70?'score-pass':r.avgScore>=50?'score-mid':'score-fail'}">${r.avgScore}%</td>
      <td>${r.current > 0 ? `${r.current}🔥` : '—'}</td>
      <td>${r.lastDate}</td>
      <td class="weak-cell">${r.weakDomains}</td>
    </tr>`).join('');

  el.innerHTML = `
    <h2>📤 Relatório da Turma</h2>
    <p class="lead">${allStudents.length} aluno(s) cadastrado(s). Use os botões para exportar.</p>
    <div class="relatorio-actions">
      <button class="btn btn-primary" id="export-csv-btn">⬇️ Exportar CSV</button>
      <button class="btn btn-outline" id="export-copy-btn">📋 Copiar como tabela</button>
    </div>
    <div class="table-wrap">
      <table class="relatorio-table" id="relatorio-table">
        <thead>
          <tr>
            <th>Aluno</th><th>Turma</th><th>Simulados</th><th>Oficiais</th>
            <th>Média</th><th>Streak</th><th>Último acesso</th><th>Pontos fracos</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
  `;

  document.getElementById('export-csv-btn').addEventListener('click', () => {
    const header = 'Aluno,Turma,Simulados,Oficiais,Media (%),Streak,Ultimo Acesso,Pontos Fracos';
    const csvRows = rows.map(r =>
      `"${r.name}","${r.turma}",${r.simulados},${r.oficiais},${r.avgScore},${r.current},"${r.lastDate}","${r.weakDomains}"`
    );
    const csv = [header, ...csvRows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${EXAM_CONFIG.name.replace(/\s/g,'-')}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exportado com sucesso!');
  });

  document.getElementById('export-copy-btn').addEventListener('click', () => {
    const lines = [
      'Aluno\tTurma\tSimulados\tOficiais\tMédia\tStreak\tÚltimo acesso\tPontos fracos',
      ...rows.map(r => `${r.name}\t${r.turma}\t${r.simulados}\t${r.oficiais}\t${r.avgScore}%\t${r.current}\t${r.lastDate}\t${r.weakDomains}`),
    ].join('\n');
    navigator.clipboard.writeText(lines).then(() => showToast('Copiado! Cole direto no Excel ou Google Sheets.'));
  });
};

// ─── CSS DOS 5 NOVOS RECURSOS ────────────────────────────────────────────────

(function injectStyles2() {
  const s = document.createElement('style');
  s.textContent = `
  /* SIMULADO OFICIAL */
  .oficial-hero { text-align:center; padding:1.5rem 0; }
  .oficial-badge { display:inline-block; background:var(--blue,#1A56DB); color:#fff; font-size:0.75rem; font-weight:700; padding:4px 14px; border-radius:20px; margin-bottom:0.75rem; }
  .oficial-rules { display:flex; gap:1rem; justify-content:center; flex-wrap:wrap; margin:1.5rem 0; }
  .rule-card { background:var(--surface,#fff); border:1px solid var(--border,#e0e0e0); border-radius:12px; padding:1.25rem 1.5rem; text-align:center; min-width:110px; }
  .rule-icon { font-size:1.5rem; margin-bottom:0.25rem; }
  .rule-val { font-size:1.5rem; font-weight:800; color:var(--blue,#1A56DB); }
  .rule-label { font-size:0.75rem; color:var(--text-muted,#555); margin-top:0.25rem; }
  .oficial-rules-text ul { line-height:2; padding-left:1.25rem; }
  .btn-lg { padding:0.875rem 2rem; font-size:1rem; border-radius:12px; }
  .oficial-exam-header { display:flex; justify-content:space-between; align-items:center; padding:0.75rem 1rem; background:var(--surface,#fff); border:1px solid var(--border,#e0e0e0); border-radius:12px; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem; }
  .oficial-exam-title { font-weight:700; font-size:0.9375rem; }
  .oficial-exam-meta { display:flex; gap:1rem; align-items:center; font-size:0.875rem; color:var(--text-muted,#555); }
  .oficial-timer { font-size:1.25rem; font-weight:800; color:var(--blue,#1A56DB); font-variant-numeric:tabular-nums; }
  .oficial-progress { height:6px; background:var(--border,#e0e0e0); border-radius:3px; margin-bottom:1rem; overflow:hidden; }
  .oficial-progress-fill { height:100%; background:var(--blue,#1A56DB); border-radius:3px; transition:width 0.4s; }
  .oficial-body { display:grid; grid-template-columns:1fr 200px; gap:1.25rem; align-items:start; }
  .oficial-question-area { background:var(--surface,#fff); border:1px solid var(--border,#e0e0e0); border-radius:12px; padding:1.5rem; }
  .oficial-q-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem; }
  .oficial-q-num { font-size:0.8125rem; color:var(--text-muted,#555); }
  .oficial-q-domain { font-size:0.75rem; font-weight:700; color:var(--blue,#1A56DB); }
  .btn-flag { background:transparent; border:1px solid var(--border,#e0e0e0); border-radius:8px; padding:4px 10px; cursor:pointer; font-size:0.75rem; color:var(--text-muted,#555); transition:all 0.15s; }
  .btn-flag.flagged { background:#fff9e6; border-color:#f39c12; color:#D14B00; font-weight:700; }
  .oficial-q-text { font-size:1rem; font-weight:600; line-height:1.6; margin-bottom:1.25rem; }
  .oficial-opts { display:flex; flex-direction:column; gap:0.625rem; margin-bottom:1.25rem; }
  .oficial-opt { display:flex; align-items:flex-start; gap:0.75rem; padding:0.75rem 1rem; border:1.5px solid var(--border,#e0e0e0); border-radius:10px; cursor:pointer; text-align:left; background:var(--surface,#fff); font-size:0.9375rem; transition:all 0.15s; }
  .oficial-opt:hover { border-color:var(--blue,#1A56DB); background:var(--blue-light,#EBF3FF); }
  .oficial-opt.selected { border-color:var(--blue,#1A56DB); background:var(--blue-light,#EBF3FF); font-weight:600; }
  .opt-letter { display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:50%; background:var(--border,#e0e0e0); font-weight:700; font-size:0.75rem; flex-shrink:0; }
  .oficial-opt.selected .opt-letter { background:var(--blue,#1A56DB); color:#fff; }
  .oficial-q-nav { display:flex; gap:0.75rem; justify-content:space-between; }
  .oficial-nav-panel { background:var(--surface,#fff); border:1px solid var(--border,#e0e0e0); border-radius:12px; padding:1rem; position:sticky; top:120px; }
  .oficial-nav-title { font-size:0.75rem; font-weight:700; color:var(--text-muted,#555); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:0.75rem; }
  .oficial-nav-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:4px; margin-bottom:1rem; }
  .onav-btn { width:100%; aspect-ratio:1; border:1.5px solid var(--border,#e0e0e0); border-radius:6px; background:transparent; font-size:0.75rem; cursor:pointer; font-weight:600; transition:all 0.1s; }
  .onav-btn.answered { background:#d4edda; border-color:#0E7A0D; color:#0E7A0D; }
  .onav-btn.flagged { background:#fff9e6; border-color:#f39c12; color:#D14B00; }
  .onav-btn.current { border-color:var(--blue,#1A56DB); outline:2px solid var(--blue,#1A56DB); }
  .btn-block { width:100%; margin-top:0.5rem; }
  .btn-danger { background:#c0392b; color:#fff; border:none; border-radius:8px; padding:0.5rem 1rem; cursor:pointer; font-weight:600; transition:opacity 0.15s; }
  .btn-danger:hover { opacity:0.9; }
  @media(max-width:640px) { .oficial-body { grid-template-columns:1fr; } .oficial-nav-panel { position:static; } }

  /* RESULTADO OFICIAL */
  .result-hero { text-align:center; padding:2.5rem 1rem; border-radius:16px; margin-bottom:1.5rem; }
  .result-pass { background:linear-gradient(135deg,#0E7A0D,#1db954); color:#fff; }
  .result-fail { background:linear-gradient(135deg,#c0392b,#e74c3c); color:#fff; }
  .result-icon { font-size:3rem; margin-bottom:0.5rem; }
  .result-status { font-size:1.25rem; font-weight:800; letter-spacing:0.1em; margin-bottom:0.5rem; }
  .result-score { font-size:4rem; font-weight:900; line-height:1; }
  .result-score span { font-size:1.5rem; opacity:0.7; }
  .result-score-label { font-size:0.875rem; opacity:0.8; margin-bottom:0.5rem; }
  .result-pass-line { font-size:0.8125rem; opacity:0.8; }
  .result-stats-row { display:flex; gap:1rem; justify-content:center; flex-wrap:wrap; margin:1.5rem 0; }
  .result-stat { background:var(--surface,#fff); border:1px solid var(--border,#e0e0e0); border-radius:12px; padding:1rem 1.5rem; text-align:center; }
  .result-stat strong { display:block; font-size:1.5rem; font-weight:800; color:var(--blue,#1A56DB); }
  .result-stat span { font-size:0.75rem; color:var(--text-muted,#555); }
  .domain-result-table { width:100%; border-collapse:collapse; margin-bottom:1rem; }
  .domain-result-table th { text-align:left; font-size:0.75rem; color:var(--text-muted,#555); text-transform:uppercase; letter-spacing:0.06em; padding:0.5rem 0.75rem; border-bottom:2px solid var(--border,#e0e0e0); }
  .domain-result-table td { padding:0.625rem 0.75rem; border-bottom:1px solid var(--border,#e0e0e0); font-size:0.875rem; }
  .mini-bar { height:8px; background:var(--border,#e0e0e0); border-radius:4px; overflow:hidden; min-width:80px; }
  .mini-bar div { height:100%; border-radius:4px; }
  .weak-alert { background:#fff9e6; border:1px solid #f39c12; border-radius:10px; padding:1rem; margin:1rem 0; }
  .weak-tag { display:inline-block; background:#fff; border:1px solid #f39c12; border-radius:6px; padding:2px 10px; font-size:0.8125rem; margin:2px; }
  .result-actions { display:flex; gap:0.75rem; flex-wrap:wrap; margin-top:1.5rem; }
  .section-title { font-size:1rem; font-weight:700; margin:1.5rem 0 0.75rem; }
  .score-pass { color:#0E7A0D; font-weight:700; }
  .score-mid { color:#D14B00; font-weight:700; }
  .score-fail { color:#c0392b; font-weight:700; }

  /* REFAZER ERROS */
  .refazer-btn-wrap { text-align:center; margin:1rem 0 2rem; }
  .btn-warning { background:#f39c12; color:#fff; border:none; border-radius:8px; padding:0.6rem 1.5rem; cursor:pointer; font-weight:700; transition:opacity 0.15s; }
  .btn-warning:hover { opacity:0.9; }

  /* STREAK */
  .streak-widget { display:flex; align-items:center; gap:0.375rem; background:var(--surface,#fff); border:1.5px solid var(--border,#e0e0e0); border-radius:20px; padding:4px 12px; font-size:0.8125rem; margin-right:0.5rem; }
  .streak-widget.streak-hot { border-color:#f39c12; background:#fff9e6; }
  .streak-fire { font-size:1rem; }
  .streak-count { font-weight:800; font-size:1rem; color:var(--blue,#1A56DB); }
  .streak-hot .streak-count { color:#D14B00; }
  .streak-label { color:var(--text-muted,#555); }
  .streak-best { font-size:0.7rem; color:var(--text-muted,#888); border-left:1px solid var(--border,#e0e0e0); padding-left:0.375rem; margin-left:0.25rem; }
  @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }

  /* PLANO DE ESTUDO */
  .plano-setup { background:var(--surface,#fff); border:1px solid var(--border,#e0e0e0); border-radius:12px; padding:1.5rem; max-width:520px; }
  .plano-setup label { display:block; font-weight:600; font-size:0.875rem; margin:1rem 0 0.5rem; }
  .plano-days,.plano-time { display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.5rem; }
  .plano-semanas { display:flex; flex-direction:column; gap:1rem; margin:1rem 0; }
  .plano-semana { background:var(--surface,#fff); border:1px solid var(--border,#e0e0e0); border-radius:12px; overflow:hidden; }
  .plano-semana-header { display:flex; justify-content:space-between; align-items:center; padding:0.75rem 1.25rem; background:var(--blue,#1A56DB); color:#fff; flex-wrap:wrap; gap:0.5rem; }
  .plano-semana-num { font-weight:700; }
  .plano-semana-date { font-size:0.8125rem; opacity:0.85; }
  .plano-semana-time { font-size:0.8125rem; opacity:0.85; }
  .plano-activity { display:flex; gap:1rem; padding:1rem 1.25rem; border-bottom:1px solid var(--border,#e0e0e0); }
  .plano-activity:last-child { border-bottom:none; }
  .plano-act-icon { font-size:1.5rem; flex-shrink:0; margin-top:2px; }
  .plano-act-body strong { display:block; font-size:0.9375rem; margin-bottom:0.25rem; }
  .plano-act-body p { font-size:0.875rem; color:var(--text-muted,#555); margin:0 0 0.5rem; line-height:1.5; }
  .plano-legend { display:flex; gap:1rem; flex-wrap:wrap; font-size:0.8125rem; color:var(--text-muted,#555); margin-bottom:1rem; }

  /* RELATÓRIO */
  .relatorio-actions { display:flex; gap:0.75rem; margin-bottom:1rem; flex-wrap:wrap; }
  .table-wrap { overflow-x:auto; }
  .relatorio-table { width:100%; border-collapse:collapse; font-size:0.875rem; min-width:700px; }
  .relatorio-table th { text-align:left; padding:0.625rem 0.75rem; background:var(--blue,#1A56DB); color:#fff; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.06em; white-space:nowrap; }
  .relatorio-table td { padding:0.625rem 0.75rem; border-bottom:1px solid var(--border,#e0e0e0); }
  .relatorio-table tr:nth-child(even) td { background:var(--surface-alt,#f8f9fa); }
  .weak-cell { font-size:0.8125rem; color:var(--text-muted,#555); max-width:200px; }
  `;
  document.head.appendChild(s);
})();

console.log('[features2.js] Simulado Oficial, Refazer Erros, Streak, Plano de Estudo, Relatório carregados.');
