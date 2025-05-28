import React, { useState, useEffect, useMemo } from 'react';
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
}

interface Brand {
  id: string;
  user_metadata: BrandMetadata;
  created_at?: string;
  isFavorite?: boolean;
}

interface PaginatedResponse {
  data: Brand[];
  count: number;
}

type SortField = 'company_name' | 'created_at';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

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

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking the favorite button
    toggleFavorite();
  };

  return (
    <div
      onClick={() => navigate(`/brands/${brand.id}`)}
      className="group cursor-pointer flex flex-col items-center"
    >
      <div className="relative mb-4">
        <div className="w-40 h-40 rounded-full overflow-hidden bg-background hover:shadow-lg transition-all duration-300">
          {brand.user_metadata.logo_url ? (
            <img
              src={brand.user_metadata.logo_url}
              alt={brand.user_metadata.company_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-background">
              <span className="text-3xl font-medium text-font-color">
                {getInitials(brand.user_metadata.company_name)}
              </span>
            </div>
          )}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 bg-background/80 hover:bg-[#4B1E25] hover:text-[#F5E4DA] shadow-sm"
              onClick={handleFavoriteClick}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={`h-4 w-4 ${brand.isFavorite ? 'fill-[#4B1E25] text-[#4B1E25]' : 'text-font-color-muted hover:text-[#F5E4DA]'}`} />
              )}
            </Button>
          )}
        </div>
      </div>
      <h3 className="text-lg font-medium text-center header-text group-hover:text-font-color transition-colors">
        {brand.user_metadata.company_name}
      </h3>
    </div>
  );
};

const fetchBrands = async (user: User | null, searchQuery: string) => {
  try {
    // Fetch brand profiles from the brand_profiles table
    const { data: brandProfiles, error: brandsError } = await supabase
      .from('brand_profiles')
      .select('*')
      .order('created_at', { ascending: false });

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

    // Map profile data to the expected Brand structure
    let brands = brandProfiles?.map(profile => ({
      id: profile.id,
      user_metadata: {
        company_name: profile.company_name || 'Brand',
        logo_url: profile.logo_url,
        description: profile.description || ''
      },
      created_at: profile.created_at,
      isFavorite: favorites.includes(profile.id)
    })) || [];

    // Filter brands based on search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      brands = brands.filter(brand => 
        brand.user_metadata.company_name.toLowerCase().includes(query) ||
        brand.user_metadata.description.toLowerCase().includes(query)
      );
    }

    return brands;
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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  // Debounce search query updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
    queryKey: ['brands', user?.id, page, debouncedSearchQuery, sortField, sortOrder],
    queryFn: () => fetchBrands(user, debouncedSearchQuery),
    retry: false
  });

  // Sort the filtered data
  const sortedData = useMemo(() => {
    if (!data) return [];
    
    return [...data].sort((a, b) => {
      if (sortField === 'company_name') {
        const compareResult = a.user_metadata.company_name.localeCompare(b.user_metadata.company_name);
        return sortOrder === 'asc' ? compareResult : -compareResult;
      } else if (sortField === 'created_at') {
        const aDate = new Date(a.created_at || 0).getTime();
        const bDate = new Date(b.created_at || 0).getTime();
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      }
      return 0;
    });
  }, [data, sortField, sortOrder]);

  const totalPages = Math.ceil((sortedData?.length || 0) / ITEMS_PER_PAGE);

  const handleSearch = (value: string) => {
    updateParams({ q: value, page: '1' });
  };

  const handleSort = (field: SortField) => {
    const newOrder = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
    updateParams({ sort: field, order: newOrder, page: '1' });
  };

  if (error) {
    return (
      <div className="bg-background">
        <div className="container mx-auto py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="header-text">Error loading brands</AlertTitle>
            <AlertDescription className="subheading-text">
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
    <div className="min-h-screen bg-[#F5E4DA]">
      {/* Header Banner */}
      <div className="bg-[#F5E4DA] py-10">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Discover Amazing Brands</h1>
            <p className="text-gray-600 text-lg">
              Connect with innovative brands showcasing their unique products and collections at our exhibitions
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-6">
        {/* Filters */}
        <div className="bg-background card p-6 rounded-2xl shadow-sm mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <h2 className="text-2xl font-semibold header-text">Browse All Brands</h2>
            
            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-font-color-muted" />
                <Input
                  type="text"
                  placeholder="Search brands..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 input subheading-text"
                />
              </div>
              <Select
                value={sortField}
                onValueChange={(value) => handleSort(value as SortField)}
              >
                <SelectTrigger className="w-[180px] input subheading-text">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company_name" className="subheading-text">Company Name</SelectItem>
                  <SelectItem value="created_at" className="subheading-text">Date Joined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-font-color" />
          </div>
        ) : sortedData.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-3 header-text">No Brands Found</h3>
            <p className="text-font-color-muted subheading-text">
              Try adjusting your search criteria
            </p>
          </div>
        ) : (
          <>
            {/* Brands Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-8">
              {sortedData
                .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
                .map((brand) => (
                  <BrandCard key={brand.id} brand={brand} />
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 mb-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={() => updateParams({ page: String(Math.max(1, page - 1)) })}
                        className={`border-[#4B1E25] text-[#4B1E25] hover:bg-[#4B1E25] hover:text-[#F5E4DA] ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={() => updateParams({ page: String(pageNum) })}
                          isActive={pageNum === page}
                          className={`${pageNum === page ? 'bg-[#4B1E25] text-[#F5E4DA]' : 'border-[#4B1E25] text-[#4B1E25] hover:bg-[#4B1E25] hover:text-[#F5E4DA]'}`}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={() => updateParams({ page: String(Math.min(totalPages, page + 1)) })}
                        className={`border-[#4B1E25] text-[#4B1E25] hover:bg-[#4B1E25] hover:text-[#F5E4DA] ${page === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BrandsList; 