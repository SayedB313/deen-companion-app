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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accountability_partners: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          partner_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code: string
          partner_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          partner_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          achieved_at: string
          achievement_key: string
          id: string
          user_id: string
        }
        Insert: {
          achieved_at?: string
          achievement_key: string
          id?: string
          user_id: string
        }
        Update: {
          achieved_at?: string
          achievement_key?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      ayah_revision_schedule: {
        Row: {
          ayah_number: number
          created_at: string
          ease_factor: number
          id: string
          interval_days: number
          last_reviewed: string
          next_review: string
          surah_id: number
          user_id: string
        }
        Insert: {
          ayah_number: number
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed?: string
          next_review?: string
          surah_id: number
          user_id: string
        }
        Update: {
          ayah_number?: number
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed?: string
          next_review?: string
          surah_id?: number
          user_id?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          author: string | null
          category: string | null
          created_at: string
          id: string
          pages_read: number
          status: string
          title: string
          total_pages: number
          updated_at: string
          user_id: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          created_at?: string
          id?: string
          pages_read?: number
          status?: string
          title: string
          total_pages?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          author?: string | null
          category?: string | null
          created_at?: string
          id?: string
          pages_read?: number
          status?: string
          title?: string
          total_pages?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      character_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          trait: string
          trait_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          trait: string
          trait_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          trait?: string
          trait_type?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          id: string
          instructor: string | null
          name: string
          progress_percent: number
          status: string
          topic_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor?: string | null
          name: string
          progress_percent?: number
          status?: string
          topic_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor?: string | null
          name?: string
          progress_percent?: number
          status?: string
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_dhikr: {
        Row: {
          arabic: string | null
          created_at: string
          default_target: number
          id: string
          name: string
          user_id: string
        }
        Insert: {
          arabic?: string | null
          created_at?: string
          default_target?: number
          id?: string
          name: string
          user_id: string
        }
        Update: {
          arabic?: string | null
          created_at?: string
          default_target?: number
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          logged: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          logged?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          logged?: boolean
          user_id?: string
        }
        Relationships: []
      }
      dhikr_logs: {
        Row: {
          count: number
          created_at: string
          date: string
          dhikr_type: string
          id: string
          target: number
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          date?: string
          dhikr_type: string
          id?: string
          target?: number
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          date?: string
          dhikr_type?: string
          id?: string
          target?: number
          user_id?: string
        }
        Relationships: []
      }
      fasting_log: {
        Row: {
          created_at: string
          date: string
          fast_type: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          fast_type?: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          fast_type?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          area: string
          created_at: string
          id: string
          is_active: boolean
          period: string
          target_value: number
          user_id: string
        }
        Insert: {
          area: string
          created_at?: string
          id?: string
          is_active?: boolean
          period?: string
          target_value?: number
          user_id: string
        }
        Update: {
          area?: string
          created_at?: string
          id?: string
          is_active?: boolean
          period?: string
          target_value?: number
          user_id?: string
        }
        Relationships: []
      }
      milestones: {
        Row: {
          achieved_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          achieved_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          achieved_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string | null
          course_id: string | null
          created_at: string
          id: string
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          title: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          fasting_reminders: boolean
          id: string
          motivational_quotes: boolean
          push_enabled: boolean
          quran_revision_reminder: boolean
          salah_reminders: boolean
          streak_reminder: boolean
          streak_reminder_time: string
          updated_at: string
          user_id: string
          weekly_report: boolean
        }
        Insert: {
          created_at?: string
          fasting_reminders?: boolean
          id?: string
          motivational_quotes?: boolean
          push_enabled?: boolean
          quran_revision_reminder?: boolean
          salah_reminders?: boolean
          streak_reminder?: boolean
          streak_reminder_time?: string
          updated_at?: string
          user_id: string
          weekly_report?: boolean
        }
        Update: {
          created_at?: string
          fasting_reminders?: boolean
          id?: string
          motivational_quotes?: boolean
          push_enabled?: boolean
          quran_revision_reminder?: boolean
          salah_reminders?: boolean
          streak_reminder?: boolean
          streak_reminder_time?: string
          updated_at?: string
          user_id?: string
          weekly_report?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          onboarding_complete: boolean
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          onboarding_complete?: boolean
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          onboarding_complete?: boolean
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      quran_progress: {
        Row: {
          ayah_number: number
          id: string
          status: string
          surah_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ayah_number: number
          id?: string
          status?: string
          surah_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ayah_number?: number
          id?: string
          status?: string
          surah_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quran_progress_surah_id_fkey"
            columns: ["surah_id"]
            isOneToOne: false
            referencedRelation: "surahs"
            referencedColumns: ["id"]
          },
        ]
      }
      reflections: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
          week_start: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
          week_start: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      revision_schedule: {
        Row: {
          created_at: string
          ease_factor: number
          id: string
          interval_days: number
          last_reviewed: string
          next_review: string
          surah_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed?: string
          next_review?: string
          surah_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed?: string
          next_review?: string
          surah_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_schedule_surah_id_fkey"
            columns: ["surah_id"]
            isOneToOne: false
            referencedRelation: "surahs"
            referencedColumns: ["id"]
          },
        ]
      }
      salah_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          is_sunnah: boolean
          prayed: boolean
          prayer: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          is_sunnah?: boolean
          prayed?: boolean
          prayer: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_sunnah?: boolean
          prayed?: boolean
          prayer?: string
          user_id?: string
        }
        Relationships: []
      }
      surahs: {
        Row: {
          ayah_count: number
          id: number
          juz_start: number
          name_arabic: string
          name_english: string
          name_transliteration: string
        }
        Insert: {
          ayah_count: number
          id: number
          juz_start: number
          name_arabic: string
          name_english: string
          name_transliteration: string
        }
        Update: {
          ayah_count?: number
          id?: number
          juz_start?: number
          name_arabic?: string
          name_english?: string
          name_transliteration?: string
        }
        Relationships: []
      }
      time_logs: {
        Row: {
          activity_type: string
          created_at: string
          date: string
          description: string | null
          duration_minutes: number
          id: string
          is_deen: boolean
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          date?: string
          description?: string | null
          duration_minutes: number
          id?: string
          is_deen?: boolean
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          date?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_deen?: boolean
          user_id?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          progress_percent: number
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          name: string
          progress_percent?: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          progress_percent?: number
          user_id?: string
        }
        Relationships: []
      }
      weekly_snapshots: {
        Row: {
          created_at: string
          deen_minutes: number
          dhikr_completed: number
          fasting_days: number
          id: string
          prayers_logged: number
          quran_ayahs_reviewed: number
          streak_days: number
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          deen_minutes?: number
          dhikr_completed?: number
          fasting_days?: number
          id?: string
          prayers_logged?: number
          quran_ayahs_reviewed?: number
          streak_days?: number
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          deen_minutes?: number
          dhikr_completed?: number
          fasting_days?: number
          id?: string
          prayers_logged?: number
          quran_ayahs_reviewed?: number
          streak_days?: number
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
