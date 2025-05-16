export type CouponType = 'percentage' | 'fixed';
export type CouponScope = 'all_exhibitions' | 'specific_exhibition' | 'all_brands' | 'specific_brand';

// Base coupon type without relations
interface BaseCoupon {
    id: string;
    organiser_id: string;
    code: string;
    description?: string;
    type: CouponType;
    value: number;
    scope: CouponScope;
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
}

// Type for the coupon with UI-friendly relations
export interface Coupon extends BaseCoupon {
    exhibitions?: {
        title: string;
    } | null;
    users?: {
        email: string;
    } | null;
    organiser?: {
        email: string;
    } | null;
}

// Type for the raw database response
export interface CouponWithRelations extends BaseCoupon {
    exhibitions?: {
        title: string;
    } | null;
    "auth.users"?: {
        email: string;
    } | null;
    "profiles"?: {
        email: string;
    } | null;
}

export interface CreateCouponDTO {
    code: string;
    description?: string;
    type: CouponType;
    value: number;
    scope: CouponScope;
    exhibition_id?: string;
    brand_id?: string;
    min_booking_amount?: number;
    max_discount_amount?: number;
    usage_limit?: number;
    start_date?: string;
    end_date?: string;
}

export interface UpdateCouponDTO extends Partial<CreateCouponDTO> {
    is_active?: boolean;
}

// Type guard function to validate the raw database response
export function isValidCouponResponse(data: unknown): data is CouponWithRelations {
    if (!data || typeof data !== 'object') return false;
    
    const d = data as any;
    return (
        typeof d.id === 'string' &&
        typeof d.organiser_id === 'string' &&
        typeof d.code === 'string' &&
        (d.type === 'percentage' || d.type === 'fixed') &&
        typeof d.value === 'number' &&
        (
            d.scope === 'all_exhibitions' ||
            d.scope === 'specific_exhibition' ||
            d.scope === 'all_brands' ||
            d.scope === 'specific_brand'
        ) &&
        typeof d.times_used === 'number' &&
        typeof d.is_active === 'boolean' &&
        typeof d.created_at === 'string' &&
        typeof d.updated_at === 'string'
    );
}

// Helper function to transform raw response to Coupon type
export function transformToCoupon(data: CouponWithRelations): Coupon {
    return {
        ...data,
        users: data['auth.users'] ? { email: data['auth.users'].email } : null,
        organiser: data['profiles'] ? { email: data['profiles'].email } : null,
    };
} 