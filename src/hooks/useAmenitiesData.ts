import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Amenity, MeasurementUnit } from '@/types/exhibition-management';
import { Database } from '@/types/database.types';

type Tables = Database['public']['Tables']
type AmenityRow = Tables['amenities']['Row'];
type StallAmenityRow = Tables['stall_amenities']['Row'];

export const useAmenities = () => {
  return useQuery({
    queryKey: ['amenities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('amenities')
        .select('*')
        .order('name');
      if (error) {
        throw new Error(error.message);
      }
      return ((data as unknown) as AmenityRow[]).map(amenity => ({
        id: amenity.id,
        name: amenity.name,
        description: amenity.description || undefined,
        icon: amenity.icon || undefined
      })) as Amenity[];
    }
  });
};

export const useStallAmenities = (stallId: string) => {
  return useQuery({
    queryKey: ['stallAmenities', stallId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stall_amenities')
        .select('*, amenity:amenities(*)')
        .match({ stall_id: stallId });
      if (error) {
        throw new Error(error.message);
      }
      return ((data as unknown) as (StallAmenityRow & { amenity: AmenityRow })[]).map(row => ({
        id: row.id,
        stall_id: row.stall_id,
        amenity_id: row.amenity_id,
        amenity: {
          id: row.amenity.id,
          name: row.amenity.name,
          description: row.amenity.description || undefined,
          icon: row.amenity.icon || undefined
        }
      }));
    }
  });
};

export const useMeasurementUnits = () => {
  return useQuery({
    queryKey: ['measurementUnits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('measurement_units')
        .select('*')
        .order('name');
      if (error) {
        throw new Error(error.message);
      }
      // Use a double cast to avoid type errors
      return (data as unknown) as MeasurementUnit[];
    }
  });
};
