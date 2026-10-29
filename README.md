# Capodanno 28

Un sito di go per due, installabile su iPhone come un'app. Lezioni brevi, oltre duemila problemi verificati da un risolutore, partita aiutata contro il computer e una sfida settimanale a perle. Stile: tappeti Nichols di Tientsin.

Funziona anche senza internet. Con la chiave online (vedi [ONLINE.md](ONLINE.md)) si entra con una password, si resta dentro e i progressi sono condivisi tra computer e telefono, in un repository GitHub privato; senza, restano sul dispositivo e la sfida passa per un codice da scambiarsi.

## Come si usa

- Sul computer: apri il sito.
- Su iPhone: apri il sito in Safari › Condividi › Aggiungi alla schermata Home.
- Il benvenuto per il compleanno: indirizzo del sito + `#benvenuto` (è il QR nella scatola). Il messaggio si cambia in `js/config.js`.

## File

- `index.html`, `css/app.css`: guscio e stile, con le tre palette (blu di Tientsin, melanzana, giada).
- `js/engine.js`: regole, risolutori tattici, Monte Carlo. `js/catalog.js`: il catalogo dei problemi. `js/content.js`: le prime dieci lezioni, temi, lessico. `js/lezioni.js`: le lezioni nuove e i sei capitoli del percorso.
- `js/store.js`: perle, filo, serie, sigilli, partite dal vivo, codice della sfida. `js/sync.js` e `js/chiave.js`: progressi condivisi online (repository privato, chiave cifrata da `tools/cifra_chiave.py`).
- `js/player.js`: problemi e lezioni sul goban. `js/game.js`: partita contro il computer. `js/views.js`: tutte le schermate.
- `js/ornamenti.js` e `img/orn/`: i 100 motivi del tappeto, generati da `tools/ornamenti/`.
- `sw.js`, `manifest.webmanifest`: app installabile e offline.

## Collaudo

`tools/collaudo.js` percorre tutto il sito: nella console del browser `fetch('tools/collaudo.js').then(r => r.text()).then(eval)`, poi per esempio `await Collaudo.schermate()`, `Collaudo.lezioni()`, `Collaudo.catalogo(400)`.

## Lavorarci in locale

```
python tools/serve.py
```

poi http://localhost:8028. Prima di pubblicare una nuova versione cambia `VERSION` in `sw.js`, così i telefoni scaricano i file nuovi.
