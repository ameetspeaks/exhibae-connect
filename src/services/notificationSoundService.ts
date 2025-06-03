import { AppNotification } from '@/types/notification';

// Flag to track if sounds are available and enabled
let soundsEnabled = false;

// Default sound path
const DEFAULT_SOUND_PATH = '/sounds/notification.mp3';

// Map notification types to sound files
const NOTIFICATION_SOUNDS = {
  // Exhibition notifications
  exhibition_created: DEFAULT_SOUND_PATH,
  exhibition_status_updated: DEFAULT_SOUND_PATH,
  exhibition_updated: DEFAULT_SOUND_PATH,
  
  // Stall notifications
  stall_application: DEFAULT_SOUND_PATH,
  stall_application_approved: DEFAULT_SOUND_PATH,
  stall_payment_complete: DEFAULT_SOUND_PATH,
  stall_booking_confirmed: DEFAULT_SOUND_PATH,
  
  // General notification
  general: DEFAULT_SOUND_PATH,
  default: DEFAULT_SOUND_PATH,
};

// Preload audio for better performance
const audioCache: Record<string, HTMLAudioElement> = {};

// Check if sound file exists
const checkSoundExists = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn(`Failed to check if sound exists at ${url}:`, error);
    return false;
  }
};

// Preload all notification sounds
export const preloadNotificationSounds = async () => {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    console.warn('Audio not available in this environment');
    return;
  }

  try {
    // Check if the default notification sound exists
    const defaultSoundExists = await checkSoundExists(DEFAULT_SOUND_PATH);
    
    if (!defaultSoundExists) {
      console.warn(`Default notification sound not found at ${DEFAULT_SOUND_PATH}. ` +
        'Sounds will be disabled. Please add sound files to the public/sounds directory.');
      soundsEnabled = false;
      return;
    }
    
    // Try to load the default sound
    try {
      const audio = new Audio(DEFAULT_SOUND_PATH);
      
      // Add error handler to prevent uncaught errors
      audio.addEventListener('error', (e) => {
        console.warn(`Error loading default sound:`, e);
        soundsEnabled = false;
      });
      
      // Handle successful loading
      audio.addEventListener('canplaythrough', () => {
        console.log('Default notification sound loaded successfully');
        soundsEnabled = true;
        audioCache[DEFAULT_SOUND_PATH] = audio;
      });
      
      audio.load();
    } catch (soundError) {
      console.warn(`Failed to preload default sound:`, soundError);
      soundsEnabled = false;
    }
  } catch (error) {
    console.error('Error in preloadNotificationSounds:', error);
    soundsEnabled = false;
  }
};

/**
 * Play notification sound based on notification type
 * @param type - The type of notification
 * @param volume - Volume level (0.0 to 1.0)
 */
export const playNotificationSound = (
  type: AppNotification['type'],
  volume: number = 0.5
) => {
  if (!soundsEnabled) {
    return;
  }
  
  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    console.warn('Audio not available in this environment');
    return;
  }
  
  // Use default sound path
  const soundPath = DEFAULT_SOUND_PATH;
  
  try {
    // Use cached audio if available, otherwise create new
    let audio = audioCache[soundPath];
    if (!audio) {
      audio = new Audio(soundPath);
      
      // Add error handler
      audio.addEventListener('error', (e) => {
        console.warn(`Error playing sound:`, e);
      });
      
      audioCache[soundPath] = audio;
    }
    
    // Reset audio to start (in case it's already playing)
    audio.currentTime = 0;
    audio.volume = volume;
    
    // Play the audio
    const playPromise = audio.play();
    
    // Handle play promise rejection (common in browsers with autoplay restrictions)
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        if (error.name === 'NotAllowedError') {
          console.warn('Browser blocked audio playback. This is often due to user interaction requirements.');
        } else {
          console.warn('Failed to play notification sound:', error);
        }
      });
    }
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

/**
 * Check if sounds are enabled
 * @returns True if sounds are enabled
 */
export const areSoundsEnabled = (): boolean => {
  return soundsEnabled;
};

/**
 * Check if browser notifications are enabled and request permission if needed
 * @returns Promise resolving to true if notifications are permitted
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('This browser does not support desktop notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }
  
  return false;
}; 