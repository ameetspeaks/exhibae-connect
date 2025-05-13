import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { UserRole } from '@/types/auth';

export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // First check user metadata
      const metadataRole = session.user.user_metadata?.role;

      // Fetch profile data with error handling
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.log('Profile not found, will create one');
        } else {
          console.error('Error fetching profile:', profileError);
          throw profileError;
        }
      }

      // If no profile exists, create one with the role from metadata
      if (!profileData) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
            role: metadataRole || 'shopper',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('role')
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          throw insertError;
        }

        setIsAdmin(newProfile.role === 'manager');
        setLoading(false);
        return;
      }

      // If profile exists but roles don't match, update profile
      if (metadataRole && profileData.role !== metadataRole) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            role: metadataRole,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id);

        if (updateError) {
          console.error('Error updating profile role:', updateError);
          throw updateError;
        }
      }

      // Use metadata role if available, otherwise use profile role
      const finalRole = metadataRole || profileData.role;
      setIsAdmin(finalRole === 'manager');

    } catch (error: any) {
      console.error('Error checking admin status:', error);
      toast({
        title: "Error",
        description: "Failed to verify manager status. Please try logging in again.",
        variant: "destructive",
      });
      setIsAdmin(false);
      await supabase.auth.signOut();
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (email: string, password: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user data returned');

      // Check both metadata and profile
      const metadataRole = authData.user.user_metadata?.role;
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      const isManager = metadataRole === 'manager' || (profile && profile.role === 'manager');

      if (!isManager) {
        throw new Error('Unauthorized. This login is restricted to managers only.');
      }

      toast({
        title: "Manager Access Granted",
        description: "Welcome to the manager dashboard!",
      });

      navigate('/dashboard/manager');
      return true;

    } catch (error: any) {
      toast({
        title: "Access Denied",
        description: error.message || "Invalid credentials or unauthorized access.",
        variant: "destructive",
      });
      await supabase.auth.signOut();
      return false;
    }
  };

  const quickAdminLogin = async () => {
    return adminLogin('manager@exhibae.com', 'manager123');
  };

  return {
    isAdmin,
    loading,
    adminLogin,
    quickAdminLogin,
    checkAdminStatus,
  };
}; 