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
      firms: {
        Row: {
          id: string
          created_at: string
          name: string
          address: string
          phone: string
          email: string
          logo_url: string | null
          subscription_tier: string
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          address: string
          phone: string
          email: string
          logo_url?: string | null
          subscription_tier: string
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          address?: string
          phone?: string
          email?: string
          logo_url?: string | null
          subscription_tier?: string
          is_active?: boolean
        }
      }
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          first_name: string
          last_name: string
          role: string
          phone: string | null
          firm_id: string
          avatar_url: string | null
          is_active: boolean
          last_sign_in: string | null
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          first_name: string
          last_name: string
          role: string
          phone?: string | null
          firm_id: string
          avatar_url?: string | null
          is_active?: boolean
          last_sign_in?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: string
          phone?: string | null
          firm_id?: string
          avatar_url?: string | null
          is_active?: boolean
          last_sign_in?: string | null
        }
      }
      cases: {
        Row: {
          id: string
          created_at: string
          firm_id: string
          case_number: string
          title: string
          case_type: string
          status: string
          description: string | null
          assigned_to: string | null
          client_id: string
          opposing_party_id: string | null
          court_name: string | null
          court_location: string | null
          judge_name: string | null
          filing_date: string | null
          closure_date: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          firm_id: string
          case_number: string
          title: string
          case_type: string
          status: string
          description?: string | null
          assigned_to?: string | null
          client_id: string
          opposing_party_id?: string | null
          court_name?: string | null
          court_location?: string | null
          judge_name?: string | null
          filing_date?: string | null
          closure_date?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          firm_id?: string
          case_number?: string
          title?: string
          case_type?: string
          status?: string
          description?: string | null
          assigned_to?: string | null
          client_id?: string
          opposing_party_id?: string | null
          court_name?: string | null
          court_location?: string | null
          judge_name?: string | null
          filing_date?: string | null
          closure_date?: string | null
        }
      }
      parties: {
        Row: {
          id: string
          created_at: string
          firm_id: string
          type: string
          first_name: string | null
          last_name: string | null
          organization_name: string | null
          email: string | null
          phone: string | null
          address: string | null
          notes: string | null
          is_client: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          firm_id: string
          type: string
          first_name?: string | null
          last_name?: string | null
          organization_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          is_client: boolean
        }
        Update: {
          id?: string
          created_at?: string
          firm_id?: string
          type?: string
          first_name?: string | null
          last_name?: string | null
          organization_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          is_client?: boolean
        }
      }
      documents: {
        Row: {
          id: string
          created_at: string
          firm_id: string
          case_id: string
          name: string
          document_type: string
          file_path: string
          file_size: number
          uploaded_by: string
          version: number
          is_template: boolean
          related_party_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          firm_id: string
          case_id: string
          name: string
          document_type: string
          file_path: string
          file_size: number
          uploaded_by: string
          version?: number
          is_template?: boolean
          related_party_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          firm_id?: string
          case_id?: string
          name?: string
          document_type?: string
          file_path?: string
          file_size?: number
          uploaded_by?: string
          version?: number
          is_template?: boolean
          related_party_id?: string | null
        }
      }
      deadlines: {
        Row: {
          id: string
          created_at: string
          firm_id: string
          case_id: string
          title: string
          description: string | null
          due_date: string
          priority: string
          status: string
          assigned_to: string | null
          reminder_date: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          firm_id: string
          case_id: string
          title: string
          description?: string | null
          due_date: string
          priority: string
          status: string
          assigned_to?: string | null
          reminder_date?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          firm_id?: string
          case_id?: string
          title?: string
          description?: string | null
          due_date?: string
          priority?: string
          status?: string
          assigned_to?: string | null
          reminder_date?: string | null
        }
      }
      financials: {
        Row: {
          id: string
          created_at: string
          firm_id: string
          case_id: string
          transaction_type: string
          amount: number
          description: string | null
          transaction_date: string
          recorded_by: string
          invoice_id: string | null
          party_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          firm_id: string
          case_id: string
          transaction_type: string
          amount: number
          description?: string | null
          transaction_date: string
          recorded_by: string
          invoice_id?: string | null
          party_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          firm_id?: string
          case_id?: string
          transaction_type?: string
          amount?: number
          description?: string | null
          transaction_date?: string
          recorded_by?: string
          invoice_id?: string | null
          party_id?: string | null
        }
      }
      security_interests: {
        Row: {
          id: string
          created_at: string
          firm_id: string
          case_id: string
          type: string
          description: string
          property_address: string | null
          recorded_date: string | null
          amount: number
          lien_position: number | null
          lender_id: string
          borrower_id: string
          maturity_date: string | null
          interest_rate: number | null
          property_value: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          firm_id: string
          case_id: string
          type: string
          description: string
          property_address?: string | null
          recorded_date?: string | null
          amount: number
          lien_position?: number | null
          lender_id: string
          borrower_id: string
          maturity_date?: string | null
          interest_rate?: number | null
          property_value?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          firm_id?: string
          case_id?: string
          type?: string
          description?: string
          property_address?: string | null
          recorded_date?: string | null
          amount?: number
          lien_position?: number | null
          lender_id?: string
          borrower_id?: string
          maturity_date?: string | null
          interest_rate?: number | null
          property_value?: number | null
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
