// Service worker: il sito funziona anche senza internet.
// A ogni pubblicazione cambia VERSION, così i telefoni scaricano i file nuovi.
const VERSION = 'cp28-2026-10-10-2';
importScripts('js/ornamenti.js');
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/config.js', 'js/util.js', 'js/engine.js', 'js/catalog.js', 'js/content.js', 'js/lezioni.js', 'js/ornamenti.js',
  'js/store.js', 'js/sync.js', 'js/goban.js', 'js/player.js', 'js/game.js', 'js/views.js',
  'img/greca.svg', 'img/intaglio.svg', 'img/icon-192.png', 'img/icon-512.png', 'img/apple-touch-icon.png',
];
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(CORE);
    // gli ornamenti: se uno manca non blocca l'installazione
    await Promise.all(ORN.map(o => c.add(o.file).catch(() => null)));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});
// prima la copia locale, poi aggiorna in sottofondo (stale-while-revalidate)
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !fonts) return;
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    const key = req.mode === 'navigate' ? 'index.html' : req;
    const hit = await c.match(key, { ignoreSearch: req.mode === 'navigate' });
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(key, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || new Response('Offline', { status: 503 });
  })());
});
