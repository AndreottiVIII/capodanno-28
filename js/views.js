// ===== Navigazione e schermate =====
window.ViewTok = 0;
const NAV = [
  ['oggi', 'Oggi', 'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16zM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z', true],
  ['percorso', 'Percorso', 'M4 19c4 0 4-6 8-6s4-6 8-6M4 17.4a1.6 1.6 0 1 0 0 3.2a1.6 1.6 0 1 0 0-3.2zM20 5.4a1.6 1.6 0 1 0 0 3.2a1.6 1.6 0 1 0 0-3.2z', true],
  ['problemi', 'Problemi', 'M4 4h16v16H4zM4 12h16M12 4v16', false],
  ['partita', 'Partita', 'M4 4h16v16H4zM4 10h16M4 14h16M10 4v16M14 4v16', true],
  ['sfida', 'Sfida', 'M7 4h10v4a5 5 0 0 1-10 0zM12 13v4M8 20h8', true],
  ['tappeto', 'Il tappeto', 'M4 5h16v14H4zM7 8h10v8H7zM4 19v2M8 19v2M12 19v2M16 19v2M20 19v2', false],
  ['lessico', 'Lessico', 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11', true],
  ['maestro', 'Il maestro', 'M12 3a5 5 0 1 0 0 10a5 5 0 1 0 0-10zM4 21c1-4 4-6 8-6s7 2 8 6', false],
  ['progressi', 'Progressi', 'M4 20V10M10 20V4M16 20v-7M22 20H2', false],
  ['impostazioni', 'Impostazioni', 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2', false],
];
const icon = d => { const sv = s('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }); sv.append(s('path', { d })); return sv; };

function go(route) { if (location.hash.slice(1) === route) render(); else location.hash = route; }
function buildChrome() {
  const side = $('#side'), tabs = $('#tabs');
  side.innerHTML = ''; tabs.innerHTML = '';
  side.append(
    h('a', { class: 'brand', href: '#oggi' }, h('span', { class: 'seal-big', 'aria-hidden': 'true' }, '圍', h('br'), '棋'), h('span', {}, 'Capodanno 28')),
    h('div', { class: 'side-filo', id: 'sideFilo' }),
    h('nav', { class: 'side-nav', 'aria-label': 'Sezioni' }, ...NAV.map(([id, label]) => h('a', { href: '#' + id, 'data-v': id }, label))),
    h('button', { class: 'office-btn', type: 'button', onclick: () => Office.show(), title: 'Il vostro tappeto a tutto schermo, come salvaschermo' }, 'Modalità ufficio', h('kbd', {}, 'Esc')),
    h('img', { class: 'side-orn', alt: '', src: 'img/orn/vaso-1.svg' }));
  tabs.append(...NAV.filter(x => x[3]).map(([id, label, d]) => h('a', { href: '#' + id, 'data-v': id }, icon(d), h('span', {}, label))));
  $('#menuBtn').onclick = openMenu;
  refreshChrome();
}
function openMenu() {
  const sheet = h('div', { class: 'menu-sheet', role: 'dialog', 'aria-label': 'Tutte le sezioni' });
  const close = () => sheet.remove();
  sheet.append(h('div', { class: 'menu-card card' },
    h('div', { class: 'menu-top' }, h('span', { class: 'kicker' }, 'Tutte le sezioni'), btn('Chiudi', close, 'ghost')),
    h('nav', { class: 'menu-list' }, ...NAV.map(([id, label, d]) => h('a', { href: '#' + id, onclick: close }, icon(d), label)),
      h('button', { type: 'button', onclick: () => { close(); Office.show(); } }, icon('M3 5h18v14H3zM3 10h18M9 5v14'), 'Modalità ufficio'))));
  sheet.addEventListener('click', e => { if (e.target === sheet) close(); });
  document.body.append(sheet);
  sheet.querySelector('a').focus();
}
function setNav(id) { $$('[data-v]').forEach(a => a.classList.toggle('on', a.dataset.v === id)); }
function refreshChrome() {
  const sf = $('#sideFilo'); if (!sf) return;
  sf.innerHTML = '';
  sf.append(filoBeads(Store.perleToday(), true), h('p', {}, `${Store.perleToday()} perle su ${CONFIG.perleFilo} · serie ${Store.streak()}`));
  const f = $('#filoBeads');
  if (f) { f.innerHTML = ''; f.append(filoBeads(Store.perleToday())); $('#filoCount').textContent = `${Store.perleToday()} perle su ${CONFIG.perleFilo}`; $('#filoNote').textContent = filoNote(); }
}
// il filo di perle: 10 grani su un filo d'oro
function filoBeads(n, small) {
  const goal = CONFIG.perleFilo, wrap = h('div', { class: 'filo' + (small ? ' sm' : ''), role: 'img', 'aria-label': `${Math.min(n, goal)} perle su ${goal}` });
  for (let i = 0; i < goal; i++) wrap.append(h('span', { class: 'pearl' + (i < n ? ' on' : '') }));
  if (n > goal) wrap.append(h('span', { class: 'filo-extra' }, '+' + (n - goal)));
  return wrap;
}

// ---------- Ornamenti: motivi sbloccati sparsi su ogni schermata ----------
function unlockedOrn() { const t = Store.perleCoppia(); return ORN.filter(o => o.soglia <= t); }
function nextOrn() { const t = Store.perleCoppia(); return ORN.find(o => o.soglia > t) || null; }
const ORN_SLOTS = [
  { cls: 'o-tr', w: [230, 330] }, { cls: 'o-mr', w: [150, 220] }, { cls: 'o-br', w: [170, 260] }, { cls: 'o-bl', w: [110, 160] },
];
function decorate(view, count) {
  const pool = shuffle(unlockedOrn().slice());
  const n = Math.min(count || 3, pool.length);
  const layer = h('div', { class: 'orn-layer', 'aria-hidden': 'true' }, h('div', { class: 'intaglio' }));
  for (let i = 0; i < n; i++) {
    const o = pool[i], sl = ORN_SLOTS[i];
    const w = Math.round(sl.w[0] + Math.random() * (sl.w[1] - sl.w[0]));
    const img = h('img', { class: 'orn ' + sl.cls + (Math.random() < .5 ? ' flip' : ''), src: o.file, alt: '', style: { width: w + 'px' }, onerror: function () { this.remove(); } });
    layer.append(img);
  }
  // il livello degli ornamenti copre tutta l'area a destra del menu: sugli schermi larghi i motivi stanno nei margini
  const main = $('#main'); const old = $('.orn-layer', main); if (old) old.remove(); main.prepend(layer);
}

// ---------- Router ----------
const VIEWS = {
  oggi: viewToday, percorso: viewPath, lezione: viewLesson, esercizi: viewUnitProblems,
  problemi: viewProblems, livello: viewLevel, catalogo: viewCatalogRun, tema: viewTheme, infinito: viewEndless, ripasso: viewReview, caso: viewRandom,
  partita: viewGame, sfida: viewChallenge, tappeto: viewCarpet, lessico: viewGlossary, maestro: viewMaestro,
  progressi: viewProgress, impostazioni: viewSettings, benvenuto: viewWelcome,
};
function render() {
  window.ViewTok++;
  closeTerm(); applyTheme();
  const [id, ...args] = (location.hash.slice(1) || 'oggi').split('/');
  const fn = VIEWS[id] || viewToday;
  const main = $('#main'); main.innerHTML = '';
  document.body.classList.toggle('welcome-mode', id === 'benvenuto');
  const view = h('div', { class: 'view view-' + (VIEWS[id] ? id : 'oggi') });
  main.append(view);
  setNav(id === 'lezione' || id === 'esercizi' ? 'percorso' : ['livello', 'catalogo', 'tema', 'infinito', 'ripasso', 'caso'].includes(id) ? 'problemi' : id);
  fn(view, ...args.map(decodeURIComponent));
  if (id !== 'benvenuto') decorate(view, id === 'tappeto' ? 2 : 3);
  window.scrollTo(0, 0);
  refreshChrome();
}
function pageHead(kicker, title, lede) {
  return h('header', { class: 'page-head' }, kicker ? h('p', { class: 'kicker' }, kicker) : null, h('h1', {}, title), lede ? h('p', { class: 'lede' }, lede) : null);
}

// ---------- Percorso e catalogo: stato ----------
function unitDone(i) { const U = UNITS[i], u = Store.unit(U.id); return u.lesson && (U.problems.length === 0 || u.ok >= 5); }
function unitOpen(i) { return i === 0 || unitDone(i - 1) || Store.data.skipLock[UNITS[i].id]; }
function currentUnitIndex() { for (let i = 0; i < UNITS.length; i++) if (!unitDone(i)) return i; return UNITS.length - 1; }
const GEN_RATING = { capture1: 70, save: 220, read: 460 };
function refRating(base) { const [t, id] = base.split(':'); if (t === 'c') return CURATED[id].rating; if (t === 's') return SHAPES[id].rating; if (t === 'k') { const e = CATALOG[CAT_INDEX.get(id)]; return e ? e.k : 300; } return GEN_RATING[id] || 200; }
function concreteRef(base, variants) { const [t, id] = base.split(':'); if (t === 'g') return `g:${id}:${1 + Math.floor(Math.random() * 1e6)}`; return `${t}:${id}:${Math.floor(Math.random() * variants)}`; }
const catLevels = () => Math.ceil(CATALOG.length / CAT_PER_LEVEL);
const catIdx = lv => { const a = []; for (let i = lv * CAT_PER_LEVEL; i < Math.min(CATALOG.length, (lv + 1) * CAT_PER_LEVEL); i++) a.push(i); return a; };
const pbOf = i => Store.data.pb['k:' + CATALOG[i].id] || {};
function catLevelStats(lv) { const ids = catIdx(lv); let solved = 0, first = 0; for (const i of ids) { const e = pbOf(i); if (e.s) solved++; if (e.ok) first++; } return { solved, first, total: ids.length }; }
const LEVEL_UNLOCK = 14;
function catLevelOpen(lv) { return lv === 0 || catLevelStats(lv - 1).solved >= LEVEL_UNLOCK || Store.data.skipLock['lv' + lv]; }
function catCurrentLevel() { let cur = 0; for (let lv = 0; lv < catLevels(); lv++) { if (!catLevelOpen(lv)) break; cur = lv; if (catLevelStats(lv).solved < CAT_PER_LEVEL) return lv; } return cur; }
function themesOf(ids) { const c = {}; for (const i of ids) c[CATALOG[i].t] = (c[CATALOG[i].t] || 0) + 1; return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([t]) => THEMES[t].name.replace('Vita e morte: ', '')); }
function catRefs(ids) { return ids.map(i => ({ ref: 'k:' + CATALOG[i].id })); }
function nextCatalogItems(n, skip) {
  const out = []; skip = skip || new Set();
  for (let lv = catCurrentLevel(); lv < catLevels() && out.length < n; lv++) {
    if (!catLevelOpen(lv) && lv > catCurrentLevel()) break;
    for (const i of catIdx(lv)) { const ref = 'k:' + CATALOG[i].id; if (!pbOf(i).s && !skip.has(ref)) { out.push({ ref }); if (out.length >= n) break; } }
  }
  if (out.length < n) for (const i of shuffle(catIdx(catCurrentLevel()))) { const ref = 'k:' + CATALOG[i].id; if (!skip.has(ref) && !out.some(x => x.ref === ref)) out.push({ ref }); if (out.length >= n) break; }
  return out;
}

// ---------- L'esercizio di oggi ----------
function buildDaily() {
  const items = [], ci = currentUnitIndex(), U = UNITS[ci], u = Store.unit(U.id);
  const lessonDay = !u.lesson;
  if (lessonDay) items.push({ lesson: ci });
  for (const [ref, r] of Store.dueReviews().slice(0, 2)) items.push({ ref, unit: r.unit, review: true });
  // esercizi dell'unità: quella di oggi, o l'ultima con lezione fatta
  let ui = ci; if (lessonDay) ui = ci; else while (ui > 0 && !UNITS[ui].problems.length) ui--;
  const UU = UNITS[ui];
  if (UU.problems.length && (Store.unit(UU.id).lesson || lessonDay)) {
    const pool = UU.problems.slice().sort((a, b) => refRating(a[0]) - refRating(b[0]));
    const k = Store.unit(UU.id).ok;
    for (let j = 0; j < (lessonDay ? 2 : 3); j++) { const [base, v] = pool[(k + j) % pool.length]; items.push({ ref: concreteRef(base, v), unit: UU.id }); }
  }
  const want = lessonDay ? 5 : 6, have = items.filter(x => x.ref).length;
  items.push(...nextCatalogItems(Math.max(0, want - have), new Set(items.map(x => x.ref))));
  return { date: today(), items, idx: 0 };
}
function daily() {
  let d = Store.data.daily;
  if (!d || d.date !== today()) { d = Store.data.daily = buildDaily(); Store.save(); }
  return d;
}

function viewToday(view) {
  const d = daily(), name = Store.data.name;
  const head = h('header', { class: 'today-head' },
    h('div', {}, h('p', { class: 'kicker' }, longDate()), h('h1', {}, `${greeting()}${name ? ', ' + name : ''}`)),
    h('div', { class: 'today-filo' }, h('div', { class: 'row-between' }, h('span', { class: 'label' }, 'Il filo di oggi'), h('span', { class: 'dim', id: 'filoCount' }, `${Store.perleToday()} perle su ${CONFIG.perleFilo}`)), h('div', { id: 'filoBeads' }, filoBeads(Store.perleToday())), h('p', { class: 'dim small', id: 'filoNote' }, filoNote())));
  const playHost = h('div', { class: 'today-play' });
  const strip = h('div', { class: 'today-strip' }, challengeMini(), carpetMini(), h('div', { class: 'quick' },
    h('a', { class: 'quick-card', href: '#partita' }, h('span', { class: 'qc-t' }, 'Partita'), h('span', { class: 'dim' }, cfgLabel(Store.data.game))),
    h('a', { class: 'quick-card', href: '#maestro' }, h('span', { class: 'qc-t' }, 'Il maestro'), h('span', { class: 'dim' }, 'domande e spiegazioni')),
    h('a', { class: 'quick-card', href: '#problemi' }, h('span', { class: 'qc-t' }, 'Problemi'), h('span', { class: 'dim' }, `${CATALOG.length} problemi, livello ${catCurrentLevel() + 1}`))));
  if (Sync.on && !Sync.logged) view.append(h('a', { class: 'banner', href: '#impostazioni' }, h('b', {}, 'Entra con il tuo account'), h('span', { class: 'dim' }, ' per avere gli stessi progressi su computer e telefono e vedere le perle dell\'altro.')));
  view.append(head, playHost, strip);
  if (d.idx >= d.items.length) return dailyDone(playHost);
  runSeries(playHost, d.items, {
    title: 'Oggi', start: d.idx, cls: 'today',
    onIndex: i => { d.idx = i; Store.save(); },
    onFinish: () => dailyDone(playHost),
  });
}
function filoNote() {
  const n = Store.perleToday(), goal = CONFIG.perleFilo, st = Store.streak();
  if (n >= goal) return `Filo chiuso. Serie: ${plural(st, 'giorno', 'giorni')} di fila.`;
  return `Una perla per problema risolto, due al primo colpo. ${st ? `Chiudilo e la serie arriva a ${st + 1} giorni.` : 'Chiudilo e comincia una serie.'}`;
}
function dailyDone(host) {
  host.innerHTML = '';
  const n = Store.perleToday(), goal = CONFIG.perleFilo;
  const card = h('section', { class: 'card done-card' },
    h('p', { class: 'kicker' }, 'Esercizio di oggi'),
    h('h2', {}, n >= goal ? 'Fatto, e il filo è chiuso.' : `Fatto. Mancano ${plural(goal - n, 'perla', 'perle')} al filo.`),
    h('p', { class: 'dim' }, n >= goal ? 'Domani un\'altra lezione o un\'altra serie. Se hai ancora voglia, il catalogo è qui.' : 'Qualche problema in più del catalogo e il filo si chiude.'),
    h('div', { class: 'actions' },
      btn(n >= goal ? 'Altri problemi' : 'Chiudi il filo', () => {
        host.innerHTML = '';
        runSeries(host, nextCatalogItems(6), { title: 'Ancora', cls: 'today', onFinish: () => dailyDone(host) });
      }, 'primary'),
      btn('Problemi a caso', () => { host.innerHTML = ''; runSeries(host, randomItems(6), { title: 'A caso', cls: 'today', onFinish: () => dailyDone(host) }); }, ''),
      Store.dueReviews().length ? btn(`Ripasso (${Store.dueReviews().length})`, () => go('ripasso'), '') : null,
      btn('Partita', () => go('partita'), '')));
  host.append(card);
}
function challengeMini() {
  const mine = Store.perleWeek(Store.data.days), riv = Store.data.rival, theirs = riv ? Store.perleWeek(riv.d) : null;
  return h('a', { class: 'mini-sfida card', href: '#sfida' },
    h('span', { class: 'ms-side' }, h('span', { class: 'big-num c-me' }, String(mine)), h('span', { class: 'dim' }, 'perle tue')),
    h('span', { class: 'ms-mid' }, 'sfida', h('br'), 'della settimana'),
    h('span', { class: 'ms-side r' }, h('span', { class: 'big-num c-rival' }, theirs === null ? '·' : String(theirs)), h('span', { class: 'dim' }, riv ? `perle di ${riv.n}` : 'scambia il codice')));
}
function carpetMini() {
  const un = unlockedOrn(), nx = nextOrn();
  return h('a', { class: 'mini-tappeto card', href: '#tappeto' },
    h('span', { class: 'row-between' }, h('span', { class: 'qc-t' }, 'Il vostro tappeto'), h('span', { class: 'dim' }, `${un.length} su 100`)),
    h('span', { class: 'mt-row' }, ...un.slice(-3).reverse().map(o => h('span', { class: 'mt-tile' }, h('img', { src: o.file, alt: o.nome, onerror: function () { this.replaceWith(h('span', { class: 'han' }, o.han)); } }))),
      nx ? h('span', { class: 'mt-tile locked' }, h('span', { class: 'han' }, nx.han), h('small', {}, nx.soglia)) : null),
    nx ? h('span', { class: 'dim small' }, `Prossimo: ${nx.nome.toLowerCase()}, a ${nx.soglia} perle.`) : h('span', { class: 'dim small' }, 'Tappeto completo.'));
}

// ---------- Percorso ----------
function viewPath(view) {
  const cur = currentUnitIndex();
  view.append(pageHead(`${UNITS.length} lezioni in ${CAPITOLI.length - 1} capitoli`, 'Percorso', 'Una cosa alla volta, pochi minuti per lezione. Le lezioni con esercizi si completano con cinque problemi risolti al primo colpo; le altre basta leggerle.'));
  const list = h('ol', { class: 'path' });
  let cap = 0;
  UNITS.forEach((U, i) => {
    if (U.cap !== cap) {
      cap = U.cap;
      const inCap = UNITS.filter(x => x.cap === cap), doneN = inCap.filter(x => unitDone(UNITS.indexOf(x))).length;
      list.append(h('li', { class: 'cap-h' }, h('span', { class: 'kicker' }, `Capitolo ${cap} · ${doneN} di ${inCap.length}`), h('h2', {}, CAPITOLI[cap])));
    }
    const u = Store.unit(U.id), open = unitOpen(i), done = unitDone(i);
    const meta = done ? 'completata' : !open ? 'chiusa' : !u.lesson ? 'lezione da fare' : U.problems.length ? `esercizi ${Math.min(u.ok, 5)} su 5` : 'completata';
    list.append(h('li', { class: 'path-row card ' + (done ? 'done' : open ? 'open' : 'locked') + (i === cur ? ' cur' : '') },
      h('span', { class: 'pr-n' }, String(i + 1)),
      h('span', { class: 'pr-main' }, h('span', { class: 'pr-t' }, U.title), h('span', { class: 'dim' }, `${U.summary} ${meta}.`)),
      h('span', { class: 'pr-act' },
        open ? btn(u.lesson ? 'Rivedi' : 'Lezione', () => go('lezione/' + i), u.lesson ? '' : 'primary') : null,
        open && U.problems.length && u.lesson ? btn('Esercizi', () => go('esercizi/' + i), done ? '' : 'primary') : null,
        !open ? btn('Apri lo stesso', () => { Store.data.skipLock[U.id] = true; Store.save(); render(); }, 'ghost') : null)));
  });
  view.append(list);
}
function viewLesson(view, ui) { ui = Math.max(0, Math.min(UNITS.length - 1, +ui || 0)); runLesson(view, ui); }
function viewUnitProblems(view, ui) {
  ui = +ui || 0; const U = UNITS[ui];
  if (!U.problems.length) return go('percorso');
  const pool = U.problems.slice().sort((a, b) => refRating(a[0]) - refRating(b[0]));
  const items = []; for (let k = 0; items.length < 8; k++) { const [base, v] = pool[k % pool.length]; items.push({ ref: concreteRef(base, v), unit: U.id }); }
  runSeries(view, items, { title: U.title, again: () => render() });
}

// ---------- Problemi ----------
function viewProblems(view) {
  const cur = catCurrentLevel(), cst = catLevelStats(cur), due = Store.dueReviews().length;
  view.append(pageHead(`${CATALOG.length} problemi`, 'Problemi', `${catLevels()} livelli, dal più facile. Ogni soluzione è verificata da un risolutore e spiegata. Un livello si apre risolvendone ${LEVEL_UNLOCK} del precedente.`));
  view.append(h('div', { class: 'tiles' },
    h('a', { class: 'tile card accent', href: '#catalogo/' + cur }, h('span', { class: 'qc-t' }, `Continua: livello ${cur + 1}`), h('span', { class: 'dim' }, `${cst.solved} di ${cst.total} risolti`)),
    h('a', { class: 'tile card', href: '#caso' }, h('span', { class: 'qc-t' }, 'A caso'), h('span', { class: 'dim' }, 'dieci problemi pescati dal catalogo, temi misti')),
    h('a', { class: 'tile card', href: '#infinito' }, h('span', { class: 'qc-t' }, 'Allenamento infinito'), h('span', { class: 'dim' }, 'problemi nuovi generati al momento, al tuo livello')),
    h('a', { class: 'tile card', href: '#ripasso' }, h('span', { class: 'qc-t' }, 'Ripasso'), h('span', { class: 'dim' }, due ? `${plural(due, 'problema', 'problemi')} da rifare oggi` : 'niente da ripassare oggi'))));
  const grid = h('div', { class: 'levels' });
  for (let lv = 0; lv < catLevels(); lv++) {
    const st = catLevelStats(lv), open = catLevelOpen(lv), full = st.solved === st.total;
    grid.append(h('a', { class: 'lvl ' + (full ? 'full' : open ? 'open' : 'locked') + (lv === cur ? ' cur' : ''), href: open ? '#livello/' + lv : null, 'aria-disabled': open ? null : 'true', onclick: open ? null : e => { e.preventDefault(); if (confirm(`Aprire il livello ${lv + 1} senza finire il precedente?`)) { Store.data.skipLock['lv' + lv] = true; Store.save(); go('livello/' + lv); } } },
      h('span', { class: 'lvl-n' }, String(lv + 1)), h('span', { class: 'lvl-bar' }, h('span', { style: { width: Math.round(100 * st.solved / st.total) + '%' } }))));
  }
  view.append(h('h2', { class: 'sec-h' }, 'Livelli'), grid);
  const tl = h('div', { class: 'theme-list' });
  for (const t in THEMES) {
    const ids = CATALOG.map((e, i) => [e, i]).filter(([e]) => e.t === t);
    if (!ids.length) continue;
    const solved = ids.filter(([, i]) => pbOf(i).s).length;
    const S = SEALS.find(x => x.id === SEAL_BY_THEME[t]);
    tl.append(h('a', { class: 'theme card', href: '#tema/' + encodeURIComponent(t) },
      S ? h('span', { class: 'seal-mini' + ((Store.data.seals[S.id] || 0) >= sealNeed(S) ? '' : ' off') }, S.han) : null,
      h('span', { class: 'pr-main' }, h('span', { class: 'qc-t' }, THEMES[t].name + (THEMES[t].jp ? ' · ' + THEMES[t].jp : '')), h('span', { class: 'dim' }, `${solved} di ${ids.length} risolti`))));
  }
  view.append(h('h2', { class: 'sec-h' }, 'Per tattica'), tl);
}
function viewLevel(view, lv) {
  lv = +lv || 0;
  if (!catLevelOpen(lv)) return go('problemi');
  const ids = catIdx(lv), st = catLevelStats(lv);
  view.append(pageHead('Problemi', `Livello ${lv + 1}`, `${st.solved} di ${st.total} risolti, ${st.first} al primo colpo. Temi: ${themesOf(ids).join(', ')}.`));
  const grid = h('div', { class: 'pgrid' });
  ids.forEach((i, k) => { const e = pbOf(i); grid.append(h('a', { class: 'pcell ' + (e.s ? 'ok' : e.ok === false ? 'ko' : ''), href: `#catalogo/${lv}/${k}`, 'aria-label': `Problema ${k + 1}${e.s ? ', risolto' : ''}` }, String(k + 1), h('span', {}, e.s ? 'risolto' : e.ok === false ? 'da rifare' : ''))); });
  const firstOpen = Math.max(0, ids.findIndex(i => !pbOf(i).s));
  view.append(grid, h('div', { class: 'actions' }, btn(st.solved === st.total ? 'Ripeti il livello' : 'Inizia', () => go(`catalogo/${lv}/${st.solved === st.total ? 0 : firstOpen}`), 'primary'), btn('Tutti i livelli', () => go('problemi'), 'ghost')));
}
function viewCatalogRun(view, lv, k) {
  lv = +lv || 0; const ids = catIdx(lv);
  if (k === undefined) k = Math.max(0, ids.findIndex(i => !pbOf(i).s));
  runSeries(view, catRefs(ids), {
    title: `Livello ${lv + 1}`, start: +k || 0,
    onFinish: (L) => {
      const st = catLevelStats(lv), nl = lv + 1;
      L.body.innerHTML = ''; clearLog(L); L.goban.clickable = false; L.kicker.textContent = `Livello ${lv + 1}`;
      L.title.textContent = `${st.solved} di ${st.total} risolti`;
      setFeedback(L, 'good', nl < catLevels() && catLevelOpen(nl) ? `Il livello ${nl + 1} è aperto.` : `Per aprire il livello ${nl + 1} servono ${LEVEL_UNLOCK} problemi risolti: quelli sbagliati puoi rifarli.`);
      L.actions.innerHTML = '';
      if (nl < catLevels() && catLevelOpen(nl)) L.actions.append(btn(`Livello ${nl + 1}`, () => go('catalogo/' + nl), 'primary'));
      if (st.solved < st.total) L.actions.append(btn('Rifai i non risolti', () => go(`catalogo/${lv}/${ids.findIndex(i => !pbOf(i).s)}`), ''));
      L.actions.append(btn('Problemi', () => go('problemi'), 'ghost'));
    },
  });
}
function viewTheme(view, t) {
  if (!THEMES[t]) return go('problemi');
  const ids = CATALOG.map((e, i) => [e, i]).filter(([e]) => e.t === t).sort((a, b) => a[0].k - b[0].k).map(([, i]) => i);
  const rest = ids.filter(i => !pbOf(i).s);
  runSeries(view, catRefs((rest.length ? rest : ids).slice(0, 10)), { title: THEMES[t].name, again: () => render() });
}
function viewEndless(view) {
  const r = Store.data.rating, items = [];
  for (let i = 0; i < 10; i++) {
    const w = r < 150 ? [0.6, 0.35, 0.05] : r < 320 ? [0.2, 0.4, 0.4] : [0.1, 0.25, 0.65];
    const x = Math.random(), type = x < w[0] ? 'capture1' : x < w[0] + w[1] ? 'save' : 'read';
    items.push({ ref: `g:${type}:${1 + Math.floor(Math.random() * 1e7)}`, unit: { capture1: 'cattura', save: 'salvare', read: 'scala' }[type] });
  }
  runSeries(view, items, { title: 'Allenamento infinito', again: () => render() });
}
// problemi a caso dal catalogo, fino a tre livelli sopra il tuo; prima quelli non ancora risolti
function randomItems(n) {
  const maxLv = Math.min(catLevels() - 1, catCurrentLevel() + 3), pool = [];
  for (let lv = 0; lv <= maxLv; lv++) pool.push(...catIdx(lv));
  return catRefs([...shuffle(pool.filter(i => !pbOf(i).s)), ...shuffle(pool.filter(i => pbOf(i).s))].slice(0, n));
}
function viewRandom(view) { runSeries(view, randomItems(10), { title: 'A caso', again: () => render() }); }
function viewReview(view) {
  const due = Store.dueReviews();
  if (!due.length) {
    view.append(pageHead('Ripasso', 'Niente da ripassare', 'I problemi sbagliati tornano qui dopo uno, tre e sette giorni, finché non li risolvi tre volte di fila.'), h('div', { class: 'actions' }, btn('Allenamento infinito', () => go('infinito'), 'primary'), btn('Problemi', () => go('problemi'), 'ghost')));
    return;
  }
  runSeries(view, due.slice(0, 10).map(([ref, r]) => ({ ref, unit: r.unit, review: true })), { title: 'Ripasso', again: () => render() });
}

// ---------- Partita ----------
function viewGame(view) {
  const host = h('div', { class: 'game-host' }); view.append(host);
  startGame(host, Store.data.game);
}

// ---------- Sfida ----------
function viewChallenge(view) {
  const d = Store.data, riv = d.rival, ws = weekStart();
  const mine = Store.perleWeek(d.days, ws), theirs = riv ? Store.perleWeek(riv.d, ws) : 0;
  const me = d.name || 'Tu', her = riv ? riv.n : '[Lei]';
  view.append(pageHead(weekLabel(ws), 'La sfida', 'Chi si allena di più in settimana, da lunedì a domenica, sabato al goban riceve pietre di vantaggio.'));
  const noRival = Sync.logged ? 'non è ancora entrata' : Sync.on ? 'entra per vederle' : 'manca il suo codice';
  const score = h('section', { class: 'score card' },
    h('div', { class: 'sc-side' }, h('span', { class: 'dim' }, me), h('span', { class: 'huge c-me' }, String(mine)), h('span', { class: 'dim small' }, `perle · serie ${plural(Store.streak(), 'giorno', 'giorni')}`)),
    h('span', { class: 'sc-mid' }, 'contro'),
    h('div', { class: 'sc-side r' }, h('span', { class: 'dim' }, her), h('span', { class: 'huge c-rival' }, riv ? String(theirs) : '·'), h('span', { class: 'dim small' }, riv ? `perle · serie ${plural(riv.s || 0, 'giorno', 'giorni')}` : noRival)));
  view.append(score);
  if (riv) {
    const gs = goStones(mine, theirs);
    const sat = h('section', { class: 'card accent-border saturday' }, h('p', { class: 'label' }, 'Sabato al goban'));
    if (!gs.n) sat.append(h('p', { class: 'title' }, 'Partita alla pari: nigiri per decidere chi ha il nero.'), h('p', { class: 'dim' }, `Scarto di ${Math.abs(gs.diff)} perle: ne servono ${CONFIG.perlePerPietra} per una pietra di vantaggio.`));
    else {
      const who = gs.who === 'me' ? me : her, other = gs.who === 'me' ? her : me;
      sat.append(h('p', { class: 'title' }, `${who} gioca col nero e ${plural(gs.n, 'pietra', 'pietre')} di vantaggio.`),
        h('p', { class: 'dim' }, `Una pietra ogni ${CONFIG.perlePerPietra} perle di scarto, fino a ${CONFIG.maxPietre}. A ${other} ne ${Math.abs(gs.diff) - CONFIG.perlePerPietra * gs.n + 1 === 1 ? 'basta una' : 'bastano ' + (Math.abs(gs.diff) - CONFIG.perlePerPietra * gs.n + 1)} per toglierne una.`));
    }
    const at = riv.at ? `${shortDate(dayKey(new Date(riv.at)))} alle ${new Date(riv.at).toTimeString().slice(0, 5)}` : '';
    sat.append(h('p', { class: 'dim small' }, riv.online ? `Perle di ${her} aggiornate da sole (ultima volta: ${at}).` : `Perle di ${her} aggiornate il ${at}, dal suo codice.`));
    view.append(sat);
  }
  // come funzionano le perle
  const first = !d.seen.perle; d.seen.perle = true; Store.save(true);
  view.append(h('details', { class: 'card howto', open: first || null },
    h('summary', {}, 'Come funzionano le perle'),
    h('ul', {},
      h('li', {}, h('b', {}, 'Una perla'), ' per ogni problema risolto. ', h('b', {}, 'Due'), ' se lo risolvi al primo colpo, senza suggerimenti. Con la soluzione mostrata non si guadagna niente.'),
      h('li', {}, h('b', {}, `${CONFIG.perleFilo} perle in un giorno`), ' chiudono il filo di oggi. I giorni di fila con il filo chiuso sono la ', h('b', {}, 'serie'), '.'),
      h('li', {}, h('b', {}, 'La sfida'), ' confronta le perle della settimana, da lunedì a domenica. Il sabato, al goban vero, chi ne ha di più gioca col nero e mette ', h('b', {}, `una pietra di vantaggio ogni ${CONFIG.perlePerPietra} perle di scarto`), `, fino a ${CONFIG.maxPietre}.`),
      h('li', {}, 'Le perle di ', h('b', {}, 'tutti e due insieme'), ' sbloccano i 100 motivi del vostro tappeto.'),
      h('li', {}, h('b', {}, 'I sigilli'), ` arrivano con ${CONFIG.sigillo} problemi risolti della stessa tattica.`))));
  if (Sync.on && !Sync.logged) view.append(accountCard());
  // senza account: il codice, spiegato passo per passo
  if (!Sync.logged) {
    const code = Store.makeCode();
    const ta = h('textarea', { class: 'code', readonly: true, rows: 3, 'aria-label': 'Il tuo codice' }, code);
    const paste = h('textarea', { class: 'code', rows: 3, placeholder: 'Incolla qui il codice ricevuto (comincia con CP28-)', 'aria-label': 'Codice ricevuto' });
    const msg = h('p', { class: 'feedback', 'aria-live': 'polite' });
    const share = async () => {
      const text = `Le mie perle di Capodanno 28. Incolla questo codice nella Sfida: ${code}`;
      try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(text); msg.className = 'feedback good'; msg.textContent = 'Copiato: incollalo in un messaggio per lei.'; } catch (e) { ta.select(); msg.textContent = 'Seleziona il codice e copialo.'; }
    };
    view.append(h('details', { class: 'card codes', open: (!riv && !Sync.on) || null },
      h('summary', {}, Sync.on ? 'Senza account: le perle a mano' : 'Come vedere le perle dell\'altro'),
      h('p', { class: 'dim' }, 'Ogni telefono conta le sue perle. Per confrontarle vi mandate un codice: è solo un riassunto delle perle della settimana, delle serie, dei sigilli e delle partite dal vivo. Si può rimandare quando si vuole.'),
      h('ol', { class: 'steps-list' },
        h('li', {}, 'Tocca ', h('b', {}, 'Manda le tue perle'), ': si apre un messaggio con il codice, mandalo a lei.'),
        h('li', {}, 'Lei fa lo stesso dal suo telefono e ti manda il suo.'),
        h('li', {}, 'Copia il suo codice, incollalo nel riquadro a destra e tocca ', h('b', {}, 'Aggiorna la sfida'), '.')),
      h('div', { class: 'two' },
        h('div', {}, h('p', { class: 'label' }, 'Il tuo codice'), ta, h('div', { class: 'actions' }, btn('Manda le tue perle', share, 'primary'))),
        h('div', {}, h('p', { class: 'label' }, `Il codice di ${riv ? riv.n : 'lei'}`), paste, h('div', { class: 'actions' }, btn('Aggiorna la sfida', () => {
          try { const p = Store.importCode(paste.value); msg.className = 'feedback good'; msg.textContent = `Fatto: ${p.n}, ${p.t} perle in tutto.`; setTimeout(render, 900); }
          catch (e) { msg.className = 'feedback bad'; msg.textContent = e.message || 'Codice non valido.'; }
        }, '')))), msg));
  }
  // sigilli
  view.append(h('h2', { class: 'sec-h' }, 'I sigilli'), sealGrid());
  // settimane passate
  if (riv) {
    const rows = [];
    for (let w = 1; w <= 4; w++) { const k = addDays(ws, -7 * w), a = Store.perleWeek(d.days, k), b = Store.perleWeek(riv.d, k); if (a || b) rows.push(h('div', { class: 'ro-row' }, h('span', { class: 'dim' }, weekLabel(k)), h('span', {}, h('b', { class: 'c-me' }, a), ' · ', h('b', { class: 'c-rival' }, b)), h('span', { class: 'dim' }, a === b ? 'pari' : a > b ? me : her))); }
    if (rows.length) view.append(h('h2', { class: 'sec-h' }, 'Settimane passate'), h('div', { class: 'readout card' }, ...rows));
  }
  view.append(h('h2', { class: 'sec-h' }, 'Partite dal vivo'), liveSection(mine, theirs));
  view.append(h('h2', { class: 'sec-h' }, 'Il vostro tappeto'), carpetMini());
}
function sealGrid() {
  const d = Store.data, rivSeals = new Set((d.rival && d.rival.g) || []);
  return h('div', { class: 'seals' }, ...SEALS.map(S => {
    const n = d.seals[S.id] || 0, need = sealNeed(S), got = n >= need;
    return h('div', { class: 'seal-cell' + (got ? ' got' : n ? ' part' : ''), title: got ? 'Ottenuto' : S.how || `${need} problemi di ${S.name.toLowerCase()}` },
      h('span', { class: 'seal' }, S.han), h('span', { class: 'small' }, S.name), h('span', { class: 'dim tiny' }, got ? (rivSeals.has(S.id) ? 'tutti e due' : 'ottenuto') : `${Math.min(n, need)}/${need}` + (rivSeals.has(S.id) ? ' · lei sì' : '')));
  }));
}
function liveSection(mine, theirs) {
  const d = Store.data, me = d.name || 'Io', her = d.rival ? d.rival.n : 'Lei';
  const gs = goStones(mine, theirs);
  const f = {};
  const field = (label, el) => h('label', { class: 'field' }, h('span', {}, label), el);
  f.date = h('input', { type: 'date', value: today() });
  f.nero = h('select', {}, h('option', { value: me }, me), h('option', { value: her, selected: gs.who === 'rival' ? true : null }, her));
  if (gs.who === 'me') f.nero.value = me;
  f.vince = h('select', {}, h('option', { value: 'nero' }, 'Nero'), h('option', { value: 'bianco' }, 'Bianco'));
  f.scarto = h('input', { type: 'text', inputmode: 'decimal', placeholder: 'es. 12,5 o abbandono' });
  f.pietre = h('select', {}, ...[0, 1, 2, 3, 4].map(k => h('option', { value: k, selected: k === gs.n ? true : null }, String(k))));
  f.size = h('select', {}, h('option', { value: 19 }, '19×19'), h('option', { value: 13 }, '13×13'), h('option', { value: 9 }, '9×9'));
  f.note = h('input', { type: 'text', placeholder: 'una riga, se vuoi' });
  const form = h('form', { class: 'card live-form', onsubmit: e => {
    e.preventDefault();
    const nero = f.nero.value, bianco = nero === me ? her : me;
    Store.addLive({ date: f.date.value || today(), nero, bianco, vince: f.vince.value, scarto: f.scarto.value.trim(), pietre: +f.pietre.value, size: +f.size.value, note: f.note.value.trim(), by: me });
    toast('Partita registrata.', 'gold'); render();
  } },
    h('div', { class: 'form-grid' }, field('Data', f.date), field('Col nero', f.nero), field('Vince', f.vince), field('Scarto', f.scarto), field('Pietre di vantaggio', f.pietre), field('Goban', f.size), field('Note', f.note)),
    h('div', { class: 'actions' }, h('button', { class: 'btn primary', type: 'submit' }, 'Registra la partita')));
  const games = Store.allLive();
  const wins = {}; for (const g of games) { const w = g.vince === 'nero' ? g.nero : g.bianco; wins[w] = (wins[w] || 0) + 1; }
  const list = h('div', { class: 'readout card' }, ...games.slice(0, 30).map(g => {
    const w = g.vince === 'nero' ? g.nero : g.bianco;
    return h('div', { class: 'ro-row live' },
      h('span', { class: 'dim' }, shortDate(g.date)),
      h('span', {}, h('b', {}, w), ` vince col ${g.vince}`, g.scarto ? ` (${g.scarto})` : '', h('span', { class: 'dim' }, ` · ${g.size}×${g.size}${g.pietre ? ' · ' + plural(g.pietre, 'pietra', 'pietre') : ''}${g.note ? ' · ' + g.note : ''}`)),
      d.live.some(x => x.id === g.id) ? btn('Togli', () => { if (confirm('Togliere questa partita dal registro?')) { Store.delLive(g.id); render(); } }, 'ghost small') : h('span', {}));
  }));
  return h('div', { class: 'live' },
    games.length ? h('p', { class: 'dim' }, `${plural(games.length, 'partita', 'partite')} sul goban. ` + Object.entries(wins).map(([k, v]) => `${k} ${v}`).join(', ') + '.') : h('p', { class: 'dim' }, 'Ancora nessuna partita registrata. Il primo sabato si comincia.'),
    games.length ? list : null,
    h('details', { class: 'live-add' }, h('summary', { class: 'btn primary' }, 'Registra la partita di stasera'), form));
}

// ---------- Il tappeto ----------
function viewCarpet(view) {
  const tot = Store.perleCoppia(), un = unlockedOrn(), nx = nextOrn();
  view.append(pageHead('Tappeto Nichols', 'Il vostro tappeto', `Le perle di tutti e due sbloccano i motivi: ${un.length} su 100. ` + (nx ? `Prossimo a ${nx.soglia} perle: ${nx.nome.toLowerCase()} (ne mancano ${nx.soglia - tot}).` : 'Il tappeto è completo.')));
  if (nx) view.append(h('p', { class: 'card pace' }, paceText(tot, nx)));
  view.append(h('p', { class: 'dim small' }, 'Ogni motivo sbloccato entra negli ornamenti del sito (ogni schermata ne pesca tre a caso) e nel salvaschermo della modalità ufficio.'));
  if (!Store.data.rival) view.append(h('p', { class: 'dim small' }, Sync.on ? 'Contano anche le perle dell\'altro, quando siete entrati tutti e due con l\'account.' : 'Contano anche le perle dell\'altro telefono, quando incollate il suo codice nella Sfida.'));
  const grid = h('div', { class: 'carpet' });
  for (const o of ORN) {
    const open = o.soglia <= tot, next = nx && o.id === nx.id;
    const tile = h(open ? 'button' : 'div', { class: 'ct ' + (open ? 'open' : 'locked') + (next ? ' next' : ''), type: open ? 'button' : null, title: open ? o.nome : `${o.nome}: a ${o.soglia} perle`, onclick: open ? () => showMotif(o) : null },
      open ? h('img', { src: o.file, alt: o.nome, loading: 'lazy', onerror: function () { this.replaceWith(h('span', { class: 'han' }, o.han)); } }) : h('span', { class: 'han' }, o.han),
      h('span', { class: 'ct-l' }, open ? o.nome : next ? `${o.soglia} perle` : String(o.soglia)));
    grid.append(tile);
  }
  view.append(h('div', { class: 'carpet-frame' }, grid));
}
// quanto manca, al vostro ritmo degli ultimi sette giorni
function paceText(tot, nx) {
  let week = 0; for (let i = 0; i < 7; i++) { const k = addDays(today(), -i); week += Store.perleOn(k) + (Store.data.rival ? (Store.data.rival.d[k] || 0) : 0); }
  const measured = week >= 7, rate = measured ? week / 7 : CONFIG.perleFilo * 2;
  const last = ORN[ORN.length - 1].soglia;
  const days = n => Math.max(1, Math.ceil(n / rate));
  const span = n => { const dd = days(n); return dd <= 1 ? 'domani' : dd < 14 ? `tra ${dd} giorni` : dd < 60 ? `tra circa ${Math.round(dd / 7)} settimane` : `tra circa ${Math.round(dd / 30)} mesi`; };
  return (measured ? `Al vostro ritmo (${Math.round(rate)} perle al giorno in due)` : `Con un filo al giorno a testa (${rate} perle al giorno in due)`) +
    ` il prossimo motivo arriva ${span(nx.soglia - tot)}, il tappeto intero ${span(last - tot)}.`;
}
function showMotif(o) {
  const dlg = h('div', { class: 'menu-sheet', role: 'dialog', 'aria-label': o.nome });
  const close = () => dlg.remove();
  dlg.append(h('div', { class: 'card motif-card' }, h('img', { src: o.file, alt: o.nome }), h('p', { class: 'kicker' }, `${o.han} ${o.famNome}`), h('h2', {}, o.nome), h('p', { class: 'dim' }, o.soglia ? `Sbloccato a ${o.soglia} perle.` : 'Dal primo giorno.'), btn('Chiudi', close, 'primary')));
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  document.body.append(dlg); dlg.querySelector('.btn').focus();
}

// ---------- Lessico ----------
function viewGlossary(view, focusId) {
  view.append(pageHead(`${GLOSSARY.length} termini`, 'Lessico', 'I termini del go in italiano con l\'originale giapponese. Nei testi delle lezioni ogni termine è cliccabile.'));
  const search = h('input', { type: 'search', placeholder: 'Cerca un termine', 'aria-label': 'Cerca un termine', class: 'search' });
  const list = h('div', { class: 'gl-list' }), detail = h('div', { class: 'gl-detail card' });
  const cats = [...new Set(GLOSSARY.map(g => g.cat))];
  let current = focusId && GLOSSARY.some(g => g.id === focusId) ? focusId : 'atari';
  function renderList() {
    list.innerHTML = ''; const q = search.value.trim().toLowerCase();
    for (const c of cats) {
      const items = GLOSSARY.filter(g => g.cat === c && (!q || (g.term + ' ' + g.jp + ' ' + g.def).toLowerCase().includes(q)));
      if (!items.length) continue;
      list.append(h('p', { class: 'gl-cat' }, c));
      for (const g of items) list.append(h('button', { class: 'gl-item' + (g.id === current ? ' on' : ''), type: 'button', onclick: () => { current = g.id; renderList(); renderDetail(); if (isPhone()) detail.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); } }, g.term, g.jp ? h('span', { class: 'gl-jp' }, ' ' + g.jp) : null));
    }
  }
  function renderDetail() {
    const g = GLOSSARY.find(x => x.id === current); detail.innerHTML = '';
    if (!g) return;
    const def = h('p', { class: 'gl-def' }); setText(def, g.def, { seen: new Set([g.id]) });
    detail.append(h('div', { class: 'gl-head' }, h('h2', {}, g.term), g.jp ? h('span', { class: 'tb-jp' }, g.jp) : null), h('p', { class: 'kicker' }, g.cat), def);
    if (g.rows) { const dia = h('div', { class: 'gl-dia goban-frame sm' }); detail.append(dia); miniBoard(dia, g); }
    if (g.unit !== undefined) detail.append(h('div', { class: 'actions' }, btn(`Lezione: ${UNITS[g.unit].title}`, () => go('lezione/' + g.unit), '')));
  }
  search.addEventListener('input', renderList);
  view.append(h('div', { class: 'gl' }, h('div', { class: 'gl-left' }, search, list), detail));
  renderList(); renderDetail();
}

// ---------- Il maestro (senza internet: lezioni, lessico, temi, domande frequenti) ----------
const FAQ = [
  ['Chi comincia la partita?', 'Il nero muove per primo. Tra pari si decide con il nigiri: uno prende una manciata di pietre bianche, l\'altro indovina se sono pari o dispari mettendo sul goban una o due pietre nere. Chi indovina gioca col nero.'],
  ['Come si conta alla fine?', 'Qui contiamo come in Cina: pietre vive più territorio, cioè le intersezioni vuote circondate da un solo colore. Le pietre morte si tolgono e il loro spazio va all\'avversario. Al bianco si aggiunge il komi. Vince chi ha di più.'],
  ['Cos\'è il komi?', 'Sono i punti dati al bianco per compensare il vantaggio del nero, che muove per primo. Di solito 6,5 o 7,5: il mezzo punto evita il pareggio. Con le pietre di vantaggio il komi scende a 0,5.'],
  ['Come funzionano le pietre di vantaggio?', 'Chi riceve il vantaggio gioca col nero e mette le sue pietre sui punti segnati del goban (gli hoshi) prima di cominciare: con due pietre due angoli opposti, con tre o quattro gli altri angoli. Poi muove il bianco. Nella sfida, chi si è allenato di più riceve una pietra ogni 5 perle di scarto, fino a quattro.'],
  ['Quando finisce una partita?', 'Quando entrambi passano uno dopo l\'altro, perché nessuna mossa cambierebbe più il risultato. Si può anche abbandonare. Prima di passare chiudi i confini aperti (yose).'],
  ['Si può passare?', 'Sì, in qualsiasi momento: passare vuol dire rinunciare al turno. Di solito si passa solo alla fine. Nel conteggio cinese passare non costa punti.'],
  ['Cos\'è il ko e perché non si riprende subito?', 'Nel ko due giocatori potrebbero catturarsi a vicenda la stessa pietra all\'infinito. Per evitarlo, dopo una presa in ko l\'avversario deve giocare altrove almeno una volta (una minaccia di ko) prima di riprendere.'],
  ['Come si sistema il goban vero?', 'Ognuno tiene la ciotola delle sue pietre alla sua destra. Si prende una pietra tra indice e medio e la si posa sull\'intersezione. Le pietre catturate si tengono nel coperchio della ciotola: nel conteggio cinese non servono, ma è bello vederle.'],
  ['9×9, 13×13 o 19×19?', 'Il 9×9 è perfetto per imparare: una partita dura un quarto d\'ora. Il 13×13 aggiunge la strategia dell\'apertura. Il 19×19 è il goban vero: partite lunghe, più spazio per i piani. Il vostro goban ha il 19×19 da una parte e (forse) il 13×13 dall\'altra.'],
  ['Cosa vuol dire tenuki?', 'Non rispondere all\'ultima mossa avversaria e giocare altrove, perché c\'è qualcosa di più grande. È la libertà più importante del go: rispondi solo alle minacce vere.'],
  ['Come si diventa più forti?', 'Pochi minuti al giorno di problemi fanno più di una partita lunga ogni tanto: allenano la lettura, cioè vedere le mosse prima di giocarle. Poi giocate tra voi e rivedete le partite. Il resto arriva.'],
  ['Cosa sono kyu e dan?', 'I gradi del go. Si parte da 30 kyu e si scende verso 1 kyu, poi si sale nei dan. Un grado di differenza vale circa una pietra di vantaggio. Il livello che vedi nei Progressi è solo una stima.'],
];
function maestroKnowledge() {
  const kb = [];
  for (const [q, a] of FAQ) kb.push({ kind: 'Domanda', title: q, text: a });
  for (const g of GLOSSARY) kb.push({ kind: 'Lessico', title: g.term + (g.jp ? ' · ' + g.jp : ''), text: g.def, term: g.id, unit: g.unit });
  for (const t in THEMES) kb.push({ kind: 'Tattica', title: THEMES[t].name + (THEMES[t].jp ? ' · ' + THEMES[t].jp : ''), text: THEMES[t].idea, theme: t });
  UNITS.forEach((U, i) => U.lesson.forEach(st => { if (st.text && st.type === 'info') kb.push({ kind: 'Lezione ' + (i + 1), title: st.title, text: st.text, unit: i }); }));
  return kb;
}
const norm = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const STOP = new Set('il lo la i gli le un una uno di da in con su per tra fra e o a al allo alla ai agli alle del dello della dei degli delle che cosa come quando perche non si mi ti ci vi sono è e ha ho piu meno qual quale quali quanto quanti cos chi dove'.split(' '));
function maestroSearch(q) {
  const words = norm(q).split(/[^a-z0-9ō]+/).filter(w => w.length > 2 && !STOP.has(w));
  if (!words.length) return [];
  return maestroKnowledge().map(e => {
    const T = norm(e.title), X = norm(e.text); let sc = 0;
    for (const w of words) { const stem = w.length > 5 ? w.slice(0, -2) : w; if (T.includes(stem)) sc += 3; if (X.includes(stem)) sc += 1; }
    if (e.kind === 'Domanda') sc *= 1.3;
    return [sc, e];
  }).filter(([sc]) => sc > 0).sort((a, b) => b[0] - a[0]).slice(0, 5).map(([, e]) => e);
}
function viewMaestro(view) {
  view.append(pageHead('Il maestro', 'Chiedi al maestro', 'Risponde senza internet: conosce le lezioni, il lessico, le tattiche e le domande di chi comincia. Nei problemi e in partita il pulsante Il maestro spiega la posizione che hai davanti.'));
  const inp = h('input', { type: 'search', class: 'search', placeholder: 'Per esempio: che differenza c\'è tra scala e rete?', 'aria-label': 'Domanda per il maestro' });
  const out = h('div', { class: 'answers', 'aria-live': 'polite' });
  const ask = q => {
    inp.value = q; out.innerHTML = '';
    const res = maestroSearch(q);
    if (!res.length) { out.append(h('div', { class: 'card answer' }, h('p', {}, 'Su questo non ho una risposta pronta. Prova con parole del go: atari, scala, ko, occhi, territorio, komi…'))); return; }
    for (const e of res) {
      const p = h('p', {}); p.append(linkify(e.text));
      out.append(h('article', { class: 'card answer' }, h('p', { class: 'kicker' }, e.kind), h('h3', {}, e.title), p,
        e.unit !== undefined ? h('div', { class: 'actions' }, btn(`Lezione: ${UNITS[e.unit].title}`, () => go('lezione/' + e.unit), 'ghost')) : e.theme ? h('div', { class: 'actions' }, btn('Allenati su questa tattica', () => go('tema/' + encodeURIComponent(e.theme)), 'ghost')) : null));
    }
  };
  const form = h('form', { class: 'ask', onsubmit: e => { e.preventDefault(); if (inp.value.trim()) ask(inp.value.trim()); } }, inp, h('button', { class: 'btn primary', type: 'submit' }, 'Chiedi'));
  view.append(form, h('div', { class: 'chips' }, ...FAQ.slice(0, 8).map(([q]) => h('button', { type: 'button', class: 'chip', onclick: () => ask(q) }, q))), out);
}

// ---------- Progressi ----------
function viewProgress(view) {
  const d = Store.data;
  view.append(pageHead('Progressi', 'I tuoi progressi', null));
  const k14 = []; for (let i = 13; i >= 0; i--) k14.push(addDays(today(), -i));
  const max = Math.max(CONFIG.perleFilo * 1.5, ...k14.map(k => d.days[k] || 0));
  const chart = h('div', { class: 'chart card', role: 'img', 'aria-label': 'Perle degli ultimi 14 giorni' },
    h('div', { class: 'chart-goal', style: { bottom: (CONFIG.perleFilo / max * 100) + '%' } }, h('span', {}, 'filo')),
    ...k14.map(k => { const v = d.days[k] || 0; return h('div', { class: 'bar-col', title: `${shortDate(k)}: ${v} perle` }, h('div', { class: 'bar' + (v >= CONFIG.perleFilo ? ' full' : ''), style: { height: (v / max * 100) + '%' } }), h('span', { class: 'tiny dim' }, keyDate(k).getDate())); }));
  view.append(h('h2', { class: 'sec-h' }, 'Perle degli ultimi 14 giorni'), chart);
  const rows = [
    ['Perle in tutto', `${Store.perleTot()} (oggi ${Store.perleToday()}, questa settimana ${Store.perleWeek(d.days)})`],
    ['Serie', `${plural(Store.streak(), 'giorno', 'giorni')} di fila; la più lunga ${plural(Store.bestStreak(), 'giorno', 'giorni')}`],
    ['Livello stimato', `${kyuOf(d.rating)} kyu (${d.rating} punti: è una stima, non un grado ufficiale)`],
    ['Problemi', `${d.solved} risolti al primo colpo su ${d.attempts}${d.attempts ? ' (' + Math.round(100 * d.solved / d.attempts) + '%)' : ''}`],
    ['Partite col computer', `${d.games.won} vinte su ${d.games.played}`],
    ['Partite dal vivo', String(Store.allLive().length)],
    ['Quiz A o B', d.quiz && d.quiz.n ? `${d.quiz.ok} riconosciute su ${d.quiz.n}` : 'ancora nessuno'],
    ['Ripassi in attesa', String(Store.dueReviews().length)],
  ];
  view.append(h('div', { class: 'readout card' }, ...rows.map(([k, v]) => h('div', { class: 'ro-row' }, h('span', { class: 'dim' }, k), h('span', {}, v)))));
  view.append(h('h2', { class: 'sec-h' }, 'I sigilli'), sealGrid());
  view.append(h('h2', { class: 'sec-h' }, 'Precisione per lezione'));
  const bars = h('div', { class: 'readout card' });
  UNITS.forEach(U => {
    if (!U.problems.length) return;
    const u = Store.unit(U.id), acc = u.tried ? u.ok / u.tried : 0;
    bars.append(h('div', { class: 'ro-row' }, h('span', {}, U.title), h('span', { class: 'meter' }, h('span', { style: { width: Math.round(acc * 100) + '%' } })), h('span', { class: 'dim' }, u.tried ? `${Math.round(acc * 100)}% su ${u.tried}` : 'da iniziare')));
  });
  view.append(bars);
  view.append(h('h2', { class: 'sec-h' }, 'Registro'));
  view.append(d.history.length ? h('div', { class: 'readout card' }, ...d.history.slice(0, 20).map(e => h('div', { class: 'ro-row' }, h('span', { class: e.ok ? 'ok' : 'ko' }, e.ok ? '◆' : '✕'), h('span', {}, e.k === 'g' ? 'Partita: ' + e.label : 'Problema: ' + ((UNITS.find(U => U.id === e.unit) || {}).title || '')), h('span', { class: 'dim' }, shortDate(e.d))))) : h('p', { class: 'dim' }, 'Registro vuoto. Si comincia da Oggi.'));
}

// ---------- Account ----------
function loginForm(onDone) {
  const em = h('input', { type: 'email', autocomplete: 'username', placeholder: 'la tua email', 'aria-label': 'Email', required: true });
  const pw = h('input', { type: 'password', autocomplete: 'current-password', placeholder: 'password', 'aria-label': 'Password', required: true });
  const msg = h('p', { class: 'feedback', 'aria-live': 'polite' });
  const sub = h('button', { class: 'btn primary', type: 'submit' }, 'Entra');
  return h('form', { class: 'login', onsubmit: async e => {
    e.preventDefault(); sub.disabled = true; msg.className = 'feedback info'; msg.textContent = 'Entro…';
    try { await Sync.login(em.value, pw.value); msg.textContent = ''; toast('Sei dentro: i progressi ora sono condivisi.', 'gold'); applyTheme(); (onDone || render)(); }
    catch (err) { msg.className = 'feedback bad'; msg.textContent = err.message; sub.disabled = false; }
  } }, h('div', { class: 'login-row' }, em, pw, sub), msg);
}
function accountCard() {
  if (!Sync.on) return null;
  const box = h('section', { class: 'card account' });
  if (Sync.logged) {
    const t = Sync.lastSync ? new Date(Sync.lastSync).toTimeString().slice(0, 5) : null;
    box.append(h('h2', {}, 'Il tuo account'),
      h('p', {}, `Sei dentro come ${Sync.email}. Resti collegato su questo dispositivo finché non esci.`),
      h('p', { class: 'dim small' }, Sync.status === 'offline' ? 'Sei offline: i progressi restano qui e partono appena torna la rete.' : t ? `Progressi salvati alle ${t}.` : 'Progressi salvati.'),
      h('div', { class: 'actions' }, btn('Aggiorna adesso', async () => { await Sync.pull(true); render(); }, ''), btn('Esci', async () => { if (confirm('Uscire dall\'account su questo dispositivo? I progressi restano salvati.')) { await Sync.logout(); render(); } }, 'ghost')));
  } else {
    box.append(h('h2', {}, 'Entra'), h('p', { class: 'dim' }, 'Con l\'account i progressi passano dal computer al telefono, e le perle di tutti e due arrivano da sole nella sfida. Si entra una volta sola: poi resti dentro.'), loginForm());
  }
  return box;
}

// ---------- Impostazioni ----------
const PALETTES = [['blu', 'Blu di Tientsin'], ['melanzana', 'Melanzana'], ['giada', 'Giada']];
const COLORI = [['oro', 'Oro'], ['rosa', 'Rosa peonia'], ['giada', 'Giada']];
function applyTheme() {
  document.documentElement.dataset.palette = Store.data.palette;
  document.documentElement.dataset.me = Store.data.colore;
  const mine = Store.data.colore, alt = mine === 'rosa' ? 'oro' : 'rosa', rc = Store.data.rival && Store.data.rival.c;
  document.documentElement.dataset.rival = rc && rc !== mine ? rc : alt;
  const m = $('meta[name="theme-color"]'); if (m) m.content = { blu: '#14213D', melanzana: '#3A1E33', giada: '#173F3B' }[Store.data.palette] || '#14213D';
}
function viewSettings(view) {
  const d = Store.data;
  view.append(pageHead('Impostazioni', 'Il tuo tappeto', null));
  const acc = accountCard(); if (acc) view.append(acc);
  const name = h('input', { type: 'text', value: d.name, placeholder: 'Il tuo nome', autocomplete: 'given-name', maxlength: 24 });
  name.addEventListener('change', () => { d.name = name.value.trim(); Store.save(); toast('Nome salvato.'); });
  const pal = h('div', { class: 'swatches', role: 'radiogroup', 'aria-label': 'Palette' }, ...PALETTES.map(([id, label]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(d.palette === id), class: 'swatch sw-' + id + (d.palette === id ? ' on' : ''), onclick: () => { d.palette = id; Store.save(); applyTheme(); render(); } }, h('span', { class: 'sw-chip' }, h('i'), h('i'), h('i')), label)));
  const col = h('div', { class: 'seg-row' }, ...COLORI.map(([id, label]) => h('label', { class: 'seg-opt' }, h('input', { type: 'radio', name: 'colore', checked: d.colore === id, onchange: () => { d.colore = id; Store.save(); applyTheme(); } }), h('span', { class: 'dot c-' + id }), h('span', {}, label))));
  view.append(h('section', { class: 'card form' },
    h('label', { class: 'field' }, h('span', {}, 'Come ti chiami'), name),
    h('div', { class: 'field' }, h('span', {}, 'Palette'), pal),
    h('div', { class: 'field' }, h('span', {}, 'Il tuo colore nella sfida'), col)));
  // installazione
  view.append(h('section', { class: 'card' }, h('h2', {}, 'Sul telefono come un\'app'),
    h('p', {}, 'Su iPhone: apri il sito in Safari, tocca Condividi (il quadrato con la freccia) e poi Aggiungi alla schermata Home. Si apre a tutto schermo e funziona anche senza internet.'),
    h('p', { class: 'dim small' }, 'Attenzione: su iPhone l\'app sulla Home e Safari tengono progressi separati. Usa sempre l\'icona sulla Home.')));
  // backup
  const msg = h('p', { class: 'feedback', 'aria-live': 'polite' });
  const exp = () => {
    const blob = new Blob([JSON.stringify(Store.data, null, 1)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `capodanno28-${(d.name || 'progressi').toLowerCase()}-${today()}.json` }); document.body.append(a); a.click(); a.remove();
  };
  const file = h('input', { type: 'file', accept: 'application/json,.json', class: 'sr-only', id: 'impFile', onchange: async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const data = JSON.parse(await f.text()); if (!data || !data.days) throw new Error(); if (!confirm('Sostituire i progressi di questo dispositivo con quelli del file?')) return; Store.data = Object.assign(DEFAULT_DATA(), data); Store.save(); applyTheme(); msg.className = 'feedback good'; msg.textContent = 'Progressi caricati.'; }
    catch (err) { msg.className = 'feedback bad'; msg.textContent = 'Il file non sembra un salvataggio di Capodanno 28.'; }
  } });
  view.append(h('section', { class: 'card' }, h('h2', {}, 'Copia di sicurezza'),
    h('p', { class: 'dim' }, 'I progressi stanno solo su questo dispositivo. Per passarli dal computer al telefono (o viceversa) scarica il file e caricalo dall\'altra parte.'),
    h('div', { class: 'actions' }, btn('Scarica i progressi', exp, ''), h('label', { class: 'btn', for: 'impFile' }, 'Carica da file'), file), msg));
  view.append(h('section', { class: 'card' }, h('h2', {}, 'Altro'),
    h('div', { class: 'actions' },
      btn('Schermata di benvenuto', () => go('benvenuto'), ''),
      btn('Modalità ufficio', () => Office.show(), ''),
      btn('Rifai l\'esercizio di oggi', () => { Store.data.daily = null; Store.save(); go('oggi'); }, 'ghost'),
      btn('Azzera tutto', () => { if (confirm('Cancellare tutti i progressi di questo dispositivo? Non si torna indietro.')) { localStorage.removeItem(STORE_KEY); Store.data = DEFAULT_DATA(); Store.save(); applyTheme(); go('benvenuto'); } }, 'ghost danger'))));
}

