import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from '@/hooks/useDebounce';
import { getInitials } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { SubscriptionForm } from '@/components/SubscriptionForm';
import { useSubscription } from '@/hooks/useSubscription';

interface BrandProfile {
  id: string;
  user_id: string;
  company_name: string;
  logo_url: string | null;
  description: string | null;
  created_at: string;
}

const ITEMS_PER_PAGE = 20;

const BrandsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: subscription } = useSubscription();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const sortField = searchParams.get('sort') || 'company_name';
  const sortOrder = searchParams.get('order') || 'asc';
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  const { data: brandsData, isLoading } = useQuery({
    queryKey: ['brands', debouncedSearchQuery, sortField, sortOrder],
    queryFn: async () => {
      let query = supabase
        .from('brand_profiles')
        .select('*', { count: 'exact' });

      // Add search filter if query exists
      if (debouncedSearchQuery) {
        query = query.or(`company_name.ilike.%${debouncedSearchQuery}%,description.ilike.%${debouncedSearchQuery}%`);
      }

      // Add sorting
      if (sortField === 'company_name') {
        query = query.order('company_name', { ascending: sortOrder === 'asc' });
      } else if (sortField === 'created_at') {
        query = query.order('created_at', { ascending: sortOrder === 'asc' });
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        brands: data as BrandProfile[],
        totalCount: count || 0
      };
    }
  });

  // Query to get user's favorited brands
  const { data: favoritedBrands } = useQuery({
    queryKey: ['favorited-brands', user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();

      const { data } = await supabase
        .from('brand_favorites')
        .select('brand_id')
        .eq('user_id', user.id);

      return new Set(data?.map(fav => fav.brand_id) || []);
    },
    enabled: !!user
  });

  const { mutate: toggleFavorite } = useMutation({
    mutationFn: async ({ brandId, userId }: { brandId: string; userId: string }) => {
      const isFavorited = favoritedBrands?.has(brandId);
      
      if (isFavorited) {
        const { error } = await supabase
          .from('brand_favorites')
          .delete()
          .eq('brand_id', brandId)
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('brand_favorites')
          .insert([{ brand_id: brandId, user_id: userId }]);
        
        if (error) throw error;
      }
    },
    onSuccess: (_, { brandId }) => {
      queryClient.invalidateQueries({ queryKey: ['favorited-brands'] });
      const isFavorited = favoritedBrands?.has(brandId);
      toast({
        title: isFavorited ? 'Removed from favorites' : 'Added to favorites',
        duration: 2000,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update favorites. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleFavorite = (e: React.MouseEvent, brandId: string) => {
    e.stopPropagation(); // Prevent navigation when clicking the favorite button
    
    if (!user) {
      toast({
        title: 'Please log in',
        description: 'You must be logged in to favorite brands',
        variant: 'destructive',
      });
      return;
    }

    toggleFavorite({ brandId, userId: user.id });
  };

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

  const handleSort = (value: string) => {
    const [field, order] = value.split('-');
    updateParams({ sort: field, order });
  };

  return (
    <div className="min-h-screen bg-[#F5E4DA]">
      {/* Hero Section */}
      <div className="py-16 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-[#4B1E25] mb-4">
            Discover Amazing Brands
          </h1>
          <p className="text-lg text-[#4B1E25]/80 max-w-2xl mx-auto">
            Connect with innovative brands showcasing their unique products and collections at our exhibitions
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-semibold text-[#4B1E25]">Browse All Brands</h2>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search brands..."
                  value={searchQuery}
                  onChange={(e) => updateParams({ q: e.target.value })}
                  className="pl-9"
                />
              </div>
              <Select
                value={`${sortField}-${sortOrder}`}
                onValueChange={handleSort}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by..." />
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

        {/* Brands Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col items-center animate-pulse">
                <div className="w-28 h-28 rounded-full bg-white mb-3" />
                <div className="h-4 w-20 bg-white rounded" />
              </div>
            ))}
          </div>
        ) : brandsData?.brands.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2 text-[#4B1E25]">No Brands Found</h3>
            <p className="text-[#4B1E25]/70">
              Try adjusting your search criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {brandsData?.brands.map((brand) => (
              <div
                key={brand.id}
                className="group relative"
              >
                <div 
                  onClick={() => navigate(`/brands/${brand.id}`)}
                  className="cursor-pointer flex flex-col items-center"
                >
                  <div className="mb-3">
                    <div className="w-28 h-28 rounded-full overflow-hidden bg-white hover:shadow-lg transition-all duration-300">
                      {brand.logo_url ? (
                        <img
                          src={brand.logo_url}
                          alt={brand.company_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white">
                          <span className="text-2xl font-medium text-[#4B1E25]">
                            {getInitials(brand.company_name)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-center text-[#4B1E25] group-hover:text-[#4B1E25]/80 transition-colors">
                    {brand.company_name}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0 rounded-full hover:bg-white/80"
                  onClick={(e) => handleFavorite(e, brand.user_id)}
                >
                  <Heart 
                    className={`h-5 w-5 ${favoritedBrands?.has(brand.user_id) ? 'fill-[#4B1E25] text-[#4B1E25]' : 'text-[#4B1E25]/70'}`}
                  />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Newsletter Section */}
      {!user && !subscription && (
        <section className="py-16 bg-[#4B1E25]/5">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6 text-[#1C1C1C] header-text">Never Miss an Exhibition</h2>
              <div className="max-w-xl mx-auto">
                <SubscriptionForm />
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default BrandsList; 