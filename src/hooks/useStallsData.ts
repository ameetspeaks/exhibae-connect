import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Stall, StallFormData, StallInstance } from '@/types/exhibition-management';

export const useStalls = (exhibitionId: string) => {
  console.log('useStalls hook called with exhibitionId:', exhibitionId);
  return useQuery({
    queryKey: ['stalls', exhibitionId],
    queryFn: async () => {
      if (!exhibitionId) {
        console.error('No exhibitionId provided to useStalls hook');
        return [];
      }

      console.log('Fetching stalls for exhibition:', exhibitionId);
      try {
        // First verify the exhibition exists
        const { data: exhibition, error: exhibitionError } = await supabase
          .from('exhibitions')
          .select('id')
          .eq('id', exhibitionId)
          .single();
        
        if (exhibitionError) {
          console.error('Error fetching exhibition:', exhibitionError);
          throw new Error('Exhibition not found');
        }

        // Then fetch stalls with their relationships
        const { data, error } = await supabase
          .from('stalls')
          .select(`
            *,
            unit:measurement_units(*)
          `)
          .eq('exhibition_id', exhibitionId)
          .order('created_at');
        
        if (error) {
          console.error('Error fetching stalls:', error);
          throw new Error(error.message);
        }
        
        if (!data) {
          console.log('No stalls found for exhibition:', exhibitionId);
          return [];
        }
        
        console.log('Raw stalls data:', data);
        
        // Transform the data to match the Stall type
        const stalls = data.map(stall => ({
          ...stall,
          unit: stall.unit?.[0], // Take first unit since it's returned as an array
          amenities: stall.amenities?.map((a: any) => a.amenity) || []
        }));
        
        console.log('Transformed stalls data:', stalls);
        return stalls;
      } catch (error) {
        console.error('Error in useStalls hook:', error);
        throw error;
      }
    },
    enabled: !!exhibitionId,
    staleTime: 1000, // Consider data fresh for 1 second
    gcTime: 5 * 60 * 1000 // Cache for 5 minutes
  });
};

export const useStallInstances = (exhibitionId: string) => {
  return useQuery({
    queryKey: ['stall_instances', exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stall_instances')
        .select(`
          *,
          stall:stalls(
            *,
            unit:measurement_units(*)
          )
        `)
        .eq('exhibition_id', exhibitionId)
        .order('created_at');
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as StallInstance[];
    },
    enabled: !!exhibitionId
  });
};

export const useCreateStall = (exhibitionId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (stallData: StallFormData) => {
      console.log('Creating stall with data:', { ...stallData, exhibition_id: exhibitionId });
      
      // First create the stall
      const { data: stall, error: stallError } = await supabase
        .from('stalls')
        .insert({ 
          ...stallData, 
          exhibition_id: exhibitionId,
          amenity_ids: undefined // Remove this property as it's not in the stalls table
        })
        .select()
        .single();
      
      if (stallError) {
        console.error('Error creating stall:', stallError);
        throw new Error(stallError.message);
      }
      
      console.log('Stall created successfully:', stall);
      
      // If amenities are specified, create the amenity relationships
      if (stallData.amenity_ids && stallData.amenity_ids.length > 0) {
        console.log('Creating stall amenities:', stallData.amenity_ids);
        const stallAmenities = stallData.amenity_ids.map(amenityId => ({
          stall_id: stall.id,
          amenity_id: amenityId
        }));
        
        const { error: amenitiesError } = await supabase
          .from('stall_amenities')
          .insert(stallAmenities);
        
        if (amenitiesError) {
          console.error('Error creating stall amenities:', amenitiesError);
          throw new Error(amenitiesError.message);
        }
        
        console.log('Stall amenities created successfully');
      }
      
      return stall as Stall;
    },
    onSuccess: () => {
      console.log('Invalidating stalls query for exhibitionId:', exhibitionId);
      queryClient.invalidateQueries({ queryKey: ['stalls', exhibitionId] });
    }
  });
};

