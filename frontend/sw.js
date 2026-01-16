// MedicSense AI - Service Worker
const CACHE_NAME = 'medicsense-ai-v2';
const RUNTIME_CACHE = 'medicsense-runtime-v2';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style_ultra.css',
  '/script_ultra.js',
  '/env-loader.js',
  '/load-env.js',
  '/whatsapp_service.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap',
  'https://unpkg.com/aos@2.3.1/dist/aos.css',
  'https://unpkg.com/aos@2.3.1/dist/aos.js',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests: Network Only (with cache fallback for offline)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Local App Assets (HTML, JS, CSS) - NETWORK PRIMARY
  // This solves the issue of "changes not showing up without hard refresh"
  // We try network first, update cache, and fall back to cache only if offline.
  if (url.origin === self.location.origin) {
      event.respondWith(
          fetch(request)
            .then(response => {
                // Update cache with fresh version
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(RUNTIME_CACHE).then(cache => cache.put(request, clone));
                }
                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(request).then(cached => {
                    if (cached) return cached;
                    // Fallback for navigation
                    if (request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                });
            })
      );
      return;
  }

  // Third Party Assets (Fonts, CDN) - CACHE PRIMARY
  // These don't change often, so we save bandwidth
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
            return response;
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  if (event.tag === 'sync-appointments') {
    event.waitUntil(syncAppointments());
  }
  if (event.tag === 'sync-chat') {
    event.waitUntil(syncChat());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  const options = {
    body: event.data ? event.data.text() : 'New notification from MedicSense AI',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    vibrate: [200, 100, 200],
    tag: 'medicsense-notification',
    requireInteraction: true
  };
  event.waitUntil(
    self.registration.showNotification('MedicSense AI', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});

// Helper functions
async function syncAppointments() {
  console.log('[Service Worker] Syncing appointments...');
}
async function syncChat() {
  console.log('[Service Worker] Syncing chat...');
}
