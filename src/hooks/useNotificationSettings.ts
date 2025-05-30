import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  desktop_notifications: boolean;
  sound_enabled: boolean;
  user_registered_enabled: boolean;
  exhibition_created_enabled: boolean;
  stall_booked_enabled: boolean;
  stall_updated_enabled: boolean;
  application_received_enabled: boolean;
  exhibition_reminder_enabled: boolean;
  payment_reminder_enabled: boolean;
  exhibition_cancelled_enabled: boolean;
  exhibition_updated_enabled: boolean;
  message_received_enabled: boolean;
  comment_received_enabled: boolean;
  review_submitted_enabled: boolean;
  review_response_enabled: boolean;
  profile_updated_enabled: boolean;
  document_uploaded_enabled: boolean;
  document_approved_enabled: boolean;
  document_rejected_enabled: boolean;
  exhibition_status_updated_enabled: boolean;
  payment_status_updated_enabled: boolean;
  stall_application_received_enabled: boolean;
  stall_approved_enabled: boolean;
}

const defaultSettings: Omit<NotificationSettings, 'id' | 'user_id'> = {
  email_notifications: true,
  desktop_notifications: true,
  sound_enabled: true,
  user_registered_enabled: true,
  exhibition_created_enabled: true,
  stall_booked_enabled: true,
  stall_updated_enabled: true,
  application_received_enabled: true,
  exhibition_reminder_enabled: true,
  payment_reminder_enabled: true,
  exhibition_cancelled_enabled: true,
  exhibition_updated_enabled: true,
  message_received_enabled: true,
  comment_received_enabled: true,
  review_submitted_enabled: true,
  review_response_enabled: true,
  profile_updated_enabled: true,
  document_uploaded_enabled: true,
  document_approved_enabled: true,
  document_rejected_enabled: true,
  exhibition_status_updated_enabled: true,
  payment_status_updated_enabled: true,
  stall_application_received_enabled: true,
  stall_approved_enabled: true,
};

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Only fetch settings when auth is loaded and we have a user
    if (!authLoading) {
      if (user?.id) {
        fetchSettings();
      } else {
        // If auth is loaded but no user, set loading to false
        setLoading(false);
      }
    }
  }, [user?.id, authLoading]);

  const fetchSettings = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default settings
          const { data: newSettings, error: createError } = await supabase
            .from('notification_settings')
            .insert([
              {
                user_id: user.id,
                ...defaultSettings,
              },
            ])
            .select('*')
            .single();

          if (createError) {
            console.error('Error creating notification settings:', createError);
            throw createError;
          }
          setSettings(newSettings);
        } else {
          console.error('Error fetching notification settings:', error);
          throw error;
        }
      } else {
        setSettings(data);
      }
    } catch (error: any) {
      console.error('Error fetching notification settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification settings. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!user?.id || !settings?.id) return;

    try {
      const { error } = await supabase
        .from('notification_settings')
        .update(newSettings)
        .eq('id', settings.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, ...newSettings } : null);
      toast({
        title: 'Settings Updated',
        description: 'Your notification preferences have been saved.',
      });
    } catch (error: any) {
      console.error('Error updating notification settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification settings.',
        variant: 'destructive',
      });
    }
  };

  const isEnabled = (type: keyof Omit<NotificationSettings, 'id' | 'user_id'>) => {
    return settings?.[type] ?? defaultSettings[type];
  };

  return {
    settings,
    loading: loading || authLoading,
    updateSettings,
    isEnabled,
  };
} 