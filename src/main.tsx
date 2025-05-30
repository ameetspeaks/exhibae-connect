import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { preloadNotificationSounds } from './services/notificationSoundService'
import { initializeNotifications } from './services/notificationService'
import { Toaster } from '@/components/ui/toaster'

// Initialize notification system with proper error handling
const initializeApp = async () => {
  try {
    // Check if notifications are supported
    if ('Notification' in window) {
      // Initialize notifications
      await initializeNotifications();
      
      // Preload sounds
      await preloadNotificationSounds();
      
      // Set up periodic permission check (in case user changes browser settings)
      setInterval(() => {
        if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            registration.active?.postMessage({ type: 'CHECK_NOTIFICATION_STATUS' });
          });
        }
      }, 60000); // Check every minute
    }
  } catch (error) {
    console.error('Error initializing notification system:', error);
  }
};

// Create root and render app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>
);

// Initialize app features
initializeApp();
