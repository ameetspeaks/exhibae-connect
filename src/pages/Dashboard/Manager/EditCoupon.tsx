import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { PostgrestError } from '@supabase/supabase-js';

const EditCoupon = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchCoupon = async () => {
      if (!id) {
        navigate('/dashboard/manager/coupons');
        return;
      }

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
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            toast({
              title: 'Error',
              description: 'Coupon not found.',
              variant: 'destructive',
            });
            navigate('/dashboard/manager/coupons');
            return;
          }
          throw error;
        }

        if (!rawData) {
          toast({
            title: 'Error',
            description: 'Coupon not found.',
            variant: 'destructive',
          });
          navigate('/dashboard/manager/coupons');
          return;
        }

        const transformedData = transformCouponData(rawData);
        setCoupon(transformedData);
      } catch (error) {
        console.error('Error fetching coupon:', error);
        let errorMessage = 'Failed to fetch coupon details.';
        
        if (error instanceof PostgrestError) {
          errorMessage = error.message;
        }
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        navigate('/dashboard/manager/coupons');
      } finally {
        setIsFetching(false);
      }
    };

    fetchCoupon();
  }, [id, navigate, toast]);

  const handleSubmit = async (data: CreateCouponDTO) => {
    if (!id || !coupon) return;

    try {
      setIsLoading(true);

      // Validate dates
      if (data.start_date && data.end_date) {
        const startDate = new Date(data.start_date);
        const endDate = new Date(data.end_date);
        if (endDate < startDate) {
          toast({
            title: 'Error',
            description: 'End date cannot be before start date.',
            variant: 'destructive',
          });
          return;
        }
      }

      // Validate value based on type
      if (data.type === 'percentage' && data.value > 100) {
        toast({
          title: 'Error',
          description: 'Percentage discount cannot be greater than 100%.',
          variant: 'destructive',
        });
        return;
      }

      // Prepare update data
      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
        // Only include exhibition_id if scope is specific_exhibition
        exhibition_id: data.scope === 'specific_exhibition' ? data.exhibition_id : null,
        // Only include brand_id if scope is specific_brand
        brand_id: data.scope === 'specific_brand' ? data.brand_id : null,
        // Convert dates to ISO strings if they exist
        start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
        end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
      };

      const { error } = await supabase
        .from('coupons')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Coupon updated successfully.',
      });

      navigate('/dashboard/manager/coupons');
    } catch (error) {
      console.error('Error updating coupon:', error);
      let errorMessage = 'Failed to update coupon. Please try again.';
      
      if (error instanceof PostgrestError) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
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
          Update the details of the discount coupon
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