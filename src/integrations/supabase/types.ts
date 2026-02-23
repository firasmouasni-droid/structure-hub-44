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
      audit_settings: {
        Row: {
          audit_hour: number
          created_at: string
          enabled: boolean
          id: string
          user_id: string | null
        }
        Insert: {
          audit_hour?: number
          created_at?: string
          enabled?: boolean
          id?: string
          user_id?: string | null
        }
        Update: {
          audit_hour?: number
          created_at?: string
          enabled?: boolean
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string
          condition_type: string
          condition_value: number
          created_at: string
          description: string
          icon: string
          id: string
          key: string
          name: string
          xp_reward: number
        }
        Insert: {
          category?: string
          condition_type: string
          condition_value?: number
          created_at?: string
          description: string
          icon?: string
          id?: string
          key: string
          name: string
          xp_reward?: number
        }
        Update: {
          category?: string
          condition_type?: string
          condition_value?: number
          created_at?: string
          description?: string
          icon?: string
          id?: string
          key?: string
          name?: string
          xp_reward?: number
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          category: string
          color: string | null
          created_at: string
          end_time: string
          id: string
          source: string
          start_time: string
          structure_id: string | null
          title: string
        }
        Insert: {
          category?: string
          color?: string | null
          created_at?: string
          end_time: string
          id?: string
          source?: string
          start_time: string
          structure_id?: string | null
          title: string
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string
          end_time?: string
          id?: string
          source?: string
          start_time?: string
          structure_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "structures"
            referencedColumns: ["id"]
          },
        ]
      }
      connectors: {
        Row: {
          active: boolean
          config: Json | null
          created_at: string
          id: string
          provider: string
          structure_id: string
          type: string
        }
        Insert: {
          active?: boolean
          config?: Json | null
          created_at?: string
          id?: string
          provider: string
          structure_id: string
          type: string
        }
        Update: {
          active?: boolean
          config?: Json | null
          created_at?: string
          id?: string
          provider?: string
          structure_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "connectors_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "structures"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_audits: {
        Row: {
          audit_date: string
          cognitive_availability: string
          created_at: string
          day_objective: string
          distraction_level: string
          energy_level: number
          id: string
          mental_clarity: string
          mood: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          audit_date?: string
          cognitive_availability?: string
          created_at?: string
          day_objective?: string
          distraction_level?: string
          energy_level?: number
          id?: string
          mental_clarity?: string
          mood?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          audit_date?: string
          cognitive_availability?: string
          created_at?: string
          day_objective?: string
          distraction_level?: string
          energy_level?: number
          id?: string
          mental_clarity?: string
          mood?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      estimation_coefficients: {
        Row: {
          action_type: string
          coefficient: number
          created_at: string
          id: string
          sample_count: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action_type?: string
          coefficient?: number
          created_at?: string
          id?: string
          sample_count?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          coefficient?: number
          created_at?: string
          id?: string
          sample_count?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          current_value: number
          description: string | null
          difficulty: string
          end_date: string | null
          id: string
          kpi: string | null
          kpi_unit: string | null
          parent_goal_id: string | null
          period: string
          start_date: string | null
          status: string
          structure_id: string
          success_criteria: string | null
          target_value: number | null
          title: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          description?: string | null
          difficulty?: string
          end_date?: string | null
          id?: string
          kpi?: string | null
          kpi_unit?: string | null
          parent_goal_id?: string | null
          period?: string
          start_date?: string | null
          status?: string
          structure_id: string
          success_criteria?: string | null
          target_value?: number | null
          title: string
        }
        Update: {
          created_at?: string
          current_value?: number
          description?: string | null
          difficulty?: string
          end_date?: string | null
          id?: string
          kpi?: string | null
          kpi_unit?: string | null
          parent_goal_id?: string | null
          period?: string
          start_date?: string | null
          status?: string
          structure_id?: string
          success_criteria?: string | null
          target_value?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_parent_goal_id_fkey"
            columns: ["parent_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "structures"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          afternoon_tasks: Json | null
          availability_rules: Json | null
          blocks: Json | null
          created_at: string
          description: string | null
          email_slots: Json | null
          id: string
          is_active: boolean
          morning_focus: Json | null
          name: string | null
          organization_mode: string | null
          routine_type: string
          structure_id: string | null
          user_id: string | null
        }
        Insert: {
          afternoon_tasks?: Json | null
          availability_rules?: Json | null
          blocks?: Json | null
          created_at?: string
          description?: string | null
          email_slots?: Json | null
          id?: string
          is_active?: boolean
          morning_focus?: Json | null
          name?: string | null
          organization_mode?: string | null
          routine_type?: string
          structure_id?: string | null
          user_id?: string | null
        }
        Update: {
          afternoon_tasks?: Json | null
          availability_rules?: Json | null
          blocks?: Json | null
          created_at?: string
          description?: string | null
          email_slots?: Json | null
          id?: string
          is_active?: boolean
          morning_focus?: Json | null
          name?: string | null
          organization_mode?: string | null
          routine_type?: string
          structure_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routines_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "structures"
            referencedColumns: ["id"]
          },
        ]
      }
      structures: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          owner_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          owner_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          owner_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          action_label: string
          action_type: string
          actual_duration: number | null
          category: string
          computed_priority: number | null
          created_at: string
          domain: string | null
          due_date: string | null
          email_id: string | null
          estimated_duration: number | null
          external_link: string | null
          id: string
          importance: number
          is_inbox: boolean
          is_refined: boolean
          next_action: string | null
          parent_task_id: string | null
          priority: string
          source: string
          status: string
          structure_id: string
          urgency: number
        }
        Insert: {
          action_label: string
          action_type?: string
          actual_duration?: number | null
          category?: string
          computed_priority?: number | null
          created_at?: string
          domain?: string | null
          due_date?: string | null
          email_id?: string | null
          estimated_duration?: number | null
          external_link?: string | null
          id?: string
          importance?: number
          is_inbox?: boolean
          is_refined?: boolean
          next_action?: string | null
          parent_task_id?: string | null
          priority?: string
          source?: string
          status?: string
          structure_id: string
          urgency?: number
        }
        Update: {
          action_label?: string
          action_type?: string
          actual_duration?: number | null
          category?: string
          computed_priority?: number | null
          created_at?: string
          domain?: string | null
          due_date?: string | null
          email_id?: string | null
          estimated_duration?: number | null
          external_link?: string | null
          id?: string
          importance?: number
          is_inbox?: boolean
          is_refined?: boolean
          next_action?: string | null
          parent_task_id?: string | null
          priority?: string
          source?: string
          status?: string
          structure_id?: string
          urgency?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "structures"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          created_at: string
          id: string
          last_activity_date: string | null
          level: number
          streak_days: number
          user_id: string | null
          xp: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_activity_date?: string | null
          level?: number
          streak_days?: number
          user_id?: string | null
          xp?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_activity_date?: string | null
          level?: number
          streak_days?: number
          user_id?: string | null
          xp?: number
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          user_id: string | null
          xp_amount: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          user_id?: string | null
          xp_amount: number
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          user_id?: string | null
          xp_amount?: number
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
