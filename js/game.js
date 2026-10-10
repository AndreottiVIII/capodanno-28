// ===== Partita aiutata contro il computer =====
const LEVELS = [
  { name: 'Novizio', playouts: 180, temp: 1.2, rating: 150 },
  { name: 'Principiante', playouts: 700, temp: 0.6, rating: 400 },
  { name: 'Apprendista', playouts: 2200, temp: 0.2, rating: 650 },
  { name: 'Solido', playouts: 5500, temp: 0, rating: 900 },
  { name: 'Tenace', playouts: 11000, temp: 0, rating: 1150 },
];
const SIZES = [[7, 'Atari Go 7×7'], [9, 'Go 9×9'], [13, 'Go 13×13'], [19, 'Go 19×19']];
const KOMIS = [0.5, 5.5, 6.5, 7.5];
const QUIZ = [['off', 'Spento'], ['pessima', 'Buona o pessima'], ['subottimale', 'Buona o subottimale'], ['imprecisa', 'Buona o imprecisa']];
const komiText = k => String(k).replace('.', ',');
function cfgLabel(c) { return c.size === 7 ? `Atari Go 7×7 · ${LEVELS[c.level].name}` : `${c.size}×${c.size} · komi ${komiText(c.handicap ? 0.5 : c.komi)}${c.handicap ? ' · ' + plural(c.handicap, 'pietra', 'pietre') : ''} · ${LEVELS[c.level].name}`; }
function handicapPoints(n, k) {
  const a = n >= 13 ? 3 : 2, b = n - 1 - a;
  return [[b, a], [a, b], [b, b], [a, a]].slice(0, k);
}

const GAMECAP = makeCaptureSolver({ maxNodes: 20000 });
function tactics(b, color) {
  const opp = other(color), res = { capture: [], save: [], forcing: [], atari: [] };
  const uniq = (arr, p, n) => { if (!arr.some(x => x.p === p)) arr.push({ p, n }); };
  for (const g of groupsOf(b, opp)) if (g.libs.length === 1 && b.isLegal(g.libs[0], color)) uniq(res.capture, g.libs[0], g.stones.length);
  for (const g of groupsOf(b, color)) if (g.libs.length === 1) {
    res.atari.push(g);
    for (const m of GAMECAP.cands(b, [g.p], color, opp)) {
      if (m === PASS) continue; const c = b.clone(); if (!c.play(m, color)) continue;
      if (!GAMECAP.wins(c, [g.p], opp, opp, 7)) uniq(res.save, m, g.stones.length);
    }
  }
  for (const g of groupsOf(b, opp)) if (g.libs.length === 2) {
    for (const m of GAMECAP.cands(b, [g.p], color, color)) {
      const c = b.clone(); if (!c.play(m, color)) continue;
      if (c.group(m).libs.length === 1) continue;
      if (GAMECAP.wins(c, [g.p], color, opp, 7)) uniq(res.forcing, m, g.stones.length);
    }
  }
  return res;
}
function tacticalNotes(before, after, p, me, mode, myMoves) {
  const notes = [], name = q => coordName(before, q);
  const T = tactics(before, me), has = arr => arr.some(x => x.p === p);
  if (T.capture.length && !has(T.capture)) notes.push({ w: 2, t: `Potevi catturare in ${name(T.capture[0].p)}.` });
  else if (T.atari.length && T.save.length && !has(T.save) && !has(T.capture)) notes.push({ w: 2, t: `La tua catena in ${name(T.atari[0].stones[0])} era in atari: si salvava con ${name(T.save[0].p)}.` });
  else if (T.forcing.length && !has(T.forcing) && !has(T.capture)) notes.push({ w: 1, t: `C'era una cattura sicura leggendo qualche mossa: ${name(T.forcing[0].p)}.` });
  if (p !== PASS && after.cells[p] !== EMPTY) {
    const A = tactics(after, other(me));
    if (A.capture.length) notes.push({ w: 2, t: `Attenzione: ora l'avversario può catturare in ${name(A.capture[0].p)}.` });
    else if (A.forcing.length) notes.push({ w: 1, t: `Attenzione: l'avversario può catturare con una scala o una rete partendo da ${name(A.forcing[0].p)}.` });
  }
  if (mode === 'go' && myMoves <= 6 && p !== PASS && !has(T.capture) && !has(T.save)) {
    const [x, y] = before.xy(p), line = Math.min(x, y, before.n - 1 - x, before.n - 1 - y) + 1;
    if (line <= 2) notes.push({ w: 1, t: 'In apertura prima e seconda linea fanno poco territorio: meglio la terza, la quarta o il centro.' });
  }
  return notes;
}
function atariPlayoutWinner(b, rand, maxMoves) {
  let moves = 0;
  while (moves < maxMoves) {
    const c = b.toMove; let played = false;
    const opps = groupsOf(b, other(c)).filter(g => g.libs.length === 1);
    if (opps.length) { b.play(opps[0].libs[0], c); return c; }
    const mine = groupsOf(b, c).filter(g => g.libs.length === 1);
    if (mine.length && rand() < 0.8) { const e = mine[0].libs[0]; const t = b.clone(); if (t.play(e, c) && t.group(e).libs.length >= 2) { b.play(e, c); played = true; } }
    if (!played) {
      const em = b.emptyPoints(); let start = Math.floor(rand() * em.length);
      for (let i = 0; i < em.length; i++) {
        const p = em[(start + i) % em.length];
        const t = b.clone(); if (!t.play(p, c)) continue;
        if (t.group(p).libs.length === 1 && rand() < 0.85) continue;
        b.play(p, c); played = true; break;
      }
    }
    if (!played) return 0;
    if (b.lastCaptured) return c;
    moves++;
  }
  return 0;
}
class AtariAnalyser {
  constructor(board, color) {
    this.root = board; this.color = color; let s = (Date.now() ^ 0x5bd1e995) >>> 0;
    this.rand = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
    const stones = []; for (let p = 0; p < board.cells.length; p++) if (board.cells[p] === BLACK || board.cells[p] === WHITE) stones.push(board.xy(p));
    const near = p => { const [x, y] = board.xy(p); if (!stones.length) return x > 0 && y > 0 && x < board.n - 1 && y < board.n - 1; return stones.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) <= 2); };
    this.moves = board.emptyPoints().filter(p => near(p) && board.isLegal(p, color)).map(p => ({ p, n: 0, w: 0 }));
    if (!this.moves.length) this.moves = board.emptyPoints().filter(p => board.isLegal(p, color)).map(p => ({ p, n: 0, w: 0 }));
    this.total = 0; this.wins = 0;
  }
  step(k) {
    for (let it = 0; it < k && this.moves.length; it++) {
      const logN = Math.log(this.total + 1);
      let best = null, bv = -1;
      for (const m of this.moves) { const v = (m.n ? m.w / m.n : 0.5) + Math.sqrt(0.5 * logN / (m.n + 1)); if (v > bv) { bv = v; best = m; } }
      const b = this.root.clone(); b.play(best.p, this.color);
      let win;
      if (b.lastCaptured) win = 1;
      else { const w = atariPlayoutWinner(b, this.rand, 60); win = w === this.color ? 1 : w === 0 ? 0.5 : 0; }
      best.n++; best.w += win; this.total++; this.wins += win;
    }
  }
  ranked() { return this.moves.filter(m => m.n > 0).map(m => ({ p: m.p, n: m.n, wr: m.w / m.n })).sort((a, b) => b.n - a.n || b.wr - a.wr); }
  winrate() { return this.total ? this.wins / this.total : .5; }
  ownership() { return null; }
}
// Ricerca a fette, con un tetto di tempo (sul 19×19 un telefono non arriva al budget pieno)
function analyse(board, color, cfg, budget, onProg, maxMs) {
  const atari = cfg.size === 7;
  const A = atari ? new AtariAnalyser(board, color) : new Analyser(board, color, cfg.handicap ? 0.5 : cfg.komi);
  const scale = atari ? 0.8 : Math.min(1, 81 / (board.n * board.n) * 1.6);
  const target = Math.max(60, Math.round(budget * scale));
  const limit = maxMs || (board.n >= 19 ? 4500 : board.n >= 13 ? 3500 : 8000);
  const t0 = performance.now(), vt = window.ViewTok;
  return new Promise(res => {
    const slice = () => {
      if (window.ViewTok !== vt) return; // schermata cambiata: la partita è abbandonata
      const s0 = performance.now();
      while (A.total < target && A.moves.length && performance.now() - s0 < 28) A.step(board.n >= 13 ? 2 : 10);
      onProg && onProg(Math.min(1, Math.max(A.total / target, (performance.now() - t0) / limit)));
      if (A.total >= target || !A.moves.length || performance.now() - t0 > limit) res(A); else setTimeout(slice, 0);
    };
    setTimeout(slice, 0);
  });
}

