import { useEffect, useState } from 'react';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from './useNotifications';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useNotificationEvents = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) return;

    // Only setup realtime if the channel function is available
    if (supabase && typeof supabase.channel === 'function') {
      try {
        // Subscribe to realtime notifications
        const channelName = `notifications_events_${user.id}`;
        const channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              try {
                const notification = payload.new;
                addNotification({
                  title: notification.title,
                  message: notification.message,
                  type: notification.type,
                  link: notification.link,
                });
              } catch (eventError) {
                console.error('Error processing notification event:', eventError);
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to notification events channel');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Failed to subscribe to notification events channel');
            }
          });

        setRealtimeChannel(channel);

        return () => {
          if (channel && typeof supabase.removeChannel === 'function') {
            try {
              supabase.removeChannel(channel);
            } catch (removeError) {
              console.error('Error removing notification events channel:', removeError);
            }
          }
        };
      } catch (error) {
        console.error('Error setting up notification events subscription:', error);
      }
    } else {
      console.warn('Realtime functionality is not available for notification events');
    }
  }, [user, addNotification]);
}; 