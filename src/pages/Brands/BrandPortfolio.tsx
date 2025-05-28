import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, MapPin, Calendar, Users, FileText, 
  Image as ImageIcon, Clock, Ticket, ArrowLeft, 
  Mail, Globe, Share2, Bookmark, ExternalLink, ChevronRight, Store, Phone, Instagram,
  Building2, Briefcase, Award, CheckCircle2, XCircle, AlertCircle, Facebook, Twitter, Linkedin, Heart
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database } from '@/types/supabase';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { useBrandFavorite } from '@/hooks/useBrandFavorite';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
    instagram_url?: string;
    facebook_url?: string;
    twitter_url?: string;
    linkedin_url?: string;
    about?: string;
  };
  email: string;
  isFavorite: boolean;
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

interface StallWithExhibition {
  exhibition_id: string;
  exhibitions: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    address: string;
    city: string;
    state: string;
    country: string;
    status: string;
    description?: string;
    banner_url?: string;
  };
}

const BrandPortfolio = () => {
  const { brandId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const { toggleFavorite, isSubmitting } = useBrandFavorite(brandId || '');
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: ''
  });
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '',
    purpose: ''
  });

  const { data: brand, isLoading: isLoadingBrand } = useQuery({
    queryKey: ['brand', brandId],
    queryFn: async () => {
      try {
        console.log('Fetching brand data for ID:', brandId);
        // First, get the brand profile
        const { data, error } = await supabase
          .from('brand_profiles')
          .select('*, user_id')
          .eq('id', brandId)
          .single();

        if (error) {
          console.error('Error fetching brand profile:', error);
          throw error;
        }
        
        console.log('Brand profile data:', data);
        
        // Check if we need to migrate materials to dedicated tables
        if (data.materials && Array.isArray(data.materials)) {
          console.log('Found materials to migrate:', data.materials);
          // Migrate lookbooks
          const lookbooks = data.materials.filter(item => item && typeof item === 'object' && item.type === 'lookbook');
          if (lookbooks.length > 0) {
            const { error: lookbooksError } = await supabase
              .from('brand_lookbooks')
              .upsert(
                lookbooks.map(item => ({
                  brand_id: data.user_id,
                  title: item.title || 'Untitled Lookbook',
                  description: item.description,
                  file_url: item.file_url,
                  file_type: item.file_type || 'pdf'
                }))
              );
            
            if (lookbooksError) {
              console.error('Error migrating lookbooks:', lookbooksError);
            }
          }

          // Migrate gallery items
          const galleryItems = data.materials.filter(item => item && typeof item === 'object' && item.type === 'gallery');
          if (galleryItems.length > 0) {
            const { error: galleryError } = await supabase
              .from('brand_gallery')
              .upsert(
                galleryItems.map(item => ({
                  brand_id: data.user_id,
                  title: item.title,
                  description: item.description,
                  image_url: item.file_url
                }))
              );
            
            if (galleryError) {
              console.error('Error migrating gallery items:', galleryError);
            }
          }

          // Clear the materials field after migration
          const { error: clearError } = await supabase
            .from('brand_profiles')
            .update({ materials: [] })
            .eq('id', brandId);

          if (clearError) {
            console.error('Error clearing materials field:', clearError);
          }
        }
        
        // If user is logged in, check if brand is favorited
        let isFavorite = false;
        if (user) {
          const { data: favoriteData } = await supabase
            .from('brand_favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('brand_id', brandId)
            .single();
          
          isFavorite = !!favoriteData;
        }
        
        // Convert the profile to the Brand format
        return {
          id: data.id,
          email: data.contact_email,
          user_id: data.user_id,
          user_metadata: {
            company_name: data.company_name || 'Brand Name',
            logo_url: data.logo_url,
            description: data.description || '',
            full_name: data.full_name,
            website_url: data.website,
            phone: data.contact_phone,
            instagram_url: data.instagram_url,
            facebook_url: data.facebook_url,
            twitter_url: data.twitter_url,
            linkedin_url: data.linkedin_url
          },
          isFavorite
        } as Brand & { user_id: string };
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
        console.log('Fetching exhibitions for brand:', brandId);
        const { data: applications, error: applicationsError } = await supabase
          .from('stall_applications')
          .select(`
            exhibition_id,
            exhibitions:exhibition_id (
              id,
              title,
              start_date,
              end_date,
              address,
              city,
              state,
              country,
              status,
              description,
              banner_url
            )
          `)
          .eq('brand_id', brand?.user_id);

        if (applicationsError) {
          console.error('Error fetching stall applications:', applicationsError);
          throw applicationsError;
        }
        
        console.log('Raw stall applications data:', applications);
        
        // Transform the data to match the Exhibition interface
        const transformedData = ((applications || []) as unknown as StallWithExhibition[])
          .filter(item => item.exhibitions) // Filter out any null exhibitions
          .map(item => ({
            id: item.exhibitions.id,
            name: item.exhibitions.title,
            start_date: item.exhibitions.start_date,
            end_date: item.exhibitions.end_date,
            location: `${item.exhibitions.city}, ${item.exhibitions.state}, ${item.exhibitions.country}`,
            status: item.exhibitions.status,
            description: item.exhibitions.description,
            banner_url: item.exhibitions.banner_url,
            venue_name: item.exhibitions.address,
            ticket_price: null,
            ticket_currency: null
          }));

        console.log('Transformed exhibitions data:', transformedData);
        return transformedData as Exhibition[];
      } catch (err) {
        console.error('Error in exhibitions query:', err);
        return [];
      }
    },
    enabled: !!brand?.user_id
  });

  const { data: lookBooks, isLoading: isLoadingLookBooks } = useQuery({
    queryKey: ['brand-lookbooks', brandId],
    queryFn: async () => {
      try {
        console.log('Fetching lookbooks for brand:', brand?.user_id);
        const { data, error } = await supabase
          .from('brand_lookbooks')
          .select('*')
          .eq('brand_id', brand?.user_id);

        if (error) {
          console.error('Error fetching lookbooks:', error);
          throw error;
        }

        console.log('Raw lookbooks data:', data);
        
        // Transform the data to match the LookBook interface
        const lookbookItems = (data || []).map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          file_url: item.file_url,
          file_type: item.file_type
        }));

        console.log('Transformed lookbooks data:', lookbookItems);
        return lookbookItems as LookBook[];
      } catch (err) {
        console.error('Error in lookbooks query:', err);
        return [];
      }
    },
    enabled: !!brand?.user_id
  });

  const { data: gallery, isLoading: isLoadingGallery } = useQuery({
    queryKey: ['brand-gallery', brandId],
    queryFn: async () => {
      try {
        console.log('Fetching gallery for brand:', brand?.user_id);
        const { data, error } = await supabase
          .from('brand_gallery')
          .select('*')
          .eq('brand_id', brand?.user_id);

        if (error) {
          console.error('Error fetching gallery:', error);
          throw error;
        }

        console.log('Raw gallery data:', data);
        
        // Transform the data to match the GalleryItem interface
        const galleryItems = (data || []).map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          image_url: item.image_url
        }));

        console.log('Transformed gallery data:', galleryItems);
        return galleryItems as GalleryItem[];
      } catch (err) {
        console.error('Error in gallery query:', err);
        return [];
      }
    },
    enabled: !!brand?.user_id
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `${brand?.user_metadata.company_name} - Brand Profile`,
        text: brand?.user_metadata.description || 'Check out this brand on Exhibae',
        url: window.location.href
      });
    } catch (error) {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied to clipboard',
        description: 'You can now share this brand profile with others'
      });
    }
  };

  const handleContact = () => {
    if (!contactForm.subject || !contactForm.message) {
      toast({
        title: 'Please fill in all fields',
        description: 'Both subject and message are required',
        variant: 'destructive'
      });
      return;
    }

    // TODO: Implement contact functionality
    toast({
      title: 'Message sent',
      description: 'The brand will get back to you soon'
    });
    setContactForm({ subject: '', message: '' });
    setIsContactDialogOpen(false);
  };

  const handleSchedule = () => {
    if (!scheduleForm.date || !scheduleForm.time || !scheduleForm.purpose) {
      toast({
        title: 'Please fill in all fields',
        description: 'All fields are required',
        variant: 'destructive'
      });
      return;
    }

    // TODO: Implement scheduling functionality
    toast({
      title: 'Meeting request sent',
      description: 'The brand will confirm your meeting request soon'
    });
    setScheduleForm({ date: '', time: '', purpose: '' });
    setIsScheduleDialogOpen(false);
  };

  if (isLoadingBrand) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Brand Not Found</h1>
        <p className="text-muted-foreground mb-6">The brand you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/brands">Browse Brands</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5E4DA]">
      {/* Hero Section with Brand Info */}
      <div className="bg-[#F5E4DA] border-b border-[#4B1E25]/10">
        <div className="container mx-auto py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Brand Logo and Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#F5E4DA] rounded-xl border border-[#4B1E25]/10 p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <Avatar className="h-32 w-32 border-4 border-white shadow-lg ring-2 ring-[#4B1E25]/10">
                      <AvatarImage src={brand.user_metadata.logo_url} />
                      <AvatarFallback className="text-4xl bg-[#F5E4DA] text-[#4B1E25]">
                        {getInitials(brand.user_metadata.company_name)}
                      </AvatarFallback>
                    </Avatar>
                    {brand.user_metadata.full_name && (
                      <div className="absolute -bottom-2 -right-2 bg-[#F5E4DA] rounded-full p-1 shadow-md border border-[#4B1E25]/10">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold text-[#4B1E25]">
                      {brand.user_metadata.company_name}
                    </h1>
                    {brand.user_metadata.full_name && (
                      <Badge variant="outline" className="bg-[#F5E4DA] text-[#4B1E25] border-[#4B1E25]/10">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-[#4B1E25]/80 mb-4">{brand.user_metadata.description}</p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleShare} className="border-[#4B1E25] text-[#4B1E25] hover:bg-[#4B1E25] hover:text-[#F5E4DA]">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline" onClick={() => toggleFavorite()} disabled={isSubmitting} className="border-[#4B1E25] text-[#4B1E25] hover:bg-[#4B1E25] hover:text-[#F5E4DA]">
                      <Heart className={`h-4 w-4 mr-2 ${brand.isFavorite ? 'fill-[#4B1E25] text-[#4B1E25]' : ''}`} />
                      {isSubmitting ? 'Saving...' : brand.isFavorite ? 'Saved' : 'Save'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <Card className="border-[#4B1E25]/10">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#F5E4DA] rounded-lg p-4 border border-[#4B1E25]/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Store className="h-4 w-4 text-[#4B1E25]" />
                        <span className="text-sm font-medium text-[#4B1E25]">Exhibitions</span>
                      </div>
                      <p className="text-2xl font-bold text-[#4B1E25]">{exhibitions?.length || 0}</p>
                    </div>
                    <div className="bg-[#F5E4DA] rounded-lg p-4 border border-[#4B1E25]/10">
                      <div className="flex items-center gap-2 mb-1">
                        <ImageIcon className="h-4 w-4 text-[#4B1E25]" />
                        <span className="text-sm font-medium text-[#4B1E25]">Gallery</span>
                      </div>
                      <p className="text-2xl font-bold text-[#4B1E25]">{gallery?.length || 0}</p>
                    </div>
                    <div className="bg-[#F5E4DA] rounded-lg p-4 border border-[#4B1E25]/10">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-[#4B1E25]" />
                        <span className="text-sm font-medium text-[#4B1E25]">Look Books</span>
                      </div>
                      <p className="text-2xl font-bold text-[#4B1E25]">{lookBooks?.length || 0}</p>
                    </div>
                    <div className="bg-[#F5E4DA] rounded-lg p-4 border border-[#4B1E25]/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-[#4B1E25]" />
                        <span className="text-sm font-medium text-[#4B1E25]">Followers</span>
                      </div>
                      <p className="text-2xl font-bold text-[#4B1E25]">0</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* About Section */}
              <Card className="border-[#4B1E25]/10">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-[#4B1E25]">
                    <Building2 className="h-5 w-5 text-[#4B1E25]" />
                    About
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-[#4B1E25]/80 whitespace-pre-line">
                      {brand.user_metadata.about || brand.user_metadata.description || 'No description available.'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Social Media Links */}
              <Card className="border-[#4B1E25]/10">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-[#4B1E25]">
                    <Share2 className="h-5 w-5 text-[#4B1E25]" />
                    Social Media
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {brand.user_metadata.instagram_url && (
                      <a
                        href={brand.user_metadata.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#4B1E25] hover:text-[#F5E4DA] transition-colors border border-[#4B1E25]/10"
                      >
                        <Instagram className="h-5 w-5" />
                        <span className="text-sm font-medium">Instagram</span>
                      </a>
                    )}
                    {brand.user_metadata.facebook_url && (
                      <a
                        href={brand.user_metadata.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#4B1E25] hover:text-[#F5E4DA] transition-colors border border-[#4B1E25]/10"
                      >
                        <Facebook className="h-5 w-5" />
                        <span className="text-sm font-medium">Facebook</span>
                      </a>
                    )}
                    {brand.user_metadata.twitter_url && (
                      <a
                        href={brand.user_metadata.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#4B1E25] hover:text-[#F5E4DA] transition-colors border border-[#4B1E25]/10"
                      >
                        <Twitter className="h-5 w-5" />
                        <span className="text-sm font-medium">Twitter</span>
                      </a>
                    )}
                    {brand.user_metadata.linkedin_url && (
                      <a
                        href={brand.user_metadata.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#4B1E25] hover:text-[#F5E4DA] transition-colors border border-[#4B1E25]/10"
                      >
                        <Linkedin className="h-5 w-5" />
                        <span className="text-sm font-medium">LinkedIn</span>
                      </a>
                    )}
                    {!brand.user_metadata.instagram_url && 
                     !brand.user_metadata.facebook_url && 
                     !brand.user_metadata.twitter_url && 
                     !brand.user_metadata.linkedin_url && (
                      <div className="col-span-2 flex items-center gap-2 p-3 text-[#4B1E25]/60 bg-[#F5E4DA] rounded-lg border border-[#4B1E25]/10">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm">No social media links available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information Card */}
              <Card className="border-[#4B1E25]/10">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-[#4B1E25]">
                    <Mail className="h-5 w-5 text-[#4B1E25]" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {brand.user_metadata.website_url && (
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#4B1E25] hover:text-[#F5E4DA] transition-colors border border-[#4B1E25]/10">
                      <Globe className="h-5 w-5" />
                      <a 
                        href={brand.user_metadata.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:text-[#F5E4DA] flex items-center gap-1"
                      >
                        {brand.user_metadata.website_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {brand.user_metadata.phone && (
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#4B1E25] hover:text-[#F5E4DA] transition-colors border border-[#4B1E25]/10">
                      <Phone className="h-5 w-5" />
                      <a href={`tel:${brand.user_metadata.phone}`} className="text-sm hover:text-[#F5E4DA]">
                        {brand.user_metadata.phone}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Exhibitions */}
              <Card className="border-[#4B1E25]/10">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-[#4B1E25]">
                    <Store className="h-5 w-5 text-[#4B1E25]" />
                    Exhibitions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Ongoing Exhibitions */}
                    <div>
                      <h3 className="text-[#4B1E25] font-medium mb-4">Ongoing Exhibitions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {exhibitions?.filter(exhibition => {
                          const now = new Date();
                          const start = new Date(exhibition.start_date);
                          const end = new Date(exhibition.end_date);
                          return start <= now && now <= end;
                        }).map(exhibition => (
                          <Card key={exhibition.id} className="border-[#4B1E25]/10 hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <h4 className="text-lg font-medium text-[#4B1E25] mb-2">{exhibition.name}</h4>
                              <p className="text-[#4B1E25]/80 mb-4">{exhibition.description}</p>
                              <Button asChild className="w-full bg-[#4B1E25] hover:bg-[#4B1E25]/90 text-[#F5E4DA]">
                                <Link to={`/exhibitions/${exhibition.id}`}>
                                  View Exhibition Details
                                  <ChevronRight className="h-4 w-4 ml-2" />
                                </Link>
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                        {exhibitions?.filter(exhibition => {
                          const now = new Date();
                          const start = new Date(exhibition.start_date);
                          const end = new Date(exhibition.end_date);
                          return start <= now && now <= end;
                        }).length === 0 && (
                          <Card className="border-[#4B1E25]/10 bg-[#F5E4DA]">
                            <CardContent className="py-6 text-center">
                              <p className="text-[#4B1E25]/60">No ongoing exhibitions</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>

                    {/* Upcoming Exhibitions */}
                    <div>
                      <h3 className="text-[#4B1E25] font-medium mb-4">Upcoming Exhibitions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {exhibitions?.filter(exhibition => {
                          const now = new Date();
                          const start = new Date(exhibition.start_date);
                          return start > now;
                        }).map(exhibition => (
                          <Card key={exhibition.id} className="border-[#4B1E25]/10 hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <h4 className="text-lg font-medium text-[#4B1E25] mb-2">{exhibition.name}</h4>
                              <p className="text-[#4B1E25]/80 mb-4">{exhibition.description}</p>
                              <Button asChild className="w-full bg-[#4B1E25] hover:bg-[#4B1E25]/90 text-[#F5E4DA]">
                                <Link to={`/exhibitions/${exhibition.id}`}>
                                  View Exhibition Details
                                  <ChevronRight className="h-4 w-4 ml-2" />
                                </Link>
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                        {exhibitions?.filter(exhibition => {
                          const now = new Date();
                          const start = new Date(exhibition.start_date);
                          return start > now;
                        }).length === 0 && (
                          <Card className="border-[#4B1E25]/10 bg-[#F5E4DA]">
                            <CardContent className="py-6 text-center">
                              <p className="text-[#4B1E25]/60">No upcoming exhibitions</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gallery */}
              <Card className="border-[#4B1E25]/10">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-[#4B1E25]">
                    <ImageIcon className="h-5 w-5 text-[#4B1E25]" />
                    Gallery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {gallery && gallery.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {gallery.map((item) => (
                        <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden border border-[#4B1E25]/10">
                          <img
                            src={item.image_url}
                            alt={item.title || 'Gallery image'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-[#4B1E25]/60">No gallery images available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact {brand.user_metadata.company_name}</DialogTitle>
            <DialogDescription>
              Send a message to the brand. They will receive your message via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={contactForm.subject}
                onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter subject"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={contactForm.message}
                onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter your message"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleContact}>
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Meeting Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule a Meeting</DialogTitle>
            <DialogDescription>
              Request a meeting with {brand.user_metadata.company_name}. They will review your request and get back to you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={scheduleForm.date}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Time</label>
              <Input
                type="time"
                value={scheduleForm.time}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Purpose</label>
              <Textarea
                value={scheduleForm.purpose}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, purpose: e.target.value }))}
                placeholder="Briefly describe the purpose of the meeting"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSchedule}>
              Request Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrandPortfolio; 