// ---------- Benvenuto (dal QR nella scatola) ----------
function viewWelcome(view) {
  const W = CONFIG.benvenuto, d = Store.data;
  const name = h('input', { type: 'text', value: d.name, placeholder: 'Il tuo nome', autocomplete: 'given-name', maxlength: 24, 'aria-label': 'Il tuo nome' });
  let pal = d.palette;
  const pals = h('div', { class: 'swatches' }, ...PALETTES.map(([id, label]) => h('button', { type: 'button', class: 'swatch sw-' + id + (pal === id ? ' on' : ''), 'aria-pressed': String(pal === id), onclick: e => { pal = id; d.palette = id; applyTheme(); $$('.swatch', pals).forEach(b => { b.classList.toggle('on', b === e.currentTarget); b.setAttribute('aria-pressed', String(b === e.currentTarget)); }); } }, h('span', { class: 'sw-chip' }, h('i'), h('i'), h('i')), label)));
  const start = () => {
    d.name = name.value.trim(); d.palette = pal; d.seen.welcome = true;
    if (!d.seen.colore) { d.colore = d.name && !d.rival ? 'rosa' : d.colore; d.seen.colore = true; }
    Store.save(); applyTheme(); go('oggi');
  };
  const msg = h('p', { class: 'w-msg' }); setText(msg, W.messaggio, { plain: true });
  view.append(h('div', { class: 'welcome' },
    h('img', { class: 'w-drago', src: 'img/orn/drago-1.svg', alt: '' }),
    h('img', { class: 'w-peonie', src: 'img/orn/peonia-1.svg', alt: '' }),
    h('div', { class: 'w-card' },
      h('span', { class: 'seal-big', 'aria-hidden': 'true' }, '圍', h('br'), '棋'),
      h('p', { class: 'kicker' }, 'Capodanno 28'),
      h('h1', {}, W.titolo), msg, h('p', { class: 'w-firma' }, W.firma),
      h('div', { class: 'w-setup' },
        h('p', { class: 'dim' }, 'Nella scatola c\'è un goban vero. Qui c\'è dove imparare a usarlo: cinque, dieci minuti al giorno.'),
        h('label', { class: 'field' }, h('span', {}, 'Come ti chiami'), name),
        h('div', { class: 'field' }, h('span', {}, 'Scegli il tuo tappeto'), pals),
        Sync.on && !Sync.logged ? h('div', { class: 'field' }, h('span', {}, 'Entra con il tuo account (email e password che ti ha dato [nome])'), loginForm(start)) : null,
        h('div', { class: 'actions' }, btn(Sync.on && !Sync.logged ? 'Comincia senza account' : 'Cominciamo', start, Sync.on && !Sync.logged ? 'ghost' : 'primary big'))))));
}

