// Dibuat otomatis dari skema kost (postgres-meta). Jangan diubah manual; buat ulang setelah migrasi.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  kost: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor: string | null
          at: string
          detail: Json | null
          entity: string
          entity_id: string | null
          id: number
        }
        ComputedFields: never
        Insert: {
          action: string
          actor?: string | null
          at?: string
          detail?: Json | null
          entity: string
          entity_id?: string | null
          id?: never
        }
        Update: {
          action?: string
          actor?: string | null
          at?: string
          detail?: Json | null
          entity?: string
          entity_id?: string | null
          id?: never
        }
        Relationships: []
      }
      admins: {
        Row: {
          added_by: string | null
          created_at: string
          email: string
          name: string | null
        }
        ComputedFields: never
        Insert: {
          added_by?: string | null
          created_at?: string
          email: string
          name?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          email?: string
          name?: string | null
        }
        Relationships: []
      }
      content: {
        Row: {
          key: string
          updated_at: string
          value: NonNullable<Json>
        }
        ComputedFields: never
        Insert: {
          key: string
          updated_at?: string
          value: NonNullable<Json>
        }
        Update: {
          key?: string
          updated_at?: string
          value?: NonNullable<Json>
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          note: string | null
          proof_path: string | null
          spent_on: string
          ticket_id: string | null
        }
        ComputedFields: never
        Insert: {
          amount: number
          category: string
          created_at?: string
          id?: string
          note?: string | null
          proof_path?: string | null
          spent_on?: string
          ticket_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          note?: string | null
          proof_path?: string | null
          spent_on?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_ticket_id_fkey"
            columns: ["ticket_id"]
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          due_date: string
          electricity: number
          id: string
          lease_id: string
          other: number
          other_note: string | null
          period: string
          rent: number
          total: number | null
          water: number
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          due_date: string
          electricity?: number
          id?: string
          lease_id: string
          other?: number
          other_note?: string | null
          period: string
          rent?: number
          total?: never
          water?: number
        }
        Update: {
          created_at?: string
          due_date?: string
          electricity?: number
          id?: string
          lease_id?: string
          other?: number
          other_note?: string | null
          period?: string
          rent?: number
          total?: never
          water?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_lease_id_fkey"
            columns: ["lease_id"]
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          id: string
          interest: string | null
          name: string
          notes: string | null
          phone: string | null
          source: string
          status: string
          survey_at: string | null
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          id?: string
          interest?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          source?: string
          status?: string
          survey_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          interest?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string
          status?: string
          survey_at?: string | null
        }
        Relationships: []
      }
      leases: {
        Row: {
          checkin: NonNullable<Json>
          checkout: Json | null
          created_at: string
          deposit: number
          end_date: string | null
          end_note: string | null
          end_reason: string | null
          ended_on: string | null
          id: string
          notes: string | null
          price: number
          room_number: number
          scheme: string
          start_date: string
          status: string
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          checkin?: NonNullable<Json>
          checkout?: Json | null
          created_at?: string
          deposit?: number
          end_date?: string | null
          end_note?: string | null
          end_reason?: string | null
          ended_on?: string | null
          id?: string
          notes?: string | null
          price: number
          room_number: number
          scheme?: string
          start_date: string
          status?: string
          tenant_id: string
        }
        Update: {
          checkin?: NonNullable<Json>
          checkout?: Json | null
          created_at?: string
          deposit?: number
          end_date?: string | null
          end_note?: string | null
          end_reason?: string | null
          ended_on?: string | null
          id?: string
          notes?: string | null
          price?: number
          room_number?: number
          scheme?: string
          start_date?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leases_room_number_fkey"
            columns: ["room_number"]
            referencedRelation: "rooms"
            referencedColumns: ["number"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string
          method: string
          note: string | null
          paid_on: string
          proof_path: string | null
        }
        ComputedFields: never
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id: string
          method?: string
          note?: string | null
          paid_on?: string
          proof_path?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string
          method?: string
          note?: string | null
          paid_on?: string
          proof_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            referencedRelation: "invoice_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          floor: string
          monthly: number
          notes: string | null
          number: number
          size: string
          status: string
          updated_at: string
          yearly: number | null
        }
        ComputedFields: never
        Insert: {
          floor: string
          monthly: number
          notes?: string | null
          number: number
          size: string
          status?: string
          updated_at?: string
          yearly?: number | null
        }
        Update: {
          floor?: string
          monthly?: number
          notes?: string | null
          number?: number
          size?: string
          status?: string
          updated_at?: string
          yearly?: number | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: boolean
          owner_electric_share: number
          owner_water_share: number
          retention_months: number
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          id?: boolean
          owner_electric_share?: number
          owner_water_share?: number
          retention_months?: number
          updated_at?: string
        }
        Update: {
          id?: boolean
          owner_electric_share?: number
          owner_water_share?: number
          retention_months?: number
          updated_at?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          anonymized_at: string | null
          consent_at: string | null
          created_at: string
          do_not_rent: boolean
          do_not_rent_phone_hash: string | null
          do_not_rent_reason: string | null
          emergency_name: string | null
          emergency_phone: string | null
          emergency_relation: string | null
          id: string
          ktp_path: string | null
          name: string
          notes: string | null
          origin: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          anonymized_at?: string | null
          consent_at?: string | null
          created_at?: string
          do_not_rent?: boolean
          do_not_rent_phone_hash?: string | null
          do_not_rent_reason?: string | null
          emergency_name?: string | null
          emergency_phone?: string | null
          emergency_relation?: string | null
          id?: string
          ktp_path?: string | null
          name: string
          notes?: string | null
          origin?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          anonymized_at?: string | null
          consent_at?: string | null
          created_at?: string
          do_not_rent?: boolean
          do_not_rent_phone_hash?: string | null
          do_not_rent_reason?: string | null
          emergency_name?: string | null
          emergency_phone?: string | null
          emergency_relation?: string | null
          id?: string
          ktp_path?: string | null
          name?: string
          notes?: string | null
          origin?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          area: string | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          photo_path: string | null
          resolved_at: string | null
          room_number: number | null
          status: string
          title: string
        }
        ComputedFields: never
        Insert: {
          area?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          photo_path?: string | null
          resolved_at?: string | null
          room_number?: number | null
          status?: string
          title: string
        }
        Update: {
          area?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          photo_path?: string | null
          resolved_at?: string | null
          room_number?: number | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_room_number_fkey"
            columns: ["room_number"]
            referencedRelation: "rooms"
            referencedColumns: ["number"]
          },
        ]
      }
      utility_bills: {
        Row: {
          created_at: string
          id: string
          kind: string
          owner_share: number
          per_tenant: number
          period: string
          tenants_count: number
          total: number
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          id?: string
          kind: string
          owner_share?: number
          per_tenant: number
          period: string
          tenants_count: number
          total: number
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          owner_share?: number
          per_tenant?: number
          period?: string
          tenants_count?: number
          total?: number
        }
        Relationships: []
      }
      violations: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          level: string
          occurred_on: string
          photo_path: string | null
          rule: string
          tenant_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          level?: string
          occurred_on?: string
          photo_path?: string | null
          rule: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          level?: string
          occurred_on?: string
          photo_path?: string | null
          rule?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "violations_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      invoice_status: {
        Row: {
          created_at: string | null
          due_date: string | null
          electricity: number | null
          id: string | null
          lease_id: string | null
          other: number | null
          other_note: string | null
          paid: number | null
          period: string | null
          rent: number | null
          status: string | null
          total: number | null
          water: number | null
        }
        ComputedFields: never
        Relationships: [
          {
            foreignKeyName: "invoices_lease_id_fkey"
            columns: ["lease_id"]
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      anonymize_old_tenants: {
        Args: Record<PropertyKey, never>
        Returns: {
          old_ktp_path: string
          tenant_id: string
        }[]
      }
      current_email: { Args: Record<PropertyKey, never>; Returns: string }
      flagged_phone: { Args: { p: string }; Returns: boolean }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      log_access: {
        Args: { p_action?: string; p_entity: string; p_entity_id: string }
        Returns: undefined
      }
      norm_phone: { Args: { p: string }; Returns: string }
      phone_hash: { Args: { p: string }; Returns: string }
      submit_interest: {
        Args: { p_interest?: string; p_name: string; p_phone: string }
        Returns: string
      }
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
  kost: {
    Enums: {},
  },
} as const
