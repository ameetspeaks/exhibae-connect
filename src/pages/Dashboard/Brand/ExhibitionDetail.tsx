import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PaymentSubmissionForm } from '@/components/exhibitions/PaymentSubmissionForm';
import { format, isPast } from 'date-fns';
import { useGalleryImages } from '@/hooks/useGalleryData';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PaymentSubmission {
  id: string;
  application_id: string;
  amount: number;
  transaction_id: string;
  email: string;
  proof_file_url?: string;
  notes?: string;
  status: 'pending_review' | 'approved' | 'rejected';
  rejection_reason?: string;
  rejection_date?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

interface Stall {
  id: string;
  name: string;
  length: number;
  width: number;
  price: number;
  status: 'available' | 'pending' | 'applied' | 'confirmed' | 'rejected';
  amenities: string[];
  stall_applications?: Array<{
    id?: string;
    status: string;
    brand_id: string;
  }>;
}

interface Exhibition {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  organiser_id: string;
  status: string;
}

const ExhibitionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [applicationText, setApplicationText] = useState<string>('Interested in participating in this exhibition.');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userApplications, setUserApplications] = useState<any[]>([]);
  const { data: galleryImages, isLoading: isLoadingGalleryImages } = useGalleryImages(id || '');

  useEffect(() => {
    if (user) {
      fetchExhibitionDetails();
      fetchUserApplications();
    }
  }, [id, user]);

  const fetchExhibitionDetails = async () => {
    try {
      setError(null);
      // Fetch exhibition details
      const { data: exhibitionData, error: exhibitionError } = await supabase
        .from('exhibitions')
        .select('*')
        .eq('id', id)
        .single();

      if (exhibitionError) throw exhibitionError;
      setExhibition(exhibitionData);

      // Fetch all stalls with their applications in a single query
      const { data: stallsData, error: stallsError } = await supabase
        .from('stalls')
        .select(`
          *,
          stall_applications (
            id,
            status,
            brand_id
          )
        `)
        .eq('exhibition_id', id);

      if (stallsError) throw stallsError;

      // Process stalls to determine their status
      const processedStalls = (stallsData || []).map(stall => ({
        ...stall,
        status: determineStallStatus(stall, user?.id)
      }));

      setStalls(processedStalls);
    } catch (error: any) {
      setError(error.message);
      toast({
        title: 'Error',
        description: 'Failed to load exhibition details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserApplications = async () => {
    try {
      console.log('Fetching applications for exhibition:', id);
      const { data, error } = await supabase
        .from('stall_applications')
        .select(`
          id,
          exhibition_id,
          stall_id,
          status,
          created_at,
          booking_deadline,
          payment_submissions (
            id,
            amount,
            transaction_id,
            email,
            proof_file_url,
            notes,
            status,
            rejection_reason,
            rejection_date,
            reviewed_at,
            reviewed_by
          )
        `)
        .eq('brand_id', user?.id)
        .eq('exhibition_id', id);

      if (error) {
        console.error('Error fetching user applications:', error);
        throw error;
      }

      console.log('Raw applications data:', data);
      setUserApplications(data || []);
    } catch (error) {
      console.error('Error fetching user applications:', error);
    }
  };

  const determineStallStatus = (stall: any, userId: string | undefined) => {
    if (!stall.stall_applications || stall.stall_applications.length === 0) {
      return 'available';
    }

    // Check for any pending applications first
    const pendingApplication = stall.stall_applications.find(
      (app: any) => app.status === 'pending'
    );

    if (pendingApplication) {
      return 'pending';
    }

    // Check for user's own application
    const userApplication = stall.stall_applications.find(
      (app: any) => app.brand_id === userId
    );

    if (userApplication) {
      return userApplication.status;
    }

    // Check for confirmed applications
    const confirmedApplication = stall.stall_applications.find(
      (app: any) => app.status === 'confirmed'
    );

    if (confirmedApplication) {
      return 'confirmed';
    }

    return 'available';
  };

  const handleStallSelect = (stall: Stall) => {
    if (stall.status === 'available') {
      // Check if user has already applied to maximum allowed stalls
      const pendingApplications = userApplications.filter(app => 
        app.status === 'pending' || app.status === 'confirmed'
      );

      if (pendingApplications.length >= 3) {
        toast({
          title: 'Application Limit Reached',
          description: 'You can only have up to 3 pending or confirmed applications per exhibition.',
          variant: 'destructive',
        });
        return;
      }

      setSelectedStall(stall);
      setApplicationText('Interested in participating in this exhibition.');
      setIsApplyDialogOpen(true);
    }
  };

  const handleApplySubmit = async () => {
    if (!selectedStall || !user) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('stall_applications')
        .insert({
          stall_id: selectedStall.id,
          brand_id: user.id,
          exhibition_id: id,
          message: applicationText,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Immediately update the stall status in the local state
      setStalls(prevStalls => 
        prevStalls.map(stall => 
          stall.id === selectedStall.id 
            ? { ...stall, status: 'pending', stall_applications: [{ status: 'pending', brand_id: user.id }] }
            : stall
        )
      );

      // Update user applications
      setUserApplications(prev => [...prev, data]);

      toast({
        title: 'Success',
        description: 'Your application has been submitted successfully.',
      });

      setIsApplyDialogOpen(false);
      setSelectedStall(null);
      setApplicationText('Interested in participating in this exhibition.'); // Reset to default text
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "text-xs px-2 py-1 rounded-full ";
    switch (status) {
      case 'expired':
        return baseClasses + 'bg-gray-100 text-gray-800';
      case 'pending':
        return baseClasses + 'bg-yellow-100 text-yellow-800';
      case 'payment_pending':
        return baseClasses + 'bg-blue-100 text-blue-800';
      case 'payment_review':
        return baseClasses + 'bg-purple-100 text-purple-800';
      case 'booked':
        return baseClasses + 'bg-green-100 text-green-800';
      case 'rejected':
        return baseClasses + 'bg-red-100 text-red-800';
      default:
        return baseClasses + 'bg-gray-100 text-gray-800';
    }
  };

  const handlePaymentSuccess = () => {
    toast({
      title: 'Success',
      description: 'Payment details submitted successfully. The organizer will review your payment.',
    });
    fetchUserApplications(); // Refresh the applications list
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-exhibae-navy" />
      </div>
    );
  }

  if (!exhibition) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold">Exhibition not found</h2>
        <Button onClick={() => navigate('/dashboard/brand/find')} className="mt-4">
          Back to Exhibitions
        </Button>
      </div>
    );
  }

  // Check if exhibition is expired
  const isExpired = exhibition.status === 'expired' || new Date(exhibition.end_date) < new Date();
  if (isExpired) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold">Exhibition has expired</h2>
        <p className="text-gray-600 mt-2">This exhibition is no longer available.</p>
        <Button onClick={() => navigate('/dashboard/brand/find')} className="mt-4">
          Browse Other Exhibitions
        </Button>
      </div>
    );
  }

  // Filter layout images
  const layoutImages = galleryImages?.filter(img => img.image_type === 'layout') || [];

  return (
    <div className="container mx-auto p-6">
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-exhibae-navy" />
        </div>
      ) : error ? (
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      ) : exhibition ? (
        <>
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">{exhibition.title}</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Exhibition Details</CardTitle>
              <CardDescription>View exhibition information and available stalls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-medium">Location</h3>
                  <p className="text-gray-600">{exhibition.location}</p>
                </div>
                <div>
                  <h3 className="font-medium">Dates</h3>
                  <p className="text-gray-600">
                    {new Date(exhibition.start_date).toLocaleDateString()} - {new Date(exhibition.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {isLoadingGalleryImages ? (
                <div className="mb-6">
                  <h3 className="font-medium mb-4">Stall Layout</h3>
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-exhibae-navy" />
                  </div>
                </div>
              ) : layoutImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-4">Stall Layout</h3>
                  <Carousel>
                    <CarouselContent>
                      {layoutImages.map((image) => (
                        <CarouselItem key={image.id}>
                          <AspectRatio ratio={16/9}>
                            <img 
                              src={image.image_url} 
                              alt="Stall Layout" 
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
              )}

              <div className="flex justify-end mb-6">
                <Button
                  onClick={() => navigate(`/exhibitions/${exhibition.id}`)}
                  className="bg-exhibae-navy hover:bg-opacity-90"
                >
                  View Stall Layout
                </Button>
              </div>

              {userApplications.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Your Stalls</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {userApplications.map((app) => {
                      const stall = stalls.find(s => s.id === app.stall_id);
                      if (!stall) return null;

                      return (
                        <Card key={app.id} className={`${app.status === 'booked' ? 'bg-green-50' : 'bg-gray-50'}`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{stall.name}</h4>
                                <p className="text-sm text-gray-600">
                                  Size: {stall.length}m × {stall.width}m
                                </p>
                                <p className="text-sm text-gray-600">
                                  Price: ₹{stall.price}
                                </p>
                                {app.status === 'booked' && (
                                  <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">
                                    Booked
                                  </Badge>
                                )}
                              </div>
                              {app.status === 'booked' && (
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">
                                    Booking confirmed on:
                                  </p>
                                  <p className="text-sm font-medium">
                                    {format(new Date(app.created_at), 'MMM d, yyyy')}
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-medium mb-2">Available Stalls</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stalls.filter(stall => stall.status === 'available').map((stall) => (
                    <Card 
                      key={stall.id} 
                      className="cursor-pointer hover:border-exhibae-navy bg-gray-50"
                      onClick={() => handleStallSelect(stall)}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-medium">{stall.name}</h4>
                        <p className="text-sm text-gray-600">
                          Size: {stall.length}m × {stall.width}m
                        </p>
                        <p className="text-sm text-gray-600">
                          Price: ₹{stall.price}
                        </p>
                        <Badge variant="outline" className="mt-2">
                          Available
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Apply Dialog */}
          <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply for Stall</DialogTitle>
                <DialogDescription>
                  Submit your application for the selected stall.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedStall && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium">{selectedStall.name}</h4>
                    <p className="text-sm text-gray-600">
                      Size: {selectedStall.length}m × {selectedStall.width}m
                    </p>
                    <p className="text-sm text-gray-600">
                      Price: ₹{selectedStall.price}
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Add any specific requirements or message for the organizer..."
                    value={applicationText}
                    onChange={(e) => setApplicationText(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsApplyDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleApplySubmit}
                  disabled={submitting}
                >
                  {submitting ? (
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
        </>
      ) : null}
    </div>
  );
};

export default ExhibitionDetail; 