import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/integrations/supabase/AuthProvider';

export interface Subscription {
  id: string;
  email: string;
  name: string | null;
  user_id: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useSubscription = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      // For anonymous users, check by email from localStorage
      const savedEmail = localStorage.getItem('subscribedEmail');
      if (!user && !savedEmail) return null;

      const query = supabase
        .from('subscriptions')
        .select('*')
        .eq('is_active', true);

      // Add conditions based on user or saved email
      if (user) {
        query.eq('user_id', user.id);
      } else if (savedEmail) {
        query.eq('email', savedEmail);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }

      return data as Subscription | null;
    },
    enabled: true, // Always enable the query
  });
};

export const useSubscriptions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching subscriptions:', error);
        throw error;
      }

      return data as Subscription[];
    },
    enabled: !!user,
  });
}; 