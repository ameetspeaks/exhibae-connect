import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface BrandProfile {
  id: string;
  user_id: string;
  company_name: string;
  description?: string;
  website?: string;
  contact_email: string;
  contact_phone?: string;
  logo_url?: string;
  social_media: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  application_updates: boolean;
  new_exhibitions: boolean;
  marketing_emails: boolean;
}

export const useBrandProfile = () => {
  const { toast } = useToast();

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const { data, error } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  };

  return useQuery<BrandProfile>({
    queryKey: ['brandProfile'],
    queryFn: fetchProfile,
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to fetch brand profile. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateBrandProfile = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<BrandProfile>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('brand_profiles')
        .upsert({
          user_id: user.id,
          ...data,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brandProfile'] });
      toast({
        title: 'Success',
        description: 'Brand profile updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to update brand profile. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useNotificationSettings = () => {
  const { toast } = useToast();

  const fetchSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    // Return default settings if none exist
    return data || {
      email_notifications: true,
      application_updates: true,
      new_exhibitions: true,
      marketing_emails: false,
    };
  };

  return useQuery<NotificationSettings>({
    queryKey: ['notificationSettings'],
    queryFn: fetchSettings,
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to fetch notification settings. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateNotificationSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<NotificationSettings>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          ...data,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
      toast({
        title: 'Success',
        description: 'Notification settings updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to update notification settings. Please try again.',
        variant: 'destructive',
      });
    },
  });
}; 