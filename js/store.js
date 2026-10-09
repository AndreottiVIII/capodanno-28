// ===== Progressi, perle, filo, sigilli, partite dal vivo =====
// Tutto in localStorage. La sfida con l'altro telefono usa un codice scambiato a mano.
const STORE_KEY = 'capodanno28';
const DEFAULT_DATA = () => ({
  v: 2, created: today(),
  name: '', colore: 'oro', palette: 'blu',
  rating: 0, solved: 0, attempts: 0,
  units: {}, review: {}, history: [], skipLock: {}, pb: {}, quiz: null,
  games: { played: 0, won: 0, goWon: 0 },
  days: {},        // giorno -> perle
  seals: {},       // sigillo -> problemi risolti
  daily: null,     // esercizio di oggi
  live: [],        // partite sul goban vero
  liveDeleted: [],
  rival: null,     // perle dell'altro telefono, dal codice
  game: { size: 9, komi: 6.5, level: 0, color: 1, handicap: 0, quiz: 'off', coach: true, atari: true },
  seen: {},
});

const SEALS = [
  { id: 'cattura', han: '吃', name: 'Cattura' },
  { id: 'salvare', han: '救', name: 'Salvare' },
  { id: 'scala', han: '征', name: 'Scala' },
  { id: 'rete', han: '網', name: 'Rete' },
  { id: 'doppio', han: '雙', name: 'Doppio atari' },
  { id: 'ko', han: '劫', name: 'Ko' },
  { id: 'collegare', han: '連', name: 'Collegare' },
  { id: 'occhi', han: '眼', name: 'Occhi' },
  { id: 'uccidere', han: '殺', name: 'Uccidere' },
  { id: 'vivere', han: '活', name: 'Vivere' },
  { id: 'sacrificio', han: '棄', name: 'Sacrificio' },
  { id: 'lettura', han: '讀', name: 'Lettura' },
  { id: 'territorio', han: '地', name: 'Territorio', need: 3, how: 'vinci tre partite di go contro il computer' },
];
const SEAL_BY_THEME = { cattura: 'cattura', salvare: 'salvare', scala: 'scala', rete: 'rete', 'doppio atari': 'doppio', sacrificio: 'sacrificio', lettura: 'lettura', uccidere: 'uccidere', vivere: 'vivere' };
function sealOf(P, unitId) {
  if (unitId === 'regole') return 'ko';
  if (unitId === 'collegare') return 'collegare';
  if (unitId === 'occhi') return 'occhi';
  const th = themeOf(P);
  return SEAL_BY_THEME[th] || null;
}
const sealNeed = S => S.need || CONFIG.sigillo;

