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
      alerts: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      cargo_doors: {
        Row: {
          battery_level: number
          created_at: string
          device_id: string
          door_state: string
          firmware_version: string
          id: string
          last_heartbeat: string
          lock_state: string
          sensor_healthy: boolean
          signal_strength: number
          tamper_detected: boolean
          unlock_expires_at: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          battery_level?: number
          created_at?: string
          device_id: string
          door_state?: string
          firmware_version?: string
          id?: string
          last_heartbeat?: string
          lock_state?: string
          sensor_healthy?: boolean
          signal_strength?: number
          tamper_detected?: boolean
          unlock_expires_at?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          battery_level?: number
          created_at?: string
          device_id?: string
          door_state?: string
          firmware_version?: string
          id?: string
          last_heartbeat?: string
          lock_state?: string
          sensor_healthy?: boolean
          signal_strength?: number
          tamper_detected?: boolean
          unlock_expires_at?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cargo_doors_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_reports: {
        Row: {
          content: string
          created_at: string
          generated_by: string | null
          id: string
          metrics: Json
          period_end: string | null
          period_start: string | null
          report_type: string
          summary: string
          title: string
        }
        Insert: {
          content?: string
          created_at?: string
          generated_by?: string | null
          id?: string
          metrics?: Json
          period_end?: string | null
          period_start?: string | null
          report_type?: string
          summary?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          generated_by?: string | null
          id?: string
          metrics?: Json
          period_end?: string | null
          period_start?: string | null
          report_type?: string
          summary?: string
          title?: string
        }
        Relationships: []
      }
      door_device_commands: {
        Row: {
          acked_at: string | null
          cargo_door_id: string
          command: string
          created_at: string
          error_message: string | null
          id: string
          payload: Json
          qos: number
          status: string
          topic: string
          unlock_request_id: string | null
          vehicle_id: string
        }
        Insert: {
          acked_at?: string | null
          cargo_door_id: string
          command: string
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json
          qos?: number
          status?: string
          topic: string
          unlock_request_id?: string | null
          vehicle_id: string
        }
        Update: {
          acked_at?: string | null
          cargo_door_id?: string
          command?: string
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json
          qos?: number
          status?: string
          topic?: string
          unlock_request_id?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "door_device_commands_cargo_door_id_fkey"
            columns: ["cargo_door_id"]
            isOneToOne: false
            referencedRelation: "cargo_doors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "door_device_commands_unlock_request_id_fkey"
            columns: ["unlock_request_id"]
            isOneToOne: false
            referencedRelation: "door_unlock_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "door_device_commands_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      door_security_events: {
        Row: {
          acknowledged: boolean
          actor_id: string | null
          actor_name: string | null
          actor_role: string | null
          cargo_description: string | null
          cargo_door_id: string | null
          created_at: string
          driver_id: string | null
          event_type: string
          id: string
          latitude: number | null
          longitude: number | null
          message: string
          metadata: Json
          severity: string
          speed: number | null
          trip_id: string | null
          unlock_request_id: string | null
          vehicle_id: string
        }
        Insert: {
          acknowledged?: boolean
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: string | null
          cargo_description?: string | null
          cargo_door_id?: string | null
          created_at?: string
          driver_id?: string | null
          event_type: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          message: string
          metadata?: Json
          severity?: string
          speed?: number | null
          trip_id?: string | null
          unlock_request_id?: string | null
          vehicle_id: string
        }
        Update: {
          acknowledged?: boolean
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: string | null
          cargo_description?: string | null
          cargo_door_id?: string | null
          created_at?: string
          driver_id?: string | null
          event_type?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          message?: string
          metadata?: Json
          severity?: string
          speed?: number | null
          trip_id?: string | null
          unlock_request_id?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "door_security_events_cargo_door_id_fkey"
            columns: ["cargo_door_id"]
            isOneToOne: false
            referencedRelation: "cargo_doors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "door_security_events_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "door_security_events_unlock_request_id_fkey"
            columns: ["unlock_request_id"]
            isOneToOne: false
            referencedRelation: "door_unlock_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "door_security_events_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      door_unlock_requests: {
        Row: {
          auto_locked_at: string | null
          cargo_description: string | null
          cargo_door_id: string | null
          created_at: string
          decided_at: string | null
          decision_note: string | null
          driver_id: string
          driver_name: string
          id: string
          latitude: number | null
          location_name: string | null
          longitude: number | null
          owner_id: string | null
          reason: string
          status: string
          trip_id: string | null
          unlock_duration_seconds: number
          unlock_expires_at: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          auto_locked_at?: string | null
          cargo_description?: string | null
          cargo_door_id?: string | null
          created_at?: string
          decided_at?: string | null
          decision_note?: string | null
          driver_id: string
          driver_name?: string
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          owner_id?: string | null
          reason: string
          status?: string
          trip_id?: string | null
          unlock_duration_seconds?: number
          unlock_expires_at?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          auto_locked_at?: string | null
          cargo_description?: string | null
          cargo_door_id?: string | null
          created_at?: string
          decided_at?: string | null
          decision_note?: string | null
          driver_id?: string
          driver_name?: string
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          owner_id?: string | null
          reason?: string
          status?: string
          trip_id?: string | null
          unlock_duration_seconds?: number
          unlock_expires_at?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "door_unlock_requests_cargo_door_id_fkey"
            columns: ["cargo_door_id"]
            isOneToOne: false
            referencedRelation: "cargo_doors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "door_unlock_requests_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "door_unlock_requests_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      fasttag_accounts: {
        Row: {
          balance: number
          created_at: string
          id: string
          is_active: boolean
          issuer_bank: string
          tag_number: string
          updated_at: string
          vehicle_id: string
          vehicle_name: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          is_active?: boolean
          issuer_bank?: string
          tag_number: string
          updated_at?: string
          vehicle_id: string
          vehicle_name: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          is_active?: boolean
          issuer_bank?: string
          tag_number?: string
          updated_at?: string
          vehicle_id?: string
          vehicle_name?: string
        }
        Relationships: []
      }
      fasttag_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          fasttag_account_id: string
          id: string
          new_balance: number
          previous_balance: number
          toll_transaction_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          fasttag_account_id: string
          id?: string
          new_balance: number
          previous_balance: number
          toll_transaction_id?: string | null
          transaction_type?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          fasttag_account_id?: string
          id?: string
          new_balance?: number
          previous_balance?: number
          toll_transaction_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fasttag_transactions_fasttag_account_id_fkey"
            columns: ["fasttag_account_id"]
            isOneToOne: false
            referencedRelation: "fasttag_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fasttag_transactions_toll_transaction_id_fkey"
            columns: ["toll_transaction_id"]
            isOneToOne: false
            referencedRelation: "toll_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_ai_insights: {
        Row: {
          agent: string
          created_at: string
          created_by: string | null
          id: string
          payload: Json
          recommendations: Json
          risk_score: number
          severity: string
          status: string
          summary: string
          title: string
          vehicle_id: string | null
          vehicle_name: string | null
        }
        Insert: {
          agent: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
          recommendations?: Json
          risk_score?: number
          severity?: string
          status?: string
          summary: string
          title: string
          vehicle_id?: string | null
          vehicle_name?: string | null
        }
        Update: {
          agent?: string
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
          recommendations?: Json
          risk_score?: number
          severity?: string
          status?: string
          summary?: string
          title?: string
          vehicle_id?: string | null
          vehicle_name?: string | null
        }
        Relationships: []
      }
      load_slips: {
        Row: {
          amount: number | null
          bill_image_url: string | null
          created_at: string
          destination: string
          driver_id: string
          id: string
          load_description: string
          notes: string | null
          origin: string
          slip_number: string | null
          status: string
          updated_at: string
          vehicle_id: string
          vehicle_name: string
          weight_kg: number | null
        }
        Insert: {
          amount?: number | null
          bill_image_url?: string | null
          created_at?: string
          destination: string
          driver_id: string
          id?: string
          load_description: string
          notes?: string | null
          origin: string
          slip_number?: string | null
          status?: string
          updated_at?: string
          vehicle_id: string
          vehicle_name: string
          weight_kg?: number | null
        }
        Update: {
          amount?: number | null
          bill_image_url?: string | null
          created_at?: string
          destination?: string
          driver_id?: string
          id?: string
          load_description?: string
          notes?: string | null
          origin?: string
          slip_number?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string
          vehicle_name?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      section_crossings: {
        Row: {
          crossed_at: string
          id: string
          sensor_data: Json | null
          speed_at_crossing: number | null
          toll_section_id: string
          toll_transaction_id: string
          vehicle_id: string
        }
        Insert: {
          crossed_at?: string
          id?: string
          sensor_data?: Json | null
          speed_at_crossing?: number | null
          toll_section_id: string
          toll_transaction_id: string
          vehicle_id: string
        }
        Update: {
          crossed_at?: string
          id?: string
          sensor_data?: Json | null
          speed_at_crossing?: number | null
          toll_section_id?: string
          toll_transaction_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_crossings_toll_section_id_fkey"
            columns: ["toll_section_id"]
            isOneToOne: false
            referencedRelation: "toll_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_crossings_toll_transaction_id_fkey"
            columns: ["toll_transaction_id"]
            isOneToOne: false
            referencedRelation: "toll_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      toll_gates: {
        Row: {
          created_at: string
          highway: string
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          rate_container: number
          rate_heavy_truck: number
          rate_light_truck: number
          rate_medium_truck: number
          state: string
        }
        Insert: {
          created_at?: string
          highway: string
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          rate_container?: number
          rate_heavy_truck?: number
          rate_light_truck?: number
          rate_medium_truck?: number
          state: string
        }
        Update: {
          created_at?: string
          highway?: string
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          rate_container?: number
          rate_heavy_truck?: number
          rate_light_truck?: number
          rate_medium_truck?: number
          state?: string
        }
        Relationships: []
      }
      toll_notifications: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          notification_type: string
          remaining_balance: number | null
          title: string
          toll_gate_name: string
          user_id: string
          vehicle_id: string
          vehicle_name: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          notification_type?: string
          remaining_balance?: number | null
          title: string
          toll_gate_name: string
          user_id: string
          vehicle_id: string
          vehicle_name: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          remaining_balance?: number | null
          title?: string
          toll_gate_name?: string
          user_id?: string
          vehicle_id?: string
          vehicle_name?: string
        }
        Relationships: []
      }
      toll_sections: {
        Row: {
          created_at: string
          id: string
          latitude: number
          longitude: number
          name: string
          section_order: number
          toll_gate_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          name: string
          section_order?: number
          toll_gate_id: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          section_order?: number
          toll_gate_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "toll_sections_toll_gate_id_fkey"
            columns: ["toll_gate_id"]
            isOneToOne: false
            referencedRelation: "toll_gates"
            referencedColumns: ["id"]
          },
        ]
      }
      toll_transactions: {
        Row: {
          amount: number
          created_at: string
          fasttag_account_id: string
          id: string
          new_balance: number
          previous_balance: number
          status: string
          toll_gate_id: string
          vehicle_id: string
          vehicle_name: string
          vehicle_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          fasttag_account_id: string
          id?: string
          new_balance: number
          previous_balance: number
          status?: string
          toll_gate_id: string
          vehicle_id: string
          vehicle_name: string
          vehicle_type?: string
        }
        Update: {
          amount?: number
          created_at?: string
          fasttag_account_id?: string
          id?: string
          new_balance?: number
          previous_balance?: number
          status?: string
          toll_gate_id?: string
          vehicle_id?: string
          vehicle_name?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "toll_transactions_fasttag_account_id_fkey"
            columns: ["fasttag_account_id"]
            isOneToOne: false
            referencedRelation: "fasttag_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toll_transactions_toll_gate_id_fkey"
            columns: ["toll_gate_id"]
            isOneToOne: false
            referencedRelation: "toll_gates"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          created_at: string
          destination: string
          distance_miles: number | null
          driver_id: string | null
          end_time: string | null
          id: string
          origin: string
          start_time: string | null
          status: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          destination: string
          distance_miles?: number | null
          driver_id?: string | null
          end_time?: string | null
          id?: string
          origin: string
          start_time?: string | null
          status?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          destination?: string
          distance_miles?: number | null
          driver_id?: string | null
          end_time?: string | null
          id?: string
          origin?: string
          start_time?: string | null
          status?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_documents: {
        Row: {
          created_at: string
          document_number: string | null
          document_type: string
          document_url: string | null
          expiry_date: string
          id: string
          issue_date: string | null
          issuing_authority: string | null
          notes: string | null
          renewal_cost: number | null
          status: string
          updated_at: string
          vehicle_id: string
          vehicle_name: string
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          document_type: string
          document_url?: string | null
          expiry_date: string
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          notes?: string | null
          renewal_cost?: number | null
          status?: string
          updated_at?: string
          vehicle_id: string
          vehicle_name: string
        }
        Update: {
          created_at?: string
          document_number?: string | null
          document_type?: string
          document_url?: string | null
          expiry_date?: string
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          notes?: string | null
          renewal_cost?: number | null
          status?: string
          updated_at?: string
          vehicle_id?: string
          vehicle_name?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string
          driver_id: string | null
          engine_temp: number
          fuel_capacity: number
          fuel_level: number
          heading: number
          id: string
          last_update: string
          latitude: number
          longitude: number
          mileage: number
          name: string
          plate: string
          speed: number
          status: string
          tire_fl: number
          tire_fr: number
          tire_rl: number
          tire_rr: number
          type: string
        }
        Insert: {
          created_at?: string
          driver_id?: string | null
          engine_temp?: number
          fuel_capacity?: number
          fuel_level?: number
          heading?: number
          id?: string
          last_update?: string
          latitude?: number
          longitude?: number
          mileage?: number
          name: string
          plate: string
          speed?: number
          status?: string
          tire_fl?: number
          tire_fr?: number
          tire_rl?: number
          tire_rr?: number
          type?: string
        }
        Update: {
          created_at?: string
          driver_id?: string | null
          engine_temp?: number
          fuel_capacity?: number
          fuel_level?: number
          heading?: number
          id?: string
          last_update?: string
          latitude?: number
          longitude?: number
          mileage?: number
          name?: string
          plate?: string
          speed?: number
          status?: string
          tire_fl?: number
          tire_fr?: number
          tire_rl?: number
          tire_rr?: number
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "driver" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["owner", "driver", "admin"],
    },
  },
} as const
