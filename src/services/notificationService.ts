import { AppNotification } from '@/types/notification';
import { playNotificationSound } from './notificationSoundService';

// Default notification options
const DEFAULT_NOTIFICATION_OPTIONS: NotificationOptions = {
  icon: '/favicon.ico',
  badge: '/favicon.ico',
  silent: false,
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

// Track notification permission status
let notificationPermissionStatus: NotificationPermission | null = null;

/**
 * Request permission for browser notifications
 * @returns Promise resolving to true if permission is granted
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  console.log('Requesting notification permission...'); // Debug log
  
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('This browser does not support desktop notifications');
    return false;
  }
  
  try {
    // Force a new permission request
    const permission = await Notification.requestPermission();
    console.log('Permission request result:', permission); // Debug log
    
    // Update the cached permission status
    notificationPermissionStatus = permission;
    
    // If permission is granted, set up the service worker
    if (permission === 'granted') {
      if ('serviceWorker' in navigator) {
        try {
          // Unregister any existing service worker first
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            if (registration.scope.includes('notification-sw')) {
              await registration.unregister();
            }
          }
          
          // Register a new service worker
          const registration = await navigator.serviceWorker.register('/notification-sw.js');
          console.log('ServiceWorker registration successful:', registration);
          
          // Wait for the service worker to be ready
          await navigator.serviceWorker.ready;
        } catch (error) {
          console.warn('ServiceWorker registration failed:', error);
        }
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    notificationPermissionStatus = 'default';
    return false;
  }
};

/**
 * Check if notifications are supported and permission is granted
 */
export const areNotificationsAvailable = (): boolean => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  
  return Notification.permission === 'granted';
};

/**
 * Show a browser notification
 * @param notification The notification to show
 * @param options Additional notification options
 * @returns The notification object if successful, null otherwise
 */
export const showBrowserNotification = (
  notification: AppNotification,
  options: NotificationOptions = {}
): Notification | null => {
  if (!areNotificationsAvailable()) {
    return null;
  }
  
  try {
    // Merge default options with provided options
    const notificationOptions: NotificationOptions = {
      ...DEFAULT_NOTIFICATION_OPTIONS,
      ...options,
      body: notification.message,
      tag: notification.id, // Use notification ID as tag to prevent duplicates
      data: {
        url: notification.link,
        timestamp: new Date().getTime(),
        notificationId: notification.id,
        type: notification.type
      }
    };
    
    // Create and show the notification
    const browserNotification = new Notification(notification.title, notificationOptions);
    
    // Handle notification click
    browserNotification.onclick = (event) => {
      // Focus on the window if it's not focused
      if (window.parent) {
        window.parent.focus();
      }
      window.focus();
      
      // Navigate to the link if provided
      if (notification.link) {
        window.location.href = notification.link;
      }
      
      // Close the notification
      browserNotification.close();
    };
    
    return browserNotification;
  } catch (error) {
    console.error('Error showing browser notification:', error);
    return null;
  }
};

/**
 * Process a new notification - handles sound and browser notification
 * @param notification The notification to process
 * @param playSound Whether to play a sound
 * @param showNotification Whether to show a browser notification
 */
export const processNotification = (
  notification: AppNotification,
  playSound: boolean = true,
  showNotification: boolean = true
): void => {
  // Play notification sound if enabled
  if (playSound) {
    playNotificationSound(notification.type);
  }
  
  // Show browser notification if enabled
  if (showNotification) {
    showBrowserNotification(notification);
  }
};

/**
 * Initialize notification system
 * Should be called on app startup
 */
export const initializeNotifications = async (): Promise<void> => {
  // Request notification permission
  await requestNotificationPermission();
  
  // Set up service worker for notifications if available
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/notification-sw.js');
      console.log('ServiceWorker registration successful with scope:', registration.scope);
      
      // Set up message handler for service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_NOTIFICATIONS') {
          // Handle notification sync
          console.log('Syncing notifications...');
          // Add your sync logic here
        }
      });
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  }
};

/**
 * Register for push notifications
 * @param publicKey The VAPID public key for push notifications
 */
export const registerPushNotifications = async (publicKey: string): Promise<void> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported');
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Convert VAPID key to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    
    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });
    
    console.log('Push notification subscription:', subscription);
    
    // Send subscription to your server
    // await sendSubscriptionToServer(subscription);
  } catch (error) {
    console.error('Error registering for push notifications:', error);
  }
};

/**
 * Convert a base64 string to Uint8Array
 * @param base64String The base64 string to convert
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
} 