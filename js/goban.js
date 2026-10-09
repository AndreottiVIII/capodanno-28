// ===== Goban (SVG), lessico cliccabile, telecronaca delle mosse =====
let GOBAN_SEQ = 0;
class Goban {
  constructor(host) { this.host = host; this.G = 100; this.M = 70; this.onPlay = null; this.clickable = false; this.ghostColor = BLACK; this.opts = {}; this.uid = 'g' + (++GOBAN_SEQ); this.pending = null; }
  set(o) { this.opts = Object.assign({ marks: {}, labels: {} }, o); this.pending = null; this.render(); }
  update(o) { Object.assign(this.opts, o); this.render(); }
  px(p) { const [x, y] = this.opts.board.xy(p); return [this.M + x * this.G, this.M + y * this.G]; }
  render() {
    const o = this.opts, b = o.board, n = b.n, G = this.G, M = this.M, S = 2 * M + (n - 1) * G, id = this.uid;
    this.host.innerHTML = '';
    let vb = `0 0 ${S} ${S}`;
    if (o.crop) { const [x0, y0, x1, y1] = o.crop; vb = `${M + x0 * G - 60} ${M + y0 * G - 60} ${(x1 - x0) * G + 120} ${(y1 - y0) * G + 120}`; }
    const svg = s('svg', { viewBox: vb, class: 'goban-svg' + (o.crop ? ' mini' : ''), role: 'img', 'aria-label': o.label || `Goban ${n}×${n}` });
    const defs = s('defs', {});
    defs.innerHTML = `<radialGradient id="${id}B" cx="36%" cy="30%" r="75%"><stop offset="0" stop-color="#5B5866"/><stop offset=".42" stop-color="#1B1A21"/><stop offset="1" stop-color="#060609"/></radialGradient>
      <radialGradient id="${id}W" cx="36%" cy="30%" r="80%"><stop offset="0" stop-color="#FFFDF7"/><stop offset=".55" stop-color="#F2EADA"/><stop offset="1" stop-color="#CDBFA6"/></radialGradient>
      <linearGradient id="${id}K" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E2BA78"/><stop offset=".55" stop-color="#D9AE6B"/><stop offset="1" stop-color="#CC9D58"/></linearGradient>`;
    svg.append(defs);
    svg.append(s('rect', { x: -400, y: -400, width: S + 800, height: S + 800, fill: `url(#${id}K)` }));
    // venatura leggera del legno
    const grain = s('g', { stroke: '#B8884A', 'stroke-width': 2, fill: 'none', opacity: .18 });
    for (let i = 0; i < 9; i++) { const y = (i + .5) * S / 9; grain.append(s('path', { d: `M0 ${y} C ${S * .3} ${y - 18}, ${S * .6} ${y + 22}, ${S} ${y - 6}` })); }
    svg.append(grain);
    const lw = n >= 19 ? [5, 2.6] : n >= 13 ? [5, 2.8] : [5, 3];
    const grid = s('g', { stroke: '#5A3D1E', 'stroke-linecap': 'square' });
    for (let i = 0; i < n; i++) {
      const w = (i === 0 || i === n - 1) ? lw[0] : lw[1];
      grid.append(s('line', { x1: M, y1: M + i * G, x2: M + (n - 1) * G, y2: M + i * G, 'stroke-width': w }));
      grid.append(s('line', { x1: M + i * G, y1: M, x2: M + i * G, y2: M + (n - 1) * G, 'stroke-width': w }));
    }
    svg.append(grid);
    const hoshi = n === 9 ? [[2, 2], [6, 2], [2, 6], [6, 6], [4, 4]] : n === 7 ? [[2, 2], [4, 2], [2, 4], [4, 4], [3, 3]] : n === 13 ? [[3, 3], [9, 3], [3, 9], [9, 9], [6, 6]] : n === 19 ? [[3, 3], [9, 3], [15, 3], [3, 9], [9, 9], [15, 9], [3, 15], [9, 15], [15, 15]] : [];
    for (const [x, y] of hoshi) svg.append(s('circle', { cx: M + x * G, cy: M + y * G, r: 11, fill: '#5A3D1E' }));
    if (!o.crop && !o.noCoords) {
      const lab = s('g', { fill: '#7A5A30', 'font-size': 30, 'font-family': 'Alegreya Sans, sans-serif', 'text-anchor': 'middle' });
      for (let i = 0; i < n; i++) {
        const t1 = s('text', { x: M + i * G, y: S - 10 }); t1.textContent = COLS[i]; lab.append(t1);
        const t2 = s('text', { x: 24, y: M + i * G + 10 }); t2.textContent = n - i; lab.append(t2);
      }
      svg.append(lab);
    }
    if (o.region) for (const p of o.region) { const [cx, cy] = this.px(p); svg.append(s('rect', { x: cx - 38, y: cy - 38, width: 76, height: 76, rx: 8, fill: '#FFF5DA', opacity: .38 })); }
    const shadow = s('g', {}), stones = s('g', {});
    for (let p = 0; p < b.cells.length; p++) {
      const v = b.cells[p]; if (v !== BLACK && v !== WHITE) continue;
      const [cx, cy] = this.px(p), dim = o.dead && o.dead.includes(p);
      shadow.append(s('circle', { cx: cx + 4, cy: cy + 7, r: G * .47, fill: '#3A2410', opacity: dim ? .06 : .28 }));
      stones.append(s('circle', { cx, cy, r: G * .47, fill: v === BLACK ? `url(#${id}B)` : `url(#${id}W)`, stroke: v === WHITE ? '#A89A80' : '#000', 'stroke-width': 1.5, opacity: dim ? .42 : 1 }));
    }
    svg.append(shadow, stones);
    const ink = p => b.cells[p] === BLACK ? '#F4EEE2' : '#B8361F';
    if (o.targets) {
      const seen = new Set(), tg = s('g', { fill: 'none', 'stroke-width': 6, class: 'breath' });
      for (const t of o.targets) {
        if (b.cells[t] !== BLACK && b.cells[t] !== WHITE) continue;
        for (const q of b.group(t).stones) {
          if (seen.has(q) || (q in o.labels)) continue; seen.add(q);
          const [cx, cy] = this.px(q);
          tg.append(s('path', { d: `M${cx} ${cy - 22} L${cx + 20} ${cy + 13} L${cx - 20} ${cy + 13} Z`, stroke: b.cells[q] === BLACK ? '#E2B05C' : '#B8361F', 'stroke-linejoin': 'round' }));
        }
      }
      svg.append(tg);
    }
    if (o.overlay) for (let p = 0; p < b.cells.length; p++) {
      const v = o.overlay[p]; if (!v || b.cells[p] === EDGE) continue;
      const isStone = b.cells[p] === BLACK || b.cells[p] === WHITE, dead = o.dead && o.dead.includes(p);
      if (isStone && !dead) continue;
      if (Math.abs(v) < .25) continue;
      const [cx, cy] = this.px(p), z = 30;
      svg.append(s('rect', { x: cx - z / 2, y: cy - z / 2, width: z, height: z, fill: v > 0 ? '#16151A' : '#FBF6EA', stroke: v > 0 ? 'none' : '#7C6A4E', 'stroke-width': 2, opacity: .4 + .55 * Math.min(1, Math.abs(v)) }));
    }
    const mk = s('g', {});
    for (const key in o.marks) {
      const p = +key, t = o.marks[key], [cx, cy] = this.px(p), c = ink(p), empty = b.cells[p] === EMPTY;
      if (t === 'lib') mk.append(s('circle', { cx, cy, r: 15, fill: '#B8361F', opacity: .85 }));
      else if (t === 'libgood') mk.append(s('circle', { cx, cy, r: 15, fill: '#2F7A55', opacity: .9 }));
      else if (t === 'atari') mk.append(s('circle', { cx, cy, r: 62, fill: 'none', stroke: '#B8361F', 'stroke-width': 6, 'stroke-dasharray': '14 10' }));
      else if (t === 'atariOpp') mk.append(s('circle', { cx, cy, r: 62, fill: 'none', stroke: '#2F7A55', 'stroke-width': 6, 'stroke-dasharray': '14 10' }));
      else if (t === 'tri') mk.append(s('path', { d: `M${cx} ${cy - 24} L${cx + 22} ${cy + 14} L${cx - 22} ${cy + 14} Z`, fill: 'none', stroke: c, 'stroke-width': 6, 'stroke-linejoin': 'round' }));
      else if (t === 'sq') mk.append(s('rect', { x: cx - 17, y: cy - 17, width: 34, height: 34, fill: 'none', stroke: c, 'stroke-width': 6 }));
      else if (t === 'circle') mk.append(s('circle', { cx, cy, r: 21, fill: 'none', stroke: c, 'stroke-width': 6 }));
      else if (t === 'x') { const d = 18; mk.append(s('path', { d: `M${cx - d} ${cy - d}L${cx + d} ${cy + d}M${cx + d} ${cy - d}L${cx - d} ${cy + d}`, stroke: empty ? '#B8361F' : c, 'stroke-width': 8, 'stroke-linecap': 'round' })); }
      else if (t === 'good') mk.append(s('path', { d: `M${cx} ${cy - 26}L${cx + 26} ${cy}L${cx} ${cy + 26}L${cx - 26} ${cy}Z`, fill: '#2F7A55', stroke: '#F4EBD6', 'stroke-width': 3, class: 'breath' }));
    }
    svg.append(mk);
    for (const key in o.labels) {
      const p = +key, [cx, cy] = this.px(p), empty = b.cells[p] === EMPTY;
      if (empty) svg.append(s('circle', { cx, cy, r: 28, fill: '#F7EBD0', stroke: '#B8361F', 'stroke-width': 3 }));
      const t = s('text', { x: cx, y: cy + 13, 'text-anchor': 'middle', 'font-size': 38, 'font-weight': 700, 'font-family': 'Alegreya Sans, sans-serif', fill: empty ? '#8E2A18' : (b.cells[p] === BLACK ? '#F4EBD6' : '#2A1E16') });
      t.textContent = o.labels[key]; svg.append(t);
    }
    if (o.last !== undefined && o.last !== null && o.last !== PASS && b.cells[o.last] !== EMPTY && !(o.last in o.labels)) {
      const [cx, cy] = this.px(o.last);
      svg.append(s('circle', { cx, cy, r: 15, fill: 'none', stroke: b.cells[o.last] === BLACK ? '#E2B05C' : '#B8361F', 'stroke-width': 6 }));
    }
    this.ghost = s('circle', { r: G * .45, fill: 'none', opacity: 0, 'pointer-events': 'none' });
    svg.append(this.ghost);
    this.fx = s('g', {}); svg.append(this.fx);
    if (!o.crop) {
      svg.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') this.hover(e); });
      svg.addEventListener('pointerleave', () => { if (this.pending === null) this.ghost.setAttribute('opacity', 0); });
      svg.addEventListener('click', e => this.click(e));
    }
    svg.style.cursor = this.clickable ? 'pointer' : 'default';
    this.svg = svg; this.host.append(svg);
  }
  pointFrom(e) {
    const b = this.opts.board, pt = this.svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const q = pt.matrixTransform(this.svg.getScreenCTM().inverse());
    const x = Math.round((q.x - this.M) / this.G), y = Math.round((q.y - this.M) / this.G);
    if (x < 0 || y < 0 || x >= b.n || y >= b.n) return null;
    return b.pt(x, y);
  }
  showGhost(p, strong) {
    const [cx, cy] = this.px(p); this.ghost.setAttribute('cx', cx); this.ghost.setAttribute('cy', cy);
    if (this.ghostColor === 'mark') { this.ghost.setAttribute('fill', 'none'); this.ghost.setAttribute('stroke', '#B8361F'); this.ghost.setAttribute('stroke-width', 5); this.ghost.setAttribute('stroke-dasharray', '9 8'); this.ghost.setAttribute('opacity', .85); }
    else { this.ghost.setAttribute('fill', this.ghostColor === BLACK ? '#16151A' : '#FBF6EA'); this.ghost.setAttribute('stroke', strong ? '#B8361F' : 'none'); this.ghost.setAttribute('stroke-width', 6); this.ghost.removeAttribute('stroke-dasharray'); this.ghost.setAttribute('opacity', strong ? .7 : .45); }
  }
  hover(e) {
    if (!this.clickable) { this.ghost.setAttribute('opacity', 0); return; }
    const p = this.pointFrom(e), b = this.opts.board;
    if (p === null || b.cells[p] !== EMPTY) { this.ghost.setAttribute('opacity', 0); return; }
    this.showGhost(p);
  }
  cellPx() { const r = this.svg.getBoundingClientRect(), vb = this.svg.viewBox.baseVal; return r.width / vb.width * this.G; }
  click(e) {
    if (!this.clickable || !this.onPlay) return;
    const p = this.pointFrom(e); if (p === null) return;
    // sul telefono, con intersezioni piccole (13×13, 19×19): primo tocco mostra, secondo conferma
    if (e.pointerType !== 'mouse' && this.cellPx() < 30 && this.opts.board.cells[p] === EMPTY) {
      if (this.pending !== p) { this.pending = p; this.showGhost(p, true); if (this.onPending) this.onPending(p); return; }
    }
    this.pending = null; this.ghost.setAttribute('opacity', 0);
    this.onPlay(p);
  }
  pulse(p) {
    const [cx, cy] = this.px(p);
    this.fx.append(s('circle', { cx, cy, r: 50, fill: 'none', stroke: '#E2B05C', 'stroke-width': 6, class: reduceMotion ? '' : 'pulse' }));
  }
}

