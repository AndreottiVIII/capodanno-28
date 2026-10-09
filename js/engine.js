// ===== Go engine: board, rules, scoring =====
const EMPTY = 0, BLACK = 1, WHITE = 2, EDGE = 3, PASS = -1;
const other = c => 3 - c;

let ZOB = null;
const MARK = new Int32Array(21 * 21); let STAMP = 1;
const STACK = new Int32Array(21 * 21);
function zobInit() {
  if (ZOB) return;
  ZOB = [new Uint32Array(21 * 21 * 3), new Uint32Array(21 * 21 * 3)];
  let s = 0x9e3779b9;
  const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s; };
  for (let i = 0; i < ZOB[0].length; i++) { ZOB[0][i] = rnd(); ZOB[1][i] = rnd(); }
}

class Board {
  constructor(n) {
    zobInit();
    this.n = n; this.W = n + 2;
    this.cells = new Int8Array(this.W * this.W).fill(EDGE);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) this.cells[this.pt(x, y)] = EMPTY;
    this.dirs = [1, -1, this.W, -this.W];
    this.ko = -1; this.toMove = BLACK; this.caps = [0, 0, 0];
    this.h1 = 0; this.h2 = 0; this.passes = 0; this.last = PASS;
  }
  pt(x, y) { return (y + 1) * this.W + (x + 1); }
  xy(p) { return [p % this.W - 1, Math.floor(p / this.W) - 1]; }
  clone() {
    const b = Object.create(Board.prototype);
    b.n = this.n; b.W = this.W; b.cells = this.cells.slice(); b.dirs = this.dirs;
    b.ko = this.ko; b.toMove = this.toMove; b.caps = this.caps.slice();
    b.h1 = this.h1; b.h2 = this.h2; b.passes = this.passes; b.last = this.last;
    return b;
  }
  setStone(p, c) {
    const old = this.cells[p];
    if (old === BLACK || old === WHITE) { this.h1 ^= ZOB[0][p * 3 + old]; this.h2 ^= ZOB[1][p * 3 + old]; }
    this.cells[p] = c;
    if (c === BLACK || c === WHITE) { this.h1 ^= ZOB[0][p * 3 + c]; this.h2 ^= ZOB[1][p * 3 + c]; }
  }
  // returns {stones, libs}
  group(p) {
    const c = this.cells[p], st = ++STAMP, cells = this.cells, mark = MARK;
    const stones = [p], libs = [];
    mark[p] = st;
    for (let i = 0; i < stones.length; i++) {
      const q = stones[i];
      for (let d = 0; d < 4; d++) {
        const r = q + this.dirs[d];
        if (mark[r] === st) continue;
        const v = cells[r];
        if (v === c) { mark[r] = st; stones.push(r); }
        else if (v === EMPTY) { mark[r] = st; libs.push(r); }
      }
    }
    return { stones, libs };
  }
  libCount(p) { return this.group(p).libs.length; }
  // quick: does group at p have a liberty other than `except`?
  isLegal(p, c) {
    if (p === PASS) return true;
    if (this.cells[p] !== EMPTY || p === this.ko) return false;
    const b = this.clone();
    return b.play(p, c);
  }
  hasLib(p) {
    const c = this.cells[p], st = ++STAMP, cells = this.cells, dirs = this.dirs;
    let sp = 0; STACK[sp++] = p; MARK[p] = st;
    while (sp) {
      const q = STACK[--sp];
      for (let d = 0; d < 4; d++) {
        const r = q + dirs[d];
        if (MARK[r] === st) continue;
        const v = cells[r];
        if (v === EMPTY) return true;
        if (v === c) { MARK[r] = st; STACK[sp++] = r; }
      }
    }
    return false;
  }
  removeGroup(p) {
    const c = this.cells[p], dirs = this.dirs; let sp = 0, n = 0;
    STACK[sp++] = p; this.setStone(p, EMPTY);
    while (sp) {
      const q = STACK[--sp]; n++;
      for (let d = 0; d < 4; d++) { const r = q + dirs[d]; if (this.cells[r] === c) { this.setStone(r, EMPTY); STACK[sp++] = r; } }
    }
    return n;
  }
  play(p, c) {
    if (c === undefined) c = this.toMove;
    if (p === PASS) { this.ko = -1; this.toMove = other(c); this.passes++; this.last = PASS; return true; }
    if (this.cells[p] !== EMPTY || p === this.ko) return false;
    this.setStone(p, c);
    const o = other(c); let captured = 0, capPt = -1;
    for (let d = 0; d < 4; d++) {
      const r = p + this.dirs[d];
      if (this.cells[r] === o && !this.hasLib(r)) { captured += this.removeGroup(r); capPt = r; }
    }
    if (captured === 0 && !this.hasLib(p)) { this.setStone(p, EMPTY); return false; }
    let ko = -1;
    if (captured === 1) {
      let lone = true, libs = 0;
      for (let d = 0; d < 4; d++) { const v = this.cells[p + this.dirs[d]]; if (v === c) lone = false; else if (v === EMPTY) libs++; }
      if (lone && libs === 1) ko = capPt;
    }
    this.ko = ko;
    this.caps[c] += captured; this.toMove = o; this.passes = 0; this.last = p;
    this.lastCaptured = captured;
    return true;
  }
  // is p an eye-like point for color c (all neighbours c/edge, most diagonals c)
  isEyeish(p, c) {
    if (this.cells[p] !== EMPTY) return false;
    for (let d = 0; d < 4; d++) { const v = this.cells[p + this.dirs[d]]; if (v !== c && v !== EDGE) return false; }
    const W = this.W, diags = [p + W + 1, p + W - 1, p - W + 1, p - W - 1];
    let bad = 0, edge = 0;
    for (const q of diags) { const v = this.cells[q]; if (v === EDGE) edge++; else if (v === other(c)) bad++; }
    return edge > 0 ? bad === 0 : bad < 2;
  }
  // area score with optional dead-stone set (points). returns {b, w, owner:Int8Array}
  areaScore(dead) {
    const cells = this.cells.slice();
    if (dead) for (const p of dead) cells[p] = EMPTY;
    const owner = new Int8Array(cells.length);
    const seen = new Uint8Array(cells.length);
    let b = 0, w = 0;
    for (let p = 0; p < cells.length; p++) {
      if (cells[p] === BLACK) { b++; owner[p] = BLACK; }
      else if (cells[p] === WHITE) { w++; owner[p] = WHITE; }
      else if (cells[p] === EMPTY && !seen[p]) {
        const reg = [p]; seen[p] = 1; let tb = false, tw = false;
        for (let i = 0; i < reg.length; i++) for (let d = 0; d < 4; d++) {
          const r = reg[i] + this.dirs[d], v = cells[r];
          if (v === EMPTY && !seen[r]) { seen[r] = 1; reg.push(r); }
          else if (v === BLACK) tb = true; else if (v === WHITE) tw = true;
        }
        const own = tb && !tw ? BLACK : tw && !tb ? WHITE : 0;
        for (const q of reg) owner[q] = own;
        if (own === BLACK) b += reg.length; else if (own === WHITE) w += reg.length;
      }
    }
    return { b, w, owner };
  }
  emptyPoints() { const a = []; for (let p = 0; p < this.cells.length; p++) if (this.cells[p] === EMPTY) a.push(p); return a; }
  static fromRows(rows, toMove) {
    const n = rows.length, b = new Board(n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const ch = rows[y][x];
      if (ch === 'X') b.setStone(b.pt(x, y), BLACK);
      else if (ch === 'O') b.setStone(b.pt(x, y), WHITE);
    }
    b.toMove = toMove || BLACK;
    return b;
  }
}
const COLS = 'ABCDEFGHJKLMNOPQRST';
function coordName(b, p) { if (p === PASS) return 'passa'; const [x, y] = b.xy(p); return COLS[x] + (b.n - y); }

