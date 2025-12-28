/**
 * Vapi.ai API Client
 * 
 * This module provides functions to interact with the Vapi.ai API
 * for creating voice assistants and managing phone numbers.
 */

const VAPI_API_URL = 'https://api.vapi.ai'

export interface CreateAssistantParams {
  name: string
  systemPrompt?: string // Optional, will be used as firstMessage if provided
  voiceId?: string
  model?: string
  firstMessage?: string // Vapi API uses firstMessage instead of systemPrompt
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
  // Validate API key format
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Vapi API key is required')
  }

  // Vapi API expects different field structure
  // Use firstMessage for the system prompt, and voice as an object
  const requestBody: any = {
    name: params.name,
    model: params.model || 'gpt-4o',
  }

  // Use firstMessage (preferred) or systemPrompt as fallback
  if (params.firstMessage) {
    requestBody.firstMessage = params.firstMessage
  } else if (params.systemPrompt) {
    requestBody.firstMessage = params.systemPrompt
  }

  // Add voice configuration if provided (Vapi expects voice object, not voiceId directly)
  if (params.voiceId) {
    requestBody.voice = {
      provider: '11labs', // Default provider, adjust if needed
      voiceId: params.voiceId,
    }
  }

  // Log request for debugging (without sensitive data)
  console.log('Creating Vapi assistant:', {
    url: `${VAPI_API_URL}/assistant`,
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey.length,
    requestBody: { ...requestBody, systemPrompt: requestBody.systemPrompt.substring(0, 50) + '...' },
  })

  const response = await fetch(`${VAPI_API_URL}/assistant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    let errorMessage = `Vapi API error: ${response.status} ${response.statusText}`
    try {
      const error = await response.json()
      errorMessage = `Vapi API error: ${error.message || error.error || response.statusText} (Status: ${response.status})`
      // Log full error for debugging
      console.error('Vapi API error details:', {
        status: response.status,
        statusText: response.statusText,
        error: error,
      })
    } catch (e) {
      // If response is not JSON, try to get text
      try {
        const text = await response.text()
        errorMessage = `Vapi API error: ${text || response.statusText} (Status: ${response.status})`
      } catch (e2) {
        // Fallback to status text
        errorMessage = `Vapi API error: ${response.status} ${response.statusText}`
      }
    }
    throw new Error(errorMessage)
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

export async function getPhoneNumber(apiKey: string, phoneNumberId: string): Promise<{ id: string; number: string }> {
  const response = await fetch(`${VAPI_API_URL}/phone-number/${phoneNumberId}`, {
    method: 'GET',
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

