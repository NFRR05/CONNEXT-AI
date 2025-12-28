import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user's agents
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (agentsError) {
      return NextResponse.json(
        { error: 'Failed to fetch agents' },
        { status: 500 }
      )
    }

    return NextResponse.json({ agents }, { status: 200 })
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { description, name } = body

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    // Step 1: Generate agent config using OpenAI
    const { generateAgentConfig } = await import('@/lib/openai/client')
    let agentConfig
    try {
      agentConfig = await generateAgentConfig(description)
    } catch (error) {
      console.error('OpenAI error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate agent configuration. Please try again.'
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

    // Validate agentConfig
    if (!agentConfig) {
      return NextResponse.json(
        { error: 'Failed to generate agent configuration. Please try again.' },
        { status: 500 }
      )
    }

    if (!agentConfig.systemPrompt || typeof agentConfig.systemPrompt !== 'string') {
      console.error('Invalid agentConfig:', agentConfig)
      return NextResponse.json(
        { error: 'Invalid agent configuration generated. Please try again.' },
        { status: 500 }
      )
    }

    // Step 2: Create assistant in Vapi
    const { createAssistant } = await import('@/lib/vapi/client')
    const vapiApiKey = process.env.VAPI_API_KEY
    
    if (!vapiApiKey) {
      return NextResponse.json(
        { error: 'Vapi API key not configured' },
        { status: 500 }
      )
    }

    // Generate a safe name from systemPrompt or use provided name
    // Ensure systemPrompt is a valid string before calling substring
    const systemPromptStr = agentConfig.systemPrompt && typeof agentConfig.systemPrompt === 'string' 
      ? agentConfig.systemPrompt 
      : description || 'Untitled Agent'
    const agentName = name || (systemPromptStr.length > 50 ? systemPromptStr.substring(0, 50) : systemPromptStr) || 'Untitled Agent'
    const firstMessage = systemPromptStr

    let vapiAssistant
    try {
      vapiAssistant = await createAssistant(vapiApiKey, {
        name: agentName,
        firstMessage: firstMessage, // Vapi uses firstMessage instead of systemPrompt
        voiceId: agentConfig.voiceId,
        model: 'gpt-4o',
      })
    } catch (error) {
      console.error('Vapi error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create Vapi assistant'
      // Provide more helpful error message
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'Invalid Vapi API key. Please check your VAPI_API_KEY environment variable in Vercel.' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

    // Step 3: Generate API secret
    const apiSecret = crypto.randomUUID().replace(/-/g, '')

    // Step 4: Save agent to database
    // Use the agentName we already created above
    
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .insert({
        user_id: user.id,
        name: agentName,
        vapi_assistant_id: vapiAssistant.id,
        vapi_phone_number_id: null, // Can be added later
        api_secret: apiSecret,
        system_prompt: agentConfig.systemPrompt,
        voice_id: agentConfig.voiceId || null,
      })
      .select()
      .single()

    if (agentError) {
      console.error('Error creating agent:', agentError)
      return NextResponse.json(
        { error: 'Failed to save agent to database' },
        { status: 500 }
      )
    }

    return NextResponse.json({ agent }, { status: 201 })
  } catch (error) {
    console.error('Error creating agent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

