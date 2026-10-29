// Collaudo automatico: si carica nella pagina del sito (console del browser) e percorre tutto.
// Uso: fetch('tools/collaudo.js').then(r => r.text()).then(eval); poi await Collaudo.tutto()
window.Collaudo = (() => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const errori = [];
  window.addEventListener('error', e => errori.push(location.hash + ' → ' + e.message));
  window.addEventListener('unhandledrejection', e => errori.push(location.hash + ' → promessa: ' + (e.reason && e.reason.message || e.reason)));
  const P9 = (b, c) => b.pt(COLS.indexOf(c[0]), b.n - parseInt(c.slice(1), 10));
  const btnTxt = re => [...document.querySelectorAll('.play .actions .btn')].find(b => re.test(b.textContent) && !b.disabled);
  async function vai(r) { location.hash = r; await wait(350); }

  async function schermate() {
    const out = [];
    for (const r of ['oggi', 'percorso', 'problemi', 'caso', 'livello/0', 'catalogo/0/0', 'tema/scala', 'infinito', 'ripasso', 'partita', 'sfida', 'tappeto', 'lessico', 'lessico/ko', 'maestro', 'progressi', 'impostazioni', 'benvenuto', 'esercizi/1']) {
      await vai(r);
      const v = document.querySelector('.view');
      out.push(`${r}: ${v ? v.innerText.trim().length + ' caratteri' : 'VUOTA'}`);
    }
    return out;
  }
  // risolve il problema sul goban giocando le mosse giuste finché è risolto
  async function risolvi(P, maxMosse) {
    const g = window.__goban;
    for (let i = 0; i < (maxMosse || 16); i++) {
      await wait(50);
      const b = g.opts.board, cm = correctMoves(P, b);
      if (!cm.length) return 'nessuna mossa giusta dopo ' + i + ' mosse';
      await g.onPlay(cm[0]);
      await wait(P.region ? 900 : 750);
      if (/Tocca il goban per il prossimo/.test(document.querySelector('.play .feedback').textContent)) return null;
    }
    return 'non finisce dopo ' + (maxMosse || 16) + ' mosse';
  }
  async function lezione(i) {
    const U = UNITS[i], probl = [];
    await vai('lezione/' + i);
    for (let k = 0; k < U.lesson.length; k++) {
      const st = U.lesson[k], g = window.__goban;
      const tit = document.querySelector('.play-title').textContent;
      if (tit !== (st.title || '')) probl.push(`${k}: titolo "${tit}" invece di "${st.title}"`);
      if (st.type === 'move') {
        const P = buildProblem(st.ref);
        const e = await risolvi(P); if (e) { probl.push(`${k} (${st.ref}): ${e}`); return probl; }
        await g.onPlay(0); await wait(250);
      } else if (st.type === 'seq') {
        const b = btnTxt(/^(Avanti|Fine)$/); if (!b) { probl.push(k + ': manca Avanti nella sequenza'); return probl; }
        b.click(); await wait(250);
      } else if (st.type === 'info') {
        g.onPlay(0); await wait(200);
      } else {
        const b = g.opts.board;
        for (const a of st.answers) { g.onPlay(P9(b, a)); await wait(60); if (st.type === 'pick') break; }
        await wait(100);
        if (!/avanti|Esatto|Tutte|Bene|Ottima|Ecco|Tagliato|Così|Se il bianco|Il nero entra/i.test(document.querySelector('.play .feedback').textContent)) probl.push(`${k}: risposta non accettata (${document.querySelector('.play .feedback').textContent.slice(0, 60)})`);
        g.onPlay(0); await wait(200);
      }
    }
    await wait(200);
    if (!Store.unit(U.id).lesson) probl.push('lezione non segnata come fatta');
    return probl;
  }
  async function lezioni(da, a) {
    const out = [];
    for (let i = da || 0; i < (a || UNITS.length); i++) { const p = await lezione(i); out.push(`${i + 1} ${UNITS[i].id}: ${p.length ? p.join(' | ') : 'ok'}`); }
    return out;
  }
  // un campione di problemi del catalogo: ognuno deve avere soluzione e finire
  function catalogo(n) {
    const out = []; let ok = 0;
    for (let k = 0; k < n; k++) {
      const i = Math.floor(k * CATALOG.length / n), P = catProblem(i);
      let b = P.board.clone(), fine = false;
      for (let m = 0; m < 10 && !fine; m++) {
        const cm = correctMoves(P, b); if (!cm.length) { out.push(`${CATALOG[i].id} (${CATALOG[i].t}): nessuna mossa giusta alla mossa ${m}`); break; }
        b.play(cm[0], BLACK); if (isSolved(P, b)) { fine = true; break; }
        b.play(engineReply(P, b), WHITE);
      }
      if (fine) ok++; else if (!out.some(x => x.startsWith(CATALOG[i].id))) out.push(`${CATALOG[i].id} (${CATALOG[i].t}): non finisce`);
    }
    return { provati: n, ok, problemi: out };
  }
  // partite: qualche mossa per ogni goban, indietro, passo, fine e revisione
  async function partite() {
    const out = [];
    for (const size of [7, 9, 13, 19]) {
      Store.data.game = Object.assign(Store.data.game, { size, level: 0, quiz: 'off', coach: true, atari: true, handicap: 0, color: BLACK });
      await vai('oggi'); await vai('partita'); await wait(300);
      const g = window.__goban; let mosse = 0;
      for (let k = 0; k < 3; k++) {
        const b = g.opts.board; const vuoti = b.emptyPoints().filter(p => { const [x, y] = b.xy(p); return x > 1 && y > 1 && x < b.n - 2 && y < b.n - 2 && b.isLegal(p, BLACK); });
        if (!vuoti.length) break;
        const p = vuoti[Math.floor(Math.random() * vuoti.length)];
        g.onPlay(p); g.onPlay(p);  // due tocchi: sul 13 e 19 il telefono chiede conferma
        let t = 0; while (!/Tocca a te|vinto|Ha vinto|catturato/i.test(document.querySelector('.status').textContent) && t < 160) { await wait(100); t++; }
        if (t >= 160) { out.push(`${size}: il computer non risponde dopo la mossa ${k + 1}`); break; }
        mosse++;
        if (/vinto|Ha vinto/i.test(document.querySelector('.evalbox').textContent)) break;
      }
      const ind = [...document.querySelectorAll('.play .actions .btn')].find(b => b.textContent === 'Indietro');
      if (ind) { ind.click(); await wait(600); }
      out.push(`${size}×${size}: ${mosse} mosse giocate, ${g.opts.board.cells.filter(v => v === 1 || v === 2).length} pietre dopo Indietro`);
    }
    return out;
  }
  async function negozio() {
    const out = [], salva = JSON.stringify(Store.data);
    const d = Store.data; d.days = {}; d.dev = {};
    // serie: tre giorni chiusi di fila fino a ieri
    for (let i = 1; i <= 3; i++) d.days[addDays(today(), -i)] = 10;
    out.push('serie fino a ieri: ' + Store.streak() + ' (atteso 3)');
    d.days[today()] = 10; out.push('serie con oggi: ' + Store.streak() + ' (atteso 4)');
    out.push('settimana da lunedì: ' + weekStart() + ', perle: ' + Store.perleWeek(d.days));
    out.push('pietre 23 contro 0: ' + JSON.stringify(goStones(23, 0)) + ' · 4 contro 0: ' + JSON.stringify(goStones(4, 0)) + ' · 0 contro 30: ' + JSON.stringify(goStones(0, 30)));
    const code = Store.makeCode(), p = Store.readCode('ciao ' + code + ' ciao');
    out.push('codice andata e ritorno: ' + (p.t === Store.perleTot() ? 'ok' : 'NO'));
    try { Store.readCode('CP28-xx!!'); out.push('codice rotto accettato: NO'); } catch (e) { out.push('codice rotto rifiutato: ok'); }
    Store.data = JSON.parse(salva); Store.save(true);
    return out;
  }
  async function varie() {
    const out = [];
    await vai('lessico'); const t = document.querySelector('.gl-def .term'); if (t) { t.click(); await wait(200); out.push('termine cliccabile: ' + (document.querySelector('#termbox') ? 'ok' : 'NO')); closeTerm(); } else out.push('nessun termine cliccabile nella definizione');
    Office.show(); await wait(300); out.push('salvaschermo: ' + (document.querySelector('.saver') ? document.querySelectorAll('.saver img').length + ' immagini' : 'NO')); Office.hide();
    await vai('maestro'); const f = document.querySelector('.ask'); f.querySelector('input').value = 'che differenza tra scala e rete'; f.requestSubmit(); await wait(200); out.push('maestro: ' + document.querySelectorAll('.answer').length + ' risposte');
    await vai('sfida'); const det = document.querySelector('.live-add'); out.push('modulo partita dal vivo: ' + (det ? 'ok' : 'NO'));
    return out;
  }
  return { errori, schermate, lezioni, lezione, catalogo, partite, negozio, varie, wait };
})();
'collaudo caricato';
