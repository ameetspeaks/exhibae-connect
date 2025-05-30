import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppNotification } from '@/types/notification';
import { useUser } from '@supabase/auth-helpers-react';
import { playNotificationSound } from '@/services/notificationSoundService';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { useNotificationSettings } from './useNotificationSettings';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { processNotification, showBrowserNotification } from '@/services/notificationService';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { user } = useAuth();
  const { isEnabled, settings, updateSettings } = useNotificationSettings();
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
  const hasInitialized = useRef(false);
  const hasFetchedNotifications = useRef(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Effect for realtime subscription
  useEffect(() => {
    // Prevent multiple initializations
    if (!user || hasInitialized.current) return;
    
    hasInitialized.current = true;

    // Only setup realtime subscriptions if supabase.channel function exists
    if (typeof supabase.channel === 'function') {
      try {
        const channelName = `user_notifications_${user.id}`;
        
        // Set up realtime subscription
        const channel = supabase
          .channel(channelName)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          }, (payload) => {
            const newNotification = payload.new as AppNotification;
            const eventType = newNotification.type;
            
            // Check if desktop notifications are enabled for this type
            const shouldShowDesktopNotification = isEnabled('desktop_notifications') && 
                isEnabled(`${eventType}_enabled` as any);
            
            // Check if sound notifications are enabled for this type
            const shouldPlaySound = isEnabled('sound_enabled') && 
                isEnabled(`${eventType}_enabled` as any);
            
            if (shouldShowDesktopNotification || shouldPlaySound) {
              // Process the notification (show desktop notification and/or play sound)
              processNotification(newNotification, shouldPlaySound, shouldShowDesktopNotification);
            }

            setNotifications(prev => [newNotification, ...prev]);
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to notifications channel');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Failed to subscribe to notifications channel');
            }
          });
        
        setRealtimeChannel(channel);
      } catch (error) {
        console.error('Error setting up realtime subscription:', error);
      }
    } else {
      console.warn('Realtime functionality is not available - notifications will be fetched on page load only');
    }
    
    return () => {
      // Clean up subscription
      if (realtimeChannel && typeof supabase.removeChannel === 'function') {
        try {
          supabase.removeChannel(realtimeChannel);
        } catch (error) {
          console.error('Error removing channel:', error);
        }
      }
      hasInitialized.current = false;
    };
  }, [user?.id]); // Only depend on user.id, not the entire user object or isEnabled

  // Separate effect for fetching notifications
  useEffect(() => {
    if (!user || hasFetchedNotifications.current) return;
    
    fetchNotifications();
    hasFetchedNotifications.current = true;
    
    return () => {
      hasFetchedNotifications.current = false;
    };
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const addNotification = async (notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: user.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            link: notification.link,
            is_read: false,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding notification:', error);
        return;
      }

      const newNotification = data as AppNotification;
      
      // Check if desktop notifications are enabled for this type
      const shouldShowDesktopNotification = isEnabled('desktop_notifications') && 
          isEnabled(`${notification.type}_enabled` as any);
      
      // Check if sound notifications are enabled for this type
      const shouldPlaySound = isEnabled('sound_enabled') && 
          isEnabled(`${notification.type}_enabled` as any);
      
      if (shouldShowDesktopNotification || shouldPlaySound) {
        // Process the notification (show desktop notification and/or play sound)
        processNotification(newNotification, shouldPlaySound, shouldShowDesktopNotification);
      }

      setNotifications(prev => [newNotification, ...prev]);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'NOTIFICATION_STATUS') {
          const permission = event.data.permission;
          if (permission === 'granted' && settings?.desktop_notifications) {
            // Re-enable notifications if they were previously disabled
            updateSettings({ desktop_notifications: true });
          } else if (permission !== 'granted' && settings?.desktop_notifications) {
            // Disable notifications if permission was revoked
            updateSettings({ desktop_notifications: false });
          }
        }
      };

      navigator.serviceWorker.addEventListener('message', messageHandler);
      return () => {
        navigator.serviceWorker.removeEventListener('message', messageHandler);
      };
    }
  }, [user, settings]);

  // Handle new notifications
  useEffect(() => {
    if (!user || !settings?.desktop_notifications) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, async (payload) => {
        const notification = payload.new as AppNotification;
        
        // Check if notification type is enabled
        const notificationTypeEnabled = settings[`${notification.type}_enabled` as keyof typeof settings];
        if (!notificationTypeEnabled) return;

        try {
          // Process the notification with sound and desktop notification
          processNotification(
            notification,
            settings.sound_enabled,
            settings.desktop_notifications
          );

          // Update local state
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        } catch (error) {
          console.error('Error processing notification:', error);
        }
      });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to notifications channel');
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [user, settings]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 