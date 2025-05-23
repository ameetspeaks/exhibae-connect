import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Exhibition, 
  ExhibitionFormData, 
  ExhibitionCategory, 
  VenueType,
  MeasuringUnit,
  EventType
} from '@/types/exhibition-management';
import { format } from 'date-fns';
import { useAuth } from '@/integrations/supabase/AuthProvider';

export const useCategories = () => {
  return useQuery({
    queryKey: ['exhibitionCategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exhibition_categories')
        .select('*')
        .order('name');
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as ExhibitionCategory[];
    }
  });
};

export const useVenueTypes = () => {
  return useQuery({
    queryKey: ['venueTypes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_types')
        .select('*')
        .order('name');
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as VenueType[];
    }
  });
};

export const useMeasuringUnits = () => {
  return useQuery({
    queryKey: ['measuringUnits'],
    queryFn: async () => {
      console.log('Fetching measuring units...');
      const { data, error } = await supabase
        .from('measurement_units')
        .select('id, name, symbol, type, description')
        .order('name');
      
      if (error) {
        console.error('Error fetching measuring units:', error);
        throw new Error(error.message);
      }

      console.log('Received measuring units:', data);

      // Transform the data to match the MeasuringUnit type
      const transformedData = data?.map(unit => ({
        id: unit.id,
        name: unit.name,
        symbol: unit.symbol,
        type: unit.type as MeasuringUnit['type'],
        description: unit.description
      })) || [];

      console.log('Transformed measuring units:', transformedData);
      
      return transformedData;
    }
  });
};

export const useEventTypes = () => {
  return useQuery({
    queryKey: ['eventTypes'],
    queryFn: async () => {
      console.log('Fetching event types...');
      const { data, error } = await supabase
        .from('event_types')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching event types:', error);
        throw new Error(error.message);
      }

      console.log('Event types loaded:', data);
      return data as EventType[];
    }
  });
};

