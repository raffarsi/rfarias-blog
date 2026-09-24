
// ─── PATCH showScreen (executado antes do DOMContentLoaded) ────────────────
// Aguarda app.js definir showScreen e RENDERERS, depois aplica o patch
(function waitAndPatch() {
  function applyPatch() {
    if (typeof showScreen !== 'function' || typeof RENDERERS === 'undefined') {
      setTimeout(applyPatch, 50); return;
    }
    const _orig = showScreen;
    window.showScreen = function(name) {
      // Criar tela se não existir
      if (!document.getElementById('screen-' + name)) {
        const el = document.createElement('section');
        el.id = 'screen-' + name;
        el.className = 'screen hidden';
        const main = document.getElementById('app-main') || document.body;
        main.appendChild(el);
      }
      _orig(name);
      if (RENDERERS[name]) RENDERERS[name]();
    };
  }
  applyPatch();
})();

// ============================================================================
// features.js — Módulo de extensão: revisão de erros, progresso por domínio,
// flashcards, simulado por domínio, modo estudo aprimorado
// Injetado após app.js — estende RENDERERS e funções existentes
// ============================================================================

// ─── 1. REVISÃO DE ERROS ────────────────────────────────────────────────────

RENDERERS.erros = function renderErros() {
  const p = currentProfile();
  const el = document.getElementById('screen-erros') || createScreen('erros');

  // Coletar todas as questões erradas do histórico
  const erradosMap = {};
  (p.history || []).forEach(sim => {
    (sim.results || []).forEach(r => {
      if (!r.correct) {
        const q = QUESTION_BANK.find(q => q.id === r.id);
        if (q) erradosMap[q.id] = { q, chosenIdx: r.chosenIdx, attempts: (erradosMap[q.id]?.attempts || 0) + 1 };
      }
    });
  });

  const errados = Object.values(erradosMap).sort((a, b) => b.attempts - a.attempts);

  if (!errados.length) {
    el.innerHTML = `
      <h2>📋 Revisão de Erros</h2>
      <div class="empty-state">
        <div style="font-size:3rem">🎉</div>
        <p>Nenhum erro registrado ainda. Complete um simulado primeiro!</p>
        <button class="btn btn-primary" onclick="showScreen('simulado')">Fazer simulado</button>
      </div>`;
    return;
  }

  el.innerHTML = `
    <h2>📋 Revisão de Erros <span class="badge-count">${errados.length}</span></h2>
    <p class="lead">Questões que você errou, ordenadas pelas mais frequentes. Revise cada uma até dominar.</p>
    <div class="erros-list" id="erros-list"></div>`;

  const list = document.getElementById('erros-list');
  errados.forEach(({ q, chosenIdx, attempts }) => {
    const card = document.createElement('div');
    card.className = 'erro-card';
    const optsHtml = q.opts.map((opt, i) => `
      <div class="opt-row ${i === q.correct ? 'opt-correct' : i === chosenIdx ? 'opt-wrong' : ''}">
        ${i === q.correct ? '✅' : i === chosenIdx ? '❌' : '⬜'} ${opt}
      </div>`).join('');
    card.innerHTML = `
      <div class="erro-header">
        <span class="domain-tag">${q.domain}</span>
        ${attempts > 1 ? `<span class="badge-erros">Errada ${attempts}x</span>` : ''}
      </div>
      <p class="erro-q">${q.q}</p>
      <div class="erro-opts">${optsHtml}</div>
      <details class="erro-exp">
        <summary>💡 Ver explicação</summary>
        <div class="exp-box">
          <strong>Conceito:</strong><p>${q.concept}</p>
          <strong>Por que a correta está certa:</strong><p>${q.exp[q.correct]}</p>
          ${chosenIdx !== undefined ? `<strong>Por que a sua resposta estava errada:</strong><p>${q.exp[chosenIdx]}</p>` : ''}
          <div class="dica-box">🧠 ${q.dica}</div>
        </div>
      </details>`;
    list.appendChild(card);
  });
};

// ─── 2. PROGRESSO POR DOMÍNIO ───────────────────────────────────────────────