// ===== Tactical solvers =====
// Capture reading: does `attacker` capture any of the groups at `targets` ?
function makeCaptureSolver(opts) {
  const maxNodes = (opts && opts.maxNodes) || 150000;
  const SAFE = 4;
  let nodes = 0, memo = new Map(), aborted = false;
  function liveTargets(b, targets, def) { return targets.filter(t => b.cells[t] === def); }
  function cands(b, targets, toMove, attacker) {
    const def = other(attacker), res = [], seen = new Set();
    const add = q => { if (!seen.has(q)) { seen.add(q); res.push(q); } };
    const done = new Set();
    for (const t of targets) {
      if (b.cells[t] !== def) continue;
      const g = b.group(t); const gk = Math.min(...g.stones);
      if (done.has(gk)) continue; done.add(gk);
      const libs = g.libs;
      if (toMove === attacker) {
        for (const l of libs) add(l);
        if (libs.length === 2) for (const l of libs) for (const d of b.dirs) { const q = l + d; if (b.cells[q] === EMPTY) add(q); }
        // also capture defender stones adjacent to attacker groups in atari that touch target (to save own)
        for (const s of g.stones) for (const d of b.dirs) {
          const q = s + d;
          if (b.cells[q] === attacker) { const ag = b.group(q); if (ag.libs.length === 1) {
            // attacker group in atari: capturing its attackers is a candidate
            for (const s2 of ag.stones) for (const d2 of b.dirs) { const r = s2 + d2; if (b.cells[r] === def) { const dg = b.group(r); if (dg.libs.length === 1) add(dg.libs[0]); } }
            add(ag.libs[0]);
          } }
        }
      } else {
        for (const l of libs) add(l);
        const gs = new Set();
        for (const s of g.stones) for (const d of b.dirs) {
          const q = s + d;
          if (b.cells[q] === attacker) {
            const ag = b.group(q); const key = Math.min(...ag.stones);
            if (gs.has(key)) continue; gs.add(key);
            if (ag.libs.length <= 2) for (const l of ag.libs) add(l);
          }
        }
      }
    }
    if (toMove !== attacker) res.push(PASS);
    return res;
  }
  function wins(b, targets, attacker, toMove, depth) {
    const def = other(attacker);
    for (const t of targets) if (b.cells[t] !== def) return true;
    let allSafe = true;
    for (const t of targets) {
      const g = b.group(t), n = g.libs.length;
      if (toMove === attacker && n === 1) { const c = b.clone(); if (c.play(g.libs[0], attacker)) return true; }
      if (n < SAFE) allSafe = false;
    }
    if (allSafe) return false;
    if (depth <= 0) return false;
    if (++nodes > maxNodes) { aborted = true; return false; }
    const key = b.h1 + ':' + b.h2 + ':' + toMove + ':' + b.ko + ':' + depth;
    if (memo.has(key)) return memo.get(key);
    const list = cands(b, targets, toMove, attacker);
    const children = [];
    for (const m of list) {
      const c = b.clone();
      if (!c.play(m, toMove)) continue;
      let minL = 99;
      for (const t of targets) { const l = c.cells[t] === def ? c.group(t).libs.length : 0; if (l < minL) minL = l; }
      let score = minL;
      if (m !== PASS && toMove === attacker && c.group(m).libs.length === 1) score += 3;
      children.push({ m, c, score });
    }
    if (toMove === attacker) children.sort((a, b2) => a.score - b2.score);
    else children.sort((a, b2) => (a.m === PASS) - (b2.m === PASS) || b2.score - a.score);
    let result;
    if (toMove === attacker) {
      result = false;
      for (const ch of children) if (wins(ch.c, targets, attacker, def, depth - 1)) { result = true; break; }
    } else {
      result = true;
      for (const ch of children) if (!wins(ch.c, targets, attacker, attacker, depth - 1)) { result = false; break; }
    }
    memo.set(key, result);
    return result;
  }
  return {
    wins(b, targets, attacker, toMove, depth) { nodes = 0; aborted = false; memo = new Map(); return wins(b, targets, attacker, toMove, depth); },
    cands, get nodes() { return nodes; }, get aborted() { return aborted; }
  };
}

