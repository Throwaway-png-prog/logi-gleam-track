export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          batch_number: string
          created_at: string
          id: string
          points_earned: number
          user_id: string
        }
        Insert: {
          batch_number: string
          created_at?: string
          id?: string
          points_earned: number
          user_id: string
        }
        Update: {
          batch_number?: string
          created_at?: string
          id?: string
          points_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_completions: {
        Row: {
          created_at: string
          id: string
          job_id: string
          points_earned: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          points_earned: number
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          points_earned?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_completions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string
          id: string
          image_url: string
          points: number
          title: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          description: string
          id?: string
          image_url: string
          points: number
          title: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          points?: number
          title?: string
        }
        Relationships: []
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          audience: string
          audience_value: string | null
          body: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          audience?: string
          audience_value?: string | null
          body: string
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          audience?: string
          audience_value?: string | null
          body?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      points_transactions: {
        Row: {
          created_at: string
          delta: number
          id: string
          reason: string
          ref_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          reason: string
          ref_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          reason?: string
          ref_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          brand: string
          category: string
          created_at: string
          est_minutes: string
          id: string
          image_url: string
          name: string
          platform: string
          points_reward: number
          price_ksh: number
        }
        Insert: {
          active?: boolean
          brand: string
          category: string
          created_at?: string
          est_minutes?: string
          id?: string
          image_url: string
          name: string
          platform: string
          points_reward: number
          price_ksh: number
        }
        Update: {
          active?: boolean
          brand?: string
          category?: string
          created_at?: string
          est_minutes?: string
          id?: string
          image_url?: string
          name?: string
          platform?: string
          points_reward?: number
          price_ksh?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          display_name_changed_at: string | null
          full_name: string
          id: string
          last_login_at: string | null
          last_reset_date: string
          last_review_date: string | null
          mpesa_number: string | null
          mpesa_verified: boolean
          phone: string
          pin: string
          points: number
          referral_code: string | null
          review_streak: number
          reviews_approved: number
          reviews_rejected: number
          role: string
          theme_pref: string
          tier: string
          units_today: number
          worker_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          display_name_changed_at?: string | null
          full_name?: string
          id?: string
          last_login_at?: string | null
          last_reset_date?: string
          last_review_date?: string | null
          mpesa_number?: string | null
          mpesa_verified?: boolean
          phone: string
          pin: string
          points?: number
          referral_code?: string | null
          review_streak?: number
          reviews_approved?: number
          reviews_rejected?: number
          role?: string
          theme_pref?: string
          tier?: string
          units_today?: number
          worker_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          display_name_changed_at?: string | null
          full_name?: string
          id?: string
          last_login_at?: string | null
          last_reset_date?: string
          last_review_date?: string | null
          mpesa_number?: string | null
          mpesa_verified?: boolean
          phone?: string
          pin?: string
          points?: number
          referral_code?: string | null
          review_streak?: number
          reviews_approved?: number
          reviews_rejected?: number
          role?: string
          theme_pref?: string
          tier?: string
          units_today?: number
          worker_id?: string
        }
        Relationships: []
      }
      redemption_requests: {
        Row: {
          created_at: string
          id: string
          ksh_value: number
          points_redeemed: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ksh_value: number
          points_redeemed: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ksh_value?: number
          points_redeemed?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemption_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_submissions: {
        Row: {
          created_at: string
          id: string
          points_reward: number
          product_id: string
          rating: number
          rejection_reason: string | null
          review_text: string
          screenshot_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_reward: number
          product_id: string
          rating: number
          rejection_reason?: string | null
          review_text: string
          screenshot_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points_reward?: number
          product_id?: string
          rating?: number
          rejection_reason?: string | null
          review_text?: string
          screenshot_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_submissions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          id: number
          maintenance: boolean
          redemptions_on_hold: boolean
          registration_open: boolean
          updated_at: string
        }
        Insert: {
          id?: number
          maintenance?: boolean
          redemptions_on_hold?: boolean
          registration_open?: boolean
          updated_at?: string
        }
        Update: {
          id?: number
          maintenance?: boolean
          redemptions_on_hold?: boolean
          registration_open?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      upgrade_requests: {
        Row: {
          amount_paid: number
          created_at: string
          id: string
          requested_tier: string
          status: string
          transaction_code: string
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          id?: string
          requested_tier: string
          status?: string
          transaction_code: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          id?: string
          requested_tier?: string
          status?: string
          transaction_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upgrade_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
