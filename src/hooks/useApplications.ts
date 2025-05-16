import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface Application {
  id: string;
  exhibition_id: string;
  brand_id: string;
  stall_type_id: string;
  status: 'pending' | 'approved' | 'rejected';
  company_description: string;
  special_requirements?: string;
  applied_at: string;
  updated_at: string;
  exhibition?: {
    title: string;
    location: string;
    start_date: string;
    end_date: string;
  };
  stall_type?: {
    name: string;
    price: number;
    size: string;
  };
}

export interface CreateApplicationData {
  exhibition_id: string;
  stall_type_id: string;
  company_description: string;
  special_requirements?: string;
}

export const useApplications = (status?: string) => {
  const { toast } = useToast();

  const fetchApplications = async () => {
    let query = supabase
      .from('applications')
      .select(`
        *,
        exhibition:exhibitions (
          title,
          location,
          start_date,
          end_date
        ),
        stall_type:stall_types (
          name,
          price,
          size
        )
      `);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  };

  return useQuery<Application[]>({
    queryKey: ['applications', status],
    queryFn: fetchApplications,
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to fetch applications. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

export const useCreateApplication = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateApplicationData) => {
      const { error } = await supabase
        .from('applications')
        .insert([{
          ...data,
          brand_id: (await supabase.auth.getUser()).data.user?.id,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({
        title: 'Success',
        description: 'Your application has been submitted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

// Set up real-time subscription for application status changes
export const useApplicationStatusChanges = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const subscribe = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const subscription = supabase
      .channel('application-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'applications',
          filter: `brand_id=eq.${user.id}`,
        },
        (payload) => {
          // Update the application in the cache
          queryClient.setQueryData(['applications'], (old: Application[] | undefined) => {
            if (!old) return old;
            return old.map(app => 
              app.id === payload.new.id ? { ...app, ...payload.new } : app
            );
          });

          // Show notification
          toast({
            title: 'Application Updated',
            description: `Application status changed to ${payload.new.status}`,
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  return { subscribe };
}; 