// ===== Il 13×13 (il goban sul retro): problemi e lezioni =====
// I problemi sono quelli del catalogo 9×9, ruotati e messi nell'angolo in basso a sinistra di un 13×13.
// Sono stati tenuti solo quelli che il risolutore conferma: stesse mosse giuste e risolvibili fino in fondo
// (sul goban grande certe pietre trovano vie di fuga). Le scale sono escluse: lì cambiano del tutto.
const Q13 = [["opue88",0],["7hv3jh",0],["1lotxe2",0],["1uegve8",0],["ifdb5y",0],["1pgp0rp",0],["qatpuf",0],["1nl4ppw",0],["11ezuht",0],["qx784z",0],["r9ufaa",0],["jgplve",0],["1qhbb87",0],["102k2r8",0],["4k66cd",0],["v399fg",2],["pt839o",0],["8xo6ob",0],["1fczue9",0],["15kbs31",2],["e3dxk4",0],["30sgtx",0],["ew6sn0",0],["1p42kll",0],["4b79em",0],["m9pnpu",0],["15heu57",0],["kfnmj4",0],["1vmkzeg",0],["i1zeog",0],["13q7z6k",0],["qkqfsu",0],["fjsyu4",1],["zsgbwj",2],["175d5l9",0],["nl7bof",0],["18s3gjj",1],["1agg6hv",2],["1wm1tv0",3],["1sju042",0],["r8y8xh",0],["1qx0dsm",0],["qmvk18",2],["ak6few",2],["5th96e",0],["3dh6l",2],["11hb6a7",0],["1vivboo",0],["x256mw",1],["ujy67m",0],["1tzk0h6",3],["h8i2as",0],["2fwf4o",2],["r5324j",1],["1dx00v7",0],["1k0tzca",1],["cv3pfq",0],["1o3dys4",0],["w08dio",2],["1iav1uq",2],["1hm1kk9",3],["fdea55",0],["hwx4l2",0],["1b5q93p",0],["1pncj2i",1],["1ye1fo",2],["1x1cls6",2],["88io7i",0],["t129e9",1],["1vtb6sa",0],["lhdk5g",2],["9nus9x",3],["1z10kpq",3],["1ol2obe",1],["1mrpgll",0],["1mrnqv8",2],["1mvonjf",0],["59yln0",0],["fjr24c",2],["1va9i8p",0],["1ghbicr",2],["1y5mwxo",0],["1jcoi8z",0],["1qx0hld",2],["157y17t",2],["halq3",2],["11ghsse",0],["k7genn",0],["1xg8eek",0],["1g71ugd",1],["paz8de",2],["116ne9a",2],["1es2i1g",0],["5vh4ub",1],["1tufufc",2],["1sbh09c",0],["mww0yc",0],["8khmfx",0],["1yjt4jv",1],["1kunkrp",3],["1tpyu9g",3],["16a6rsk",1],["at8fpw",0],["fa1xsh",0],["1djqyn8",0],["j6ecdy",0],["16vvlf",2],["15wjmmu",0],["1l4m2gd",0],["dto4cx",0],["1xh6hug",2],["1sfywq2",3],["o2wzw6",2],["uh7n5t",1],["nuijee",0],["iom3g0",0],["199u8r6",2],["1bwxwyv",2],["dnwv2e",2],["18wgzew",1],["1l5v2u3",0],["1ykb0u1",0],["1sgj8ga",0],["1ym7f6u",0],["1i63pvz",0],["1fbz7av",0],["1i2gwuu",0],["afv4bi",0],["146d710",0],["1ybno27",0],["9n7bk0",0],["1plkx8b",0],["onr99x",0],["ge7jo0",0],["1w4zvhr",0],["k4uva5",0],["19wc55v",0],["jikvs5",0],["yc4n0y",0],["1e9k98e",0],["vy5a6",0],["3o61xr",0],["13gkc79",0],["1vs2851",0],["2cjyxh",0],["2ama4m",0],["eigok7",0],["o64lcu",0],["m1tbgf",0],["19b21rr",0],["1ir7tsl",0],["1g5ny26",0],["1lduhwo",0],["1yoiw02",0],["806eon",0],["16ol4ai",0],["nw2t61",0],["1y6o6rq",0],["uj2mse",0],["17dkrpd",0]];
const CATALOG13 = Q13.map(([id, s]) => { const e = CATALOG[CAT_INDEX.get(id)]; return e ? { id: id + 'q', base: id, s, t: e.t, k: e.k } : null; }).filter(Boolean);
const CAT13_INDEX = new Map(CATALOG13.map((e, i) => [e.id, i]));
function embed13(rows9) { const out = []; for (let i = 0; i < 4; i++) out.push('.'.repeat(13)); for (const r of rows9) out.push(r + '....'); return out; }
// 'q:<id>:<k>': il problema 13×13, mostrato in una delle 8 rotazioni del goban (k) perché non stia sempre nello stesso angolo
function q13Problem(id, k) {
  const q = CATALOG13[CAT13_INDEX.get(id)]; if (!q) return null;
  const e = CATALOG[CAT_INDEX.get(q.base)], s = q.s;
  const rows = symRows(embed13(symRows(e.r.split('/'), s)), k);
  const map = c => symCoord(13, symCoord(9, c, s), k);
  const P = mkProblem({ id: q.id, kind: { c: 'capture', s: 'save', k: 'kill', l: 'live' }[e.K], rows, targets: e.T.split(' ').map(map), region: e.g ? e.g.split(' ').map(map) : null, depth: e.d, rating: e.k + 40, unit: THEMES[e.t].unit });
  P.ref = 'q:' + q.id; P.theme = e.t; return P;
}
{ const base = buildProblem; buildProblem = function (ref) { if (ref.startsWith('q:')) { const [, id, k] = ref.split(':'); return q13Problem(id, +k || 0); } return base(ref); }; }
const Q13S = (theme, i) => { const l = CATALOG13.filter(q => q.t === theme).sort((a, b) => a.k - b.k); return 'q:' + l[Math.min(i || 0, l.length - 1)].id + ':' + ((i || 0) % 8); };
function R13(list) {
  const n = 13, g = [];
  for (let y = 0; y < n; y++) g.push(Array(n).fill('.'));
  for (const [c, v] of list) { const x = COLS.indexOf(c[0]), y = n - parseInt(c.slice(1), 10); g[y][x] = v; }
  return g.map(r => r.join(''));
}

