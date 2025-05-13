import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Amenity, StallAmenity, MeasuringUnit } from '@/types/exhibition-management';

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
      
      return data as Amenity[];
    }
  });
};

export const useStallAmenities = (stallId?: string) => {
  return useQuery({
    queryKey: ['stallAmenities', stallId],
    queryFn: async () => {
      if (!stallId) return [];
      
      const { data, error } = await supabase
        .from('stall_amenities')
        .select(`
          *,
          amenity:amenities(*)
        `)
        .eq('stall_id', stallId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as StallAmenity[];
    },
    enabled: !!stallId
  });
};

export const useMeasuringUnits = () => {
  return useQuery({
    queryKey: ['measuringUnits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('measuring_units')
        .select('*')
        .order('name');
      if (error) {
        throw new Error(error.message);
      }
      return data as MeasuringUnit[];
    }
  });
};
