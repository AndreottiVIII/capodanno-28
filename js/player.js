// ===== Problemi e lezioni sul goban =====
const PROMPT = {
  capture: 'Il nero gioca e cattura le pietre segnate.',
  save: 'Il nero gioca e salva le pietre segnate.',
  kill: 'Il nero gioca e uccide il gruppo bianco.',
  live: 'Il nero gioca e fa vivere il suo gruppo.',
};

// Layout comune: goban a sinistra (sopra sul telefono), pannello a destra (sotto)
function playLayout(host, cls) {
  host.innerHTML = '';
  const wrap = h('div', { class: 'board-wrap' });
  const frame = h('div', { class: 'goban-frame' }, wrap);
  const kicker = h('p', { class: 'kicker' }), title = h('h2', { class: 'play-title' }), progress = h('div', { class: 'progress' });
  const head = h('header', { class: 'play-head' }, progress, kicker, title);
  const body = h('div', { class: 'play-body' }), fb = h('p', { class: 'feedback', 'aria-live': 'polite' }), actions = h('div', { class: 'actions' });
  const log = h('div', { class: 'log', 'aria-live': 'polite' });
  const logBox = h('details', { class: 'logbox' }, h('summary', {}, 'Commento mossa per mossa'), log);
  const coachOut = h('div', { class: 'coach-out', hidden: true });
  const side = h('div', { class: 'play-side card' }, head, body, fb, actions, coachOut, logBox);
  const sec = h('section', { class: 'play ' + (cls || '') }, h('div', { class: 'play-board' }, frame), side);
  host.append(sec);
  const goban = new Goban(wrap);
  window.__goban = goban; // per le prove automatiche
  return { sec, goban, head, kicker, title, progress, body, fb, actions, log, logBox, coachOut, side };
}
function setProgress(L, i, n) {
  L.progress.innerHTML = '';
  if (!n || n < 2) return;
  for (let k = 0; k < n; k++) L.progress.append(h('span', { class: k < i ? 'past' : k === i ? 'now' : '' }));
  L.progress.setAttribute('aria-label', `${i + 1} di ${n}`);
}
function setFeedback(L, kind, text) { L.fb.className = 'feedback ' + (kind || ''); if (text) setText(L.fb, text); else L.fb.textContent = ''; }
function logLine(L, text, cls) {
  const line = h('div', { class: 'log-line ' + (cls || '') }); line.append(linkify(text));
  L.log.append(line); L.log.scrollTop = L.log.scrollHeight;
  return line;
}
function clearLog(L) { L.log.innerHTML = ''; }
function coachSay(L, paragraphs) {
  L.coachOut.hidden = false; L.coachOut.innerHTML = '';
  L.coachOut.append(h('div', { class: 'coach-h' }, h('span', { class: 'seal-mini' }, '師'), 'Il maestro'));
  for (const p of paragraphs) { const el = h('p', {}); el.append(linkify(p)); L.coachOut.append(el); }
  L.coachOut.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
}

