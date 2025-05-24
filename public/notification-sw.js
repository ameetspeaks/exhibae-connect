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
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  
  // Take control of all clients immediately
  self.clients.claim();
});

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
      ]
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
  console.log('Notification clicked:', event);
  
  // Close the notification
  event.notification.close();
  
  // Get the notification data
  const notificationData = event.notification.data;
  
  // Handle notification actions
  if (event.action === 'close') {
    return;
  }
  
  // Default action is 'open'
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === notificationData.url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window/tab is open with the target URL, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(notificationData.url);
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