import { useState, useEffect } from 'react';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to manage exhibition attendance functionality
 * @param exhibitionId The ID of the exhibition to track attendance for
 */
export function useExhibitionAttendance(exhibitionId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if the current user is attending
  const { 
    data: isAttending, 
    isLoading: isCheckingAttendance,
    refetch: refetchAttendance
  } = useQuery({
    queryKey: ['exhibition-attendance', exhibitionId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      try {
        const { data, error } = await supabase
          .from('exhibition_attending')
          .select('*')
          .eq('exhibition_id', exhibitionId)
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking attendance:', error);
          return false;
        }

        return !!data;
      } catch (error) {
        console.error('Error checking attendance:', error);
        return false;
      }
    },
    enabled: !!user && !!exhibitionId
  });

  // Get attendance count for an exhibition
  const { 
    data: attendanceCount,
    isLoading: isLoadingCount 
  } = useQuery({
    queryKey: ['exhibition-attendance-count', exhibitionId],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('exhibition_attending')
          .select('*', { count: 'exact', head: true })
          .eq('exhibition_id', exhibitionId);

        if (error) {
          console.error('Error fetching attendance count:', error);
          return 0;
        }

        return count || 0;
      } catch (error) {
        console.error('Error fetching attendance count:', error);
        return 0;
      }
    },
    enabled: !!exhibitionId
  });

  // Ensure user has a profile record
  const ensureUserProfile = async () => {
    if (!user) return false;
    
    try {
      // Check if user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      // If no profile exists, create one
      if (profileError && profileError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            role: user.user_metadata?.role || 'shopper',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.error('Error creating profile:', insertError);
          return false;
        }
      } else if (profileError) {
        console.error('Error checking profile:', profileError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      return false;
    }
  };

  // Add attendance
  const addAttendance = useMutation({
    mutationFn: async () => {
      if (!user || !exhibitionId) throw new Error('User or exhibition ID missing');
      
      // Ensure user has a profile
      const profileExists = await ensureUserProfile();
      if (!profileExists) {
        throw new Error('Could not create or verify user profile');
      }

      const { data, error } = await supabase
        .from('exhibition_attending')
        .insert([
          {
            exhibition_id: exhibitionId,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibition-attendance', exhibitionId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['exhibition-attendance-count', exhibitionId] });
      toast({
        title: "Added to Attendees",
        description: "You've been added to the attendee list!",
      });
    },
    onError: (error: any) => {
      console.error('Error adding attendance:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add to attendees. Please try again later.",
        variant: "destructive",
      });
    }
  });

  // Remove attendance
  const removeAttendance = useMutation({
    mutationFn: async () => {
      if (!user || !exhibitionId) throw new Error('User or exhibition ID missing');

      const { error } = await supabase
        .from('exhibition_attending')
        .delete()
        .eq('exhibition_id', exhibitionId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibition-attendance', exhibitionId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['exhibition-attendance-count', exhibitionId] });
      toast({
        title: "Removed",
        description: "You've been removed from the attendee list.",
      });
    },
    onError: (error: any) => {
      console.error('Error removing attendance:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove from attendees. Please try again later.",
        variant: "destructive",
      });
    }
  });

  // Toggle attendance
  const toggleAttendance = () => {
    if (isAttending) {
      removeAttendance.mutate();
    } else {
      addAttendance.mutate();
    }
  };

  return {
    isAttending: isAttending || false,
    isLoading: isCheckingAttendance,
    isLoadingCount,
    attendanceCount: attendanceCount || 0,
    toggleAttendance,
    addAttendance,
    removeAttendance,
    isSubmitting: addAttendance.isPending || removeAttendance.isPending,
    refetchAttendance
  };
} 