function refutationLine(P, after) {
  const line = []; const c = after.clone();
  if (userIsAttacker(P.kind)) { line.push(refutation(P, c)); return line; }
  for (let i = 0; i < 14; i++) {
    let best = null, bs = 99;
    for (const m of candMoves(P, c, WHITE)) {
      if (m === PASS) continue; const t = c.clone(); if (!t.play(m, WHITE)) continue;
      const gone = targetGone(P, t);
      if (!gone && !attWins(P, t, BLACK)) continue;
      let sc = gone ? 0 : 10; if (!gone) for (const tg of P.targets) if (t.cells[tg] === BLACK) sc = Math.min(sc, t.group(tg).libs.length);
      if (sc < bs) { bs = sc; best = m; }
    }
    if (best === null) break;
    c.play(best, WHITE); line.push(best);
    if (targetGone(P, c)) break;
    let bm = null, bl = -1;
    for (const m of candMoves(P, c, BLACK)) {
      if (m === PASS) continue; const t = c.clone(); if (!t.play(m, BLACK)) continue;
      let l = 0; for (const tg of P.targets) if (t.cells[tg] === BLACK) l += t.group(tg).libs.length;
      if (l > bl) { bl = l; bm = m; }
    }
    if (bm === null) break;
    c.play(bm, BLACK); line.push(bm);
  }
  return line;
}
// sequenza risolutiva calcolata dal risolutore, per il maestro
function solutionLine(P) {
  const b = P.board.clone(), line = [];
  for (let i = 0; i < 8; i++) {
    const cm = correctMoves(P, b); if (!cm.length) break;
    b.play(cm[0], BLACK); line.push(cm[0]);
    if (isSolved(P, b)) break;
    const r = engineReply(P, b); b.play(r, WHITE); line.push(r);
  }
  return line;
}

