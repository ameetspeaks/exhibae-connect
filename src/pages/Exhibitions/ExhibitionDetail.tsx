import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExhibition } from '@/hooks/useExhibitionsData';
import { useGalleryImages, useUpdateGalleryImageTypes } from '@/hooks/useGalleryData';
import { useStalls } from '@/hooks/useStallsData';
import { useStallInstances } from '@/hooks/useStallsData';
import { useStallInstanceOperations } from '@/hooks/useStallInstanceOperations';
import { useExhibitionAttendance } from '@/hooks/useExhibitionAttendance';
import { useExhibitionFavorite } from '@/hooks/useExhibitionFavorite';
import { format } from 'date-fns';
import { Loader2, MapPin, Calendar, Tag, Info, Users, Heart, ImageIcon, CreditCard, X } from 'lucide-react';
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
import { sendStallApplicationEmail, sendStallApplicationStatusEmail } from '@/lib/emailNotifications';
import { Database } from '@/types/database.types';
import { PostgrestError } from '@supabase/supabase-js';
import { dbOperations, handleSupabaseError, isPostgrestError } from '@/lib/supabase-helpers';

type Tables = Database['public']['Tables'];
type ExhibitionInterest = Tables['exhibition_interests']['Row'];
type ExhibitionInterestInsert = Omit<ExhibitionInterest, 'id' | 'created_at'>;
type OrganiserFollower = Tables['organiser_followers']['Row'];
type OrganiserFollowerInsert = Omit<OrganiserFollower, 'id' | 'created_at'>;
type Profile = Tables['profiles']['Row'];

