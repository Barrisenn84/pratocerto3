// NutriMacro Service Worker - Background Meal Reminders & Push API
const SW_VERSION = 'nutrimacro-sw-v1.0.0';

// Install event - immediately take control
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - claim all connected clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      console.log(`[ServiceWorker] NutriMacro active (${SW_VERSION})`);
    })
  );
});

// Active reminder timers stored in memory during service worker lifecycle
let backgroundSchedules = [];

// Handle incoming Web Push events from PushManager / Push Server
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || '🔔 NutriMacro: Hora da Refeição!';
  const mealType = data.mealType || 'lunch';
  const body = data.body || 'Hora de registrar sua refeição e manter seus macros no alvo diário!';
  const icon = data.icon || '/icon-192.png';
  const tag = data.tag || `meal_push_${mealType}_${Date.now()}`;

  const options = {
    body,
    icon,
    badge: icon,
    tag,
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: `/?action=log_meal&type=${mealType}`,
      mealType,
      timestamp: Date.now(),
      ...data,
    },
    actions: [
      {
        action: 'log_meal',
        title: '🍽️ Registrar Agora',
      },
      {
        action: 'view_diary',
        title: '📅 Ver Diário',
      },
      {
        action: 'dismiss',
        title: 'Dispensar',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click: focus app window or open url with meal action
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  if (action === 'dismiss') {
    return;
  }

  const notifData = event.notification.data || {};
  const mealType = notifData.mealType || 'lunch';
  let targetUrl = notifData.url || `/?action=log_meal&type=${mealType}`;

  if (action === 'view_diary') {
    targetUrl = '/?action=view_diary';
  } else if (action === 'log_meal') {
    targetUrl = `/?action=log_meal&type=${mealType}`;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window client is already open, focus it and broadcast event
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            action: action || 'open',
            mealType,
            data: notifData,
          });
          return;
        }
      }

      // If no window is currently open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle messages from the client (e.g. Schedule reminders, Trigger instant test)
self.addEventListener('message', (event) => {
  const { data } = event;
  if (!data) return;

  if (data.type === 'TRIGGER_NOTIFICATION') {
    const { title, options } = data;
    self.registration.showNotification(title || '🔔 NutriMacro', {
      body: options?.body || 'Lembrete de refeição agendada.',
      icon: options?.icon || '/icon-192.png',
      badge: options?.icon || '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: options?.tag || `nutrimacro_msg_${Date.now()}`,
      renotify: true,
      requireInteraction: false,
      data: options?.data || { url: '/' },
      actions: [
        { action: 'log_meal', title: '🍽️ Registrar' },
        { action: 'view_diary', title: '📅 Ver Diário' },
      ],
    });
  }

  if (data.type === 'SCHEDULE_REMINDERS') {
    const { reminders, settings } = data;
    backgroundSchedules = Array.isArray(reminders) ? reminders : [];
    console.log('[ServiceWorker] Updated background reminder schedules:', backgroundSchedules.length);
  }
});
