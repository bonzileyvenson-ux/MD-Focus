// sw.js

const CACHE_NAME = 'md-focus-cache-v2'; // Incremente a versão ao atualizar os arquivos
const urlsToCache = [
  '/',
  'index.html',
  'uso_privacidade.html',
  'css/style.css',
  'css/theme.css',
  'css/privacidade.css',
  'js/app.js',
  'js/calc.js',
  'js/data.js',
  'js/history.js',
  'js/ui.js',
  'js/validation.js',
  'favicon.png',
  'icon-192.png',
  'icon-512.png',
  'touch-icon.png',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
  'https://cdn.jsdelivr.net/npm/notie@4.3.1/dist/notie.min.css',
  'https://cdn.jsdelivr.net/npm/notie@4.3.1/dist/notie.min.js'
];

// Evento de Instalação: Ocorre quando o Service Worker é instalado pela primeira vez.
self.addEventListener('install', event => {
  // Espera até que o cache seja aberto e todos os arquivos do App Shell sejam armazenados.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de Ativação: Limpa caches antigos para evitar conflitos.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Evento de Fetch: Intercepta todas as requisições de rede.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se a resposta estiver no cache, retorna do cache.
        // Senão, busca na rede.
        return response || fetch(event.request);
      })
  );
});