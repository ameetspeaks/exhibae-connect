import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExhibition } from '@/hooks/useExhibitionsData';
import { useGalleryImages } from '@/hooks/useGalleryData';
import { useStalls } from '@/hooks/useStallsData';
import { useStallInstances } from '@/hooks/useStallsData';
import { useStallInstanceOperations } from '@/hooks/useStallInstanceOperations';
import { useExhibitionAttendance } from '@/hooks/useExhibitionAttendance';
import { useExhibitionFavorite } from '@/hooks/useExhibitionFavorite';
import { format } from 'date-fns';
import { Loader2, MapPin, Calendar, Tag, Info, Users, Heart, ImageIcon } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import type { StallInstance, Exhibition } from '@/types/exhibition-management';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-font-color" />
        </div>
      </div>
    );
  }

  if (!exhibition) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4 header-text">Exhibition Not Found</h1>
        <p className="text-font-color-muted subheading-text mb-6">The exhibition you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/exhibitions')} className="bg-[#4B1E25] hover:bg-[#4B1E25]/90 text-[#F5E4DA]">
          View All Exhibitions
        </Button>
      </div>
    );
  }

  const bannerImage = galleryImages?.find(img => img.image_type === 'banner')?.image_url;
  const galleryPhotos = galleryImages?.filter(img => img.image_type === 'gallery') || [];

  return (
    <div className="min-h-screen bg-[#F5E4DA]">
      {/* Hero Banner Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="relative h-[350px] bg-[#F5E4DA] rounded-2xl overflow-hidden shadow-lg border border-[#4B1E25]/10">
          {bannerImage ? (
            <img
              src={bannerImage}
              alt={exhibition.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#F5E4DA] flex items-center justify-center">
              <ImageIcon className="h-16 w-16 text-[#4B1E25]/20" />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 bg-[#F5E4DA]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="about" className="space-y-6">
              <TabsList className="bg-[#F5E4DA] border border-[#4B1E25]/10">
                <TabsTrigger value="about">About</TabsTrigger>
                {galleryImages && galleryImages.length > 0 && (
                  <TabsTrigger value="gallery">Gallery</TabsTrigger>
                )}
                {stallInstances && stallInstances.length > 0 && isBrand() && (
                  <TabsTrigger value="stalls">Stall Layout</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="about" className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-3xl font-bold text-[#4B1E25]">{exhibition.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {exhibition.description}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {galleryImages && galleryImages.length > 0 && (
                <TabsContent value="gallery" className="space-y-6">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle>Gallery</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Carousel>
                        <CarouselContent>
                          {galleryImages.map((image, index) => (
                            <CarouselItem key={index}>
                              <AspectRatio ratio={16/9}>
                                <img
                                  src={image.image_url}
                                  alt={`Exhibition gallery ${index + 1}`}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </AspectRatio>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                      </Carousel>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {stallInstances && stallInstances.length > 0 && isBrand() && (
                <TabsContent value="stalls" className="space-y-6">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle>Stall Layout</CardTitle>
                      <CardDescription>
                        Click on available stalls to view details and apply
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <StallLayout
                        stallInstances={stallInstances}
                        onStallSelect={handleStallSelect}
                        userRole="brand"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
            <Card className="border-[#4B1E25]/10">
              <CardHeader>
                <CardTitle>Exhibition Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-semibold">Date & Time</h3>
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <div>
                      <p>Start: {format(new Date(exhibition.start_date), 'MMMM d, yyyy')}</p>
                      <p>End: {format(new Date(exhibition.end_date), 'MMMM d, yyyy')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Location</h3>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    <p>{exhibition.address}</p>
                  </div>
                </div>

                {exhibition.category && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-[#4B1E25]/5 text-[#4B1E25] border-[#4B1E25]/10 px-3 py-1">
                        <Tag className="h-4 w-4 mr-2" />
                        {exhibition.category.name}
                      </Badge>
                    </div>
                  </div>
                )}

                {exhibition.price_range && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Price Range</h3>
                    <p className="text-muted-foreground">
                      ₹{exhibition.price_range} onwards
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="font-semibold">People Attending</h3>
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    <p>{attendanceCount + (favoritesCount || 0)} people interested</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organiser Info */}
            {organiser && !isLoadingOrganiser && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Organiser</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    {organiser.avatar_url && (
                      <img
                        src={organiser.avatar_url}
                        alt={organiser.company_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">{organiser.company_name}</h3>
                      <p className="text-sm text-muted-foreground">{organiser.full_name}</p>
                    </div>
                  </div>
                  
                  {organiser.description && (
                    <p className="text-sm text-muted-foreground">{organiser.description}</p>
                  )}

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/organisers/${organiser.id}`)}
                    >
                      View Profile
                    </Button>
                    {user && !isOrganiserOrManager() && (
                      <Button
                        variant={isFollowing ? "outline" : "default"}
                        className="w-full"
                        onClick={handleFollow}
                        disabled={isSubmitting}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Stall Application Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Stall</DialogTitle>
            <DialogDescription>
              Please provide additional information for your stall application
            </DialogDescription>
          </DialogHeader>
          
          {selectedStall && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Selected Stall</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedStall.name} - {selectedStall.length}x{selectedStall.width} {selectedStall.unit?.symbol}
                </p>
                <p className="text-sm font-medium">
                  Price: ₹{selectedStall.price}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Any specific requirements or questions?"
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                />
              </div>
            </div>
          )}

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