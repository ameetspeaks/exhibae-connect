import { useState } from 'react';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export const useBrandFavorite = (brandId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const toggleFavorite = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to favorite brands.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if the user is a shopper
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userProfile?.role !== 'shopper') {
        toast({
          title: 'Action not allowed',
          description: 'Only shoppers can favorite brands.',
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
      queryClient.invalidateQueries(['brand-favorites']);
      queryClient.invalidateQueries(['brand', brandId]);
      queryClient.invalidateQueries(['brands']);
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
  };

  return {
    toggleFavorite,
    isSubmitting,
  };
}; 