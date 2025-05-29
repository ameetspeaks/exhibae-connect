import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SearchBar } from '@/components/ui/SearchBar';
import { Loader2 } from 'lucide-react';

interface Exhibition {
  id: string;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  image_url: string;
  status: string;
}

export const SearchResults = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    const fetchExhibitions = async () => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('exhibitions')
          .select('*')
          .in('status', ['published', 'active']);

        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        setExhibitions(data || []);
      } catch (err) {
        console.error('Error fetching exhibitions:', err);
        setError('Failed to fetch exhibitions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchExhibitions();
  }, [searchQuery]);

  const handleExhibitionClick = (exhibitionId: string) => {
    navigate(`/exhibitions/${exhibitionId}`);
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold mb-8">
          {searchQuery ? (
            <>
              Search Results for{' '}
              <span className="text-[#4B1E25]">{searchQuery}</span>
            </>
          ) : (
            'All Exhibitions'
          )}
        </h1>

        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="w-8 h-8 animate-spin text-[#4B1E25]" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : exhibitions.length === 0 ? (
          <div className="text-center text-gray-500">
            No exhibitions found. Try adjusting your search criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exhibitions.map((exhibition) => (
              <div
                key={exhibition.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleExhibitionClick(exhibition.id)}
              >
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={exhibition.image_url || '/images/placeholder.jpg'}
                    alt={exhibition.title}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{exhibition.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {exhibition.description?.slice(0, 100)}...
                  </p>
                  <div className="text-sm text-gray-500">
                    <p>{exhibition.location}</p>
                    <p>
                      {new Date(exhibition.start_date).toLocaleDateString()} -{' '}
                      {new Date(exhibition.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 