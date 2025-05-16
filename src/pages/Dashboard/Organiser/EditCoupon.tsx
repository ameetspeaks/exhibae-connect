import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Coupon, CreateCouponDTO } from '@/types/coupon';
import { transformCouponData } from '@/utils/coupon';
import { CouponForm } from '@/components/forms/CouponForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const EditCoupon = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchCoupon = async () => {
      if (!user || !id) return;

      try {
        const { data: rawData, error } = await supabase
          .from('coupons')
          .select(`
            *,
            exhibitions (title),
            brand:profiles!coupons_brand_id_fkey (email),
            organiser:profiles!coupons_organiser_id_fkey (email)
          `)
          .eq('id', id)
          .eq('organiser_id', user.id)
          .single();

        if (error) throw error;
        if (!rawData) {
          toast({
            title: 'Error',
            description: 'Coupon not found.',
            variant: 'destructive',
          });
          navigate('/dashboard/organiser/coupons');
          return;
        }

        const transformedData = transformCouponData(rawData);
        setCoupon(transformedData);
      } catch (error: any) {
        console.error('Error fetching coupon:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch coupon details.',
          variant: 'destructive',
        });
        navigate('/dashboard/organiser/coupons');
      } finally {
        setIsFetching(false);
      }
    };

    fetchCoupon();
  }, [user, id, navigate, toast]);

  const handleSubmit = async (data: CreateCouponDTO) => {
    if (!user || !id) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('coupons')
        .update(data)
        .eq('id', id)
        .eq('organiser_id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Coupon updated successfully.',
      });

      navigate('/dashboard/organiser/coupons');
    } catch (error: any) {
      console.error('Error updating coupon:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update coupon. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!coupon) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Coupon</h1>
        <p className="text-muted-foreground">
          Update the details of your discount coupon
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coupon Details</CardTitle>
          <CardDescription>
            Modify the details of your coupon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CouponForm
            initialData={coupon}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EditCoupon; 