import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/integrations/supabase/AuthProvider';

export interface BrandProfile {
  id: string;
  user_id: string;
  company_name: string;
  description?: string;
  website?: string;
  contact_email: string;
  contact_phone?: string;
  logo_url?: string;
  cover_image_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery<BrandProfile, Error>({
    queryKey: ['brandProfile', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        toast({
          title: "Error",
          description: "Failed to fetch brand profile",
          variant: "destructive",
        });
        throw error;
      }

      // If no profile exists, create one
      if (!data) {
        const newProfile = {
          user_id: user.id,
          company_name: user.user_metadata?.company_name || '',
          description: user.user_metadata?.description || '',
          website: user.user_metadata?.website_url || '',
          contact_phone: user.user_metadata?.phone || '',
          contact_email: user.email || '',
          logo_url: '',
          cover_image_url: '',
          facebook_url: '',
          instagram_url: '',
          twitter_url: '',
          linkedin_url: ''
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('brand_profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) throw createError;
        return createdProfile;
      }

      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
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