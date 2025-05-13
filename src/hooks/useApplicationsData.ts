import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StallApplication, ApplicationFormData } from '@/types/exhibition-management';

export const useApplications = (exhibitionId?: string) => {
  const queryClient = useQueryClient();

  const applications = useQuery({
    queryKey: ['applications', exhibitionId],
    queryFn: async () => {
      let query = supabase
        .from('stall_applications')
        .select(`
          *,
          stall:stalls (
            id,
            name,
            length,
            width,
            price,
            quantity,
            status
          ),
          brand:brands (
            id,
            name,
            email,
            phone,
            company
          ),
          exhibition:exhibitions (
            id,
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (exhibitionId) {
        query = query.eq('exhibition_id', exhibitionId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as StallApplication[];
    },
    enabled: true
  });

  const createApplication = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      const { data: newApplication, error } = await supabase
        .from('stall_applications')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return newApplication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    }
  });

  const updateApplication = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StallApplication['status'] }) => {
      const { data: updatedApplication, error } = await supabase
        .from('stall_applications')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedApplication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    }
  });

  const deleteApplication = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('stall_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    }
  });

  return {
    applications,
    createApplication,
    updateApplication,
    deleteApplication
  };
}; 