// ---------- Modalità ufficio: il tappeto come salvaschermo ----------
const Office = {
  on: false, el: null, timers: [], prevTitle: null,
  build() {
    const pool = shuffle(unlockedOrn().slice());
    const pick = i => pool[i % pool.length];
    const img = (o, cls) => h('img', { class: cls, src: o.file, alt: '', onerror: function () { this.remove(); } });
    const center = ORN.find(o => o.id === 'drago-6' && o.soglia <= Store.perleCoppia()) || ORN.find(o => o.id === 'peonia-2' && o.soglia <= Store.perleCoppia()) || pick(0);
    const field = h('div', { class: 'rug-field' },
      h('div', { class: 'medallion' }, img(center, 'med-img')),
      img(pick(1), 'rc rc-tl'), img(pick(2), 'rc rc-tr'), img(pick(3), 'rc rc-bl'), img(pick(4), 'rc rc-br'));
    this.field = field; this.pool = pool; this.k = 5;
    this.clock = h('div', { class: 'saver-clock', 'aria-hidden': 'true' });
    this.el = h('div', { class: 'saver', role: 'dialog', 'aria-label': 'Salvaschermo. Tocca o premi Esc per tornare.', onclick: () => this.hide() },
      h('div', { class: 'fringe' }),
      h('div', { class: 'rug' }, h('div', { class: 'rug-border' }, field)),
      h('div', { class: 'fringe' }), this.clock);
    document.body.append(this.el);
  },
  // un motivo nuovo ogni pochi secondi, in un punto a caso del campo; i più vecchi svaniscono
  drift() {
    if (!this.on || !this.pool.length) return;
    const o = this.pool[this.k++ % this.pool.length];
    let x, y; do { x = 6 + Math.random() * 70; y = 6 + Math.random() * 66; } while (Math.hypot(x + 8 - 50, y + 8 - 50) < 34);   // fuori dal medaglione
    const el = h('img', { class: 'drift', src: o.file, alt: '', style: { left: x + '%', top: y + '%', width: (12 + Math.random() * 8) + '%', transform: Math.random() < .5 ? 'scaleX(-1)' : 'none' } });
    this.field.append(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
    const all = this.field.querySelectorAll('.drift');
    if (all.length > 3) { const old = all[0]; old.classList.remove('in'); setTimeout(() => old.remove(), 2500); }
  },
  tick() { const d = new Date(); this.clock.textContent = d.toTimeString().slice(0, 5); },
  show() {
    closeTerm(); $$('.menu-sheet').forEach(x => x.remove());
    if (this.el) this.el.remove();
    this.on = true; this.build(); document.body.classList.add('office');
    this.tick(); this.drift();
    this.timers = [setInterval(() => this.tick(), 20000)];
    if (!reduceMotion) this.timers.push(setInterval(() => this.drift(), 6000));
  },
  hide() {
    if (!this.el) return;
    this.on = false; this.timers.forEach(clearInterval); this.timers = [];
    this.el.remove(); this.el = null; document.body.classList.remove('office');
  },
  toggle() { this.on ? this.hide() : this.show(); },
};

// ---------- Avvio ----------
function boot() {
  Store.init(); Sync.load(); applyTheme(); buildChrome();
  // con l'account: si scaricano i progressi all'avvio e ogni volta che l'app torna in primo piano
  if (Sync.on && Sync.logged) {
    Sync.pull().then(() => { const id = (location.hash.slice(1) || 'oggi').split('/')[0]; if (!['oggi', 'partita', 'lezione', 'esercizi', 'catalogo', 'tema', 'infinito', 'ripasso', 'caso'].includes(id)) render(); else refreshChrome(); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') Sync.pull(); });
  }
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if ($('#termbox') && !Office.on) { closeTerm(); return; }
    const sh = $('.menu-sheet'); if (sh && !Office.on) { sh.remove(); return; }
    e.preventDefault(); Office.toggle();
  });
  window.addEventListener('hashchange', render);
  if (!Store.data.seen.welcome && !location.hash) location.hash = 'benvenuto';
  render();
  // in locale il service worker si attiva solo con ?sw (altrimenti ogni modifica arriva in ritardo)
  // e non quando il sito è mostrato dentro un'altra pagina (anteprime)
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  let framed = true; try { framed = window.self !== window.top; } catch (e) { }
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !framed && (!local || location.search.includes('sw'))) {
    const hadController = !!navigator.serviceWorker.controller;
    // quando arriva una versione nuova del sito, la pagina si ricarica da sola una volta
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(r => r.update()).catch(() => { });
  }
}
boot();
