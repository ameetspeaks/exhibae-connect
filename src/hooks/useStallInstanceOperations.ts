import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/integrations/supabase/AuthProvider';

export const useStallInstanceOperations = (exhibitionId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const updatePrice = useMutation({
    mutationFn: async ({ instanceId, price }: { instanceId: string; price: number }) => {
      // First, update the price
      const { error: updateError } = await supabase
        .from('stall_instances')
        .update({ price })
        .eq('id', instanceId);

      if (updateError) throw updateError;

      // Then fetch the updated instance with all relations
      const { data, error: fetchError } = await supabase
        .from('stall_instances')
        .select(`
          *,
          stall:stalls (
            id,
            name,
            width,
            length,
            price,
            unit:measurement_units (
              id,
              name,
              symbol
            )
          )
        `)
        .eq('id', instanceId)
        .single();

      if (fetchError) throw fetchError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stall_instances', exhibitionId] });
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ instanceId, status }: { instanceId: string; status: string }) => {
      const { data, error } = await supabase
        .from('stall_instances')
        .update({ status })
        .eq('id', instanceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stall_instances', exhibitionId] });
    }
  });

  const deleteInstance = useMutation({
    mutationFn: async (instanceId: string) => {
      // First check if the instance can be deleted
      const { data: instance, error: checkError } = await supabase
        .from('stall_instances')
        .select('status')
        .eq('id', instanceId)
        .single();

      if (checkError) throw checkError;
      if (instance.status !== 'available') {
        throw new Error('Cannot delete a stall that is not available');
      }

      const { error } = await supabase
        .from('stall_instances')
        .delete()
        .eq('id', instanceId);

      if (error) throw error;
      return instanceId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stall_instances', exhibitionId] });
    }
  });

  const applyForStall = useMutation({
    mutationFn: async ({ stallInstanceId, message }: { stallInstanceId: string; message: string }) => {
      if (!user) throw new Error('User not authenticated');

      // Get the stall instance details first
      const { data: stallInstance, error: instanceError } = await supabase
        .from('stall_instances')
        .select(`
          id,
          stall_id,
          exhibition_id,
          status
        `)
        .eq('id', stallInstanceId)
        .single();

      if (instanceError) throw instanceError;
      if (!stallInstance) throw new Error('Stall instance not found');
      if (stallInstance.status !== 'available') throw new Error('Stall is not available');

      // Check if there are any pending applications for this stall instance
      const { data: existingApplications, error: checkError } = await supabase
        .from('stall_applications')
        .select('id')
        .eq('stall_instance_id', stallInstanceId)
        .eq('status', 'pending');

      if (checkError) throw checkError;
      if (existingApplications && existingApplications.length > 0) {
        throw new Error('This stall already has a pending application');
      }

      // Create the application
      const { data: application, error: applicationError } = await supabase
        .from('stall_applications')
        .insert({
          stall_id: stallInstance.stall_id,
          stall_instance_id: stallInstance.id,
          exhibition_id: stallInstance.exhibition_id,
          brand_id: user.id,
          status: 'pending',
          message: message,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (applicationError) throw applicationError;

      // Update stall instance status to pending
      const { error: stallUpdateError } = await supabase
        .from('stall_instances')
        .update({ status: 'pending' })
        .eq('id', stallInstanceId)
        .eq('status', 'available'); // Only update if still available

      if (stallUpdateError) throw stallUpdateError;

      return application;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stall_instances', exhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['stalls', exhibitionId] });
    }
  });

  return {
    updatePrice,
    updateStatus,
    deleteInstance,
    applyForStall
  };
}; 