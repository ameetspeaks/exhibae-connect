import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface PaymentFormProps {
  stallPrice: number;
  onSubmit: (data: {
    amount: number;
    payment_method: string;
    reference_number?: string;
  }) => Promise<void>;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  stallPrice,
  onSubmit
}) => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        amount: stallPrice,
        payment_method: paymentMethod,
        reference_number: referenceNumber
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Please complete the payment to confirm your stall booking.
          The total amount due is ₹{stallPrice.toLocaleString()}.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Payment Method</Label>
          <Select
            value={paymentMethod}
            onValueChange={setPaymentMethod}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="credit_card">Credit Card</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Reference Number (Optional)</Label>
          <Input
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="Enter payment reference number"
          />
        </div>

        <div className="space-y-2">
          <Label>Amount</Label>
          <div className="font-medium text-lg">
            ₹{stallPrice.toLocaleString()}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!paymentMethod || isSubmitting}
      >
        {isSubmitting ? 'Processing...' : 'Complete Payment'}
      </Button>
    </form>
  );
}; 