// Life & death in a closed region: does `attacker` capture any group at targets?
function makeRegionSolver() {
  let memo = new Map(), nodes = 0;
  function wins(b, targets, attacker, toMove, depth, region, lastPass) {
    const def = other(attacker);
    for (const t of targets) if (b.cells[t] !== def) return true;
    if (depth <= 0) return false;
    nodes++;
    const key = b.h1 + ':' + b.h2 + ':' + toMove + ':' + b.ko + ':' + depth + ':' + (lastPass ? 1 : 0);
    if (memo.has(key)) return memo.get(key);
    const moves = [];
    for (const p of region) if (b.cells[p] === EMPTY) moves.push(p);
    let result;
    if (toMove === attacker) {
      result = false;
      for (const m of moves) {
        const c = b.clone(); if (!c.play(m, attacker)) continue;
        if (wins(c, targets, attacker, def, depth - 1, region, false)) { result = true; break; }
      }
    } else {
      result = true;
      for (const m of moves.concat([PASS])) {
        const c = b.clone(); if (!c.play(m, def)) continue;
        if (!wins(c, targets, attacker, attacker, depth - 1, region, m === PASS)) { result = false; break; }
      }
    }
    memo.set(key, result);
    return result;
  }
  return {
    wins(b, targets, attacker, toMove, depth, region) { memo = new Map(); nodes = 0; return wins(b, targets, attacker, toMove, depth, region, false); },
    get nodes() { return nodes; }
  };
}


