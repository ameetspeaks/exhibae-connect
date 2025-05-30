import { useState } from 'react';
import { useAuth } from '@/integrations/supabase/AuthProvider';

export const useAuthenticatedAction = () => {
  const { user } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const withAuth = async (action: () => Promise<void> | void) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    try {
      await action();
    } catch (error) {
      console.error('Error executing authenticated action:', error);
    }
  };

  return {
    withAuth,
    showLoginPrompt,
    closeLoginPrompt: () => setShowLoginPrompt(false),
  };
}; 