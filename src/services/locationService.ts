import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { State, City } from '@/types/location';

export const useIndianStates = () => {
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('states')
          .select('*')
          .order('name');

        if (error) throw error;

        setStates(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching states:', err);
        setError('Failed to load states');
      } finally {
        setLoading(false);
      }
    };

    fetchStates();
  }, []);

  return { states, loading, error };
};

export const useIndianCities = (stateCode: string) => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCities = async () => {
      if (!stateCode) {
        setCities([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('cities')
          .select(`
            id,
            name,
            latitude,
            longitude,
            is_major,
            population,
            states!inner(state_code)
          `)
          .eq('states.state_code', stateCode)
          .order('name');

        if (error) throw error;

        setCities(data.map(city => ({
          id: city.id,
          name: city.name,
          state_code: stateCode,
          latitude: city.latitude,
          longitude: city.longitude,
          is_major: city.is_major,
          population: city.population
        })));
        setError(null);
      } catch (err) {
        console.error('Error fetching cities:', err);
        setError('Failed to load cities');
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, [stateCode]);

  return { cities, loading, error };
};