// opts: { onEvent(type, info), extra(actionsEl, state), noPrompt, prompt }
// eventi: 'result' (primo esito, ok/ko), 'solved' {firstTry, usedSolution}, 'next'
function playProblem(P, L, opts) {
  opts = opts || {};
  const goban = L.goban;
  let board = P.board.clone(), firstTry = true, reported = false, done = false, moves = [], busy = false, usedSolution = false, hintStep = 0, solvedMoves = null, lastWrong = null;
  const snaps = [];
  const emit = (t, info) => opts.onEvent && opts.onEvent(t, info || {});
  const labels = () => { const l = {}; moves.forEach((m, i) => { if (m !== PASS && board.cells[m] !== EMPTY) l[m] = i + 1; }); return l; };
  const show = extra => { goban.ghostColor = BLACK; goban.set(Object.assign({ board, targets: P.region ? null : P.targets, region: P.region, labels: labels(), label: 'Goban del problema. ' + (opts.prompt || PROMPT[P.kind]) }, extra)); };
  const report = ok => { if (reported) return; reported = true; emit('result', { ok }); };
  const cn = q => coordName(P.board, q);
  L.body.innerHTML = '';
  if (!opts.noPrompt) setText(L.title, opts.prompt || PROMPT[P.kind]);
  setFeedback(L, '', ''); clearLog(L); L.coachOut.hidden = true;

  const setActions = list => { L.actions.innerHTML = ''; list.filter(Boolean).forEach(b => L.actions.append(b)); if (opts.extra) opts.extra(L.actions, { done }); };
  const bHint = () => btn(hintStep === 0 ? 'Suggerimento' : 'Mostra la soluzione', hint, '');
  const bUndo = () => { const b = btn('Indietro di una', undo, ''); b.disabled = !snaps.length || busy; return b; };
  const bCoach = () => btn('Il maestro', explain, 'ghost');
  const baseActions = () => setActions([bHint(), bUndo(), bCoach()]);

  function hint() {
    if (done || busy) return;
    if (hintStep === 0) {
      hintStep = 1; firstTry = false;
      setFeedback(L, 'info', 'Idea: ' + (ideaOf(P) || 'conta le libertà delle catene vicine alle pietre segnate.'));
      logLine(L, 'Suggerimento usato: se lo risolvi vale una perla invece di due.', 'dim');
      baseActions(); return;
    }
    usedSolution = true; firstTry = false; report(false);
    const cm = correctMoves(P, board); if (!cm.length) return;
    const marks = {}; cm.forEach(p => marks[p] = 'good');
    goban.update({ marks });
    setFeedback(L, 'info', `La mossa giusta: ${cm.map(q => coordName(board, q)).join(' oppure ')}. Giocala per vedere come continua (senza perle).`);
  }
  function undo() {
    if (busy || done || !snaps.length) return;
    const sn = snaps.pop(); board = sn.board; moves = sn.moves; lastWrong = null;
    show({}); goban.clickable = true;
    setFeedback(L, '', 'Di nuovo: ' + (opts.prompt || PROMPT[P.kind]));
    baseActions();
  }
  function explain() {
    const lines = [];
    const th = themeOf(P);
    if (th && THEMES[th]) lines.push(`Tema: ${THEMES[th].name}${THEMES[th].jp ? ' (' + THEMES[th].jp + ')' : ''}. ${THEMES[th].idea}`);
    else if (ideaOf(P)) lines.push(ideaOf(P));
    if (P.shapeName) lines.push(`Lo spazio interno ha la forma "${P.shapeName}": quello che decide è il punto vitale.`);
    if (lastWrong !== null) {
      const j = judgeMove(P, P.board, lastWrong.move);
      const line = j.legal ? refutationLine(P, j.board) : [];
      lines.push(`La tua mossa ${cn(lastWrong.move)} non basta. ` + (line.length ? `La risposta che la smonta: ${line.map(cn).join(', ')} (a turno, comincia il bianco).` : ''));
    }
    if (done || usedSolution || lastWrong !== null || hintStep > 0) {
      const sol = solutionLine(P);
      if (sol.length) {
        const b = P.board.clone(); let c = BLACK; const said = [];
        for (const m of sol.slice(0, 6)) { said.push(describeMove(b, m, c, { target: P.targets[0] })); b.play(m, c); c = other(c); }
        lines.push('La sequenza giusta, verificata dal risolutore: ' + said.join(' '));
      }
    } else {
      lines.push('Prima di giocare, conta: quante libertà hanno le pietre segnate? E le tue pietre lì vicino? La mossa giusta di solito toglie una libertà senza lasciare una via di fuga. Se dopo un tentativo sbagliato richiami il maestro, ti mostro la sequenza completa.');
    }
    coachSay(L, lines);
  }
  function temptingWrong() {
    const pool = P.region ? P.region.slice() : candidatePool(P, P.board);
    const libs = new Set(); if (!P.region) for (const t of P.targets) if (P.board.cells[t] !== EMPTY) for (const l of P.board.group(t).libs) libs.add(l);
    const scored = [];
    for (const m of pool) {
      if (P.board.cells[m] !== EMPTY) continue;
      const j = judgeMove(P, P.board, m); if (!j.legal || j.ok) continue;
      let sc = libs.has(m) ? 0 : 5;
      if (!P.region && userIsAttacker(P.kind)) { for (const t of P.targets) if (j.board.cells[t] === WHITE && j.board.group(t).libs.length === 1) sc -= 2; }
      if (P.region) { let adj = 0; for (const d of P.board.dirs) if (P.region.includes(m + d)) adj++; sc -= adj; }
      scored.push([sc, m, j.board]);
    }
    scored.sort((a, b) => a[0] - b[0]);
    return scored[0] || null;
  }
  async function animate(seq, startColor, mark) {
    let c = startColor;
    for (const m of seq) {
      await sleep(reduceMotion ? 150 : 800);
      logLine(L, describeMove(board, m, c, { target: P.targets[0] }), c === WHITE ? 'alert' : '');
      board.play(m, c); moves.push(m); show(Object.assign({ last: m }, mark ? { marks: mark } : {})); c = other(c);
    }
  }
  async function whyNot() {
    const tw = temptingWrong();
    if (!tw) { setFeedback(L, 'info', 'Qui quasi ogni altra mossa fallisce subito: non c\'è un\'alternativa tentatrice da mostrare.'); return; }
    busy = true; goban.clickable = false; clearLog(L); L.logBox.open = true;
    const [, w, after] = tw;
    setFeedback(L, 'info', `Una mossa che sembra buona: ${coordName(P.board, w)}. Guarda perché fallisce.`);
    board = P.board.clone(); moves = []; show({});
    await sleep(reduceMotion ? 150 : 600);
    logLine(L, describeMove(board, w, BLACK, { target: P.targets[0] }));
    board.play(w, BLACK); moves.push(w); show({ marks: { [w]: 'x' } });
    await animate(refutationLine(P, after), WHITE, { [w]: 'x' });
    await sleep(300);
    setFeedback(L, 'bad', userIsAttacker(P.kind) ? 'Il bianco si salva: la mossa giusta toglie proprio questa via.' : 'Il nero non si salva: la mossa giusta evita proprio questa sequenza.');
    busy = false;
  }
  async function replay() {
    busy = true; goban.clickable = false; clearLog(L); L.logBox.open = true;
    const saved = (solvedMoves || moves).slice();
    board = P.board.clone(); moves = []; show({});
    setFeedback(L, 'info', 'Rivediamo la sequenza.');
    await animate(saved, BLACK);
    if (ideaOf(P)) setFeedback(L, 'good', 'Idea: ' + ideaOf(P));
    busy = false;
  }
  function solvedActions() {
    const nx = btn('Avanti', () => emit('next', { firstTry }), 'primary');
    setActions([nx, btn('Rivedi la sequenza', replay, ''), btn('Perché non altrove', whyNot, ''), bCoach()]);
    nx.focus({ preventScroll: true });
  }
  goban.onPlay = async p => {
    if (done || busy || !goban.clickable || board.cells[p] !== EMPTY) return;
    const j = judgeMove(P, board, p);
    if (!j.legal) { setFeedback(L, 'bad', 'Mossa vietata: la pietra resterebbe senza libertà, oppure è un ko.'); return; }
    L.coachOut.hidden = true;
    snaps.push({ board: board.clone(), moves: moves.slice() });
    const said = describeMove(board, p, BLACK, { target: P.targets[0] });
    if (!j.ok) {
      firstTry = false; report(false); busy = true; lastWrong = { move: p };
      logLine(L, said);
      const line = refutationLine(P, j.board);
      moves.push(p); board = j.board; goban.clickable = false; show({ marks: { [p]: 'x' } });
      setFeedback(L, 'bad', 'Non funziona. Guarda la risposta del bianco.');
      L.actions.innerHTML = '';
      await animate(line, WHITE, { [p]: 'x' });
      await sleep(250);
      let summary;
      if (userIsAttacker(P.kind)) {
        if (P.region) summary = 'Il bianco ora riesce a fare due occhi: il punto decisivo era un altro.';
        else { let l = 0; for (const t of P.targets) if (board.cells[t] === WHITE) l = Math.max(l, board.group(t).libs.length); summary = `Il bianco ora ha ${l} libertà e non si cattura più: la tua mossa lasciava una via di fuga.`; }
      } else summary = targetGone(P, board) ? 'Le pietre nere sono catturate: la tua mossa non bastava.' : 'Il bianco ha la cattura in pugno: la tua mossa non bastava.';
      setFeedback(L, 'bad', summary);
      busy = false;
      const retry = btn('Riprova', undo, 'primary');
      setActions([retry, bHint(), bCoach()]);
      retry.focus({ preventScroll: true });
      return;
    }
    logLine(L, said);
    board = j.board; moves.push(p);
    if (isSolved(P, board)) {
      done = true; solvedMoves = moves.slice(); goban.clickable = false; show({}); goban.pulse(p);
      const th = themeOf(P);
      const perle = usedSolution ? 0 : firstTry ? 2 : 1;
      setFeedback(L, 'good', (firstTry ? 'Esatto, al primo colpo.' : usedSolution ? 'Risolto con la soluzione: niente perle, ma ora la conosci.' : 'Risolto.') + (th && THEMES[th] ? ` Tema: ${THEMES[th].name.toLowerCase()}.` : ''));
      if (ideaOf(P)) logLine(L, 'Idea: ' + ideaOf(P), 'idea');
      report(firstTry);
      emit('solved', { firstTry, usedSolution, perle });
      solvedActions();
      return;
    }
    busy = true; goban.clickable = false; show({}); goban.pulse(p);
    setFeedback(L, 'good', 'Giusto. Il bianco risponde…');
    await sleep(reduceMotion ? 150 : 600);
    const r = engineReply(P, board);
    logLine(L, describeMove(board, r, WHITE, { target: P.targets[0] }), 'alert');
    board.play(r, WHITE); moves.push(r);
    show({ last: r });
    busy = false; goban.clickable = true;
    setFeedback(L, 'info', `Il bianco ha giocato ${r === PASS ? 'altrove' : coordName(board, r)}. Continua.`);
    baseActions();
  };
  board = P.board.clone(); moves = []; show({}); goban.clickable = true;
  baseActions();
  return { get done() { return done; } };
}

