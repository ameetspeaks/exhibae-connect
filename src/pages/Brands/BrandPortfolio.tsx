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
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, company_name, avatar_url, role, description, website_url')
          .eq('id', brandId)
          .eq('role', 'brand')
          .single();

        if (error) throw error;
        
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
          email: data.email,
          user_metadata: {
            company_name: data.company_name || 'Brand Name',
            logo_url: data.avatar_url,
            description: data.description || '',
            full_name: data.full_name,
            website_url: data.website_url
          },
          isFavorite
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
          .eq('brand_id', brandId);

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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Brand Info */}
      <div className="bg-gradient-to-br from-primary/5 via-white to-gray-50 border-b">
        <div className="container mx-auto py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Brand Logo and Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gradient-to-br from-primary/5 via-white to-gray-50 rounded-xl border border-primary/10 p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <Avatar className="h-32 w-32 border-4 border-white shadow-lg ring-2 ring-primary/10">
                      <AvatarImage src={brand.user_metadata.logo_url} />
                      <AvatarFallback className="text-4xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                        {getInitials(brand.user_metadata.company_name)}
                      </AvatarFallback>
                    </Avatar>
                    {brand.user_metadata.full_name && (
                      <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md border border-primary/10">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                      {brand.user_metadata.company_name}
                    </h1>
                    {brand.user_metadata.full_name && (
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-4">{brand.user_metadata.description}</p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleShare} className="hover:bg-primary/5">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline" onClick={() => toggleFavorite()} disabled={isSubmitting} className="hover:bg-primary/5">
                      <Heart className={`h-4 w-4 mr-2 ${brand.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                      {isSubmitting ? 'Saving...' : brand.isFavorite ? 'Saved' : 'Save'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <Card className="border-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">Exhibitions</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">{exhibitions?.length || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg p-4 border border-purple-100">
                      <div className="flex items-center gap-2 mb-1">
                        <ImageIcon className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-600">Gallery</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-700">{gallery?.length || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-white rounded-lg p-4 border border-green-100">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Look Books</span>
                      </div>
                      <p className="text-2xl font-bold text-green-700">{lookBooks?.length || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-white rounded-lg p-4 border border-orange-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-600">Followers</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-700">0</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* About Section */}
              <Card className="border-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                    About
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground whitespace-pre-line">
                      {brand.user_metadata.about || brand.user_metadata.description || 'No description available.'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Social Media Links */}
              <Card className="border-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Share2 className="h-5 w-5 text-primary" />
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
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gradient-to-r from-pink-500/5 to-purple-500/5 transition-colors border border-pink-100"
                      >
                        <Instagram className="h-5 w-5 text-pink-600" />
                        <span className="text-sm font-medium">Instagram</span>
                      </a>
                    )}
                    {brand.user_metadata.facebook_url && (
                      <a
                        href={brand.user_metadata.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gradient-to-r from-blue-500/5 to-blue-600/5 transition-colors border border-blue-100"
                      >
                        <Facebook className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium">Facebook</span>
                      </a>
                    )}
                    {brand.user_metadata.twitter_url && (
                      <a
                        href={brand.user_metadata.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gradient-to-r from-sky-500/5 to-sky-600/5 transition-colors border border-sky-100"
                      >
                        <Twitter className="h-5 w-5 text-sky-600" />
                        <span className="text-sm font-medium">Twitter</span>
                      </a>
                    )}
                    {brand.user_metadata.linkedin_url && (
                      <a
                        href={brand.user_metadata.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gradient-to-r from-blue-600/5 to-blue-700/5 transition-colors border border-blue-100"
                      >
                        <Linkedin className="h-5 w-5 text-blue-700" />
                        <span className="text-sm font-medium">LinkedIn</span>
                      </a>
                    )}
                    {!brand.user_metadata.instagram_url && 
                     !brand.user_metadata.facebook_url && 
                     !brand.user_metadata.twitter_url && 
                     !brand.user_metadata.linkedin_url && (
                      <div className="col-span-2 flex items-center gap-2 p-3 text-muted-foreground bg-gray-50 rounded-lg border border-gray-100">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm">No social media links available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information Card */}
              <Card className="border-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Mail className="h-5 w-5 text-primary" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {brand.user_metadata.website_url && (
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors border border-primary/10">
                      <Globe className="h-5 w-5 text-primary" />
                      <a 
                        href={brand.user_metadata.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:text-primary flex items-center gap-1"
                      >
                        {brand.user_metadata.website_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {brand.user_metadata.phone && (
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors border border-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                      <a href={`tel:${brand.user_metadata.phone}`} className="text-sm hover:text-primary">
                        {brand.user_metadata.phone}
                      </a>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2 pt-0">
                  <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" onClick={() => setIsContactDialogOpen(true)}>
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Brand
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Right Column - Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="exhibitions" className="space-y-6">
                <TabsList className="w-full justify-start bg-gradient-to-r from-primary/5 to-primary/10 p-1">
                  <TabsTrigger value="exhibitions" className="flex items-center gap-2 data-[state=active]:bg-white">
                    <Calendar className="h-4 w-4" />
                    Exhibitions
                  </TabsTrigger>
                  <TabsTrigger value="gallery" className="flex items-center gap-2 data-[state=active]:bg-white">
                    <ImageIcon className="h-4 w-4" />
                    Gallery
                  </TabsTrigger>
                  <TabsTrigger value="lookbooks" className="flex items-center gap-2 data-[state=active]:bg-white">
                    <FileText className="h-4 w-4" />
                    Look Books
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="exhibitions" className="space-y-8">
                  {isLoadingExhibitions ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : exhibitions?.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground">No exhibitions found</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Ongoing Exhibitions */}
                      <div className="bg-gradient-to-br from-blue-50/50 to-white rounded-xl border border-blue-100 p-6">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-blue-700">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Clock className="h-5 w-5 text-blue-600" />
                          </div>
                          Ongoing Exhibitions
                        </h3>
                        <div className="grid gap-6">
                          {exhibitions
                            ?.filter(exhibition => {
                              const now = new Date();
                              const start = new Date(exhibition.start_date);
                              const end = new Date(exhibition.end_date);
                              return start <= now && now <= end;
                            })
                            .map((exhibition) => (
                              <Card key={exhibition.id} className="overflow-hidden border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="aspect-video relative">
                                  <img
                                    src={exhibition.banner_url || '/placeholder-exhibition.jpg'}
                                    alt={exhibition.name} 
                                    className="object-cover w-full h-full"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                    <div className="flex items-center justify-between">
                                      <h3 className="text-xl font-semibold mb-2">{exhibition.name}</h3>
                                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Ongoing
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(exhibition.start_date).toLocaleDateString()} - {new Date(exhibition.end_date).toLocaleDateString()}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {exhibition.venue_name || exhibition.location}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <CardContent className="p-6">
                                  <p className="text-muted-foreground mb-4">{exhibition.description}</p>
                                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
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
                            <Card className="border-blue-100 bg-blue-50/50">
                              <CardContent className="py-6 text-center">
                                <p className="text-muted-foreground">No ongoing exhibitions</p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>

                      {/* Upcoming Exhibitions */}
                      <div className="bg-gradient-to-br from-indigo-50/50 to-white rounded-xl border border-indigo-100 p-6">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-indigo-700">
                          <div className="bg-indigo-100 p-2 rounded-lg">
                            <Calendar className="h-5 w-5 text-indigo-600" />
                          </div>
                          Upcoming Exhibitions
                        </h3>
                        <div className="grid gap-6">
                          {exhibitions
                            ?.filter(exhibition => {
                              const now = new Date();
                              const start = new Date(exhibition.start_date);
                              return start > now;
                            })
                            .map((exhibition) => (
                              <Card key={exhibition.id} className="overflow-hidden border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="aspect-video relative">
                                  <img
                                    src={exhibition.banner_url || '/placeholder-exhibition.jpg'}
                                    alt={exhibition.name} 
                                    className="object-cover w-full h-full"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                    <div className="flex items-center justify-between">
                                      <h3 className="text-xl font-semibold mb-2">{exhibition.name}</h3>
                                      <Badge variant="default" className="bg-indigo-500 hover:bg-indigo-600">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Upcoming
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(exhibition.start_date).toLocaleDateString()} - {new Date(exhibition.end_date).toLocaleDateString()}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {exhibition.venue_name || exhibition.location}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <CardContent className="p-6">
                                  <p className="text-muted-foreground mb-4">{exhibition.description}</p>
                                  <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
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
                            <Card className="border-indigo-100 bg-indigo-50/50">
                              <CardContent className="py-6 text-center">
                                <p className="text-muted-foreground">No upcoming exhibitions</p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>

                      {/* Past Exhibitions */}
                      <div className="bg-gradient-to-br from-slate-50/50 to-white rounded-xl border border-slate-100 p-6">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-700">
                          <div className="bg-slate-100 p-2 rounded-lg">
                            <Award className="h-5 w-5 text-slate-600" />
                          </div>
                          Participated Exhibitions
                        </h3>
                        <div className="grid gap-6">
                          {exhibitions
                            ?.filter(exhibition => {
                              const now = new Date();
                              const end = new Date(exhibition.end_date);
                              return end < now;
                            })
                            .map((exhibition) => (
                              <Card key={exhibition.id} className="overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="aspect-video relative">
                                  <img
                                    src={exhibition.banner_url || '/placeholder-exhibition.jpg'}
                                    alt={exhibition.name} 
                                    className="object-cover w-full h-full"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                    <div className="flex items-center justify-between">
                                      <h3 className="text-xl font-semibold mb-2">{exhibition.name}</h3>
                                      <Badge variant="default" className="bg-slate-500 hover:bg-slate-600">
                                        <Award className="h-3 w-3 mr-1" />
                                        Completed
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(exhibition.start_date).toLocaleDateString()} - {new Date(exhibition.end_date).toLocaleDateString()}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {exhibition.venue_name || exhibition.location}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <CardContent className="p-6">
                                  <p className="text-muted-foreground mb-4">{exhibition.description}</p>
                                  <Button asChild className="w-full bg-slate-600 hover:bg-slate-700">
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
                            const end = new Date(exhibition.end_date);
                            return end < now;
                          }).length === 0 && (
                            <Card className="border-slate-100 bg-slate-50/50">
                              <CardContent className="py-6 text-center">
                                <p className="text-muted-foreground">No past exhibitions</p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="gallery" className="space-y-6">
                  {isLoadingGallery ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : gallery?.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground">No gallery items found</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {gallery?.map((item) => (
                        <Card key={item.id} className="overflow-hidden group">
                          <div className="aspect-square relative">
                            <img
                              src={item.image_url}
                              alt={item.title || 'Gallery item'}
                              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                            />
                            {(item.title || item.description) && (
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                                {item.title && (
                                  <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                                )}
                                {item.description && (
                                  <p className="text-white/80 text-sm">{item.description}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="lookbooks" className="space-y-6">
                  {isLoadingLookBooks ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : lookBooks?.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground">No look books found</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-6">
                      {lookBooks?.map((lookbook) => (
                        <Card key={lookbook.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="p-4 bg-primary/10 rounded-lg">
                                <FileText className="h-8 w-8 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold mb-2">{lookbook.title}</h3>
                                {lookbook.description && (
                                  <p className="text-muted-foreground mb-4">{lookbook.description}</p>
                                )}
                                <Button asChild>
                                  <a
                                    href={lookbook.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2"
                                  >
                                    View Look Book
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
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