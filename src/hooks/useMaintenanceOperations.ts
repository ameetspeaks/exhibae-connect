import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MaintenanceLog } from '@/types/exhibition-management';

export const useMaintenanceOperations = (stallInstanceId: string) => {
  const queryClient = useQueryClient();

  const maintenanceLogs = useQuery({
    queryKey: ['maintenance_logs', stallInstanceId],
    queryFn: async () => {
      // Skip the query if no stallInstanceId is provided or if it's an empty string
      if (!stallInstanceId || stallInstanceId.trim() === '') return [];

      const { data, error } = await supabase
        .from('maintenance_logs')
        .select('*, performed_by:profiles!inner(id, full_name, email)')
        .eq('stall_instance_id', stallInstanceId)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    // Disable the query when stallInstanceId is not available or empty
    enabled: !!stallInstanceId && stallInstanceId.trim() !== '',
    // Add stale time to prevent frequent refetches
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const scheduleMaintenance = useMutation({
    mutationFn: async (data: {
      maintenance_type: string;
      description?: string;
      next_maintenance_date?: string;
    }) => {
      const { data: maintenanceLog, error } = await supabase
        .from('maintenance_logs')
        .insert({
          stall_instance_id: stallInstanceId,
          maintenance_type: data.maintenance_type,
          description: data.description,
          next_maintenance_date: data.next_maintenance_date,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) throw error;

      // Update stall instance status and next maintenance date
      const { error: updateError } = await supabase
        .from('stall_instances')
        .update({
          status: 'under_maintenance',
          next_maintenance_date: data.next_maintenance_date
        })
        .eq('id', stallInstanceId);

      if (updateError) throw updateError;

      return maintenanceLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance_logs', stallInstanceId] });
      queryClient.invalidateQueries({ queryKey: ['stall_instances'] });
    }
  });

  const updateMaintenanceStatus = useMutation({
    mutationFn: async ({ logId, status, description }: { logId: string; status: MaintenanceLog['status']; description?: string }) => {
      const { data: maintenanceLog, error } = await supabase
        .from('maintenance_logs')
        .update({
          status,
          description: description || undefined
        })
        .eq('id', logId)
        .select()
        .single();

      if (error) throw error;

      // If maintenance is completed, update stall instance status
      if (status === 'completed') {
        const { error: updateError } = await supabase
          .from('stall_instances')
          .update({
            status: 'available',
            last_maintenance_date: new Date().toISOString()
          })
          .eq('id', stallInstanceId);

        if (updateError) throw updateError;
      }

      return maintenanceLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance_logs', stallInstanceId] });
      queryClient.invalidateQueries({ queryKey: ['stall_instances'] });
    }
  });

  const deleteMaintenance = useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase
        .from('maintenance_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance_logs', stallInstanceId] });
    }
  });

  return {
    maintenanceLogs,
    scheduleMaintenance,
    updateMaintenanceStatus,
    deleteMaintenance
  };
}; 