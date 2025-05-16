import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Stall, StallApplication } from '@/types/exhibition-management';

export const useStallData = (exhibitionId: string) => {
  const queryClient = useQueryClient();

  const { data: stalls, isLoading, error } = useQuery({
    queryKey: ['stalls', exhibitionId],
    queryFn: async () => {
      // First, get all stalls for the exhibition with their applications
      const { data: stallsData, error: stallsError } = await supabase
        .from('stalls')
        .select(`
          id,
          exhibition_id,
          name,
          width,
          length,
          price,
          quantity,
          status,
          unit_id,
          description,
          stall_applications (
            id,
            status,
            brand_id,
            booking_confirmed
          )
        `)
        .eq('exhibition_id', exhibitionId);

      if (stallsError) throw stallsError;

      // Transform the data to include the correct status
      const transformedStalls = stallsData.map((stall: any): Stall => {
        const applications = stall.stall_applications || [];
        let status = stall.status || 'available';

        // First check for any pending applications
        if (applications.some(app => app.status === 'pending')) {
          status = 'pending';
        }
        // Then check for confirmed/approved applications
        else if (applications.some(app => app.status === 'approved' && app.booking_confirmed)) {
          status = 'booked';
        }

        return {
          id: stall.id,
          exhibition_id: stall.exhibition_id,
          name: stall.name,
          width: stall.width,
          length: stall.length,
          price: stall.price,
          quantity: stall.quantity,
          status: status,
          unit_id: stall.unit_id,
          description: stall.description
        };
      });

      return transformedStalls;
    },
  });

  const submitApplication = useMutation({
    mutationFn: async (application: Omit<StallApplication, 'id' | 'created_at' | 'updated_at'>) => {
      // First check if the stall already has a pending application
      const { data: existingApplications, error: checkError } = await supabase
        .from('stall_applications')
        .select('id')
        .eq('stall_id', application.stall_id)
        .eq('status', 'pending');

      if (checkError) throw checkError;
      if (existingApplications && existingApplications.length > 0) {
        throw new Error('This stall already has a pending application');
      }

      const { data, error } = await supabase
        .from('stall_applications')
        .insert(application)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stalls', exhibitionId] });
    },
  });

  return {
    stalls,
    isLoading,
    error,
    submitApplication,
  };
}; 