RENDERERS.dominios = function renderDominios() {
  const p = currentProfile();
  const el = document.getElementById('screen-dominios') || createScreen('dominios');

  // Calcular acertos/erros por domínio a partir do histórico
  const stats = {};
  QUESTION_BANK.forEach(q => {
    if (!stats[q.domain]) stats[q.domain] = { total: 0, correct: 0, seen: 0 };
    stats[q.domain].total++;
  });

  (p.history || []).forEach(sim => {
    (sim.results || []).forEach(r => {
      const q = QUESTION_BANK.find(q => q.id === r.id);
      if (!q) return;
      if (!stats[q.domain]) stats[q.domain] = { total: 0, correct: 0, seen: 0 };
      stats[q.domain].seen++;
      if (r.correct) stats[q.domain].correct++;
    });
  });

  const domains = Object.entries(stats).sort((a, b) => {
    const pctA = a[1].seen ? a[1].correct / a[1].seen : -1;
    const pctB = b[1].seen ? b[1].correct / b[1].seen : -1;
    return pctA - pctB; // piores primeiro
  });

  const cardsHtml = domains.map(([domain, s]) => {
    const pct = s.seen ? Math.round((s.correct / s.seen) * 100) : null;
    const bar = pct !== null ? pct : 0;
    const color = pct === null ? '#aaa' : pct >= 70 ? '#0E7A0D' : pct >= 50 ? '#D14B00' : '#c0392b';
    const label = pct === null ? 'Não estudado' : pct >= 70 ? '✅ Bom' : pct >= 50 ? '⚠️ Atenção' : '❌ Estudar';
    return `
      <div class="domain-card">
        <div class="domain-card-header">
          <span class="domain-name">${domain}</span>
          <span class="domain-status" style="color:${color}">${label}</span>
        </div>
        <div class="domain-bar-bg">
          <div class="domain-bar-fill" style="width:${bar}%;background:${color}"></div>
        </div>
        <div class="domain-meta">
          ${pct !== null ? `${s.correct}/${s.seen} acertos (${pct}%)` : 'Nenhuma questão respondida'}
          &nbsp;·&nbsp; ${s.total} questões disponíveis
        </div>
        <button class="btn btn-sm btn-outline" onclick="startSimuladoDominio('${domain.replace(/'/g,"\\'")}')">
          Praticar este domínio →
        </button>
      </div>`;
  }).join('');

  el.innerHTML = `
    <h2>📊 Progresso por Domínio</h2>
    <p class="lead">Veja em que áreas você está bem e onde precisa de mais estudo. Clique em qualquer domínio para praticar só aquele conteúdo.</p>
    <div class="domains-grid">${cardsHtml}</div>`;
};

window.startSimuladoDominio = function(domain) {
  const pool = QUESTION_BANK.filter(q => q.domain === domain);
  if (!pool.length) { showToast('Sem questões para este domínio.'); return; }
  const qty = Math.min(pool.length, 20);
  const selected = shuffleArr([...pool]).slice(0, qty);
  simulado = {
    playerName: STATE.currentStudent,
    mode: 'estudo',
    questions: selected.map(prepareQuestion),
    currentIndex: 0,
    timeLimitSeconds: null,
    remainingSeconds: 0,
    elapsedSeconds: 0,
    startedAt: Date.now(),
    timerInterval: null,
    finished: false,
    domainFilter: domain,
  };
  showScreen('simulado');
  renderSimuladoExam();
};

// ─── 3. FLASHCARDS ──────────────────────────────────────────────────────────

RENDERERS.flashcards = function renderFlashcards() {
  const el = document.getElementById('screen-flashcards') || createScreen('flashcards');

  const domains = [...new Set(QUESTION_BANK.map(q => q.domain))];
  const domainOpts = domains.map(d => `<option value="${d}">${d}</option>`).join('');

  el.innerHTML = `
    <h2>🃏 Flashcards</h2>
    <p class="lead">Clique no card para revelar a resposta. Use as setas para navegar. Ideal para memorização rápida.</p>
    <div class="flashcard-controls">
      <select id="fc-domain" class="fc-select">
        <option value="all">Todos os domínios</option>
        ${domainOpts}
      </select>
      <button class="btn btn-primary" id="fc-start">Iniciar</button>
    </div>
    <div id="fc-area" class="hidden">
      <div class="fc-progress-bar">
        <div class="fc-progress-fill" id="fc-fill"></div>
      </div>
      <div class="fc-counter" id="fc-counter"></div>
      <div class="flashcard" id="flashcard" onclick="fcFlip()">
        <div class="fc-inner" id="fc-inner">
          <div class="fc-front" id="fc-front"></div>
          <div class="fc-back hidden" id="fc-back"></div>
        </div>
      </div>
      <div class="fc-nav">
        <button class="btn btn-outline" onclick="fcPrev()">← Anterior</button>
        <button class="btn btn-outline" id="fc-flip-btn" onclick="fcFlip()">🔄 Virar</button>
        <button class="btn btn-outline" onclick="fcNext()">Próximo →</button>
      </div>
      <div class="fc-self-grade">
        <p>Você sabia?</p>
        <button class="btn btn-success" onclick="fcGrade(true)">✅ Sabia</button>
        <button class="btn btn-danger" onclick="fcGrade(false)">❌ Não sabia</button>
      </div>
      <div class="fc-summary hidden" id="fc-summary"></div>
    </div>`;

  document.getElementById('fc-start').addEventListener('click', () => {
    const domain = document.getElementById('fc-domain').value;
    const pool = domain === 'all' ? QUESTION_BANK : QUESTION_BANK.filter(q => q.domain === domain);
    window._fc = { cards: shuffleArr([...pool]), idx: 0, correct: 0, total: pool.length, flipped: false };
    document.getElementById('fc-area').classList.remove('hidden');
    fcRender();
  });
};

