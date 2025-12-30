/**
 * OpenAI API Client
 * 
 * This module provides functions to interact with OpenAI API
 * for generating system prompts and JSON schemas for agents.
 */

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface AgentConfig {
  systemPrompt: string
  voiceId?: string | null
  tools?: any[]
}

export async function generateAgentConfig(
  userDescription: string
): Promise<AgentConfig> {
  console.log('[OpenAI Client] Generating agent config...', {
    descriptionLength: userDescription.length,
    hasApiKey: !!process.env.OPENAI_API_KEY,
  })
  
  // Check if API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.error('[OpenAI Client] OpenAI API key is not configured')
    throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.')
  }

  const prompt = `You are an AI assistant that helps create voice AI agents for businesses. 
Given a business description, generate:
1. A system prompt that defines the agent's personality and behavior (be specific and detailed)
2. A voice description (e.g., "professional female", "friendly male", "warm female") - this is just for reference, the actual voice will be selected automatically
3. Optional: JSON schema for function tools if needed (empty array if not needed)

Note: Do not provide a voiceId - leave it as null. The voice will be handled by the system automatically.

Business Description: ${userDescription}

Respond in JSON format:
{
  "systemPrompt": "...",
  "voiceId": null,
  "tools": []
}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates voice AI agent configurations. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      console.error('[OpenAI Client] No content in OpenAI response:', {
        choicesLength: completion.choices.length,
        firstChoice: completion.choices[0],
      })
      throw new Error('No response from OpenAI')
    }

    console.log('[OpenAI Client] OpenAI response received:', {
      contentLength: content.length,
      contentPreview: content.substring(0, 200),
    })

    try {
      const parsed = JSON.parse(content) as AgentConfig
      console.log('[OpenAI Client] JSON parsed successfully:', {
        hasSystemPrompt: !!parsed.systemPrompt,
        systemPromptLength: parsed.systemPrompt?.length || 0,
        hasVoiceId: !!parsed.voiceId,
        voiceId: parsed.voiceId,
        hasTools: !!parsed.tools,
      })
      
      // Validate required fields (voiceId is optional)
      if (!parsed.systemPrompt) {
        console.error('[OpenAI Client] Missing required field in parsed config:', {
          hasSystemPrompt: !!parsed.systemPrompt,
          hasVoiceId: !!parsed.voiceId,
          parsed,
        })
        throw new Error('Invalid response from OpenAI: missing systemPrompt field')
      }
      
      // Log if voiceId is provided or not
      if (parsed.voiceId) {
        console.log('[OpenAI Client] Voice ID provided:', parsed.voiceId)
      } else {
        console.log('[OpenAI Client] No voice ID provided - will use Vapi default voice')
      }

      console.log('[OpenAI Client] Agent config generated successfully')
      return parsed
    } catch (parseError) {
      console.error('[OpenAI Client] JSON parse error:', {
        parseError,
        errorMessage: parseError instanceof Error ? parseError.message : String(parseError),
        contentLength: content.length,
        contentPreview: content.substring(0, 500),
      })
      throw new Error('Failed to parse OpenAI response. Please try again.')
    }
  } catch (error: any) {
    console.error('[OpenAI Client] Error generating agent config:', {
      error,
      errorType: error?.constructor?.name || typeof error,
      errorStatus: error?.status,
      errorCode: error?.code,
      errorMessage: error?.message,
      errorStack: error?.stack,
    })
    
    // Handle OpenAI API errors
    if (error?.status === 429 || error?.code === 'insufficient_quota' || error?.message?.includes('quota')) {
      throw new Error('OpenAI quota exceeded. Please check your plan and billing details at https://platform.openai.com/account/billing')
    }
    if (error?.status === 401 || error?.message?.includes('API key') || error?.message?.includes('Invalid')) {
      throw new Error('Invalid OpenAI API key. Please check your configuration.')
    }
    if (error?.status === 429 || error?.message?.includes('rate limit')) {
      throw new Error('OpenAI rate limit exceeded. Please try again in a moment.')
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to generate agent configuration. Please try again.')
  }
}

