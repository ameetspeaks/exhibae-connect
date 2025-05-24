import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface BrandInterest {
  id: string;
  created_at: string;
  notes?: string;
  exhibition_id: string;
  exhibition: {
    id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    venue_name?: string;
    location?: string;
    venue?: string;
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
  const [noDataFound, setNoDataFound] = useState(false);

  // Add debug info at the hook level
  console.log("[useBrandInterests] Hook initialized with:", {
    userAuthenticated: !!user,
    userId: user?.id,
    userEmail: user?.email,
    filters
  });

  // Function to create test data if needed
  const createTestData = async () => {
    if (!user) return;
    
    try {
      console.log("[Debug] Creating test data for exhibition interests");
      
      // Check if we have any exhibitions
      const { data: exhibitionData, error: exhibitionError } = await supabase
        .from('exhibitions')
        .select('id')
        .limit(1);
      
      if (exhibitionError) throw exhibitionError;
      
      if (!exhibitionData || exhibitionData.length === 0) {
        console.log("[Debug] No exhibitions found to create test data");
        return;
      }
      
      const exhibitionId = exhibitionData[0].id;
      
      // Check if we have any profiles with role "brand"
      const { data: brandData, error: brandError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'brand')
        .limit(1);
      
      if (brandError) throw brandError;
      
      if (!brandData || brandData.length === 0) {
        console.log("[Debug] No brand profiles found to create test data");
        return;
      }
      
      const brandId = brandData[0].id;
      
      // Create test interest
      const { data, error } = await supabase
        .from('exhibition_interests')
        .insert([
          {
            exhibition_id: exhibitionId,
            brand_id: brandId,
            notes: 'Test interest created for debugging purposes'
          }
        ])
        .select();
      
      if (error) throw error;
      
      console.log("[Debug] Test data created successfully:", data);
      toast({
        title: 'Test Data Created',
        description: 'A test brand interest record was created.'
      });
      
      // Refresh data
      fetchInterests();
    } catch (err) {
      console.error('[Debug] Error creating test data:', err);
      toast({
        title: 'Error',
        description: 'Failed to create test data.',
        variant: 'destructive'
      });
    }
  };

  const fetchInterests = async () => {
    if (!user) {
      console.log("[useBrandInterests] No authenticated user found");
      setError(new Error('You must be logged in'));
      setIsLoading(false);
      return;
    }
    
    console.log('[Debug] Fetching interests with filters:', filters);
    
    try {
      setIsLoading(true);
      setError(null);

      // Fetch exhibitions first
      console.log('[Debug] Fetching exhibitions list');
      const { data: exhibitionsList, error: exhibitionsListError } = await supabase
        .from('exhibitions')
        .select('id, title')
        .order('title', { ascending: true });

      if (exhibitionsListError) {
        console.error('[Debug] Error fetching exhibitions:', exhibitionsListError);
        throw exhibitionsListError;
      }
      
      console.log('[Debug] Fetched exhibitions:', exhibitionsList ? exhibitionsList.length : 0);
      setExhibitions(exhibitionsList || []);

      // Query exhibition interests
      console.log('[Debug] Building exhibition interests query');
      let query = supabase
        .from('exhibition_interests')
        .select(`
          id,
          exhibition_id,
          brand_id,
          created_at,
          notes
        `)
        .order('created_at', { ascending: false });

      // Apply exhibition filter if provided
      if (filters?.exhibitionId) {
        // Only apply filter if it's a valid UUID
        const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.exhibitionId);
        
        if (isValidUuid) {
          console.log(`[Debug] Applying exhibition filter: ${filters.exhibitionId}`);
          query = query.eq('exhibition_id', filters.exhibitionId);
        } else {
          console.log(`[Debug] Skipping invalid exhibition filter: ${filters.exhibitionId}`);
        }
      }

      // Add debug logging for the query
      console.log('[Debug] Executing query:', {
        table: 'exhibition_interests',
        filter: filters?.exhibitionId ? `exhibition_id = ${filters.exhibitionId}` : 'none'
      });

      const { data, error } = await query;

      if (error) {
        console.error('[Debug] Database query error:', error);
        throw error;
      }

      console.log('[Debug] Fetched interests data:', data ? `${data.length} records` : 'No data');
      
      if (!data || data.length === 0) {
        console.log('[Debug] No interest records found');
        setInterests([]);
        return;
      }

      // Now fetch the related exhibitions and brand data separately
      const exhibitionIds = [...new Set(data.map(item => item.exhibition_id))];
      const brandIds = [...new Set(data.map(item => item.brand_id))];
      
      console.log(`[Debug] Fetching ${exhibitionIds.length} exhibitions and ${brandIds.length} brands`);
      
      // Fetch exhibitions
      const { data: exhibitionsData, error: exhibitionsError } = await supabase
        .from('exhibitions')
        .select('id, title, description, start_date, end_date, address, city, state, country')
        .in('id', exhibitionIds);
        
      if (exhibitionsError) {
        console.error('[Debug] Error fetching exhibitions:', exhibitionsError);
        throw exhibitionsError;
      }
      
      // Fetch brands
      const { data: brandsData, error: brandsError } = await supabase
        .from('profiles')
        .select('id, full_name, email, company_name, phone')
        .in('id', brandIds);
        
      if (brandsError) {
        console.error('[Debug] Error fetching brands:', brandsError);
        throw brandsError;
      }
      
      console.log(`[Debug] Fetched ${exhibitionsData?.length || 0} exhibitions and ${brandsData?.length || 0} brands`);
      
      // Create lookup maps for faster access
      const exhibitionsMap = (exhibitionsData || []).reduce((map, item) => {
        map[item.id] = item;
        return map;
      }, {});
      
      const brandsMap = (brandsData || []).reduce((map, item) => {
        map[item.id] = item;
        return map;
      }, {});
      
      // Transform to match interface
      console.log('[Debug] Transforming data');
      try {
        const transformedData = data.map(interest => {
          const exhibition = exhibitionsMap[interest.exhibition_id];
          const brand = brandsMap[interest.brand_id];
          
          if (!exhibition || !brand) {
            console.log(`[Debug] Missing data for interest ${interest.id} - exhibition: ${!!exhibition}, brand: ${!!brand}`);
            return null;
          }
          
          return {
            id: interest.id,
            created_at: interest.created_at,
            notes: interest.notes,
            exhibition_id: interest.exhibition_id,
            exhibition: {
              id: exhibition.id,
              title: exhibition.title,
              description: exhibition.description,
              start_date: exhibition.start_date,
              end_date: exhibition.end_date,
              venue_name: exhibition.address, // Use address as venue_name since venue_name doesn't exist
              location: `${exhibition.address || ''}, ${exhibition.city || ''}, ${exhibition.state || ''}, ${exhibition.country || ''}`.replace(/^[, ]+|[, ]+$/g, '') || 'N/A',
              venue: exhibition.venue
            },
            brand: {
              id: brand.id,
              full_name: brand.full_name,
              email: brand.email,
              company_name: brand.company_name,
              phone: brand.phone
            }
          };
        }).filter(Boolean); // Remove any null entries
        
        console.log('[Debug] Transformed data:', transformedData.length);
        setInterests(transformedData);
      } catch (transformError) {
        console.error('[Debug] Error transforming data:', transformError);
        throw transformError;
      }
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

  useEffect(() => {
    fetchInterests();
  }, [user, filters?.exhibitionId]); // Only depend on user and exhibitionId, not the entire filters object

  return {
    interests,
    exhibitions,
    isLoading,
    error
  };
} 