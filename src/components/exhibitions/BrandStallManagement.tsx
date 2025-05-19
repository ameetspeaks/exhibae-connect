import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isPast } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePaymentOperations } from '@/hooks/usePaymentOperations';
import { StallApplication } from '@/types/exhibition-management';
import { PaymentSubmissionForm } from './PaymentSubmissionForm';

export const BrandStallManagement = () => {
  const { toast } = useToast();
  const { data: applications, isLoading } = useQuery({
    queryKey: ['my_stall_applications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('stall_applications')
        .select(`
          *,
          stall:stalls (
            id,
            name,
            length,
            width,
            price,
            status,
            unit:measuring_units (
              id,
              name,
              symbol
            )
          ),
          exhibition:exhibitions (
            id,
            title,
            start_date,
            end_date,
            status
          )
        `)
        .eq('brand_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StallApplication[];
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!applications || applications.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Applications</AlertTitle>
        <AlertDescription>
          You haven't applied for any stalls yet.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Stalls</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {applications.map((application) => (
          <StallCard key={application.id} application={application} />
        ))}
      </div>
    </div>
  );
};

const StallCard = ({ application }: { application: StallApplication }) => {
  const { toast } = useToast();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);

  const getStatusBadge = () => {
    switch (application.status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Under Review</Badge>;
      case 'payment_pending':
        return <Badge className="bg-blue-100 text-blue-800">Payment Required</Badge>;
      case 'payment_review':
        return <Badge className="bg-purple-100 text-purple-800">Payment Under Review</Badge>;
      case 'booked':
        return <Badge className="bg-green-100 text-green-800">Booked</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return null;
    }
  };

  const showPaymentButton = application.status === 'payment_pending' && 
    application.booking_deadline &&
    !isPast(new Date(application.booking_deadline));

  const handlePaymentSuccess = () => {
    setIsPaymentDialogOpen(false);
    toast({
      title: 'Payment Submitted',
      description: 'Your payment details have been submitted for review.',
    });
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {/* Application Status */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">Application Status</h3>
            <div className="mt-2">{getStatusBadge()}</div>
          </div>
          {application.booking_deadline && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Booking Deadline</p>
              <p className="font-medium">
                {format(new Date(application.booking_deadline), 'PPP')}
              </p>
            </div>
          )}
        </div>

        {/* Stall Details */}
        <div>
          <h3 className="font-medium mb-2">Stall Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name/Number</p>
              <p className="font-medium">{application.stall?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Size</p>
              <p className="font-medium">
                {application.stall?.length}×{application.stall?.width}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="font-medium">₹{application.stall?.price?.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        {application.payment_status && (
          <div>
            <h3 className="font-medium mb-2">Payment Status</h3>
            <Badge className={
              application.payment_status === 'completed'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }>
              {application.payment_status === 'completed' && (
                <CheckCircle2 className="mr-1 h-3 w-3" />
              )}
              {application.payment_status.charAt(0).toUpperCase() + application.payment_status.slice(1)}
            </Badge>
            {application.payment_amount && (
              <p className="mt-1 text-sm text-muted-foreground">
                Amount Paid: ₹{application.payment_amount.toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Payment Button */}
        {showPaymentButton && (
          <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">Make Payment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Complete Payment</DialogTitle>
              </DialogHeader>
              <PaymentSubmissionForm
                applicationId={application.id}
                stallPrice={application.stall?.price || 0}
                exhibitionId={application.exhibition_id}
                onSuccess={handlePaymentSuccess}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Deadline Warning */}
        {application.status === 'payment_pending' && application.booking_deadline && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please complete the payment before{' '}
              {format(new Date(application.booking_deadline), 'PPP')} to secure your booking.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default StallCard; 