// ===== Problems: judging, engine replies, generators =====
const CAP = makeCaptureSolver({ maxNodes: 150000 });
const REG = makeRegionSolver();

function parseCoord(n, s) { const x = COLS.indexOf(s[0]); const y = n - parseInt(s.slice(1), 10); return [x, y]; }

// kind: capture/kill -> user (black) attacks white; save/live -> white attacks user (black)
function attackerOf(kind) { return (kind === 'capture' || kind === 'kill') ? BLACK : WHITE; }
function userIsAttacker(kind) { return kind === 'capture' || kind === 'kill'; }

function attWins(P, b, toMove) {
  const att = attackerOf(P.kind);
  if (P.region) return REG.wins(b, P.targets, att, toMove, P.depth, P.region);
  return CAP.wins(b, P.targets, att, toMove, P.depth);
}
function candMoves(P, b, color) {
  const att = attackerOf(P.kind);
  if (P.region) { const a = P.region.filter(p => b.cells[p] === EMPTY); if (color !== att) a.push(PASS); return a; }
  return CAP.cands(b, P.targets, color, att);
}
function targetGone(P, b) { const def = other(attackerOf(P.kind)); return P.targets.some(t => b.cells[t] !== def); }

// Is black's move m correct in position b (black to move)?
function judgeMove(P, b, m) {
  const c = b.clone();
  if (!c.play(m, BLACK)) return { legal: false };
  const aw = attWins(P, c, WHITE);
  return { legal: true, ok: userIsAttacker(P.kind) ? aw : !aw, board: c };
}
// all correct black moves
function candidatePool(P, b) {
  if (P.region) return P.region;
  const set = new Set();
  for (const t of P.targets) {
    if (b.cells[t] === EMPTY) continue;
    const [tx, ty] = b.xy(t);
    for (const s of b.group(t).stones) {
      const [sx, sy] = b.xy(s);
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > 3) continue;
        const x = sx + dx, y = sy + dy; if (x < 0 || y < 0 || x >= b.n || y >= b.n) continue;
        set.add(b.pt(x, y));
      }
    }
    // also liberties of adjacent groups (captures that save)
    for (const s of b.group(t).stones) for (const d of b.dirs) { const q = s + d; if (b.cells[q] === BLACK || b.cells[q] === WHITE) for (const l of b.group(q).libs) set.add(l); }
  }
  return [...set];
}
function correctMoves(P, b, full) {
  const res = [];
  const pool = full ? b.emptyPoints() : candidatePool(P, b);
  for (const p of pool) { if (b.cells[p] !== EMPTY) continue; const j = judgeMove(P, b, p); if (j.legal && j.ok) res.push(p); }
  return res;
}
// After a correct user move (white to move): is the problem finished?
function isSolved(P, b) {
  if (userIsAttacker(P.kind)) {
    if (targetGone(P, b)) return true;
    // dead even if black tenukis: every white move, then white again, still dies
    for (const d of candMoves(P, b, WHITE)) {
      const c = b.clone(); if (!c.play(d, WHITE)) continue;
      c.toMove = WHITE;
      if (!attWins(P, c, WHITE)) return false;
    }
    return true;
  } else {
    if (!P.region) {
      // escaped: every target has 3+ liberties and white can't capture by reading
      const def = BLACK;
      if (P.targets.every(t => b.cells[t] === def && b.group(t).libs.length >= 3) && !attWins(P, b, WHITE)) return true;
    }
    // safe even if black tenukis: every white attack, then white again, still fails
    for (const a of candMoves(P, b, WHITE)) {
      if (a === PASS) continue;
      const c = b.clone(); if (!c.play(a, WHITE)) continue;
      if (attWins(P, c, WHITE)) return false;
    }
    return true;
  }
}
// Engine (white) reply after a correct user move. Picks the most testing move.
function engineReply(P, b) {
  let best = null, bestScore = -1e9;
  for (const m of candMoves(P, b, WHITE)) {
    const c = b.clone(); if (!c.play(m, WHITE)) continue;
    let score = 0;
    if (userIsAttacker(P.kind)) {
      // white defends: prefer moves that threaten to escape if black ignores
      const c2 = c.clone(); c2.toMove = WHITE;
      if (!attWins(P, c2, WHITE)) score += 100;
      if (m === PASS) score -= 50;
      let libs = 0; for (const t of P.targets) if (c.cells[t] === WHITE) libs += c.group(t).libs.length;
      score += libs;
    } else {
      // white attacks: prefer real threats (win if black ignores)
      const c2 = c.clone(); c2.toMove = WHITE;
      if (attWins(P, c2, WHITE)) score += 100;
      if (m === PASS) score -= 200;
      let libs = 0; for (const t of P.targets) if (c.cells[t] === BLACK) libs += c.group(t).libs.length;
      score -= libs;
    }
    score += Math.random() * 0.5;
    if (score > bestScore) { bestScore = score; best = m; }
  }
  return best === null ? PASS : best;
}
// Refutation after a wrong move (white to move): the move that shows why it fails
function refutation(P, b) {
  const list = candMoves(P, b, WHITE);
  for (const m of list) {
    const c = b.clone(); if (!c.play(m, WHITE)) continue;
    const aw = attWins(P, c, BLACK);
    if (userIsAttacker(P.kind) ? !aw : aw) return m;
  }
  return list.find(m => m !== PASS && b.isLegal(m, WHITE)) ?? PASS;
}

