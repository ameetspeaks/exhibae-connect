import { useParams, useNavigate } from 'react-router-dom';
import { useExhibition } from '@/hooks/useExhibitionsData';
import { useGalleryImages } from '@/hooks/useGalleryData';
import { useStalls } from '@/hooks/useStallsData';
import { useStallInstances } from '@/hooks/useStallsData';
import { useStallInstanceOperations } from '@/hooks/useStallInstanceOperations';
import { useExhibitionAttendance } from '@/hooks/useExhibitionAttendance';
import { useExhibitionFavorite } from '@/hooks/useExhibitionFavorite';
import { format } from 'date-fns';
import { Loader2, MapPin, Calendar, Tag, Info, Users, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { UserRole } from '@/types/auth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StallLayout } from '@/components/exhibitions/StallLayout';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { StallInstance } from '@/types/exhibition-management';

export default function ExhibitionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: exhibition, isLoading: isLoadingExhibition } = useExhibition(id!);
  const { data: galleryImages } = useGalleryImages(id!);
  const { data: stalls, refetch: refetchStalls } = useStalls(id!);
  const { data: stallInstances, refetch: refetchInstances } = useStallInstances(id!);
  const { applyForStall } = useStallInstanceOperations(id!);
  const { user } = useAuth();
  const { 
    isAttending, 
    toggleAttendance, 
    isSubmitting: isAttendanceSubmitting,
    attendanceCount 
  } = useExhibitionAttendance(id!);
  const {
    isFavorite,
    toggleFavorite,
    isSubmitting: isFavoriteSubmitting,
    favoritesCount
  } = useExhibitionFavorite(id!);
  
  const [selectedStall, setSelectedStall] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRegisteredInterest, setHasRegisteredInterest] = useState(false);
  const [organiser, setOrganiser] = useState<any>(null);
  const [isLoadingOrganiser, setIsLoadingOrganiser] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  // Function to check if user is a brand
  const isBrand = () => {
    if (!user) return false;
    const role = user.user_metadata?.role || 'shopper';
    return role.toLowerCase() === UserRole.BRAND.toLowerCase();
  };

  // Function to check if user is a shopper
  const isShopper = () => {
    if (!user) return false;
    const role = user.user_metadata?.role || 'shopper';
    return role.toLowerCase() === UserRole.SHOPPER.toLowerCase();
  };

  // Function to check if user is an organiser or manager
  const isOrganiserOrManager = () => {
    if (!user) return false;
    const role = user.user_metadata?.role || 'shopper';
    return role.toLowerCase() === UserRole.ORGANISER.toLowerCase() || 
           role.toLowerCase() === UserRole.MANAGER.toLowerCase();
  };

  const handleStallSelect = (instance: StallInstance) => {
    console.log('Selected stall instance:', instance);
    // Only allow selection of available stalls for brands
    if (!isBrand()) return;
    
    if (instance.status === 'available') {
      setSelectedStall({
        instance_id: instance.id,
        stall_id: instance.stall_id,
        name: instance.stall.name,
        length: instance.stall.length,
        width: instance.stall.width,
        price: instance.price || instance.stall.price,
        unit: instance.stall.unit
      });
      setIsDialogOpen(true);
    } else {
      // The toast notification will be handled by the StallLayout component
      return;
    }
  };

  const handleApplicationSubmit = async () => {
    if (!selectedStall || !user) return;

    setIsSubmitting(true);
    try {
      console.log('Submitting application for stall:', selectedStall);
      await applyForStall.mutateAsync({
        stallInstanceId: selectedStall.instance_id,
        message: applicationMessage.trim() || '' // Allow empty message
      });

      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully.",
      });

      // Reset form and refresh data
      setIsDialogOpen(false);
      setSelectedStall(null);
      setApplicationMessage('');
      refetchStalls();
      refetchInstances();

    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle interest registration
  const handleRegisterInterest = async () => {
    if (!user || !isBrand()) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('exhibition_interests')
        .insert([
          {
            exhibition_id: id,
            brand_id: user.id,
            notes: '' // Optional notes can be added later if needed
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setHasRegisteredInterest(true);
      toast({
        title: "Interest Registered",
        description: "Your interest has been registered successfully.",
      });
    } catch (error: any) {
      console.error('Error registering interest:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to register interest",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user has already registered interest
  useEffect(() => {
    const checkInterestStatus = async () => {
      if (!user || !isBrand()) return;

      try {
        const { data, error } = await supabase
          .from('exhibition_interests')
          .select('*')
          .eq('exhibition_id', id)
          .eq('brand_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw error;
        }

        setHasRegisteredInterest(!!data);
      } catch (error) {
        console.error('Error checking interest status:', error);
      }
    };

    checkInterestStatus();
  }, [user, id]);

  useEffect(() => {
    const fetchOrganiser = async () => {
      if (!exhibition?.organiser_id) return;
      setIsLoadingOrganiser(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          company_name,
          avatar_url,
          description,
          website_url,
          facebook_url,
          followers_count,
          attendees_hosted
        `)
        .eq('id', exhibition.organiser_id)
        .single();
      if (error) {
        console.error('Error fetching organiser details:', error);
      } else {
        setOrganiser(data);
      }
      setIsLoadingOrganiser(false);
    };
    if (exhibition) fetchOrganiser();
  }, [exhibition]);

  // Check if user is following the organiser
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || !organiser) return;
      
      try {
        const { data, error } = await supabase
          .from('organiser_followers')
          .select('*')
          .eq('organiser_id', organiser.id)
          .eq('follower_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw error;
        }
        
        setIsFollowing(!!data);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };
    
    checkFollowStatus();
  }, [user, organiser]);

  // Handle follow/unfollow
  const handleFollow = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to follow this organiser.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    
    if (!organiser) {
      toast({
        title: "Error",
        description: "Organiser information not available.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('organiser_followers')
          .delete()
          .eq('organiser_id', organiser.id)
          .eq('follower_id', user.id);
          
        if (error) throw error;
        
        setIsFollowing(false);
        toast({
          title: "Unfollowed",
          description: `You no longer follow ${organiser.full_name || organiser.company_name}`
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('organiser_followers')
          .insert({
            organiser_id: organiser.id,
            follower_id: user.id,
            created_at: new Date().toISOString()
          });
          
        if (error) throw error;
        
        setIsFollowing(true);
        toast({
          title: "Following",
          description: `You are now following ${organiser.full_name || organiser.company_name}`
        });
      }
    } catch (error: any) {
      console.error('Error following/unfollowing:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while processing your request.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingExhibition) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!exhibition) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-muted-foreground">Exhibition not found</p>
      </div>
    );
  }

  const bannerImage = galleryImages?.find(img => img.image_type === 'banner')?.image_url;
  const galleryPhotos = galleryImages?.filter(img => img.image_type === 'gallery') || [];

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Hero Section */}
      <div className="relative mb-8">
        <AspectRatio ratio={21/9}>
          <img 
            src={bannerImage || '/placeholder-banner.jpg'} 
            alt={exhibition.title}
            className="w-full h-full object-cover rounded-lg"
          />
        </AspectRatio>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg" />
        <div className="absolute bottom-0 left-0 p-6">
          <h1 className="text-4xl font-bold text-white mb-2">{exhibition.title}</h1>
          <div className="flex flex-wrap gap-2">
            {exhibition.category && (
              <Badge variant="secondary" className="text-sm">
                <Tag className="w-4 h-4 mr-1" />
                {exhibition.category.name}
              </Badge>
            )}
            <Badge variant="secondary" className="text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              {exhibition.address}, {exhibition.city}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <Calendar className="w-4 h-4 mr-1" />
              {format(new Date(exhibition.start_date), 'MMM d')} - {format(new Date(exhibition.end_date), 'MMM d, yyyy')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Details */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="about" className="w-full">
            <TabsList>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
              <TabsTrigger value="stalls">Stalls</TabsTrigger>
              {isBrand() && <TabsTrigger value="layout">Layout</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <CardTitle>About the Exhibition</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-lg text-muted-foreground">{exhibition.description}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gallery">
              <Card>
                <CardHeader>
                  <CardTitle>Photo Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  {galleryPhotos.length > 0 ? (
                    <Carousel>
                      <CarouselContent>
                        {galleryPhotos.map((image) => (
                          <CarouselItem key={image.id}>
                            <AspectRatio ratio={16/9}>
                              <img 
                                src={image.image_url} 
                                alt="Gallery" 
                                className="w-full h-full object-cover rounded-md"
                              />
                            </AspectRatio>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>
                  ) : (
                    <p className="text-muted-foreground">No gallery photos available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stalls">
              <Card>
                <CardHeader>
                  <CardTitle>Available Stalls</CardTitle>
                  <CardDescription>
                    View available stalls and their details. Use the Layout tab to view and apply for stalls.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stalls && stalls.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stalls.map((stall) => {
                        // Count available instances for this stall type
                        const availableCount = stallInstances?.filter(
                          instance => instance.stall_id === stall.id && instance.status === 'available'
                        )?.length || 0;

                        return (
                          <Card key={stall.id}>
                            <CardContent className="p-4">
                              <h3 className="font-semibold mb-2">{stall.name}</h3>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p>Size: {stall.length}x{stall.width} {stall.unit?.symbol}</p>
                                <p>Price: ₹{stall.price?.toLocaleString()}</p>
                                <p>Status: {availableCount > 0 ? `${availableCount} stalls available` : 'No stalls available'}</p>
                              </div>
                              {isBrand() && availableCount > 0 && (
                                <Button 
                                  variant="outline"
                                  className="mt-4 w-full"
                                  onClick={() => {
                                    const tab = document.querySelector('[data-value="layout"]') as HTMLElement;
                                    if (tab) tab.click();
                                  }}
                                >
                                  View in Layout
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No stalls available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {isBrand() && (
              <TabsContent value="layout">
                <Card>
                  <CardHeader>
                    <CardTitle>Stall Layout</CardTitle>
                    <CardDescription>
                      Click on an available stall to apply. Color codes: Light Blue - Available, Yellow - Pending, Red - Booked
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Layout Images */}
                    {galleryImages && galleryImages.filter(img => img.image_type === 'layout').length > 0 ? (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Layout Overview</h3>
                        <Carousel>
                          <CarouselContent>
                            {galleryImages
                              .filter(img => img.image_type === 'layout')
                              .map((image) => (
                                <CarouselItem key={image.id}>
                                  <AspectRatio ratio={16/9}>
                                    <img 
                                      src={image.image_url} 
                                      alt="Layout" 
                                      className="w-full h-full object-contain rounded-md"
                                    />
                                  </AspectRatio>
                                </CarouselItem>
                              ))}
                          </CarouselContent>
                          <CarouselPrevious />
                          <CarouselNext />
                        </Carousel>
                      </div>
                    ) : null}

                    {/* Interactive Stall Layout */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Interactive Layout</h3>
                      {stallInstances && stallInstances.length > 0 ? (
                        <StallLayout
                          stallInstances={stallInstances}
                          onStallSelect={handleStallSelect}
                          selectedInstanceId={selectedStall?.instance_id}
                          isEditable={false}
                          userRole="brand"
                        />
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No stall layout available. Please contact the organizer.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Right Column - Organiser Card + Quick Info */}
        <div className="space-y-6">
          {/* Organiser Card */}
          <Card>
            <CardHeader>
              <CardTitle>Organized by</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingOrganiser ? (
                <div className="text-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Loading organiser details...</p>
                </div>
              ) : organiser ? (
                <div className="flex flex-col items-start gap-4">
                  <div className="flex items-center gap-3">
                    {organiser.avatar_url ? (
                      <img 
                        src={organiser.avatar_url} 
                        alt={organiser.full_name || organiser.company_name} 
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-xl font-semibold text-muted-foreground">
                          {(organiser.full_name || organiser.company_name || "O").charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{organiser.full_name || organiser.company_name}</h3>
                      <div className="text-sm text-muted-foreground">
                        {organiser.full_name && organiser.company_name ? organiser.company_name : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="font-bold">{organiser.attendees_hosted || '17.8k'}</span> attendees hosted
                    </div>
                  </div>
                  
                  <div className="text-muted-foreground text-sm">
                    {organiser.description || 
                     'We bring together many of the nation\'s leading authorities on legal and financial strategies that will make you more secure, financially stable and give you peace of mind.'}
                  </div>
                  
                  <div className="flex gap-3 mt-2">
                    {organiser.facebook_url && (
                      <a 
                        href={organiser.facebook_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:text-blue-800"
                        aria-label="Facebook"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                      </a>
                    )}
                    {organiser.website_url && (
                      <a 
                        href={organiser.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-600 hover:text-gray-800"
                        aria-label="Website"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="2" y1="12" x2="22" y2="12"></line>
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                      </a>
                    )}
                    {!organiser.facebook_url && !organiser.website_url && (
                      <>
                        <a 
                          href="#" 
                          className="text-blue-600 hover:text-blue-800"
                          aria-label="Facebook"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                          </svg>
                        </a>
                        <a 
                          href="#" 
                          className="text-gray-600 hover:text-gray-800"
                          aria-label="Website"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                          </svg>
                        </a>
                      </>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    <Button 
                      className={`w-full ${isFollowing ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      onClick={handleFollow}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isFollowing ? 'Unfollowing...' : 'Following...'}
                        </>
                      ) : (
                        isFollowing ? 'Following' : 'Follow'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">No organiser details found</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {exhibition.address}, {exhibition.city}, {exhibition.state}, {exhibition.country}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Dates</p>
                    <p className="text-sm text-muted-foreground">
                      Start: {format(new Date(exhibition.start_date), 'MMMM d, yyyy')}<br />
                      End: {format(new Date(exhibition.end_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>

                {exhibition.venue_type && (
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Venue Type</p>
                      <p className="text-sm text-muted-foreground">{exhibition.venue_type.name}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Attendees</p>
                    <p className="text-sm text-muted-foreground">
                      {attendanceCount} people going
                      {favoritesCount > 0 && ` • ${favoritesCount} people interested`}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              {user ? (
                // Brand user button
                isBrand() ? (
                  hasRegisteredInterest ? (
                    <Button className="w-full" size="lg" disabled>
                      Interest Registered
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      size="lg" 
                      onClick={handleRegisterInterest}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Registering..." : "Register Interest"}
                    </Button>
                  )
                ) : 
                // Shopper user button
                isShopper() ? (
                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={toggleAttendance}
                    disabled={isAttendanceSubmitting}
                    variant={isAttending ? "secondary" : "default"}
                  >
                    {isAttendanceSubmitting ? "Updating..." : (isAttending ? "Going ✓" : "Love to Go")}
                  </Button>
                ) : 
                // No button for organiser and manager
                null
              ) : (
                // Guest user button - redirects to auth
                <Button className="w-full" size="lg" onClick={() => navigate('/auth')}>
                  Sign in to Register
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Application Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Stall {selectedStall?.name}</DialogTitle>
            <DialogDescription>
              Please provide additional information about your brand and why you'd like to participate in this exhibition.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selected Stall Details</Label>
              {selectedStall && (
                <div className="text-sm text-muted-foreground">
                  <p>Name: {selectedStall.name}</p>
                  <p>Stall Instance ID: {selectedStall.stall_instance_id}</p>
                  <p>Stall ID: {selectedStall.stall_id}</p>
                  <p>Size: {selectedStall.length}x{selectedStall.width} {selectedStall.unit?.symbol}</p>
                  <p>Price: ₹{selectedStall.price}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Application Message</Label>
              <Textarea
                id="message"
                placeholder="Tell us about your brand and why you'd like to participate..."
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedStall(null);
                setApplicationMessage('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplicationSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 