import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, MapPin, Calendar, Users, FileText, 
  Image as ImageIcon, Clock, Ticket, ArrowLeft, 
  Mail, Globe, Share2, Bookmark, ExternalLink, ChevronRight
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database } from '@/types/supabase';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

type Tables = Database['public']['Tables'];

interface Brand {
  id: string;
  user_metadata: {
    company_name: string;
    logo_url?: string;
    description?: string;
    full_name?: string;
    phone?: string;
    website_url?: string;
  };
  email: string;
}

interface Exhibition {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  status: string;
  description?: string;
  banner_url?: string;
  venue_name?: string;
  ticket_price?: number;
  ticket_currency?: string;
}

interface LookBook {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
}

interface GalleryItem {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
}

type ExhibitionWithDetails = Tables['exhibitions']['Row'];
type ExhibitionApplication = {
  exhibition_id: string;
  exhibitions: ExhibitionWithDetails;
};

const BrandPortfolio = () => {
  const { brandId } = useParams();

  const { data: brand, isLoading: isLoadingBrand } = useQuery({
    queryKey: ['brand', brandId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, company_name, avatar_url, role, description, website_url')
          .eq('id', brandId)
          .eq('role', 'brand')
          .single();

        if (error) throw error;
        
        // Convert the profile to the Brand format
        return {
          id: data.id,
          email: data.email,
          user_metadata: {
            company_name: data.company_name || 'Brand Name',
            logo_url: data.avatar_url,
            description: data.description || '',
            full_name: data.full_name,
            website_url: data.website_url
          }
        } as Brand;
      } catch (err) {
        console.error('Error fetching brand:', err);
        throw err;
      }
    }
  });

  const { data: exhibitions, isLoading: isLoadingExhibitions } = useQuery({
    queryKey: ['brand-exhibitions', brandId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('exhibition_applications')
          .select('exhibition_id, exhibitions(*)')
          .eq('brand_id', brandId)
          .eq('status', 'approved');

        // Handle 404 error (table doesn't exist)
        if (error && error.code === '404') {
          console.warn('exhibition_applications table not found, returning empty array');
          return [];
        }

        if (error) throw error;
        
        return ((data as unknown) as ExhibitionApplication[]).map(app => app.exhibitions as unknown as Exhibition);
      } catch (err) {
        console.error('Error fetching exhibitions:', err);
        // Return empty array on error
        return [];
      }
    }
  });

  const { data: lookBooks, isLoading: isLoadingLookBooks } = useQuery({
    queryKey: ['brand-lookbooks', brandId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('brand_lookbooks')
          .select('*')
          .eq('brand_id', brandId);

        // Handle 404 error (table doesn't exist)
        if (error && error.code === '404') {
          console.warn('brand_lookbooks table not found, returning empty array');
          return [];
        }

        if (error) throw error;
        return data as LookBook[];
      } catch (err) {
        console.error('Error fetching lookbooks:', err);
        return [];
      }
    }
  });

  const { data: gallery, isLoading: isLoadingGallery } = useQuery({
    queryKey: ['brand-gallery', brandId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('brand_gallery')
          .select('*')
          .eq('brand_id', brandId);

        // Handle 404 error (table doesn't exist)  
        if (error && error.code === '404') {
          console.warn('brand_gallery table not found, returning empty array');
          return [];
        }

        if (error) throw error;
        return data as GalleryItem[];
      } catch (err) {
        console.error('Error fetching gallery:', err);
        return [];
      }
    }
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  if (isLoadingBrand || isLoadingExhibitions || isLoadingLookBooks || isLoadingGallery) {
    return (
      <div className="flex items-center justify-center py-20 bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading brand details...</p>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="bg-gray-50 flex items-center justify-center py-20">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm max-w-md">
          <Users className="h-16 w-16 text-primary/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Brand Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The brand you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/brands">Back to All Brands</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Breadcrumb Navigation - replacing the sticky header */}
      <div className="bg-white border-b">
        <div className="container mx-auto py-4 px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="mr-2">
              <Link to="/brands">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <Link to="/brands" className="text-sm text-muted-foreground hover:text-primary">Brands</Link>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm font-medium truncate">{brand.user_metadata.company_name}</span>
          </div>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/90 to-primary text-white">
        <div className="container mx-auto py-12 px-4">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-white/30 shadow-lg">
                <AvatarImage src={brand.user_metadata.logo_url} alt={brand.user_metadata.company_name} className="object-cover" />
                <AvatarFallback className="text-4xl bg-white/20">
                  {getInitials(brand.user_metadata.company_name)}
                </AvatarFallback>
              </Avatar>
              <Badge variant="outline" className="absolute -bottom-2 right-0 bg-white/20 backdrop-blur-sm border-0 text-white">
                Verified Brand
              </Badge>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold">{brand.user_metadata.company_name}</h1>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Badge variant="outline" className="bg-white/20 backdrop-blur-sm border-0">
                    <Calendar className="h-3 w-3 mr-1" /> {exhibitions?.length || 0} {exhibitions?.length === 1 ? 'Event' : 'Events'}
                  </Badge>
                  <Badge variant="outline" className="bg-white/20 backdrop-blur-sm border-0">
                    <FileText className="h-3 w-3 mr-1" /> {lookBooks?.length || 0} Lookbook{lookBooks?.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
              <p className="text-white/80 mb-6 max-w-2xl">
                {brand.user_metadata.description || 'An innovative brand showcasing unique products and collections'}
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Button variant="outline" className="bg-white text-primary border-0 hover:bg-white/90 hover:text-primary">
                  <Mail className="h-4 w-4 mr-2" /> Contact
                </Button>
                {brand.user_metadata.website_url && (
                  <Button variant="outline" asChild className="bg-white/20 backdrop-blur-sm text-white border-0 hover:bg-white/30">
                    <a href={brand.user_metadata.website_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" /> Website
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="icon" className="bg-white/20 backdrop-blur-sm text-white border-0 hover:bg-white/30">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="bg-white/20 backdrop-blur-sm text-white border-0 hover:bg-white/30">
                  <Bookmark className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Exhibitions</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{exhibitions?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {exhibitions?.length === 1 ? 'event' : 'events'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Look Books</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{lookBooks?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Published</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Gallery Items</CardTitle>
              <ImageIcon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{gallery?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Showcased</p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-12">
          <Tabs defaultValue="exhibitions" className="w-full">
            <TabsList className="w-full border-b rounded-none h-14 bg-white p-0">
              <div className="container flex gap-4 px-2">
                <TabsTrigger 
                  value="exhibitions" 
                  className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent px-4 pb-4 pt-3 rounded-none"
                >
                  Exhibitions
                </TabsTrigger>
                <TabsTrigger 
                  value="gallery"
                  className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent px-4 pb-4 pt-3 rounded-none"
                >
                  Gallery
                </TabsTrigger>
                <TabsTrigger 
                  value="lookbooks"
                  className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent px-4 pb-4 pt-3 rounded-none"
                >
                  Look Books
                </TabsTrigger>
              </div>
            </TabsList>

            <div className="container py-8">
              <TabsContent value="exhibitions" className="m-0 space-y-6">
                {exhibitions?.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Calendar className="h-12 w-12 text-primary/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No exhibitions yet</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      This brand hasn't participated in any exhibitions yet.
                    </p>
                  </div>
                )}
                
                {exhibitions?.map((exhibition) => (
                  <Card key={exhibition.id} className="overflow-hidden border-0 shadow-sm">
                    <div className="md:flex">
                      {exhibition.banner_url ? (
                        <div className="md:w-1/3 h-48 md:h-auto relative">
                          <img 
                            src={exhibition.banner_url} 
                            alt={exhibition.name} 
                            className="w-full h-full object-cover"
                          />
                          <Badge 
                            variant={exhibition.status === 'active' ? 'default' : 'secondary'}
                            className="absolute top-4 left-4"
                          >
                            {exhibition.status}
                          </Badge>
                        </div>
                      ) : (
                        <div className="md:w-1/3 h-48 md:h-auto bg-gray-100 flex items-center justify-center relative">
                          <Calendar className="h-12 w-12 text-gray-300" />
                          <Badge 
                            variant={exhibition.status === 'active' ? 'default' : 'secondary'}
                            className="absolute top-4 left-4"
                          >
                            {exhibition.status}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="p-6 md:w-2/3">
                        <h3 className="text-xl font-semibold mb-3">{exhibition.name}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="text-sm">
                              {new Date(exhibition.start_date).toLocaleDateString()} - {new Date(exhibition.end_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="text-sm">{exhibition.venue_name || exhibition.location}</span>
                          </div>
                          {exhibition.ticket_price !== undefined && (
                            <div className="flex items-center gap-2">
                              <Ticket className="h-4 w-4 text-primary" />
                              <span className="text-sm">
                                {exhibition.ticket_currency || '₹'}{exhibition.ticket_price}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {exhibition.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {exhibition.description}
                          </p>
                        )}
                        
                        <Button size="sm" className="gap-1">
                          View Details <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="gallery" className="m-0 space-y-6">
                {gallery?.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <ImageIcon className="h-12 w-12 text-primary/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No gallery items</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      This brand hasn't added any gallery items yet.
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {gallery?.map((item) => (
                    <Card key={item.id} className="overflow-hidden border-0 shadow-sm group cursor-pointer">
                      <div className="aspect-square relative">
                        <img
                          src={item.image_url}
                          alt={item.title || 'Gallery image'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        {(item.title || item.description) && (
                          <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            {item.title && <h3 className="font-semibold mb-1 text-white">{item.title}</h3>}
                            {item.description && (
                              <p className="text-sm text-white/90 line-clamp-2">{item.description}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="lookbooks" className="m-0 space-y-6">
                {lookBooks?.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <FileText className="h-12 w-12 text-primary/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No look books</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      This brand hasn't published any look books yet.
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {lookBooks?.map((lookBook) => (
                    <Card key={lookBook.id} className="overflow-hidden border-0 shadow-sm group cursor-pointer">
                      <CardContent className="p-0">
                        <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative">
                          {lookBook.file_type.startsWith('image/') ? (
                            <img
                              src={lookBook.file_url}
                              alt={lookBook.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="h-12 w-12 text-gray-300" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                            {lookBook.title}
                          </h3>
                          {lookBook.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {lookBook.description}
                            </p>
                          )}
                          <Button variant="ghost" size="sm" className="mt-2 text-xs pl-0 hover:pl-2 transition-all">
                            View Details <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
                
        {/* Footer CTA */}
        <div className="bg-primary/5 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Want to collaborate with {brand.user_metadata.company_name}?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Reach out to discuss partnership opportunities and exhibition collaborations
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button>Contact Brand</Button>
            <Button variant="outline">Schedule Meeting</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandPortfolio; 