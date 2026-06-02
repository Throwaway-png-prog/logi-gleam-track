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
      admin_actions: {
        Row: {
          action: string
          admin_label: string | null
          created_at: string
          id: string
          metadata: Json | null
          reason: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          admin_label?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          admin_label?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string | null
          admin_label: string | null
          created_at: string
          id: string
          metadata: Json
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          admin_label?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          admin_label?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_user_id?: string | null
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          challenge_key: string
          completed_at: string | null
          created_at: string
          date: string
          id: string
          progress: number
          reward_ksh: number
          target: number
          user_id: string
        }
        Insert: {
          challenge_key: string
          completed_at?: string | null
          created_at?: string
          date?: string
          id?: string
          progress?: number
          reward_ksh: number
          target: number
          user_id: string
        }
        Update: {
          challenge_key?: string
          completed_at?: string | null
          created_at?: string
          date?: string
          id?: string
          progress?: number
          reward_ksh?: number
          target?: number
          user_id?: string
        }
        Relationships: []
      }
      emergency_alerts: {
        Row: {
          admin_id: string | null
          created_at: string
          duration_seconds: number
          id: string
          message: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          duration_seconds?: number
          id?: string
          message: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          duration_seconds?: number
          id?: string
          message?: string
        }
        Relationships: []
      }
      fraud_flags: {
        Row: {
          created_at: string
          evidence: Json
          id: string
          kind: string
          score_delta: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          evidence?: Json
          id?: string
          kind: string
          score_delta?: number
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          evidence?: Json
          id?: string
          kind?: string
          score_delta?: number
          status?: string
          user_id?: string
        }
        Relationships: []
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
      login_attempts: {
        Row: {
          attempted_at: string
          id: string
          lockout_until: string | null
          phone_masked: string
          success: boolean
        }
        Insert: {
          attempted_at?: string
          id?: string
          lockout_until?: string | null
          phone_masked: string
          success?: boolean
        }
        Update: {
          attempted_at?: string
          id?: string
          lockout_until?: string | null
          phone_masked?: string
          success?: boolean
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
      mpesa_codes: {
        Row: {
          amount_ksh: number | null
          code: string
          created_at: string
          id: string
          used_for: string
          user_id: string
        }
        Insert: {
          amount_ksh?: number | null
          code: string
          created_at?: string
          id?: string
          used_for: string
          user_id: string
        }
        Update: {
          amount_ksh?: number | null
          code?: string
          created_at?: string
          id?: string
          used_for?: string
          user_id?: string
        }
        Relationships: []
      }
      news_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          news_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          news_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          news_id?: string
          user_id?: string
        }
        Relationships: []
      }
      news_items: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          featured: boolean
          id: string
          image_url: string | null
          kind: string
          publish_at: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          kind?: string
          publish_at?: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          kind?: string
          publish_at?: string
          title?: string
        }
        Relationships: []
      }
      news_likes: {
        Row: {
          created_at: string
          id: string
          news_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          news_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          news_id?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_numbers: {
        Row: {
          active: boolean
          created_at: string
          id: string
          label: string
          last_used_at: string | null
          msisdn: string
          use_count: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          label: string
          last_used_at?: string | null
          msisdn: string
          use_count?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          label?: string
          last_used_at?: string | null
          msisdn?: string
          use_count?: number
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
      product_views: {
        Row: {
          id: string
          product_id: string
          seen_at: string
          user_id: string
        }
        Insert: {
          id?: string
          product_id: string
          seen_at?: string
          user_id: string
        }
        Update: {
          id?: string
          product_id?: string
          seen_at?: string
          user_id?: string
        }
        Relationships: []
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
          achievements: Json
          avatar_url: string | null
          blocked: boolean
          blocked_reason: string | null
          consecutive_login_days: number
          created_at: string
          current_streak: number
          deleted_at: string | null
          device_fingerprints: Json
          display_name: string
          display_name_changed_at: string | null
          failed_login_count: number
          fraud_score: number
          full_name: string
          id: string
          interview_responses: Json | null
          is_admin: boolean
          jobs_in_tier: number
          last_active_at: string | null
          last_app_open: string | null
          last_login_at: string | null
          last_nudge_at: string | null
          last_reset_date: string
          last_review_date: string | null
          last_streak_date: string | null
          lifetime_earned: number
          lockout_until: string | null
          longest_streak: number
          mpesa_number: string | null
          mpesa_verified: boolean
          phone: string
          pin: string
          pin_hashed: boolean
          pin_salt: string | null
          points: number
          referral_code: string | null
          referral_count: number
          referred_by: string | null
          review_streak: number
          reviews_approved: number
          reviews_rejected: number
          role: string
          signup_date: string | null
          terms_accepted_at: string | null
          theme_pref: string
          tier: string
          total_referral_earnings: number
          units_today: number
          vip_level: number
          vip0_claimed: boolean
          warnings: number
          worker_id: string
        }
        Insert: {
          achievements?: Json
          avatar_url?: string | null
          blocked?: boolean
          blocked_reason?: string | null
          consecutive_login_days?: number
          created_at?: string
          current_streak?: number
          deleted_at?: string | null
          device_fingerprints?: Json
          display_name?: string
          display_name_changed_at?: string | null
          failed_login_count?: number
          fraud_score?: number
          full_name?: string
          id?: string
          interview_responses?: Json | null
          is_admin?: boolean
          jobs_in_tier?: number
          last_active_at?: string | null
          last_app_open?: string | null
          last_login_at?: string | null
          last_nudge_at?: string | null
          last_reset_date?: string
          last_review_date?: string | null
          last_streak_date?: string | null
          lifetime_earned?: number
          lockout_until?: string | null
          longest_streak?: number
          mpesa_number?: string | null
          mpesa_verified?: boolean
          phone: string
          pin: string
          pin_hashed?: boolean
          pin_salt?: string | null
          points?: number
          referral_code?: string | null
          referral_count?: number
          referred_by?: string | null
          review_streak?: number
          reviews_approved?: number
          reviews_rejected?: number
          role?: string
          signup_date?: string | null
          terms_accepted_at?: string | null
          theme_pref?: string
          tier?: string
          total_referral_earnings?: number
          units_today?: number
          vip_level?: number
          vip0_claimed?: boolean
          warnings?: number
          worker_id: string
        }
        Update: {
          achievements?: Json
          avatar_url?: string | null
          blocked?: boolean
          blocked_reason?: string | null
          consecutive_login_days?: number
          created_at?: string
          current_streak?: number
          deleted_at?: string | null
          device_fingerprints?: Json
          display_name?: string
          display_name_changed_at?: string | null
          failed_login_count?: number
          fraud_score?: number
          full_name?: string
          id?: string
          interview_responses?: Json | null
          is_admin?: boolean
          jobs_in_tier?: number
          last_active_at?: string | null
          last_app_open?: string | null
          last_login_at?: string | null
          last_nudge_at?: string | null
          last_reset_date?: string
          last_review_date?: string | null
          last_streak_date?: string | null
          lifetime_earned?: number
          lockout_until?: string | null
          longest_streak?: number
          mpesa_number?: string | null
          mpesa_verified?: boolean
          phone?: string
          pin?: string
          pin_hashed?: boolean
          pin_salt?: string | null
          points?: number
          referral_code?: string | null
          referral_count?: number
          referred_by?: string | null
          review_streak?: number
          reviews_approved?: number
          reviews_rejected?: number
          role?: string
          signup_date?: string | null
          terms_accepted_at?: string | null
          theme_pref?: string
          tier?: string
          total_referral_earnings?: number
          units_today?: number
          vip_level?: number
          vip0_claimed?: boolean
          warnings?: number
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
      referral_earnings: {
        Row: {
          amount_ksh: number
          created_at: string
          id: string
          kind: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          amount_ksh: number
          created_at?: string
          id?: string
          kind?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          amount_ksh?: number
          created_at?: string
          id?: string
          kind?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
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
          emergency_active: boolean
          emergency_duration_seconds: number
          emergency_message: string | null
          emergency_started_at: string | null
          id: number
          maintenance: boolean
          payment_rotation_mode: string
          redemptions_frozen: boolean
          redemptions_on_hold: boolean
          referee_bonus_ksh: number
          referral_max_count: number
          referrer_bonus_ksh: number
          registration_open: boolean
          updated_at: string
          upgrades_frozen: boolean
        }
        Insert: {
          emergency_active?: boolean
          emergency_duration_seconds?: number
          emergency_message?: string | null
          emergency_started_at?: string | null
          id?: number
          maintenance?: boolean
          payment_rotation_mode?: string
          redemptions_frozen?: boolean
          redemptions_on_hold?: boolean
          referee_bonus_ksh?: number
          referral_max_count?: number
          referrer_bonus_ksh?: number
          registration_open?: boolean
          updated_at?: string
          upgrades_frozen?: boolean
        }
        Update: {
          emergency_active?: boolean
          emergency_duration_seconds?: number
          emergency_message?: string | null
          emergency_started_at?: string | null
          id?: number
          maintenance?: boolean
          payment_rotation_mode?: string
          redemptions_frozen?: boolean
          redemptions_on_hold?: boolean
          referee_bonus_ksh?: number
          referral_max_count?: number
          referrer_bonus_ksh?: number
          registration_open?: boolean
          updated_at?: string
          upgrades_frozen?: boolean
        }
        Relationships: []
      }
      tier_upgrades: {
        Row: {
          fee_ksh: number
          from_tier: string
          id: string
          paid_at: string
          to_tier: string
          transaction_code: string | null
          user_id: string
        }
        Insert: {
          fee_ksh: number
          from_tier: string
          id?: string
          paid_at?: string
          to_tier: string
          transaction_code?: string | null
          user_id: string
        }
        Update: {
          fee_ksh?: number
          from_tier?: string
          id?: string
          paid_at?: string
          to_tier?: string
          transaction_code?: string | null
          user_id?: string
        }
        Relationships: []
      }
      upgrade_requests: {
        Row: {
          amount_paid: number
          created_at: string
          id: string
          payment_number_id: string | null
          requested_tier: string
          status: string
          transaction_code: string
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          id?: string
          payment_number_id?: string | null
          requested_tier: string
          status?: string
          transaction_code: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          id?: string
          payment_number_id?: string | null
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
      vip_completions: {
        Row: {
          completed_at: string
          date: string
          id: string
          reward_ksh: number
          task_payload: Json | null
          user_id: string
          vip_level: number
        }
        Insert: {
          completed_at?: string
          date?: string
          id?: string
          reward_ksh: number
          task_payload?: Json | null
          user_id: string
          vip_level: number
        }
        Update: {
          completed_at?: string
          date?: string
          id?: string
          reward_ksh?: number
          task_payload?: Json | null
          user_id?: string
          vip_level?: number
        }
        Relationships: []
      }
      vip_jobs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_one_time: boolean
          name: string
          reward_ksh: number
          task_kind: string
          upgrade_fee_ksh: number | null
          vip_level: number
          welcome_bonus_ksh: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_one_time?: boolean
          name: string
          reward_ksh: number
          task_kind: string
          upgrade_fee_ksh?: number | null
          vip_level: number
          welcome_bonus_ksh?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_one_time?: boolean
          name?: string
          reward_ksh?: number
          task_kind?: string
          upgrade_fee_ksh?: number | null
          vip_level?: number
          welcome_bonus_ksh?: number | null
        }
        Relationships: []
      }
      vip_upgrade_requests: {
        Row: {
          amount_ksh: number
          created_at: string
          from_vip: number
          id: string
          payment_number_id: string | null
          status: string
          to_vip: number
          transaction_code: string
          user_id: string
        }
        Insert: {
          amount_ksh: number
          created_at?: string
          from_vip: number
          id?: string
          payment_number_id?: string | null
          status?: string
          to_vip: number
          transaction_code: string
          user_id: string
        }
        Update: {
          amount_ksh?: number
          created_at?: string
          from_vip?: number
          id?: string
          payment_number_id?: string | null
          status?: string
          to_vip?: number
          transaction_code?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_leaderboard_payouts: {
        Row: {
          amount_ksh: number
          category: string
          id: string
          paid_at: string
          rank: number
          user_id: string
          week_start: string
        }
        Insert: {
          amount_ksh: number
          category: string
          id?: string
          paid_at?: string
          rank: number
          user_id: string
          week_start: string
        }
        Update: {
          amount_ksh?: number
          category?: string
          id?: string
          paid_at?: string
          rank?: number
          user_id?: string
          week_start?: string
        }
        Relationships: []
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