// ---------- Lessico cliccabile ----------
const TERM_LIST = (() => { const l = []; for (const g of GLOSSARY) for (const a of (g.alias || [])) l.push([a.toLowerCase(), g]); l.sort((a, b) => b[0].length - a[0].length); return l; })();
const TERM_MAP = new Map(TERM_LIST);
const TERM_RE = new RegExp('(^|[^\\p{L}\\d-])(' + TERM_LIST.map(([a]) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?=$|[^\\p{L}\\d-])', 'giu');
function linkify(text, seen) {
  seen = seen || new Set();
  const frag = document.createDocumentFragment(); let last = 0;
  for (const m of text.matchAll(TERM_RE)) {
    const start = m.index + m[1].length, word = m[2], g = TERM_MAP.get(word.toLowerCase());
    if (!g || seen.has(g.id)) continue;
    seen.add(g.id);
    frag.append(text.slice(last, start), h('button', { class: 'term', type: 'button', onclick: e => { e.stopPropagation(); showTerm(g); } }, word));
    last = start + word.length;
  }
  frag.append(text.slice(last));
  return frag;
}
function setText(el, text, opts) { el.innerHTML = ''; el.append(opts && opts.plain ? text : linkify(text, opts && opts.seen)); }
function closeTerm() { const b = $('#termbox'); if (b) b.remove(); }
function showTerm(g) {
  closeTerm();
  const dia = h('div', { class: 'term-dia' });
  const box = h('aside', { id: 'termbox', role: 'dialog', 'aria-label': 'Definizione di ' + g.term },
    h('div', { class: 'tb-head' }, h('span', { class: 'tb-term' }, g.term), g.jp ? h('span', { class: 'tb-jp' }, g.jp) : null),
    h('p', {}, g.def), g.rows ? dia : null,
    h('div', { class: 'actions' }, btn('Apri nel lessico', () => { closeTerm(); go('lessico/' + g.id); }, 'ghost'), btn('Chiudi', closeTerm, 'ghost')));
  document.body.append(box);
  if (g.rows) miniBoard(dia, g);
  box.querySelector('.btn:last-child').focus({ preventScroll: true });
}
function miniBoard(host, g) {
  const b = Board.fromRows(g.rows), gb = new Goban(host);
  const P = c => b.pt(COLS.indexOf(c[0]), b.n - parseInt(c.slice(1), 10));
  const marks = {};
  if (g.marks) for (const c in g.marks) marks[P(c)] = g.marks[c];
  if (g.libsOf) for (const c of g.libsOf) for (const l of b.group(P(c)).libs) marks[l] = 'lib';
  gb.set({ board: b, marks, crop: g.crop, noCoords: true });
  return gb;
}

// ---------- Telecronaca: descrive una mossa con il lessico giusto ----------
function describeMove(before, p, color, ctx) {
  ctx = ctx || {};
  const who = color === BLACK ? 'Nero' : 'Bianco';
  if (p === PASS) return `${who} passa.`;
  const after = before.clone();
  if (!after.play(p, color)) return `${who} ${coordName(before, p)}: mossa vietata.`;
  const name = q => coordName(before, q), opp = other(color), parts = [];
  if (after.lastCaptured) {
    const n = after.lastCaptured;
    parts.push(`cattura ${n === 1 ? 'una pietra' : n + ' pietre'}` + (after.ko !== -1 ? ' (ko: l\'avversario non può riprendere subito)' : ''));
  }
  const savedFrom = [];
  for (const d of before.dirs) { const q = p + d; if (before.cells[q] === color && before.group(q).libs.length === 1) savedFrom.push(q); }
  const mine = after.group(p), ml = mine.libs.length;
  let connects = 0; const seenG = new Set();
  for (const d of before.dirs) { const q = p + d; if (before.cells[q] === color) { const k = Math.min(...before.group(q).stones); if (!seenG.has(k)) { seenG.add(k); connects++; } } }
  const ataris = [], twos = []; const seenO = new Set();
  for (const d of after.dirs) {
    const q = p + d; if (after.cells[q] !== opp) continue;
    const g = after.group(q), k = Math.min(...g.stones); if (seenO.has(k)) continue; seenO.add(k);
    if (g.libs.length === 1) ataris.push(g); else if (g.libs.length === 2) twos.push(g);
  }
  if (ataris.length >= 2) parts.push(`doppio atari su ${ataris.map(g => name(g.stones[0])).join(' e ')}`);
  else if (ataris.length === 1) parts.push(`atari su ${name(ataris[0].stones[0])}${ataris[0].stones.length > 1 ? ' (' + ataris[0].stones.length + ' pietre)' : ''}: ultima libertà ${name(ataris[0].libs[0])}`);
  else if (twos.length && !after.lastCaptured) parts.push(`riduce a 2 le libertà di ${name(twos[0].stones[0])}`);
  if (savedFrom.length && !after.lastCaptured) parts.push(`${connects > 1 ? 'collega e ' : ''}si allunga: la catena ora ha ${ml} libertà`);
  else if (connects > 1) parts.push(`collega due catene (${ml} libertà)`);
  if (ml === 1 && !after.lastCaptured) parts.push(ctx.sacrifice ? 'sacrificio: la pietra è in atari di proposito' : `si mette in atari da solo (ultima libertà ${name(mine.libs[0])})`);
  if (!parts.length) {
    const adjOpp = before.dirs.some(d => before.cells[p + d] === opp);
    const attacking = ctx.target !== undefined && before.cells[ctx.target] === opp;
    parts.push(adjOpp ? `a contatto, la catena ha ${ml} libertà` : attacking ? 'chiude a distanza' : `${ml} libertà`);
  }
  return `${who} ${name(p)}: ${parts.join('; ')}.`;
}

// diagramma testuale (per copiare una posizione)
function diagram(b) {
  let out = '   ' + COLS.slice(0, b.n).split('').join(' ') + '\n';
  for (let y = 0; y < b.n; y++) {
    let r = String(b.n - y).padStart(2, ' ') + ' ';
    for (let x = 0; x < b.n; x++) { const v = b.cells[b.pt(x, y)]; r += (v === BLACK ? 'X' : v === WHITE ? 'O' : '.') + ' '; }
    out += r + '\n';
  }
  return out;
}
