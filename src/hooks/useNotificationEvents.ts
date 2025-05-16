import { useEffect } from 'react';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from './useNotifications';

export const useNotificationEvents = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!user) return;

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new;
          addNotification({
            title: notification.title,
            message: notification.message,
            type: notification.type,
            link: notification.link,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, addNotification]);
}; 