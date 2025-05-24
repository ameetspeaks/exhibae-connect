import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { preloadNotificationSounds } from './services/notificationSoundService'
import { initializeNotifications } from './services/notificationService'

// Preload notification sounds with error handling
// Loading the sounds asynchronously to not block rendering
(async () => {
  try {
    await preloadNotificationSounds();
    await initializeNotifications();
  } catch (error) {
    console.error('Error initializing notification system:', error);
  }
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
