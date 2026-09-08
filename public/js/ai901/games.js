// ============================================================================
// AI-901 Prep Hub — Módulo de Gamificação (js/games.js)
// Implementa os 4 jogos educacionais: Cruzadinha, Caça-Palavras, Drag & Drop
// e Desafio Relâmpago. Cada jogo expõe um método render(container, onComplete)
// que desenha a UI dentro do elemento "container" e chama onComplete(xp, info)
// quando o jogador ganha XP (uma ou mais vezes durante a partida).
// Este módulo não conhece localStorage nem o estado global — quem persiste o
// progresso é o app.js, através do callback onComplete.
// Motor idêntico ao do AZ-900 Prep Hub; apenas o conteúdo (palavras, pares,
// dicas) foi adaptado ao vocabulário do AI-901 (IA generativa, Foundry).
// ============================================================================

const Games = (() => {

  // --------------------------------------------------------------------
  // Utilidades compartilhadas
  // --------------------------------------------------------------------
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function flash(node, className) {
    node.classList.add(className);
    setTimeout(() => node.classList.remove(className), 600);
  }

  // ==========================================================================
  // 1) CRUZADINHA (Crossword)
  // ==========================================================================
  const CROSSWORD_DATA = {
    size: 10,
    words: [
      { num: 1, word: "RAG", clue: "Sigla da técnica que combina busca de informações externas com geração de texto para fundamentar respostas.", row: 2, col: 2, dir: "down" },
      { num: 2, word: "TOKEN", clue: "Unidade básica de texto processada por um modelo de linguagem.", row: 1, col: 3, dir: "down" },
      { num: 3, word: "PROMPT", clue: "Instrução ou pergunta enviada a um modelo de IA generativa.", row: 2, col: 1, dir: "across" },
      { num: 4, word: "AGENTE", clue: "Sistema de IA capaz de usar ferramentas e executar ações para atingir um objetivo.", row: 4, col: 1, dir: "across" },
      { num: 5, word: "OCR", clue: "Sigla do reconhecimento óptico de caracteres, usado para extrair texto de imagens.", row: 8, col: 2, dir: "across" },
      { num: 6, word: "FOUNDRY", clue: "Nome da plataforma unificada da Microsoft para construir soluções de IA.", row: 6, col: 1, dir: "across" },
    ]
  };

  const Crossword = {
    render(container, onComplete) {
      container.innerHTML = "";
      const wrap = el("div", "game-crossword");
      const title = el("h3", "game-title", "🧩 Cruzadinha AI-901");
      const desc = el("p", "game-desc", "Preencha as palavras a partir das dicas. Clique em Verificar quando terminar.");
      wrap.append(title, desc);

      const layout = el("div", "crossword-layout");
      const gridWrap = el("div", "crossword-grid-wrap");
      const table = document.createElement("table");
      table.className = "crossword-grid";

      const size = CROSSWORD_DATA.size;
      const cellMap = {}; // "r,c" -> { letter, num, inputs: [] }

      CROSSWORD_DATA.words.forEach(w => {
        for (let i = 0; i < w.word.length; i++) {
          const r = w.dir === "down" ? w.row + i : w.row;
          const c = w.dir === "across" ? w.col + i : w.col;
          const key = `${r},${c}`;
          if (!cellMap[key]) cellMap[key] = { letter: w.word[i], num: null };
          if (i === 0) cellMap[key].num = w.num;
        }
      });

      const inputRefs = {};
      for (let r = 0; r < size; r++) {
        const tr = document.createElement("tr");
        for (let c = 0; c < size; c++) {
          const td = document.createElement("td");
          const key = `${r},${c}`;
          if (cellMap[key]) {
            td.className = "cw-cell";
            if (cellMap[key].num) {
              const numLabel = el("span", "cw-num", String(cellMap[key].num));
              td.appendChild(numLabel);
            }
            const input = document.createElement("input");
            input.maxLength = 1;
            input.className = "cw-input";
            input.setAttribute("aria-label", `Letra da posição ${r},${c}`);
            input.addEventListener("input", () => { input.value = input.value.toUpperCase(); });
            td.appendChild(input);
            inputRefs[key] = input;
          } else {
            td.className = "cw-cell cw-blocked";
          }
          tr.appendChild(td);
        }
        table.appendChild(tr);
      }
      gridWrap.appendChild(table);

      const cluesWrap = el("div", "crossword-clues");
      const acrossTitle = el("h4", null, "Horizontais");
      const downTitle = el("h4", null, "Verticais");
      const acrossList = el("ul");
      const downList = el("ul");
      CROSSWORD_DATA.words.forEach(w => {
        const li = el("li", null, `${w.num}. ${w.clue} (${w.word.length} letras)`);
        if (w.dir === "across") acrossList.appendChild(li); else downList.appendChild(li);
      });
      cluesWrap.append(acrossTitle, acrossList, downTitle, downList);

      layout.append(gridWrap, cluesWrap);

      const checkBtn = el("button", "btn btn-primary", "Verificar respostas");
      const resetBtn = el("button", "btn btn-secondary", "Limpar");
      const result = el("div", "game-result");
      const btnRow = el("div", "game-actions");
      btnRow.append(checkBtn, resetBtn);

      checkBtn.addEventListener("click", () => {
        let correctWords = 0;
        CROSSWORD_DATA.words.forEach(w => {
          let wordOk = true;
          for (let i = 0; i < w.word.length; i++) {
            const r = w.dir === "down" ? w.row + i : w.row;
            const c = w.dir === "across" ? w.col + i : w.col;
            const input = inputRefs[`${r},${c}`];
            const ok = input.value.toUpperCase() === w.word[i];
            input.classList.remove("cw-correct", "cw-wrong");
            input.classList.add(ok ? "cw-correct" : "cw-wrong");
            if (!ok) wordOk = false;
          }
          if (wordOk) correctWords++;
        });
        const xp = correctWords * 15;
        const total = CROSSWORD_DATA.words.length;
        result.textContent = `Você acertou ${correctWords} de ${total} palavras! +${xp} XP`;
        result.className = "game-result " + (correctWords === total ? "result-perfect" : "result-partial");
        if (xp > 0) onComplete(xp, { game: "crossword", correctWords, total });
      });

      resetBtn.addEventListener("click", () => {
        Object.values(inputRefs).forEach(inp => {
          inp.value = "";
          inp.classList.remove("cw-correct", "cw-wrong");
        });
        result.textContent = "";
      });

      wrap.append(layout, btnRow, result);
      container.appendChild(wrap);
    }
  };

  // ==========================================================================
  // 2) CAÇA-PALAVRAS (Word Search)
  // ==========================================================================
  const WORDSEARCH_WORDS = [
    "FOUNDRY", "PROMPT", "TOKEN", "AGENTE", "MODELO", "VISAO",
    "FALA", "TEXTO", "IMAGEM", "PYTHON", "GROUNDING", "EMBEDDING"
  ];
  const WORDSEARCH_SIZE = 15;
  const WS_DIRECTIONS = [
    [0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];

  function generateWordSearchGrid(words, size) {
    const grid = Array.from({ length: size }, () => Array(size).fill(null));
    const placements = [];

    const sorted = words.slice().sort((a, b) => b.length - a.length);
    sorted.forEach(word => {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 300) {
        attempts++;
        const [dr, dc] = WS_DIRECTIONS[Math.floor(Math.random() * WS_DIRECTIONS.length)];
        const maxRow = dr === 1 ? size - word.length : dr === -1 ? word.length - 1 : size - 1;
        const minRow = dr === -1 ? word.length - 1 : 0;
        const maxCol = dc === 1 ? size - word.length : dc === -1 ? word.length - 1 : size - 1;
        const minCol = dc === -1 ? word.length - 1 : 0;
        if (maxRow < minRow || maxCol < minCol) continue;
        const row = minRow + Math.floor(Math.random() * (maxRow - minRow + 1));
        const col = minCol + Math.floor(Math.random() * (maxCol - minCol + 1));

        let fits = true;
        const cells = [];
        for (let i = 0; i < word.length; i++) {
          const r = row + dr * i;
          const c = col + dc * i;
          if (r < 0 || r >= size || c < 0 || c >= size) { fits = false; break; }
          const existing = grid[r][c];
          if (existing !== null && existing !== word[i]) { fits = false; break; }
          cells.push({ r, c });
        }
        if (!fits) continue;
        cells.forEach((cell, i) => { grid[cell.r][cell.c] = word[i]; });
        placements.push({ word, cells });
        placed = true;
      }
    });

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === null) grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
    return { grid, placements };
  }

  const WordSearch = {
    render(container, onComplete) {
      container.innerHTML = "";
      const wrap = el("div", "game-wordsearch");
      wrap.append(el("h3", "game-title", "🔍 Caça-Palavras — Conceitos de IA"));
      wrap.append(el("p", "game-desc", "Arraste (clique e segure) sobre as letras para marcar as palavras escondidas."));

      const timerBar = el("div", "game-timer");
      const timerLabel = el("span", "timer-label", "Tempo: 0s");
      timerBar.appendChild(timerLabel);
      wrap.appendChild(timerBar);

      const layout = el("div", "wordsearch-layout");
      const { grid, placements } = generateWordSearchGrid(WORDSEARCH_WORDS, WORDSEARCH_SIZE);
      const foundSet = new Set();

      const table = document.createElement("table");
      table.className = "wordsearch-grid";
      const cellEls = [];
      for (let r = 0; r < WORDSEARCH_SIZE; r++) {
        const tr = document.createElement("tr");
        cellEls[r] = [];
        for (let c = 0; c < WORDSEARCH_SIZE; c++) {
          const td = document.createElement("td");
          td.className = "ws-cell";
          td.textContent = grid[r][c];
          td.dataset.r = r;
          td.dataset.c = c;
          tr.appendChild(td);
          cellEls[r][c] = td;
        }
        table.appendChild(tr);
      }
      layout.appendChild(table);

      const wordList = el("div", "wordsearch-list");
      wordList.appendChild(el("h4", null, "Palavras a encontrar"));
      const ul = el("ul");
      const wordItemEls = {};
      WORDSEARCH_WORDS.forEach(w => {
        const li = el("li", null, w);
        ul.appendChild(li);
        wordItemEls[w] = li;
      });
      wordList.appendChild(ul);
      layout.appendChild(wordList);

      const result = el("div", "game-result");
      wrap.append(layout, result);
      container.appendChild(wrap);

      // ---- Seleção por arraste (mouse e toque) ----
      let selecting = false;
      let startCell = null;
      let currentPath = [];

      function cellFromEvent(evt) {
        const point = evt.touches ? evt.touches[0] : evt;
        const target = document.elementFromPoint(point.clientX, point.clientY);
        if (target && target.classList.contains("ws-cell")) return target;
        return null;
      }

      function clearTempHighlight() {
        currentPath.forEach(td => td.classList.remove("ws-selecting"));
      }

      function pathBetween(r1, c1, r2, c2) {
        const dr = Math.sign(r2 - r1);
        const dc = Math.sign(c2 - c1);
        const steps = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
        // só aceita linha reta (horizontal, vertical ou diagonal)
        if (dr !== 0 && dc !== 0 && Math.abs(r2 - r1) !== Math.abs(c2 - c1)) return [];
        const path = [];
        for (let i = 0; i <= steps; i++) {
          path.push(cellEls[r1 + dr * i][c1 + dc * i]);
        }
        return path;
      }

      function startSelection(td) {
        selecting = true;
        startCell = td;
        currentPath = [td];
        td.classList.add("ws-selecting");
      }

      function updateSelection(td) {
        if (!selecting || !td) return;
        clearTempHighlight();
        const r1 = +startCell.dataset.r, c1 = +startCell.dataset.c;
        const r2 = +td.dataset.r, c2 = +td.dataset.c;
        currentPath = pathBetween(r1, c1, r2, c2);
        currentPath.forEach(cell => cell.classList.add("ws-selecting"));
      }

      function endSelection() {
        if (!selecting) return;
        selecting = false;
        clearTempHighlight();
        checkSelection(currentPath);
        currentPath = [];
        startCell = null;
      }

      function checkSelection(path) {
        if (path.length < 2) return;
        const letters = path.map(td => td.textContent).join("");
        const lettersRev = letters.split("").reverse().join("");
        const match = placements.find(p =>
          !foundSet.has(p.word) && (p.word === letters || p.word === lettersRev)
        );
        if (match) {
          foundSet.add(match.word);
          path.forEach(td => td.classList.add("ws-found"));
          const li = wordItemEls[match.word];
          li.classList.add("ws-word-found");
          const xp = 15;
          onComplete(xp, { game: "wordsearch", word: match.word });
          if (foundSet.size === placements.length) {
            clearInterval(timerInterval);
            const bonus = Math.max(0, 60 - elapsed) ;
            result.textContent = `Parabéns! Você encontrou todas as ${placements.length} palavras em ${elapsed}s. Bônus de velocidade: +${bonus} XP`;
            result.className = "game-result result-perfect";
            if (bonus > 0) onComplete(bonus, { game: "wordsearch", bonus: true });
          }
        }
      }

      table.addEventListener("mousedown", e => { const td = e.target.closest(".ws-cell"); if (td) startSelection(td); });
      table.addEventListener("mouseover", e => { const td = e.target.closest(".ws-cell"); if (td) updateSelection(td); });
      document.addEventListener("mouseup", endSelection);

      table.addEventListener("touchstart", e => { const td = cellFromEvent(e); if (td) { startSelection(td); e.preventDefault(); } }, { passive: false });
      table.addEventListener("touchmove", e => { const td = cellFromEvent(e); if (td) updateSelection(td); e.preventDefault(); }, { passive: false });
      table.addEventListener("touchend", endSelection);

      let elapsed = 0;
      const timerInterval = setInterval(() => {
        elapsed++;
        timerLabel.textContent = `Tempo: ${elapsed}s`;
      }, 1000);
    }
  };

  // ==========================================================================
  // 3) DRAG AND DROP (Associação de Conceitos)
  // ==========================================================================
  const DRAGDROP_SETS = [
    {
      title: "Conceitos de IA Generativa",
      pairs: [
        ["Token", "Unidade de texto que o modelo processa na entrada e na saída"],
        ["Prompt", "Instrução ou pergunta enviada ao modelo generativo"],
        ["Temperature", "Parâmetro que controla o grau de aleatoriedade/criatividade das respostas"],
        ["Alucinação", "Quando o modelo gera conteúdo plausível mas factualmente incorreto"],
        ["Embedding", "Representação numérica (vetor) de um texto que captura seu significado"],
        ["Grounding", "Ancorar as respostas do modelo em dados externos confiáveis"],
      ]
    },
    {
      title: "Workloads de IA",
      pairs: [
        ["Análise de Texto", "Identificar sentimento, entidades e palavras-chave em um texto"],
        ["Visão Computacional", "Interpretar e extrair informações de imagens e vídeos"],
        ["Fala", "Converter voz em texto (e texto em voz)"],
        ["Extração de Informação", "Transformar conteúdo não estruturado em dados estruturados"],
        ["Agente de IA", "Sistema que usa ferramentas e executa ações para atingir um objetivo"],
        ["IA Generativa", "Modelos que criam novo conteúdo, como texto e imagens"],
      ]
    },
    {
      title: "Microsoft Foundry",
      pairs: [
        ["Catálogo de Modelos", "Coleção pesquisável de modelos de fundação disponíveis para uso"],
        ["Playground", "Ambiente interativo para testar prompts antes de integrar via código"],
        ["Projeto", "Espaço de trabalho que agrupa recursos relacionados a um caso de uso"],
        ["Foundry SDK", "Bibliotecas de programação para integrar modelos via código"],
        ["Avaliação", "Processo de medir a qualidade e segurança das respostas geradas"],
        ["Foundry Tools", "Capacidades especializadas, como Azure Speech e Content Understanding"],
      ]
    },
    {
      title: "IA Responsável",
      pairs: [
        ["Equidade", "Tratar todos os grupos de pessoas de forma justa, sem viés"],
        ["Confiabilidade e Segurança", "Funcionar de forma consistente e segura, mesmo em cenários inesperados"],
        ["Privacidade e Segurança", "Proteger os dados pessoais usados para treinar e operar o sistema"],
        ["Inclusão", "Capacitar e envolver pessoas de diferentes habilidades e origens"],
        ["Transparência", "Explicar claramente como e por que o sistema toma decisões"],
        ["Responsabilização", "Garantir que pessoas e organizações respondam pelos impactos do sistema"],
      ]
    }
  ];

  const DragDrop = {
    render(container, onComplete) {
      container.innerHTML = "";
      const wrap = el("div", "game-dragdrop");
      wrap.append(el("h3", "game-title", "🎯 Associe os Conceitos"));
      wrap.append(el("p", "game-desc", "Clique em um termo à esquerda e depois na definição correspondente à direita. Em telas com mouse, também é possível arrastar."));

      const selector = el("div", "dragdrop-selector");
      DRAGDROP_SETS.forEach((set, idx) => {
        const btn = el("button", "btn btn-tab" + (idx === 0 ? " active" : ""), set.title);
        btn.addEventListener("click", () => {
          selector.querySelectorAll(".btn-tab").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          renderSet(idx);
        });
        selector.appendChild(btn);
      });
      wrap.appendChild(selector);

      const board = el("div", "dragdrop-board");
      const result = el("div", "game-result");
      wrap.append(board, result);
      container.appendChild(wrap);

      function renderSet(idx) {
        board.innerHTML = "";
        result.textContent = "";
        const set = DRAGDROP_SETS[idx];
        const leftCol = el("div", "dragdrop-col");
        const rightCol = el("div", "dragdrop-col");
        const terms = shuffle(set.pairs.map(p => p[0]));
        const defs = shuffle(set.pairs.map(p => p[1]));
        const matched = new Set();
        let selectedTerm = null;

        terms.forEach(term => {
          const item = el("div", "drag-item", term);
          item.draggable = true;
          item.dataset.term = term;
          item.addEventListener("dragstart", e => { e.dataTransfer.setData("text/plain", term); });
          item.addEventListener("click", () => {
            if (item.classList.contains("matched")) return;
            leftCol.querySelectorAll(".drag-item").forEach(i => i.classList.remove("selected"));
            item.classList.add("selected");
            selectedTerm = term;
          });
          leftCol.appendChild(item);
        });

        defs.forEach(def => {
          const zone = el("div", "drop-zone", def);
          zone.dataset.def = def;
          zone.addEventListener("dragover", e => e.preventDefault());
          zone.addEventListener("drop", e => {
            e.preventDefault();
            const term = e.dataTransfer.getData("text/plain");
            attemptMatch(term, def, zone);
          });
          zone.addEventListener("click", () => {
            if (!selectedTerm || zone.classList.contains("matched")) return;
            attemptMatch(selectedTerm, def, zone);
          });
          rightCol.appendChild(zone);
        });

        function attemptMatch(term, def, zoneEl) {
          const pair = set.pairs.find(p => p[0] === term);
          const termEl = leftCol.querySelector(`.drag-item[data-term="${CSS.escape(term)}"]`);
          if (pair && pair[1] === def) {
            zoneEl.classList.add("matched");
            if (termEl) termEl.classList.add("matched");
            matched.add(term);
            selectedTerm = null;
            const xp = 10;
            onComplete(xp, { game: "dragdrop", term });
            if (matched.size === set.pairs.length) {
              result.textContent = `Conjunto concluído! ${matched.size}/${set.pairs.length} associações corretas.`;
              result.className = "game-result result-perfect";
              onComplete(0, { game: "dragdrop", setComplete: true, setIndex: idx });
            }
          } else {
            flash(zoneEl, "drop-wrong");
            if (termEl) flash(termEl, "drop-wrong");
          }
        }

        board.append(leftCol, rightCol);
      }

      renderSet(0);
    }
  };

  // ==========================================================================
  // 4) DESAFIO RELÂMPAGO (Lightning Round)
  // ==========================================================================
  const Lightning = {
    render(container, onComplete, questionBank) {
      container.innerHTML = "";
      const wrap = el("div", "game-lightning");
      wrap.append(el("h3", "game-title", "⚡ Desafio Relâmpago"));
      wrap.append(el("p", "game-desc", "Responda o mais rápido possível! Cada questão vale pontos base + bônus de velocidade."));

      const startBtn = el("button", "btn btn-primary", "Iniciar Desafio (15 questões, 12s cada)");
      wrap.appendChild(startBtn);
      container.appendChild(wrap);

      startBtn.addEventListener("click", () => startRound());

      function startRound() {
        wrap.innerHTML = "";
        wrap.append(el("h3", "game-title", "⚡ Desafio Relâmpago"));

        const TIME_LIMIT = 12;
        const TOTAL_Q = Math.min(15, questionBank.length);
        const pool = shuffle(questionBank).slice(0, TOTAL_Q);
        let idx = 0;
        let score = 0;
        let correctCount = 0;
        let timer = null;
        let timeLeft = TIME_LIMIT;

        const progress = el("div", "lightning-progress");
        const timerBar = el("div", "lightning-timer-outer");
        const timerFill = el("div", "lightning-timer-fill");
        timerBar.appendChild(timerFill);
        const qBox = el("div", "lightning-question");
        const optsBox = el("div", "lightning-options");
        const scoreBox = el("div", "lightning-score");

        wrap.append(progress, timerBar, qBox, optsBox, scoreBox);
        container.appendChild(wrap);

        function renderQuestion() {
          if (idx >= pool.length) return finishRound();
          const q = pool[idx];
          progress.textContent = `Questão ${idx + 1} de ${pool.length}`;
          qBox.textContent = q.q;
          optsBox.innerHTML = "";
          const opts = q.opts.map((text, i) => ({ text, correct: i === q.correct }));
          shuffle(opts).forEach(opt => {
            const btn = el("button", "btn btn-option", opt.text);
            btn.addEventListener("click", () => answer(opt.correct, btn));
            optsBox.appendChild(btn);
          });
          timeLeft = TIME_LIMIT;
          timerFill.style.width = "100%";
          clearInterval(timer);
          timer = setInterval(() => {
            timeLeft -= 0.1;
            timerFill.style.width = Math.max(0, (timeLeft / TIME_LIMIT) * 100) + "%";
            if (timeLeft <= 0) {
              clearInterval(timer);
              answer(false, null);
            }
          }, 100);
        }

        function answer(isCorrect, btnEl) {
          clearInterval(timer);
          optsBox.querySelectorAll(".btn-option").forEach(b => b.disabled = true);
          if (isCorrect) {
            correctCount++;
            const speedBonus = Math.round((timeLeft / TIME_LIMIT) * 10);
            const gained = 10 + speedBonus;
            score += gained;
            if (btnEl) flash(btnEl, "opt-correct-flash");
            if (btnEl) btnEl.classList.add("opt-correct");
            onComplete(gained, { game: "lightning", correct: true });
          } else {
            if (btnEl) btnEl.classList.add("opt-wrong");
          }
          idx++;
          setTimeout(renderQuestion, 700);
        }

        function finishRound() {
          onComplete(0, { game: "lightning", finished: true });
          wrap.innerHTML = "";
          wrap.append(el("h3", "game-title", "⚡ Desafio Relâmpago — Resultado"));
          const summary = el("div", "game-result result-perfect",
            `Você acertou ${correctCount} de ${pool.length} questões e ganhou ${score} XP no total!`);
          const again = el("button", "btn btn-primary", "Jogar novamente");
          again.addEventListener("click", () => Lightning.render(container, onComplete, questionBank));
          wrap.append(summary, again);
          container.appendChild(wrap);
        }

        renderQuestion();
      }
    }
  };

  return { Crossword, WordSearch, DragDrop, Lightning };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = Games;
}
