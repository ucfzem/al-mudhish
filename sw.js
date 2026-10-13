const CACHE = 'al-mudhish-cache-v1.2.0';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];
const CDN = [
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&family=Amiri:ital,wght@0,400;0,700;1,400&family=Aref+Ruqaa:wght@400;700&display=swap',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2',
  'https://fonts.gstatic.com/s/amiri/v30/J7afnpd8CGxBHpUrhLQY66NL.woff2',
  'https://fonts.gstatic.com/s/amiri/v30/J7afnpd8CGxBHpUrhL8Y66NL.woff2',
  'https://fonts.gstatic.com/s/amiri/v30/J7afnpd8CGxBHpUrhLEY6w.woff2',
  'https://fonts.gstatic.com/s/amiri/v30/J7aRnpd8CGxBHpUrtLMA7w.woff2',
  'https://fonts.gstatic.com/s/amiri/v30/J7aRnpd8CGxBHpUgtLMA7w.woff2',
  'https://fonts.gstatic.com/s/amiri/v30/J7aRnpd8CGxBHpUutLM.woff2',
  'https://fonts.gstatic.com/s/amiri/v30/J7acnpd8CGxBHp2VkaY6zp5yGw.woff2',
  'https://fonts.gstatic.com/s/amiri/v30/J7acnpd8CGxBHp2VkaYxzp5yGw.woff2',
  'https://fonts.gstatic.com/s/amiri/v30/J7acnpd8CGxBHp2VkaY_zp4.woff2',
  'https://fonts.gstatic.com/s/arefruqaa/v26/WwkbxPW1E165rajQKDulIIIoVeo5.woff2',
  'https://fonts.gstatic.com/s/arefruqaa/v26/WwkbxPW1E165rajQKDulIIkoVeo5.woff2',
  'https://fonts.gstatic.com/s/arefruqaa/v26/WwkbxPW1E165rajQKDulIIcoVQ.woff2',
  'https://fonts.gstatic.com/s/arefruqaa/v26/WwkYxPW1E165rajQKDulKDwNQNAY2e_7.woff2',
  'https://fonts.gstatic.com/s/arefruqaa/v26/WwkYxPW1E165rajQKDulKDwNQNsY2e_7.woff2',
  'https://fonts.gstatic.com/s/arefruqaa/v26/WwkYxPW1E165rajQKDulKDwNQNUY2Q.woff2',
  'https://fonts.gstatic.com/s/cairo/v31/SLXVc1nY6HkvangtZmpQdkhzfH5lkSscQyyS4J0.woff2',
  'https://fonts.gstatic.com/s/cairo/v31/SLXVc1nY6HkvangtZmpQdkhzfH5lkSscSCyS4J0.woff2',
  'https://fonts.gstatic.com/s/cairo/v31/SLXVc1nY6HkvangtZmpQdkhzfH5lkSscRiyS.woff2'
];

async function precacheAll(cache, urls, concurrency = 4) {
  let i = 0;
  const worker = async () => {
    while (i < urls.length) {
      const u = urls[i++];
      try { await cache.add(u); }
      catch (e) { try { await new Promise((r) => setTimeout(r, 300)); await cache.add(u); } catch (_) {} }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
}

async function cacheCdn(cache, url) {
  for (let t = 0; t < 3; t++) {
    try { const r = await fetch(url, { mode: 'no-cors' }); if (r) { await cache.put(url, r); } return; }
    catch (e) { await new Promise((r) => setTimeout(r, 300)); }
  }
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await precacheAll(cache, CORE);
    await Promise.all(CDN.map((u) => cacheCdn(cache, u)));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE && k.startsWith('al-mudhish-')).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        caches.open(CACHE).then((c) => c.put(req, res.clone()));
        return res;
      }).catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req).then((res) => {
        caches.open(CACHE).then((c) => c.put(req, res.clone()));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});