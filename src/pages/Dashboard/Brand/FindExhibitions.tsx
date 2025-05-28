import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Users, Loader2, ChevronLeft, ChevronRight, Clock, Heart } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { format } from 'date-fns';
import { useExhibitionFavorite } from '@/hooks/useExhibitionFavorite';
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 5;

// Types for the exhibitions
interface Exhibition {
  id: string;
  title: string;
  address: string;
  cover_image?: string;
  start_date: string;
  end_date: string;
  status: string;
  category_id: string;
  price_range?: string;
  stalls: Array<{
    id: string;
    stall_applications: Array<{
      id: string;
      status: string;
    }> | null;
  }>;
  availableStalls: number;
  isFavorite?: boolean;
}

// Type for exhibition category
interface ExhibitionCategory {
  id: string;
  name: string;
  description?: string;
}

// Types for the ExhibitionCard component
interface ExhibitionCardProps {
  exhibition: Exhibition;
  onNavigate: () => void;
}

const FindExhibitions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [categories, setCategories] = useState<ExhibitionCategory[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    if (user) {
      fetchExhibitions();
      fetchCategories();
      fetchLocations();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchExhibitions();
    }
  }, [searchQuery, selectedCategory, selectedLocation, currentPage]);

  const fetchExhibitions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('exhibitions')
        .select(`
          *,
          stalls (
            id,
            stall_applications (
              id,
              status
            )
          )
        `)
        .eq('status', 'published')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`);
      }
      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }
      if (selectedLocation && selectedLocation !== 'all') {
        query = query.eq('address', selectedLocation);
      }

      const { data: exhibitionsData, error: exhibitionsError } = await query;

      if (exhibitionsError) throw exhibitionsError;

      // Check if user has favorited these exhibitions
      let favoritesSet = new Set();
      if (user) {
        const { data: favorites, error: favoritesError } = await supabase
          .from('exhibition_favorites')
          .select('exhibition_id')
          .eq('user_id', user.id);
          
        if (favoritesError) {
          console.error('Error fetching favorites:', favoritesError);
        } else {
          favoritesSet = new Set(favorites?.map(fav => fav.exhibition_id) || []);
        }
      }

      const processedExhibitions = exhibitionsData.map(exhibition => {
        const totalStalls = exhibition.stalls.length;
        const confirmedApplications = exhibition.stalls.reduce((count, stall) => {
          return count + (stall.stall_applications?.some(app => app.status === 'confirmed') ? 1 : 0);
        }, 0);

        return {
          ...exhibition,
          availableStalls: totalStalls - confirmedApplications,
          isFavorite: favoritesSet.has(exhibition.id)
        };
      });

      setExhibitions(processedExhibitions || []);
    } catch (error) {
      console.error('Error fetching exhibitions:', error);
      toast({
        title: 'Error loading exhibitions',
        description: error instanceof Error ? error.message : 'Failed to load exhibitions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('exhibition_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('exhibitions')
        .select('address')
        .order('address');

      if (error) throw error;
      setLocations(data.map(exhibition => exhibition.address));
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleFavoriteClick = (exhibitionId: string) => {
    // Implement the logic to handle favorite click
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 header-text">Find Exhibitions</h1>
          <p className="text-font-color-muted subheading-text">Discover and apply to upcoming exhibitions</p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="col-span-2">
          <Input
            type="text"
            placeholder="Search exhibitions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input subheading-text w-full"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="input subheading-text">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id} className="subheading-text">
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="input subheading-text">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location} value={location} className="subheading-text">
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Section */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-font-color" />
        </div>
      ) : exhibitions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-font-color-muted subheading-text">No exhibitions found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exhibitions.map((exhibition) => (
            <Card key={exhibition.id} className="card">
              <CardContent className="p-0">
                {exhibition.cover_image && (
                  <div className="relative h-48">
                    <img
                      src={exhibition.cover_image}
                      alt={exhibition.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 hover:bg-background-primary/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavoriteClick(exhibition.id);
                      }}
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          exhibition.isFavorite ? 'fill-font-color text-font-color' : 'text-font-color'
                        }`}
                      />
                    </Button>
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 header-text">{exhibition.title}</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-font-color-muted">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="text-sm subheading-text">
                        {format(new Date(exhibition.start_date), 'MMM d')} - {format(new Date(exhibition.end_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center text-font-color-muted">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="text-sm subheading-text">{exhibition.address}</span>
                    </div>
                    <div className="flex items-center text-font-color-muted">
                      <Users className="h-4 w-4 mr-2" />
                      <span className="text-sm subheading-text">{exhibition.availableStalls} stalls available</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge className="badge subheading-text">
                      {exhibition.price_range}
                    </Badge>
                    <Button
                      onClick={() => navigate(`/exhibitions/${exhibition.id}`)}
                      className="button-primary subheading-text"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {exhibitions.length > 0 && (
        <div className="flex justify-center mt-8 space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="button-secondary subheading-text"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={exhibitions.length < ITEMS_PER_PAGE}
            className="button-secondary subheading-text"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

// Exhibition card component
const ExhibitionCard = ({ exhibition, onNavigate }: ExhibitionCardProps) => {
  const { isFavorite, toggleFavorite, isSubmitting } = useExhibitionFavorite(exhibition.id);
  const favorite = exhibition.isFavorite !== undefined ? exhibition.isFavorite : isFavorite;

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onNavigate}
    >
      <div className="relative h-48 overflow-hidden">
        {exhibition.cover_image ? (
          <img 
            src={exhibition.cover_image} 
            alt={exhibition.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-exhibae-navy to-blue-400 flex items-center justify-center">
            <h3 className="text-white text-xl font-bold px-4 text-center">{exhibition.title}</h3>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <h3 className="text-white font-bold text-lg line-clamp-2">{exhibition.title}</h3>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-white/80 hover:bg-white/90 h-8 w-8 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite();
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={`h-4 w-4 ${favorite ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
          )}
        </Button>
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center space-x-2 text-gray-600">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm truncate">{exhibition.address}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">
            {format(new Date(exhibition.start_date), 'dd MMM')} - {format(new Date(exhibition.end_date), 'dd MMM, yyyy')}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">10AM onwards</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <Users className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">
            {exhibition.availableStalls} stalls available
          </span>
        </div>
        {exhibition.price_range && (
          <div className="text-sm font-medium text-exhibae-navy">
            ₹{exhibition.price_range} onwards
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FindExhibitions; 