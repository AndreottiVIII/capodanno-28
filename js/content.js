// ===== Curriculum content =====
const E9 = '.........';
function rowsWith(list) { // list of [coord, 'X'|'O'] on 9x9
  const g = []; for (let y = 0; y < 9; y++) g.push(E9.split(''));
  for (const [c, v] of list) { const x = COLS.indexOf(c[0]), y = 9 - parseInt(c.slice(1), 10); g[y][x] = v; }
  return g.map(r => r.join(''));
}

// 8 symmetries for variety
function symCoord(n, s, k) {
  let x = COLS.indexOf(s[0]), y = n - parseInt(s.slice(1), 10);
  const m = n - 1;
  if (k & 1) x = m - x;
  if (k & 2) y = m - y;
  if (k & 4) { const t = x; x = y; y = t; }
  return COLS[x] + (n - y);
}
function symRows(rows, k) {
  const n = rows.length, m = n - 1, out = [];
  for (let y = 0; y < n; y++) out.push(Array(n).fill('.'));
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let X = x, Y = y;
    if (k & 1) X = m - X;
    if (k & 2) Y = m - Y;
    if (k & 4) { const t = X; X = Y; Y = t; }
    out[Y][X] = rows[y][x];
  }
  return out.map(r => r.join(''));
}

const CURATED = {
  cap1: { kind: 'capture', rows: rowsWith([['E6', 'X'], ['D5', 'X'], ['E4', 'X'], ['E5', 'O']]), targets: ['E5'], depth: 0, rating: 60, unit: 'cattura' },
  cap2: { kind: 'capture', rows: rowsWith([['B1', 'X'], ['C2', 'X'], ['D2', 'X'], ['C1', 'O'], ['D1', 'O'], ['G5', 'O'], ['F4', 'X']]), targets: ['C1'], depth: 0, rating: 90, unit: 'cattura' },
  cap3: { kind: 'capture', rows: rowsWith([['A9', 'O'], ['B9', 'X'], ['B8', 'X'], ['E6', 'O'], ['F5', 'X'], ['D5', 'X']]), targets: ['A9'], depth: 0, rating: 110, unit: 'cattura' },
  cap4: { kind: 'capture', rows: rowsWith([['D5', 'O'], ['E5', 'O'], ['C5', 'X'], ['D6', 'X'], ['E6', 'X'], ['F5', 'X'], ['D4', 'X'], ['G3', 'O']]), targets: ['D5'], depth: 0, rating: 140, unit: 'cattura' },
  sui1: { kind: 'capture', rows: rowsWith([['E7', 'X'], ['D6', 'X'], ['F6', 'X'], ['E6', 'O'], ['D5', 'O'], ['F5', 'O'], ['E4', 'O']]), targets: ['E6'], depth: 0, rating: 220, unit: 'regole' },
  save1: { kind: 'save', rows: rowsWith([['E5', 'X'], ['D5', 'O'], ['F5', 'O'], ['E6', 'O']]), targets: ['E5'], depth: 12, rating: 150, unit: 'salvare' },
  save2: { kind: 'save', rows: rowsWith([['E5', 'X'], ['G5', 'X'], ['F6', 'X'], ['D5', 'O'], ['E6', 'O'], ['F5', 'O'], ['D4', 'O'], ['E3', 'O']]), targets: ['E5'], depth: 12, rating: 260, unit: 'salvare' },
  lad1: { kind: 'capture', rows: rowsWith([['D7', 'X'], ['E7', 'X'], ['C6', 'X'], ['D6', 'O']]), targets: ['D6'], depth: 20, rating: 380, unit: 'scala' },
  dbl1: { kind: 'capture', rows: rowsWith([['D7', 'X'], ['C6', 'X'], ['F7', 'X'], ['G6', 'X'], ['D6', 'O'], ['F6', 'O']]), targets: ['D6', 'F6'], depth: 2, rating: 430, unit: 'rete' },
  net1: { kind: 'capture', rows: rowsWith([['D6', 'X'], ['E6', 'X'], ['F6', 'X'], ['F4', 'X'], ['E5', 'O']]), targets: ['E5'], depth: 9, rating: 480, unit: 'rete' },
  net2: { kind: 'capture', rows: rowsWith([['F6', 'X'], ['F5', 'X'], ['D4', 'X'], ['E3', 'X'], ['E5', 'O']]), targets: ['E5'], depth: 9, rating: 520, unit: 'rete' },
};
const SHAPES = {
  st3k: { cells: [[2, 8], [3, 8], [4, 8]], kind: 'kill', rating: 520, name: 'tre in fila' },
  st3l: { cells: [[2, 8], [3, 8], [4, 8]], kind: 'live', rating: 520, name: 'tre in fila' },
  be3k: { cells: [[2, 8], [3, 8], [3, 7]], kind: 'kill', rating: 560, name: 'tre piegate' },
  be3l: { cells: [[2, 8], [3, 8], [3, 7]], kind: 'live', rating: 560, name: 'tre piegate' },
  py4k: { cells: [[2, 8], [3, 8], [4, 8], [3, 7]], kind: 'kill', rating: 620, name: 'quattro a piramide' },
  py4l: { cells: [[2, 8], [3, 8], [4, 8], [3, 7]], kind: 'live', rating: 620, name: 'quattro a piramide' },
  bu5k: { cells: [[3, 8], [4, 8], [3, 7], [4, 7], [5, 8]], kind: 'kill', rating: 700, name: 'cinque a grappolo' },
  cr5k: { cells: [[3, 8], [2, 7], [3, 7], [4, 7], [3, 6]], kind: 'kill', rating: 680, name: 'cinque a croce' },
  cr5l: { cells: [[3, 8], [2, 7], [3, 7], [4, 7], [3, 6]], kind: 'live', rating: 680, name: 'cinque a croce' },
};

// problem reference: 'c:<id>:<sym>' | 's:<id>:<sym>' | 'g:<type>:<seed>'
function buildProblem(ref) {
  const [t, a, b] = ref.split(':');
  if (t === 'c') {
    const d = CURATED[a], k = +b || 0;
    const P = mkProblem({ id: a, kind: d.kind, rows: symRows(d.rows, k), targets: d.targets.map(s => symCoord(9, s, k)), region: d.region ? d.region.map(s => symCoord(9, s, k)) : null, depth: d.depth, rating: d.rating, unit: d.unit });
    P.ref = ref; return P;
  }
  if (t === 's') {
    const d = SHAPES[a], k = +b || 0;
    const base = shapeProblem(a, d.cells, d.kind, { rating: d.rating, unit: 'occhi', shapeName: d.name });
    const n = 9;
    const name = p => coordName(base.board, p);
    const P = mkProblem({ id: a, kind: d.kind, rows: symRows(boardRows(base.board), k), targets: base.targets.map(p => symCoord(n, name(p), k)), region: base.region.map(p => symCoord(n, name(p), k)), depth: base.depth, rating: d.rating, unit: 'occhi', shapeName: d.name });
    P.ref = ref; return P;
  }
  if (t === 'k') return catProblem(CAT_INDEX.has(a) ? CAT_INDEX.get(a) : -1);
  if (t === 'g') {
    const P = generate(a, +b);
    if (!P) return null;
    P.rating = Math.round((P.diff || 1) * 100) - 40; P.ref = ref; return P;
  }
  return null;
}

