import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PaymentTransaction } from '@/types/exhibition-management';

export const usePaymentOperations = (applicationId: string) => {
  const queryClient = useQueryClient();

  const paymentTransactions = useQuery({
    queryKey: ['payment_transactions', applicationId],
    queryFn: async () => {
      if (!applicationId) return [];

      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('application_id', applicationId)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return data as PaymentTransaction[];
    },
    enabled: !!applicationId
  });

  const createPayment = useMutation({
    mutationFn: async (data: {
      amount: number;
      payment_method: string;
      reference_number?: string;
    }) => {
      const { data: transaction, error } = await supabase
        .from('payment_transactions')
        .insert({
          application_id: applicationId,
          amount: data.amount,
          payment_method: data.payment_method,
          reference_number: data.reference_number,
          status: 'processing'
        })
        .select()
        .single();

      if (error) throw error;
      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_transactions', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['stall_applications'] });
    }
  });

  const updatePaymentStatus = useMutation({
    mutationFn: async ({ transactionId, status }: { transactionId: string; status: PaymentTransaction['status'] }) => {
      const { data: transaction, error } = await supabase
        .from('payment_transactions')
        .update({ status })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;
      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_transactions', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['stall_applications'] });
    }
  });

  const refundPayment = useMutation({
    mutationFn: async (transactionId: string) => {
      const { data: transaction, error } = await supabase
        .from('payment_transactions')
        .update({ status: 'refunded' })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;
      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_transactions', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['stall_applications'] });
    }
  });

  return {
    paymentTransactions,
    createPayment,
    updatePaymentStatus,
    refundPayment
  };
}; 