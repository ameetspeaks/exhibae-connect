import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Coupon } from '@/types/coupon';
import { transformCouponData } from '@/utils/coupon';

interface UseCouponProps {
  exhibitionId?: string;
  brandId?: string;
  amount: number;
}

interface UseCouponReturn {
  coupon: Coupon | null;
  appliedDiscount: number;
  isLoading: boolean;
  error: string | null;
  validateCoupon: (code: string) => Promise<void>;
  clearCoupon: () => void;
}

export function useCoupon({ exhibitionId, brandId, amount }: UseCouponProps): UseCouponReturn {
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateCoupon = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch coupon details
      const { data: rawData, error: fetchError } = await supabase
        .from('coupons')
        .select('*, exhibitions(title), auth.users!coupons_brand_id_fkey(email)')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (fetchError) throw new Error('Invalid coupon code');
      if (!rawData) throw new Error('Coupon not found');

      const coupon = transformCouponData(rawData);

      // Validate coupon scope
      if (coupon.scope === 'specific_exhibition' && coupon.exhibition_id !== exhibitionId) {
        throw new Error('This coupon is not valid for this exhibition');
      }

      if (coupon.scope === 'specific_brand' && coupon.brand_id !== brandId) {
        throw new Error('This coupon is not valid for your brand');
      }

      // Validate usage limit
      if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
        throw new Error('This coupon has reached its usage limit');
      }

      // Validate minimum booking amount
      if (coupon.min_booking_amount && amount < coupon.min_booking_amount) {
        throw new Error(`Minimum booking amount of $${coupon.min_booking_amount} required`);
      }

      // Validate date range
      const now = new Date();
      if (coupon.start_date && new Date(coupon.start_date) > now) {
        throw new Error('This coupon is not yet active');
      }
      if (coupon.end_date && new Date(coupon.end_date) < now) {
        throw new Error('This coupon has expired');
      }

      setCoupon(coupon);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate coupon');
      setCoupon(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCoupon = () => {
    setCoupon(null);
    setError(null);
  };

  const calculateDiscount = (coupon: Coupon | null, amount: number): number => {
    if (!coupon) return 0;

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (amount * coupon.value) / 100;
    } else {
      discount = coupon.value;
    }

    // Apply maximum discount limit if set
    if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
      discount = coupon.max_discount_amount;
    }

    return discount;
  };

  return {
    coupon,
    appliedDiscount: calculateDiscount(coupon, amount),
    isLoading,
    error,
    validateCoupon,
    clearCoupon,
  };
} 