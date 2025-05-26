import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to manage exhibition favorites functionality
 * @param exhibitionId The ID of the exhibition to track favorites for
 */
export function useExhibitionFavorite(exhibitionId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if the current user has favorited this exhibition
  const { 
    data: isFavorite, 
    isLoading,
    refetch: refetchFavorite
  } = useQuery({
    queryKey: ['exhibition-favorite', exhibitionId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      try {
        const { data, error } = await supabase
          .from('exhibition_favorites')
          .select('exhibition_id')
          .eq('exhibition_id', exhibitionId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking favorite status:', error);
          return false;
        }

        return !!data;
      } catch (error) {
        console.error('Error checking favorite status:', error);
        return false;
      }
    },
    enabled: !!user && !!exhibitionId
  });

  // Get favorites count for an exhibition
  const { 
    data: favoritesCount,
    isLoading: isLoadingCount 
  } = useQuery({
    queryKey: ['exhibition-favorites-count', exhibitionId],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('exhibition_favorites')
          .select('exhibition_id', { count: 'exact', head: true })
          .eq('exhibition_id', exhibitionId);

        if (error) {
          console.error('Error fetching favorites count:', error);
          return 0;
        }

        return count || 0;
      } catch (error) {
        console.error('Error fetching favorites count:', error);
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
        .maybeSingle();
      
      // If no profile exists, create one
      if (!profile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            role: user.user_metadata?.role || 'shopper',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
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

  // Add favorite
  const addFavorite = useMutation({
    mutationFn: async () => {
      if (!user || !exhibitionId) throw new Error('User or exhibition ID missing');
      
      // Ensure user has a profile
      const profileExists = await ensureUserProfile();
      if (!profileExists) {
        throw new Error('Could not create or verify user profile');
      }

      const { data, error } = await supabase
        .from('exhibition_favorites')
        .insert([
          {
            exhibition_id: exhibitionId,
            user_id: user.id
          }
        ])
        .select('exhibition_id')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibition-favorite', exhibitionId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['exhibition-favorites-count', exhibitionId] });
      toast({
        title: "Added to Favorites",
        description: "Exhibition added to your favorites!",
      });
    },
    onError: (error: any) => {
      console.error('Error adding to favorites:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add to favorites. Please try again later.",
        variant: "destructive",
      });
    }
  });

  // Remove favorite
  const removeFavorite = useMutation({
    mutationFn: async () => {
      if (!user || !exhibitionId) throw new Error('User or exhibition ID missing');

      const { error } = await supabase
        .from('exhibition_favorites')
        .delete()
        .eq('exhibition_id', exhibitionId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibition-favorite', exhibitionId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['exhibition-favorites-count', exhibitionId] });
      toast({
        title: "Removed",
        description: "Exhibition removed from your favorites.",
      });
    },
    onError: (error: any) => {
      console.error('Error removing from favorites:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove from favorites. Please try again later.",
        variant: "destructive",
      });
    }
  });

  // Toggle favorite
  const toggleFavorite = () => {
    if (isFavorite) {
      removeFavorite.mutate();
    } else {
      addFavorite.mutate();
    }
  };

  return {
    isFavorite: isFavorite || false,
    isLoading: isLoading || isLoadingCount,
    isSubmitting: addFavorite.isPending || removeFavorite.isPending,
    favoritesCount,
    toggleFavorite
  };
} 