// Lesson step helpers
// ideas shown by the "Indizio" button and after solving
const IDEAS = {
  cap1: 'Conta le libertà del bianco: ne ha una sola. Occupala.',
  cap2: 'Due pietre in fila si comportano come una catena sola: conta le libertà dell\'intera catena, il bordo non ne dà.',
  cap3: 'Nell\'angolo una pietra ha solo due libertà: qui una è già tua.',
  cap4: 'Guarda la catena intera, non la singola pietra: dove sta la sua ultima libertà?',
  sui1: 'Una mossa senza libertà è permessa se cattura: cerca la pietra bianca già in atari.',
  save1: 'Allungati (nobi) nella direzione che ti dà più libertà. Dopo la mossa conta: servono almeno tre libertà.',
  save2: 'Allungarsi porta in un vicolo cieco. Guarda le pietre bianche vicine: una è in atari.',
  lad1: 'Scala: dai atari dal lato che spinge il bianco in diagonale verso il bordo, poi ripeti a zig-zag.',
  dbl1: 'Cerca un punto che tocchi due pietre bianche con due libertà ciascuna.',
  net1: 'Rete (geta): non inseguire. Chiudi a distanza la via di fuga che conta.',
  net2: 'Rete (geta): una mossa in diagonale, a un passo dal bianco, chiude tutte le uscite.',
  st3k: 'Tre in fila: il punto vitale è quello centrale.', st3l: 'Tre in fila: il punto centrale divide lo spazio in due occhi.',
  be3k: 'Tre piegate: il punto vitale è l\'angolo della piega.', be3l: 'Tre piegate: occupa l\'angolo della piega e hai due occhi.',
  py4k: 'Quattro a piramide: il punto vitale è quello che tocca gli altri tre.', py4l: 'Quattro a piramide: il punto che tocca gli altri tre fa tre occhi potenziali.',
  bu5k: 'Cinque a grappolo: cerca il punto che tocca il maggior numero di punti dello spazio.',
  cr5k: 'Cinque a croce: il centro della croce.', cr5l: 'Cinque a croce: il centro della croce crea quattro occhi potenziali.',
  capture1: 'Cerca la catena bianca con una sola libertà.',
  save: 'La tua catena è in atari. Prova ad allungarti e conta le libertà che ottieni; se non bastano, cerca una cattura.',
  read: 'Lettura: prova in testa ciascun atari possibile e segui la risposta del bianco finché è chiaro chi vince. A volte serve una rete invece di un atari.',
};
const THEMES = {
  cattura: { name: 'Cattura', jp: '', idea: 'Cerca la catena bianca con una sola libertà e occupala. Se ce ne sono più di una, prendi quella che salva le tue pietre o la più grande.', unit: 'cattura' },
  salvare: { name: 'Salvare le pietre', jp: '', idea: 'La tua catena è in atari. Prova ad allungarti e conta le libertà che ottieni: ne servono almeno tre. Se non bastano, cerca una pietra bianca da catturare.', unit: 'salvare' },
  lettura: { name: 'Lettura', jp: 'yomi', idea: 'Prova in testa ciascun atari possibile e segui la risposta del bianco finché è chiaro chi vince. Parti dall\'atari che lascia al bianco una sola via di fuga.', unit: 'scala' },
  scala: { name: 'Scala', jp: 'shicho', idea: 'Dai atari dal lato che spinge il bianco a zig-zag verso il bordo o verso le tue pietre. Prima di partire controlla la diagonale: non ci devono essere pietre bianche.', unit: 'scala' },
  rete: { name: 'Rete', jp: 'geta', idea: 'Invece di dare atari chiudi la fuga a distanza. Guarda da dove il bianco scapperebbe e blocca quella strada in anticipo.', unit: 'rete' },
  'doppio atari': { name: 'Doppio atari', jp: 'ryō-atari', idea: 'Cerca un punto che tolga una libertà a due catene bianche insieme, meglio se hanno solo due libertà ciascuna. Il bianco ne potrà salvare una sola.', unit: 'rete' },
  sacrificio: { name: 'Sacrificio', jp: 'sute-ishi', idea: 'La mossa giusta mette una tua pietra in atari di proposito. Chiediti: se il bianco la cattura, quante libertà gli restano dopo?', unit: 'rete' },
  uccidere: { name: 'Vita e morte: uccidere', jp: 'shikatsu', idea: 'Cerca il punto vitale dello spazio interno, quello che impedisce al bianco di dividerlo in due occhi. Se hai già una pietra dentro, chiediti come renderla utile.', unit: 'occhi' },
  vivere: { name: 'Vita e morte: vivere', jp: 'shikatsu', idea: 'Occupa il punto che divide lo spazio in due occhi. Se c\'è una pietra bianca dentro, valuta se catturarla o se basta chiudere lo spazio.', unit: 'occhi' },
};
// problemi tolti dal catalogo: scale e letture così lunghe che a metà il risolutore non trova più la mossa giusta
// (trovati dal collaudo tools/collaudo.js, che li risolve tutti fino in fondo)
const CAT_ESCLUSI = new Set(['1hqx3l7', '1tt1d5z', '1yqm1ha', '16thqh8', '7q7fbt', '11jhmbf', '1l57gg0', '1p0xeaf', '1kos846']);
for (let i = CATALOG.length - 1; i >= 0; i--) if (CAT_ESCLUSI.has(CATALOG[i].id)) CATALOG.splice(i, 1);
const CAT_INDEX = new Map(CATALOG.map((e, i) => [e.id, i]));
function catProblem(i) {
  const e = CATALOG[i]; if (!e) return null;
  const P = mkProblem({ id: 'k' + i, kind: { c: 'capture', s: 'save', k: 'kill', l: 'live' }[e.K], rows: e.r.split('/'), targets: e.T.split(' '), region: e.g ? e.g.split(' ') : null, depth: e.d, rating: e.k, unit: THEMES[e.t].unit });
  P.ref = 'k:' + (e.id || i); P.theme = e.t; P.shapeName = e.nm; P.catIndex = i; return P;
}
function themeOf(P) {
  if (P.theme) return P.theme;
  if (P.region) return P.kind === 'kill' ? 'uccidere' : 'vivere';
  const map = { cap1: 'cattura', cap2: 'cattura', cap3: 'cattura', cap4: 'cattura', sui1: 'cattura', save1: 'salvare', save2: 'salvare', lad1: 'scala', dbl1: 'doppio atari', net1: 'rete', net2: 'rete' };
  if (map[P.id]) return map[P.id];
  if (P.ref && P.ref[0] === 'g') return { capture1: 'cattura', save: 'salvare', read: 'lettura' }[P.ref.split(':')[1]];
  return null;
}
function ideaOf(P) { if (IDEAS[P.id]) return IDEAS[P.id]; if (P.theme && THEMES[P.theme]) return THEMES[P.theme].idea; if (P.ref && P.ref[0] === 'g') return IDEAS[P.ref.split(':')[1]]; return ''; }

