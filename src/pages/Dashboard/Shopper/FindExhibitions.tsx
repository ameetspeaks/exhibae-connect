import { useState } from 'react';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Loader2, Heart, Search, Compass, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useExhibitionAttendance } from '@/hooks/useExhibitionAttendance';
import { useExhibitionFavorite } from '@/hooks/useExhibitionFavorite';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import DashboardWidget from '@/components/dashboard/DashboardWidget';
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
  isAttending?: boolean;
  isFavorite?: boolean;
}

const FindExhibitions = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch all upcoming exhibitions
  const { data: exhibitions, isLoading } = useQuery({
    queryKey: ['upcoming-exhibitions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exhibitions')
        .select(`
          id,
          title,
          start_date,
          end_date,
          address,
          city,
          category_id,
          category:categories (
            id,
            name
          )
        `)
        .gte('end_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (error) throw error;
      
      if (user) {
        // Check if user is already attending these exhibitions
        const { data: attending, error: attendingError } = await supabase
          .from('exhibition_attending')
          .select('exhibition_id')
          .eq('user_id', user.id);
          
        if (attendingError) throw attendingError;
        
        // Check if user has favorited these exhibitions
        const { data: favorites, error: favoritesError } = await supabase
          .from('exhibition_favorites')
          .select('exhibition_id')
          .eq('user_id', user.id);
          
        if (favoritesError) throw favoritesError;
        
        const attendingSet = new Set(attending.map((item: any) => item.exhibition_id));
        const favoritesSet = new Set(favorites?.map((item: any) => item.exhibition_id) || []);
        
        return data.map((item: any) => ({
          ...item,
          category: item.category?.[0] || null,
          isAttending: attendingSet.has(item.id),
          isFavorite: favoritesSet.has(item.id)
        })) as Exhibition[];
      }
      
      return data.map((item: any) => ({
        ...item,
        category: item.category?.[0] || null
      })) as Exhibition[];
    },
  });

  // Filter exhibitions based on search query
  const filteredExhibitions = exhibitions?.filter(exhibition => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      exhibition.title.toLowerCase().includes(query) ||
      exhibition.address.toLowerCase().includes(query) ||
      exhibition.city.toLowerCase().includes(query) ||
      exhibition.category?.name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <DashboardWidget
        role={UserRole.SHOPPER}
        title="Find Exhibitions"
        description="Discover new exhibitions to attend"
        icon={<Compass className="h-5 w-5 text-exhibae-navy" />}
        variant="gradient"
        className="mb-8"
      >
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-white/70" />
            <Input
              placeholder="Search exhibitions by name, location, or category..."
              className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/70"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </DashboardWidget>

      <DashboardWidget
        role={UserRole.SHOPPER}
        title="Upcoming Exhibitions"
        variant="outline"
      >
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-gray-50 border-none">
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/4 mb-2" />
                  <Skeleton className="h-4 w-1/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredExhibitions && filteredExhibitions.length > 0 ? (
          <div className="space-y-4">
            {filteredExhibitions.map((exhibition) => (
              <ExhibitionCard key={exhibition.id} exhibition={exhibition} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? "No exhibitions found matching your search." 
                : "No upcoming exhibitions available."}
            </p>
            <Button onClick={() => setSearchQuery('')} disabled={!searchQuery}>
              Clear Search
            </Button>
          </div>
        )}
      </DashboardWidget>
    </div>
  );
};

// Exhibition card component with attendance toggle
const ExhibitionCard = ({ exhibition }: { exhibition: Exhibition }) => {
  const { isAttending, toggleAttendance, isSubmitting } = useExhibitionAttendance(exhibition.id);
  const { isFavorite, toggleFavorite, isSubmitting: isFavoriteSubmitting } = useExhibitionFavorite(exhibition.id);
  
  // Use the isAttending value from the exhibition object if available, otherwise use the hook value
  const attending = exhibition.isAttending !== undefined ? exhibition.isAttending : isAttending;
  const favorite = exhibition.isFavorite !== undefined ? exhibition.isFavorite : isFavorite;

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
              disabled={isFavoriteSubmitting}
            >
              {isFavoriteSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={`h-4 w-4 ${favorite ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
              )}
            </Button>
            <Button
              variant={attending ? "secondary" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => toggleAttendance()}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={`h-4 w-4 ${attending ? 'fill-current' : ''}`} />
              )}
              {attending ? "Going" : "Love to Go"}
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

export default FindExhibitions; 