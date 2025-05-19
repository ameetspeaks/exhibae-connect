import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Info, AlertTriangle, CalendarIcon } from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const paymentSchema = z.object({
  payment_method_id: z.string().min(1, 'Please select a payment method'),
  transaction_id: z.string().min(1, 'Transaction ID is required'),
  transaction_date: z.date({
    required_error: "Please select a date",
  }),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  email: z.string().email('Please enter a valid email'),
  notes: z.string().optional(),
  proof_file: z.instanceof(File).optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

interface OrganizerPaymentDetail {
  id: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  upi_id?: string;
  additional_instructions?: string;
}

interface PaymentSubmission {
  id: string;
  status: string;
  rejection_reason?: string;
  rejection_date?: string;
}

interface PaymentSubmissionFormProps {
  applicationId: string;
  stallPrice: number;
  exhibitionId: string;
  onSuccess?: () => void;
  bookingDeadline?: string;
}

export const PaymentSubmissionForm: React.FC<PaymentSubmissionFormProps> = ({
  applicationId,
  stallPrice,
  exhibitionId,
  onSuccess,
  bookingDeadline
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [organizerPaymentDetails, setOrganizerPaymentDetails] = useState<OrganizerPaymentDetail | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [lastRejectedPayment, setLastRejectedPayment] = useState<PaymentSubmission | null>(null);

  const isDeadlinePassed = bookingDeadline && isPast(new Date(bookingDeadline));
  const deadlineApproaching = bookingDeadline && 
    !isDeadlinePassed && 
    differenceInDays(new Date(bookingDeadline), new Date()) <= 3;

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: stallPrice,
      email: user?.email || '',
      transaction_date: new Date(),
    },
  });

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        // Fetch organizer payment details first
        const { data: exhibitionData, error: exhibitionError } = await supabase
          .from('exhibitions')
          .select('organiser_id')
          .eq('id', exhibitionId)
          .single();

        if (exhibitionError) throw exhibitionError;
        setOrganizerId(exhibitionData.organiser_id);

        // Fetch both bank and UPI details
        const [bankResponse, upiResponse] = await Promise.all([
          supabase
            .from('organiser_bank_details')
            .select('*')
            .eq('organiser_id', exhibitionData.organiser_id)
            .eq('is_active', true)
            .maybeSingle(),
          supabase
            .from('organiser_upi_details')
            .select('*')
            .eq('organiser_id', exhibitionData.organiser_id)
            .eq('is_active', true)
            .maybeSingle()
        ]);

        if (bankResponse.error && bankResponse.error.code !== 'PGRST116') {
          throw bankResponse.error;
        }
        if (upiResponse.error && upiResponse.error.code !== 'PGRST116') {
          throw upiResponse.error;
        }

        const paymentDetails = {
          ...(bankResponse.data || {}),
          ...(upiResponse.data || {}),
        };

        setOrganizerPaymentDetails(paymentDetails);

        // Fetch only payment methods that are configured
        const { data: methodsData, error: methodsError } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('is_active', true)
          .in('code', [
            ...(bankResponse.data ? ['bank_transfer', 'neft'] : []),
            ...(upiResponse.data ? ['upi'] : []),
            'manual' // Always include manual payment option
          ]);

        if (methodsError) throw methodsError;
        setPaymentMethods(methodsData || []);

        // Fetch last rejected payment if any, with error handling
        try {
          const { data: lastPayment, error: paymentError } = await supabase
            .from('payment_submissions')
            .select('id, status, rejection_reason, rejection_date')
            .eq('application_id', applicationId)
            .eq('status', 'rejected')
            .order('submitted_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (paymentError) {
            console.warn('Error fetching rejected payment:', paymentError);
          } else if (lastPayment) {
            setLastRejectedPayment(lastPayment);
          }
        } catch (error) {
          console.warn('Failed to fetch rejected payment:', error);
        }

      } catch (error) {
        console.error('Error fetching payment details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payment details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [exhibitionId, applicationId, toast]);

  const onSubmit = async (data: PaymentFormData) => {
    if (!user) return;
    if (isDeadlinePassed) {
      toast({
        title: 'Error',
        description: 'Payment deadline has passed. Please contact the organizer.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploading(true);
      let proof_file_url = null;

      // Upload proof file if provided
      if (data.proof_file) {
        const fileExt = data.proof_file.name.split('.').pop();
        const fileName = `${user.id}/${applicationId}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment_proofs')
          .upload(fileName, data.proof_file);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('payment_proofs')
          .getPublicUrl(fileName);
          
        proof_file_url = publicUrl;
      }

      // Format the data to match the table structure
      const paymentData = {
        application_id: applicationId,
        payment_method_id: data.payment_method_id,
        transaction_id: data.transaction_id,
        amount: data.amount,
        email: data.email,
        proof_file_url,
        status: 'pending_review',
        submitted_at: new Date().toISOString(),
        // Store transaction date in notes along with any user notes
        notes: `Transaction Date: ${data.transaction_date.toISOString()}${data.notes ? '\n' + data.notes : ''}`
      };

      const { error } = await supabase
        .from('payment_submissions')
        .insert(paymentData);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Payment details submitted successfully. The organizer will review your payment.',
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit payment details',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaymentMethodChange = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    setSelectedPaymentMethod(method || null);
    form.setValue('payment_method_id', methodId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!organizerPaymentDetails && selectedPaymentMethod?.code !== 'manual') {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          The organizer has not set up their payment details yet. Please contact the organizer or try again later.
          {organizerId && (
            <div className="mt-2">
              Organizer ID: {organizerId}
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <div className="max-h-[80vh] overflow-y-auto px-1">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            {isDeadlinePassed ? (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  The payment deadline has passed ({format(new Date(bookingDeadline!), 'PPp')}).
                  Please contact the organizer for assistance.
                </AlertDescription>
              </Alert>
            ) : deadlineApproaching ? (
              <Alert variant="warning" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Payment deadline is approaching! Complete payment before {format(new Date(bookingDeadline!), 'PPp')}.
                </AlertDescription>
              </Alert>
            ) : bookingDeadline ? (
              <Alert className="py-2">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Payment deadline: {format(new Date(bookingDeadline), 'PPp')}
                </AlertDescription>
              </Alert>
            ) : null}

            {lastRejectedPayment && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div>Payment rejected on {format(new Date(lastRejectedPayment.rejection_date!), 'PPp')}.</div>
                  <div className="font-medium mt-1">Reason: {lastRejectedPayment.rejection_reason}</div>
                </AlertDescription>
              </Alert>
            )}

            <Alert className="py-2">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Complete the payment using the provided details below.
              </AlertDescription>
            </Alert>
          </div>

          {/* Payment Method Selection */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="payment_method_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={handlePaymentMethodChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      value={stallPrice}
                      disabled
                      className="bg-muted"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    This is the fixed stall price and cannot be modified
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Payment Details Card */}
          {selectedPaymentMethod && selectedPaymentMethod.code !== 'manual' && organizerPaymentDetails && (
            <Card className="mt-2">
              <CardHeader className="py-3">
                <CardTitle className="text-base">Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="py-2 space-y-2">
                {(selectedPaymentMethod.code === 'bank_transfer' || selectedPaymentMethod.code === 'neft') && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label className="text-sm text-muted-foreground">Bank Name</Label>
                      <p className="text-sm font-medium">{organizerPaymentDetails.bank_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Account Number</Label>
                      <p className="text-sm font-medium">{organizerPaymentDetails.account_number}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">IFSC Code</Label>
                      <p className="text-sm font-medium">{organizerPaymentDetails.ifsc_code}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Account Holder</Label>
                      <p className="text-sm font-medium">{organizerPaymentDetails.account_holder_name}</p>
                    </div>
                  </div>
                )}

                {selectedPaymentMethod.code === 'upi' && (
                  <div>
                    <Label className="text-sm text-muted-foreground">UPI ID</Label>
                    <p className="text-sm font-medium">{organizerPaymentDetails.upi_id}</p>
                  </div>
                )}

                {organizerPaymentDetails.additional_instructions && (
                  <div className="mt-2 pt-2 border-t">
                    <Label className="text-sm text-muted-foreground">Instructions</Label>
                    <p className="text-sm">{organizerPaymentDetails.additional_instructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Transaction Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="transaction_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter transaction ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transaction_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proof_file"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>Payment Proof</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onChange(file);
                        }
                      }}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any additional information about your payment"
                    className="h-20"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full mt-4" 
            disabled={isUploading || isDeadlinePassed}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : isDeadlinePassed ? (
              'Deadline Passed'
            ) : (
              'Submit Payment Details'
            )}
          </Button>
        </form>
      </div>
    </Form>
  );
};

export default PaymentSubmissionForm; 