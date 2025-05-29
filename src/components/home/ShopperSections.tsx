import React from 'react';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ChevronRight, Heart, Store } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

interface Exhibition {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  address: string;
  city: string;
  created_at: string;
  banner_url?: string;
  status?: 'upcoming' | 'past';
  attendingId?: string;
}

interface Brand {
  id: string;
  company_name: string;
  avatar_url: string | null;
  description: string | null;
}

interface ExhibitionAttendingResponse {
  exhibition_id: string;
  exhibitions: Exhibition[];
}

export const ShopperSections = () => {
  const { user } = useAuth();

  // Fetch favorite brands
  const { data: favoriteBrands, isLoading: isLoadingBrands } = useQuery<Brand[]>({
    queryKey: ['favorite-brands', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First get the user's favorite brand IDs
      const { data: favorites, error: favoritesError } = await supabase
        .from('brand_favorites')
        .select('brand_id')
        .eq('user_id', user.id)
        .limit(5);

      if (favoritesError) throw favoritesError;

      if (!favorites || favorites.length === 0) return [];

      // Then fetch the brand details from profiles table
      const { data: brands, error: brandsError } = await supabase
        .from('profiles')
        .select('id, company_name, avatar_url, description')
        .in('id', favorites.map(f => f.brand_id))
        .eq('role', 'brand');

      if (brandsError) throw brandsError;

      return brands as Brand[];
    },
    enabled: !!user
  });

  // Fetch exhibitions the shopper is attending
  const { data: attendingExhibitions, isLoading: isLoadingAttending } = useQuery<Exhibition[]>({
    queryKey: ['shopper-attending-exhibitions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First get the attending records with exhibition details
      const { data, error } = await supabase
        .from('exhibition_attending')
        .select(`
          id,
          exhibitions!inner (
            id,
            title,
            start_date,
            end_date,
            address,
            city,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching exhibitions:', error);
        return [];
      }
      
      // Transform the data and add status
      const now = new Date();
      const transformed = (data || [])
        .map((item: any) => ({
          attendingId: item.id,
          ...item.exhibitions,
          status: new Date(item.exhibitions.end_date) >= now ? 'upcoming' : 'past'
        }))
        .filter(exhibition => exhibition.status === 'upcoming')
        .slice(0, 5);

      return transformed;
    },
    enabled: !!user?.id
  });

  const EventSlider = () => {
    if (isLoadingAttending) {
      return (
        <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[#E6C5B6] scrollbar-track-[#F5E4DA]">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i} className="bg-[#E6C5B6] min-w-[280px] max-w-[280px] flex-shrink-0">
              <CardContent className="p-3 space-y-2">
                <Skeleton className="h-4 w-36 bg-[#F5E4DA]" />
                <Skeleton className="h-3 w-24 bg-[#F5E4DA]" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!attendingExhibitions || attendingExhibitions.length === 0) {
      return (
        <Card className="bg-[#E6C5B6] w-full">
          <CardContent className="p-4 text-center">
            <p className="text-[#1C1C1C]/60 mb-3">You haven't marked any exhibitions to attend yet</p>
            <Button asChild className="bg-[#4B1E25] hover:bg-[#4B1E25]/90 text-[#F5E4DA]">
              <Link to="/exhibitions">Browse Exhibitions</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[#E6C5B6] scrollbar-track-[#F5E4DA]">
        {attendingExhibitions.map(exhibition => (
          <Card key={exhibition.id} className="bg-[#E6C5B6] min-w-[280px] max-w-[280px] flex-shrink-0 hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <h3 className="font-semibold text-[#4B1E25] text-sm mb-2 line-clamp-1 hover:text-[#4B1E25]/80 transition-colors">
                {exhibition.title}
              </h3>
              <div className="space-y-1 text-xs text-[#4B1E25]/80 mb-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  <span className="line-clamp-1">
                    {format(new Date(exhibition.start_date), 'MMM d')} - {format(new Date(exhibition.end_date), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" />
                  <span className="line-clamp-1">{exhibition.city}</span>
                </div>
              </div>
              <Button asChild className="w-full h-8 text-xs bg-[#4B1E25] hover:bg-[#4B1E25]/90 text-[#F5E4DA]">
                <Link to={`/exhibitions/${exhibition.id}`}>
                  View Details
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const BrandsList = () => {
    if (isLoadingBrands) {
      return (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i} className="bg-[#E6C5B6]">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full bg-[#F5E4DA]" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 bg-[#F5E4DA]" />
                    <Skeleton className="h-3 w-20 bg-[#F5E4DA]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!favoriteBrands || favoriteBrands.length === 0) {
      return (
        <Card className="bg-[#E6C5B6] w-full">
          <CardContent className="p-6 text-center">
            <p className="text-[#1C1C1C]/60 mb-4">You haven't favorited any brands yet</p>
            <Button asChild className="bg-[#4B1E25] hover:bg-[#4B1E25]/90 text-[#F5E4DA]">
              <Link to="/brands">Browse Brands</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {favoriteBrands.map(brand => (
          <Card key={brand.id} className="bg-[#E6C5B6] hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <Link to={`/brands/${brand.id}`} className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={brand.avatar_url || undefined} alt={brand.company_name} />
                  <AvatarFallback className="bg-[#4B1E25] text-[#F5E4DA]">
                    {getInitials(brand.company_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-[#4B1E25] line-clamp-1 hover:text-[#4B1E25]/80 transition-colors">
                    {brand.company_name}
                  </h3>
                  {brand.description && (
                    <p className="text-sm text-[#4B1E25]/60 line-clamp-1">
                      {brand.description}
                    </p>
                  )}
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (!user) return null;

  return (
    <div className="bg-[#F5E4DA]">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Featured Brands Section - 30% */}
          <div className="md:col-span-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1C1C1C] header-text">Featured Brands</h2>
              <Button variant="link" className="text-[#4B1E25] hover:text-[#4B1E25]/80 font-medium subheading-text" asChild>
                <Link to="/dashboard/shopper/my-favorites">View All</Link>
              </Button>
            </div>
            <BrandsList />
          </div>

          {/* Events Section - 70% */}
          <div className="md:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1C1C1C] header-text">Events You're Attending</h2>
              <Button variant="link" className="text-[#4B1E25] hover:text-[#4B1E25]/80 font-medium subheading-text" asChild>
                <Link to="/dashboard/shopper/my-exhibitions">View All</Link>
              </Button>
            </div>
            <EventSlider />
          </div>
        </div>
      </div>
    </div>
  );
}; 