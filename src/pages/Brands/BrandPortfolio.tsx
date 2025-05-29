import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Share, Heart, Image, BookOpen, Building2, MapPin, Instagram, Facebook, Globe, Phone } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface BrandProfile {
  id: string;
  user_id: string;
  company_name: string;
  description: string | null;
  location?: string;
  website: string | null;
  contact_email: string;
  contact_phone: string | null;
  logo_url: string | null;
  created_at: string;
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  cover_image_url?: string;
}

interface GalleryImage {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  created_at: string;
}

interface Lookbook {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  created_at: string;
}

interface Stats {
  exhibitions_count: number;
  gallery_count: number;
  lookbooks_count: number;
  favorites_count: number;
}

const BrandPortfolio = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: brand, isLoading: isLoadingBrand, error: brandError } = useQuery({
    queryKey: ['brand', brandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('id', brandId)
        .single();

      if (error) throw error;
      return data as BrandProfile;
    },
  });

  const { data: stats, error: statsError } = useQuery({
    queryKey: ['brand-stats', brandId],
    queryFn: async () => {
      if (!brand?.user_id) return null;
      
      const [galleryResult, lookbooksResult, favoritesResult] = await Promise.all([
        supabase
          .from('brand_gallery')
          .select('*', { count: 'exact' })
          .eq('brand_id', brand.user_id),
        supabase
          .from('brand_lookbooks')
          .select('*', { count: 'exact' })
          .eq('brand_id', brand.user_id),
        supabase
          .from('brand_favorites')
          .select('*', { count: 'exact' })
          .eq('brand_id', brand.user_id)
      ]);

      return {
        exhibitions_count: 0,
        gallery_count: galleryResult.count || 0,
        lookbooks_count: lookbooksResult.count || 0,
        favorites_count: favoritesResult.count || 0
      };
    },
    enabled: !!brandId && !!brand?.user_id
  });

  const { data: galleryImages, error: galleryError } = useQuery({
    queryKey: ['brand-gallery', brandId],
    queryFn: async () => {
      if (!brand?.user_id) return [];
      const { data, error } = await supabase
        .from('brand_gallery')
        .select('*')
        .eq('brand_id', brand.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GalleryImage[];
    },
    enabled: !!brandId && !!brand?.user_id,
  });

  const { data: lookbooks, error: lookbooksError } = useQuery({
    queryKey: ['brand-lookbooks', brandId],
    queryFn: async () => {
      if (!brand?.user_id) return [];
      const { data, error } = await supabase
        .from('brand_lookbooks')
        .select('*')
        .eq('brand_id', brand.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Lookbook[];
    },
    enabled: !!brandId && !!brand?.user_id,
  });

  const { data: isFavorited } = useQuery({
    queryKey: ['brand-favorite', brandId, user?.id],
    queryFn: async () => {
      if (!user || !brand?.user_id) return false;
      
      const { data, error } = await supabase
        .from('brand_favorites')
        .select('id')
        .eq('brand_id', brand.user_id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return false;
        throw error;
      }
      return !!data;
    },
    enabled: !!brandId && !!user && !!brand?.user_id
  });

  const { mutate: toggleFavorite } = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in to favorite');
      
      if (isFavorited) {
        const { error } = await supabase
          .from('brand_favorites')
          .delete()
          .eq('brand_id', brand?.user_id)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('brand_favorites')
          .insert([{ brand_id: brand?.user_id, user_id: user.id }]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-favorite', brandId] });
      queryClient.invalidateQueries({ queryKey: ['brand-stats', brandId] });
      toast({
        title: isFavorited ? 'Removed from favorites' : 'Added to favorites',
        duration: 2000,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update favorites. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleFavorite = () => {
    if (!user) {
      toast({
        title: 'Please log in',
        description: 'You must be logged in to favorite brands',
        variant: 'destructive',
      });
      return;
    }
    toggleFavorite();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: brand?.company_name,
        text: brand?.description,
        url: window.location.href,
      });
    }
  };

  if (isLoadingBrand) {
    return (
      <div className="min-h-screen bg-[#F5E4DA] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-32 h-32 bg-white rounded-full mb-4" />
          <div className="h-6 w-48 bg-white rounded mb-2" />
          <div className="h-4 w-64 bg-white rounded" />
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-[#F5E4DA] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#4B1E25] mb-2">Brand Not Found</h1>
          <p className="text-[#4B1E25]/70">The brand you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  if (brandError || statsError || galleryError || lookbooksError) {
    const error = brandError || statsError || galleryError || lookbooksError;
    return (
      <div className="min-h-screen bg-[#F5E4DA] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#4B1E25] mb-2">Error Loading Data</h1>
          <p className="text-[#4B1E25]/70">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5E4DA]">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-10 gap-8">
          {/* Left Column - 30% */}
          <div className="md:col-span-3 space-y-6">
            {/* Brand Profile */}
            <div className="text-center">
              <Avatar className="w-32 h-32 mx-auto mb-4 bg-white">
                <AvatarImage src={brand.logo_url || undefined} alt={brand.company_name} />
                <AvatarFallback className="text-4xl bg-white">{getInitials(brand.company_name)}</AvatarFallback>
              </Avatar>
              <h1 className="text-2xl font-bold text-[#4B1E25] mb-2">{brand.company_name}</h1>
              {brand.location && (
                <p className="text-sm text-[#4B1E25]/70 mb-3 flex items-center justify-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {brand.location}
                </p>
              )}
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button 
                  variant={isFavorited ? "default" : "outline"} 
                  size="sm" 
                  onClick={handleFavorite}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                  {isFavorited ? 'Favorited' : 'Favorite'}
                </Button>
              </div>
            </div>

            {/* About Section */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <h2 className="font-semibold text-[#4B1E25] mb-3">About</h2>
                <p className="text-[#4B1E25]/70 text-sm">{brand.description}</p>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <h2 className="font-semibold text-[#4B1E25] mb-3">Social Media</h2>
                <div className="space-y-2">
                  {brand.instagram_url && (
                    <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                      <a href={brand.instagram_url} target="_blank" rel="noopener noreferrer">
                        <Instagram className="w-4 h-4 mr-2" />
                        Instagram
                      </a>
                    </Button>
                  )}
                  {brand.facebook_url && (
                    <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                      <a href={brand.facebook_url} target="_blank" rel="noopener noreferrer">
                        <Facebook className="w-4 h-4 mr-2" />
                        Facebook
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <h2 className="font-semibold text-[#4B1E25] mb-3">Contact Information</h2>
                <div className="space-y-3">
                  {brand.website && (
                    <a href={brand.website} target="_blank" rel="noopener noreferrer" 
                       className="flex items-center text-sm text-[#4B1E25]/70 hover:text-[#4B1E25]">
                      <Globe className="w-4 h-4 mr-2" />
                      {brand.website}
                    </a>
                  )}
                  {brand.contact_phone && (
                    <a href={`tel:${brand.contact_phone}`} 
                       className="flex items-center text-sm text-[#4B1E25]/70 hover:text-[#4B1E25]">
                      <Phone className="w-4 h-4 mr-2" />
                      {brand.contact_phone}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 70% */}
          <div className="md:col-span-7 space-y-6">
            {/* Quick Stats */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <Building2 className="w-6 h-6 mx-auto mb-2 text-[#4B1E25]" />
                    <p className="text-2xl font-bold text-[#4B1E25]">{stats?.exhibitions_count || 0}</p>
                    <p className="text-sm text-[#4B1E25]/70">Exhibitions</p>
                  </div>
                  <div className="text-center">
                    <Image className="w-6 h-6 mx-auto mb-2 text-[#4B1E25]" />
                    <p className="text-2xl font-bold text-[#4B1E25]">{stats?.gallery_count || 0}</p>
                    <p className="text-sm text-[#4B1E25]/70">Gallery</p>
                  </div>
                  <div className="text-center">
                    <BookOpen className="w-6 h-6 mx-auto mb-2 text-[#4B1E25]" />
                    <p className="text-2xl font-bold text-[#4B1E25]">{stats?.lookbooks_count || 0}</p>
                    <p className="text-sm text-[#4B1E25]/70">Look Books</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gallery Section */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <h2 className="font-semibold text-[#4B1E25] mb-4">Gallery</h2>
                {galleryImages && galleryImages.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4">
                    {galleryImages.map((image) => (
                      <div key={image.id} className="aspect-square rounded-lg overflow-hidden">
                        <img
                          src={image.image_url}
                          alt={image.title || ''}
                          className="w-full h-full object-cover"
                        />
                        {image.title && (
                          <div className="p-2 bg-white/90 absolute bottom-0 left-0 right-0">
                            <p className="text-sm font-medium text-[#4B1E25]">{image.title}</p>
                            {image.description && (
                              <p className="text-xs text-[#4B1E25]/70">{image.description}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#F5E4DA]/50 rounded-lg p-4 text-center text-sm text-[#4B1E25]/70">
                    No images in gallery
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lookbooks Section */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <h2 className="font-semibold text-[#4B1E25] mb-4">Look Books</h2>
                {lookbooks && lookbooks.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {lookbooks.map((lookbook) => (
                      <Card key={lookbook.id} className="overflow-hidden">
                        <div className="aspect-[4/3]">
                          <img
                            src={lookbook.file_url}
                            alt={lookbook.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-medium text-[#4B1E25]">{lookbook.title}</h3>
                          {lookbook.description && (
                            <p className="text-sm text-[#4B1E25]/70 mt-1">{lookbook.description}</p>
                          )}
                          <p className="text-xs text-[#4B1E25]/50 mt-2">
                            {new Date(lookbook.created_at).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#F5E4DA]/50 rounded-lg p-4 text-center text-sm text-[#4B1E25]/70">
                    No lookbooks available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandPortfolio; 