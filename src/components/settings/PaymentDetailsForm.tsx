import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

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

interface PaymentDetailsFormProps {
  initialBankDetails?: BankDetailsFormData & { id?: string };
  initialUPIDetails?: UPIFormData & { id?: string };
}

export const PaymentDetailsForm: React.FC<PaymentDetailsFormProps> = ({
  initialBankDetails,
  initialUPIDetails,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoadingBank, setIsLoadingBank] = React.useState(false);
  const [isLoadingUPI, setIsLoadingUPI] = React.useState(false);

  const bankForm = useForm<BankDetailsFormData>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: initialBankDetails || {
      account_holder_name: '',
      bank_name: '',
      account_number: '',
      ifsc_code: '',
      branch: '',
    },
  });

  const upiForm = useForm<UPIFormData>({
    resolver: zodResolver(upiSchema),
    defaultValues: initialUPIDetails || {
      upi_address: '',
    },
  });

  const onSubmitBankDetails = async (data: BankDetailsFormData) => {
    if (!user) return;
    setIsLoadingBank(true);

    try {
      const { error } = initialBankDetails?.id
        ? await supabase
            .from('organiser_bank_details')
            .update({
              ...data,
              updated_at: new Date().toISOString(),
            })
            .eq('id', initialBankDetails.id)
        : await supabase
            .from('organiser_bank_details')
            .insert([
              {
                ...data,
                organiser_id: user.id,
              },
            ]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Bank details saved successfully',
      });
    } catch (error) {
      console.error('Error saving bank details:', error);
      toast({
        title: 'Error',
        description: 'Failed to save bank details',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingBank(false);
    }
  };

  const onSubmitUPIDetails = async (data: UPIFormData) => {
    if (!user) return;
    setIsLoadingUPI(true);

    try {
      const { error } = initialUPIDetails?.id
        ? await supabase
            .from('organiser_upi_details')
            .update({
              ...data,
              updated_at: new Date().toISOString(),
            })
            .eq('id', initialUPIDetails.id)
        : await supabase
            .from('organiser_upi_details')
            .insert([
              {
                ...data,
                organiser_id: user.id,
              },
            ]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'UPI details saved successfully',
      });
    } catch (error) {
      console.error('Error saving UPI details:', error);
      toast({
        title: 'Error',
        description: 'Failed to save UPI details',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingUPI(false);
    }
  };

  const deleteBankDetails = async () => {
    if (!initialBankDetails?.id || !user) return;

    try {
      const { error } = await supabase
        .from('organiser_bank_details')
        .delete()
        .eq('id', initialBankDetails.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Bank details deleted successfully',
      });

      bankForm.reset({
        account_holder_name: '',
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        branch: '',
      });
    } catch (error) {
      console.error('Error deleting bank details:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete bank details',
        variant: 'destructive',
      });
    }
  };

  const deleteUPIDetails = async () => {
    if (!initialUPIDetails?.id || !user) return;

    try {
      const { error } = await supabase
        .from('organiser_upi_details')
        .delete()
        .eq('id', initialUPIDetails.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'UPI details deleted successfully',
      });

      upiForm.reset({
        upi_address: '',
      });
    } catch (error) {
      console.error('Error deleting UPI details:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete UPI details',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bank Account Details</CardTitle>
          <CardDescription>Add or update your bank account information for receiving payments</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...bankForm}>
            <form onSubmit={bankForm.handleSubmit(onSubmitBankDetails)} className="space-y-4">
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
                      <Input placeholder="Enter account number" {...field} />
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
                    <FormDescription>
                      Example: HDFC0001234
                    </FormDescription>
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
              <div className="flex justify-between items-center pt-2">
                <Button
                  type="submit"
                  disabled={isLoadingBank}
                  className="w-32"
                >
                  {isLoadingBank && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
                {initialBankDetails?.id && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={deleteBankDetails}
                    className="w-32"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>UPI Details</CardTitle>
          <CardDescription>Add or update your UPI address for receiving payments</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...upiForm}>
            <form onSubmit={upiForm.handleSubmit(onSubmitUPIDetails)} className="space-y-4">
              <FormField
                control={upiForm.control}
                name="upi_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UPI Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter UPI address" {...field} />
                    </FormControl>
                    <FormDescription>
                      Example: username@upi
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between items-center pt-2">
                <Button
                  type="submit"
                  disabled={isLoadingUPI}
                  className="w-32"
                >
                  {isLoadingUPI && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
                {initialUPIDetails?.id && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={deleteUPIDetails}
                    className="w-32"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentDetailsForm; 