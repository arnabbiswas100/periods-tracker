// ── Lumina Flow Service Worker ──────────────────────────────────────
const CACHE_NAME = 'lumina-flow-v1';
const ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

// ── Install: cache shell ─────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ──────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first, fallback to cache ──────────────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('/')))
  );
});

// ── Push Notifications ───────────────────────────────────────────────
self.addEventListener('push', e => {
  let data = { title: 'Lumina Flow 🌸', body: 'Check your cycle tracker!', icon: '/icon-192.png' };
  try { data = { ...data, ...e.data.json() }; } catch (_) {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
      actions: [{ action: 'open', title: 'Open App' }],
    })
  );
});

// ── Notification click: focus or open app ────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return clients.openWindow(e.notification.data?.url || '/');
    })
  );
});

// ── Periodic Sync (Android Chrome) ───────────────────────────────────
self.addEventListener('periodicsync', e => {
  if (e.tag === 'cycle-reminder') {
    e.waitUntil(sendCycleReminder());
  }
});

async function sendCycleReminder() {
  // Read data from the clients
  const allClients = await clients.matchAll({ includeUncontrolled: true });
  if (allClients.length > 0) return; // App is open, skip

  // Offline reminder — load from IDB if needed
  await self.registration.showNotification('Lumina Flow 🌸', {
    body: "Don't forget to log your day! 💕",
    icon: '/icon-192.png',
    badge: '/icon-192.png',
  });
}
