import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, MapPin, Heart, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardWidget from '@/components/dashboard/DashboardWidget';
import { useExhibitionFavorite } from '@/hooks/useExhibitionFavorite';
import { Separator } from '@/components/ui/separator';
import { UserRole } from '@/types/auth';

interface Exhibition {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  address: string;
  city: string;
  category_id?: string;
  category?: {
    id: string;
    name: string;
  };
  isFavorite: boolean;
}

const MyFavorites = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user's favorite exhibitions
  const { data: exhibitions, isLoading } = useQuery({
    queryKey: ['my-favorites'],
    queryFn: async () => {
      if (!user) return [];

      // First, get the user's favorites
      const { data: favorites, error: favoritesError } = await supabase
        .from('exhibition_favorites')
        .select('exhibition_id')
        .eq('user_id', user.id);

      if (favoritesError) {
        console.error('Error fetching favorites:', favoritesError);
        throw favoritesError;
      }

      if (!favorites || favorites.length === 0) {
        return [];
      }

      // Get exhibition IDs
      const exhibitionIds = favorites.map((fav) => fav.exhibition_id);

      // Then fetch the exhibition details
      const { data, error } = await supabase
        .from('exhibitions')
        .select(`
          *,
          category:exhibition_categories(*),
          venue_type:venue_types(*),
          event_type:event_types(*)
        `)
        .in('id', exhibitionIds)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching exhibitions:', error);
        throw error;
      }

      return (data || []).map((item) => ({
        ...item,
        category: item.category || null,
        isFavorite: true
      })) as Exhibition[];
    },
    enabled: !!user,
  });

  // Filter exhibitions based on search query
  const filteredExhibitions = exhibitions?.filter((exhibition) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      exhibition.title.toLowerCase().includes(query) ||
      exhibition.city.toLowerCase().includes(query) ||
      exhibition.category?.name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8">
      <DashboardWidget 
        className="p-6"
        role={UserRole.SHOPPER}
        title="My Favorite Exhibitions"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <p className="text-muted-foreground">
              Exhibitions you've marked as favorites
            </p>
          </div>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search favorites..."
              className="pl-8 w-full md:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredExhibitions && filteredExhibitions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredExhibitions.map((exhibition) => (
              <ExhibitionCard key={exhibition.id} exhibition={exhibition} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-lg font-medium mb-2">
              {searchQuery ? "No favorites match your search" : "You haven't favorited any exhibitions yet"}
            </p>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? "Try adjusting your search or clear it to see all your favorites" 
                : "Find exhibitions and click the heart icon to add them to your favorites"
              }
            </p>
            {searchQuery ? (
              <Button onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            ) : (
              <Button asChild>
                <Link to="/exhibitions">Browse Exhibitions</Link>
              </Button>
            )}
          </div>
        )}
      </DashboardWidget>
    </div>
  );
};

// Exhibition card component with favorite toggle
const ExhibitionCard = ({ exhibition }: { exhibition: Exhibition }) => {
  const { isFavorite, toggleFavorite, isSubmitting } = useExhibitionFavorite(exhibition.id);
  
  return (
    <Card className="bg-gray-50 border-none hover:bg-gray-100 transition-colors">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">{exhibition.title}</h3>
              {exhibition.category && (
                <Badge variant="outline" className="ml-2 bg-white">{exhibition.category.name}</Badge>
              )}
            </div>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(exhibition.start_date), 'MMM d')} - {format(new Date(exhibition.end_date), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{exhibition.address}, {exhibition.city}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              )}
            </Button>
            <Button asChild variant="default" size="sm">
              <Link to={`/exhibitions/${exhibition.id}`}>View Details</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyFavorites; 