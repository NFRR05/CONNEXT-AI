import { retellClient, isRetellConfigured } from './client'

export interface CreateRetellAgentParams {
  agent_name: string
  llm_websocket_url?: string
  llm_id?: string // Retell LLM ID (if using Retell's built-in LLM)
  voice_id?: string
  language?: string
  enable_transcription?: boolean
  enable_recording?: boolean
  system_prompt?: string
  metadata?: Record<string, any>
}

export interface RetellAgentResponse {
  agent_id: string
  agent_name: string
  voice_id: string
  language?: string
  enable_transcription?: boolean
  enable_recording?: boolean
}

/**
 * Create a Retell AI agent
 */
export async function createRetellAgent(
  params: CreateRetellAgentParams
): Promise<RetellAgentResponse> {
  if (!isRetellConfigured()) {
    throw new Error('Retell AI is not configured. Please set RETELL_API_KEY in environment variables.')
  }

  try {
    // Check available methods on retellClient
    console.log('[Retell Agent] Available methods:', Object.keys(retellClient))
    console.log('[Retell Agent] Agent methods:', retellClient.agent ? Object.keys(retellClient.agent) : 'agent is undefined')

    // Build agent creation payload
    const agentPayload: any = {
      agent_name: params.agent_name,
      voice_id: params.voice_id || '11labs-Jenny',
      language: params.language || 'en-US',
      enable_transcription: params.enable_transcription ?? true,
      enable_recording: params.enable_recording ?? true,
      system_prompt: params.system_prompt,
    }

    // Add response_engine (required by Retell API)
    // Must have exactly one of: llm_id, llm_websocket_url, or conversation_flow_id
    if (params.llm_websocket_url) {
      // Use custom LLM via websocket
      agentPayload.response_engine = {
        llm_websocket_url: params.llm_websocket_url,
      }
    } else if (params.llm_id) {
      // Use Retell's built-in LLM with provided LLM ID
      agentPayload.response_engine = {
        llm_id: params.llm_id,
      }
    } else {
      // No LLM specified - use websocket URL as fallback
      // NOTE: This requires implementing /api/retell/llm-websocket endpoint
      // OR create an LLM in Retell Dashboard (Settings → LLMs) and pass llm_id
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://waspier-waffly-felipa.ngrok-free.dev'
      agentPayload.response_engine = {
        llm_websocket_url: `${appUrl}/api/retell/llm-websocket`,
      }
      console.warn('[Retell Agent] No llm_id or llm_websocket_url provided. Using websocket URL:', `${appUrl}/api/retell/llm-websocket`)
      console.warn('[Retell Agent] Make sure this endpoint exists, or create an LLM in Retell Dashboard and pass llm_id.')
    }

    // Add metadata if provided
    if (params.metadata) {
      agentPayload.metadata = params.metadata
    }

    // Try different method names based on SDK version
    let agent
    const agentClient = retellClient.agent as any
    if (agentClient?.create) {
      agent = await agentClient.create(agentPayload)
    } else if (agentClient?.createAgent) {
      agent = await agentClient.createAgent(agentPayload)
    } else {
      throw new Error(`Retell SDK method not found. Available methods: ${retellClient.agent ? Object.keys(retellClient.agent).join(', ') : 'agent is undefined'}`)
    }

    return {
      agent_id: agent.agent_id,
      agent_name: agent.agent_name,
      voice_id: agent.voice_id,
      language: agent.language,
      enable_transcription: agent.enable_transcription,
      enable_recording: agent.enable_recording,
    }
  } catch (error) {
    console.error('[Retell Agent] Error creating agent:', error)
    throw new Error(
      error instanceof Error
        ? `Failed to create Retell agent: ${error.message}`
        : 'Failed to create Retell agent'
    )
  }
}

/**
 * Purchase a Retell phone number
 */
export async function purchaseRetellPhoneNumber(
  agentId: string,
  areaCode?: string
): Promise<{ phone_number: string; phone_number_id: string }> {
  if (!isRetellConfigured()) {
    throw new Error('Retell AI is not configured')
  }

  try {
    // Try different method names based on SDK version
    let phoneNumber
    const phoneClient = retellClient.phoneNumber as any
    if (phoneClient?.create) {
      phoneNumber = await phoneClient.create({
        agent_id: agentId,
        area_code: areaCode,
      })
    } else if (phoneClient?.createPhoneNumber) {
      phoneNumber = await phoneClient.createPhoneNumber({
        agent_id: agentId,
        area_code: areaCode,
      })
    } else {
      throw new Error(`Retell SDK phoneNumber method not found. Available methods: ${retellClient.phoneNumber ? Object.keys(retellClient.phoneNumber).join(', ') : 'phoneNumber is undefined'}`)
    }

    return {
      phone_number: phoneNumber.phone_number,
      phone_number_id: phoneNumber.phone_number_id,
    }
  } catch (error) {
    console.error('[Retell Agent] Error purchasing phone number:', error)
    throw new Error(
      error instanceof Error
        ? `Failed to purchase Retell phone number: ${error.message}`
        : 'Failed to purchase Retell phone number'
    )
  }
}

/**
 * Update a Retell agent
 */
export async function updateRetellAgent(
  agentId: string,
  updates: Partial<CreateRetellAgentParams>
): Promise<RetellAgentResponse> {
  if (!isRetellConfigured()) {
    throw new Error('Retell AI is not configured')
  }

  try {
    // Try different method names based on SDK version
    let agent
    const agentClient = retellClient.agent as any
    if (agentClient?.update) {
      agent = await agentClient.update(agentId, updates)
    } else if (agentClient?.updateAgent) {
      agent = await agentClient.updateAgent(agentId, updates)
    } else {
      throw new Error(`Retell SDK update method not found. Available methods: ${retellClient.agent ? Object.keys(retellClient.agent).join(', ') : 'agent is undefined'}`)
    }

    return {
      agent_id: agent.agent_id,
      agent_name: agent.agent_name,
      voice_id: agent.voice_id,
      language: agent.language,
      enable_transcription: agent.enable_transcription,
      enable_recording: agent.enable_recording,
    }
  } catch (error) {
    console.error('[Retell Agent] Error updating agent:', error)
    throw new Error(
      error instanceof Error
        ? `Failed to update Retell agent: ${error.message}`
        : 'Failed to update Retell agent'
    )
  }
}

