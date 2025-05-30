import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { useAuthenticatedAction } from './useAuthenticatedAction';

export const useBrandFavorite = (brandId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { withAuth, showLoginPrompt, closeLoginPrompt } = useAuthenticatedAction();

  const toggleFavorite = () => {
    withAuth(async () => {
      try {
        setIsSubmitting(true);

        // Verify that the brand exists and is active
        const { data: brandProfile, error: brandError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', brandId)
          .eq('role', 'brand')
          .single();

        if (brandError || !brandProfile) {
          console.error('Error verifying brand:', brandError);
          toast({
            title: 'Error',
            description: 'Brand not found. Please try again.',
            variant: 'destructive',
          });
          return;
        }

        // Check if the brand is already favorited
        const { data: existingFavorite } = await supabase
          .from('brand_favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('brand_id', brandId)
          .single();

        if (existingFavorite) {
          // Remove from favorites
          const { error: deleteError } = await supabase
            .from('brand_favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('brand_id', brandId);

          if (deleteError) throw deleteError;

          toast({
            title: 'Brand removed from favorites',
            description: 'The brand has been removed from your favorites.',
          });
        } else {
          // Add to favorites
          const { error: insertError } = await supabase
            .from('brand_favorites')
            .insert([
              {
                user_id: user.id,
                brand_id: brandId,
              },
            ]);

          if (insertError) throw insertError;

          toast({
            title: 'Brand added to favorites',
            description: 'The brand has been added to your favorites.',
          });
        }

        // Invalidate relevant queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['brand-favorites'] }),
          queryClient.invalidateQueries({ queryKey: ['brand', brandId] }),
          queryClient.invalidateQueries({ queryKey: ['brands'] }),
          queryClient.invalidateQueries({ queryKey: ['my-favorites-brands'] })
        ]);
      } catch (error) {
        console.error('Error toggling brand favorite:', error);
        toast({
          title: 'Error',
          description: 'Failed to update favorites. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  return {
    toggleFavorite,
    isSubmitting,
    showLoginPrompt,
    closeLoginPrompt
  };
}; 