function startGame(host, cfg) {
  cfg = Object.assign({}, cfg);
  const n = cfg.size, mode = n === 7 ? 'atari' : 'go', me = cfg.handicap ? BLACK : cfg.color, ai = other(me), Lv = LEVELS[cfg.level];
  const komi = mode === 'atari' ? 0 : cfg.handicap ? 0.5 : cfg.komi;
  let board = new Board(n);
  if (mode === 'go' && cfg.handicap) { for (const [x, y] of handicapPoints(n, cfg.handicap)) board.setStone(board.pt(x, y), BLACK); board.toMove = WHITE; }
  const startBoard = board.clone();
  let history = [], over = false, pre = null, lastEval = null, moveNo = 0, busy = false, bestMark = null, myMoves = 0, quiz = null, quizTok = 0, rec = [];
  host.innerHTML = '';
  // barra in alto: impostazioni in un solo menu
  const setBtn = h('button', { class: 'cfg-btn', type: 'button', 'aria-expanded': 'false', onclick: () => toggleSettings() }, cfgLabel(cfg), h('span', { class: 'chev', 'aria-hidden': 'true' }, '▾'));
  const settings = h('div', { class: 'cfg-sheet card', hidden: true });
  const youCard = h('div', { class: 'pl-card' }), aiCard = h('div', { class: 'pl-card' });
  const helpBar = h('div', { class: 'help-bar', role: 'group', 'aria-label': 'Aiuti in partita' });
  const top = h('div', { class: 'game-top' }, setBtn, settings, h('div', { class: 'pl-cards' }, youCard, aiCard), helpBar);
  const playHost = h('div', {});
  host.append(top, playHost);
  const L = playLayout(playHost, 'game');
  const goban = L.goban;
  L.kicker.textContent = mode === 'atari' ? 'Atari Go: vince chi cattura per primo' : `Go ${n}×${n}: si conta il territorio`;
  const status = h('p', { class: 'status' }), alertBox = h('div', { class: 'alertbox', 'aria-live': 'polite' }), quizBox = h('div', { class: 'quizbox' }), evalBox = h('div', { class: 'evalbox' });
  const legend = h('details', { class: 'legend' }, h('summary', {}, 'Cosa vogliono dire i segni sul goban'), h('ul', {},
    h('li', {}, h('span', { class: 'lg lg-last' }), 'cerchio sulla pietra: l\'ultima mossa giocata'),
    h('li', {}, h('span', { class: 'lg lg-best' }), 'pietra trasparente con il bordo verde: dove avrebbe giocato il computer al posto tuo'),
    h('li', {}, h('span', { class: 'lg lg-atari' }), 'cerchio rosso tratteggiato e punto rosso: una tua catena in atari e la sua ultima libertà'),
    h('li', {}, h('span', { class: 'lg lg-cap' }), 'cerchio verde tratteggiato e punto verde: pietre avversarie che puoi catturare lì'),
    h('li', {}, h('span', { class: 'lg lg-abc' }, 'A'), 'lettere: le mosse proposte da Suggerisci o dal quiz')));
  L.body.append(status, alertBox, quizBox, evalBox, legend);
  L.title.textContent = me === BLACK ? 'Tu giochi col nero' : 'Tu giochi col bianco';
  const bUndo = btn('Indietro', undo, 'icon-btn', { 'aria-label': 'Annulla la tua ultima mossa' });
  const bHint = btn('Suggerisci', hint, 'icon-btn');
  const bPass = btn('Passo', () => userMove(PASS), 'icon-btn');
  const bCoach = btn('Il maestro', askCoach, 'ghost');
  const bResign = btn('Abbandona', () => { if (confirm('Abbandonare la partita?')) end(ai, 'Hai abbandonato.'); }, 'ghost');
  const gameActions = () => { L.actions.innerHTML = ''; L.actions.append(bUndo, bHint, ...(mode === 'go' ? [bPass] : []), bCoach, bResign); };
  gameActions();
  // aiuti accesi e spenti al volo, senza ricominciare la partita
  function renderHelp() {
    helpBar.innerHTML = '';
    const any = cfg.atari || cfg.coach || cfg.quiz !== 'off';
    const chip = (label, on, fn, title) => h('button', { type: 'button', class: 'help-chip' + (on ? ' on' : ''), 'aria-pressed': String(on), title, onclick: fn }, h('span', { class: 'hc-dot', 'aria-hidden': 'true' }), label);
    helpBar.append(h('span', { class: 'help-l' }, 'Aiuti'),
      chip('Atari', cfg.atari, () => setHelp('atari', !cfg.atari), 'Avvisi quando una catena è in atari, con la libertà evidenziata'),
      chip('Valutazione', cfg.coach, () => setHelp('coach', !cfg.coach), 'Un giudizio su ogni tua mossa e la mossa che il computer preferiva'),
      chip('Quiz A/B', cfg.quiz !== 'off', () => setHelp('quiz', cfg.quiz !== 'off' ? 'off' : (Store.data.game.quizLast || 'pessima')), 'A ogni turno due mosse da confrontare'),
      btn(any ? 'Togli tutti' : 'Rimetti tutti', () => { if (any) { setHelp('atari', false); setHelp('coach', false); setHelp('quiz', 'off'); } else { setHelp('atari', true); setHelp('coach', true); } }, 'ghost small'));
  }
  function setHelp(key, val) {
    if (key === 'quiz' && cfg.quiz !== 'off') Store.data.game.quizLast = cfg.quiz;
    cfg[key] = val; Store.data.game[key] = val; Store.save();
    if (key === 'coach' && !val) { bestMark = null; evalBox.innerHTML = ''; }
    if (key === 'atari') renderAlert();
    if (key === 'quiz') {
      quizTok++; quiz = null; quizBox.innerHTML = '';
      const myTurn = !over && !busy && board.toMove === me;
      if (myTurn && val !== 'off') maybeQuiz(); else if (myTurn) goban.clickable = true;
    }
    draw(); renderHelp();
  }
  renderHelp();
  goban.ghostColor = me;
  goban.onPending = p => setStatus(`Tocca di nuovo ${coordName(board, p)} per giocare.`);

  function toggleSettings(force) {
    const open = force !== undefined ? force : settings.hidden;
    settings.hidden = !open; setBtn.setAttribute('aria-expanded', String(open));
    if (open) renderSettings();
  }
  function renderSettings() {
    const c = Object.assign({}, Store.data.game);
    const seg = (label, key, opts, note) => h('fieldset', { class: 'seg' }, h('legend', {}, label), h('div', { class: 'seg-row' }, ...opts.map(([v, t]) => h('label', {}, h('input', { type: 'radio', name: 'g-' + key, value: v, checked: c[key] === v, onchange: () => { c[key] = v; if (key === 'size') redraw(); } }), h('span', {}, t)))), note ? h('p', { class: 'hint' }, note) : null);
    const chk = (label, key) => h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!c[key], onchange: e => c[key] = e.target.checked }), h('span', {}, label));
    function redraw() {
      settings.innerHTML = '';
      settings.append(
        seg('Goban', 'size', SIZES, c.size === 7 ? 'Atari Go: vince chi cattura per primo. Ottimo per cominciare.' : c.size === 19 ? 'Il goban vero. Sul telefono tocca due volte: il primo tocco mostra la pietra, il secondo la gioca. Il computer qui è più lento e più debole.' : null),
        c.size === 7 ? null : seg('Komi', 'komi', KOMIS.map(k => [k, komiText(k)]), 'Punti dati al bianco perché muove per secondo.'),
        c.size === 7 ? null : seg('Pietre di vantaggio per te', 'handicap', [0, 1, 2, 3, 4].map(k => [k, String(k)]), 'Come al goban del sabato: tu col nero, pietre già sui punti segnati, komi 0,5.'),
        seg('Livello del computer', 'level', LEVELS.map((x, i) => [i, x.name])),
        c.handicap && c.size !== 7 ? null : seg('Il tuo colore', 'color', [[BLACK, 'Nero, muovi tu per primo'], [WHITE, 'Bianco']]),
        seg('Quiz A o B', 'quiz', QUIZ, 'A ogni tuo turno due mosse: una buona e una peggiore. Scegli, poi vedi perché.'),
        chk('Avvisi di atari, con la libertà evidenziata', 'atari'),
        chk('Valuta ogni mia mossa', 'coach'),
        h('div', { class: 'actions' }, btn('Nuova partita', () => { Store.data.game = c; Store.save(); startGame(host, c); }, 'primary'), btn('Chiudi', () => toggleSettings(false), 'ghost')));
    }
    redraw();
  }
  const capsLine = () => `${board.caps[me]} ${board.caps[me] === 1 ? 'cattura' : 'catture'}`;
  function renderCards() {
    const turnMe = !over && board.toMove === me;
    youCard.className = 'pl-card' + (turnMe ? ' on' : '');
    aiCard.className = 'pl-card' + (!over && !turnMe ? ' on' : '');
    youCard.innerHTML = ''; aiCard.innerHTML = '';
    youCard.append(h('span', { class: 'stone ' + (me === BLACK ? 'b' : 'w') }), h('span', { class: 'pl-t' }, h('b', {}, Store.data.name || 'Tu'), h('small', {}, (turnMe ? 'tocca a te · ' : '') + capsLine())));
    aiCard.append(h('span', { class: 'stone ' + (ai === BLACK ? 'b' : 'w') }), h('span', { class: 'pl-t' }, h('b', {}, 'Computer'), h('small', {}, `${LEVELS[cfg.level].name} · ${board.caps[ai]} ${board.caps[ai] === 1 ? 'cattura' : 'catture'}`)));
  }
  function atariMarks() {
    const marks = {}; if (!cfg.atari || over) return marks;
    for (const g of groupsOf(board, me)) if (g.libs.length === 1) { for (const st of g.stones) marks[st] = 'atari'; marks[g.libs[0]] = 'lib'; }
    if (board.toMove === me) for (const g of groupsOf(board, ai)) if (g.libs.length === 1 && board.isLegal(g.libs[0], me)) { for (const st of g.stones) if (!marks[st]) marks[st] = 'atariOpp'; if (!marks[g.libs[0]]) marks[g.libs[0]] = 'libgood'; }
    return marks;
  }
  const draw = extra => {
    const marks = atariMarks();
    if (bestMark !== null && board.cells[bestMark] === EMPTY) marks[bestMark] = 'best';
    const labels = {};
    if (quiz && !quiz.answered) { labels[quiz.a] = 'A'; labels[quiz.b] = 'B'; }
    else if (quiz) { labels[quiz.good] = quiz.good === quiz.a ? 'A' : 'B'; marks[quiz.bad] = 'x'; }
    goban.set(Object.assign({ board, last: board.last, marks, labels }, extra || {}));
    renderCards();
  };
  function setStatus(t) { setText(status, t); }
  function renderAlert() {
    alertBox.innerHTML = ''; if (!cfg.atari || over) return;
    const name = q => coordName(board, q);
    const mine = groupsOf(board, me).filter(g => g.libs.length === 1);
    const theirs = board.toMove === me ? groupsOf(board, ai).filter(g => g.libs.length === 1 && board.isLegal(g.libs[0], me)) : [];
    if (mine.length) {
      const g = mine[0], T = tactics(board, me);
      const alt = T.save.filter(x => x.p !== g.libs[0]);
      const p1 = h('p', { class: 'alert-h bad' }); setText(p1, `${g.stones.length === 1 ? 'La tua pietra in ' + name(g.stones[0]) + ' è' : 'Le tue ' + g.stones.length + ' pietre in ' + name(g.stones[0]) + ' sono'} in atari.`);
      const p2 = h('p', {}); setText(p2, `Resta una sola libertà, il punto rosso in ${name(g.libs[0])}. ` + (T.save.some(x => x.p === g.libs[0]) ? 'Puoi allungarti lì' : 'Allungarti lì non basta') + (alt.length ? `, oppure salvarla con ${name(alt[0].p)}` : '') + ', oppure lasciarla andare e giocare altrove.' + (mine.length > 1 ? ` Attenzione: anche ${name(mine[1].stones[0])} è in atari.` : ''));
      alertBox.append(h('div', { class: 'alert card-inner' }, p1, p2));
    } else if (theirs.length) {
      const g = theirs[0];
      const p1 = h('p', { class: 'alert-h good' }); setText(p1, `${g.stones.length === 1 ? 'La pietra avversaria in ' + name(g.stones[0]) + ' è' : 'Le ' + g.stones.length + ' pietre avversarie in ' + name(g.stones[0]) + ' sono'} in atari.`);
      const p2 = h('p', {}); setText(p2, `Puoi catturarle giocando sul punto verde, ${name(g.libs[0])}.`);
      alertBox.append(h('div', { class: 'alert card-inner' }, p1, p2));
    }
  }
  function startPre() { pre = analyse(board, me, cfg, 2600, null, n >= 13 ? 2500 : 6000); }
  async function aiTurn() {
    busy = true; goban.clickable = false; setStatus('Il computer pensa…'); renderCards(); alertBox.innerHTML = '';
    await sleep(120);
    let forced = null;
    const T = tactics(board, ai), lv = cfg.level;
    if (mode === 'atari') {
      if (T.capture.length) forced = T.capture[0].p;
      else if (T.save.length && Math.random() < [0.5, 0.9, 1, 1, 1][lv]) forced = T.save[0].p;
      else if (T.forcing.length && Math.random() < [0, 0.5, 1, 1, 1][lv]) forced = T.forcing[0].p;
    } else {
      const bigCap = T.capture.filter(c => c.n >= 2).sort((a, b) => b.n - a.n);
      const bigSave = T.save.filter(c => c.n >= 3).sort((a, b) => b.n - a.n);
      if (bigCap.length && lv >= 1) forced = bigCap[0].p;
      else if (bigSave.length && lv >= 2) forced = bigSave[0].p;
    }
    const A = forced !== null ? null : await analyse(board, ai, cfg, Lv.playouts, f => setStatus(`Il computer pensa… ${Math.round(f * 100)}%`));
    if (forced !== null) await sleep(350);
    let move = forced !== null ? forced : PASS;
    let R = A ? A.ranked() : [];
    // sui goban grandi il Monte Carlo legge poco: in apertura resta su terza e quarta linea
    if (n >= 13 && moveNo < n * 1.5) {
      const line = q => { const [x, y] = board.xy(q); return Math.min(x, y, n - 1 - x, n - 1 - y) + 1; };
      const good = R.filter(r => line(r.p) >= 3 && line(r.p) <= 5);
      if (good.length) R = good;
      else if (moveNo < 8) {
        const a = 3, b = n - 4, c = (n - 1) / 2;
        const pts = [[a, a], [b, a], [a, b], [b, b], [a, b - 1], [b, a + 1], [c, a], [a, c], [b, c], [c, b]].map(([x, y]) => board.pt(x, y)).filter(q => board.cells[q] === EMPTY && board.isLegal(q, ai));
        if (pts.length) R = [{ p: pts[0], n: 1, wr: .5 }];
      }
    }
    if (R.length) {
      if (Lv.temp > 0) {
        const topR = R.slice(0, 6), ws = topR.map(r => Math.pow(r.n, 1 / Lv.temp)), tot = ws.reduce((a, b) => a + b, 0);
        let x = Math.random() * tot; move = topR[0].p; for (let i = 0; i < topR.length; i++) { x -= ws[i]; if (x <= 0) { move = topR[i].p; break; } }
      } else move = R[0].p;
    }
    if (mode === 'go' && A) {
      const own = A.ownership();
      const settled = board.emptyPoints().every(p => Math.abs(own[p]) > 0.8);
      if (board.passes === 1 || settled) {
        const dead = deadFromOwnership(board, own), sc = board.areaScore(dead), margin = sc.b - sc.w - komi;
        const aiAhead = ai === BLACK ? margin > 0 : margin < 0;
        if (settled || aiAhead) move = PASS;
      }
      if (moveNo > n * 2.6 && A.winrate() < 0.04 && A.total > 400) return end(me, 'Il computer abbandona.');
    }
    const beforeAI = board.clone();
    board.play(move, ai); moveNo++; history.push(board.clone());
    rec.push({ c: ai, p: move, before: beforeAI });
    logLine(L, describeMove(beforeAI, move, ai), 'alert');
    if (mode === 'atari' && board.lastCaptured) { draw(); return end(ai, 'Il computer ha catturato per primo.'); }
    if (board.passes >= 2) return finishGo();
    draw();
    setStatus((move === PASS ? 'Il computer passa. ' : `Il computer ha giocato ${coordName(board, move)}. `) + 'Tocca a te.');
    renderAlert();
    busy = false; goban.clickable = true; startPre(); maybeQuiz();
  }
  async function userMove(p) {
    if (over || busy) return;
    if (quiz && !quiz.answered) { if (p === quiz.a || p === quiz.b) return answerQuiz(p); setStatus('Prima scegli tra A e B, oppure premi Gioca libero.'); return; }
    quizTok++; quiz = null; quizBox.innerHTML = '';
    if (p !== PASS && !board.isLegal(p, me)) { setStatus('Mossa non permessa: suicidio o ko.'); return; }
    busy = true; goban.clickable = false;
    const before = board.clone();
    bestMark = null;
    board.play(p, me); moveNo++; history.push(board.clone());
    const r = { c: me, p, before }; rec.push(r);
    logLine(L, describeMove(before, p, me));
    draw(); alertBox.innerHTML = '';
    evalBox.innerHTML = '';
    if (p !== PASS) {
      myMoves++;
      const notes = tacticalNotes(before, board, p, me, mode, myMoves);
      const heavy = notes.some(x => x.w === 2);
      lastEval = { move: p, notes: notes.map(x => x.t), before };
      r.notes = lastEval.notes;
      if (cfg.coach) {
        evalBox.append(h('p', { class: 'dim' }, 'Valuto la mossa…'));
        let label;
        if (mode === 'atari') {
          label = notes.length ? (heavy ? ['bad', 'Errore tattico.'] : ['warn', 'Occhio alla lettura.']) : ['good', 'Nessun errore tattico.'];
          lastEval.verdict = { label };
        } else {
          const A = await pre; const R = A.ranked();
          const bestP = R.length ? R[0].p : p;
          const ms = n >= 13 ? 900 : 3000;
          const evalAfter = async q => { const c = before.clone(); c.play(q, me); if (c.passes >= 2) return .5; const B = await analyse(c, ai, cfg, 800, null, ms); return 1 - B.winrate(); };
          const wr = await evalAfter(p), wrBest = bestP === p ? wr : await evalAfter(bestP);
          const delta = wrBest - wr;
          label = bestP === p || delta <= 0.03 ? ['good', bestP === p ? 'La mossa preferita dal computer.' : 'Ottima mossa.'] : delta <= 0.08 ? ['good', 'Buona mossa.'] : delta <= 0.16 ? ['warn', 'Mossa imprecisa.'] : ['bad', 'Errore.'];
          if (label[0] === 'good' && notes.length) label = heavy ? ['bad', 'Errore tattico.'] : ['warn', 'Mossa imprecisa.'];
          lastEval.verdict = { label, best: bestP, delta, wr };
          r.best = bestP !== p && delta > 0.03 ? bestP : null; r.wr = wr; r.wrBest = wrBest;
          evalBox.innerHTML = '';
          evalBox.append(h('p', { class: 'verdict ' + label[0] }, label[1]));
          if (bestP !== p && delta > 0.03) {
            evalBox.append(h('p', {}, `Il computer avrebbe giocato in ${coordName(board, bestP)}: è la pietra trasparente con il bordo verde sul goban, resta finché giochi la prossima mossa. Stima di vittoria: ${Math.round(wr * 100)}% con la tua mossa, ${Math.round(wrBest * 100)}% con la sua.`));
            if (board.cells[bestP] === EMPTY) { bestMark = bestP; draw(); }
          }
        }
        r.verdict = label;
        if (mode === 'atari') { evalBox.innerHTML = ''; evalBox.append(h('p', { class: 'verdict ' + label[0] }, label[1])); }
      }
      for (const x of notes) { const el = h('p', { class: 'note' }); setText(el, x.t); evalBox.append(el); }
    }
    if (mode === 'atari' && board.lastCaptured) return end(me, 'Hai catturato per primo.');
    if (board.passes >= 2) return finishGo();
    await aiTurn();
  }
  goban.onPlay = p => userMove(p);

  // ----- Quiz: riconoscere la buona tra due mosse -----
  async function valueAfter(q, budget) {
    const c = board.clone(); if (!c.play(q, me)) return null;
    if (mode === 'atari' && c.lastCaptured) return { wr: 1, reply: null };
    const B = await analyse(c, ai, cfg, budget, null, n >= 13 ? 500 : 2500); const r = B.ranked();
    return { wr: 1 - B.winrate(), reply: r.length ? r[0].p : PASS };
  }
  function quizScore() { const d = Store.data; if (!d.quiz) d.quiz = { n: 0, ok: 0, lv: {} }; return d.quiz; }
  async function maybeQuiz() {
    if (!cfg.quiz || cfg.quiz === 'off' || over) return;
    const tok = ++quizTok; quiz = null; quizBox.innerHTML = '';
    goban.clickable = false;
    const free = btn('Gioca libero', () => { quizTok++; quiz = null; quizBox.innerHTML = ''; goban.clickable = true; setStatus('Tocca a te. Gioca dove vuoi.'); draw(); }, 'ghost');
    quizBox.append(h('p', { class: 'dim' }, 'Preparo due mosse da confrontare…'), h('div', { class: 'actions' }, free));
    const A = await pre; if (tok !== quizTok) return;
    const T = tactics(board, me), R = A.ranked().filter(r => r.n >= 6);
    const uniq = arr => [...new Set(arr)].filter(p => p !== PASS && board.isLegal(p, me));
    const lineOf = q => { const [x, y] = board.xy(q); return Math.min(x, y, n - 1 - x, n - 1 - y) + 1; };
    const opening = mode === 'go' && myMoves < 6;
    const a = n >= 13 ? 3 : 2, b = n - 1 - a, c = (n - 1) / 2;
    const classic = opening ? [[a, a], [b, a], [a, b], [b, b], [c, c], [a, a + 1], [a + 1, a], [b, a + 1], [b - 1, a], [a, b - 1], [a + 1, b], [b, b - 1], [b - 1, b]].map(([x, y]) => board.pt(x, y)).filter(q => board.cells[q] === EMPTY) : [];
    const goodPool = uniq([...T.capture.map(x => x.p), ...T.save.map(x => x.p), ...R.slice(0, 8).map(r => r.p).filter(q => !opening || lineOf(q) >= 3).slice(0, 4), ...classic.slice(0, 2)]).slice(0, 5);
    if (!goodPool.length) { quizBox.innerHTML = ''; goban.clickable = true; return; }
    const val = new Map();
    for (const p of goodPool) { const v = await valueAfter(p, 900); if (tok !== quizTok) return; if (v) val.set(p, v); }
    let good = goodPool.filter(p => val.has(p)).sort((x, y) => val.get(y).wr - val.get(x).wr)[0];
    const isBlunder = q => { const cc = board.clone(); if (!cc.play(q, me)) return false; return tacticalNotes(board, cc, q, me, mode, myMoves + 1).some(x => x.w === 2) || (cc.group(q).libs.length === 1 && !cc.lastCaptured); };
    const classify = (d, q) => {
      if (d < 0.02) return null;
      if (isBlunder(q) || (opening && lineOf(q) === 1 && d >= 0.04) || d >= 0.15) return 'pessima';
      if (d >= 0.07 || (opening && lineOf(q) === 2 && d >= 0.04)) return 'subottimale';
      return d >= 0.03 ? 'imprecisa' : null;
    };
    const empt = shuffle(board.emptyPoints().filter(p => p !== good && !goodPool.includes(p) && board.isLegal(p, me) && !board.isEyeish(p, me)));
    const want = cfg.quiz, order = ['imprecisa', 'subottimale', 'pessima'];
    let badPool;
    if (want === 'pessima') badPool = uniq([...empt.slice(0, 60).filter(isBlunder), ...(opening ? empt.filter(q => lineOf(q) === 1) : []), ...R.slice(8, 20).map(r => r.p), ...empt]).slice(0, 12);
    else if (want === 'subottimale') badPool = uniq([...R.slice(4, 14).map(r => r.p), ...(opening ? empt.filter(q => lineOf(q) === 2) : []), ...empt]).slice(0, 12);
    else badPool = uniq([...goodPool, ...R.slice(1, 10).map(r => r.p)]).filter(p => p !== good).slice(0, 10);
    let pick = null, pickCls = null, closest = null; const t0 = performance.now();
    for (const p of badPool) {
      if (performance.now() - t0 > 7000) break;
      const v = val.get(p) || await valueAfter(p, 900); if (tok !== quizTok) return; if (!v) continue; val.set(p, v);
      const d = val.get(good).wr - v.wr, cl = classify(d, p);
      if (!cl) continue;
      if (cl === want) {
        if (want === 'imprecisa') {
          const g2 = await valueAfter(good, 2000), b2 = await valueAfter(p, 2000); if (tok !== quizTok) return;
          if (!g2 || !b2) continue;
          const d2 = ((val.get(good).wr + g2.wr) - (v.wr + b2.wr)) / 2;
          if (g2.wr - b2.wr < 0.02 || classify(d2, p) !== 'imprecisa') continue;
          val.set(good, { wr: (val.get(good).wr + g2.wr) / 2, reply: g2.reply }); val.set(p, { wr: (v.wr + b2.wr) / 2, reply: b2.reply });
        }
        pick = p; pickCls = want; break;
      }
      const dist = Math.abs(order.indexOf(cl) - order.indexOf(want));
      if (!closest || dist < closest.dist) closest = { p, c: cl, dist };
    }
    if (!pick && closest) { pick = closest.p; pickCls = closest.c; }
    if (!pick) { quizBox.innerHTML = ''; quizBox.append(h('p', { class: 'dim' }, 'Qui non trovo due mosse con una differenza chiara. Gioca libero.')); goban.clickable = true; return; }
    const d = val.get(good).wr - val.get(pick).wr;
    const goodFirst = Math.random() < .5;
    quiz = { good, bad: pick, a: goodFirst ? good : pick, b: goodFirst ? pick : good, d, cls: pickCls, vg: val.get(good), vb: val.get(pick), answered: false, asked: cfg.quiz };
    renderQuiz();
  }
  function renderQuiz() {
    quizBox.innerHTML = ''; draw(); goban.clickable = true;
    const Lc = q => coordName(board, q);
    const off = quiz.cls !== quiz.asked ? ` Qui la differenza più vicina che ho trovato è da mossa ${quiz.cls}.` : '';
    quizBox.append(
      h('p', { class: 'verdict warn' }, 'A o B?'),
      h('p', {}, `Una delle due mosse è buona, l'altra è ${quiz.cls}.${off} Tocca sul goban quella che giocheresti.`),
      h('div', { class: 'actions' }, btn(`A · ${Lc(quiz.a)}`, () => answerQuiz(quiz.a), ''), btn(`B · ${Lc(quiz.b)}`, () => answerQuiz(quiz.b), ''),
        btn('Gioca libero', () => { quizTok++; quiz = null; quizBox.innerHTML = ''; draw(); setStatus('Tocca a te. Gioca dove vuoi.'); }, 'ghost')));
  }
  function answerQuiz(p) {
    if (!quiz || quiz.answered) return;
    quiz.answered = true;
    const right = p === quiz.good, sc = quizScore();
    sc.n++; if (right) sc.ok++;
    const lv = sc.lv[quiz.cls] || (sc.lv[quiz.cls] = [0, 0]); lv[1]++; if (right) lv[0]++;
    Store.save();
    const Lc = q => coordName(board, q), pct = v => Math.round(v * 100) + '%';
    const after = board.clone(); after.play(quiz.bad, me);
    const notes = tacticalNotes(board, after, quiz.bad, me, mode, myMoves + 1);
    quizBox.innerHTML = ''; draw();
    quizBox.append(h('p', { class: 'verdict ' + (right ? 'good' : 'bad') }, right ? 'Riconosciuta.' : `No: la buona era ${Lc(quiz.good)}.`));
    const ln = (t, cls) => { const el = h('p', { class: cls || '' }); el.append(linkify(t)); quizBox.append(el); };
    ln(`Buona, ${Lc(quiz.good)}: stima di vittoria ${pct(quiz.vg.wr)}. ${describeMove(board, quiz.good, me)}`);
    ln(`${quiz.cls[0].toUpperCase() + quiz.cls.slice(1)}, ${Lc(quiz.bad)}: stima ${pct(quiz.vb.wr)}.` + (quiz.vb.reply !== null && quiz.vb.reply !== undefined && quiz.vb.reply !== PASS ? ` Dopo questa mossa l'avversario risponderebbe ${Lc(quiz.vb.reply)}.` : ''));
    for (const x of notes) ln(x.t, 'note');
    if (quiz.cls === 'pessima' && quiz.d < 0.15 && !notes.some(x => x.w === 2)) ln('In apertura le stime del computer restano vicine al 50%, quindi la differenza sembra piccola. Il principio però è netto: le prime linee rendono poco.', 'dim');
    ln(`Differenza stimata: ${Math.round(quiz.d * 100)} punti percentuali.` + (quiz.d < 0.07 ? ' Su differenze così piccole il computer può sbagliare.' : '') + ` Finora: ${sc.ok} riconosciute su ${sc.n}.`, 'dim');
    quizBox.append(h('div', { class: 'actions' }, btn(`Gioca ${Lc(quiz.good)}`, () => userMove(quiz.good), 'primary')));
    setStatus('Ora gioca: la buona, o un\'altra mossa se vuoi provare.');
  }
  async function hint() {
    if (over || busy) return;
    bHint.disabled = true;
    const T = tactics(board, me), labels = {}, lines = [];
    const add = (arr, what) => { for (const x of arr) if (!(x.p in labels) && Object.keys(labels).length < 3) { const k = 'ABC'[Object.keys(labels).length]; labels[x.p] = k; lines.push(`${k} ${coordName(board, x.p)} ${what}`); } };
    add(T.capture, 'cattura'); add(T.save, 'salva la tua catena'); add(T.forcing, 'cattura leggendo');
    if (!lines.length || mode === 'go') {
      setStatus('Cerco le mosse migliori…');
      const A = await (pre || analyse(board, me, cfg, 2600));
      add(A.ranked().slice(0, 3).map(r => ({ p: r.p })), 'secondo il computer');
    }
    draw({ labels });
    setStatus('Candidate: ' + lines.join(', ') + '. ' + (T.capture.length + T.save.length + T.forcing.length ? 'Le mosse tattiche sono verificate; le altre sono stime.' : 'Nessuna tattica immediata: sono stime del computer.'));
    bHint.disabled = false;
  }
  async function askCoach() {
    if (busy) return;
    const lines = [], name = q => coordName(board, q);
    for (const c of [me, ai]) for (const g of groupsOf(board, c)) if (g.libs.length === 1) lines.push(`${c === me ? 'La tua catena' : 'La catena del computer'} in ${name(g.stones[0])} (${plural(g.stones.length, 'pietra', 'pietre')}) è in atari: ultima libertà ${name(g.libs[0])}.`);
    const weak = groupsOf(board, me).filter(g => g.libs.length === 2);
    if (weak.length) lines.push(`Sotto pressione: ${weak.slice(0, 2).map(g => name(g.stones[0])).join(' e ')} ${weak.length === 1 ? 'ha' : 'hanno'} solo due libertà. Prima di attaccare altrove, chiediti se reggono.`);
    const T = tactics(board, me);
    if (T.capture.length) lines.push(`Puoi catturare subito in ${name(T.capture[0].p)}.`);
    if (T.forcing.length) lines.push(`Leggendo qualche mossa c'è una cattura sicura partendo da ${name(T.forcing[0].p)} (una scala o una rete).`);
    if (lastEval && lastEval.verdict) lines.push(`La tua ultima mossa, ${name(lastEval.move)}: ${lastEval.verdict.label[1].toLowerCase()}` + (lastEval.verdict.best !== undefined && lastEval.verdict.best !== lastEval.move && lastEval.verdict.delta > 0.03 ? ` Il computer preferiva ${name(lastEval.verdict.best)}.` : ''));
    if (lastEval && lastEval.notes) lines.push(...lastEval.notes);
    const filled = board.n * board.n - board.emptyPoints().length;
    if (mode === 'atari') lines.push('In Atari Go conta solo la prima cattura: tieni le tue catene con almeno tre libertà e cerca le catene avversarie con due.');
    else if (filled < board.n * board.n * 0.12) lines.push(board.n >= 13 ? 'Siamo in apertura (fuseki): prima gli angoli, sulla terza o quarta linea; poi i lati. Il centro arriva dopo.' : 'Siamo in apertura: terza linea, quarta linea o tengen. Evita la prima e la seconda: rendono poco territorio.');
    else if (board.emptyPoints().length < board.n * board.n * 0.3) lines.push('Siamo alla fine (yose): chiudi i confini aperti, partendo da quelli che valgono di più. Non riempire i tuoi occhi.');
    else lines.push('Siamo nel mediogioco: rinforza i gruppi con poche libertà o senza spazio per due occhi, poi attacca quelli dell\'avversario. Taglia dove le sue pietre sono collegate solo in diagonale.');
    if (pre && board.toMove === me) {
      const A = await pre; const R = A.ranked().slice(0, 3);
      if (R.length) lines.push(`Le mosse che il computer esplora di più: ${R.map(r => name(r.p) + ' (' + Math.round(r.wr * 100) + '%)').join(', ')}. Sono stime: usale come idee, non come verità.`);
    }
    coachSay(L, lines);
  }
  function undo() {
    if (busy || over) return;
    let k = history.length; let mine = 0;
    // torna a prima della tua ultima mossa
    while (rec.length && mine === 0) { const r = rec.pop(); history.pop(); if (r.c === me) mine = 1; }
    if (!mine) return;
    quizTok++; quiz = null; quizBox.innerHTML = '';
    board = history.length ? history[history.length - 1].clone() : startBoard.clone();
    moveNo = history.length; myMoves = Math.max(0, myMoves - 1); bestMark = null; evalBox.innerHTML = ''; lastEval = null;
    if (board.toMove !== me) { draw(); aiTurn(); return; }
    draw(); renderAlert(); setStatus('Mossa annullata. Tocca a te.'); goban.clickable = true; startPre(); maybeQuiz();
  }
  async function finishGo() {
    busy = true; goban.clickable = false; setStatus('Conto il territorio…');
    const A = await analyse(board, me, cfg, 1800);
    const own = A.ownership(), dead = deadFromOwnership(board, own);
    const sc = board.areaScore(dead), margin = sc.b - (sc.w + komi);
    const winner = margin > 0 ? BLACK : WHITE;
    const overlay = Array.from(sc.owner, v => v === BLACK ? 1 : v === WHITE ? -1 : 0);
    draw({ overlay, dead });
    end(winner, `Nero ${sc.b}, bianco ${sc.w} + ${komiText(komi)} = ${String(sc.w + komi).replace('.', ',')}. ${winner === BLACK ? 'Vince il nero' : 'Vince il bianco'} di ${String(Math.abs(margin)).replace('.', ',')}. Le pietre sbiadite sono considerate morte.`, true);
  }
  function end(winner, text, keepBoard) {
    over = true; busy = false; goban.clickable = false; quizTok++; quiz = null; quizBox.innerHTML = ''; alertBox.innerHTML = '';
    const win = winner === me;
    const aiR = Lv.rating - (mode === 'atari' ? 150 : 0) - (cfg.handicap || 0) * 60;
    Store.recordGame(win, aiR, `${mode === 'atari' ? 'Atari Go' : n + '×' + n} contro ${Lv.name}`, mode === 'go');
    setStatus(text);
    L.actions.innerHTML = '';
    evalBox.innerHTML = '';
    evalBox.append(h('p', { class: 'verdict ' + (win ? 'good' : 'bad') }, win ? 'Hai vinto.' : 'Ha vinto il computer.'));
    const errs = rec.filter(r => r.c === me && r.verdict && r.verdict[0] !== 'good').length;
    if (rec.some(r => r.c === me)) evalBox.append(h('p', { class: 'dim' }, cfg.coach ? `${plural(errs, 'mossa da rivedere', 'mosse da rivedere')}.` : 'Rivedi la partita mossa per mossa.'));
    L.actions.append(btn('Rivedi la partita', review, 'primary'), btn('Rivincita', () => startGame(host, cfg), ''), btn('Impostazioni', () => toggleSettings(true), 'ghost'));
    if (!keepBoard) draw();
    renderCards();
  }
  // ----- Revisione a fine partita -----
  function review() {
    let k = rec.length;
    const flagged = rec.map((r, i) => [r, i]).filter(([r]) => r.c === me && ((r.verdict && r.verdict[0] !== 'good') || (r.notes && r.notes.length)));
    const slider = h('input', { type: 'range', min: 0, max: rec.length, value: k, 'aria-label': 'Mossa', class: 'slider' });
    const info = h('div', { class: 'review-info' });
    const list = h('div', { class: 'review-list' });
    for (const [r, i] of flagged) list.append(h('button', { type: 'button', class: 'chip ' + (r.verdict ? r.verdict[0] : 'warn'), onclick: () => showAt(i + 1) }, `${i + 1}. ${coordName(r.before, r.p)}`));
    L.body.innerHTML = ''; L.coachOut.hidden = true;
    L.title.textContent = 'Revisione';
    L.body.append(h('p', { class: 'dim' }, flagged.length ? 'Le mosse da rivedere sono qui sotto: toccane una per vedere la posizione e la mossa migliore.' : 'Scorri le mosse con la barra o con i pulsanti.'), flagged.length ? list : null, slider, info);
    L.actions.innerHTML = '';
    const prev = btn('◂', () => showAt(k - 1), 'icon-btn', { 'aria-label': 'Mossa precedente' }), nxt = btn('▸', () => showAt(k + 1), 'icon-btn', { 'aria-label': 'Mossa successiva' });
    L.actions.append(prev, nxt, btn('Rivincita', () => startGame(host, cfg), 'primary'), btn('Nuove impostazioni', () => toggleSettings(true), 'ghost'));
    slider.addEventListener('input', () => showAt(+slider.value));
    function showAt(j) {
      k = Math.max(0, Math.min(rec.length, j)); slider.value = k;
      prev.disabled = k === 0; nxt.disabled = k === rec.length;
      info.innerHTML = '';
      if (k === 0) { goban.set({ board: startBoard.clone() }); info.append(h('p', {}, 'Posizione iniziale.')); return; }
      const r = rec[k - 1], after = r.before.clone(); after.play(r.p, r.c);
      const marks = {}, labels = {};
      if (r.c === me && r.verdict && r.verdict[0] === 'bad' && r.p !== PASS) marks[r.p] = 'x';
      if (r.c === me && r.best !== null && r.best !== undefined) { const bb = r.before; if (bb.cells[r.best] === EMPTY) labels[r.best] = '✓'; }
      goban.set({ board: r.best ? r.before : after, last: r.best ? null : r.p, marks: r.best ? { [r.p]: 'x' } : marks, labels });
      const t = h('p', {}); t.append(linkify(`Mossa ${k}. ${describeMove(r.before, r.p, r.c)}`)); info.append(t);
      if (r.verdict) info.append(h('p', { class: 'verdict ' + r.verdict[0] }, r.verdict[1]));
      if (r.best) info.append(h('p', {}, `Meglio ${coordName(r.before, r.best)} (segnata con ✓; la tua mossa è la croce). Stima ${Math.round(r.wr * 100)}% contro ${Math.round(r.wrBest * 100)}%.`));
      for (const x of r.notes || []) { const el = h('p', { class: 'note' }); el.append(linkify(x)); info.append(el); }
    }
    showAt(flagged.length ? flagged[0][1] + 1 : rec.length);
  }

  draw(); goban.clickable = board.toMove === me;
  if (board.toMove === me) { setStatus(me === BLACK ? 'Tocca a te: il nero muove per primo.' : 'Tocca a te.'); startPre(); maybeQuiz(); }
  else { setStatus(cfg.handicap ? `Hai ${plural(cfg.handicap, 'pietra', 'pietre')} di vantaggio: comincia il bianco.` : 'Comincia il computer.'); aiTurn(); }
}