window.fcRender = function() {
  const { cards, idx, total } = window._fc;
  if (idx >= total) { fcShowSummary(); return; }
  const q = cards[idx];
  document.getElementById('fc-fill').style.width = `${Math.round((idx / total) * 100)}%`;
  document.getElementById('fc-counter').textContent = `${idx + 1} / ${total}`;
  document.getElementById('fc-front').innerHTML = `
    <div class="fc-domain-tag">${q.domain}</div>
    <div class="fc-question">${q.q}</div>
    <div class="fc-hint">Clique para ver a resposta</div>`;
  document.getElementById('fc-back').innerHTML = `
    <div class="fc-answer">${q.opts[q.correct]}</div>
    <div class="fc-concept">${q.concept}</div>
    <div class="fc-tip">💡 ${q.dica}</div>`;
  document.getElementById('fc-back').classList.add('hidden');
  document.getElementById('fc-front').classList.remove('hidden');
  window._fc.flipped = false;
};

window.fcFlip = function() {
  if (window._fc.flipped) return;
  window._fc.flipped = true;
  document.getElementById('fc-front').classList.add('hidden');
  document.getElementById('fc-back').classList.remove('hidden');
};

window.fcNext = function() {
  window._fc.idx++;
  fcRender();
};

window.fcPrev = function() {
  if (window._fc.idx > 0) { window._fc.idx--; fcRender(); }
};

window.fcGrade = function(knew) {
  if (knew) window._fc.correct++;
  fcNext();
};

window.fcShowSummary = function() {
  const { correct, total } = window._fc;
  const pct = Math.round((correct / total) * 100);
  document.getElementById('fc-summary').classList.remove('hidden');
  document.getElementById('fc-summary').innerHTML = `
    <h3>Sessão concluída! 🎉</h3>
    <p>Você sabia <strong>${correct} de ${total}</strong> cards (${pct}%)</p>
    <button class="btn btn-primary" onclick="RENDERERS.flashcards()">Nova sessão</button>`;
};

// ─── 4. SIMULADO POR DOMÍNIO — adicionar ao setup existente ─────────────────

