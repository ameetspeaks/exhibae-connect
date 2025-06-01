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
      brand_profiles: {
        Row: {
          id: string
          user_id: string
          company_name: string
          description: string | null
          website: string | null
          contact_email: string
          contact_phone: string | null
          logo_url: string | null
          cover_image_url: string | null
          facebook_url: string | null
          instagram_url: string | null
          twitter_url: string | null
          linkedin_url: string | null
          threads_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          description?: string | null
          website?: string | null
          contact_email: string
          contact_phone?: string | null
          logo_url?: string | null
          cover_image_url?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          twitter_url?: string | null
          linkedin_url?: string | null
          threads_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          description?: string | null
          website?: string | null
          contact_email?: string
          contact_phone?: string | null
          logo_url?: string | null
          cover_image_url?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          twitter_url?: string | null
          linkedin_url?: string | null
          threads_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      brand_lookbooks: {
        Row: {
          id: string
          brand_id: string
          title: string
          description: string | null
          file_url: string
          file_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          title: string
          description?: string | null
          file_url: string
          file_type: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          title?: string
          description?: string | null
          file_url?: string
          file_type?: string
          created_at?: string
          updated_at?: string
        }
      }
      brand_gallery: {
        Row: {
          id: string
          brand_id: string
          title: string | null
          description: string | null
          image_url: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          title?: string | null
          description?: string | null
          image_url: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          title?: string | null
          description?: string | null
          image_url?: string
          created_at?: string
          updated_at?: string
        }
      }
      notification_settings: {
        Row: {
          id: string
          user_id: string
          email_notifications: boolean
          desktop_notifications: boolean
          sound_enabled: boolean
          user_registered_enabled: boolean
          exhibition_created_enabled: boolean
          stall_booked_enabled: boolean
          stall_updated_enabled: boolean
          application_received_enabled: boolean
          exhibition_reminder_enabled: boolean
          payment_reminder_enabled: boolean
          exhibition_cancelled_enabled: boolean
          exhibition_updated_enabled: boolean
          message_received_enabled: boolean
          comment_received_enabled: boolean
          review_submitted_enabled: boolean
          review_response_enabled: boolean
          profile_updated_enabled: boolean
          document_uploaded_enabled: boolean
          document_approved_enabled: boolean
          document_rejected_enabled: boolean
          exhibition_status_updated_enabled: boolean
          payment_status_updated_enabled: boolean
          stall_application_received_enabled: boolean
          stall_approved_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_notifications?: boolean
          desktop_notifications?: boolean
          sound_enabled?: boolean
          user_registered_enabled?: boolean
          exhibition_created_enabled?: boolean
          stall_booked_enabled?: boolean
          stall_updated_enabled?: boolean
          application_received_enabled?: boolean
          exhibition_reminder_enabled?: boolean
          payment_reminder_enabled?: boolean
          exhibition_cancelled_enabled?: boolean
          exhibition_updated_enabled?: boolean
          message_received_enabled?: boolean
          comment_received_enabled?: boolean
          review_submitted_enabled?: boolean
          review_response_enabled?: boolean
          profile_updated_enabled?: boolean
          document_uploaded_enabled?: boolean
          document_approved_enabled?: boolean
          document_rejected_enabled?: boolean
          exhibition_status_updated_enabled?: boolean
          payment_status_updated_enabled?: boolean
          stall_application_received_enabled?: boolean
          stall_approved_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_notifications?: boolean
          desktop_notifications?: boolean
          sound_enabled?: boolean
          user_registered_enabled?: boolean
          exhibition_created_enabled?: boolean
          stall_booked_enabled?: boolean
          stall_updated_enabled?: boolean
          application_received_enabled?: boolean
          exhibition_reminder_enabled?: boolean
          payment_reminder_enabled?: boolean
          exhibition_cancelled_enabled?: boolean
          exhibition_updated_enabled?: boolean
          message_received_enabled?: boolean
          comment_received_enabled?: boolean
          review_submitted_enabled?: boolean
          review_response_enabled?: boolean
          profile_updated_enabled?: boolean
          document_uploaded_enabled?: boolean
          document_approved_enabled?: boolean
          document_rejected_enabled?: boolean
          exhibition_status_updated_enabled?: boolean
          payment_status_updated_enabled?: boolean
          stall_application_received_enabled?: boolean
          stall_approved_enabled?: boolean
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
