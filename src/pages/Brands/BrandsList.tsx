import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, ArrowUpDown, AlertCircle, Users, Bookmark, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User } from '@supabase/supabase-js';
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
  
  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map(word => word?.[0] || '')
      .join('')
      .toUpperCase();
  };

  return (
    <div
      onClick={() => navigate(`/brands/${brand.id}`)}
      className="group cursor-pointer"
    >
      <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 h-full">
        <div className="relative mb-6">
          <Avatar className="w-32 h-32 transition-transform duration-200 group-hover:scale-105 border-2 border-primary/10">
            <AvatarImage 
              src={brand.user_metadata.logo_url} 
              alt={brand.user_metadata.company_name} 
              className="object-cover"
            />
            <AvatarFallback className="text-3xl bg-primary/10 text-primary">
              {getInitials(brand.user_metadata.company_name)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">
            {brand.event_count || 0} {brand.event_count === 1 ? 'event' : 'events'}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-center mb-2 group-hover:text-primary transition-colors">
          {brand.user_metadata.company_name}
        </h3>
        <div className="flex items-center text-xs text-muted-foreground mt-auto">
          <Button variant="ghost" size="sm" className="text-xs font-normal mt-2 group-hover:bg-primary/10">
            View Profile <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const BrandsList = () => {
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

  const { data, isLoading, error } = useQuery<PaginatedResponse>({
    queryKey: ['brands', page, sortField, sortOrder, searchQuery],
    queryFn: async () => {
      try {
        // Fetch brand users from the profiles table
        const { data: brandProfiles, error: brandsError } = await supabase
          .from('profiles')
          .select('id, email, full_name, company_name, avatar_url, role, created_at');

        if (brandsError) throw brandsError;

        // Filter for brands client-side
        const filteredBrandUsers = [];
        
        for (const profile of brandProfiles || []) {
          if (profile.role === 'brand') {
            // Map profile data to the expected Brand structure
            filteredBrandUsers.push({
              id: profile.id,
              email: profile.email,
              user_metadata: {
                company_name: profile.company_name || 'Brand',
                logo_url: profile.avatar_url,
                description: '', // Profiles may not have description, add if available
                role: profile.role
              },
              created_at: profile.created_at
            });
          }
        }

        // Get event counts for each brand
        let eventCounts = [];
        try {
          const eventCountPromises = filteredBrandUsers.map(async (user) => {
            try {
              const { data: applications, error: appError } = await supabase
                .from('exhibition_applications')
                .select('exhibition_id')
                .eq('brand_id', user.id)
                .eq('status', 'approved');
                
              // If we get a 404 error (table doesn't exist), return 0 count
              if (appError && appError.code === '404') {
                return {
                  id: user.id,
                  event_count: 0
                };
              }
              
              if (appError) throw appError;
              
              return {
                id: user.id,
                event_count: applications?.length || 0
              };
            } catch (err) {
              console.error(`Error fetching events for brand ${user.id}:`, err);
              // Return 0 count for this brand if there's an error
              return {
                id: user.id,
                event_count: 0
              };
            }
          });
          
          eventCounts = await Promise.all(eventCountPromises);
        } catch (err) {
          console.error('Error fetching event counts:', err);
          // If the entire operation fails, set all counts to 0
          eventCounts = filteredBrandUsers.map(user => ({
            id: user.id,
            event_count: 0
          }));
        }
        
        // Convert to our Brand interface and add event counts
        const brands: Brand[] = filteredBrandUsers.map(user => {
          const eventData = eventCounts.find(ec => ec.id === user.id);
          return {
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata,
            created_at: user.created_at,
            event_count: eventData?.event_count || 0
          };
        });

        // Apply search filter if present
        let filteredBrands = brands;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredBrands = brands.filter(brand => 
            brand.user_metadata.company_name?.toLowerCase().includes(query) ||
            brand.user_metadata.description?.toLowerCase().includes(query)
          );
        }

        // Sort the results
        filteredBrands.sort((a, b) => {
          if (sortField === 'company_name') {
            const nameA = a.user_metadata.company_name?.toLowerCase() || '';
            const nameB = b.user_metadata.company_name?.toLowerCase() || '';
            return sortOrder === 'asc' 
              ? nameA.localeCompare(nameB)
              : nameB.localeCompare(nameA);
          } else { // created_at
            const dateA = new Date(a.created_at || '').getTime();
            const dateB = new Date(b.created_at || '').getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
          }
        });

        // Get total count for pagination
        const totalCount = filteredBrands.length;

        // Apply pagination
        const start = (page - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const paginatedBrands = filteredBrands.slice(start, end);

        return {
          data: paginatedBrands,
          count: totalCount
        };
      } catch (err) {
        console.error('Error fetching brands:', err);
        throw err;
      }
    },
    retry: false
  });

  const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);

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
    <div className="bg-gray-50">
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
                <span className="font-medium">{data?.count || 0} Brands</span>
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
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-semibold">Browse All Brands</h2>
            
            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search brands..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 border-primary/20 focus-visible:ring-primary/30"
                />
              </div>
              <Select
                value={`${sortField}-${sortOrder}`}
                onValueChange={(value) => {
                  const [field, order] = value.split('-') as [SortField, SortOrder];
                  updateParams({ sort: field, order, page: '1' });
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px] border-primary/20">
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
          <div className="flex items-center justify-center min-h-[400px] bg-white rounded-xl shadow-sm">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading brands...</p>
            </div>
          </div>
        )}

        {/* No Results */}
        {!isLoading && (!data?.data.length) && (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
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
        {!isLoading && data?.data.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data.data.map((brand) => (
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
                    className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
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
                              isActive={page === p}
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
                          isActive={page === p}
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
                    className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
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