// Registra l'esito e assegna le perle (usato da serie, lezioni, Oggi)
function problemEvents(P, unitId, after) {
  let recorded = false;
  return (type, info) => {
    if (type === 'result' && !recorded) { recorded = true; Store.recordProblem(P, info.ok, unitId); }
    if (type === 'solved') {
      Store.markSolved(P.ref);
      if (info.perle > 0) Store.addPerle(info.perle, sealOf(P, unitId));
    }
    if (after) after(type, info);
  };
}

// ---------- Lezione ----------
function rowsOf(r) { return r === 'TERR' ? TERR_ROWS : r; }
function runLesson(host, ui, opts) {
  opts = opts || {};
  const U = UNITS[ui]; const L = opts.layout || playLayout(host, 'lesson');
  const goban = L.goban;
  let i = 0;
  const empty = new Board(9);
  const P9 = (b, c) => b.pt(COLS.indexOf(c[0]), b.n - parseInt(c.slice(1), 10));
  function next() { if (i < U.lesson.length - 1) { i++; render(); } else finish(); }
  function finish() {
    Store.unit(U.id).lesson = true; Store.save();
    if (opts.onDone) return opts.onDone();
    L.body.innerHTML = ''; clearLog(L); setFeedback(L, 'good', 'Lezione completata.');
    goban.clickable = false; L.actions.innerHTML = ''; setProgress(L, 0, 0);
    if (U.problems.length) L.actions.append(btn('Esercizi della lezione', () => go('esercizi/' + ui), 'primary'));
    else if (ui + 1 < UNITS.length) L.actions.append(btn('Prossima lezione', () => go('lezione/' + (ui + 1)), 'primary'));
    L.actions.append(btn('Percorso', () => go('percorso'), ''));
  }
  function render() {
    const st = U.lesson[i];
    L.kicker.textContent = (opts.kicker || `Lezione ${ui + 1} · ${U.title}`) + ` · ${i + 1}/${U.lesson.length}`;
    if (!opts.outerProgress) setProgress(L, i, U.lesson.length);
    L.body.innerHTML = ''; setFeedback(L, '', ''); L.actions.innerHTML = ''; L.coachOut.hidden = true; clearLog(L);
    L.title.textContent = st.title || '';
    const txt = h('p', { class: 'lesson-text' }); setText(txt, st.text); L.body.append(txt);
    const back = i > 0 ? btn('Indietro', () => { i--; render(); }, 'ghost') : null;
    if (st.type === 'move') {
      const P = buildProblem(st.ref);
      playProblem(P, L, { noPrompt: true, onEvent: problemEvents(P, U.id, t => { if (t === 'next') next(); }), extra: a => { if (back) a.append(back); } });
      return;
    }
    if (st.type === 'seq') return runSeq(st, back);
    const b = st.rows ? Board.fromRows(rowsOf(st.rows)) : empty;
    const marks = {};
    if (st.marks) for (const c in st.marks) marks[P9(b, c)] = st.marks[c];
    if (st.libsOf) for (const c of st.libsOf) for (const l of b.group(P9(b, c)).libs) marks[l] = 'lib';
    let overlay = null;
    if (st.overlay) {
      const sc = b.areaScore(); overlay = Array.from(sc.owner, v => v === BLACK ? 1 : v === WHITE ? -1 : 0);
      const mg = sc.b - (sc.w + 7);
      setFeedback(L, 'info', `Conteggio: nero ${sc.b}, bianco ${sc.w} + 7 di komi = ${sc.w + 7}. ${mg > 0 ? 'Vince il nero di ' + mg : 'Vince il bianco di ' + (-mg)}. Quadratini pieni: territorio nero; vuoti: bianco.`);
    }
    goban.clickable = false; goban.set({ board: b, marks, overlay });
    const fwd = () => btn(i === U.lesson.length - 1 ? 'Fine' : 'Avanti', next, 'primary');
    if (st.type === 'info') { L.actions.append(...[fwd(), back].filter(Boolean)); L.actions.firstChild.focus({ preventScroll: true }); return; }
    const answers = new Set(st.answers.map(c => P9(b, c))), found = new Set();
    goban.clickable = true; goban.ghostColor = 'mark';
    goban.onPlay = p => {
      if (st.type === 'points') {
        if (answers.has(p)) { if (!found.has(p)) { found.add(p); marks[p] = 'lib'; goban.update({ marks }); setFeedback(L, 'good', `${coordName(b, p)}: sì. ${found.size} di ${answers.size}.`); } }
        else setFeedback(L, 'bad', b.cells[p] !== EMPTY ? 'Quella è una pietra: le libertà sono punti vuoti.' : `${coordName(b, p)} non tocca la pietra (o la catena) lungo una linea.`);
        if (found.size === answers.size) { goban.clickable = false; setFeedback(L, 'good', 'Tutte trovate.'); L.actions.innerHTML = ''; L.actions.append(...[fwd(), back].filter(Boolean)); }
      } else {
        if (answers.has(p)) { goban.clickable = false; goban.pulse(p); setFeedback(L, 'good', st.good || 'Esatto.'); L.actions.innerHTML = ''; L.actions.append(...[fwd(), back].filter(Boolean)); }
        else { marks[p] = 'x'; goban.update({ marks }); delete marks[p]; setFeedback(L, 'bad', st.wrong || 'Non qui.'); }
      }
    };
    setFeedback(L, 'info', st.type === 'points' ? 'Tocca i punti sul goban.' : 'Tocca il punto sul goban.');
    if (back) L.actions.append(back);
  }
  function runSeq(st, back) {
    const start = Board.fromRows(rowsOf(st.rows), st.toMove);
    const pts = st.moves.map(([c]) => c === 'pass' ? PASS : P9(start, c));
    let k = 0;
    const note = h('p', { class: 'seq-note' }); L.body.append(note);
    const draw = () => {
      const b = start.clone(); let c = st.toMove; const labels = {};
      for (let j = 0; j < k; j++) { b.play(pts[j], c); if (pts[j] !== PASS) labels[pts[j]] = j + 1; c = other(c); }
      for (const key in labels) if (b.cells[key] === EMPTY) delete labels[key];
      goban.clickable = false; goban.set({ board: b, labels, last: k ? pts[k - 1] : null });
      return b;
    };
    const controls = () => {
      L.actions.innerHTML = '';
      const prev = btn('◂ Mossa', () => { if (k > 0) { k--; refresh(); } }, ''); prev.disabled = k === 0;
      const nxt = btn('Mossa ▸', step, k < pts.length ? 'primary' : ''); nxt.disabled = k >= pts.length;
      L.actions.append(...[k >= pts.length ? btn(i === U.lesson.length - 1 ? 'Fine' : 'Avanti', next, 'primary') : null, prev, nxt, back].filter(Boolean));
      (k < pts.length ? nxt : L.actions.firstChild).focus({ preventScroll: true });
    };
    function refresh() {
      clearLog(L);
      const b = start.clone(); let c = st.toMove;
      for (let j = 0; j < k; j++) { logLine(L, describeMove(b, pts[j], c)); b.play(pts[j], c); c = other(c); }
      draw(); setText(note, k ? (st.moves[k - 1][1] || describeMove(b, pts[k - 1], other(c))) : 'Posizione iniziale. Premi Mossa per andare avanti.'); controls();
    }
    function step() {
      if (k >= pts.length) return;
      const before = draw(); const c = k % 2 === 0 ? st.toMove : other(st.toMove);
      logLine(L, describeMove(before, pts[k], c), c === WHITE ? 'alert' : '');
      k++; draw();
      setText(note, st.moves[k - 1][1] || describeMove(before, pts[k - 1], c));
      controls();
    }
    draw(); setText(note, 'Posizione iniziale. Premi Mossa per andare avanti.'); controls();
  }
  render();
  return L;
}