const Store = {
  data: DEFAULT_DATA(),
  init() {
    try { const raw = localStorage.getItem(STORE_KEY); if (raw) this.data = Object.assign(DEFAULT_DATA(), JSON.parse(raw)); } catch (e) { }
    this.data.game = Object.assign(DEFAULT_DATA().game, this.data.game || {});
  },
  save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (e) { } },
  unit(id) { if (!this.data.units[id]) this.data.units[id] = { lesson: false, ok: 0, tried: 0 }; return this.data.units[id]; },

  // --- perle ---
  perleOn(k, days) { return (days || this.data.days)[k] || 0; },
  perleToday() { return this.perleOn(today()); },
  perleWeek(days, ws) { ws = ws || weekStart(); let t = 0; for (let i = 0; i < 7; i++) t += (days || {})[addDays(ws, i)] || 0; return t; },
  perleTot(days) { let t = 0; for (const k in (days || this.data.days)) t += (days || this.data.days)[k]; return t; },
  streak(days) {
    days = days || this.data.days; const goal = CONFIG.perleFilo;
    let k = today(); if ((days[k] || 0) < goal) k = addDays(k, -1);
    let n = 0; while ((days[k] || 0) >= goal) { n++; k = addDays(k, -1); }
    return n;
  },
  bestStreak(days) {
    days = days || this.data.days; const goal = CONFIG.perleFilo;
    const ks = Object.keys(days).filter(k => days[k] >= goal).sort(); let best = 0, run = 0, prev = null;
    for (const k of ks) { run = prev && addDays(prev, 1) === k ? run + 1 : 1; best = Math.max(best, run); prev = k; }
    return best;
  },
  // perle "del vostro tappeto": le mie più quelle dell'altro telefono
  perleCoppia() { return this.perleTot() + (this.data.rival ? this.data.rival.t || 0 : 0); },

  addPerle(n, sealId) {
    const d = this.data, k = today();
    const before = { day: this.perleOn(k), coppia: this.perleCoppia(), seal: sealId ? d.seals[sealId] || 0 : 0 };
    d.days[k] = (d.days[k] || 0) + n;
    if (sealId) d.seals[sealId] = (d.seals[sealId] || 0) + 1;
    this.save();
    Rewards.after(before, n, sealId);
  },

  // --- problemi (logica del dojo originale) ---
  recordProblem(P, ok, unitId) {
    const d = this.data;
    const pr = P.rating || 100, ur = d.rating;
    const exp = 1 / (1 + Math.pow(10, (pr - ur) / 400));
    const K = d.attempts < 30 ? 48 : 28;
    const delta = Math.round(K * ((ok ? 1 : 0) - exp));
    d.rating = Math.max(0, ur + delta);
    d.attempts++; if (ok) d.solved++;
    if (P.ref) { const e = d.pb[P.ref] || (d.pb[P.ref] = {}); if (e.ok === undefined) e.ok = ok; }
    const u = this.unit(unitId || P.unit); u.tried++; if (ok) u.ok++;
    const r = d.review[P.ref];
    if (!ok && P.ref) d.review[P.ref] = { box: 0, due: today(), unit: unitId || P.unit };
    else if (r) { r.box++; if (r.box >= 3) delete d.review[P.ref]; else r.due = addDays(today(), [1, 3, 7][r.box]); }
    d.history.unshift({ d: today(), k: 'p', ref: P.ref, ok, dr: delta, unit: unitId || P.unit });
    d.history = d.history.slice(0, 200);
    this.save();
    return delta;
  },
  markSolved(ref) { if (!ref) return; const e = this.data.pb[ref] || (this.data.pb[ref] = {}); if (!e.s) { e.s = true; this.save(); } },
  recordGame(win, aiRating, label, isGo) {
    const d = this.data, ur = d.rating;
    const exp = 1 / (1 + Math.pow(10, (aiRating - ur) / 400));
    const delta = Math.round(24 * ((win ? 1 : 0) - exp));
    d.rating = Math.max(0, ur + delta);
    d.games.played++; if (win) d.games.won++;
    if (win && isGo) {
      d.games.goWon = (d.games.goWon || 0) + 1;
      const before = d.seals.territorio || 0; d.seals.territorio = before + 1;
      Rewards.sealCheck('territorio', before);
    }
    d.history.unshift({ d: today(), k: 'g', label, ok: win, dr: delta });
    d.history = d.history.slice(0, 200);
    this.save();
    return delta;
  },
  dueReviews() { return Object.entries(this.data.review).filter(([, r]) => r.due <= today()); },

  // --- partite dal vivo ---
  allLive() {
    const own = this.data.live || [], riv = (this.data.rival && this.data.rival.l) || [];
    const del = new Set([...(this.data.liveDeleted || []), ...((this.data.rival && this.data.rival.x) || [])]);
    const map = new Map();
    for (const g of [...riv, ...own]) if (!del.has(g.id)) map.set(g.id, g);
    return [...map.values()].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  },
  addLive(g) { g.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6); this.data.live.unshift(g); this.save(); },
  delLive(id) { this.data.live = this.data.live.filter(g => g.id !== id); this.data.liveDeleted.push(id); this.save(); },

  // --- codice per l'altro telefono ---
  makeCode() {
    const d = this.data, days = {};
    for (let i = 0; i < 21; i++) { const k = addDays(today(), -i); if (d.days[k]) days[k] = d.days[k]; }
    const payload = { n: d.name || 'Senza nome', c: d.colore, d: days, t: this.perleTot(), s: this.streak(), b: this.bestStreak(), g: Object.keys(d.seals).filter(id => d.seals[id] >= sealNeed(SEALS.find(S => S.id === id) || {})), l: d.live.slice(0, 30), x: d.liveDeleted.slice(-60), at: Date.now() };
    const json = JSON.stringify(payload);
    return 'CP28-' + btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  readCode(text) {
    const m = /CP28-([A-Za-z0-9_-]+)/.exec(text || '');
    if (!m) throw new Error('Non trovo un codice: deve cominciare con CP28-.');
    let b = m[1].replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '=';
    const p = JSON.parse(decodeURIComponent(escape(atob(b))));
    if (!p || typeof p.t !== 'number') throw new Error('Il codice è incompleto.');
    return p;
  },
  importCode(text) {
    const p = this.readCode(text);
    const before = this.perleCoppia();
    const old = this.data.rival;
    // i giorni vecchi restano: il codice porta solo le ultime tre settimane
    const days = Object.assign({}, old && old.n === p.n ? old.d : {}, p.d);
    this.data.rival = Object.assign({}, p, { d: days });
    this.save();
    Rewards.motifCheck(before);
    return p;
  },
};

// ===== Premi: perle, filo, sigilli, motivi del tappeto =====
const Rewards = {
  after(before, n, sealId) {
    const goal = CONFIG.perleFilo, day = Store.perleToday();
    toast(h('span', { class: 'toast-perle' }, h('span', { class: 'pearl sm' }), `+${n} ${n === 1 ? 'perla' : 'perle'}`));
    if (before.day < goal && day >= goal) setTimeout(() => toast(`Filo di oggi chiuso. Serie: ${plural(Store.streak(), 'giorno', 'giorni')}.`, 'gold'), 600);
    if (sealId) this.sealCheck(sealId, before.seal);
    this.motifCheck(before.coppia);
    if (typeof refreshChrome === 'function') refreshChrome();
  },
  sealCheck(sealId, before) {
    const S = SEALS.find(x => x.id === sealId); if (!S) return;
    const now = Store.data.seals[sealId] || 0;
    if (before < sealNeed(S) && now >= sealNeed(S)) setTimeout(() => toast(h('span', { class: 'toast-seal' }, h('span', { class: 'seal-mini' }, S.han), `Sigillo ottenuto: ${S.name}`), 'red'), 1200);
  },
  motifCheck(beforeCoppia) {
    const now = Store.perleCoppia();
    const fresh = ORN.filter(o => o.soglia > beforeCoppia && o.soglia <= now);
    if (fresh.length) setTimeout(() => toast(fresh.length === 1 ? `Nuovo motivo per il tappeto: ${fresh[0].nome}` : `${fresh.length} nuovi motivi per il tappeto`, 'gold'), 1800);
  },
};

// Pietre al goban: chi ha più perle nella settimana riceve pietre di vantaggio
function goStones(mine, theirs) {
  const diff = mine - theirs, n = Math.min(CONFIG.maxPietre, Math.floor(Math.abs(diff) / CONFIG.perlePerPietra));
  return { diff, n, who: n === 0 ? null : diff > 0 ? 'me' : 'rival' };
}
function kyuOf(r) { return Math.max(1, 30 - Math.floor(r / 60)); }