// ----- Build a problem from rows -----
function mkProblem(def) {
  const b = Board.fromRows(def.rows, BLACK);
  const n = b.n;
  const P = Object.assign({}, def);
  P.targets = def.targets.map(s => { const [x, y] = parseCoord(n, s); return b.pt(x, y); });
  P.region = def.region ? def.region.map(s => { const [x, y] = parseCoord(n, s); return b.pt(x, y); }) : null;
  P.board = b;
  return P;
}

// ----- L&D shape builder: eye space along the bottom edge -----
function shapeProblem(id, cellsXY, kind, meta) {
  const n = 9, grid = [];
  for (let y = 0; y < n; y++) grid.push(Array(n).fill('.'));
  const inS = (x, y) => cellsXY.some(([a, b]) => a === x && b === y);
  const cheb = (x, y) => { let m = 99; for (const [a, b] of cellsXY) m = Math.min(m, Math.max(Math.abs(a - x), Math.abs(b - y))); return m; };
  const defCh = kind === 'kill' ? 'O' : 'X', attCh = kind === 'kill' ? 'X' : 'O';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (inS(x, y)) continue;
    const d = cheb(x, y);
    if (d === 1) grid[y][x] = defCh; else if (d === 2) grid[y][x] = attCh;
  }
  const rows = grid.map(r => r.join(''));
  const [tx, ty] = (() => { for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (grid[y][x] === defCh) return [x, y]; })();
  const name = (x, y) => COLS[x] + (n - y);
  return mkProblem(Object.assign({
    id, kind, rows, targets: [name(tx, ty)], region: cellsXY.map(([x, y]) => name(x, y)),
    depth: 4 * cellsXY.length + 6,
  }, meta));
}

// ----- Random local-fight generator -----
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function randomLocal(rand) {
  const b = new Board(9);
  const ox = Math.floor(rand() * 4), oy = Math.floor(rand() * 4), w = 5 + Math.floor(rand() * 2);
  const count = 8 + Math.floor(rand() * 10);
  const pts = [];
  for (let y = oy; y < Math.min(9, oy + w); y++) for (let x = ox; x < Math.min(9, ox + w); x++) pts.push(b.pt(x, y));
  let c = rand() < 0.5 ? BLACK : WHITE, placed = 0, tries = 0;
  while (placed < count && tries < 400) {
    tries++;
    const p = pts[Math.floor(rand() * pts.length)];
    if (b.cells[p] !== EMPTY) continue;
    let adj = false; for (const d of b.dirs) { const v = b.cells[p + d]; if (v === BLACK || v === WHITE) adj = true; }
    if (placed > 0 && !adj && rand() < 0.75) continue;
    b.setStone(p, c);
    // reject stone with no liberties / creating a zero-lib group
    let bad = false;
    for (const q of [p, ...b.dirs.map(d => p + d)]) if ((b.cells[q] === BLACK || b.cells[q] === WHITE) && b.group(q).libs.length === 0) bad = true;
    if (bad) { b.setStone(p, EMPTY); continue; }
    placed++; c = other(c);
  }
  return b;
}
function groupsOf(b, color) {
  const seen = new Set(), res = [];
  for (let p = 0; p < b.cells.length; p++) if (b.cells[p] === color && !seen.has(p)) {
    const g = b.group(p); g.stones.forEach(s => seen.add(s)); res.push({ p, stones: g.stones, libs: g.libs });
  }
  return res;
}
function boardRows(b) { const r = []; for (let y = 0; y < b.n; y++) { let s = ''; for (let x = 0; x < b.n; x++) { const v = b.cells[b.pt(x, y)]; s += v === BLACK ? 'X' : v === WHITE ? 'O' : '.'; } r.push(s); } return r; }

