import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import DashboardWidget from '@/components/dashboard/DashboardWidget';
import { UserRole } from '@/types/auth';

const ITEMS_PER_PAGE = 8;

// Types for the exhibitions
interface Exhibition {
  id: string;
  title: string;
  address: string;
  city: string;
  cover_image?: string;
  start_date: string;
  end_date: string;
  status: string;
  category_id: string;
  price_range?: string;
  category?: {
    id: string;
    name: string;
  };
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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [category, setCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [categories, setCategories] = useState<ExhibitionCategory[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    if (user) {
      fetchExhibitions();
      fetchCategories();
    }
  }, [user, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    if (user) {
      fetchExhibitions();
    }
  }, [searchTerm, category]);

  const fetchExhibitions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('exhibitions')
        .select(`
          *,
          category:exhibition_categories(*)
        `, { count: 'exact' })
        .eq('status', 'published')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`);
      }
      if (category !== 'all') {
        query = query.eq('category_id', category);
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: exhibitionsData, error: exhibitionsError, count } = await query;

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

      const processedExhibitions = exhibitionsData.map(exhibition => ({
        ...exhibition,
        category: exhibition.category?.[0] || null,
        isFavorite: favoritesSet.has(exhibition.id)
      }));

      setExhibitions(processedExhibitions || []);
      setTotalCount(count || 0);
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

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardWidget
        role={UserRole.ORGANISER}
        title="Find Exhibitions"
        description="Discover and favorite exhibitions from other organizers"
      >
        <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0 mt-4">
          <Input
            placeholder="Search exhibitions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:w-1/2"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="md:w-1/4">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {exhibitions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No exhibitions found matching your criteria.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {exhibitions.map((exhibition) => (
                <ExhibitionCard
                  key={exhibition.id}
                  exhibition={exhibition}
                  onNavigate={() => navigate(`/exhibitions/${exhibition.id}`)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t pt-4 mt-6">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} exhibitions
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </DashboardWidget>
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
          <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center">
            <h3 className="text-white text-xl font-bold px-4 text-center">{exhibition.title}</h3>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <h3 className="text-white font-bold text-lg line-clamp-2">{exhibition.title}</h3>
          {exhibition.category && (
            <Badge variant="outline" className="mt-1 bg-white/20 text-white border-white/30">
              {exhibition.category.name}
            </Badge>
          )}
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
          <span className="text-sm truncate">{exhibition.address}, {exhibition.city}</span>
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
        {exhibition.price_range && (
          <div className="text-sm font-medium text-emerald-600">
            ₹{exhibition.price_range} onwards
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FindExhibitions; 