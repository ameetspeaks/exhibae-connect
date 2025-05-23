import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppNotification } from '@/types/notification';
import { useUser } from '@supabase/auth-helpers-react';
import { playNotificationSound, requestNotificationPermission } from '@/services/notificationSoundService';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { useNotificationSettings } from './useNotificationSettings';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
  const { isEnabled } = useNotificationSettings();
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
  const hasInitialized = useRef(false);
  const hasFetchedNotifications = useRef(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Effect for realtime subscription
  useEffect(() => {
    // Prevent multiple initializations
    if (!user || hasInitialized.current) return;
    
    hasInitialized.current = true;

    // Request notification permission on mount
    requestNotificationPermission();

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
            
            // Check manager role
            const isManager = user.app_metadata?.role === 'MANAGER';
            
            // Only show browser notification if it's enabled for user's role
            if (isEnabled('desktop_notifications') && 
                isEnabled(`${eventType}_enabled` as any)) {
              
              // For managers, show desktop notifications with custom icon
              if (isManager && Notification.permission === 'granted') {
                // Show browser notification
                new Notification(newNotification.title, {
                  body: newNotification.message,
                  icon: '/favicon.ico', // Update with your app's icon
                });
              }
              
              // Play notification sound if enabled
              if (isEnabled('sound_enabled') && isManager) {
                playNotificationSound(newNotification.type);
              }
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

      setNotifications(prev => [data as AppNotification, ...prev]);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

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