// Lesson step helpers
const ST = {
  info: (title, text, rows, extra) => Object.assign({ type: 'info', title, text, rows }, extra || {}),
  points: (title, text, rows, answers, extra) => Object.assign({ type: 'points', title, text, rows, answers }, extra || {}),
  move: (title, text, ref, extra) => Object.assign({ type: 'move', title, text, ref }, extra || {}),
  pick: (title, text, rows, answers, extra) => Object.assign({ type: 'pick', title, text, rows, answers }, extra || {}),
  seq: (title, text, rows, toMove, moves, extra) => Object.assign({ type: 'seq', title, text, rows, toMove, moves }, extra || {}),
};
const R = rowsWith;
const LADDER = [['D5', 'Atari da sotto. Il bianco ha una sola uscita: E6.'], ['E6', 'Il bianco si allunga (nobi): ora ha due libertà, F6 ed E5.'], ['F6', 'Nuovo atari, dal lato che lo spinge in diagonale.'], ['E5', 'Il bianco scappa ancora: di nuovo due libertà.'], ['E4', 'Lo schema si ripete: atari, allungamento, atari.'], ['F5', ''], ['G5', ''], ['F4', ''], ['F3', ''], ['G4', 'La catena bianca cresce ma ha sempre solo due libertà.'], ['H4', ''], ['G3', ''], ['G2', ''], ['H3', ''], ['J3', 'Il bordo ora fa da muro.'], ['H2', ''], ['J2', ''], ['H1', 'Il bianco è schiacciato nell\'angolo.'], ['G1', 'Atari contro l\'angolo: l\'ultima libertà è J1 e il bianco non può giocarci (sarebbe suicidio).'], ['pass', 'Il bianco non ha mosse utili.'], ['J1', 'Cattura: tutta la catena esce dal goban.']];

