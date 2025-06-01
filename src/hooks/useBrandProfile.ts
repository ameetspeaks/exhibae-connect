import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { BrandProfile } from '@/types/brand';

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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery<BrandProfile>({
    queryKey: ['brandProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');

      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('No profile found');

      return data as BrandProfile;
    },
    enabled: !!user?.id,
  });
};

export const useUpdateBrandProfile = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<BrandProfile, Error, Partial<BrandProfile>>({
    mutationFn: async (profile) => {
      const { data, error } = await supabase
        .from('brand_profiles')
        .update(profile)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      return data as BrandProfile;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['brandProfile'], data);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  });
};

export const useNotificationSettings = () => {
  const { toast } = useToast();

  return useQuery<NotificationSettings, Error>({
    queryKey: ['notificationSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch notification settings",
          variant: "destructive",
        });
        throw error;
      }

      return data as NotificationSettings;
    }
  });
};

export const useUpdateNotificationSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<NotificationSettings, Error, Partial<NotificationSettings>>({
    mutationFn: async (settings) => {
      const { data, error } = await supabase
        .from('notification_settings')
        .update(settings)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;
      return data as NotificationSettings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['notificationSettings'], data);
      toast({
        title: "Success",
        description: "Notification settings updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      });
    }
  });
}; 