import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Stall, StallFormData, StallInstance } from '@/types/exhibition-management';

export const useStalls = (exhibitionId?: string) => {
  return useQuery({
    queryKey: ['stalls', exhibitionId],
    queryFn: async () => {
      if (!exhibitionId) {
        return [];
      }

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
            unit:measurement_units!inner(*),
            amenities:stall_amenities(
              amenity:amenities(*)
            )
          `)
          .eq('exhibition_id', exhibitionId)
          .order('created_at');
        
        if (error) {
          console.error('Error fetching stalls:', error);
          throw new Error(error.message);
        }
        
        if (!data) {
          return [];
        }
        
        // Transform the data to match the Stall type
        const stalls = data.map(stall => ({
          ...stall,
          unit: stall.unit,
          amenities: stall.amenities?.map((a: any) => a.amenity) || []
        }));
        
        return stalls;
      } catch (error) {
        console.error('Error in useStalls hook:', error);
        throw error;
      }
    },
    enabled: !!exhibitionId
  });
};

export const useStallInstances = (exhibitionId: string) => {
  return useQuery({
    queryKey: ['stall_instances', exhibitionId],
    queryFn: async () => {
      if (!exhibitionId) {
        return [];
      }

      try {
        const { data, error } = await supabase
          .from('stall_instances')
          .select(`
            *,
            stall:stalls(
              *,
              unit:measurement_units(*),
              amenities:stall_amenities(
                amenity:amenities(*)
              )
            )
          `)
          .eq('exhibition_id', exhibitionId)
          .order('created_at');
        
        if (error) {
          console.error('Error fetching stall instances:', error);
          throw new Error(error.message);
        }
        
        if (!data) {
          return [];
        }

        // Transform the data to include proper relations
        const instances = data.map(instance => ({
          ...instance,
          stall: {
            ...instance.stall,
            unit: instance.stall.unit,
            amenities: instance.stall.amenities?.map((a: any) => a.amenity) || []
          }
        }));
        
        return instances;
      } catch (error) {
        console.error('Error in useStallInstances hook:', error);
        throw error;
      }
    },
    enabled: !!exhibitionId
  });
};

// Helper function to calculate grid positions
function calculateGridPosition(stalls: any[], stallIndex: number, instanceNumber: number, boxWidth: number, boxHeight: number, padding: number) {
  const BOXES_PER_ROW = 5;
  const row = Math.floor((instanceNumber - 1) / BOXES_PER_ROW);
  const col = (instanceNumber - 1) % BOXES_PER_ROW;
  
  return {
    x: padding + (col * (boxWidth + padding)),
    y: padding + (row * (boxHeight + padding))
  };
}

export const useCreateStall = (exhibitionId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (stallData: StallFormData) => {
      console.log('Creating stall with data:', { ...stallData, exhibition_id: exhibitionId });
      
      try {
        // First create the stall
        const { data: stall, error: stallError } = await supabase
          .from('stalls')
          .insert({ 
            ...stallData, 
            exhibition_id: exhibitionId,
            amenity_ids: undefined
          })
          .select()
          .single();
        
        if (stallError) {
          console.error('Error creating stall:', stallError);
          throw new Error(stallError.message);
        }
        
        console.log('Stall created successfully:', stall);
        
        // Handle amenities
        if (stallData.amenity_ids?.length > 0) {
          const stallAmenities = stallData.amenity_ids.map(amenityId => ({
            stall_id: stall.id,
            amenity_id: amenityId
          }));
          
          const { error: amenitiesError } = await supabase
            .from('stall_amenities')
            .insert(stallAmenities);
          
          if (amenitiesError) throw new Error(amenitiesError.message);
        }

        // Get all existing stalls to calculate total instances
        const { data: existingStalls, error: stallsError } = await supabase
          .from('stalls')
          .select('id, quantity')
          .eq('exhibition_id', exhibitionId);

        if (stallsError) throw new Error(stallsError.message);

        // Calculate total existing instances
        let totalExistingInstances = 0;
        existingStalls?.forEach(s => {
          if (s.id !== stall.id) { // Don't count the new stall
            totalExistingInstances += s.quantity;
          }
        });

        // Create instances for the new stall
        const BOX_WIDTH = 100;
        const BOX_HEIGHT = 80;
        const PADDING = 20;
        
        const newInstances = [];
        for (let i = 0; i < stall.quantity; i++) {
          const instanceNumber = totalExistingInstances + i + 1;
          const position = calculateGridPosition(
            existingStalls || [],
            existingStalls?.length || 0,
            instanceNumber,
            BOX_WIDTH,
            BOX_HEIGHT,
            PADDING
          );

          newInstances.push({
            stall_id: stall.id,
            exhibition_id: exhibitionId,
            instance_number: i + 1,
            position_x: position.x,
            position_y: position.y,
            rotation_angle: 0,
            status: 'available',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }

        // Insert the new instances
        const { error: createInstancesError } = await supabase
          .from('stall_instances')
          .insert(newInstances);

        if (createInstancesError) throw new Error(createInstancesError.message);
        
        return stall as Stall;
      } catch (error) {
        console.error('Error in createStall:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stalls', exhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['stall_instances', exhibitionId] });
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
      rotation_angle,
      status,
      price 
    }: { 
      id: string; 
      position_x?: number; 
      position_y?: number; 
      rotation_angle?: number;
      status?: string;
      price?: number;
    }) => {
      console.log('Mutation: Updating stall instance:', { id, status, price, position_x, position_y, rotation_angle });

      const updateData: any = {};
      if (position_x !== undefined) updateData.position_x = position_x;
      if (position_y !== undefined) updateData.position_y = position_y;
      if (rotation_angle !== undefined) updateData.rotation_angle = rotation_angle;
      if (status !== undefined) updateData.status = status;
      if (price !== undefined) updateData.price = price;

      // First update the instance
      const { data: updatedInstance, error: updateError } = await supabase
        .from('stall_instances')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating stall instance:', updateError);
        throw new Error(updateError.message);
      }

      console.log('Updated instance in database:', updatedInstance);

      // Then fetch the updated instance with all relations
      const { data: fullInstance, error: fetchError } = await supabase
        .from('stall_instances')
        .select(`
          *,
          stall:stalls (
            id,
            name,
            width,
            length,
            price,
            unit:measurement_units (
              id,
              name,
              symbol
            )
          )
        `)
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching updated instance:', fetchError);
        throw new Error(fetchError.message);
      }
      
      console.log('Fetched full instance data:', fullInstance);
      return fullInstance;
    },
    onSuccess: (data) => {
      console.log('Mutation succeeded, invalidating queries:', data);
      queryClient.invalidateQueries({ queryKey: ['stall_instances', exhibitionId] });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
    }
  });
};

export const useUpdateStall = (exhibitionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: StallFormData & { id: string }) => {
      if (!id) throw new Error('Stall ID is required');

      // Update the stall
      const { error: stallError } = await supabase
        .from('stalls')
        .update(data)
        .eq('id', id);

      if (stallError) throw stallError;

      // Update amenities if provided
      if (data.amenity_ids) {
        // First delete existing amenities
        const { error: deleteError } = await supabase
          .from('stall_amenities')
          .delete()
          .eq('stall_id', id);

        if (deleteError) throw deleteError;

        // Then insert new ones
        const stallAmenities = data.amenity_ids.map(amenityId => ({
          stall_id: id,
          amenity_id: amenityId
        }));

        const { error: amenitiesError } = await supabase
          .from('stall_amenities')
          .insert(stallAmenities);

        if (amenitiesError) throw amenitiesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stalls', exhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['stall_instances', exhibitionId] });
    }
  });
};

export const useDeleteStall = (exhibitionId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (stallId: string) => {
      try {
        // First check if there are any non-available instances
        const { data: instances, error: checkError } = await supabase
          .from('stall_instances')
          .select('id, status')
          .eq('stall_id', stallId);

        if (checkError) {
          console.error('Error checking stall instances:', checkError);
          throw new Error(checkError.message);
        }

        // If there are any non-available instances, don't allow deletion
        if (instances?.some(instance => instance.status !== 'available')) {
          throw new Error('Cannot delete stall that has applications or bookings');
        }

        // Start a transaction by deleting stall instances first
        const { error: deleteInstancesError } = await supabase
          .from('stall_instances')
          .delete()
          .eq('stall_id', stallId);

        if (deleteInstancesError) {
          console.error('Error deleting stall instances:', deleteInstancesError);
          throw new Error(deleteInstancesError.message);
        }

        // Then delete the stall
        const { error: deleteStallError } = await supabase
          .from('stalls')
          .delete()
          .eq('id', stallId)
          .single();
      
        if (deleteStallError) {
          console.error('Error deleting stall:', deleteStallError);
          throw new Error(deleteStallError.message);
        }

        // After successful deletion, regenerate layout
        await regenerateLayout(exhibitionId);
      
        return stallId;
      } catch (error) {
        console.error('Error in delete stall operation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate both stalls and stall_instances queries
      queryClient.invalidateQueries({ queryKey: ['stalls', exhibitionId] });
      queryClient.invalidateQueries({ queryKey: ['stall_instances', exhibitionId] });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
    }
  });
};

// Update the regenerateLayout function to use the grid positioning
async function regenerateLayout(exhibitionId: string) {
  try {
    const { data: stalls, error: stallsError } = await supabase
      .from('stalls')
      .select('*')
      .eq('exhibition_id', exhibitionId);

    if (stallsError) throw new Error(stallsError.message);
    if (!stalls || stalls.length === 0) return;

    // Get existing non-available instances
    const { data: existingInstances, error: instancesError } = await supabase
      .from('stall_instances')
      .select('id, stall_id, instance_number, status')
      .eq('exhibition_id', exhibitionId)
      .neq('status', 'available');

    if (instancesError) throw new Error(instancesError.message);

    // Delete available instances
    const { error: deleteError } = await supabase
      .from('stall_instances')
      .delete()
      .eq('exhibition_id', exhibitionId)
      .eq('status', 'available');

    if (deleteError) throw new Error(deleteError.message);

    // Calculate new positions using grid layout
    const BOX_WIDTH = 100;
    const BOX_HEIGHT = 80;
    const PADDING = 20;
    let totalInstances = 0;
    let newInstances = [];

    for (const stall of stalls) {
      for (let i = 0; i < stall.quantity; i++) {
        totalInstances++;
        const position = calculateGridPosition(
          stalls,
          stalls.indexOf(stall),
          totalInstances,
          BOX_WIDTH,
          BOX_HEIGHT,
          PADDING
        );

        // Check if instance exists and is not available
        const existingInstance = existingInstances?.find(
          instance => instance.stall_id === stall.id && instance.instance_number === (i + 1)
        );

        if (existingInstance) {
          // Update existing non-available instance
          const { error: updateError } = await supabase
            .from('stall_instances')
            .update({
              position_x: position.x,
              position_y: position.y,
              rotation_angle: 0
            })
            .eq('id', existingInstance.id);

          if (updateError) throw new Error(updateError.message);
        } else {
          // Create new available instance
          newInstances.push({
            stall_id: stall.id,
            exhibition_id: exhibitionId,
            instance_number: i + 1,
            position_x: position.x,
            position_y: position.y,
            rotation_angle: 0,
            status: 'available',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    }

    // Insert new available instances
    if (newInstances.length > 0) {
      const { error: insertError } = await supabase
        .from('stall_instances')
        .insert(newInstances);

      if (insertError) throw new Error(insertError.message);
    }
  } catch (error) {
    console.error('Error in regenerateLayout:', error);
    throw error;
  }
}
