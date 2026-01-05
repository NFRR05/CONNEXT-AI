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
          provider_type: 'vapi' | 'twilio'
          twilio_phone_number_sid: string | null
          twilio_phone_number: string | null
          twilio_call_sid: string | null
          call_state: 'idle' | 'ringing' | 'in-progress' | 'completed' | 'failed'
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
          provider_type?: 'vapi' | 'twilio'
          twilio_phone_number_sid?: string | null
          twilio_phone_number?: string | null
          twilio_call_sid?: string | null
          call_state?: 'idle' | 'ringing' | 'in-progress' | 'completed' | 'failed'
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
          provider_type?: 'vapi' | 'twilio'
          twilio_phone_number_sid?: string | null
          twilio_phone_number?: string | null
          twilio_call_sid?: string | null
          call_state?: 'idle' | 'ringing' | 'in-progress' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
      // Removed twilio_call_sessions and twilio_media_streams tables (migration 014)
      // n8n now handles all call processing
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
      create_lead_from_twilio_call: {
        Args: {
          p_call_sid: string
          p_call_summary?: string | null
          p_call_transcript?: string | null
          p_sentiment?: string | null
          p_structured_data?: Json
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

