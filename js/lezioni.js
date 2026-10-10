// ===== Percorso esteso: sei capitoli, le dieci lezioni del dojo più quelle nuove =====
// Gli esercizi delle lezioni nuove vengono dal catalogo (già verificati dal risolutore);
// le posizioni nuove sono controllate da tools/verifica-lezioni (vedi README).

// 19×19: stesse coordinate (colonne senza la I, righe dal basso)
function R19(list) {
  const n = 19, g = [];
  for (let y = 0; y < n; y++) g.push(Array(n).fill('.'));
  for (const [c, v] of list) { const x = COLS.indexOf(c[0]), y = n - parseInt(c.slice(1), 10); g[y][x] = v; }
  return g.map(r => r.join(''));
}
// problemi del catalogo per tema e difficoltà, distribuiti in modo regolare
function K(theme, lo, hi, n) {
  const l = CATALOG.filter(e => e.t === theme && e.k >= lo && e.k <= hi).sort((a, b) => a.k - b.k || (a.id < b.id ? -1 : 1));
  const out = [];
  for (let i = 0; i < Math.min(n, l.length); i++) out.push(['k:' + l[Math.floor(i * l.length / n)].id, 1]);
  return out;
}
const KS = (theme, lo, hi, i) => K(theme, lo, hi, 12)[i || 0][0];

// posizioni nuove, nel formato dei problemi curati
Object.assign(CURATED, {
  // atari dal lato giusto: da D2 il bianco finisce sul bordo, da E1 scappa verso il centro
  dir1: { kind: 'capture', rows: R([['E2', 'O'], ['F2', 'X'], ['E3', 'X']]), targets: ['E2'], depth: 12, rating: 130, unit: 'cattura' },
  // corsa alle libertà: tre contro tre, muove il nero e vince. Si risolve nella zona delle sei libertà
  // (il risolutore tattico non prova a riempire le libertà dell'attaccante, quello di vita e morte sì)
  sem1: { kind: 'capture', rows: R([['A1', 'O'], ['A2', 'O'], ['A3', 'O'], ['A4', 'O'], ['A5', 'O'], ['B4', 'O'], ['B5', 'O'], ['C4', 'O'], ['C5', 'O'], ['C1', 'X'], ['C2', 'X'], ['C3', 'X'], ['D1', 'O'], ['D2', 'O'], ['D3', 'O'], ['D4', 'X'], ['E4', 'X'], ['F4', 'X'], ['F1', 'X'], ['F2', 'X'], ['F3', 'X']]), targets: ['D1'], region: ['B1', 'B2', 'B3', 'E1', 'E2', 'E3'], depth: 12, rating: 330, unit: 'lettura' },
});
const SEKI_ROWS = R([['A1', 'X'], ['A2', 'X'], ['A3', 'X'], ['A4', 'X'], ['B4', 'X'], ['C4', 'X'], ['B1', 'O'], ['B2', 'O'], ['B3', 'O'], ['C3', 'O'], ['D1', 'X'], ['D2', 'X'], ['D3', 'X'], ['D4', 'O'], ['E4', 'O'], ['E1', 'O'], ['E2', 'O'], ['E3', 'O']]);
const YOSE_ROWS = ['....XO...', '....XO...', '....XO...', '....X....', '....XO...', '....XO...', '....XO...', '....XO...', '....XO...'];