const _origSetup = window.renderSimuladoSetup || null;
// Patch: injetar filtro de domínio no setup do simulado
(function patchSimuladoSetup() {
  const origFn = renderSimuladoSetup;
  window.renderSimuladoSetupWithDomain = function() {
    origFn();
    const setupCard = document.querySelector('.simulado-setup-card');
    if (!setupCard) return;

    const domains = [...new Set(QUESTION_BANK.map(q => q.domain))];
    const domainOpts = `<option value="all">Todos os domínios</option>` +
      domains.map(d => `<option value="${d}">${d}</option>`).join('');

    const filterDiv = document.createElement('div');
    filterDiv.className = 'domain-filter-wrap';
    filterDiv.innerHTML = `
      <label>Filtrar por domínio (opcional):</label>
      <select id="domain-filter" class="fc-select">${domainOpts}</select>`;
    setupCard.insertBefore(filterDiv, setupCard.querySelector('#start-simulado-btn'));

    // Patch start button to pass domain
    const origStartBtn = document.getElementById('start-simulado-btn');
    const newBtn = origStartBtn.cloneNode(true);
    origStartBtn.parentNode.replaceChild(newBtn, origStartBtn);
    newBtn.addEventListener('click', () => {
      const domain = document.getElementById('domain-filter').value;
      const qtyBtns = document.querySelectorAll('.qty-btn.active');
      let qty = qtyBtns.length ? parseInt(qtyBtns[0].dataset.qty) : 20;
      if (isNaN(qty)) qty = parseInt(document.getElementById('qty-custom-input')?.value || 20);
      const modeBtn = document.querySelector('.mode-btn.active');
      const mode = modeBtn ? modeBtn.dataset.mode : 'prova';
      const pool = domain === 'all' ? QUESTION_BANK : QUESTION_BANK.filter(q => q.domain === domain);
      qty = Math.min(qty, pool.length);
      const selected = shuffleArr([...pool]).slice(0, qty);
      simulado = {
        playerName: STATE.currentStudent,
        mode,
        questions: selected.map(prepareQuestion),
        currentIndex: 0,
        timeLimitSeconds: mode === 'prova' ? qty * 90 : null,
        remainingSeconds: mode === 'prova' ? qty * 90 : 0,
        elapsedSeconds: 0,
        startedAt: Date.now(),
        timerInterval: null,
        finished: false,
        domainFilter: domain !== 'all' ? domain : null,
      };
      renderSimuladoExam();
      if (simulado.timerInterval) clearInterval(simulado.timerInterval);
      simulado.timerInterval = setInterval(() => {
        if (simulado.mode === 'prova') {
          simulado.remainingSeconds--;
          simulado.elapsedSeconds++;
          const el = document.getElementById('timer-display');
          if (el) {
            const m = Math.floor(simulado.remainingSeconds / 60);
            const s = simulado.remainingSeconds % 60;
            el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
            if (simulado.remainingSeconds <= 60) el.style.color = 'var(--red, #c0392b)';
          }
          if (simulado.remainingSeconds <= 0) finishSimulado();
        } else {
          simulado.elapsedSeconds++;
        }
      }, 1000);
    });
  };
})();

// ─── 5. HELPER: criar tela se não existir ───────────────────────────────────

function createScreen(name) {
  let el = document.getElementById(`screen-${name}`);
  if (!el) {
    el = document.createElement('div');
    el.id = `screen-${name}`;
    el.className = 'screen hidden';
    document.getElementById('app').appendChild(el);
  }
  return el;
}

// ─── 7. CSS DAS NOVAS FEATURES ───────────────────────────────────────────────

