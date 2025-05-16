import { Coupon } from '@/types/coupon';
import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface CouponQueryResult {
  id: string;
}

export async function checkCouponCodeExists(code: string, excludeId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('coupons')
      .select('id');
    
    // If we're updating an existing coupon, exclude it from the check
    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    query = query.eq('code', code);
    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return false;
      }
      throw error;
    }

    return !!data;
  } catch (error) {
    if (error instanceof PostgrestError) {
      console.error('Database error checking coupon code:', error.message);
    } else {
      console.error('Error checking coupon code:', error);
    }
    return false;
  }
}

interface CouponRawData {
  id: string;
  organiser_id: string;
  code: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  scope: 'all_exhibitions' | 'specific_exhibition' | 'all_brands' | 'specific_brand';
  exhibition_id?: string;
  brand_id?: string;
  min_booking_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  times_used: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  exhibitions?: { title: string } | null;
  brand?: { email: string } | null;
  organiser?: { email: string } | null;
}

export function transformCouponData(rawData: CouponRawData): Coupon {
  return {
    id: rawData.id,
    organiser_id: rawData.organiser_id,
    code: rawData.code,
    description: rawData.description,
    type: rawData.type,
    value: rawData.value,
    scope: rawData.scope,
    exhibition_id: rawData.exhibition_id,
    brand_id: rawData.brand_id,
    min_booking_amount: rawData.min_booking_amount,
    max_discount_amount: rawData.max_discount_amount,
    usage_limit: rawData.usage_limit,
    times_used: rawData.times_used,
    start_date: rawData.start_date,
    end_date: rawData.end_date,
    is_active: rawData.is_active,
    created_at: rawData.created_at,
    updated_at: rawData.updated_at,
    exhibitions: rawData.exhibitions,
    users: rawData.brand ? { email: rawData.brand.email } : null,
    organiser: rawData.organiser ? { email: rawData.organiser.email } : null,
  };
} 