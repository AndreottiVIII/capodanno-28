// ===== Progressi condivisi online (repository GitHub privato) =====
// Come la classifica del quiz: la chiave GitHub, limitata al solo repository dei progressi, sta in
// js/chiave.js cifrata con una password (PBKDF2-SHA256 → AES-256-GCM). La prima volta si scrive la
// password e si sceglie chi si è; poi si resta dentro su quel dispositivo.
// Ogni giocatore ha il suo file: progressi/<nome>.json. Senza js/chiave.js il sito funziona in locale.
const SESSION_KEY = 'capodanno28-online';
const GH = 'https://api.github.com';
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const toB64 = str => btoa(unescape(encodeURIComponent(str)));
const fromB64 = s => decodeURIComponent(escape(atob(s.replace(/\s/g, ''))));
const slugOf = name => (name || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'giocatore';

const Sync = {
  session: null, status: 'off', lastSync: null, timer: null, busy: null, others: [], sha: null, pending: null,
  get on() { return typeof CHIAVE_ONLINE !== 'undefined' && !!(CHIAVE_ONLINE && CHIAVE_ONLINE.ct); },
  get logged() { return !!(this.session && this.session.token && this.session.slug); },
  get who() { return this.session ? this.session.name : ''; },
  load() { try { this.session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { this.session = null; } },
  keep(s) { this.session = s; try { if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s)); else localStorage.removeItem(SESSION_KEY); } catch (e) { } },
  async api(method, path, body) {
    const r = await fetch(`${GH}/repos/${CHIAVE_ONLINE.repo}/contents/${path}`, {
      method, cache: 'no-store',
      headers: { Authorization: 'Bearer ' + (this.session || this.pending).token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 404) return null;
    if (!r.ok) { const e = new Error('github ' + r.status); e.status = r.status; throw e; }
    return r.json();
  },
  // 1) la password apre la chiave; restituisce i giocatori già presenti
  async unlock(password) {
    if (!this.on) throw new Error('La chiave online non è ancora stata preparata.');
    let token;
    const k = CHIAVE_ONLINE, enc = new TextEncoder();
    try {
      const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
      const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(k.salt), iterations: k.giri, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
      token = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(k.iv) }, key, b64(k.ct)));
    } catch (e) { throw new Error('Password sbagliata.'); }
    this.pending = { token };
    let list;
    try { list = await this.api('GET', 'progressi'); }
    catch (e) { this.pending = null; throw new Error(e.status === 401 || e.status === 403 ? 'La chiave non funziona più: forse è scaduta, va rifatta.' : 'Non riesco a raggiungere GitHub. Sei online?'); }
    const players = [];
    for (const f of list || []) if (f.name.endsWith('.json')) {
      const j = await this.api('GET', f.path).catch(() => null);
      let nome = f.name.replace(/\.json$/, '');
      try { nome = JSON.parse(fromB64(j.content)).name || nome; } catch (e) { }
      players.push({ slug: f.name.replace(/\.json$/, ''), name: nome });
    }
    return players;
  },
  // 2) si sceglie chi si è (un giocatore esistente o uno nuovo)
  async choose(name) {
    if (!this.pending) throw new Error('Prima la password.');
    this.keep({ token: this.pending.token, slug: slugOf(name), name: name.trim() });
    this.pending = null; this.sha = null;
    if (!Store.data.name) { Store.data.name = name.trim(); Store.save(true); }
    await this.pull(true);
  },
  async logout() { this.keep(null); this.others = []; this.status = 'off'; this.sha = null; },
  // scarica tutti i file, unisce i miei progressi con quelli dell'altro dispositivo, rimanda su i miei
  async pull() {
    if (!this.on || !this.logged) return;
    if (this.busy) return this.busy;
    this.busy = (async () => {
      try {
        const list = (await this.api('GET', 'progressi')) || [];
        const others = [];
        for (const f of list) {
          if (!f.name.endsWith('.json')) continue;
          const j = await this.api('GET', f.path); if (!j) continue;
          let dati; try { dati = JSON.parse(fromB64(j.content)); } catch (e) { continue; }
          if (f.name === this.session.slug + '.json') { this.sha = j.sha; if (dati && dati.v) Store.data = mergeData(Store.data, dati); }
          else others.push({ nome: dati.name, colore: dati.colore, dati, aggiornato: dati.updated ? new Date(dati.updated).toISOString() : null });
        }
        this.others = others;
        if (others.length) Store.data.rival = rivalFrom(others[0]);
        Store.save(true);
        await this.push();
        this.status = 'ok'; this.lastSync = Date.now();
      } catch (e) { this.status = e.status === 401 || e.status === 403 ? 'chiave' : 'offline'; }
      finally { this.busy = null; if (typeof refreshChrome === 'function') refreshChrome(); }
    })();
    return this.busy;
  },
  async push(retry) {
    if (!this.on || !this.logged) return;
    const path = `progressi/${this.session.slug}.json`;
    const body = { message: `Progressi di ${this.session.name}`, content: toB64(JSON.stringify(Object.assign({}, Store.data, { rival: null }))) };
    if (this.sha) body.sha = this.sha;
    try {
      const r = await this.api('PUT', path, body);
      this.sha = r && r.content ? r.content.sha : null; this.lastSync = Date.now(); this.status = 'ok';
    } catch (e) {
      // il file è cambiato da un altro dispositivo: si riscarica, si unisce e si riprova una volta
      if ((e.status === 409 || e.status === 422) && !retry) {
        const j = await this.api('GET', path);
        if (j) { this.sha = j.sha; try { Store.data = mergeData(Store.data, JSON.parse(fromB64(j.content))); Store.save(true); } catch (x) { } }
        return this.push(true);
      }
      throw e;
    }
  },
  schedule() {
    if (!this.on || !this.logged) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { if (!this.busy) this.push().catch(e => { this.status = e.status === 401 || e.status === 403 ? 'chiave' : 'offline'; }); }, 4000);
  },
};

