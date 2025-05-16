import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StallApplication, ApplicationStatus, StallApplicationFilters } from '@/types/stall-applications';
import { useAuth } from '@/integrations/supabase/AuthProvider';

interface UseStallApplicationsReturn {
  applications: StallApplication[];
  isLoading: boolean;
  error: Error | null;
  updateApplicationStatus: (id: string, status: ApplicationStatus) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  filters: StallApplicationFilters;
  setFilters: (filters: StallApplicationFilters) => void;
}

export function useStallApplications(initialFilters?: StallApplicationFilters): UseStallApplicationsReturn {
  const { user } = useAuth();
  const [applications, setApplications] = useState<StallApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<StallApplicationFilters>(initialFilters || {});

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) {
        setError(new Error('You must be logged in to view applications'));
        setIsLoading(false);
        return;
      }
      
      console.log('[Debug] Starting fetchApplications with user:', user.id);
      console.log('[Debug] Current filters:', filters);
      
      try {
        setIsLoading(true);
        setError(null);

        // If we have a specific exhibition ID, verify access first
        if (filters.exhibitionId) {
          console.log('[Debug] Fetching specific exhibition:', filters.exhibitionId);
          
          const { data: exhibition, error: exhibitionError } = await supabase
            .from('exhibitions')
            .select('id, organiser_id')
            .eq('id', filters.exhibitionId)
            .single();

          console.log('[Debug] Exhibition check result:', { exhibition, error: exhibitionError });

          if (exhibitionError) {
            throw new Error('Exhibition not found');
          }

          if (exhibition.organiser_id !== user.id) {
            throw new Error('You do not have permission to view applications for this exhibition');
          }

          // Fetch applications for this specific exhibition
          console.log('[Debug] Fetching applications for exhibition:', filters.exhibitionId);
          
          const { data: applications, error: applicationsError } = await supabase
            .from('stall_applications')
            .select(`
              *,
              stall:stalls (
                id,
                name,
                length,
                width,
                price,
                status,
                unit:measurement_units (
                  id,
                  name,
                  symbol
                )
              ),
              stall_instance:stall_instances (
                id,
                instance_number,
                position_x,
                position_y,
                rotation_angle,
                status
              ),
              brand:profiles!stall_applications_brand_id_fkey (
                id,
                full_name,
                email,
                phone,
                company_name,
                avatar_url
              ),
              exhibition:exhibitions (
                id,
                title,
                start_date,
                end_date,
                status
              )
            `)
            .eq('exhibition_id', filters.exhibitionId)
            .order('created_at', { ascending: false });

          console.log('[Debug] Applications query result:', { applications, error: applicationsError });

          if (applicationsError) {
            throw new Error('Failed to fetch applications');
          }

          setApplications(applications || []);
        } else {
          // Fetch all exhibitions for the organizer
          console.log('[Debug] Fetching all exhibitions for organizer:', user.id);
          
          const { data: exhibitions, error: exhibitionsError } = await supabase
            .from('exhibitions')
            .select('id')
            .eq('organiser_id', user.id);

          console.log('[Debug] Exhibitions query result:', { exhibitions, error: exhibitionsError });

          if (exhibitionsError) {
            throw new Error('Failed to fetch your exhibitions');
          }

          if (!exhibitions || exhibitions.length === 0) {
            console.log('[Debug] No exhibitions found for organizer');
            setApplications([]);
            return;
          }

          // Fetch applications for all exhibitions
          console.log('[Debug] Fetching applications for exhibitions:', exhibitions.map(e => e.id));
          
          const { data: applications, error: applicationsError } = await supabase
            .from('stall_applications')
            .select(`
              *,
              stall:stalls (
                id,
                name,
                length,
                width,
                price,
                status,
                unit:measurement_units (
                  id,
                  name,
                  symbol
                )
              ),
              stall_instance:stall_instances (
                id,
                instance_number,
                position_x,
                position_y,
                rotation_angle,
                status
              ),
              brand:profiles!stall_applications_brand_id_fkey (
                id,
                full_name,
                email,
                phone,
                company_name,
                avatar_url
              ),
              exhibition:exhibitions (
                id,
                title,
                start_date,
                end_date,
                status
              )
            `)
            .in('exhibition_id', exhibitions.map(e => e.id))
            .order('created_at', { ascending: false });

          console.log('[Debug] Applications query result:', { applications, error: applicationsError });

          if (applicationsError) {
            throw new Error('Failed to fetch applications');
          }

          setApplications(applications || []);
        }
      } catch (err) {
        console.error('[Debug] Error in fetchApplications:', err);
        setError(err instanceof Error ? err : new Error('An unexpected error occurred'));
        setApplications([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [user, filters]);

  const updateApplicationStatus = async (id: string, status: ApplicationStatus) => {
    try {
      const { error } = await supabase
        .from('stall_applications')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setApplications(prev => 
        prev.map(app => 
          app.id === id ? { ...app, status } : app
        )
      );
    } catch (err) {
      console.error('Error in updateApplicationStatus:', err);
      throw err;
    }
  };

  const deleteApplication = async (id: string) => {
    try {
      const { error } = await supabase
        .from('stall_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setApplications(prev => prev.filter(app => app.id !== id));
    } catch (err) {
      console.error('Error in deleteApplication:', err);
      throw err;
    }
  };

  return {
    applications,
    isLoading,
    error,
    updateApplicationStatus,
    deleteApplication,
    filters,
    setFilters,
  };
} 