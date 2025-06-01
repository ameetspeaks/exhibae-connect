import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
type NotificationSettings = Tables['notification_settings']['Row'];
type NotificationSettingsInsert = Tables['notification_settings']['Insert'];
type NotificationSettingsUpdate = Tables['notification_settings']['Update'];

const defaultSettings: Omit<NotificationSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
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
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

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
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      // First try to select existing settings
      const { data, error } = await supabase
        .from('notification_settings')
        .select()
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no settings found, try to create them
        if ((error as PostgrestError).code === 'PGRST116') {
          await createDefaultSettings();
        } else if ((error as PostgrestError).code === '42501' && retryCount < maxRetries) {
          // If permission error and haven't exceeded retries, wait and retry
          setRetryCount(prev => prev + 1);
          setTimeout(fetchSettings, 1000 * (retryCount + 1));
          return;
        } else {
          console.error('Error fetching notification settings:', error);
          throw error;
        }
      } else {
        setSettings(data as NotificationSettings);
        setRetryCount(0); // Reset retry count on success
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

  const createDefaultSettings = async () => {
    if (!user?.id) return;

    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const insertData: NotificationSettingsInsert = {
        user_id: user.id,
        ...defaultSettings,
      };

      const { data: newSettings, error: createError } = await supabase
        .from('notification_settings')
        .insert(insertData)
        .select()
        .single();

      if (createError) {
        if ((createError as PostgrestError).code === '42501' && retryCount < maxRetries) {
          // If permission error and haven't exceeded retries, wait and retry
          setRetryCount(prev => prev + 1);
          setTimeout(fetchSettings, 1000 * (retryCount + 1));
          return;
        }
        console.error('Error creating notification settings:', createError);
        throw createError;
      }

      setSettings(newSettings as NotificationSettings);
      setRetryCount(0); // Reset retry count on success
    } catch (error: any) {
      console.error('Error creating default settings:', error);
      throw error;
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettingsUpdate>) => {
    if (!user?.id || !settings?.id) return;

    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const { error } = await supabase
        .from('notification_settings')
        .update(newSettings)
        .eq('id', settings.id)
        .eq('user_id', user.id);

      if (error) {
        if ((error as PostgrestError).code === '42501') {
          toast({
            title: 'Permission Error',
            description: 'You do not have permission to update these settings.',
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

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

  const isEnabled = (type: keyof Omit<NotificationSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    return settings?.[type] ?? defaultSettings[type];
  };

  return {
    settings,
    loading: loading || authLoading,
    updateSettings,
    isEnabled,
  };
} 