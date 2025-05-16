import { useAuth } from '@/integrations/supabase/AuthProvider';
import { UserRole } from '@/types/auth';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export const useUser = () => {
  const { user, loading } = useAuth();

  const userProfile: UserProfile | null = user ? {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || '',
    role: (user.user_metadata?.role || 'brand').toLowerCase() as UserRole,
  } : null;

  return {
    user: userProfile,
    loading,
  };
}; 