import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Calendar, MapPin, Heart, Loader2, Search, 
  Store, Building2, Users, ChevronRight 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DashboardWidget from '@/components/dashboard/DashboardWidget';
import { useExhibitionFavorite } from '@/hooks/useExhibitionFavorite';
import { useBrandFavorite } from '@/hooks/useBrandFavorite';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface Brand {
  id: string;
  company_name: string;
  avatar_url?: string;
  description?: string;
  event_count?: number;
  isFavorite: boolean;
}

const MyFavorites = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'exhibitions' | 'brands'>('exhibitions');

  // Fetch user's favorite exhibitions
  const { data: exhibitions, isLoading: isLoadingExhibitions } = useQuery({
    queryKey: ['my-favorites-exhibitions'],
    queryFn: async () => {
      if (!user) return [];

      // First, get the user's favorites
      const { data: favorites, error: favoritesError } = await supabase
        .from('exhibition_favorites')
        .select('exhibition_id')
        .eq('user_id', user.id);

      if (favoritesError) {
        console.error('Error fetching exhibition favorites:', favoritesError);
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
          category:exhibition_categories(*)
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

  // Fetch user's favorite brands
  const { data: brands, isLoading: isLoadingBrands } = useQuery({
    queryKey: ['my-favorites-brands'],
    queryFn: async () => {
      if (!user) return [];

      // First, get the user's favorites
      const { data: favorites, error: favoritesError } = await supabase
        .from('brand_favorites')
        .select('brand_id')
        .eq('user_id', user.id);

      if (favoritesError) {
        console.error('Error fetching brand favorites:', favoritesError);
        throw favoritesError;
      }

      if (!favorites || favorites.length === 0) {
        return [];
      }

      // Get brand IDs
      const brandIds = favorites.map((fav) => fav.brand_id);

      // First fetch the brand details
      const { data: brandsData, error: brandsError } = await supabase
        .from('profiles')
        .select('id, company_name, avatar_url, description')
        .in('id', brandIds)
        .eq('role', 'brand');

      if (brandsError) {
        console.error('Error fetching brands:', brandsError);
        throw brandsError;
      }

      // Then fetch event counts for each brand in a separate query
      const brandsWithCounts = await Promise.all((brandsData || []).map(async (brand) => {
        const { count, error: countError } = await supabase
          .from('exhibition_applications')
          .select('*', { count: 'exact', head: true })
          .eq('brand_id', brand.id)
          .eq('status', 'approved');

        if (countError) {
          console.error('Error fetching event count:', countError);
          return {
            ...brand,
            event_count: 0
          };
        }

        return {
          ...brand,
          event_count: count || 0
        };
      }));

      return brandsWithCounts.map(brand => ({
        ...brand,
        isFavorite: true
      })) as Brand[];
    },
    enabled: !!user,
  });

  // Filter based on search query
  const filteredExhibitions = exhibitions?.filter((exhibition) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      exhibition.title.toLowerCase().includes(query) ||
      exhibition.city.toLowerCase().includes(query) ||
      exhibition.category?.name.toLowerCase().includes(query)
    );
  });

  const filteredBrands = brands?.filter((brand) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      brand.company_name.toLowerCase().includes(query) ||
      brand.description?.toLowerCase().includes(query)
    );
  });

  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map(word => word?.[0] || '')
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Favorites</h1>
        <p className="mt-1 text-sm text-gray-600">
          Keep track of your favorite exhibitions and brands
        </p>
      </div>

      {/* Search and Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative w-full md:w-[300px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search favorites..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="exhibitions" onValueChange={(value) => setActiveTab(value as 'exhibitions' | 'brands')}>
            <TabsList className="mb-6">
              <TabsTrigger value="exhibitions" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Exhibitions
              </TabsTrigger>
              <TabsTrigger value="brands" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Brands
              </TabsTrigger>
            </TabsList>

            <TabsContent value="exhibitions">
              {isLoadingExhibitions ? (
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
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">
                    {searchQuery ? "No exhibitions match your search" : "You haven't favorited any exhibitions yet"}
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
            </TabsContent>

            <TabsContent value="brands">
              {isLoadingBrands ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredBrands && filteredBrands.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBrands.map((brand) => (
                    <BrandCard key={brand.id} brand={brand} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">
                    {searchQuery ? "No brands match your search" : "You haven't favorited any brands yet"}
                  </p>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery 
                      ? "Try adjusting your search or clear it to see all your favorites" 
                      : "Find brands and click the heart icon to add them to your favorites"
                    }
                  </p>
                  {searchQuery ? (
                    <Button onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link to="/brands">Browse Brands</Link>
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Exhibition card component
const ExhibitionCard = ({ exhibition }: { exhibition: Exhibition }) => {
  const { toggleFavorite, isSubmitting } = useExhibitionFavorite(exhibition.id);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">{exhibition.title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(exhibition.start_date), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {exhibition.city}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
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
            </div>
            <Button asChild variant="default" size="sm">
              <Link to={`/exhibitions/${exhibition.id}`}>View Details</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Brand card component
const BrandCard = ({ brand }: { brand: Brand }) => {
  const { toggleFavorite, isSubmitting } = useBrandFavorite(brand.id);
  
  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map(word => word?.[0] || '')
      .join('')
      .toUpperCase();
  };

  const getRandomGradient = () => {
    const gradients = [
      'from-pink-500 to-rose-500',
      'from-purple-500 to-indigo-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-yellow-500 to-orange-500'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={brand.avatar_url} alt={brand.company_name} />
              <AvatarFallback className={`bg-gradient-to-br ${getRandomGradient()} text-white`}>
                {getInitials(brand.company_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link 
                to={`/brands/${brand.id}`}
                className="text-lg font-semibold hover:text-exhibae-navy transition-colors"
              >
                {brand.company_name}
              </Link>
              {brand.description && (
                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                  {brand.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4 mr-1" />
                  <span>{brand.event_count} Events</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => toggleFavorite()}
              disabled={isSubmitting}
            >
              <Heart className="h-5 w-5 fill-current" />
            </Button>
            <Link to={`/brands/${brand.id}`}>
              <Button variant="ghost" size="icon">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyFavorites; 