// ---------- Serie di problemi (e lezioni) ----------
// items: { ref, unit, review } oppure { lesson: ui }
function runSeries(host, items, opts) {
  opts = opts || {};
  const L = playLayout(host, opts.cls);
  let idx = opts.start || 0, ok = 0, perle = 0;
  const setHead = (k) => { setProgress(L, idx, items.length); L.kicker.textContent = k; };
  function next() {
    if (opts.onIndex) opts.onIndex(idx);
    if (idx >= items.length) return summary();
    const it = items[idx];
    if (it.lesson !== undefined) {
      setHead('');
      runLesson(null, it.lesson, { layout: L, outerProgress: true, kicker: `${opts.title || 'Oggi'} · lezione ${it.lesson + 1}`, onDone: () => { idx++; next(); } });
      setProgress(L, idx, items.length);
      return;
    }
    const P = buildProblem(it.ref);
    if (!P) { idx++; return next(); }
    const prior = Store.data.pb[P.ref] || {};
    const th = themeOf(P);
    const diff = Math.max(1, Math.min(5, Math.round((P.rating || 100) / 150)));
    setHead(`${opts.title || 'Problema'} · ${idx + 1} di ${items.length}${it.review ? ' · ripasso' : ''}${th && THEMES[th] ? ' · ' + THEMES[th].name.toLowerCase() : ''}`);
    L.kicker.append(h('span', { class: 'diff', 'aria-label': `difficoltà ${diff} su 5` }, ' ', '◆'.repeat(diff) + '◇'.repeat(5 - diff)));
    if (prior.s) L.kicker.append(h('span', { class: 'dim' }, ' · già risolto'));
    playProblem(P, L, {
      onEvent: problemEvents(P, it.unit || P.unit, (t, info) => {
        if (t === 'solved') { if (info.firstTry) ok++; perle += info.perle; }
        if (t === 'next') { idx++; next(); }
      }),
      extra: (a, st) => { if (!st.done) a.append(btn('Salta', () => { idx++; next(); }, 'ghost')); },
    });
  }
  function summary() {
    setProgress(L, items.length, items.length);
    if (opts.onFinish) return opts.onFinish(L, { ok, perle, n: items.length });
    L.goban.clickable = false; L.body.innerHTML = ''; clearLog(L); L.coachOut.hidden = true;
    L.kicker.textContent = opts.title || 'Fine';
    L.title.textContent = `${ok} su ${items.filter(x => x.ref).length} al primo colpo`;
    setFeedback(L, 'good', `${plural(perle, 'perla', 'perle')} in questa serie. Oggi: ${Store.perleToday()} su ${CONFIG.perleFilo}.`);
    L.actions.innerHTML = '';
    if (opts.again) L.actions.append(btn('Ancora', opts.again, 'primary'));
    L.actions.append(btn('Oggi', () => go('oggi'), ''), btn('Problemi', () => go('problemi'), ''));
  }
  next();
  return L;
}
