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
  voiceId: string
  tools?: any[]
}

export async function generateAgentConfig(
  userDescription: string
): Promise<AgentConfig> {
  // Check if API key is configured
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.')
  }

  const prompt = `You are an AI assistant that helps create voice AI agents for businesses. 
Given a business description, generate:
1. A system prompt that defines the agent's personality and behavior (be specific and detailed)
2. A recommended voice ID from Vapi's voice library. Use one of these common voice IDs:
   - "jennifer" (professional female)
   - "michael" (professional male)
   - "sarah" (friendly female)
   - "david" (friendly male)
   - "emily" (warm female)
   - "james" (warm male)
   Choose based on context: professional, friendly, warm, etc.
3. Optional: JSON schema for function tools if needed (empty array if not needed)

Business Description: ${userDescription}

Respond in JSON format:
{
  "systemPrompt": "...",
  "voiceId": "...",
  "tools": []
}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
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
      throw new Error('No response from OpenAI')
    }

    try {
      const parsed = JSON.parse(content) as AgentConfig
      
      // Validate required fields
      if (!parsed.systemPrompt || !parsed.voiceId) {
        throw new Error('Invalid response from OpenAI: missing required fields')
      }

      return parsed
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Content received:', content)
      throw new Error('Failed to parse OpenAI response. Please try again.')
    }
  } catch (error: any) {
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