const UNITS = [
  {
    id: 'liberta', title: 'Pietre e libertà', summary: 'Il goban, le pietre, le libertà.',
    lesson: [
      ST.info('Il goban', 'Il go si gioca sulle intersezioni del goban, non nelle caselle. Il nero muove per primo, poi a turno. Una pietra giocata non si sposta più: può solo essere catturata. Sul 9×9 ci sono 81 intersezioni.', R([['E5', 'X'], ['C7', 'O'], ['G3', 'X']])),
      ST.info('Libertà', 'Le libertà di una pietra sono le intersezioni vuote collegate a lei da una linea. Al centro sono 4, sul bordo 3, nell\'angolo 2. Il bordo toglie libertà: per questo le pietre sul bordo si catturano più facilmente.', R([['E5', 'X'], ['A5', 'X'], ['J1', 'X']]), { libsOf: ['E5', 'A5', 'J1'] }),
      ST.points('Prova', 'Tocca tutte le libertà della pietra nera. La pietra bianca accanto ne occupa una.', R([['C3', 'X'], ['D3', 'O']]), ['C4', 'B3', 'C2']),
      ST.info('Catena', 'Pietre dello stesso colore che si toccano lungo le linee formano una catena: condividono le libertà e vivono o muoiono insieme. In diagonale non sono collegate: tra loro restano due punti di taglio.', R([['D5', 'X'], ['E5', 'X'], ['E4', 'X'], ['G6', 'X'], ['F7', 'X']]), { libsOf: ['D5'] }),
      ST.points('Prova', 'Questa catena nera ha 4 libertà. Toccale tutte.', R([['D5', 'X'], ['E5', 'X'], ['F5', 'X'], ['D6', 'O'], ['E6', 'O'], ['F4', 'O'], ['G5', 'O']]), ['C5', 'D4', 'E4', 'F6']),
      ST.info('Perché conta', 'Regola pratica per tutto il resto del percorso: prima di ogni mossa conta le libertà delle catene vicine, tue e dell\'avversario. Una libertà: pericolo immediato. Due: sotto pressione. Tre o più: di solito respira.', null),
    ],
    problems: [],
  },
  {
    id: 'cattura', title: 'Atari e cattura', summary: 'Togliere l\'ultima libertà.',
    lesson: [
      ST.info('Atari', 'Una catena con una sola libertà è in atari. Se l\'avversario occupa quella libertà la cattura: le pietre escono dal goban e contano come prigionieri. Qui il bianco è in atari: l\'ultima libertà è segnata.', R([['E6', 'X'], ['D5', 'X'], ['E4', 'X'], ['E5', 'O']]), { marks: { F5: 'tri' } }),
      ST.move('Prova', 'Il bianco è in atari. Catturalo.', 'c:cap1:0'),
      ST.info('Ponnuki', 'Dopo la cattura di una pietra resta un rombo di quattro pietre attorno a un punto vuoto: si chiama ponnuki. È una delle forme più solide del go, perché non ha punti deboli e guarda in tutte le direzioni.', R([['E6', 'X'], ['D5', 'X'], ['E4', 'X'], ['F5', 'X']]), { marks: { E5: 'circle' } }),
      ST.move('Prova', 'Anche due pietre si catturano togliendo l\'ultima libertà della catena. Il bordo non ne dà.', 'c:cap2:0'),
      ST.info('Direzione dell\'atari', 'Un atari non è buono per forza. Se spinge l\'avversario verso il centro o verso le sue pietre, lo aiuti a rafforzarsi. Dai atari dal lato che lo spinge verso il bordo o verso le tue pietre, e chiediti sempre: dopo la sua risposta, quante libertà avrà?', null),
      ST.info('Atari Go', 'Il gioco "vince chi cattura per primo" (Atari Go) allena proprio questo: contare libertà e scegliere la direzione. Lo trovi in Partita, su un goban 7×7.', null),
    ],
    problems: [['c:cap1', 4], ['c:cap2', 4], ['c:cap3', 4], ['c:cap4', 4], ['g:capture1', 6]],
  },
  {
    id: 'salvare', title: 'Salvare le pietre', summary: 'Allungarsi, catturare, lasciar andare.',
    lesson: [
      ST.info('Due strade', 'Se una tua catena è in atari hai due modi per salvarla: allungarti (nobi) sulla sua ultima libertà per guadagnarne altre, oppure catturare una pietra avversaria che la stringe.', null),
      ST.move('Prova', 'La pietra nera è in atari. Salvala.', 'c:save1:0'),
      ST.info('Conta dopo', 'Allungarsi funziona se dopo la mossa hai almeno tre libertà. Con due sei di nuovo sotto attacco e spesso finisci in una scala. Quindi la domanda giusta è: dove sarò dopo la mia mossa?', null),
      ST.move('Prova', 'Qui allungarsi porta in un vicolo cieco. Trova la mossa che salva il nero.', 'c:save2:0'),
      ST.info('Lasciar andare', 'Non tutte le pietre vanno salvate. Una pietra che non taglia nulla e non protegge territorio, se la allunghi, regala all\'avversario un attacco con guadagno. Salva le pietre che tagliano o che difendono il tuo spazio; le altre sono sacrificabili.', null),
    ],
    problems: [['c:save1', 4], ['c:save2', 4], ['g:save', 8]],
  },
  {
    id: 'regole', title: 'Mosse vietate e ko', summary: 'Suicidio e ripetizione.',
    lesson: [
      ST.info('Suicidio', 'Non puoi giocare una pietra che resterebbe senza libertà: è un suicidio, vietato. Il punto segnato è vietato al nero.', R([['E6', 'O'], ['D5', 'O'], ['F5', 'O'], ['E4', 'O']]), { marks: { E5: 'x' } }),
      ST.move('Eccezione', 'Se la tua mossa cattura, è permessa: le pietre catturate liberano spazio e la tua pietra ottiene libertà. Gioca la mossa che sembra suicida.', 'c:sui1:0'),
      ST.seq('Ko', 'Una situazione di ko, mossa per mossa.', R([['D6', 'X'], ['C5', 'X'], ['D4', 'X'], ['E5', 'X'], ['E6', 'O'], ['F5', 'O'], ['E4', 'O'], ['H3', 'O'], ['H2', 'X'], ['G3', 'X']]), WHITE, [
        ['D5', 'Il bianco cattura la pietra E5. La sua pietra D5 ha ora una sola libertà: proprio E5.'],
        ['H4', 'Il nero vorrebbe riprendere subito in E5, ma la posizione si ripeterebbe identica: è vietato. Gioca prima una minaccia di ko (ko-date): atari su H3.'],
        ['J3', 'Il bianco risponde e salva H3. Nel frattempo la posizione è cambiata.'],
        ['E5', 'Ora il nero può riprendere il ko. Adesso tocca al bianco cercare una minaccia prima di riprendere.'],
      ]),
      ST.pick('Prova', 'Il bianco ha appena catturato in ko. Dove non può giocare il nero in questo momento?', R([['D6', 'X'], ['C5', 'X'], ['D4', 'X'], ['E6', 'O'], ['F5', 'O'], ['E4', 'O'], ['D5', 'O']]), ['E5'], { wrong: 'Lì il nero può giocare. Cerca il punto dove è appena stata catturata una pietra.' }),
      ST.info('Valore del ko', 'Un ko si vince con le minacce: chi ne ha di più grosse alla fine riprende e chiude. Per ora ti basta riconoscerlo e ricordare la regola: dopo una presa in ko, prima si gioca altrove.', null),
    ],
    problems: [['c:sui1', 4], ['g:capture1', 4]],
  },
  {
    id: 'scala', title: 'La scala', summary: 'Atari a zig-zag verso il bordo.',
    lesson: [
      ST.info('Cos\'è', 'La scala (shicho) è una sequenza di atari che costringe una catena a scappare a zig-zag. Ogni volta che si allunga ottiene solo due libertà, e il nero le toglie una di nuovo. Se sul percorso non c\'è niente, la scala arriva al bordo e cattura tutto.', null),
      ST.seq('Sequenza', 'Una scala completa. Guarda come il bianco non supera mai due libertà.', R([['D7', 'X'], ['E7', 'X'], ['C6', 'X'], ['D6', 'O']]), BLACK, LADDER),
      ST.move('Prova', 'Ora tocca a te: metti il bianco in atari dal lato giusto e continua finché lo catturi.', 'c:lad1:0'),
      ST.seq('Scala rotta', 'Stessa posizione, ma il bianco ha una pietra in G3 sulla diagonale.', R([['D7', 'X'], ['E7', 'X'], ['C6', 'X'], ['D6', 'O'], ['G3', 'O']]), BLACK, [
        ['D5', 'Il nero parte con la scala come prima.'], ['E6', ''], ['F6', ''], ['E5', ''], ['E4', ''], ['F5', ''], ['G5', ''], ['F4', 'Guarda dove sta andando la catena bianca.'], ['F3', 'Atari...'],
        ['G4', '...ma il bianco si collega a G3 (il rompiscala) e sale a tre libertà. La scala è fallita, e le pietre nere a zig-zag sono piene di punti di taglio: ognuno può diventare un doppio atari.'],
      ]),
      ST.info('Come leggerla', 'Prima di iniziare una scala traccia con gli occhi la diagonale fino al bordo. Una pietra avversaria sul percorso la rompe; una tua la chiude prima. Se non sei sicuro, non iniziarla: una scala fallita costa più di quanto rende.', null),
    ],
    problems: [['c:lad1', 8], ['g:read', 10]],
  },
  {
    id: 'rete', title: 'Doppio atari, rete, presa di ritorno', summary: 'Catturare senza inseguire.',
    lesson: [
      ST.info('Doppio atari', 'Il doppio atari (ryō-atari) mette in atari due catene con una sola mossa. L\'avversario ne può salvare una sola: l\'altra la catturi. Si cerca un punto che tocchi due catene con due libertà ciascuna.', null),
      ST.seq('Sequenza', 'Due pietre bianche con due libertà ciascuna, e un punto in comune.', R([['D7', 'X'], ['C6', 'X'], ['F7', 'X'], ['G6', 'X'], ['D6', 'O'], ['F6', 'O']]), BLACK, [
        ['E6', 'Doppio atari: D6 e F6 hanno ora una libertà ciascuna.'], ['F5', 'Il bianco salva F6 allungandosi.'], ['D5', 'Il nero cattura D6.'],
      ]),
      ST.info('Rete', 'La rete (geta) chiude la fuga senza toccare la pietra. Invece di inseguire con gli atari, giochi a un passo di distanza, spesso in diagonale: il bianco sembra libero ma ogni uscita porta contro un muro.', null),
      ST.seq('Sequenza', 'Il bianco E5 ha tre libertà. Un atari lo farebbe scappare. Guarda la rete.', R([['D6', 'X'], ['E6', 'X'], ['F6', 'X'], ['F4', 'X'], ['E5', 'O']]), BLACK, [
        ['D4', 'Rete: il nero non tocca il bianco. Chiude la diagonale in basso a sinistra.'], ['D5', 'Il bianco prova a sinistra.'], ['C5', 'Bloccato.'], ['F5', 'Prova a destra.'], ['G5', 'Bloccato.'], ['E4', 'Prova in basso.'], ['E3', 'Cattura: ogni direzione finiva contro un muro.'],
      ]),
      ST.move('Prova', 'Getta la rete.', 'c:net2:0'),
      ST.info('Presa di ritorno', 'La presa di ritorno (uttegaeshi) sacrifica una pietra: l\'avversario la cattura, ma così facendo resta con una sola libertà, proprio dove era la tua pietra. Rigiochi lì e catturi tutto.', null),
      ST.seq('Sequenza', 'Il gruppo bianco ha due libertà, C1 e D1.', R([['B3', 'X'], ['C3', 'X'], ['D3', 'X'], ['A2', 'X'], ['E2', 'X'], ['A1', 'X'], ['E1', 'X'], ['B2', 'O'], ['C2', 'O'], ['D2', 'O'], ['B1', 'O']]), BLACK, [
        ['C1', 'Il nero butta dentro una pietra in C1: è in atari da sola, sembra un regalo.'], ['D1', 'Il bianco la cattura giocando D1...'], ['C1', '...ma ora tutto il gruppo bianco ha una sola libertà: C1. Il nero rigioca lì e cattura cinque pietre. Non è un ko, perché si catturano più pietre.'],
      ]),
    ],
    problems: [['c:dbl1', 8], ['c:net1', 8], ['c:net2', 8], ['g:read', 4]],
  },
  {
    id: 'collegare', title: 'Collegare e tagliare', summary: 'Catene forti e punti deboli.',
    lesson: [
      ST.info('Il principio', 'Una catena grande ha più libertà di tante pietre sparse, e le pietre separate si attaccano una alla volta. Collegare le tue e tagliare quelle avversarie è il cuore del go a ogni livello.', null),
      ST.pick('Prova', 'Due pietre in diagonale si possono separare. Tocca uno dei due punti di taglio.', R([['D5', 'X'], ['E4', 'X'], ['F5', 'O'], ['C4', 'O']]), ['D4', 'E5'], { wrong: 'Guarda i due punti vuoti che toccano entrambe le pietre nere.' }),
      ST.seq('Miai', 'Due punti di taglio: se il bianco ne prende uno, il nero prende l\'altro.', R([['D5', 'X'], ['E4', 'X'], ['F5', 'O'], ['C4', 'O']]), WHITE, [
        ['E5', 'Il bianco entra in uno dei punti di taglio.'], ['D4', 'Il nero chiude l\'altro: collegato. Due punti equivalenti di cui ne basta uno si dicono miai.'],
      ]),
      ST.info('Bocca di tigre', 'La bocca di tigre (kake-tsugi) è un collegamento elastico: se il bianco entra nel punto segnato, si mette da solo in atari e viene catturato.', R([['D5', 'X'], ['F5', 'X'], ['E4', 'X'], ['E7', 'O']]), { marks: { E5: 'tri' } }),
      ST.info('Bambù', 'Il collegamento a bambù (takefu): due coppie parallele con due punti vuoti in mezzo. Se il bianco ne occupa uno, il nero gioca l\'altro. È praticamente impossibile da tagliare.', R([['D5', 'X'], ['D4', 'X'], ['F5', 'X'], ['F4', 'X']]), { marks: { E5: 'tri', E4: 'tri' } }),
    ],
    problems: [['g:save', 6], ['g:read', 6]],
  },
  {
    id: 'occhi', title: 'Occhi: vita e morte', summary: 'Due occhi per vivere.',
    lesson: [
      ST.info('Due occhi', 'Un occhio è un punto vuoto circondato dalle tue pietre. Con due occhi veri un gruppo è vivo per sempre: il bianco dovrebbe giocare in entrambi nello stesso momento, e ciascuna mossa da sola sarebbe un suicidio.', R([['A3', 'X'], ['B3', 'X'], ['C3', 'X'], ['D3', 'X'], ['E3', 'X'], ['E2', 'X'], ['E1', 'X'], ['B1', 'X'], ['C2', 'X'], ['D2', 'X'], ['B2', 'X'], ['A2', 'X'], ['C1', 'X'], ['A4', 'O'], ['B4', 'O'], ['C4', 'O'], ['D4', 'O'], ['E4', 'O'], ['F4', 'O'], ['F3', 'O'], ['F2', 'O'], ['F1', 'O']]), { marks: { A1: 'circle', D1: 'circle' } }),
      ST.info('Occhio falso', 'Un occhio sul bordo è vero solo se anche i punti in diagonale sono tuoi. Qui il bianco in C2 rende falso l\'occhio B1: le pietre C1 e D1 sono in atari e per salvarle il nero deve riempire proprio B1.', R([['A2', 'X'], ['B2', 'X'], ['A1', 'X'], ['C1', 'X'], ['D1', 'X'], ['A3', 'X'], ['B3', 'X'], ['C2', 'O'], ['D2', 'O'], ['E1', 'O']]), { marks: { B1: 'circle', C2: 'x' } }),
      ST.info('Punto vitale', 'Se lo spazio interno è piccolo, decide un solo punto: il punto vitale (kyūsho). Se lo occupa chi difende, lo spazio si divide in due occhi. Se lo occupa chi attacca, resta un occhio solo e il gruppo muore.', null),
      ST.seq('Sequenza', 'Il bianco ha uno spazio di tre punti in fila. Il nero uccide.', boardRows(shapeProblem('x', [[2, 8], [3, 8], [4, 8]], 'kill', {}).board), BLACK, [
        ['D1', 'Punto vitale: il centro dei tre punti. Ora il bianco non può fare due occhi.'], ['C1', 'Il bianco prova comunque: ma così si toglie da solo una libertà.'], ['E1', 'Il nero occupa l\'ultima libertà e cattura tutto il gruppo.'],
      ]),
      ST.move('Prova', 'Tocca a te vivere, con tre punti piegati.', 's:be3l:0'),
      ST.info('Le forme da ricordare', 'Tre in fila, tre piegate, quattro a piramide, cinque a croce, cinque a grappolo: chi gioca per primo il punto vitale decide. Quattro in fila e quattro piegate sul lato sono vive da sole; quattro a quadrato è morta comunque.', null),
    ],
    problems: [['s:st3k', 8], ['s:st3l', 8], ['s:be3k', 8], ['s:be3l', 8], ['s:py4k', 8], ['s:py4l', 8], ['s:bu5k', 8], ['s:cr5k', 8], ['s:cr5l', 8]],
  },
  {
    id: 'territorio', title: 'Territorio e conteggio', summary: 'Come si vince una partita.',
    lesson: [
      ST.info('Lo scopo', 'Il go si vince circondando più spazio dell\'avversario. A fine partita si contano le pietre vive più le intersezioni vuote circondate (territorio, ji). Il bianco riceve 7 punti di compensazione, il komi, perché muove per secondo.', 'TERR', { overlay: true }),
      ST.pick('Prova', 'Un punto che tocca pietre di entrambi i colori non è di nessuno: si chiama dame. Tocca l\'unico punto neutro.', 'TERR', ['F5'], { wrong: 'Quel punto è circondato da un solo colore: è territorio.' }),
      ST.info('Fine partita', 'La partita finisce quando entrambi passano. Le pietre che non potrebbero vivere sono morte: vengono tolte e il loro spazio va all\'avversario. Prima di passare chiudi i confini aperti: quella fase si chiama yose.', null),
    ],
    problems: [],
  },
  {
    id: 'apertura', title: 'Aprire sul 9×9', summary: 'Angoli, lati, centro.',
    lesson: [
      ST.info('Angoli, lati, centro', 'Nell\'angolo servono meno pietre per circondare spazio, sul lato di più, al centro più di tutti. Per questo l\'apertura (fuseki) comincia dagli angoli.', null),
      ST.info('I punti di partenza', 'Sul 9×9 i punti segnati dai pallini sono i 3-3 (san-san), più il centro (tengen). I 3-4 (komoku) sono un passo più in là. Sul 19×19 invece i pallini degli angoli sono i 4-4 (hoshi).', R([]), { marks: { C3: 'circle', G7: 'circle', E5: 'sq', C4: 'tri', D3: 'tri' } }),
      ST.pick('Prova', 'Scegli una buona prima mossa sul 9×9.', R([]), ['E5', 'C3', 'C7', 'G3', 'G7', 'C4', 'D3', 'C6', 'D7', 'F3', 'G4', 'F7', 'G6', 'D4', 'F4', 'D6', 'F6'], { wrong: 'Troppo vicino al bordo: prima e seconda linea fanno poco territorio. Prova sulla terza o quarta linea, o al centro.', good: 'Ottima scelta: terza o quarta linea, o il tengen, sono le aperture classiche del 9×9.' }),
      ST.info('Sente e gote', 'Una mossa è sente se obbliga l\'avversario a rispondere: tieni l\'iniziativa. È gote se dopo tocca a lui scegliere dove giocare. Nelle prime partite cerca mosse che minacciano qualcosa, e rispondi solo alle minacce vere; per il resto gioca altrove (tenuki).', null),
      ST.info('Tre abitudini', 'Non riempire i tuoi occhi. Salva le pietre che tagliano e lascia andare quelle inutili. Prima di attaccare controlla le tue debolezze. In Partita puoi chiedere un suggerimento o una spiegazione a ogni mossa.', null),
    ],
    problems: [],
  },
];
const TERR_ROWS = ['....XO...', '....XO...', '....XO...', '....XO...', '....X.O..', '....XO...', '....XO...', '....XO...', '....XO...'];