(function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
  /* ── REVISÃO DE ERROS ── */
  .erros-list { display: flex; flex-direction: column; gap: 1rem; }
  .erro-card { background: var(--surface, #fff); border: 1px solid var(--border, #e0e0e0); border-radius: 12px; padding: 1.25rem; }
  .erro-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
  .badge-erros { background: #c0392b; color: #fff; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
  .badge-count { background: var(--blue, #1A56DB); color: #fff; font-size: 0.8rem; font-weight: 700; padding: 2px 10px; border-radius: 20px; margin-left: 0.5rem; }
  .erro-q { font-weight: 600; margin-bottom: 0.75rem; }
  .erro-opts { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 0.75rem; }
  .opt-row { padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.875rem; }
  .opt-correct { background: #d4edda; color: #0E7A0D; font-weight: 600; }
  .opt-wrong { background: #f8d7da; color: #c0392b; font-weight: 600; }
  .erro-exp summary { cursor: pointer; color: var(--blue, #1A56DB); font-size: 0.875rem; font-weight: 600; padding: 0.375rem 0; }
  .exp-box { padding: 0.75rem; background: var(--surface-alt, #f8f9fa); border-radius: 8px; margin-top: 0.5rem; font-size: 0.875rem; line-height: 1.6; }
  .exp-box strong { display: block; margin-top: 0.5rem; color: var(--text-muted, #555); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
  .exp-box p { margin: 0.25rem 0 0.5rem; }
  .dica-box { background: #fff9e6; border-left: 3px solid #f39c12; padding: 0.5rem 0.75rem; border-radius: 0 8px 8px 0; margin-top: 0.5rem; font-size: 0.8rem; }

  /* ── PROGRESSO POR DOMÍNIO ── */
  .domains-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
  .domain-card { background: var(--surface, #fff); border: 1px solid var(--border, #e0e0e0); border-radius: 12px; padding: 1.25rem; }
  .domain-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
  .domain-name { font-weight: 700; font-size: 0.9375rem; }
  .domain-status { font-size: 0.8125rem; font-weight: 600; }
  .domain-bar-bg { height: 8px; background: var(--border, #e0e0e0); border-radius: 4px; margin-bottom: 0.5rem; overflow: hidden; }
  .domain-bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
  .domain-meta { font-size: 0.8125rem; color: var(--text-muted, #555); margin-bottom: 0.75rem; }
  .btn-sm { padding: 0.3rem 0.75rem; font-size: 0.8125rem; }
  .btn-outline { border: 1px solid var(--blue, #1A56DB); color: var(--blue, #1A56DB); background: transparent; border-radius: 8px; padding: 0.4rem 1rem; cursor: pointer; font-size: 0.875rem; transition: all 0.15s; }
  .btn-outline:hover { background: var(--blue, #1A56DB); color: #fff; }

  /* ── FLASHCARDS ── */
  .flashcard-controls { display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .fc-select { padding: 0.5rem 0.75rem; border: 1px solid var(--border, #e0e0e0); border-radius: 8px; font-size: 0.875rem; background: var(--surface, #fff); color: var(--text, #1a1a1a); min-width: 220px; }
  .fc-progress-bar { height: 6px; background: var(--border, #e0e0e0); border-radius: 3px; margin-bottom: 0.5rem; overflow: hidden; }
  .fc-progress-fill { height: 100%; background: var(--blue, #1A56DB); border-radius: 3px; transition: width 0.4s ease; }
  .fc-counter { text-align: center; font-size: 0.875rem; color: var(--text-muted, #555); margin-bottom: 1rem; }
  .flashcard { cursor: pointer; perspective: 1000px; margin-bottom: 1rem; }
  .fc-inner { min-height: 220px; background: var(--surface, #fff); border: 2px solid var(--blue, #1A56DB); border-radius: 16px; padding: 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; transition: box-shadow 0.2s; }
  .flashcard:hover .fc-inner { box-shadow: 0 8px 24px rgba(26,86,219,0.12); }
  .fc-domain-tag { font-size: 0.75rem; font-weight: 700; color: var(--blue, #1A56DB); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1rem; }
  .fc-question { font-size: 1.0625rem; font-weight: 600; line-height: 1.5; margin-bottom: 0.75rem; }
  .fc-hint { font-size: 0.8125rem; color: var(--text-muted, #888); }
  .fc-answer { font-size: 1.0625rem; font-weight: 700; color: var(--blue, #1A56DB); margin-bottom: 1rem; }
  .fc-concept { font-size: 0.875rem; color: var(--text, #333); line-height: 1.6; margin-bottom: 0.75rem; }
  .fc-tip { font-size: 0.8125rem; color: #D14B00; background: #fff9e6; border-radius: 8px; padding: 0.5rem 0.75rem; }
  .fc-nav { display: flex; justify-content: center; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
  .fc-self-grade { text-align: center; margin-bottom: 1rem; }
  .fc-self-grade p { font-size: 0.875rem; color: var(--text-muted, #555); margin-bottom: 0.5rem; }
  .fc-self-grade .btn-success { background: #0E7A0D; color: #fff; border: none; border-radius: 8px; padding: 0.5rem 1.25rem; cursor: pointer; margin-right: 0.5rem; }
  .fc-self-grade .btn-danger { background: #c0392b; color: #fff; border: none; border-radius: 8px; padding: 0.5rem 1.25rem; cursor: pointer; }
  .fc-summary { background: var(--surface, #fff); border: 1px solid var(--border, #e0e0e0); border-radius: 12px; padding: 2rem; text-align: center; margin-top: 1rem; }
  .fc-summary h3 { margin-bottom: 0.5rem; }

  /* ── FILTRO DE DOMÍNIO NO SIMULADO ── */
  .domain-filter-wrap { margin: 1rem 0; }
  .domain-filter-wrap label { display: block; font-weight: 600; margin-bottom: 0.375rem; font-size: 0.875rem; }

  /* ── ESTADO VAZIO ── */
  .empty-state { text-align: center; padding: 3rem 1rem; color: var(--text-muted, #555); }
  .empty-state p { margin: 1rem 0 1.5rem; }
  `;
  document.head.appendChild(style);
})();

console.log('[features.js] Módulo carregado: Revisão de Erros, Progresso por Domínio, Flashcards, Filtro de Domínio.');
