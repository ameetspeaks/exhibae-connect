export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      exhibitions: {
        Row: {
          id: string
          title: string
          description: string | null
          start_date: string
          end_date: string
          address: string
          city: string
          state: string
          country: string
          postal_code: string
          status: 'draft' | 'published' | 'cancelled' | 'completed'
          organiser_id: string
          venue_type_id: string
          category_id: string
          measuring_unit_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          start_date: string
          end_date: string
          address: string
          city: string
          state: string
          country: string
          postal_code: string
          status?: 'draft' | 'published' | 'cancelled' | 'completed'
          organiser_id: string
          venue_type_id: string
          category_id: string
          measuring_unit_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string
          address?: string
          city?: string
          state?: string
          country?: string
          postal_code?: string
          status?: 'draft' | 'published' | 'cancelled' | 'completed'
          organiser_id?: string
          venue_type_id?: string
          category_id?: string
          measuring_unit_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'manager' | 'organiser' | 'brand' | 'shopper'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role: 'manager' | 'organiser' | 'brand' | 'shopper'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'manager' | 'organiser' | 'brand' | 'shopper'
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'exhibition_created' | 'exhibition_status_updated' | 'exhibition_updated' | 'general' | 
                 'stall_application' | 'stall_application_approved' | 'stall_payment_complete' | 'stall_booking_confirmed'
          link: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'exhibition_created' | 'exhibition_status_updated' | 'exhibition_updated' | 'general' | 
                 'stall_application' | 'stall_application_approved' | 'stall_payment_complete' | 'stall_booking_confirmed'
          link: string
          is_read: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'exhibition_created' | 'exhibition_status_updated' | 'exhibition_updated' | 'general' | 
                 'stall_application' | 'stall_application_approved' | 'stall_payment_complete' | 'stall_booking_confirmed'
          link?: string
          is_read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 