export const useExhibitions = (organiserId?: string) => {
  return useQuery({
    queryKey: ['exhibitions', organiserId],
    queryFn: async () => {
      let query = supabase
        .from('exhibitions')
        .select(`
          *,
          category:exhibition_categories(*),
          venue_type:venue_types(*),
          event_type:event_types(*)
        `)
        .order('created_at', { ascending: false });
      
      if (organiserId) {
        query = query.eq('organiser_id', organiserId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Exhibition[];
    },
    enabled: !!organiserId
  });
};

export const useExhibition = (id: string) => {
  return useQuery({
    queryKey: ['exhibition', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exhibitions')
        .select(`
          *,
          category:exhibition_categories(*),
          venue_type:venue_types(*),
          event_type:event_types(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }

      // Transform the data to ensure IDs are correctly set
      const transformedData = {
        ...data,
        venue_type_id: data.venue_type_id || data.venue_type?.id,
        event_type_id: data.event_type_id || data.event_type?.id,
        category_id: data.category_id || data.category?.id
      };
      
      console.log('Transformed exhibition data:', transformedData);
      
      return transformedData as Exhibition;
    },
    enabled: !!id
  });
};

export const useCreateExhibition = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (exhibitionData: ExhibitionFormData) => {
      if (!user) throw new Error('User must be authenticated to create an exhibition');
      
      const formattedData = {
        ...exhibitionData,
        organiser_id: user.id,
        status: 'draft',
        start_date: exhibitionData.start_date,
        end_date: exhibitionData.end_date,
        start_time: exhibitionData.start_time || '11:00',
        end_time: exhibitionData.end_time || '17:00'
      };
      
      const { data, error } = await supabase
        .from('exhibitions')
        .insert(formattedData)
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Exhibition;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitions'] });
    }
  });
};

export const useUpdateExhibition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ exhibitionId, ...data }: ExhibitionFormData & { exhibitionId: string }) => {
      if (!exhibitionId) throw new Error('Exhibition ID is required');

      console.log('Updating exhibition with data:', { exhibitionId, data });

      // Format dates properly and exclude measuring_unit_id
      const { measuring_unit_id, ...restData } = data;
      const formattedData = {
        ...restData,
        title: restData.title,
        description: restData.description,
        address: restData.address || '',
        city: restData.city || '',
        state: restData.state || '',
        country: restData.country || '',
        postal_code: restData.postal_code || '',
        category_id: restData.category_id || null,
        venue_type_id: restData.venue_type_id || null,
        event_type_id: restData.event_type_id || null,
        start_date: typeof restData.start_date === 'object' ? (restData.start_date as Date).toISOString() : restData.start_date,
        end_date: typeof restData.end_date === 'object' ? (restData.end_date as Date).toISOString() : restData.end_date,
        start_time: restData.start_time || '11:00',
        end_time: restData.end_time || '17:00'
      };

      // Remove any undefined values
      Object.keys(formattedData).forEach(key => {
        if (formattedData[key] === undefined) {
          delete formattedData[key];
        }
      });

      console.log('Formatted data for update:', formattedData);

      try {
        const { data: updatedData, error } = await supabase
          .from('exhibitions')
          .update(formattedData)
          .eq('id', exhibitionId)
          .select(`
            *,
            category:exhibition_categories(*),
            venue_type:venue_types(*),
            event_type:event_types(*)
          `)
          .single();

        if (error) {
          console.error('Error updating exhibition:', error);
          throw error;
        }

        console.log('Successfully updated exhibition:', updatedData);
        return updatedData;
      } catch (error) {
        console.error('Failed to update exhibition:', error);
        throw error;
      }
    },
    onSuccess: (_, { exhibitionId }) => {
      queryClient.invalidateQueries({ queryKey: ['exhibition', exhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['exhibitions'] });
    }
  });
};

export const useDeleteExhibition = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exhibitions')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitions'] });
    }
  });
};

export const usePublishedExhibitions = (limit?: number) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['published-exhibitions', limit, user?.id],
    queryFn: async () => {
      try {
        console.log('Fetching published exhibitions...');
        
        // Fetch published exhibitions with all related data
        const { data: withDetails, error: detailsError } = await supabase
          .from('exhibitions')
          .select(`
            *,
            category:exhibition_categories(
              id,
              name
            ),
            event_type:event_types(
              id,
              name,
              description
            ),
            venue_type:venue_types(
              id,
              name
            ),
            gallery_images(
              image_url,
              image_type
            )
          `)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(limit || 10);

        console.log('Exhibitions with details:', withDetails);
        
        if (detailsError) {
          console.error('Error fetching exhibition details:', detailsError);
          throw detailsError;
        }

        // Check if user has favorited any of these exhibitions
        let favoritesSet = new Set();
        if (user) {
          const { data: favorites, error: favoritesError } = await supabase
            .from('exhibition_favorites')
            .select('exhibition_id')
            .eq('user_id', user.id);
            
          if (favoritesError) {
            console.error('Error fetching favorites:', favoritesError);
          } else {
            favoritesSet = new Set(favorites?.map((item: any) => item.exhibition_id) || []);
          }
        }

        // Transform the data
        const transformedData = withDetails?.map(exhibition => ({
          ...exhibition,
          category: exhibition.category ? {
            id: exhibition.category.id,
            name: exhibition.category.name
          } : null,
          event_type: exhibition.event_type ? {
            id: exhibition.event_type.id,
            name: exhibition.event_type.name,
            description: exhibition.event_type.description
          } : null,
          venue_type: exhibition.venue_type ? {
            id: exhibition.venue_type.id,
            name: exhibition.venue_type.name
          } : null,
          banner_image: exhibition.gallery_images?.find(img => img.image_type === 'banner')?.image_url,
          isFavorite: user ? favoritesSet.has(exhibition.id) : false
        })) || [];

        console.log('Transformed exhibitions:', transformedData);
        return transformedData;
      } catch (error) {
        console.error('Error in usePublishedExhibitions:', error);
        throw error;
      }
    }
  });
};
