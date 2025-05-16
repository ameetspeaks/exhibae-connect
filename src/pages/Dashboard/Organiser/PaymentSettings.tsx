import React from 'react';
import SettingsLayout from '@/pages/Dashboard/Settings/SettingsLayout';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const bankDetailsSchema = z.object({
  account_holder_name: z.string().min(2, 'Account holder name must be at least 2 characters'),
  bank_name: z.string().min(2, 'Bank name must be at least 2 characters'),
  account_number: z.string().min(8, 'Account number must be at least 8 characters'),
  ifsc_code: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'),
  branch: z.string().optional(),
});

const upiSchema = z.object({
  upi_address: z.string().regex(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/, 'Invalid UPI address format'),
});

type BankDetailsFormData = z.infer<typeof bankDetailsSchema>;
type UPIFormData = z.infer<typeof upiSchema>;

const PaymentSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [bankDetails, setBankDetails] = React.useState<BankDetailsFormData | null>(null);
  const [upiDetails, setUpiDetails] = React.useState<UPIFormData | null>(null);

  const bankForm = useForm<BankDetailsFormData>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      account_holder_name: '',
      bank_name: '',
      account_number: '',
      ifsc_code: '',
      branch: '',
    },
  });

  const upiForm = useForm<UPIFormData>({
    resolver: zodResolver(upiSchema),
    defaultValues: {
      upi_address: '',
    },
  });

  React.useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [bankResponse, upiResponse] = await Promise.all([
          supabase
            .from('organiser_bank_details')
            .select('*')
            .eq('organiser_id', user.id)
            .single(),
          supabase
            .from('organiser_upi_details')
            .select('*')
            .eq('organiser_id', user.id)
            .single(),
        ]);

        if (!bankResponse.error && bankResponse.data) {
          const bankData = {
            account_holder_name: bankResponse.data.account_holder_name,
            bank_name: bankResponse.data.bank_name,
            account_number: bankResponse.data.account_number,
            ifsc_code: bankResponse.data.ifsc_code,
            branch: bankResponse.data.branch || '',
          };
          setBankDetails(bankData);
          bankForm.reset(bankData);
        }

        if (!upiResponse.error && upiResponse.data) {
          const upiData = {
            upi_address: upiResponse.data.upi_address,
          };
          setUpiDetails(upiData);
          upiForm.reset(upiData);
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

    fetchData();
  }, [user, bankForm, upiForm, toast]);

  const onSubmit = async () => {
    if (!user) return;
    try {
      const bankData = bankForm.getValues();
      const upiData = upiForm.getValues();

      const [bankResponse, upiResponse] = await Promise.all([
        supabase
          .from('organiser_bank_details')
          .upsert({
            organiser_id: user.id,
            ...bankData,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single(),
        supabase
          .from('organiser_upi_details')
          .upsert({
            organiser_id: user.id,
            ...upiData,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single(),
      ]);

      if (bankResponse.error) throw bankResponse.error;
      if (upiResponse.error) throw upiResponse.error;

      setBankDetails(bankData);
      setUpiDetails(upiData);
      setIsEditing(false);

      toast({
        title: 'Success',
        description: 'Payment details updated successfully',
      });
    } catch (error) {
      console.error('Error updating payment details:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment details',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <SettingsLayout basePath="/dashboard/organiser/settings">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-exhibae-navy" />
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout basePath="/dashboard/organiser/settings">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Payment Settings</h1>
            <p className="text-gray-600">Manage your payment details for receiving payments</p>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4" />
              Edit Payment Details
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bank Account Details</CardTitle>
            <CardDescription>Your bank account information for receiving payments</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Form {...bankForm}>
                <form className="space-y-6">
                  <FormField
                    control={bankForm.control}
                    name="account_holder_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Holder Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter account holder name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bankForm.control}
                    name="bank_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter bank name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bankForm.control}
                    name="account_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter account number" type="text" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bankForm.control}
                    name="ifsc_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IFSC Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter IFSC code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bankForm.control}
                    name="branch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter branch name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Account Holder Name</p>
                  <p className="text-base">{bankDetails?.account_holder_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Bank Name</p>
                  <p className="text-base">{bankDetails?.bank_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Account Number</p>
                  <p className="text-base">{bankDetails?.account_number || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">IFSC Code</p>
                  <p className="text-base">{bankDetails?.ifsc_code || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Branch</p>
                  <p className="text-base">{bankDetails?.branch || '-'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>UPI Details</CardTitle>
            <CardDescription>Your UPI address for receiving payments</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Form {...upiForm}>
                <form className="space-y-6">
                  <FormField
                    control={upiForm.control}
                    name="upi_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UPI Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter UPI address (e.g., username@upi)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">UPI Address</p>
                <p className="text-base">{upiDetails?.upi_address || '-'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {isEditing && (
          <div className="flex gap-4">
            <Button onClick={onSubmit}>Save Changes</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                bankForm.reset(bankDetails || undefined);
                upiForm.reset(upiDetails || undefined);
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </SettingsLayout>
  );
};

export default PaymentSettings; 