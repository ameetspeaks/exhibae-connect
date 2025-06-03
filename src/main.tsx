import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { preloadNotificationSounds } from './services/notificationSoundService'
import { initializeNotifications } from './services/notificationService'
import { Toaster } from '@/components/ui/toaster'

// Create root and render app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>
);

// Initialize app features - moved to App component where we can check auth status
