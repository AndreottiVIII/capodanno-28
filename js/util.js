// ===== Utilità: DOM, date locali, piccoli aiuti =====
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
}
const SVGNS = 'http://www.w3.org/2000/svg';
function s(tag, attrs) { const el = document.createElementNS(SVGNS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); return el; }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const isPhone = () => window.matchMedia('(max-width: 899px)').matches;
function btn(label, onclick, cls, attrs) { return h('button', Object.assign({ class: 'btn ' + (cls || ''), type: 'button', onclick }, attrs || {}), label); }

// Date locali (non UTC: a mezzanotte in Italia l'ISO cambierebbe giorno alle 01 o 02)
function dayKey(d) { d = d || new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function keyDate(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(k, n) { const d = keyDate(k); d.setDate(d.getDate() + n); return dayKey(d); }
function weekStart(k) { const d = keyDate(k || dayKey()); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return dayKey(d); }
const today = () => dayKey();
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
function longDate(k) { const d = keyDate(k || dayKey()); return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]}`; }
function shortDate(k) { const d = keyDate(k); return `${d.getDate()} ${MESI[d.getMonth()].slice(0, 3)}`; }
function weekLabel(ws) { const a = keyDate(ws), b = keyDate(addDays(ws, 6)); return a.getMonth() === b.getMonth() ? `${a.getDate()} – ${b.getDate()} ${MESI[b.getMonth()]}` : `${a.getDate()} ${MESI[a.getMonth()]} – ${b.getDate()} ${MESI[b.getMonth()]}`; }
function greeting() { const hr = new Date().getHours(); return hr < 5 ? 'Buonanotte' : hr < 13 ? 'Buongiorno' : hr < 18 ? 'Buon pomeriggio' : 'Buonasera'; }
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// Messaggio breve in basso (perle, sigilli, motivi sbloccati)
function toast(content, kind) {
  let wrap = $('#toasts');
  if (!wrap) { wrap = h('div', { id: 'toasts', 'aria-live': 'polite' }); document.body.append(wrap); }
  const t = h('div', { class: 'toast ' + (kind || '') }, content);
  wrap.append(t);
  setTimeout(() => t.classList.add('out'), 3200);
  setTimeout(() => t.remove(), 3800);
}
