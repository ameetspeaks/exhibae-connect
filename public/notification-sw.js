// Notification Service Worker
// Handles background notifications when the app is not in focus

const CACHE_NAME = 'exhibae-notification-cache-v1';
const NOTIFICATION_ICON = '/favicon.ico';
const NOTIFICATION_SOUND = '/sounds/notification.mp3';

// Install event - cache resources needed for notifications
self.addEventListener('install', (event) => {
  console.log('Notification Service Worker installed');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        NOTIFICATION_ICON,
        NOTIFICATION_SOUND
      ]);
    })
  );
  
  // Activate the service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Notification Service Worker activated');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Ensure the service worker takes control immediately
  self.clients.claim();
});

// Message event - handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data.type === 'CHECK_NOTIFICATION_STATUS') {
    checkNotificationPermission();
  }
});

// Function to check notification permission
async function checkNotificationPermission() {
  try {
    const allClients = await self.clients.matchAll();
    
    allClients.forEach(client => {
      client.postMessage({
        type: 'NOTIFICATION_STATUS',
        permission: Notification.permission
      });
    });
  } catch (error) {
    console.error('Error checking notification permission:', error);
  }
}

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }
  
  try {
    const data = event.data.json();
    const options = {
      body: data.message,
      icon: NOTIFICATION_ICON,
      badge: NOTIFICATION_ICON,
      data: {
        url: data.link,
        timestamp: new Date().getTime(),
        notificationId: data.id,
        type: data.type
      },
      tag: data.id, // Use notification ID as tag to prevent duplicates
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Open'
        },
        {
          action: 'close',
          title: 'Close'
        }
      ],
      // Add vibration pattern for mobile devices
      vibrate: [200, 100, 200],
      // Add a timeout to auto-close notifications after 30 seconds
      timestamp: new Date().getTime() + 30000
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data;
  
  // Close the notification
  notification.close();
  
  // Handle the action
  if (action === 'close') {
    return;
  }
  
  // Focus or open window
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clientList => {
      // If we have a link and the action is 'open', navigate to it
      if (data.url && (action === 'open' || !action)) {
        // Try to focus an existing window first
        for (const client of clientList) {
          if (client.url === data.url && 'focus' in client) {
            return client.focus();
          }
        }
        // If no existing window, open a new one
        return self.clients.openWindow(data.url);
      }
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  // You can add any cleanup or analytics tracking here
  const notificationData = event.notification.data;
  if (notificationData) {
    // Example: Track notification close event
    console.log('Notification closed:', {
      id: notificationData.notificationId,
      type: notificationData.type,
      duration: new Date().getTime() - notificationData.timestamp
    });
  }
});

// Handle background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Function to sync notifications
async function syncNotifications() {
  try {
    // Get all clients
    const clients = await self.clients.matchAll();
    
    // Send a message to each client to sync notifications
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_NOTIFICATIONS'
      });
    });
  } catch (error) {
    console.error('Error syncing notifications:', error);
  }
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Message received in service worker', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 