const TREDICI = [
  {
    id: 'tredici', cap: 6, before: 'angoli19', title: 'Il goban del retro', summary: 'Il 13×13: a metà strada.',
    lesson: [
      ST.info('A metà strada', 'Il 13×13 sta tra il 9×9 e il goban vero. Una partita dura mezz\'ora; gli angoli contano come sul 19×19, ma i gruppi si toccano presto e la tattica arriva subito. I pallini sono quattro hoshi sul 4-4 e il tengen al centro.', R13([]), { marks: { D4: 'circle', K4: 'circle', D10: 'circle', K10: 'circle', G7: 'sq' } }),
      ST.pick('Prova', 'Tocca il tengen, il punto al centro.', R13([]), ['G7'], { wrong: 'Il centro esatto: settima colonna, settima riga.', good: 'Esatto: G7. Sul 9×9 era E5, sul 19×19 è K10.' }),
      ST.info('Pietre di vantaggio', 'Sul 13×13 le pietre di vantaggio vanno sugli stessi punti: con due, due hoshi opposti; con tre e quattro, gli altri angoli; la quinta va al tengen. Poi muove il bianco, con komi di mezzo punto.', R13([['D4', 'X'], ['K4', 'X'], ['D10', 'X'], ['K10', 'X']])),
    ],
    problems: [],
  },
  {
    id: 'apertura13', cap: 6, before: 'angoli19', title: 'Aprire sul 13×13', summary: 'Angoli, poi lati, presto il centro.',
    lesson: [
      ST.info('Prima gli angoli', 'Anche qui si comincia dagli angoli: lì bastano poche pietre per circondare spazio. Sul 13×13 gli angoli sono quattro e si prendono in fretta.', null),
      ST.seq('Un\'apertura semplice', 'Cinque mosse, tutte naturali.', R13([]), BLACK, [
        ['K10', 'Il nero prende un angolo sul 4-4.'], ['D4', 'Il bianco prende l\'angolo opposto.'], ['D10', 'Il nero prende un secondo angolo, dalla stessa parte del primo.'], ['K4', 'Il bianco fa lo stesso in basso.'],
        ['G10', 'Il nero si mette sul lato in alto, tra i suoi due angoli: ora quel lato è un\'area sua, da allargare verso il centro.'],
      ]),
      ST.info('Poi i lati, presto il centro', 'Dopo gli angoli vengono i lati. Sul 13×13 i lati sono corti, quindi il centro arriva prima che sul 19×19: chi lo trascura si ritrova chiuso. Una pietra sul lato vale di più se sta tra due tue, o se impedisce all\'avversario di fare lo stesso.', null),
      ST.info('Provalo', 'In Partita puoi scegliere il goban 13×13. Il computer lì pensa un po\' più a lungo ed è un po\' più debole: un buon avversario per cominciare.', null),
    ],
    problems: [],
  },
  {
    id: 'problemi13', cap: 6, before: 'angoli19', title: 'Tattica sul goban grande', summary: 'Più spazio, stessa tattica.',
    lesson: [
      ST.info('Più spazio', 'Sul goban grande le pietre hanno più spazio per scappare: un atari che sul 9×9 bastava, qui può non bastare. Questi problemi vengono dal catalogo, rimessi in un angolo del 13×13 e ricontrollati uno per uno.', null),
      ST.move('Prova', 'Cattura le pietre segnate.', Q13S('cattura', 2)),
      ST.move('Prova', 'Leggi prima di giocare: il bianco ha spazio.', Q13S('lettura', 3)),
      ST.move('Prova', 'Vita e morte in un angolo del 13×13.', Q13S('vivere', 1)),
    ],
    problems: CATALOG13.slice().sort((a, b) => a.k - b.k).filter((q, i, l) => i % Math.ceil(l.length / 10) === 0).map(q => ['q:' + q.id, 8]),
  },
];
(function () {
  const glossIds = GLOSSARY.map(g => g.unit !== undefined ? UNITS[g.unit].id : null);
  for (const U of TREDICI) { const at = UNITS.findIndex(x => x.id === U.before); UNITS.splice(at < 0 ? UNITS.length : at, 0, U); }
  GLOSSARY.forEach((g, i) => { if (glossIds[i]) g.unit = UNITS.findIndex(U => U.id === glossIds[i]); });
})();
