import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Exhibition, 
  ExhibitionFormData, 
  ExhibitionCategory, 
  VenueType,
  MeasuringUnit
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

export const useExhibitions = (organiserId?: string) => {
  return useQuery({
    queryKey: ['exhibitions', organiserId],
    queryFn: async () => {
      let query = supabase
        .from('exhibitions')
        .select(`
          *,
          category:exhibition_categories(*),
          venue_type:venue_types(*)
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
          venue_type:venue_types(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Exhibition;
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
        start_date: exhibitionData.start_date.toISOString(),
        end_date: exhibitionData.end_date.toISOString()
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

export const useUpdateExhibition = (id: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (exhibitionData: Partial<ExhibitionFormData>) => {
      // Prepare data for Supabase, converting Date objects to strings
      const formattedData: Record<string, any> = { ...exhibitionData };
      
      if (exhibitionData.start_date) {
        formattedData.start_date = exhibitionData.start_date.toISOString();
      }
      
      if (exhibitionData.end_date) {
        formattedData.end_date = exhibitionData.end_date.toISOString();
      }
      
      const { data, error } = await supabase
        .from('exhibitions')
        .update(formattedData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Exhibition;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitions'] });
      queryClient.invalidateQueries({ queryKey: ['exhibition', id] });
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
  return useQuery({
    queryKey: ['published-exhibitions', limit],
    queryFn: async () => {
      try {
        console.log('Fetching published exhibitions...');
        
        // First, let's just get all published exhibitions without joins
        const { data: exhibitions, error: exhibitionsError } = await supabase
          .from('exhibitions')
          .select('*')
          .eq('status', 'published');

        console.log('Raw exhibitions:', exhibitions);
        
        if (exhibitionsError) {
          console.error('Error fetching exhibitions:', exhibitionsError);
          throw exhibitionsError;
        }

        if (!exhibitions || exhibitions.length === 0) {
          console.log('No published exhibitions found');
          return [];
        }

        // Now let's get the categories and gallery images
        const { data: withDetails, error: detailsError } = await supabase
          .from('exhibitions')
          .select(`
            *,
            category:exhibition_categories(name),
            gallery_images(image_url, image_type)
          `)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(limit || 10);

        console.log('Exhibitions with details:', withDetails);
        
        if (detailsError) {
          console.error('Error fetching exhibition details:', detailsError);
          throw detailsError;
        }

        // Transform the data
        const transformedData = withDetails?.map(exhibition => ({
          ...exhibition,
          banner_image: exhibition.gallery_images?.find(img => img.image_type === 'banner')?.image_url
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
