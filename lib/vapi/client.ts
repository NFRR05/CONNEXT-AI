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
    model: params.model || 'gpt-3.5-turbo',
  }

  // Use firstMessage (preferred) or systemPrompt as fallback
  if (params.firstMessage) {
    requestBody.firstMessage = params.firstMessage
  } else if (params.systemPrompt) {
    requestBody.firstMessage = params.systemPrompt
  }

  // Add voice configuration if provided
  // Note: Vapi supports multiple voice formats:
  // 1. Vapi-provided voices: just use the voice ID as a string
  // 2. Custom 11labs voices: requires provider configuration in Vapi dashboard
  // For now, we'll omit voice to use Vapi's default, or use voiceId as string if provided
  // This avoids the 11labs provider issue when using Vapi-provided voices
  if (params.voiceId && params.voiceId.trim() !== '') {
    // Use voice ID as string for Vapi-provided voices
    // If you need custom 11labs voices, configure them in Vapi dashboard first
    requestBody.voice = params.voiceId.trim()
    console.log('[VAPI Client] Using voice ID:', params.voiceId)
  } else {
    console.log('[VAPI Client] No voice ID provided - Vapi will use default voice')
  }

  // Log request for debugging (without sensitive data)
  console.log('[VAPI Client] Creating Vapi assistant:', {
    url: `${VAPI_API_URL}/assistant`,
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey.length,
    requestBody: {
      ...requestBody,
      firstMessage: requestBody.firstMessage ? requestBody.firstMessage.substring(0, 100) + '...' : undefined,
    },
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
    let errorDetails: any = null
    try {
      const error = await response.json()
      errorDetails = error
      errorMessage = `Vapi API error: ${error.message || error.error || response.statusText} (Status: ${response.status})`
      // Log full error for debugging
      console.error('[VAPI Client] Vapi API error details:', {
        status: response.status,
        statusText: response.statusText,
        error: error,
        requestBody: {
          ...requestBody,
          firstMessage: requestBody.firstMessage ? requestBody.firstMessage.substring(0, 100) + '...' : undefined,
        },
      })
    } catch (e) {
      // If response is not JSON, try to get text
      try {
        const text = await response.text()
        errorMessage = `Vapi API error: ${text || response.statusText} (Status: ${response.status})`
        console.error('[VAPI Client] Vapi API error (non-JSON response):', {
          status: response.status,
          statusText: response.statusText,
          responseText: text,
        })
      } catch (e2) {
        // Fallback to status text
        errorMessage = `Vapi API error: ${response.status} ${response.statusText}`
        console.error('[VAPI Client] Vapi API error (failed to read response):', {
          status: response.status,
          statusText: response.statusText,
          parseError: e2,
        })
      }
    }
    throw new Error(errorMessage)
  }
  
  console.log('[VAPI Client] Vapi assistant created successfully')

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

