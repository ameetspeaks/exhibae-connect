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
import { Calendar, MapPin } from 'lucide-react';
import { unifiedNotificationService } from '@/services/unifiedNotificationService';

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
  address: string;
  start_date: string;
  end_date: string;
  status: string;
  category?: {
    id: string;
    name: string;
  };
  price_range?: string;
  application_deadline?: string;
  organiser?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  stalls: Array<{
    id: string;
    name: string;
    price: number;
    status: string;
  }>;
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
    if (!selectedStall || !user || !id) return;

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
        .select(`
          *,
          exhibition:exhibitions(title),
          brand:profiles(full_name)
        `)
        .single();

      if (error) throw error;

      // Send notifications
      if (data.exhibition && data.brand) {
        await unifiedNotificationService.notifyStallApplication(
          data.id,
          data.brand.full_name,
          data.exhibition.title
        );
      }

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
        <Loader2 className="h-8 w-8 animate-spin text-font-color" />
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
        <h2 className="text-2xl font-bold header-text">Exhibition has expired</h2>
        <p className="text-font-color-muted subheading-text mt-2">This exhibition is no longer available.</p>
        <Button onClick={() => navigate('/dashboard/brand/find')} className="button-primary subheading-text mt-4">
          Browse Other Exhibitions
        </Button>
      </div>
    );
  }

  // Filter layout images
  const layoutImages = galleryImages?.filter(img => img.image_type === 'layout') || [];
  const galleryOnlyImages = galleryImages?.filter(img => img.image_type === 'gallery') || [];

  return (
    <div className="container mx-auto p-6">
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-font-color" />
        </div>
      ) : error ? (
        <div className="text-center text-red-600 subheading-text">
          <p>{error}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2 header-text">{exhibition.title}</h1>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center text-font-color-muted">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="subheading-text">
                    {format(new Date(exhibition.start_date), 'MMM d')} - {format(new Date(exhibition.end_date), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center text-font-color-muted">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="subheading-text">{exhibition.address}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Button variant="outline" className="button-secondary subheading-text" onClick={() => navigate(-1)}>
                Back
              </Button>
              <Button className="button-primary subheading-text" onClick={() => navigate(`/dashboard/brand/exhibitions/${exhibition.id}/stalls`)}>
                View Stalls
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Details */}
            <div className="lg:col-span-2">
              <Card className="card">
                <CardHeader>
                  <CardTitle className="header-text">About the Exhibition</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-lg text-font-color-muted subheading-text">{exhibition.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Stall Layout Section */}
              {isLoadingGalleryImages ? (
                <div className="mb-6">
                  <h3 className="font-medium header-text mb-4">Stall Layout</h3>
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-font-color" />
                  </div>
                </div>
              ) : layoutImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium header-text mb-4">Stall Layout</h3>
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

              {/* Gallery Section */}
              {galleryOnlyImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium header-text mb-4">Gallery</h3>
                  <Carousel>
                    <CarouselContent>
                      {galleryOnlyImages.map((image) => (
                        <CarouselItem key={image.id}>
                          <AspectRatio ratio={16/9}>
                            <img 
                              src={image.image_url} 
                              alt="Exhibition Gallery" 
                              className="w-full h-full object-cover rounded-md"
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
            </div>

            {/* Right Column - Additional Info */}
            <div>
              <Card className="card mb-6">
                <CardHeader>
                  <CardTitle className="header-text">Exhibition Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-font-color subheading-text mb-2">Category</h4>
                      <Badge className="badge subheading-text">{exhibition.category?.name}</Badge>
                    </div>
                    <div>
                      <h4 className="font-medium text-font-color subheading-text mb-2">Available Stalls</h4>
                      <p className="text-font-color-muted subheading-text">{stalls.filter(stall => stall.status === 'available').length} stalls available</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-font-color subheading-text mb-2">Price Range</h4>
                      <p className="text-font-color-muted subheading-text">{exhibition.price_range || 'Price on request'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-font-color subheading-text mb-2">Application Deadline</h4>
                      <p className="text-font-color-muted subheading-text">
                        {exhibition.application_deadline
                          ? format(new Date(exhibition.application_deadline), 'MMM d, yyyy')
                          : 'No deadline specified'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card">
                <CardHeader>
                  <CardTitle className="header-text">Contact Organizer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-font-color subheading-text mb-2">Organizer</h4>
                      <p className="text-font-color-muted subheading-text">{exhibition.organiser?.name}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-font-color subheading-text mb-2">Email</h4>
                      <p className="text-font-color-muted subheading-text">{exhibition.organiser?.email}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-font-color subheading-text mb-2">Phone</h4>
                      <p className="text-font-color-muted subheading-text">{exhibition.organiser?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExhibitionDetail; 