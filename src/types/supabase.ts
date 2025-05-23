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
          start_date: string
          end_date: string
          organiser_id: string
          created_at: string
          updated_at: string
        }
      }
      exhibition_attending: {
        Row: {
          id: string
          user_id: string
          exhibition_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exhibition_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exhibition_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      stall_applications: {
        Row: {
          id: string
          exhibition_id: string
          brand_id: string
          stall_id: string
          status: string
          created_at: string
          updated_at: string
          payment_status?: string
          payment_date?: string
          booking_confirmed?: boolean
        }
      }
      payment_submissions: {
        Row: {
          id: string
          application_id: string
          amount: number
          transaction_id: string
          email: string
          proof_file_url?: string
          notes?: string
          status: 'pending_review' | 'approved' | 'rejected'
          rejection_reason?: string
          rejection_date?: string
          reviewed_at?: string
          reviewed_by?: string
          created_at: string
          updated_at: string
        }
      }
      profiles: {
        Row: {
          id: string
          business_name: string
          email: string
        }
      }
      stalls: {
        Row: {
          id: string
          name: string
          price: number
        }
      }
    }
  }
} 