// type: 'capture1' | 'save' | 'read'
function generate(type, seed) {
  const rand = rng(seed);
  for (let attempt = 0; attempt < 400; attempt++) {
    const b = randomLocal(rand); b.toMove = BLACK;
    const whites = groupsOf(b, WHITE), blacks = groupsOf(b, BLACK);
    if (blacks.length === 0 || whites.length === 0) continue;
    const name = p => coordName(b, p);
    if (type === 'capture1') {
      const atari = whites.filter(g => g.libs.length === 1);
      if (atari.length !== 1 || blacks.some(g => g.libs.length === 1)) continue;
      const g = atari[0];
      const P = mkProblem({ id: 'g1-' + seed, kind: 'capture', rows: boardRows(b), targets: [name(g.p)], depth: 1, unit: 'cattura', diff: 1 + (g.stones.length > 1 ? 0.3 : 0), generated: true });
      if (correctMoves(P, P.board).length === 1) return P;
    } else if (type === 'save') {
      const atari = blacks.filter(g => g.libs.length === 1);
      if (atari.length !== 1 || whites.some(g => g.libs.length === 1 && !g.stones.some(s => b.dirs.some(d => atari[0].stones.includes(s + d))))) continue;
      const g = atari[0];
      const P = mkProblem({ id: 'gs-' + seed, kind: 'save', rows: boardRows(b), targets: [name(g.p)], depth: 12, unit: 'salvare', generated: true });
      const cm = correctMoves(P, P.board);
      if (cm.length < 1 || cm.length > 2) continue;
      const extendOk = cm.includes(g.libs[0]);
      P.diff = extendOk ? 2 : 3.5;
      return P;
    } else if (type === 'read') {
      if (whites.some(g => g.libs.length === 1) || blacks.some(g => g.libs.length === 1)) continue;
      const two = whites.filter(g => g.libs.length === 2 && g.stones.length <= 4);
      if (!two.length) continue;
      const g = two[Math.floor(rand() * two.length)];
      for (const depth of [3, 5, 7, 9]) {
        const P = mkProblem({ id: 'gr-' + seed, kind: 'capture', rows: boardRows(b), targets: [name(g.p)], depth, unit: 'scala', generated: true });
        const cm = correctMoves(P, P.board);
        if (cm.length === 0) continue;
        if (cm.length > 2) break;
        // too easy if both liberties work
        if (g.libs.every(l => cm.includes(l))) break;
        P.depth = depth + 4; P.diff = 3 + depth / 3;
        return P;
      }
    }
  }
  return null;
}


