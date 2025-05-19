import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StallApplication, ApplicationFormData } from '@/types/exhibition-management';

export const useApplications = (exhibitionId?: string) => {
  const queryClient = useQueryClient();

  const applications = useQuery({
    queryKey: ['applications', exhibitionId],
    queryFn: async () => {
      try {
        // Get the current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) throw new Error('Not authenticated');

        // First get the exhibitions where the user is an organizer
        const { data: exhibitions, error: exhibitionsError } = await supabase
          .from('exhibitions')
          .select('id, title, organiser_id')
          .eq('organiser_id', user.id);

        if (exhibitionsError) throw exhibitionsError;
        
        if (!exhibitions || exhibitions.length === 0) {
          return []; // Return empty array if organizer has no exhibitions
        }

        const exhibitionIds = exhibitionId 
          ? [exhibitionId] 
          : exhibitions.map(e => e.id);

        // Then fetch applications for these exhibitions
        const { data, error } = await supabase
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
              status,
              unit:measurement_units (
                id,
                name,
                symbol
              )
            ),
            brand:profiles (
              id,
              email,
              full_name,
              phone,
              company_name,
              avatar_url
            ),
            exhibition:exhibitions (
              id,
              title,
              city,
              state,
              start_date,
              end_date,
              status
            ),
            payment_submissions!inner (
              id,
              amount,
              transaction_id,
              email,
              proof_file_url,
              notes,
              status,
              rejection_reason,
              rejection_date,
              reviewed_at,
              reviewed_by
            )
          `)
          .in('exhibition_id', exhibitionIds)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return data as StallApplication[];
      } catch (error) {
        console.error('Error in applications query:', error);
        throw error;
      }
    },
    enabled: true,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const createApplication = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      const { data: newApplication, error } = await supabase
        .from('stall_applications')
        .insert([data])
        .select(`
          *,
          stall:stalls (
            id,
            name,
            length,
            width,
            price,
            quantity,
            status,
            unit:measurement_units (
              id,
              name,
              symbol
            )
          ),
          brand:profiles (
            id,
            email,
            full_name,
            phone,
            company_name
          ),
          exhibition:exhibitions (
            id,
            title
          )
        `)
        .single();

      if (error) {
        console.error('Error creating application:', error);
        throw error;
      }
      return newApplication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    }
  });

  const updateApplication = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StallApplication['status'] }) => {
      console.log('Mutation starting with:', { id, status });
      if (!id || !status) {
        throw new Error('Invalid parameters: id and status are required');
      }

      const { data: updatedApplication, error } = await supabase
        .from('stall_applications')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          stall:stalls (
            id,
            name,
            length,
            width,
            price,
            quantity,
            status,
            unit:measurement_units (
              id,
              name,
              symbol
            )
          ),
          brand:profiles (
            id,
            email,
            full_name,
            phone,
            company_name
          ),
          exhibition:exhibitions (
            id,
            title
          )
        `)
        .single();

      if (error) {
        console.error('Error updating application:', error);
        throw new Error(`Failed to update application: ${error.message}`);
      }

      console.log('Update successful:', updatedApplication);
      return updatedApplication;
    },
    onSuccess: (data) => {
      console.log('Mutation succeeded, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (error) => {
      console.error('Mutation failed:', error);
    }
  });

  const deleteApplication = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('stall_applications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting application:', error);
        throw error;
      }
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