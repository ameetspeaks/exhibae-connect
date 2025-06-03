import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MeasurementUnit } from '@/types/exhibition-management';

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
      return data;
    }
  });
};

export const useStallAmenities = (stallId: string) => {
  return useQuery({
    queryKey: ['stallAmenities', stallId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stall_amenities')
        .select('*')
        .match({ stall_id: stallId });
      if (error) {
        throw new Error(error.message);
      }
      return data;
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