const NUOVE = [
  // ---------------- capitolo 2: tattica ----------------
  {
    id: 'direzione', cap: 2, after: 'cattura', title: 'L\'atari dal lato giusto', summary: 'Spingere verso il bordo, non verso il centro.',
    lesson: [
      ST.info('Dove lo spingi', 'Il bianco E2 ha due libertà, D2 ed E1. Un atari da E1 lo spinge verso il centro, dove trova spazio. Un atari da D2 lo spinge verso il bordo, dove le libertà finiscono.', R([['E2', 'O'], ['F2', 'X'], ['E3', 'X']]), { marks: { D2: 'tri', E1: 'x' } }),
      ST.move('Prova', 'Dai atari dal lato giusto e insegui il bianco fino a catturarlo.', 'c:dir1:0'),
      ST.info('La domanda da farsi', 'Prima di dare atari chiediti dove andrà l\'avversario. Va bene se finisce contro il bordo, in un angolo o contro le tue pietre forti. Va male se scappa verso il centro aperto o verso le sue pietre.', null),
      ST.move('Prova', 'Un altro bianco da catturare: guarda prima dove può scappare.', KS('cattura', 40, 120, 3)),
    ],
    problems: [['c:dir1', 8], ...K('cattura', 40, 220, 6)],
  },
  {
    id: 'taglio', cap: 2, after: 'collegare', title: 'Tagliare', summary: 'Separare le pietre avversarie.',
    lesson: [
      ST.info('I punti di taglio', 'Due pietre in diagonale non sono collegate: tra loro ci sono due punti vuoti. Se l\'avversario li occupa tutti e due, le separa. Qui il nero ha già preso D4.', R([['D5', 'O'], ['E4', 'O'], ['D4', 'X']]), { marks: { E5: 'x' } }),
      ST.pick('Prova', 'Taglia le due pietre bianche.', R([['D5', 'O'], ['E4', 'O'], ['D4', 'X']]), ['E5'], { wrong: 'Cerca il punto vuoto che tocca tutte e due le pietre bianche.', good: 'Tagliato: ora sono due pietre sole, ognuna con poche libertà.' }),
      ST.info('Quando tagliare', 'Un taglio crea due gruppi deboli da attaccare, ma divide anche le tue pietre. Taglia quando le tue pietre lì vicino sono forti; se sono deboli, prima collegale.', null),
      ST.move('Prova', 'Spesso il taglio prepara un doppio atari. Trova la mossa.', KS('doppio atari', 270, 400, 0)),
    ],
    problems: K('doppio atari', 270, 420, 8),
  },
  {
    id: 'semeai', cap: 2, after: 'taglio', title: 'Corsa alle libertà', summary: 'Chi resta senza libertà per primo.',
    lesson: [
      ST.info('Due gruppi stretti', 'Le tre pietre nere in C e le tre bianche in D si soffocano a vicenda e nessuna ha occhi. Vince chi toglie per primo l\'ultima libertà all\'altro. Si contano: il nero ha B1, B2, B3; il bianco E1, E2, E3. Tre a tre.', CURATED.sem1.rows, { libsOf: ['C1', 'D1'] }),
      ST.seq('Sequenza', 'Muove il nero: con libertà pari, vince chi comincia.', CURATED.sem1.rows, BLACK, [
        ['E1', 'Il nero toglie una libertà al bianco: ora 3 contro 2.'], ['B1', 'Il bianco risponde allo stesso modo: 2 contro 2.'], ['E2', 'Il bianco resta con una sola libertà: atari.'], ['B2', 'Il bianco mette in atari il nero, ma è tardi…'], ['E3', '…perché tocca al nero, che cattura per primo.'],
      ]),
      ST.move('Prova', 'Vinci la corsa: muovi tu.', 'c:sem1:1'),
      ST.info('Come si conta', 'Togli prima le libertà esterne dell\'avversario, quelle che solo lui ha. Le libertà in comune riempile per ultime: ognuna che riempi la togli anche a te. Se sei indietro di una libertà, non entrare nella corsa: cerca un\'altra strada.', null),
    ],
    problems: [['c:sem1', 8], ...K('lettura', 230, 360, 6)],
  },
  {
    id: 'sacrificio', cap: 2, after: 'semeai', title: 'Sacrificare', summary: 'Perdere una pietra per guadagnare di più.',
    lesson: [
      ST.info('Il sacrificio', 'A volte la mossa giusta mette una tua pietra in atari apposta. Se l\'avversario la cattura, deve chiudersi da solo, o resta con meno libertà di prima. Si chiama sacrificio (sute-ishi).', null),
      ST.move('Prova', 'Qui serve una pietra buttata dentro. Chiediti: se il bianco la cattura, quante libertà gli restano?', KS('sacrificio', 400, 560, 0)),
      ST.move('Prova', 'Un altro sacrificio.', KS('sacrificio', 400, 560, 4)),
      ST.info('Quando sacrificare', 'Le pietre che non tagliano e non difendono niente si possono lasciare andare. Se nel lasciarle guadagni una cattura più grande, una forma migliore o la mossa successiva, è un buon affare.', null),
    ],
    problems: K('sacrificio', 400, 620, 8),
  },
  {
    id: 'lettura', cap: 2, after: 'sacrificio', title: 'Leggere tre mosse', summary: 'Immaginare prima di giocare.',
    lesson: [
      ST.info('Leggere', 'Leggere vuol dire giocare nella testa: la tua mossa, la sua risposta più forte, la tua. Solo dopo tocchi il goban. Comincia sempre dalle mosse che obbligano: atari e catture.', null),
      ST.move('Prova', 'Prima di giocare, immagina come risponde il bianco.', KS('lettura', 230, 360, 0)),
      ST.move('Prova', 'Ancora: tre mosse nella testa, poi una sul goban.', KS('lettura', 230, 360, 5)),
      ST.info('Se non sei sicuro', 'Se dopo tre mosse non vedi come finisce, scegli la mossa che lascia più libertà alle tue pietre. Nei problemi puoi sbagliare: è il posto giusto per allenarsi.', null),
    ],
    problems: K('lettura', 230, 420, 8),
  },
  {
    id: 'rete2', cap: 2, after: 'lettura', title: 'Scala e rete: pratica', summary: 'Riconoscere quando inseguire e quando chiudere.',
    lesson: [
      ST.info('Scala o rete', 'Se la diagonale verso il bordo è libera, la scala funziona. Se c\'è una pietra avversaria sul percorso, serve la rete: chiudi a distanza invece di inseguire.', null),
      ST.move('Prova', 'Scala o rete? Guarda la diagonale.', KS('scala', 302, 380, 2)),
      ST.move('Prova', 'Qui la scala non basta.', KS('rete', 300, 440, 1)),
    ],
    problems: [...K('scala', 302, 420, 5), ...K('rete', 300, 480, 5)],
  },
  // ---------------- capitolo 3: vita e morte ----------------
  {
    id: 'occhifalsi', cap: 3, after: 'occhi', title: 'Occhi veri e falsi', summary: 'Riconoscere l\'occhio che non conta.',
    lesson: [
      ST.info('Occhio vero', 'Un occhio è vero se l\'avversario non può costringerti a riempirlo. Qui il nero ha due occhi veri, A1 e D1: è vivo per sempre.', R([['A3', 'X'], ['B3', 'X'], ['C3', 'X'], ['D3', 'X'], ['E3', 'X'], ['E2', 'X'], ['E1', 'X'], ['B1', 'X'], ['C2', 'X'], ['D2', 'X'], ['B2', 'X'], ['A2', 'X'], ['C1', 'X']]), { marks: { A1: 'circle', D1: 'circle' } }),
      ST.info('Occhio falso', 'Sul bordo bastano due pietre avversarie in diagonale per rendere falso un occhio. Qui il bianco C2 minaccia di catturare C1 e D1: per salvarle il nero deve riempire B1, e l\'occhio sparisce.', R([['A2', 'X'], ['B2', 'X'], ['A1', 'X'], ['C1', 'X'], ['D1', 'X'], ['A3', 'X'], ['B3', 'X'], ['C2', 'O'], ['D2', 'O'], ['E1', 'O']]), { marks: { B1: 'circle', C2: 'x' } }),
      ST.info('La regola dei diagonali', 'Al centro un occhio è falso se l\'avversario ha due dei quattro punti in diagonale. Sul bordo ne basta uno, nell\'angolo uno solo dei diagonali è sul goban e basta quello.', null),
      ST.move('Prova', 'Fai vivere il nero: servono due occhi veri.', KS('vivere', 500, 640, 0)),
    ],
    problems: K('vivere', 500, 660, 8),
  },
  {
    id: 'spazi4', cap: 3, after: 'occhifalsi', title: 'Spazi di quattro e cinque', summary: 'Le forme che vivono, quelle che muoiono.',
    lesson: [
      ST.info('Vivi da soli', 'Uno spazio interno di quattro punti in fila, o di quattro piegati a L, è vivo anche se l\'avversario gioca per primo: qualunque punto prenda, ne resta uno per fare due occhi.', null),
      ST.info('Morti comunque', 'Quattro punti a quadrato sono morti anche se tocca a te: non c\'è un punto che li divida in due occhi.', null),
      ST.info('Decide chi gioca prima', 'Quattro a piramide, cinque a croce e cinque a grappolo hanno un punto vitale: chi lo prende per primo decide se il gruppo vive o muore.', null),
      ST.move('Prova', 'Quattro a piramide: uccidi il bianco.', 's:py4k:0'),
      ST.move('Prova', 'Cinque a croce: fai vivere il nero.', 's:cr5l:0'),
    ],
    problems: [['s:py4k', 8], ['s:py4l', 8], ['s:cr5k', 8], ['s:cr5l', 8], ['s:bu5k', 8]],
  },
  {
    id: 'seki', cap: 3, after: 'spazi4', title: 'Il seki', summary: 'Quando nessuno può attaccare.',
    lesson: [
      ST.info('Vivi insieme', 'Il gruppo bianco in B e il gruppo nero in D non hanno occhi, ma condividono due libertà: C1 e C2. Chi ci gioca per primo si mette in atari da solo e viene catturato. Così nessuno gioca lì e vivono tutti e due: è un seki.', SEKI_ROWS, { marks: { C1: 'circle', C2: 'circle' } }),
      ST.seq('Che errore', 'Guarda cosa succede se il nero riempie una libertà in comune.', SEKI_ROWS, BLACK, [
        ['C1', 'Il nero gioca C1: ora il suo gruppo ha una sola libertà, C2.'], ['C2', 'Il bianco cattura quattro pietre. Il seki era un pareggio: rompendolo il nero ha perso tutto.'],
      ]),
      ST.info('Come si conta', 'Alla fine della partita i gruppi in seki sono vivi. Le libertà in comune non sono territorio di nessuno: restano dame.', null),
    ],
    problems: [],
  },
  {
    id: 'uccidere', cap: 3, after: 'seki', title: 'Uccidere un gruppo', summary: 'Rubare lo spazio degli occhi.',
    lesson: [
      ST.info('Due modi', 'Per uccidere un gruppo puoi stringere lo spazio dall\'esterno, di solito con una hane sul bordo, oppure giocare dentro, sul punto vitale. Spesso servono tutti e due, nell\'ordine giusto: prima stringi, poi entra.', null),
      ST.move('Prova', 'Uccidi il bianco.', KS('uccidere', 520, 660, 0)),
      ST.move('Prova', 'Ancora uno.', KS('uccidere', 520, 660, 6)),
    ],
    problems: K('uccidere', 520, 700, 8),
  },
  {
    id: 'vivere', cap: 3, after: 'uccidere', title: 'Vivere', summary: 'Allargarsi e dividere lo spazio.',
    lesson: [
      ST.info('Due modi', 'Per vivere puoi allargare lo spazio, prima che l\'avversario lo stringa, oppure prendere il punto vitale che lo divide in due occhi. Se l\'avversario ha già una pietra dentro, chiediti se puoi catturarla.', null),
      ST.move('Prova', 'Fai vivere il nero.', KS('vivere', 500, 680, 2)),
      ST.move('Prova', 'Ancora uno.', KS('vivere', 500, 680, 8)),
    ],
    problems: K('vivere', 500, 720, 8),
  },
  // ---------------- capitolo 4: forme ----------------
  {
    id: 'buoneforme', cap: 4, after: 'vivere', title: 'Le forme buone', summary: 'Ponnuki, bocca di tigre, salto di uno.',
    lesson: [
      ST.info('Perché la forma conta', 'Una buona forma usa poche pietre e ha molte libertà, senza punti deboli. Le tre più utili: il ponnuki, la bocca di tigre e il salto di uno.', R([['E6', 'X'], ['D5', 'X'], ['E4', 'X'], ['F5', 'X']]), { marks: { E5: 'circle' } }),
      ST.pick('Prova', 'Il nero ha una bocca di tigre. Tocca il punto dove il bianco non deve entrare.', R([['D5', 'X'], ['F5', 'X'], ['E4', 'X'], ['E7', 'O']]), ['E5'], { wrong: 'Cerca il punto vuoto in mezzo alle tre pietre nere.', good: 'Se il bianco entra in E5 è subito in atari: per questo la bocca di tigre è un collegamento.' }),
      ST.info('Il salto di uno', 'Due pietre a un punto di distanza sulla stessa linea si muovono veloci e sono difficili da tagliare: se l\'avversario entra in mezzo, di solito si mette in difficoltà da solo.', R([['D4', 'X'], ['D6', 'X']]), { marks: { D5: 'tri' } }),
    ],
    problems: [],
  },
  {
    id: 'triangolo', cap: 4, after: 'buoneforme', title: 'La forma cattiva', summary: 'Il triangolo vuoto.',
    lesson: [
      ST.info('Il triangolo vuoto', 'Tre pietre a L con il quarto punto vuoto lavorano in tre ma hanno le libertà di due. È la forma cattiva più comune: lenta e piena di libertà sprecate.', R([['D4', 'X'], ['E4', 'X'], ['D5', 'X']]), { marks: { E5: 'x' } }),
      ST.pick('Prova', 'Il nero vuole allungarsi verso l\'alto senza fare un triangolo vuoto. Dove gioca?', R([['D4', 'X'], ['E4', 'X'], ['F3', 'O'], ['C3', 'O']]), ['D5', 'E5', 'D6', 'E6'], { wrong: 'Verso l\'alto, staccato dal bordo: va bene anche saltare.', good: 'Bene: verso l\'alto, senza riempire l\'angolo della L.' }),
      ST.info('Quando va bene', 'Il triangolo vuoto non è sempre sbagliato: se serve a salvare pietre importanti o a tagliare, si gioca. Ma se ne vedi uno, chiediti se c\'era una mossa più leggera.', null),
    ],
    problems: [],
  },
  {
    id: 'hanetesta', cap: 4, after: 'triangolo', title: 'Hane alla testa', summary: 'Fermare due pietre dalla parte giusta.',
    lesson: [
      ST.info('La hane', 'Una hane è una mossa in diagonale che gira intorno a una pietra avversaria e la blocca. Il proverbio dice: hane alla testa di due pietre. Bloccate davanti, due pietre crescono male.', R([['D4', 'X'], ['E4', 'O']]), { marks: { E5: 'tri' } }),
      ST.pick('Prova', 'Le due pietre bianche in C guardano verso il centro. Gioca la hane alla loro testa.', R([['C3', 'O'], ['C4', 'O'], ['D3', 'X'], ['D4', 'X']]), ['C5'], { wrong: 'La testa è davanti, verso il centro del goban: in diagonale dalla tua pietra più alta.', good: 'Così il bianco è chiuso davanti e deve girare verso il bordo.' }),
      ST.info('Contatto', 'Quando l\'avversario si attacca a una tua pietra (tsuke), le risposte naturali sono due: la hane, che blocca, o l\'allungamento (nobi), che guadagna libertà. Prima di rispondere conta le libertà di tutti e due.', null),
    ],
    problems: K('salvare', 150, 300, 6),
  },
  // ---------------- capitolo 5: la partita ----------------
  {
    id: 'pensare', cap: 5, after: 'apertura', title: 'Come scegliere una mossa', summary: 'Quattro domande, sempre nello stesso ordine.',
    lesson: [
      ST.info('Le quattro domande', 'Prima di ogni mossa: 1) Ho una catena in atari o a due libertà? 2) Posso catturare qualcosa? 3) C\'è un gruppo debole, mio o suo? 4) Se è tutto tranquillo, dov\'è il punto più grande?', null),
      ST.move('Prova', 'Domanda numero uno: la tua catena è in pericolo?', 'c:save1:0'),
      ST.move('Prova', 'Domanda numero due: c\'è qualcosa da catturare?', 'c:cap4:0'),
      ST.info('In partita', 'In Partita puoi accendere il quiz A o B: ti propone due mosse e tu scegli. È un buon modo per allenare proprio queste domande.', null),
    ],
    problems: [['c:save1', 4], ['c:cap4', 4], ['g:save', 6], ['g:capture1', 6]],
  },
  {
    id: 'yose', cap: 5, after: 'pensare', title: 'Chiudere la partita', summary: 'I confini aperti valgono punti.',
    lesson: [
      ST.info('La fine', 'Quando i gruppi sono tutti vivi restano i confini. Ogni buco in un confine è un punto da giocare: chi ci arriva per primo guadagna.', YOSE_ROWS),
      ST.pick('Prova', 'Il confine tra nero e bianco ha un buco. Gioca tu.', YOSE_ROWS, ['F6'], { wrong: 'Cerca il punto in cui il confine bianco è aperto.', good: 'Il nero entra e il bianco perde punti; se avesse giocato il bianco, avrebbe chiuso.' }),
      ST.info('Sente prima', 'Nella fine partita gioca prima le mosse che obbligano l\'avversario a rispondere (sente): guadagni punti e tieni la mano. Poi quelle più grandi, poi le piccole. Quando restano solo dame, si passa.', null),
    ],
    problems: [],
  },
  {
    id: 'attacco', cap: 5, after: 'yose', title: 'Attaccare', summary: 'Inseguire per guadagnare, non per catturare.',
    lesson: [
      ST.info('Lo scopo', 'Attaccare un gruppo debole non vuol dire per forza catturarlo. Mentre lui scappa, tu costruisci muri e territorio. Se lo catturi, meglio ancora, ma il guadagno vero sta nelle mosse che fai inseguendo.', null),
      ST.info('Da che parte', 'Attacca dal lato che spinge il gruppo verso le tue pietre forti o verso il tuo territorio: così ogni mossa di attacco è anche una mossa che recinta. Non attaccarti al gruppo: chiudilo a distanza.', null),
      ST.move('Prova', 'Chiudi a distanza, senza inseguire.', 'c:net1:0'),
    ],
    problems: K('rete', 300, 520, 8),
  },
  // ---------------- capitolo 6: il goban grande ----------------
  {
    id: 'angoli19', cap: 6, after: 'attacco', title: 'Gli angoli del 19×19', summary: 'Hoshi, komoku, san-san.',
    lesson: [
      ST.info('Il goban vero', 'Sul 19×19 le partite cominciano dagli angoli. In ogni angolo ci sono tre punti classici: il 4-4 (hoshi, il pallino), il 3-4 (komoku) e il 3-3 (san-san). Qui sono segnati nell\'angolo in alto a destra.', R19([]), { marks: { Q16: 'circle', R16: 'tri', Q17: 'tri', R17: 'sq' } }),
      ST.info('Cosa cambia', 'Il 3-3 prende l\'angolo subito, ma guarda poco verso il centro. Il 4-4 è più veloce e guarda verso i lati, ma l\'angolo resta aperto. Il 3-4 sta in mezzo.', R19([['Q16', 'X'], ['D4', 'X'], ['R4', 'O'], ['C16', 'O']])),
      ST.pick('Prova', 'Tocca uno dei quattro hoshi d\'angolo.', R19([]), ['D4', 'Q4', 'D16', 'Q16'], { wrong: 'I pallini dell\'angolo: quarta linea da tutti e due i bordi.', good: 'Esatto: è il 4-4. Sul vostro goban è il pallino dell\'angolo.' }),
    ],
    problems: [],
  },
  {
    id: 'kakari', cap: 6, after: 'angoli19', title: 'Avvicinarsi all\'angolo', summary: 'Kakari e risposta.',
    lesson: [
      ST.info('Il kakari', 'Quando l\'avversario ha preso un angolo, puoi avvicinarti (kakari) per non lasciarglielo tutto. Il nero ha l\'hoshi in Q16: il bianco si avvicina dal lato destro.', R19([['Q16', 'X']]), { marks: { R14: 'tri' } }),
      ST.seq('Una sequenza classica', 'Tre mosse semplici, molto comuni.', R19([['Q16', 'X']]), WHITE, [
        ['R14', 'Il bianco si avvicina all\'angolo, sulla terza linea.'], ['O17', 'Il nero risponde con un salto del cavallo dall\'altra parte: protegge l\'angolo e prende spazio in alto.'], ['R11', 'Il bianco si estende di due sul lato: ora ha una base e non è più una pietra sola.'],
      ]),
      ST.info('Il principio', 'Dopo un kakari, chi risponde protegge l\'angolo; chi si è avvicinato si estende sul lato per non restare debole. Così tutti e due ottengono qualcosa.', null),
    ],
    problems: [],
  },
  {
    id: 'estensioni', cap: 6, after: 'kakari', title: 'Estendersi sul lato', summary: 'Di quanto saltare.',
    lesson: [
      ST.info('La base', 'Una pietra sul lato, sulla terza linea, è al sicuro se ha un\'estensione: un\'altra pietra a due punti di distanza. Insieme fanno una base da cui è facile vivere.', R19([['R10', 'X'], ['R7', 'X']]), { marks: { R9: 'circle', R8: 'circle' } }),
      ST.pick('Prova', 'Il nero ha una pietra sola in R10. Estenditi di due lungo il lato.', R19([['R10', 'X']]), ['R7', 'R13'], { wrong: 'Sul lato destro, sulla stessa linea, lasciando due punti vuoti in mezzo.', good: 'Ecco una base: due pietre a due punti di distanza.' }),
      ST.info('Il proverbio', 'Da una pietra si salta di due, da due pietre in piedi di tre, da tre di quattro. Più il gruppo è forte, più lontano può estendersi.', null),
    ],
    problems: [],
  },
  {
    id: 'moyo', cap: 6, after: 'estensioni', title: 'Territorio e influenza', summary: 'Terza e quarta linea.',
    lesson: [
      ST.info('Due modi di giocare', 'Le pietre sulla terza linea fanno territorio sicuro, vicino al bordo. Quelle sulla quarta guardano verso il centro: fanno influenza, cioè un\'area grande ma aperta, il moyo.', R19([['R4', 'X'], ['R10', 'X'], ['R16', 'X'], ['C4', 'O'], ['C10', 'O'], ['C16', 'O']])),
      ST.info('Equilibrio', 'Una buona partita mescola le due cose. Troppa terza linea: territorio piccolo. Troppa quarta: l\'avversario entra nel tuo moyo. Un moyo va chiuso prima che l\'altro ci invada.', R19([['Q4', 'X'], ['Q10', 'X'], ['Q16', 'X'], ['K16', 'X'], ['D4', 'O'], ['C16', 'O']])),
    ],
    problems: [],
  },
  {
    id: 'vantaggio', cap: 6, after: 'moyo', title: 'Le pietre di vantaggio', summary: 'Come metterle e come usarle, il sabato.',
    lesson: [
      ST.info('Dove vanno', 'Chi riceve il vantaggio gioca col nero e mette le pietre sugli hoshi prima di cominciare. Con due pietre: due angoli opposti. Con tre e quattro: gli altri angoli. Poi muove il bianco, e il komi è mezzo punto.', R19([['D4', 'X'], ['Q4', 'X'], ['D16', 'X'], ['Q16', 'X']])),
      ST.info('Come usarle', 'Le pietre di vantaggio lavorano insieme: usale per attaccare le pietre bianche che arrivano tra loro, invece di difenderle una per una. Il bianco cercherà di complicare: tieni i gruppi collegati e ricordati che non serve vincere di tanto.', null),
      ST.info('In Partita', 'Puoi provarlo contro il computer: in Partita, Pietre di vantaggio per te, da 1 a 4. Funziona sul 9×9, sul 13×13 e sul 19×19.', null),
    ],
    problems: [],
  },
];

// Ordine finale: si parte dalle dieci lezioni del dojo e si inseriscono le nuove dopo quella indicata
(function () {
  const CAP_OLD = { liberta: 1, cattura: 1, salvare: 1, regole: 1, scala: 2, rete: 2, collegare: 2, occhi: 3, territorio: 5, apertura: 5 };
  for (const U of UNITS) U.cap = CAP_OLD[U.id] || 1;
  const glossIds = GLOSSARY.map(g => g.unit !== undefined ? UNITS[g.unit].id : null);
  for (const U of NUOVE) {
    const at = UNITS.findIndex(x => x.id === U.after);
    UNITS.splice(at + 1, 0, U);
  }
  // capitoli: ordino per capitolo mantenendo l'ordine interno
  const order = UNITS.map((U, i) => [U.cap, i, U]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(x => x[2]);
  UNITS.length = 0; UNITS.push(...order);
  GLOSSARY.forEach((g, i) => { if (glossIds[i]) g.unit = UNITS.findIndex(U => U.id === glossIds[i]); });
})();
const CAPITOLI = ['', 'Le basi', 'Tattica', 'Vita e morte', 'Le forme', 'La partita', 'Il goban grande'];
