import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface BrandInterest {
  id: string;
  created_at: string;
  notes?: string;
  exhibition: {
    id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    venue_name?: string;
    location?: string;
  };
  brand: {
    id: string;
    full_name: string;
    email: string;
    company_name: string;
    phone?: string;
  };
}

interface FilterOptions {
  exhibitionId?: string;
}

export function useBrandInterests(filters?: FilterOptions) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interests, setInterests] = useState<BrandInterest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [exhibitions, setExhibitions] = useState<{ id: string; title: string; }[]>([]);

  useEffect(() => {
    const fetchInterests = async () => {
      if (!user) {
        setError(new Error('You must be logged in'));
        setIsLoading(false);
        return;
      }
      
      console.log('[Debug] Fetching interests with filters:', filters);
      
      try {
        setIsLoading(true);
        setError(null);

        // Fetch exhibitions first
        const { data: exhibitionsData, error: exhibitionsError } = await supabase
          .from('exhibitions')
          .select('id, title')
          .order('title', { ascending: true });

        if (exhibitionsError) throw exhibitionsError;
        setExhibitions(exhibitionsData || []);

        // Query exhibition interests
        let query = supabase
          .from('exhibition_interests')
          .select(`
            id,
            exhibition_id,
            brand_id,
            created_at,
            notes,
            exhibition:exhibitions (
              id,
              title,
              description,
              start_date,
              end_date,
              address,
              city,
              state,
              country
            ),
            brand:profiles (
              id,
              full_name,
              email,
              company_name,
              phone
            )
          `)
          .order('created_at', { ascending: false });

        // Apply exhibition filter if provided
        if (filters?.exhibitionId) {
          query = query.eq('exhibition_id', filters.exhibitionId);
        }

        const { data, error } = await query;

        if (error) throw error;

        console.log('[Debug] Fetched interests data:', data);

        // Filter out any interests where exhibition or brand is null
        const validInterests = data?.filter(interest => interest.exhibition && interest.brand) || [];
        
        // Transform to match interface
        const transformedData = validInterests.map(interest => {
          // Handle nested objects properly
          const exhibition = Array.isArray(interest.exhibition) ? interest.exhibition[0] : interest.exhibition;
          const brand = Array.isArray(interest.brand) ? interest.brand[0] : interest.brand;
          
          return {
            id: interest.id,
            created_at: interest.created_at,
            notes: interest.notes,
            exhibition: {
              id: exhibition.id,
              title: exhibition.title,
              description: exhibition.description,
              start_date: exhibition.start_date,
              end_date: exhibition.end_date,
              venue_name: exhibition.address, // Use address as venue_name since venue_name doesn't exist
              location: `${exhibition.address || ''}, ${exhibition.city || ''}, ${exhibition.state || ''}, ${exhibition.country || ''}`.replace(/^[, ]+|[, ]+$/g, '') || 'N/A'
            },
            brand: {
              id: brand.id,
              full_name: brand.full_name,
              email: brand.email,
              company_name: brand.company_name,
              phone: brand.phone
            }
          };
        });

        console.log('[Debug] Transformed data:', transformedData);
        setInterests(transformedData);
      } catch (err) {
        console.error('Error fetching brand interests:', err);
        setError(err instanceof Error ? err : new Error('An unexpected error occurred'));
        toast({
          title: 'Error',
          description: 'Failed to load brand interests.',
          variant: 'destructive',
        });
        setInterests([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterests();
  }, [user, filters?.exhibitionId]); // Only depend on user and exhibitionId, not the entire filters object

  return {
    interests,
    exhibitions,
    isLoading,
    error
  };
} 