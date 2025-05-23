import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { preloadNotificationSounds } from './services/notificationSoundService'

// Preload notification sounds with error handling
// Loading the sounds asynchronously to not block rendering
(async () => {
  try {
    await preloadNotificationSounds();
  } catch (error) {
    console.error('Error preloading notification sounds:', error);
  }
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
