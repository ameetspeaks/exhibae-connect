import { useParams, useNavigate } from 'react-router-dom';
import { useExhibition } from '@/hooks/useExhibitionsData';
import { useGalleryImages } from '@/hooks/useGalleryData';
import { useStalls } from '@/hooks/useStallsData';
import { useStallInstances } from '@/hooks/useStallsData';
import { useStallInstanceOperations } from '@/hooks/useStallInstanceOperations';
import { format } from 'date-fns';
import { Loader2, MapPin, Calendar, Tag, Info } from 'lucide-react';
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
  const [selectedStall, setSelectedStall] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRegisteredInterest, setHasRegisteredInterest] = useState(false);

  // Function to check if user is a brand
  const isBrand = () => {
    if (!user) return false;
    const role = user.user_metadata?.role || 'shopper';
    return role.toLowerCase() === UserRole.BRAND.toLowerCase();
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
    if (!selectedStall || !user || !applicationMessage.trim()) return;

    setIsSubmitting(true);
    try {
      console.log('Submitting application for stall:', selectedStall);
      await applyForStall.mutateAsync({
        stallInstanceId: selectedStall.instance_id,
        message: applicationMessage
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
                  <CardContent>
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
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Right Column - Quick Info */}
        <div className="space-y-6">
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              {isBrand() ? (
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
              ) : !isOrganiserOrManager() && (
                <Button className="w-full" size="lg" onClick={() => navigate('/auth')}>
                  Sign in as Brand to Register Interest
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
              disabled={isSubmitting || !applicationMessage.trim()}
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