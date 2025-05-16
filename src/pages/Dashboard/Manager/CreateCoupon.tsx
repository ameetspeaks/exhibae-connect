import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreateCouponDTO } from '@/types/coupon';
import { CouponForm } from '@/components/forms/CouponForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const CreateCoupon = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateCouponDTO) => {
    if (!user) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('coupons')
        .insert([
          {
            ...data,
            organiser_id: user.id,
          },
        ]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Coupon created successfully.',
      });

      navigate('/dashboard/manager/coupons');
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create coupon. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Coupon</h1>
        <p className="text-muted-foreground">
          Create a new discount coupon for exhibitions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coupon Details</CardTitle>
          <CardDescription>
            Fill in the details for your new coupon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CouponForm onSubmit={handleSubmit} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateCoupon; 