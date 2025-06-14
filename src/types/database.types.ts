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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'manager' | 'organiser' | 'brand' | 'shopper'
          company_name: string | null
          phone: string | null
          description: string | null
          website_url: string | null
          facebook_url: string | null
          avatar_url: string | null
          banner_url: string | null
          portfolio_url: string | null
          gallery_images: string[] | null
          followers_count: number
          attendees_hosted: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role?: 'manager' | 'organiser' | 'brand' | 'shopper'
          company_name?: string | null
          phone?: string | null
          description?: string | null
          website_url?: string | null
          facebook_url?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          portfolio_url?: string | null
          gallery_images?: string[] | null
          followers_count?: number
          attendees_hosted?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'manager' | 'organiser' | 'brand' | 'shopper'
          company_name?: string | null
          phone?: string | null
          description?: string | null
          website_url?: string | null
          facebook_url?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          portfolio_url?: string | null
          gallery_images?: string[] | null
          followers_count?: number
          attendees_hosted?: number
          created_at?: string
          updated_at?: string
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