// Unisce due copie dei progressi dello stesso account (computer e telefono): non si perde niente
function mergeData(a, b) {
  if (!b || !b.v) return a;
  const newer = (b.updated || 0) > (a.updated || 0) ? b : a, older = newer === a ? b : a;
  const out = Object.assign(DEFAULT_DATA(), older, newer);
  const maxMap = (x, y) => { const o = Object.assign({}, x || {}); for (const k in y || {}) o[k] = Math.max(o[k] || 0, y[k] || 0); return o; };
  // perle: per ogni dispositivo il massimo, poi la somma dei dispositivi giorno per giorno
  out.dev = {};
  for (const id of new Set([...Object.keys(a.dev || {}), ...Object.keys(b.dev || {})])) out.dev[id] = maxMap((a.dev || {})[id], (b.dev || {})[id]);
  out.days = maxMap(a.days, b.days);
  const sums = {}; for (const id in out.dev) for (const k in out.dev[id]) sums[k] = (sums[k] || 0) + out.dev[id][k];
  for (const k in sums) out.days[k] = Math.max(out.days[k] || 0, sums[k]);
  out.seals = maxMap(a.seals, b.seals);
  out.games = maxMap(a.games, b.games);
  out.solved = Math.max(a.solved || 0, b.solved || 0); out.attempts = Math.max(a.attempts || 0, b.attempts || 0);
  out.pb = Object.assign({}, b.pb || {});
  for (const k in a.pb || {}) { const x = a.pb[k], y = out.pb[k] || {}; out.pb[k] = { ok: y.ok !== undefined ? (x.ok !== undefined ? x.ok && y.ok : y.ok) : x.ok, s: !!(x.s || y.s) }; }
  out.units = {};
  for (const k of new Set([...Object.keys(a.units || {}), ...Object.keys(b.units || {})])) { const x = (a.units || {})[k] || {}, y = (b.units || {})[k] || {}; out.units[k] = { lesson: !!(x.lesson || y.lesson), ok: Math.max(x.ok || 0, y.ok || 0), tried: Math.max(x.tried || 0, y.tried || 0) }; }
  out.review = Object.assign({}, older.review || {}, newer.review || {});
  const seenH = new Set(); out.history = [...(a.history || []), ...(b.history || [])].filter(e => { const k = JSON.stringify(e); if (seenH.has(k)) return false; seenH.add(k); return true; }).sort((x, y) => (y.t || 0) - (x.t || 0) || y.d.localeCompare(x.d)).slice(0, 200);
  const del = new Set([...(a.liveDeleted || []), ...(b.liveDeleted || [])]);
  const lm = new Map(); for (const g of [...(b.live || []), ...(a.live || [])]) if (!del.has(g.id)) lm.set(g.id, g);
  out.live = [...lm.values()].sort((x, y) => y.date.localeCompare(x.date)); out.liveDeleted = [...del];
  out.quiz = (a.quiz && b.quiz) ? (a.quiz.n >= b.quiz.n ? a.quiz : b.quiz) : (a.quiz || b.quiz || null);
  out.skipLock = Object.assign({}, b.skipLock || {}, a.skipLock || {});
  out.seen = Object.assign({}, b.seen || {}, a.seen || {});
  out.daily = a.daily && (!b.daily || a.daily.date >= b.daily.date) ? a.daily : b.daily;
  out.rival = a.rival || null;
  out.updated = Math.max(a.updated || 0, b.updated || 0);
  return out;
}
// L'altro giocatore, nella stessa forma del codice da scambiare a mano
function rivalFrom(row) {
  const d = row.dati || {}, days = d.days || {};
  const tot = Object.values(days).reduce((s, v) => s + v, 0);
  return { n: row.nome || d.name || 'Lei', c: row.colore || d.colore, d: days, t: tot, s: Store.streak(days), b: Store.bestStreak(days),
    g: Object.keys(d.seals || {}).filter(id => d.seals[id] >= sealNeed(SEALS.find(S => S.id === id) || {})), l: d.live || [], x: d.liveDeleted || [], at: Date.parse(row.aggiornato) || Date.now(), online: true };
}
