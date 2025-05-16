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
import { PaymentForm } from './PaymentForm';

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
  const paymentOps = usePaymentOperations(application.id);

  const handlePaymentSubmit = async (data: {
    amount: number;
    payment_method: string;
    reference_number?: string;
  }) => {
    try {
      await paymentOps.createPayment.mutateAsync(data);
      toast({
        title: 'Payment submitted',
        description: 'Your payment is being processed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit payment',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = () => {
    switch (application.status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Under Review</Badge>;
      case 'approved':
        return application.booking_confirmed ? (
          <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
        ) : (
          <Badge className="bg-blue-100 text-blue-800">Payment Required</Badge>
        );
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return null;
    }
  };

  const showPaymentButton = application.status === 'approved' && 
    !application.booking_confirmed &&
    application.booking_deadline &&
    !isPast(new Date(application.booking_deadline));

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{application.stall?.name}</CardTitle>
            <CardDescription>{application.exhibition?.title}</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Exhibition Dates:
          </div>
          <div>
            {application.exhibition?.start_date && application.exhibition?.end_date && (
              <>
                {format(new Date(application.exhibition.start_date), 'PPP')} -
                {format(new Date(application.exhibition.end_date), 'PPP')}
              </>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Stall Details:
          </div>
          <div>
            {application.stall?.length} × {application.stall?.width} {application.stall?.unit?.symbol}
          </div>
          <div className="font-semibold">
            ${application.stall?.price.toLocaleString()}
          </div>
        </div>
        {application.booking_deadline && !application.booking_confirmed && (
          <Alert className={isPast(new Date(application.booking_deadline)) ? 'bg-red-50' : 'bg-yellow-50'}>
            <Clock className="h-4 w-4" />
            <AlertTitle>Payment Deadline</AlertTitle>
            <AlertDescription>
              {isPast(new Date(application.booking_deadline))
                ? 'Payment deadline has passed'
                : `Payment due by ${format(new Date(application.booking_deadline), 'PPP p')}`}
            </AlertDescription>
          </Alert>
        )}
        {application.payment_status !== 'pending' && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Payment Status:
            </div>
            <div className="flex items-center gap-2">
              <Badge className={
                application.payment_status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }>
                {application.payment_status === 'completed' ? (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                ) : null}
                {application.payment_status.charAt(0).toUpperCase() + application.payment_status.slice(1)}
              </Badge>
              {application.payment_amount && (
                <span className="text-sm text-muted-foreground">
                  (${application.payment_amount.toLocaleString()} paid)
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
      {showPaymentButton && (
        <CardFooter>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">Pay to Confirm Booking</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Complete Payment</DialogTitle>
              </DialogHeader>
              <PaymentForm
                stallPrice={application.stall?.price ?? 0}
                onSubmit={handlePaymentSubmit}
              />
            </DialogContent>
          </Dialog>
        </CardFooter>
      )}
    </Card>
  );
}; 