// Garde une copie de l'appli dans le téléphone pour qu'elle s'ouvre sans réseau.
// Quand vous modifiez un fichier, changez le numéro de version ci-dessous
// (le même que dans app.js).
const CACHE = 'courses-v2.2';
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'manifest.json', 'icon-180.png', 'icon-512.png'];

// Installation : télécharge les fichiers neufs (sans passer par le cache du navigateur)
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Réseau d'abord (toujours la dernière version), copie locale si pas de réseau
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const sameSite = new URL(e.request.url).origin === location.origin;
  e.respondWith(
    fetch(sameSite ? new Request(e.request, { cache: 'no-cache' }) : e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
