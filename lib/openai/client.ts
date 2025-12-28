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
  const prompt = `You are an AI assistant that helps create voice AI agents for businesses. 
Given a business description, generate:
1. A system prompt that defines the agent's personality and behavior
2. A recommended voice ID from Vapi's voice library (choose based on context: professional, friendly, etc.)
3. Optional: JSON schema for function tools if needed

Business Description: ${userDescription}

Respond in JSON format:
{
  "systemPrompt": "...",
  "voiceId": "...",
  "tools": []
}`

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

  return JSON.parse(content) as AgentConfig
}

