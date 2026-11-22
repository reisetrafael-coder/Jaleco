// Service worker: deixa o app abrir rápido (até sem internet) e recebe as notificações.
const CACHE = 'jaleco-v1';
const ESSENCIAIS = ['/', '/manifest.webmanifest', '/icons/icone-192.png'];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(ESSENCIAIS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (ev) => {
  const url = new URL(ev.request.url);
  if (ev.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  // Páginas: tenta a internet primeiro (pega a versão nova), senão usa a guardada.
  if (ev.request.mode === 'navigate') {
    ev.respondWith(
      fetch(ev.request)
        .then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put('/', copia)); return r; })
        .catch(() => caches.match('/')),
    );
    return;
  }
  // Arquivos (js, css, fontes, ícones): usa o guardado e atualiza por trás.
  ev.respondWith(
    caches.match(ev.request).then((guardado) => {
      const rede = fetch(ev.request).then((r) => {
        if (r.ok) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(ev.request, copia)); }
        return r;
      }).catch(() => guardado);
      return guardado || rede;
    }),
  );
});

self.addEventListener('push', (ev) => {
  let dados = {};
  try { dados = ev.data.json(); } catch { dados = { title: 'Jaleco', body: ev.data?.text() || '' }; }
  ev.waitUntil(
    self.registration.showNotification(dados.title || 'Jaleco', {
      body: dados.body || '',
      icon: '/icons/icone-192.png',
      badge: '/icons/badge-96.png',
      data: { url: dados.url || '/' },
      tag: 'lembrete-diario',
      renotify: true,
    }),
  );
});

self.addEventListener('notificationclick', (ev) => {
  ev.notification.close();
  const alvo = ev.notification.data?.url || '/';
  ev.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      for (const j of janelas) {
        if ('focus' in j) { j.navigate(alvo); return j.focus(); }
      }
      return self.clients.openWindow(alvo);
    }),
  );
});
