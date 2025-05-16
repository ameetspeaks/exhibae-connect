import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaymentDialogProps {
  onCreatePayment?: (data: {
    amount: number;
    payment_method: string;
    reference_number?: string;
  }) => Promise<void>;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({ onCreatePayment }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  const handleSubmit = async () => {
    if (!amount || !paymentMethod) {
      return;
    }

    try {
      await onCreatePayment?.({
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        reference_number: referenceNumber || undefined,
      });
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  };

  const resetForm = () => {
    setAmount('');
    setPaymentMethod('');
    setReferenceNumber('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Record Payment</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2">₹</span>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-6"
                placeholder="Enter amount"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reference">Reference Number</Label>
            <Input
              id="reference"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Enter reference number (optional)"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!amount || !paymentMethod}>
            Record
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog; 