interface OrganiserProfile {
  id: string;
  full_name: string;
  company_name?: string;
  avatar_url?: string;
  description?: string;
  website_url?: string;
  facebook_url?: string;
  followers_count?: number;
  attendees_hosted?: number;
}

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
  const { mutate: updateImageTypes } = useUpdateGalleryImageTypes(id!);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
      const application = await applyForStall.mutateAsync({
        stallInstanceId: selectedStall.instance_id,
        message: applicationMessage.trim() || '' // Allow empty message
      });

      // Send email notifications using server-side service
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/email/stall-application`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organizer_id: exhibition?.organiser_id,
            brand_id: user.id,
            exhibition_name: exhibition?.title || '',
            stall_size: `${selectedStall.length}x${selectedStall.width} ${selectedStall.unit?.symbol || ''}`,
            product_categories: [], // Add if you have this information
            special_requirements: applicationMessage,
            application_date: new Date().toISOString(),
            review_link: `${window.location.origin}/dashboard/organiser/applications/${application.id}`
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send email notifications');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to send email notifications');
        }
      } catch (emailError) {
        console.error('Error sending email notifications:', emailError);
        toast({
          title: 'Application submitted',
          description: 'Your application was submitted, but there was an issue sending email notifications. The organizer will still be notified through the system.',
          variant: 'destructive',
        });
      }

      // Clear form and show success message
      setApplicationMessage('');
      setSelectedStall(null);
      
      toast({
        title: 'Application submitted',
        description: 'Your stall application has been submitted successfully.',
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit stall application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user has already registered interest
  useEffect(() => {
    const checkInterestStatus = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await dbOperations.checkExhibitionInterest(
          supabase,
          id!,
          user.id
        );

        if (error && isPostgrestError(error)) {
          console.error('Error checking interest status:', error.message);
          toast({
            title: "Error",
            description: "Failed to check interest status. Please try again.",
            variant: "destructive"
          });
          return;
        }
        
        setHasRegisteredInterest(!!data);
      } catch (error) {
        console.error('Error checking interest status:', handleSupabaseError(error));
      }
    };

    checkInterestStatus();
  }, [user, id]);

  useEffect(() => {
    const fetchOrganiser = async () => {
      if (!exhibition?.organiser_id) return;
      setIsLoadingOrganiser(true);
      console.log('Fetching organiser details for ID:', exhibition.organiser_id);
      
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
        .match({ id: exhibition.organiser_id } as Partial<Profile>)
        .single();

      console.log('Organiser query result:', { data, error });
        
      if (error) {
        console.error('Error fetching organiser details:', error);
      } else {
        console.log('Found organiser:', data);
        setOrganiser(data as OrganiserProfile);
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
        const { data, error } = await dbOperations.checkOrganiserFollower(
          supabase,
          organiser.id,
          user.id
        );

        if (error && isPostgrestError(error)) {
          console.error('Error checking follow status:', error.message);
          toast({
            title: "Error",
            description: "Failed to check follow status. Please try again.",
            variant: "destructive"
          });
          return;
        }
        
        setIsFollowing(!!data);
      } catch (error) {
        console.error('Error checking follow status:', handleSupabaseError(error));
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
        const { error } = await dbOperations.removeOrganiserFollower(
          supabase,
          organiser.id,
          user.id
        );
          
        if (error && isPostgrestError(error)) throw error;
        
        setIsFollowing(false);
        toast({
          title: "Unfollowed",
          description: `You no longer follow ${organiser.full_name || organiser.company_name}`,
          variant: "default"
        });
      } else {
        const { error } = await dbOperations.insertOrganiserFollower(
          supabase,
          {
            organiser_id: organiser.id,
            follower_id: user.id
          }
        );
          
        if (error && isPostgrestError(error)) throw error;
        
        setIsFollowing(true);
        toast({
          title: "Following",
          description: `You are now following ${organiser.full_name || organiser.company_name}`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      toast({
        title: "Error",
        description: handleSupabaseError(error),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle interest registration
  const handleRegisterInterest = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to register interest.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (hasRegisteredInterest) {
        const { error } = await dbOperations.removeExhibitionInterest(
          supabase,
          id!,
          user.id
        );
          
        if (error && isPostgrestError(error)) throw error;
        
        setHasRegisteredInterest(false);
        toast({
          title: "Interest Removed",
          description: "You have removed your interest in this exhibition.",
          variant: "default"
        });
      } else {
        const { error } = await dbOperations.insertExhibitionInterest(
          supabase,
          {
            exhibition_id: id!,
            brand_id: user.id,
            notes: null
          }
        );
          
        if (error && isPostgrestError(error)) throw error;
        
        setHasRegisteredInterest(true);
        toast({
          title: "Interest Registered",
          description: "You have registered your interest in this exhibition.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error registering interest:', error);
      toast({
        title: "Error",
        description: handleSupabaseError(error),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove references to price_range if it's not in the exhibition type
  const renderPriceRange = () => {
    if (!exhibition) return null;
    return (
      <div className="flex items-center gap-2 text-sm text-font-color-muted">
        <CreditCard className="h-4 w-4" />
        <span>Contact organiser for pricing details</span>
      </div>
    );
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="relative mb-8 group">
            <AspectRatio ratio={21/9}>
              <img 
                src={bannerImage || '/placeholder-banner.jpg'} 
                alt={exhibition.title}
                className="w-full h-full object-cover rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-[1.01] cursor-pointer"
                onClick={() => setIsImageModalOpen(true)}
              />
            </AspectRatio>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent rounded-2xl" />
            
            {/* Favorite Button */}
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/95 hover:bg-white shadow-lg border-0 backdrop-blur-sm flex items-center gap-2 px-4 rounded-full transition-all duration-300 hover:scale-105"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite();
                }}
                disabled={isFavoriteSubmitting}
              >
                {isFavoriteSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Heart className={`h-4 w-4 transition-all duration-300 ${isFavorite ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-700 hover:scale-110'}`} />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {isFavorite ? 'Favorited' : 'Add to Favorites'}
                </span>
              </Button>
            </div>
          </div>

          {/* Image Modal */}
          <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-auto">
              <div className="relative w-full h-full flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-50 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setIsImageModalOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <img
                  src={selectedImage || bannerImage || '/placeholder-banner.jpg'}
                  alt={exhibition.title}
                  className="max-w-full max-h-[95vh] w-auto h-auto object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Main Content */}
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
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-3xl font-bold text-[#4B1E25]">{exhibition.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          {isShopper() && (
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "bg-white/80 hover:bg-white/90 border-[#4B1E25]/10",
                                isAttending && "bg-[#4B1E25] text-[#F5E4DA] hover:bg-[#4B1E25]/90"
                              )}
                              onClick={() => {
                                if (!user) {
                                  navigate('/auth/login');
                                  return;
                                }
                                toggleAttendance();
                              }}
                              disabled={isAttendanceSubmitting}
                            >
                              {isAttendanceSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  {isAttending ? 'Going' : 'Love to go'}
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 bg-white/80 hover:bg-white/90 rounded-full"
                            onClick={() => {
                              if (!user) {
                                navigate('/auth/login');
                                return;
                              }
                              toggleFavorite();
                            }}
                            disabled={isFavoriteSubmitting}
                          >
                            {isFavoriteSubmitting ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-[#4B1E25]'}`} />
                            )}
                          </Button>
                        </div>
                      </div>
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
                        {(() => {
                          const galleryOnlyImages = galleryImages.filter(img => img.image_type === 'gallery');
                          
                          if (galleryOnlyImages.length === 0) {
                            return (
                              <div className="text-center py-8 text-muted-foreground">
                                No gallery images available
                              </div>
                            );
                          }

                          return (
                            <Carousel>
                              <CarouselContent>
                                {galleryOnlyImages.map((image, index) => (
                                  <CarouselItem key={index}>
                                    <AspectRatio ratio={16/9}>
                                      <img
                                        src={image.image_url}
                                        alt={`Exhibition gallery ${index + 1}`}
                                        className="w-full h-full object-cover rounded-lg cursor-pointer"
                                        onClick={() => {
                                          setSelectedImage(image.image_url);
                                          setIsImageModalOpen(true);
                                        }}
                                      />
                                    </AspectRatio>
                                  </CarouselItem>
                                ))}
                              </CarouselContent>
                              <CarouselPrevious />
                              <CarouselNext />
                            </Carousel>
                          );
                        })()}
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
                      <CardContent className="space-y-6">
                        {/* Layout Images Section */}
                        {(() => {
                          console.log('Stall Layout Section - Conditions:');
                          console.log('stallInstances:', stallInstances?.length);
                          console.log('isBrand():', isBrand());
                          console.log('All Gallery Images:', galleryImages?.map(img => ({
                            id: img.id,
                            type: img.image_type,
                            url: img.image_url
                          })));
                          const layoutImages = galleryImages?.filter(img => {
                            const imageType = (img.image_type || '').toLowerCase().trim();
                            console.log(`Image ${img.id} type:`, imageType, 'matches layout?:', imageType.includes('layout'));
                            return imageType.includes('layout');
                          });
                          console.log('Filtered Layout Images:', layoutImages?.map(img => ({
                            id: img.id,
                            type: img.image_type,
                            url: img.image_url
                          })));
                          return (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Exhibition Layout</h3>
                                {isOrganiserOrManager() && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateImageTypes()}
                                  >
                                    Update Layout Images
                                  </Button>
                                )}
                              </div>
                              {layoutImages && layoutImages.length > 0 ? (
                                <div className="space-y-2">
                                  {layoutImages.map(image => {
                                    console.log('Rendering layout image:', image.image_url);
                                    return (
                                      <div key={image.id} className="rounded-lg overflow-hidden">
                                        <img 
                                          src={image.image_url} 
                                          alt="Layout" 
                                          className="w-full h-auto"
                                          onError={(e) => {
                                            console.error('Image failed to load:', image.image_url);
                                            e.currentTarget.style.display = 'none';
                                          }}
                                          onLoad={() => console.log('Image loaded successfully:', image.image_url)}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-muted-foreground text-sm mb-4">
                                  No layout images available
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        
                        {/* Stall Layout Component */}
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold mb-4">Available Stalls</h3>
                          <StallLayout
                            stallInstances={stallInstances}
                            onStallSelect={handleStallSelect}
                            userRole="brand"
                          />
                        </div>
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

                  {renderPriceRange()}

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
                    <Button
                      variant="ghost"
                      className="w-full flex items-center gap-4 hover:bg-[#4B1E25]/5"
                      onClick={() => navigate(`/organisers/${organiser.id}`)}
                    >
                      {organiser.avatar_url && (
                        <img
                          src={organiser.avatar_url}
                          alt={organiser.company_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div className="text-left">
                        <h3 className="font-semibold">{organiser.company_name}</h3>
                        <p className="text-sm text-muted-foreground">{organiser.full_name}</p>
                      </div>
                    </Button>
                    
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