import { Retell } from 'retell-sdk';

// Initialize Retell client
export const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || '',
});

// Helper function to check if Retell is configured
export function isRetellConfigured(): boolean {
  return !!process.env.RETELL_API_KEY;
}

// Retell API types
export interface RetellAgent {
  agent_id: string;
  agent_name: string;
  llm_websocket_url?: string;
  voice_id: string;
  language?: string;
  enable_transcription?: boolean;
  enable_recording?: boolean;
}

export interface RetellPhoneNumber {
  phone_number: string;
  phone_number_id: string;
  agent_id?: string;
}

export interface RetellCall {
  call_id: string;
  agent_id: string;
  from_number: string;
  to_number: string;
  status: 'ringing' | 'answered' | 'ended' | 'failed';
  started_at?: string;
  ended_at?: string;
  duration?: number;
  transcript?: string;
  recording_url?: string;
}

export interface RetellWebhookEvent {
  event: 'call_started' | 'call_ended' | 'function_call' | 'update_agent_state';
  call: RetellCall;
  data?: any;
}

