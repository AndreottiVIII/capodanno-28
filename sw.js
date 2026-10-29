// Service worker: il sito funziona anche senza internet.
// Con la rete chiede sempre prima i file nuovi; la copia salvata serve solo offline.
// A ogni pubblicazione cambia VERSION.
const VERSION = 'cp28-2026-10-29-4';
importScripts('js/ornamenti.js');
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/config.js', 'js/util.js', 'js/engine.js', 'js/catalog.js', 'js/content.js', 'js/lezioni.js', 'js/tredici.js', 'js/ornamenti.js',
  'js/store.js', 'js/chiave.js', 'js/sync.js', 'js/goban.js', 'js/player.js', 'js/game.js', 'js/views.js',
  'img/greca.svg', 'img/intaglio.svg', 'img/icon-192.png', 'img/icon-512.png', 'img/apple-touch-icon.png',
];
// cache: 'reload' scavalca la cache del browser (GitHub Pages la tiene 10 minuti): si salvano i file appena pubblicati
const fresh = u => new Request(u, { cache: 'reload' });
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(CORE.map(fresh));
    // gli ornamenti: se uno manca non blocca l'installazione
    await Promise.all(ORN.map(o => c.add(fresh(o.file)).catch(() => null)));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !fonts) return;
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    const key = req.mode === 'navigate' ? 'index.html' : req;
    // caratteri e immagini non cambiano: prima la copia salvata
    if (fonts || url.pathname.includes('/img/')) {
      const hit = await c.match(key);
      if (hit) return hit;
      const r = await fetch(req).catch(() => null);
      if (r && (r.ok || r.type === 'opaque')) c.put(key, r.clone());
      return r || new Response('', { status: 504 });
    }
    // pagina e codice: prima la rete (chiedendo al server se il file è cambiato), la copia salvata se offline o lenta
    try {
      // una richiesta di pagina intera non accetta opzioni: per quella si usa l'indirizzo
      const r = await Promise.race([fetch(req.mode === 'navigate' ? req.url : req, { cache: 'no-cache' }), new Promise((_, no) => setTimeout(() => no(new Error('lento')), 5000))]);
      if (r && r.ok) c.put(key, r.clone());
      return r;
    } catch (err) {
      return (await c.match(key, { ignoreSearch: req.mode === 'navigate' })) || new Response('Offline', { status: 503 });
    }
  })());
});
