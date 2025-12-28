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
          email: string | null
          subscription_tier: 'free' | 'pro'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          subscription_tier?: 'free' | 'pro'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          subscription_tier?: 'free' | 'pro'
          created_at?: string
          updated_at?: string
        }
      }
      agents: {
        Row: {
          id: string
          user_id: string
          name: string
          vapi_assistant_id: string | null
          vapi_phone_number_id: string | null
          api_secret: string
          system_prompt: string | null
          voice_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          vapi_assistant_id?: string | null
          vapi_phone_number_id?: string | null
          api_secret: string
          system_prompt?: string | null
          voice_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          vapi_assistant_id?: string | null
          vapi_phone_number_id?: string | null
          api_secret?: string
          system_prompt?: string | null
          voice_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          agent_id: string
          customer_phone: string | null
          call_summary: string | null
          call_transcript: string | null
          recording_url: string | null
          sentiment: string | null
          structured_data: Json
          status: 'New' | 'Contacted' | 'Closed'
          duration: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          customer_phone?: string | null
          call_summary?: string | null
          call_transcript?: string | null
          recording_url?: string | null
          sentiment?: string | null
          structured_data?: Json
          status?: 'New' | 'Contacted' | 'Closed'
          duration?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          customer_phone?: string | null
          call_summary?: string | null
          call_transcript?: string | null
          recording_url?: string | null
          sentiment?: string | null
          structured_data?: Json
          status?: 'New' | 'Contacted' | 'Closed'
          duration?: number | null
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

