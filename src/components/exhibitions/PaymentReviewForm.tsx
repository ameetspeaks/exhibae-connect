import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Loader2, Info, CheckCircle2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const rejectionSchema = z.object({
  rejection_reason: z.string().min(1, 'Please provide a reason for rejection'),
});

type RejectionFormData = z.infer<typeof rejectionSchema>;

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

interface PaymentReviewFormProps {
  paymentSubmission: PaymentSubmission;
  onSuccess?: () => void;
}

export const PaymentReviewForm: React.FC<PaymentReviewFormProps> = ({
  paymentSubmission,
  onSuccess
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);

  const form = useForm<RejectionFormData>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: {
      rejection_reason: '',
    },
  });

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('payment_submissions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', paymentSubmission.id);

      if (error) throw error;

      // Update application status to booked
      const { error: applicationError } = await supabase
        .from('stall_applications')
        .update({
          status: 'booked',
          payment_status: 'completed',
          payment_date: new Date().toISOString(),
          booking_confirmed: true
        })
        .eq('id', paymentSubmission.application_id);

      if (applicationError) throw applicationError;

      toast({
        title: 'Success',
        description: 'Payment has been approved.',
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error approving payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve payment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (data: RejectionFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('payment_submissions')
        .update({
          status: 'rejected',
          rejection_reason: data.rejection_reason,
          rejection_date: new Date().toISOString(),
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', paymentSubmission.id);

      if (error) throw error;

      // Update application status back to payment_pending
      const { error: applicationError } = await supabase
        .from('stall_applications')
        .update({
          status: 'payment_pending'
        })
        .eq('id', paymentSubmission.application_id);

      if (applicationError) throw applicationError;

      toast({
        title: 'Payment Rejected',
        description: 'The payment has been rejected and the brand has been notified.',
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject payment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setIsRejectionDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Payment Details</span>
            <Badge 
              variant={paymentSubmission.status === 'pending_review' ? 'outline' : 
                      paymentSubmission.status === 'approved' ? 'secondary' : 'destructive'}
              className="flex items-center gap-1"
            >
              {paymentSubmission.status === 'pending_review' && <Info className="h-4 w-4" />}
              {paymentSubmission.status === 'approved' && <CheckCircle2 className="h-4 w-4" />}
              {paymentSubmission.status === 'rejected' && <XCircle className="h-4 w-4" />}
              {paymentSubmission.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Amount Paid</p>
              <p className="text-lg font-semibold">₹{paymentSubmission.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Transaction ID</p>
              <p className="text-lg font-semibold">{paymentSubmission.transaction_id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment Email</p>
              <p className="text-lg">{paymentSubmission.email}</p>
            </div>
            {paymentSubmission.notes && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Payment Notes</p>
                <p className="mt-1 text-lg whitespace-pre-wrap">{paymentSubmission.notes}</p>
              </div>
            )}
            {paymentSubmission.proof_file_url && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Payment Proof</p>
                <a
                  href={paymentSubmission.proof_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-2 mt-1"
                >
                  View Payment Proof
                </a>
              </div>
            )}
          </div>

          {paymentSubmission.status === 'pending_review' && (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsRejectionDialogOpen(true)}
                disabled={isSubmitting}
              >
                Reject Payment
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Approve Payment
              </Button>
            </div>
          )}

          {paymentSubmission.status === 'rejected' && paymentSubmission.rejection_reason && (
            <Alert variant="destructive">
              <AlertDescription>
                Rejection Reason: {paymentSubmission.rejection_reason}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payment. This will be visible to the brand.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleReject)} className="space-y-4">
              <FormField
                control={form.control}
                name="rejection_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rejection Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the reason for rejecting this payment..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRejectionDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentReviewForm; 