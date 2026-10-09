// ===== Account e progressi condivisi (Supabase) =====
// Email e password; la sessione resta salvata sul dispositivo e si rinnova da sola.
// Senza configurazione (CONFIG.supabase vuoto) il sito funziona in locale.
const SESSION_KEY = 'capodanno28-sessione';
const Sync = {
  session: null, status: 'off', lastSync: null, timer: null, busy: null, others: [],
  get on() { return !!(CONFIG.supabase.url && CONFIG.supabase.key); },
  get logged() { return !!(this.session && this.session.user); },
  get email() { return this.session && this.session.user ? this.session.user.email : ''; },
  headers(auth) {
    const h = { apikey: CONFIG.supabase.key, 'Content-Type': 'application/json' };
    if (auth && this.session) h.Authorization = 'Bearer ' + this.session.access_token;
    return h;
  },
  load() { try { this.session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { this.session = null; } },
  keep(s) {
    this.session = s ? { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at || Math.floor(Date.now() / 1000) + (s.expires_in || 3600), user: { id: s.user.id, email: s.user.email } } : null;
    try { if (this.session) localStorage.setItem(SESSION_KEY, JSON.stringify(this.session)); else localStorage.removeItem(SESSION_KEY); } catch (e) { }
  },
  async auth(path, body) {
    const r = await fetch(CONFIG.supabase.url + '/auth/v1/' + path, { method: 'POST', headers: this.headers(false), body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.error_description || j.msg || j.message || 'Accesso non riuscito'); e.status = r.status; throw e; }
    return j;
  },
  async login(email, password) {
    try { this.keep(await this.auth('token?grant_type=password', { email: email.trim(), password })); }
    catch (e) { throw new Error(e.status === 400 ? 'Email o password non corrette.' : 'Non riesco a raggiungere il server. Sei online?'); }
    await this.pull(true);
  },
  async logout() {
    try { if (this.session) await fetch(CONFIG.supabase.url + '/auth/v1/logout', { method: 'POST', headers: this.headers(true) }); } catch (e) { }
    this.keep(null); this.others = []; this.status = 'off';
  },
  async fresh() {
    if (!this.session) return false;
    if (this.session.expires_at - 60 > Date.now() / 1000) return true;
    try { this.keep(await this.auth('token?grant_type=refresh_token', { refresh_token: this.session.refresh_token })); return true; }
    catch (e) { if (e.status === 400 || e.status === 401) this.keep(null); return false; }   // sessione scaduta davvero: si rientra
  },
  async rest(method, query, body, prefer) {
    const h = this.headers(true); if (prefer) h.Prefer = prefer;
    const r = await fetch(CONFIG.supabase.url + '/rest/v1/' + query, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
    if (!r.ok) throw new Error('rest ' + r.status);
    return r.status === 204 || method !== 'GET' ? null : r.json();
  },
  // scarica tutto, unisce i miei progressi con quelli dell'altro dispositivo, rimanda su
  async pull(force) {
    if (!this.on || !this.logged) return;
    if (this.busy) return this.busy;
    this.busy = (async () => {
      try {
        if (!(await this.fresh())) { this.status = 'uscito'; return; }
        const rows = await this.rest('GET', 'progressi?select=id,nome,colore,dati,aggiornato');
        const me = this.session.user.id;
        const mine = rows.find(r => r.id === me);
        if (mine && mine.dati && mine.dati.v) Store.data = mergeData(Store.data, mine.dati);
        this.others = rows.filter(r => r.id !== me && r.dati);
        if (this.others.length) Store.data.rival = rivalFrom(this.others[0]);
        Store.save(true);
        await this.push();
        this.status = 'ok'; this.lastSync = Date.now();
      } catch (e) { this.status = 'offline'; }
      finally { this.busy = null; if (typeof refreshChrome === 'function') refreshChrome(); }
    })();
    return this.busy;
  },
  async push() {
    if (!this.on || !this.logged || !(await this.fresh())) return;
    const d = Store.data;
    await this.rest('POST', 'progressi?on_conflict=id', { id: this.session.user.id, nome: d.name || null, colore: d.colore, dati: Object.assign({}, d, { rival: null }), aggiornato: new Date().toISOString() }, 'resolution=merge-duplicates,return=minimal');
    this.lastSync = Date.now(); this.status = 'ok';
  },
  schedule() {
    if (!this.on || !this.logged) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.push().catch(() => { this.status = 'offline'; }), 2500);
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
