import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Exhibition, 
  ExhibitionFormData, 
  ExhibitionCategory, 
  VenueType,
  MeasurementUnit,
  EventType
} from '@/types/exhibition-management';
import { format } from 'date-fns';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { Database } from '@/types/database.types';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

type Tables = Database['public']['Tables']
type MeasurementUnitRow = Tables['measurement_units']['Row'];
type ExhibitionCategoryRow = Tables['exhibition_categories']['Row'];
type VenueTypeRow = Tables['venue_types']['Row'];
type EventTypeRow = Tables['event_types']['Row'];
type ExhibitionRow = Tables['exhibitions']['Row'];
type ExhibitionInsert = Tables['exhibitions']['Insert'];
type ExhibitionUpdate = Tables['exhibitions']['Update'];

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
      
      return ((data as unknown) as ExhibitionCategoryRow[]).map(category => ({
        id: category.id,
        name: category.name,
        description: category.description || undefined
      })) as ExhibitionCategory[];
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
      
      return ((data as unknown) as VenueTypeRow[]).map(type => ({
        id: type.id,
        name: type.name,
        description: type.description || undefined
      })) as VenueType[];
    }
  });
};

export const useMeasuringUnits = () => {
  return useQuery({
    queryKey: ['measuringUnits'],
    queryFn: async () => {
      console.log('Fetching measuring units...');
      const { data, error } = await supabase
        .from('measurement_units')  // Using measurement_units to match the dashboard
        .select('id, name, symbol, type, description, created_at, updated_at')
        .order('name');
      
      if (error) {
        console.error('Error fetching measuring units:', error);
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        console.warn('No measuring units found in the database');
        return [];
      }

      console.log('Received measuring units:', data);

      // Transform the data to match the MeasurementUnit type
      const transformedData = ((data as unknown) as MeasurementUnitRow[]).map(unit => ({
        id: unit.id,
        name: unit.name,
        symbol: unit.symbol,
        type: unit.type,
        description: unit.description,
        created_at: unit.created_at,
        updated_at: unit.updated_at
      })) as MeasurementUnit[];

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
      try {
        const { data, error } = await supabase
          .from('event_types')
          .select('*')
          .order('name');

        if (error) {
          console.error('Error fetching event types:', error);
          return []; // Return empty array instead of throwing error for guest users
        }

        if (!data) {
          console.log('No event types found');
          return [];
        }

        console.log('Event types loaded:', data);
        return data as EventType[];
      } catch (error) {
        console.error('Error in useEventTypes:', error);
        return []; // Return empty array for any errors
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2 // Retry failed requests twice
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
      const { data: rawData, error } = await supabase
        .from('exhibitions')
        .select(`
          *,
          category:exhibition_categories(*),
          venue_type:venue_types(*),
          event_type:event_types(*),
          measurement_unit:measurement_units(*)
        `)
        .eq('id', id)
        .single() as PostgrestSingleResponse<Exhibition>;
      
      if (error) {
        throw new Error(error.message);
      }

      if (!rawData) {
        throw new Error('Exhibition not found');
      }

      return rawData;
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
        title: exhibitionData.title,
        description: exhibitionData.description,
        address: exhibitionData.address,
        city: exhibitionData.city,
        state: exhibitionData.state,
        country: exhibitionData.country,
        postal_code: exhibitionData.postal_code,
        category_id: exhibitionData.category_id,
        venue_type_id: exhibitionData.venue_type_id,
        event_type_id: exhibitionData.event_type_id,
        measuring_unit_id: exhibitionData.measuring_unit_id,
        start_date: exhibitionData.start_date,
        end_date: exhibitionData.end_date,
        start_time: exhibitionData.start_time || '11:00:00',
        end_time: exhibitionData.end_time || '17:00:00',
        organiser_id: user.id,
        status: 'draft'
      } satisfies ExhibitionInsert;
      
      const { data, error } = await supabase
        .from('exhibitions')
        .insert(formattedData)
        .select(`
          *,
          category:exhibition_categories(*),
          venue_type:venue_types(*),
          event_type:event_types(*),
          measurement_unit:measurement_units(*)
        `)
        .single() as PostgrestSingleResponse<Exhibition>;
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data) {
        throw new Error('Failed to create exhibition');
      }
      
      return data;
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

      const formattedData = {
        title: data.title,
        description: data.description,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postal_code: data.postal_code,
        category_id: data.category_id,
        venue_type_id: data.venue_type_id,
        event_type_id: data.event_type_id,
        measuring_unit_id: data.measuring_unit_id,
        start_date: data.start_date,
        end_date: data.end_date,
        start_time: data.start_time || '11:00:00',
        end_time: data.end_time || '17:00:00'
      } satisfies ExhibitionUpdate;

      try {
        const { data: updatedData, error } = await supabase
          .from('exhibitions')
          .update(formattedData)
          .eq('id', exhibitionId)
          .select(`
            *,
            category:exhibition_categories(*),
            venue_type:venue_types(*),
            event_type:event_types(*),
            measurement_unit:measurement_units(*)
          `)
          .single() as PostgrestSingleResponse<Exhibition>;

        if (error) {
          console.error('Error updating exhibition:', error);
          throw error;
        }

        if (!updatedData) {
          throw new Error('Failed to update exhibition');
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
          .gte('end_date', new Date().toISOString()) // Only get exhibitions that haven't ended
          .order('start_date', { ascending: true }) // Order by start date to show nearest upcoming first
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
