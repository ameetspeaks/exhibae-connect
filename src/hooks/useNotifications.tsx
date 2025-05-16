import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppNotification } from '@/types/notification';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

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
  const supabase = useSupabaseClient();
  const user = useUser();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (!user) return;

    // Subscribe to new notifications
    const channel = supabase
      .channel(`user_notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, async (payload) => {
        const newNotification = payload.new as AppNotification;
        
        // Show desktop notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(newNotification.title, {
            body: newNotification.message,
            icon: '/favicon.ico', // Update with your app's icon
          });
        }

        setNotifications(prev => [newNotification, ...prev]);
      })
      .subscribe();

    // Fetch existing notifications
    fetchNotifications();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const fetchNotifications = async () => {
    if (!user) return;

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

    setNotifications(data);
  };

  const markAsRead = async (id: string) => {
    if (!user) return;

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
  };

  const markAllAsRead = async () => {
    if (!user) return;

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
  };

  const addNotification = async (notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => {
    if (!user) return;

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