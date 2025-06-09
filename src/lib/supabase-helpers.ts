import { Database } from '@/types/database.types';
import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

// Type helpers
export type Tables = Database['public']['Tables'];
export type TableName = keyof Tables;

// Make insert types more specific by removing auto-generated fields
export type InsertType<T extends TableName> = Omit<
  Tables[T]['Row'],
  'id' | 'created_at' | 'updated_at'
>;

// Error handling helper
export const handleSupabaseError = (error: unknown): string => {
  if (error instanceof PostgrestError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
};

// Type guard for Supabase errors
export const isPostgrestError = (error: unknown): error is PostgrestError => {
  return error instanceof PostgrestError;
};

// Helper types for specific tables
export type ExhibitionInterestInsert = InsertType<'exhibition_interests'>;
export type OrganiserFollowerInsert = InsertType<'organiser_followers'>;

// Type-safe database operation helpers
export const dbOperations = {
  insertExhibitionInterest: async (
    supabase: SupabaseClient<Database>,
    data: ExhibitionInterestInsert
  ) => {
    return supabase
      .from('exhibition_interests')
      .insert([data])
      .select()
      .single();
  },

  removeExhibitionInterest: async (
    supabase: SupabaseClient<Database>,
    exhibitionId: string,
    brandId: string
  ) => {
    return supabase
      .from('exhibition_interests')
      .delete()
      .match({
        exhibition_id: exhibitionId,
        brand_id: brandId
      });
  },

  insertOrganiserFollower: async (
    supabase: SupabaseClient<Database>,
    data: OrganiserFollowerInsert
  ) => {
    return supabase
      .from('organiser_followers')
      .insert([data])
      .select()
      .single();
  },

  removeOrganiserFollower: async (
    supabase: SupabaseClient<Database>,
    organiserId: string,
    followerId: string
  ) => {
    return supabase
      .from('organiser_followers')
      .delete()
      .match({
        organiser_id: organiserId,
        follower_id: followerId
      });
  },

  checkExhibitionInterest: async (
    supabase: SupabaseClient<Database>,
    exhibitionId: string,
    brandId: string
  ) => {
    return supabase
      .from('exhibition_interests')
      .select('id')
      .match({
        exhibition_id: exhibitionId,
        brand_id: brandId
      })
      .maybeSingle();
  },

  checkOrganiserFollower: async (
    supabase: SupabaseClient<Database>,
    organiserId: string,
    followerId: string
  ) => {
    return supabase
      .from('organiser_followers')
      .select('id')
      .match({
        organiser_id: organiserId,
        follower_id: followerId
      })
      .maybeSingle();
  }
}; 