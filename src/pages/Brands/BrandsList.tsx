import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, ArrowUpDown, AlertCircle, Users, Bookmark, ChevronRight, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User } from '@supabase/supabase-js';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { useBrandFavorite } from '@/hooks/useBrandFavorite';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface BrandMetadata {
  company_name: string;
  logo_url?: string;
  description?: string;
  role: string;
}

interface Brand {
  id: string;
  email?: string;
  user_metadata: BrandMetadata;
  created_at?: string;
  event_count?: number;
  isFavorite?: boolean;
}

interface PaginatedResponse {
  data: Brand[];
  count: number;
}

type SortField = 'company_name' | 'created_at';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 12;

const BrandCard: React.FC<{ brand: Brand }> = ({ brand }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleFavorite, isSubmitting } = useBrandFavorite(brand.id);
  
  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map(word => word?.[0] || '')
      .join('')
      .toUpperCase();
  };

  // Generate a random gradient for brands without logos
  const getRandomGradient = () => {
    const gradients = [
      'from-blue-500 to-purple-500',
      'from-emerald-500 to-teal-500',
      'from-pink-500 to-rose-500',
      'from-amber-500 to-orange-500',
      'from-indigo-500 to-blue-500',
      'from-green-500 to-emerald-500',
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking the favorite button
    toggleFavorite();
  };

  return (
    <div
      onClick={() => navigate(`/brands/${brand.id}`)}
      className="group cursor-pointer"
    >
      <div className="relative flex flex-col h-full overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative p-6 flex flex-col items-center">
          {/* Favorite Button */}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-8 w-8 hover:bg-primary/10"
              onClick={handleFavoriteClick}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={`h-4 w-4 ${brand.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
              )}
            </Button>
          )}

          <div className="relative mb-6">
            <div className="relative">
              <Avatar className="w-32 h-32 transition-all duration-300 group-hover:scale-105 shadow-lg">
                <AvatarImage 
                  src={brand.user_metadata.logo_url} 
                  alt={brand.user_metadata.company_name} 
                  className="object-cover"
                />
                <AvatarFallback className={`text-3xl bg-gradient-to-br ${getRandomGradient()} text-white`}>
                  {getInitials(brand.user_metadata.company_name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white shadow-md text-primary text-xs font-medium px-4 py-1.5 rounded-full border border-primary/10">
                {brand.event_count || 0} {brand.event_count === 1 ? 'event' : 'events'}
              </div>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-center mb-3 group-hover:text-primary transition-colors">
            {brand.user_metadata.company_name}
          </h3>
          
          <div className="mt-auto pt-4 w-full">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-between"
            >
              <span>View Profile</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const fetchBrands = async (user: User | null) => {
  try {
    // Fetch brand users from the profiles table
    const { data: brandProfiles, error: brandsError } = await supabase
      .from('profiles')
      .select('id, email, full_name, company_name, avatar_url, role, created_at');

    if (brandsError) throw brandsError;

    // If user is logged in, fetch their favorites
    let favorites: string[] = [];
    if (user) {
      const { data: favoritesData } = await supabase
        .from('brand_favorites')
        .select('brand_id')
        .eq('user_id', user.id);
      
      favorites = (favoritesData || []).map(f => f.brand_id);
    }

    // Filter for brands and map with favorite status
    const filteredBrandUsers = [];
    
    for (const profile of brandProfiles || []) {
      if (profile.role === 'brand') {
        filteredBrandUsers.push({
          id: profile.id,
          email: profile.email,
          user_metadata: {
            company_name: profile.company_name || 'Brand',
            logo_url: profile.avatar_url,
            description: '',
            role: profile.role
          },
          created_at: profile.created_at,
          isFavorite: favorites.includes(profile.id)
        });
      }
    }

    return filteredBrandUsers;
  } catch (err) {
    console.error('Error fetching brands:', err);
    throw err;
  }
};

const BrandsList = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const sortField = (searchParams.get('sort') as SortField) || 'company_name';
  const sortOrder = (searchParams.get('order') as SortOrder) || 'asc';
  const searchQuery = searchParams.get('q') || '';

  const updateParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['brands', user?.id, page, searchQuery, sortField, sortOrder],
    queryFn: () => fetchBrands(user),
    retry: false
  });

  const totalPages = Math.ceil((data?.length || 0) / ITEMS_PER_PAGE);

  const handleSearch = (value: string) => {
    updateParams({ q: value, page: '1' });
  };

  const handleSort = (field: SortField) => {
    const newOrder = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
    updateParams({ sort: field, order: newOrder, page: '1' });
  };

  if (error) {
    return (
      <div className="bg-gray-50">
        <div className="container mx-auto py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading brands</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'An unexpected error occurred. Please try again later.'}
              {process.env.NODE_ENV === 'development' && (
                <pre className="mt-2 text-xs">
                  {JSON.stringify(error, null, 2)}
                </pre>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary/90 to-primary text-white">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Discover Amazing Brands</h1>
            <p className="text-white/90 text-lg mb-6">
              Connect with innovative brands showcasing their unique products and collections at our exhibitions
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Users className="h-5 w-5" />
                <span className="font-medium">{data?.length || 0} Brands</span>
              </div>
              <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Bookmark className="h-5 w-5" />
                <span className="font-medium">Featured Collections</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4">
        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">Browse All Brands</h2>
            
            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                <Input
                  type="text"
                  placeholder="Search brands..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 bg-white/50 border-primary/20 focus-visible:ring-primary/30 rounded-xl"
                />
              </div>
              <Select
                value={`${sortField}-${sortOrder}`}
                onValueChange={(value) => {
                  const [field, order] = value.split('-') as [SortField, SortOrder];
                  updateParams({ sort: field, order, page: '1' });
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px] bg-white/50 border-primary/20 rounded-xl">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company_name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="company_name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="created_at-desc">Newest First</SelectItem>
                  <SelectItem value="created_at-asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center min-h-[400px] bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading brands...</p>
            </div>
          </div>
        )}

        {/* No Results */}
        {!isLoading && (!data?.length) && (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm">
            <Users className="h-12 w-12 text-primary/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No brands found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery 
                ? "We couldn't find any brands matching your search criteria. Try adjusting your search terms."
                : "There are no brands to display yet. Check back soon for updates."}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => handleSearch('')}
                className="border-primary/20 hover:bg-primary/5"
              >
                Clear search
              </Button>
            )}
          </div>
        )}

        {/* Brands Grid */}
        {!isLoading && data?.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) updateParams({ page: (page - 1).toString() });
                    }}
                    className={`rounded-xl transition-colors duration-300 ${page <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-primary/5'}`}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, i, arr) => {
                    if (i > 0 && arr[i - 1] !== p - 1) {
                      return (
                        <React.Fragment key={`ellipsis-${p}`}>
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                updateParams({ page: p.toString() });
                              }}
                              className={`rounded-xl transition-colors duration-300 ${page === p ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'hover:bg-primary/5'}`}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      );
                    }
                    return (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            updateParams({ page: p.toString() });
                          }}
                          className={`rounded-xl transition-colors duration-300 ${page === p ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'hover:bg-primary/5'}`}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                <PaginationItem>
                  <PaginationNext 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page < totalPages) updateParams({ page: (page + 1).toString() });
                    }}
                    className={`rounded-xl transition-colors duration-300 ${page >= totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-primary/5'}`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandsList; 