// ===== Glossary =====
const G = (id, term, jp, cat, def, extra) => Object.assign({ id, term, jp, cat, def }, extra || {});
const GLOSSARY = [
  G('goban', 'Goban', '碁盤', 'Materiale', 'Il tavoliere. Il formato ufficiale è 19×19; 9×9 e 13×13 si usano per imparare e per partite veloci.', { alias: ['goban'] }),
  G('pietra', 'Pietra', 'go-ishi', 'Materiale', 'Le pedine del go. Si gioca sulle intersezioni e, una volta posate, non si spostano.', { alias: [] }),
  G('liberta', 'Libertà', '', 'Regole', 'Intersezione vuota collegata da una linea a una pietra o a una catena. Senza libertà una catena viene catturata.', { alias: ['libertà'], rows: R([['E5', 'X']]), libsOf: ['E5'], crop: [2, 2, 6, 6], unit: 0 }),
  G('catena', 'Catena', '', 'Regole', 'Pietre dello stesso colore collegate lungo le linee. Condividono le libertà e vengono catturate insieme.', { alias: ['catena', 'catene'], rows: R([['D5', 'X'], ['E5', 'X'], ['E4', 'X']]), libsOf: ['D5'], crop: [1, 2, 6, 7], unit: 0 }),
  G('gruppo', 'Gruppo', '', 'Regole', 'Più catene vicine che lavorano insieme anche senza essere collegate. Si parla di gruppo vivo o morto.', { alias: ['gruppo', 'gruppi'] }),
  G('atari', 'Atari', 'アタリ', 'Tattica', 'Una catena con una sola libertà: al prossimo turno può essere catturata.', { alias: ['atari'], rows: R([['E6', 'X'], ['D5', 'X'], ['E4', 'X'], ['E5', 'O']]), marks: { F5: 'tri' }, crop: [2, 2, 6, 6], unit: 1 }),
  G('cattura', 'Cattura', 'toru', 'Regole', 'Occupare l\'ultima libertà di una catena avversaria: le pietre escono dal goban e contano come prigionieri.', { alias: ['cattura', 'catturare', 'catturato', 'catturata', 'prigionieri'], unit: 1 }),
  G('ponnuki', 'Ponnuki', 'ポン抜き', 'Forme', 'Il rombo di quattro pietre che resta dopo la cattura di una pietra. Forma fortissima, senza punti deboli.', { alias: ['ponnuki'], rows: R([['E6', 'X'], ['D5', 'X'], ['E4', 'X'], ['F5', 'X']]), marks: { E5: 'circle' }, crop: [2, 2, 6, 6], unit: 1 }),
  G('suicidio', 'Suicidio', '', 'Regole', 'Giocare dove la propria pietra resterebbe senza libertà. È vietato, a meno che la mossa catturi.', { alias: ['suicidio'], rows: R([['E6', 'O'], ['D5', 'O'], ['F5', 'O'], ['E4', 'O']]), marks: { E5: 'x' }, crop: [2, 2, 6, 6], unit: 3 }),
  G('ko', 'Ko', 'コウ', 'Regole', 'Situazione in cui due giocatori potrebbero catturarsi a vicenda una pietra all\'infinito. Dopo una presa in ko l\'avversario deve giocare altrove prima di riprendere.', { alias: ['ko'], rows: R([['D6', 'X'], ['C5', 'X'], ['D4', 'X'], ['E6', 'O'], ['F5', 'O'], ['E4', 'O'], ['D5', 'O']]), marks: { E5: 'sq' }, crop: [1, 2, 6, 6], unit: 3 }),
  G('kodate', 'Minaccia di ko', 'ko-date', 'Regole', 'Mossa altrove che l\'avversario deve rispettare, giocata per poter riprendere il ko al turno successivo.', { alias: ['minaccia di ko', 'ko-date'], unit: 3 }),
  G('scala', 'Scala', 'shicho', 'Tattica', 'Serie di atari che spinge una catena a zig-zag. Se non incontra aiuti, finisce contro il bordo e la cattura.', { alias: ['scala', 'shicho'], rows: R([['D7', 'X'], ['E7', 'X'], ['C6', 'X'], ['D6', 'O']]), marks: { D5: 'tri' }, crop: [1, 1, 6, 6], unit: 4 }),
  G('rompiscala', 'Rompiscala', '', 'Tattica', 'Pietra sul percorso di una scala che la fa fallire, perché la catena in fuga si collega e guadagna libertà.', { alias: ['rompiscala'], unit: 4 }),
  G('geta', 'Rete', 'geta', 'Tattica', 'Mossa che chiude la fuga a distanza invece di dare atari. La catena sembra libera ma non ha via d\'uscita.', { alias: ['rete', 'geta'], rows: R([['D6', 'X'], ['E6', 'X'], ['F6', 'X'], ['F4', 'X'], ['E5', 'O']]), marks: { D4: 'tri' }, crop: [2, 2, 6, 6], unit: 5 }),
  G('ryoatari', 'Doppio atari', 'ryō-atari', 'Tattica', 'Una mossa che mette in atari due catene insieme: se ne può salvare una sola.', { alias: ['doppio atari', 'ryō-atari'], rows: R([['D7', 'X'], ['C6', 'X'], ['F7', 'X'], ['G6', 'X'], ['D6', 'O'], ['F6', 'O']]), marks: { E6: 'tri' }, crop: [1, 1, 7, 5], unit: 5 }),
  G('uttegaeshi', 'Presa di ritorno', 'uttegaeshi', 'Tattica', 'Sacrifichi una pietra: catturandola, l\'avversario resta con una sola libertà proprio in quel punto, e tu catturi tutto.', { alias: ['presa di ritorno', 'uttegaeshi'], unit: 5 }),
  G('damezumari', 'Mancanza di libertà', 'damezumari', 'Tattica', 'Quando una catena ha così poche libertà esterne che non riesce a fare mosse che altrimenti funzionerebbero, per esempio dare atari senza mettersi in atari.', { alias: ['damezumari', 'mancanza di libertà'] }),
  G('taglio', 'Taglio', 'kiri', 'Tattica', 'Mossa che separa due pietre avversarie collegate solo in diagonale o a distanza. Il punto dove succede è il punto di taglio.', { alias: ['taglio', 'tagliare', 'punto di taglio', 'punti di taglio'], rows: R([['D5', 'X'], ['E4', 'X']]), marks: { D4: 'x', E5: 'x' }, crop: [2, 2, 6, 6], unit: 6 }),
  G('miai', 'Miai', '見合い', 'Strategia', 'Due punti equivalenti: se l\'avversario ne prende uno, tu prendi l\'altro. Ne basta uno.', { alias: ['miai'], unit: 6 }),
  G('kaketsugi', 'Bocca di tigre', 'kake-tsugi', 'Forme', 'Tre pietre a forma di V attorno a un punto vuoto: chi entra lì finisce in atari. Collegamento elastico.', { alias: ['bocca di tigre', 'kake-tsugi'], rows: R([['D5', 'X'], ['F5', 'X'], ['E4', 'X']]), marks: { E5: 'tri' }, crop: [2, 2, 6, 6], unit: 6 }),
  G('takefu', 'Bambù', 'takefu', 'Forme', 'Due coppie di pietre parallele con due punti vuoti in mezzo. Se l\'avversario ne occupa uno, giochi l\'altro.', { alias: ['bambù', 'takefu'], rows: R([['D5', 'X'], ['D4', 'X'], ['F5', 'X'], ['F4', 'X']]), marks: { E5: 'tri', E4: 'tri' }, crop: [2, 2, 6, 6], unit: 6 }),
  G('nobi', 'Allungamento', 'nobi', 'Forme', 'Mossa in linea retta accanto a una propria pietra. È il modo base per guadagnare libertà.', { alias: ['allungamento', 'allungarsi', 'si allunga', 'nobi'], rows: R([['D4', 'X'], ['E4', 'O']]), marks: { D5: 'tri' }, crop: [2, 2, 6, 6], unit: 2 }),
  G('hane', 'Hane', 'ハネ', 'Forme', 'Mossa in diagonale da una propria pietra che gira intorno a una pietra avversaria a contatto. Blocca la sua crescita.', { alias: ['hane'], rows: R([['D4', 'X'], ['E4', 'O']]), marks: { E5: 'tri' }, crop: [2, 2, 6, 6] }),
  G('tsuke', 'Contatto', 'tsuke', 'Forme', 'Mossa appoggiata direttamente a una pietra avversaria isolata.', { alias: ['contatto', 'tsuke'], rows: R([['D5', 'O']]), marks: { E5: 'tri' }, crop: [2, 2, 6, 6] }),
  G('kosumi', 'Diagonale', 'kosumi', 'Forme', 'Mossa in diagonale da una propria pietra, senza pietre avversarie a contatto. Lenta ma solida: due punti di taglio in miai.', { alias: ['kosumi'], rows: R([['D4', 'X']]), marks: { E5: 'tri' }, crop: [2, 2, 6, 6] }),
  G('ikkentobi', 'Salto di uno', 'ikken tobi', 'Forme', 'Una pietra a distanza di un punto vuoto in linea retta. Veloce e difficile da tagliare.', { alias: ['salto di uno', 'ikken tobi'], rows: R([['D4', 'X']]), marks: { D6: 'tri' }, crop: [2, 2, 6, 6] }),
  G('keima', 'Salto del cavallo', 'keima', 'Forme', 'Una pietra piazzata come il cavallo degli scacchi. Veloce, ma si taglia più facilmente del salto di uno.', { alias: ['keima', 'salto del cavallo'], rows: R([['D4', 'X']]), marks: { E6: 'tri' }, crop: [2, 2, 6, 6] }),
  G('occhio', 'Occhio', 'me', 'Vita e morte', 'Punto vuoto circondato dalle pietre di un solo gruppo. Due occhi veri rendono un gruppo vivo per sempre.', { alias: ['occhio', 'occhi', 'due occhi'], unit: 7 }),
  G('kageme', 'Occhio falso', 'kageme', 'Vita e morte', 'Un punto che sembra un occhio ma dovrà essere riempito, perché l\'avversario controlla abbastanza punti in diagonale.', { alias: ['occhio falso'], rows: R([['A2', 'X'], ['B2', 'X'], ['A1', 'X'], ['C1', 'X'], ['D1', 'X'], ['A3', 'X'], ['B3', 'X'], ['C2', 'O'], ['D2', 'O'], ['E1', 'O']]), marks: { B1: 'circle', C2: 'x' }, crop: [0, 5, 5, 8], unit: 7 }),
  G('kyusho', 'Punto vitale', 'kyūsho', 'Vita e morte', 'Il punto che decide la vita o la morte di una forma: chi lo occupa per primo vince.', { alias: ['punto vitale'], unit: 7 }),
  G('shikatsu', 'Vita e morte', 'shikatsu', 'Vita e morte', 'Il tema di un gruppo che deve fare due occhi. I problemi su questo tema si chiamano tsumego.', { alias: ['vita e morte'], unit: 7 }),
  G('tsumego', 'Tsumego', '詰碁', 'Vita e morte', 'Problema di go, di solito di vita e morte: trova la mossa che vive o che uccide.', { alias: ['tsumego'] }),
  G('seki', 'Seki', 'セキ', 'Vita e morte', 'Due gruppi senza due occhi che condividono libertà: chi le riempie per primo si fa catturare, quindi nessuno gioca e vivono entrambi.', { alias: ['seki'] }),
  G('ji', 'Territorio', 'ji', 'Partita', 'Le intersezioni vuote circondate da un solo colore. Con le pietre vive, è ciò che si conta alla fine.', { alias: ['territorio'], unit: 8 }),
  G('dame', 'Dame', '駄目', 'Partita', 'Punto neutro, che tocca entrambi i colori. Non vale nulla per nessuno. In giapponese la stessa parola indica anche le libertà.', { alias: ['dame'], unit: 8 }),
  G('komi', 'Komi', 'コミ', 'Partita', 'Punti dati al bianco per compensare il vantaggio del nero, che muove per primo. Qui 7.', { alias: ['komi'], unit: 8 }),
  G('yose', 'Fine partita', 'yose', 'Partita', 'La fase in cui si chiudono i confini tra i territori, di solito in ordine di valore.', { alias: ['yose'], unit: 8 }),
  G('fuseki', 'Apertura', 'fuseki', 'Strategia', 'Le prime mosse della partita, in cui si occupano angoli e lati.', { alias: ['fuseki', 'apertura'], unit: 9 }),
  G('joseki', 'Joseki', '定石', 'Strategia', 'Sequenza standard in un angolo, considerata equa per entrambi. Da studiare dopo aver capito la tattica.', { alias: ['joseki'] }),
  G('sente', 'Sente', '先手', 'Strategia', 'Mossa che obbliga l\'avversario a rispondere: mantieni l\'iniziativa.', { alias: ['sente'], unit: 9 }),
  G('gote', 'Gote', '後手', 'Strategia', 'Mossa dopo la quale l\'avversario può giocare dove vuole: perdi l\'iniziativa.', { alias: ['gote'], unit: 9 }),
  G('tenuki', 'Tenuki', '手抜き', 'Strategia', 'Non rispondere alla mossa avversaria e giocare altrove.', { alias: ['tenuki'], unit: 9 }),
  G('sutei', 'Sacrificio', 'sute-ishi', 'Tattica', 'Pietra lasciata catturare di proposito, per guadagnare qualcosa di più: una cattura più grande, una forma migliore, l\'iniziativa.', { alias: ['sacrificio', 'sacrificare', 'sute-ishi'] }),
  G('yomi', 'Lettura', 'yomi', 'Tattica', 'Calcolare in testa le mosse successive, tue e dell\'avversario, prima di giocare. È l\'abilità che i problemi allenano.', { alias: ['lettura', 'leggendo', 'yomi'] }),
  G('tesuji', 'Tesuji', '手筋', 'Tattica', 'La mossa brillante e precisa di una situazione tattica: rete, presa di ritorno e punti vitali sono tesuji classici.', { alias: ['tesuji'] }),
  G('aji', 'Aji', '味', 'Strategia', 'Letteralmente "sapore": le possibilità residue in una posizione, per esempio un taglio che oggi non funziona ma domani potrebbe.', { alias: ['aji'] }),
  G('moyo', 'Moyo', '模様', 'Strategia', 'Un\'area ampia, non ancora chiusa, che potrebbe diventare territorio.', { alias: ['moyo'] }),
  G('hoshi', 'Hoshi', '星', 'Punti del goban', 'I punti segnati sul goban. Sul 19×19 negli angoli sono i 4-4; sul 9×9 cadono sui 3-3.', { alias: ['hoshi'], rows: R([]), marks: { C3: 'circle', G3: 'circle', C7: 'circle', G7: 'circle', E5: 'circle' }, unit: 9 }),
  G('sansan', 'San-san', '三々', 'Punti del goban', 'Il punto 3-3 dell\'angolo: terza linea da entrambi i bordi. Prende l\'angolo in modo sicuro.', { alias: ['san-san', '3-3'], rows: R([]), marks: { C3: 'circle' }, crop: [0, 4, 4, 8], unit: 9 }),
  G('komoku', 'Komoku', '小目', 'Punti del goban', 'Il punto 3-4 dell\'angolo.', { alias: ['komoku', '3-4'], rows: R([]), marks: { C4: 'tri', D3: 'tri' }, crop: [0, 4, 4, 8], unit: 9 }),
  G('tengen', 'Tengen', '天元', 'Punti del goban', 'Il punto centrale del goban. Sul 9×9 è E5 ed è una prima mossa molto usata.', { alias: ['tengen'], rows: R([]), marks: { E5: 'sq' }, unit: 9 }),
  G('nigiri', 'Nigiri', '握り', 'Partita', 'Il modo tradizionale di sorteggiare chi gioca nero: si indovina se le pietre in una mano sono pari o dispari.', { alias: ['nigiri'] }),
  G('kyu', 'Kyu e dan', '級 / 段', 'Partita', 'I gradi del go. Si parte da 30 kyu e si scende verso 1 kyu; poi si sale nei dan. Un kyu di differenza vale circa una pietra di handicap.', { alias: ['kyu', 'dan'] }),
];

