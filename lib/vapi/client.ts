/**
 * Vapi.ai API Client
 * 
 * This module provides functions to interact with the Vapi.ai API
 * for creating voice assistants and managing phone numbers.
 */

const VAPI_API_URL = 'https://api.vapi.ai'

export interface CreateAssistantParams {
  name: string
  systemPrompt: string
  voiceId?: string
  model?: string
  firstMessage?: string
}

export interface Assistant {
  id: string
  name: string
  // Add other fields as needed
}

export async function createAssistant(
  apiKey: string,
  params: CreateAssistantParams
): Promise<Assistant> {
  const response = await fetch(`${VAPI_API_URL}/assistant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      name: params.name,
      systemPrompt: params.systemPrompt,
      voiceId: params.voiceId,
      model: params.model || 'gpt-4o',
      firstMessage: params.firstMessage,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Vapi API error: ${error.message || response.statusText}`)
  }

  return response.json()
}

export async function createPhoneNumber(apiKey: string): Promise<{ id: string; number: string }> {
  const response = await fetch(`${VAPI_API_URL}/phone-number`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Vapi API error: ${error.message || response.statusText}`)
  }

  return response.json()
}

