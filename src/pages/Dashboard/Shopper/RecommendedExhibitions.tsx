import { useState } from 'react';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Loader2, Heart, Sparkles, Filter, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useExhibitionAttendance } from '@/hooks/useExhibitionAttendance';
import { useExhibitionFavorite } from '@/hooks/useExhibitionFavorite';
import DashboardWidget from '@/components/dashboard/DashboardWidget';
import { UserRole } from '@/types/auth';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Category {
  id: string;
  name: string;
}

interface Exhibition {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  address: string;
  city: string;
  category_id?: string;
  category?: Category;
  isAttending?: boolean;
  isFavorite?: boolean;
}

const RecommendedExhibitions = () => {
  const { user } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  
  // Fetch recommended exhibitions
  const { data: recommendedExhibitions, isLoading } = useQuery({
    queryKey: ['shopper-recommended-exhibitions', user?.id],
    queryFn: async () => {
      console.log('Fetching recommended exhibitions for shopper');
      
      // First, check if we have any published exhibitions
      const { data: publishedCheck, error: checkError } = await supabase
        .from('exhibitions')
        .select('id, status')
        .eq('status', 'published')
        .limit(1);
        
      if (checkError) {
        console.error('Error checking published exhibitions:', checkError);
      } else {
        console.log('Published exhibitions check:', publishedCheck?.length || 0);
      }
      
      // In a real application, you would have a more sophisticated recommendation algorithm
      // Here we're just getting upcoming exhibitions sorted by start date
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
          category:category_id(
            id,
            name
          )
        `)
        .eq('status', 'published')  // Only get published exhibitions
        .gte('end_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(30);

      if (error) {
        console.error('Error fetching exhibitions:', error);
        throw error;
      }
      
      console.log('Fetched exhibitions:', data?.length || 0);
      
      // Check if user is already attending these exhibitions
      if (user) {
        const { data: attending, error: attendingError } = await supabase
          .from('exhibition_attending')
          .select('exhibition_id')
          .eq('user_id', user.id);
          
        if (attendingError) {
          console.error('Error fetching attendance:', attendingError);
          throw attendingError;
        }
        
        // Check if user has favorited these exhibitions
        const { data: favorites, error: favoritesError } = await supabase
          .from('exhibition_favorites')
          .select('exhibition_id')
          .eq('user_id', user.id);
          
        if (favoritesError) {
          console.error('Error fetching favorites:', favoritesError);
          throw favoritesError;
        }
        
        const attendingSet = new Set(attending?.map((item: any) => item.exhibition_id) || []);
        const favoritesSet = new Set(favorites?.map((item: any) => item.exhibition_id) || []);
        
        return (data || []).map((item: any) => ({
          ...item,
          // Handle the category which comes as an object now
          category: item.category || null,
          isAttending: attendingSet.has(item.id),
          isFavorite: favoritesSet.has(item.id)
        })) as Exhibition[];
      }
      
      return (data || []).map((item: any) => ({
        ...item,
        // Handle the category which comes as an object now
        category: item.category || null
      })) as Exhibition[];
    },
    enabled: true,
  });

  // Fetch unique categories and locations for filters
  const { data: categories } = useQuery({
    queryKey: ['exhibition-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
        
      if (error) throw error;
      return data;
    }
  });

  const { data: locations } = useQuery({
    queryKey: ['exhibition-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exhibitions')
        .select('city')
        .order('city');
        
      if (error) throw error;
      
      // Get unique cities
      const uniqueCities = [...new Set(data.map(item => item.city))];
      return uniqueCities.filter(Boolean).map(city => ({ id: city, name: city }));
    }
  });

  // Filter exhibitions based on selected filters
  const filteredExhibitions = recommendedExhibitions?.filter(exhibition => {
    if (categoryFilter !== 'all' && exhibition.category?.id !== categoryFilter) return false;
    if (locationFilter !== 'all' && exhibition.city !== locationFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <DashboardWidget
        role={UserRole.SHOPPER}
        title="Recommended For You"
        description="Exhibitions that match your interests"
        icon={<Sparkles className="h-5 w-5 text-exhibae-navy" />}
        variant="gradient"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-white text-sm mb-1 block">Filter by Category</label>
            <Select 
              value={categoryFilter} 
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="bg-white/20 border-white/30 text-white">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map(category => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-white text-sm mb-1 block">Filter by Location</label>
            <Select 
              value={locationFilter} 
              onValueChange={setLocationFilter}
            >
              <SelectTrigger className="bg-white/20 border-white/30 text-white">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations?.map(location => (
                  <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </DashboardWidget>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-blue-700">Personalized recommendations</AlertTitle>
        <AlertDescription className="text-blue-600">
          Based on your interests and previous exhibitions, we've picked these events just for you.
        </AlertDescription>
      </Alert>

      <DashboardWidget
        role={UserRole.SHOPPER}
        title="Upcoming Exhibitions"
        variant="outline"
      >
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-gray-50 border-none">
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <Skeleton className="h-24 w-24 rounded-full" />
                </div>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recommendedExhibitions && recommendedExhibitions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredExhibitions?.map((exhibition) => (
              <ExhibitionCard key={exhibition.id} exhibition={exhibition} />
            ))}
          </div>
        ) : filteredExhibitions && filteredExhibitions.length === 0 && recommendedExhibitions.length > 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No exhibitions found matching your filters.
            </p>
            <Button onClick={() => {
              setCategoryFilter('all');
              setLocationFilter('all');
            }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium">No exhibitions available</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              There are currently no published exhibitions available. 
              Please check back later as new exhibitions are regularly added.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/dashboard/shopper">Return to Dashboard</Link>
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
    <Card className="overflow-hidden bg-gray-50 border-none hover:bg-gray-100 transition-colors">
      <div className="h-40 bg-gray-100 flex items-center justify-center relative">
        <Calendar className="h-12 w-12 text-gray-400" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 absolute top-1 right-1"
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
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold line-clamp-1">{exhibition.title}</h3>
          {exhibition.category && (
            <Badge variant="outline" className="ml-2 bg-white text-xs">{exhibition.category.name}</Badge>
          )}
        </div>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span className="text-xs">
              {format(new Date(exhibition.start_date), 'MMM d')} - {format(new Date(exhibition.end_date), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            <span className="text-xs line-clamp-1">{exhibition.city}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={attending ? "secondary" : "outline"}
            size="sm"
            className="w-full gap-1"
            onClick={() => toggleAttendance()}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Heart className={`h-3 w-3 ${attending ? 'fill-current' : ''}`} />
            )}
            {attending ? "Going" : "Attend"}
          </Button>
          <Button asChild variant="default" size="sm" className="w-full">
            <Link to={`/exhibitions/${exhibition.id}`}>Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecommendedExhibitions; 