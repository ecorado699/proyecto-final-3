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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      anomaly_detections: {
        Row: {
          anomaly_score: number
          created_at: string | null
          detected_at: string
          id: string
          ip_address: unknown
          is_anomaly: boolean
          is_test_data: boolean | null
          metrics: Json
          notes: string | null
          resolved_at: string | null
          status: string
        }
        Insert: {
          anomaly_score: number
          created_at?: string | null
          detected_at?: string
          id?: string
          ip_address: unknown
          is_anomaly?: boolean
          is_test_data?: boolean | null
          metrics: Json
          notes?: string | null
          resolved_at?: string | null
          status?: string
        }
        Update: {
          anomaly_score?: number
          created_at?: string | null
          detected_at?: string
          id?: string
          ip_address?: unknown
          is_anomaly?: boolean
          is_test_data?: boolean | null
          metrics?: Json
          notes?: string | null
          resolved_at?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          request_data: Json | null
          resource_id: string | null
          resource_type: string
          response_data: Json | null
          status_code: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          request_data?: Json | null
          resource_id?: string | null
          resource_type: string
          response_data?: Json | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          request_data?: Json | null
          resource_id?: string | null
          resource_type?: string
          response_data?: Json | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      endpoint_stats: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          ip_address: unknown
          method: string
          response_time: number | null
          status_code: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address?: unknown
          method: string
          response_time?: number | null
          status_code?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: unknown
          method?: string
          response_time?: number | null
          status_code?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      ip_metrics: {
        Row: {
          avg_time_between_requests: number | null
          created_at: string | null
          error_ratio: number
          failed_attempts: number
          id: string
          ip_address: unknown
          is_test_data: boolean | null
          max_time_between_requests: number | null
          min_time_between_requests: number | null
          requests_per_minute: number
          success_attempts: number
          unique_emails_tried: number
          window_end: string
          window_start: string
        }
        Insert: {
          avg_time_between_requests?: number | null
          created_at?: string | null
          error_ratio?: number
          failed_attempts?: number
          id?: string
          ip_address: unknown
          is_test_data?: boolean | null
          max_time_between_requests?: number | null
          min_time_between_requests?: number | null
          requests_per_minute?: number
          success_attempts?: number
          unique_emails_tried?: number
          window_end: string
          window_start: string
        }
        Update: {
          avg_time_between_requests?: number | null
          created_at?: string | null
          error_ratio?: number
          failed_attempts?: number
          id?: string
          ip_address?: unknown
          is_test_data?: boolean | null
          max_time_between_requests?: number | null
          min_time_between_requests?: number | null
          requests_per_minute?: number
          success_attempts?: number
          unique_emails_tried?: number
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempted_at: string | null
          email: string | null
          id: string
          ip_address: unknown
          is_test_data: boolean | null
          success: boolean | null
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string | null
          email?: string | null
          id?: string
          ip_address: unknown
          is_test_data?: boolean | null
          success?: boolean | null
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string | null
          email?: string | null
          id?: string
          ip_address?: unknown
          is_test_data?: boolean | null
          success?: boolean | null
          user_agent?: string | null
        }
        Relationships: []
      }
      ml_model_state: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          metrics_summary: Json | null
          model_type: string
          parameters: Json
          trained_at: string
          training_data: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          metrics_summary?: Json | null
          model_type?: string
          parameters: Json
          trained_at?: string
          training_data: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          metrics_summary?: Json | null
          model_type?: string
          parameters?: Json
          trained_at?: string
          training_data?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_logs: {
        Row: {
          id: string
          ip_address: unknown
          login_at: string
          login_method: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_address?: unknown
          login_at?: string
          login_method: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: unknown
          login_at?: string
          login_method?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_mfa: {
        Row: {
          backup_codes: string[] | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          last_used_at: string | null
          secret_key: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_used_at?: string | null
          secret_key: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_used_at?: string | null
          secret_key?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          anio: number
          color: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          estado: string
          id: string
          kilometraje: number
          marca: string
          modelo: string
          precio: number
          updated_at: string
        }
        Insert: {
          anio: number
          color: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          estado: string
          id?: string
          kilometraje?: number
          marca: string
          modelo: string
          precio: number
          updated_at?: string
        }
        Update: {
          anio?: number
          color?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          estado?: string
          id?: string
          kilometraje?: number
          marca?: string
          modelo?: string
          precio?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      real_suspicious_ips: {
        Row: {
          anomaly_count: number | null
          detection_count: number | null
          ip_address: unknown
          last_detected: string | null
          max_anomaly_score: number | null
          status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_detections: { Args: never; Returns: undefined }
      get_backoff_delay: { Args: { _ip_address: unknown }; Returns: number }
      get_ml_system_stats: {
        Args: never
        Returns: {
          active_anomalies: number
          last_detection: string
          system_active: boolean
          total_anomalies: number
          total_ips_monitored: number
          total_login_attempts: number
        }[]
      }
      get_real_login_activity: {
        Args: { hours_back?: number }
        Returns: {
          error_rate: number
          failed_attempts: number
          first_attempt: string
          ip_address: unknown
          last_attempt: string
          success_attempts: number
          total_attempts: number
          unique_emails: number
        }[]
      }
      get_real_suspicious_ips: {
        Args: { limit_count?: number }
        Returns: {
          anomaly_count: number
          detection_count: number
          ip_address: unknown
          last_detected: string
          max_anomaly_score: number
          status: string
        }[]
      }
      get_top_suspicious_ips: {
        Args: { limit_count?: number }
        Returns: {
          anomaly_count: number
          avg_anomaly_score: number
          ip_address: unknown
          last_detected: string
          total_failed_attempts: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role_or_higher: {
        Args: {
          _required_role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_ip_suspicious: {
        Args: { _ip_address: unknown }
        Returns: {
          anomaly_score: number
          is_suspicious: boolean
          reason: string
        }[]
      }
      log_and_analyze_login: {
        Args: {
          _email: string
          _ip_address: unknown
          _success: boolean
          _user_agent: string
        }
        Returns: {
          allowed: boolean
          anomaly_score: number
          reason: string
        }[]
      }
      log_login_attempt: {
        Args: {
          _email: string
          _ip_address: unknown
          _success: boolean
          _user_agent: string
        }
        Returns: undefined
      }
      soft_delete_vehicle: { Args: { _vehicle_id: string }; Returns: boolean }
      trigger_ml_cycle: { Args: never; Returns: undefined }
    }
    Enums: {
      user_role: "visitor" | "admin" | "super_admin"
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
    Enums: {
      user_role: ["visitor", "admin", "super_admin"],
    },
  },
} as const
