self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(data.title || '有聲書提醒', {
    body: data.body || '今天還沒聽書！保持你的閱讀習慣 📚',
    icon: '/audiobook/icon-192.png',
    badge: '/audiobook/icon-192.png',
    tag: 'daily-reminder',
    renotify: true,
    data: { url: '/audiobook/' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || '/audiobook/'));
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