export const useGenerateLayout = (exhibitionId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      console.log('Starting layout generation for exhibition:', exhibitionId);
      
      // First get all stalls for this exhibition with their full data
      const { data: stalls, error: stallsError } = await supabase
        .from('stalls')
        .select(`
          *,
          unit:measurement_units(*)
        `)
        .eq('exhibition_id', exhibitionId);
      
      if (stallsError) {
        console.error('Error fetching stalls:', stallsError);
        throw new Error(stallsError.message);
      }
      
      if (!stalls || stalls.length === 0) {
        console.error('No stalls found for exhibition:', exhibitionId);
        throw new Error('No stalls found for this exhibition');
      }
      
      console.log('Found stalls:', stalls.length);
      
      // Delete existing stall instances
      const { error: deleteError } = await supabase
        .from('stall_instances')
        .delete()
        .eq('exhibition_id', exhibitionId);
      
      if (deleteError) {
        console.error('Error deleting existing instances:', deleteError);
        throw new Error(deleteError.message);
      }
      
      console.log('Deleted existing instances');
      
      // Generate instances for each stall with calculated positions
      const PADDING = 40; // Increased padding for better spacing
      const MAX_WIDTH = 800 - (PADDING * 2); // Maximum width accounting for padding
      let currentX = PADDING;
      let currentY = PADDING;
      let rowHeight = 0;
      let instances = [];
      
      // First pass: create instances with positions
      for (const stall of stalls) {
        console.log('Processing stall:', stall.name, 'Quantity:', stall.quantity);
        
        // Ensure width and length are numbers
        const width = Number(stall.width);
        const length = Number(stall.length);
        
        if (isNaN(width) || isNaN(length)) {
          console.error('Invalid dimensions for stall:', stall);
          throw new Error(`Invalid dimensions for stall ${stall.name}: width=${stall.width}, length=${stall.length}`);
        }
        
        for (let i = 0; i < stall.quantity; i++) {
          // Check if we need to start a new row
          if (currentX + width > MAX_WIDTH) {
            currentX = PADDING;
            currentY += rowHeight + PADDING;
            rowHeight = 0;
          }
          
          const instance = {
            stall_id: stall.id,
            exhibition_id: exhibitionId,
            instance_number: i + 1,
            position_x: currentX,
            position_y: currentY,
            rotation_angle: 0,
            status: 'available',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          instances.push(instance);
          console.log('Created instance:', instance);
          
          // Update position for next stall
          currentX += width + PADDING;
          rowHeight = Math.max(rowHeight, length);
        }
      }
      
      console.log('Total instances to create:', instances.length);
      
      if (instances.length === 0) {
        throw new Error('No instances were generated');
      }
      
      // Insert all instances at once
      const { data: createdInstances, error: createError } = await supabase
        .from('stall_instances')
        .insert(instances)
        .select(`
          *,
          stall:stalls(
            *,
            unit:measurement_units(*)
          )
        `);
      
      if (createError) {
        console.error('Error creating instances:', createError);
        throw new Error(createError.message);
      }
      
      if (!createdInstances || createdInstances.length === 0) {
        throw new Error('No instances were created');
      }
      
      console.log('Successfully created instances:', createdInstances.length);
      return createdInstances;
    },
    onSuccess: (data) => {
      console.log('Layout generation successful, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['stall_instances', exhibitionId] });
    },
    onError: (error) => {
      console.error('Layout generation failed:', error);
    }
  });
};

export const useUpdateStallInstance = (exhibitionId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      position_x, 
      position_y, 
      rotation_angle 
    }: { 
      id: string; 
      position_x: number; 
      position_y: number; 
      rotation_angle: number; 
    }) => {
      const { data, error } = await supabase
        .from('stall_instances')
        .update({ position_x, position_y, rotation_angle })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stall_instances', exhibitionId] });
    }
  });
};

export const useUpdateStall = (stallId: string, exhibitionId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (stallData: Partial<StallFormData>) => {
      // Handle amenities separately
      const amenityIds = stallData.amenity_ids;
      
      // Remove amenity_ids from the data as it's not in the stalls table
      const { amenity_ids, ...stallUpdateData } = stallData;
      
      // Update the stall
      const { data: stall, error: stallError } = await supabase
        .from('stalls')
        .update(stallUpdateData)
        .eq('id', stallId)
        .select()
        .single();
      
      if (stallError) {
        throw new Error(stallError.message);
      }
      
      // If amenities are specified, update the amenity relationships
      if (amenityIds) {
        // First delete all existing relationships
        const { error: deleteError } = await supabase
          .from('stall_amenities')
          .delete()
          .eq('stall_id', stallId);
        
        if (deleteError) {
          throw new Error(deleteError.message);
        }
        
        // Then insert new relationships if there are any
        if (amenityIds.length > 0) {
          const stallAmenities = amenityIds.map(amenityId => ({
            stall_id: stallId,
            amenity_id: amenityId
          }));
          
          const { error: insertError } = await supabase
            .from('stall_amenities')
            .insert(stallAmenities);
          
          if (insertError) {
            throw new Error(insertError.message);
          }
        }
      }
      
      return stall as Stall;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stalls', exhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['stallAmenities', stallId] });
    }
  });
};

export const useDeleteStall = (exhibitionId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (stallId: string) => {
      // The stall_amenities records will be automatically deleted due to ON DELETE CASCADE
      const { error } = await supabase
        .from('stalls')
        .delete()
        .eq('id', stallId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return stallId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stalls', exhibitionId] });
    }
  });
};