// ===== Monte Carlo player / analyser =====
function playout(b, rand, firstPlay, maxMoves) {
  const n = b.n, W = b.W, cells = b.cells;
  const pts = [];
  for (let p = 0; p < cells.length; p++) if (cells[p] !== EDGE) pts.push(p);
  let passes = b.passes, moves = 0;
  while (passes < 2 && moves < maxMoves) {
    const c = b.toMove;
    let played = false;
    // 1) capture / escape heuristics around the last move
    if (b.last !== PASS && rand() < 0.9) {
      const lp = b.last;
      for (let d = 0; d < 4 && !played; d++) {
        const q = lp + b.dirs[d];
        const v = cells[q];
        if (v === other(c)) { const g = b.group(q); if (g.libs.length === 1 && b.play(g.libs[0], c)) played = true; }
        else if (v === c) {
          const g = b.group(q);
          if (g.libs.length === 1) {
            const e = g.libs[0], t = b.clone();
            if (t.play(e, c) && t.group(e).libs.length >= 3 && b.play(e, c)) played = true;
          }
        }
      }
      if (!played && cells[lp] === other(c)) { const g = b.group(lp); if (g.libs.length === 1 && b.play(g.libs[0], c)) played = true; }
    }
    // 2) random move, not filling own eyes, avoid big self-atari
    if (!played) {
      let start = Math.floor(rand() * pts.length);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[(start + i) % pts.length];
        if (cells[p] !== EMPTY || p === b.ko) continue;
        if (b.isEyeish(p, c)) continue;
        if (!b.play(p, c)) continue;
        played = true; break;
      }
    }
    if (!played) { b.play(PASS, c); passes++; }
    else { passes = 0; if (firstPlay && firstPlay[b.last] === 0) firstPlay[b.last] = c; }
    moves++;
  }
  return b.areaScore();
}

class Analyser {
  constructor(board, color, komi, seed) {
    this.root = board; this.color = color; this.komi = komi;
    let s = (seed || Date.now()) >>> 0 || 7;
    this.rand = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
    this.moves = [];
    for (const p of board.emptyPoints()) {
      if (p === board.ko || board.isEyeish(p, color)) continue;
      if (!board.isLegal(p, color)) continue;
      this.moves.push({ p, n: 0, w: 0, an: 0, aw: 0 });
    }
    this.index = new Map(this.moves.map(m => [m.p, m]));
    this.own = new Float32Array(board.cells.length);
    this.total = 0; this.wins = 0;
  }
  value(m, logN) {
    const beta = m.an / (m.n + m.an + 4 * m.n * m.an * 0.0025 + 1e-9);
    const mc = m.n ? m.w / m.n : 0.5, amaf = m.an ? m.aw / m.an : 0.5;
    const v = (1 - beta) * mc + beta * amaf;
    return v + Math.sqrt(0.08 * logN / (m.n + 1));
  }
  step(k) {
    const { root, color, komi } = this;
    const size = root.cells.length;
    for (let it = 0; it < k; it++) {
      if (!this.moves.length) return;
      const logN = Math.log(this.total + 1);
      let best = null, bv = -1;
      for (const m of this.moves) { const v = this.value(m, logN); if (v > bv) { bv = v; best = m; } }
      const b = root.clone();
      b.play(best.p, color);
      const first = new Int8Array(size);
      first[best.p] = color;
      const sc = playout(b, this.rand, first, root.n * root.n * 3);
      const margin = sc.b - sc.w - komi;
      const win = (color === BLACK ? margin > 0 : margin < 0) ? 1 : 0;
      best.n++; best.w += win; this.total++; this.wins += win;
      for (const m of this.moves) if (first[m.p] === color) { m.an++; m.aw += win; }
      for (let p = 0; p < size; p++) { const o = sc.owner[p]; if (o === BLACK) this.own[p] += 1; else if (o === WHITE) this.own[p] -= 1; }
    }
  }
  ownership() { const t = Math.max(1, this.total); return Array.from(this.own, v => v / t); }
  ranked() {
    return this.moves.filter(m => m.n > 0).map(m => ({ p: m.p, n: m.n, wr: m.w / m.n }))
      .sort((a, b) => b.n - a.n || b.wr - a.wr);
  }
  winrate() { return this.total ? this.wins / this.total : 0.5; }
}

// run analyser asynchronously in slices
function analyseAsync(board, color, komi, playouts, onProgress) {
  const A = new Analyser(board, color, komi);
  return new Promise(resolve => {
    const slice = () => {
      const t0 = performance.now();
      while (A.total < playouts && performance.now() - t0 < 30 && A.moves.length) A.step(20);
      if (onProgress) onProgress(A);
      if (A.total >= playouts || !A.moves.length) resolve(A); else setTimeout(slice, 0);
    };
    setTimeout(slice, 0);
  });
}

// dead stones from ownership
function deadFromOwnership(board, own) {
  const dead = [];
  for (let p = 0; p < board.cells.length; p++) {
    const v = board.cells[p];
    if (v === BLACK && own[p] < -0.4) dead.push(p);
    else if (v === WHITE && own[p] > 0.4) dead.push(p);
  }
  return dead;
}

