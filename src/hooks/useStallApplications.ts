import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StallApplication, ApplicationStatus, StallApplicationFilters } from '@/types/stall-applications';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { sendApplicationStatusEmail } from '@/services/email/applicationEmailService';
import { useToast } from '@/hooks/use-toast';

interface UseStallApplicationsReturn {
  applications: StallApplication[];
  isLoading: boolean;
  error: Error | null;
  updateApplicationStatus: (id: string, status: ApplicationStatus, comments?: string) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  filters: StallApplicationFilters;
  setFilters: (filters: StallApplicationFilters) => void;
}

export function useStallApplications(initialFilters?: StallApplicationFilters): UseStallApplicationsReturn {
  const { user } = useAuth();
  const { toast } = useToast();
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

        const isManager = user.user_metadata?.role === 'manager';
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
          .order('created_at', { ascending: false });

        // Apply filters
        if (filters.exhibitionId) {
          query = query.eq('exhibition_id', filters.exhibitionId);
        }
        
        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        if (!isManager) {
          // For non-managers, only show applications for their exhibitions
          const { data: exhibitions, error: exhibitionsError } = await supabase
            .from('exhibitions')
            .select('id')
            .eq('organiser_id', user.id);

          if (exhibitionsError) {
            throw new Error('Failed to fetch your exhibitions');
          }

          if (!exhibitions || exhibitions.length === 0) {
            setApplications([]);
            return;
          }

          query = query.in('exhibition_id', exhibitions.map(e => e.id));
        }

        const { data: applications, error: applicationsError } = await query;

        if (applicationsError) {
          throw new Error('Failed to fetch applications');
        }

        setApplications(applications || []);
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

  const updateApplicationStatus = async (id: string, status: ApplicationStatus, comments?: string) => {
    try {
      const { error } = await supabase
        .from('stall_applications')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === id ? { ...app, status } : app
        )
      );

      // Send email notification
      try {
        const paymentRequired = status === 'payment_pending';
        const emailSent = await sendApplicationStatusEmail({
          applicationId: id,
          status,
          comments,
          paymentRequired
        });

        if (emailSent) {
          toast({
            title: "Email notification sent",
            description: `The brand has been notified about the application status update.`,
          });
        } else {
          toast({
            title: "Email notification failed",
            description: "The application was updated, but we couldn't send an email notification.",
            variant: "destructive",
          });
        }
      } catch (emailError) {
        console.error('Error sending application status email:', emailError);
        toast({
          title: "Email notification failed",
          description: "The application was updated, but we couldn't send an email notification.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error in updateApplicationStatus:', err);
      toast({
        title: "Update failed",
        description: "Failed to update the application status.",
        variant: "destructive",
      });
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
      
      toast({
        title: "Application deleted",
        description: "The application has been deleted successfully.",
      });
    } catch (err) {
      console.error('Error in deleteApplication:', err);
      toast({
        title: "Delete failed",
        description: "Failed to delete the application.",
        variant: "destructive",
      });
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