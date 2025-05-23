import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { format, isPast } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PaymentSubmissionForm } from '@/components/exhibitions/PaymentSubmissionForm';

interface Exhibition {
  id: string;
  title: string;
  address: string;
  start_date: string;
  end_date: string;
}

interface Stall {
  id: string;
  name: string;
  length: number;
  width: number;
  price: number;
}

interface Application {
  id: string;
  exhibition_id: string;
  stall_id: string;
  status: string;
  created_at: string;
  booking_deadline?: string;
  exhibition: Exhibition;
  stall: Stall;
  payment_submission?: {
    id: string;
    proof_file_url?: string;
    status: string;
  };
}

const Applications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      console.log('Fetching applications for user:', user?.id);
      const { data, error } = await supabase
        .from('stall_applications')
        .select(`
          id,
          exhibition_id,
          stall_id,
          status,
          created_at,
          booking_deadline,
          exhibition:exhibitions (
            id,
            title,
            address,
            start_date,
            end_date
          ),
          stall:stalls (
            id,
            name,
            length,
            width,
            price
          ),
          payment_submission:payment_submissions(
            id,
            proof_file_url,
            status
          )
        `)
        .eq('brand_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        throw error;
      }

      console.log('Raw data from Supabase:', data);

      // Transform and validate the data
      const transformedData = data?.map(app => {
        // Log each application for debugging
        console.log('Processing application:', app);

        // Handle the case where exhibition or stall might be an empty array
        const exhibition = Array.isArray(app.exhibition) ? app.exhibition[0] : app.exhibition;
        const stall = Array.isArray(app.stall) ? app.stall[0] : app.stall;
        const payment_submission = Array.isArray(app.payment_submission) ? 
          app.payment_submission[0] : app.payment_submission;

        // Skip invalid applications
        if (!exhibition || !stall) {
          console.warn('Skipping application due to missing data:', {
            id: app.id,
            hasExhibition: !!exhibition,
            hasStall: !!stall
          });
          return null;
        }

        return {
          ...app,
          exhibition,
          stall,
          payment_submission
        };
      }).filter(Boolean) as Application[];

      console.log('Transformed applications:', transformedData);
      setApplications(transformedData || []);
    } catch (error) {
      console.error('Error in fetchApplications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load applications. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'payment_pending':
        return 'bg-blue-100 text-blue-800';
      case 'payment_review':
        return 'bg-purple-100 text-purple-800';
      case 'booked':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filterApplications = (status: string) => {
    if (status === 'all') return applications;
    return applications.filter(app => app.status.toLowerCase() === status.toLowerCase());
  };

  const ApplicationCard = ({ application }: { application: Application }) => {
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

    // Add validation check
    if (!application?.exhibition || !application?.stall) {
      console.error('Invalid application data:', application);
      return null;
    }

    const showPaymentButton = application.status === 'payment_pending';

    const handlePaymentSuccess = () => {
      setIsPaymentDialogOpen(false);
      toast({
        title: 'Payment Submitted',
        description: 'Your payment details have been submitted for review.',
      });
      fetchApplications(); // Refresh the applications list
    };

    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-medium text-lg">{application.exhibition.title}</h3>
              <div className="flex items-center space-x-2 text-gray-600 mt-1">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{application.exhibition.address}</span>
              </div>
            </div>
            <Badge className={getStatusColor(application.status)}>
              {application.status.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  {format(new Date(application.exhibition.start_date), 'PPP')} - {format(new Date(application.exhibition.end_date), 'PPP')}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Applied: {format(new Date(application.created_at), 'PPP')}</span>
              </div>
              {application.booking_deadline && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    Booking Deadline: {format(new Date(application.booking_deadline), 'PPP')}
                  </span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-gray-600">Stall:</span> {application.stall.name}
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Size:</span> {application.stall.length}m × {application.stall.width}m
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Price:</span> ₹{application.stall.price.toLocaleString()}
              </div>
            </div>
          </div>

          {application.status === 'payment_pending' && (
            <>
              <Alert className="mt-4">
                <AlertDescription>
                  Please complete the payment to confirm your booking. 
                  {application.booking_deadline && (
                    <> Payment must be made by {format(new Date(application.booking_deadline), 'PPP')}.</>
                  )}
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                  <Button 
                    className="w-full bg-exhibae-navy hover:bg-opacity-90"
                    onClick={() => setIsPaymentDialogOpen(true)}
                  >
                    Pay Now
                  </Button>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Complete Payment</DialogTitle>
                      <DialogDescription>
                        Submit your payment details to confirm your stall booking
                      </DialogDescription>
                    </DialogHeader>
                    <PaymentSubmissionForm
                      applicationId={application.id}
                      stallPrice={application.stall.price}
                      exhibitionId={application.exhibition_id}
                      onSuccess={handlePaymentSuccess}
                      bookingDeadline={application.booking_deadline}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </>
          )}

          <div className="mt-4 flex flex-col gap-2">
            {application.payment_submission?.proof_file_url && (
              <a
                href={application.payment_submission.proof_file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-exhibae-navy bg-white border border-exhibae-navy rounded-md hover:bg-exhibae-navy hover:text-white transition-colors"
              >
                View Payment Proof
              </a>
            )}

            <Button 
              variant="outline"
              onClick={() => navigate(`/dashboard/brand/exhibitions/${application.exhibition_id}`)}
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-exhibae-navy" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Applications</h1>
        <p className="text-gray-600">Track and manage your exhibition applications</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Applications</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        {applications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            You haven't applied to any exhibitions yet.
            <div className="mt-4">
              <Button 
                onClick={() => navigate('/dashboard/brand/find')}
                className="bg-exhibae-navy hover:bg-opacity-90"
              >
                Browse Exhibitions
              </Button>
            </div>
          </div>
        ) : (
          <>
            <TabsContent value="all" className="mt-6">
              {filterApplications('all').map(application => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              {filterApplications('pending').map(application => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </TabsContent>

            <TabsContent value="confirmed" className="mt-6">
              {filterApplications('confirmed').map(application => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              {filterApplications('rejected').map(application => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default Applications; 