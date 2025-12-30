import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

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
  console.log('[Agent Creation] Starting agent creation process...')
  
  try {
    console.log('[Agent Creation] Step 1: Initializing Supabase client...')
    const supabase = await createClient()
    
    // Get current user
    console.log('[Agent Creation] Step 2: Authenticating user...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('[Agent Creation] Auth error:', {
        error: authError,
        message: authError.message,
        status: authError.status,
      })
      return NextResponse.json(
        { error: 'Unauthorized', details: authError.message },
        { status: 401 }
      )
    }
    
    if (!user) {
      console.error('[Agent Creation] No user found after auth check')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log('[Agent Creation] User authenticated:', {
      userId: user.id,
      email: user.email,
    })

    // Rate limiting (per user)
    const { rateLimiters } = await import('@/lib/rate-limit-supabase')
    const rateLimit = await rateLimiters.agentCreation(user.id)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. You can create up to 3 agents per hour.',
          retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
          }
        }
      )
    }

    console.log('[Agent Creation] Step 3: Parsing request body...')
    let body
    try {
      body = await request.json()
      console.log('[Agent Creation] Request body received:', {
        hasDescription: !!body.description,
        descriptionLength: body.description?.length || 0,
        hasName: !!body.name,
        name: body.name,
      })
    } catch (parseError) {
      console.error('[Agent Creation] Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid request body. Expected JSON.' },
        { status: 400 }
      )
    }

    // Validate input
    const { agentCreationSchema, validateInput } = await import('@/lib/validation')
    const validation = validateInput(agentCreationSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: validation.errors.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    const { description, name, formData, workflowConfig } = validation.data

    // Step 1: Generate agent config using OpenAI
    console.log('[Agent Creation] Step 4: Generating agent config with OpenAI...')
    const { generateAgentConfig } = await import('@/lib/openai/client')
    let agentConfig
    try {
      console.log('[Agent Creation] Calling generateAgentConfig with description length:', description.length)
      agentConfig = await generateAgentConfig(description)
      console.log('[Agent Creation] OpenAI config generated successfully')
    } catch (error) {
      console.error('[Agent Creation] OpenAI error:', {
        error,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      })
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate agent configuration. Please try again.'
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

    // Validate agentConfig with detailed logging
    if (!agentConfig) {
      console.error('[Agent Creation] agentConfig is null or undefined after OpenAI call')
      return NextResponse.json(
        { error: 'Failed to generate agent configuration. Please try again.' },
        { status: 500 }
      )
    }

    console.log('[Agent Creation] agentConfig received:', {
      hasSystemPrompt: !!agentConfig.systemPrompt,
      systemPromptType: typeof agentConfig.systemPrompt,
      systemPromptLength: agentConfig.systemPrompt ? String(agentConfig.systemPrompt).length : 0,
      systemPromptPreview: agentConfig.systemPrompt ? String(agentConfig.systemPrompt).substring(0, 100) : 'null/undefined',
      hasVoiceId: !!agentConfig.voiceId,
      voiceId: agentConfig.voiceId,
      hasTools: !!agentConfig.tools,
      toolsLength: agentConfig.tools?.length || 0,
    })

    // Step 2: Create assistant in Vapi
    console.log('[Agent Creation] Step 5: Creating VAPI assistant...')
    const { createAssistant } = await import('@/lib/vapi/client')
    const vapiApiKey = process.env.VAPI_API_KEY
    
    if (!vapiApiKey) {
      console.error('[Agent Creation] VAPI_API_KEY environment variable is not set')
      return NextResponse.json(
        { error: 'Vapi API key not configured' },
        { status: 500 }
      )
    }
    
    console.log('[Agent Creation] VAPI API key found:', {
      keyLength: vapiApiKey.length,
      keyPrefix: vapiApiKey.substring(0, 10) + '...',
    })

    // Generate a safe name from systemPrompt or use provided name
    // Ensure systemPrompt is a valid string before calling substring
    console.log('[Agent Creation] Step 6: Processing system prompt and agent name...')
    let systemPromptStr: string = 'Untitled Agent'
    
    try {
      if (agentConfig?.systemPrompt && typeof agentConfig.systemPrompt === 'string') {
        const trimmed = agentConfig.systemPrompt.trim()
        if (trimmed.length > 0) {
          systemPromptStr = trimmed
          console.log('[Agent Creation] Using systemPrompt from agentConfig, length:', trimmed.length)
        }
      }
      
      // Fallback to description if systemPrompt is not valid
      if (systemPromptStr === 'Untitled Agent' && description && typeof description === 'string') {
        const trimmedDesc = description.trim()
        if (trimmedDesc.length > 0) {
          systemPromptStr = trimmedDesc
          console.log('[Agent Creation] Using description as fallback for systemPrompt')
        }
      }
    } catch (error) {
      console.error('[Agent Creation] Error processing systemPrompt:', error)
      systemPromptStr = description || 'Untitled Agent'
    }
    
    // Safely create agent name with substring - ensure systemPromptStr is always a string
    let agentName: string = 'Untitled Agent'
    try {
      if (name && typeof name === 'string' && name.trim().length > 0) {
        agentName = name.trim()
        console.log('[Agent Creation] Using provided name:', agentName)
      } else if (systemPromptStr && typeof systemPromptStr === 'string' && systemPromptStr.length > 0) {
        agentName = systemPromptStr.length > 50
          ? systemPromptStr.substring(0, 50).trim()
          : systemPromptStr.trim()
        console.log('[Agent Creation] Generated name from systemPrompt:', agentName)
      }
    } catch (error) {
      console.error('[Agent Creation] Error creating agent name:', error)
      agentName = name || description || 'Untitled Agent'
    }
    
    const firstMessage: string = systemPromptStr || description || 'Hello, how can I help you?'
    console.log('[Agent Creation] Final values:', {
      agentName,
      firstMessageLength: firstMessage.length,
      firstMessagePreview: firstMessage.substring(0, 100),
    })

    let vapiAssistant
    try {
      const vapiParams: any = {
        name: agentName,
        firstMessage: firstMessage, // Vapi uses firstMessage instead of systemPrompt
        model: 'gpt-3.5-turbo',
      }
      
      // Only add voiceId if it's provided and not null
      if (agentConfig.voiceId) {
        vapiParams.voiceId = agentConfig.voiceId
      }
      
      console.log('[Agent Creation] Calling VAPI createAssistant with params:', {
        name: vapiParams.name,
        firstMessageLength: vapiParams.firstMessage.length,
        hasVoiceId: !!vapiParams.voiceId,
        voiceId: vapiParams.voiceId || 'using Vapi default',
        model: vapiParams.model,
      })
      
      vapiAssistant = await createAssistant(vapiApiKey, vapiParams)
      console.log('[Agent Creation] VAPI assistant created successfully:', {
        assistantId: vapiAssistant.id,
        assistantName: vapiAssistant.name,
      })
    } catch (error) {
      console.error('[Agent Creation] Vapi error:', {
        error,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      })
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
    console.log('[Agent Creation] Step 7: Generating API secret...')
    const apiSecret = crypto.randomUUID().replace(/-/g, '')
    console.log('[Agent Creation] API secret generated:', {
      secretLength: apiSecret.length,
      secretPrefix: apiSecret.substring(0, 10) + '...',
    })

    // Step 4: Save agent to database
    console.log('[Agent Creation] Step 8: Saving agent to database...')
    // Use the agentName we already created above
    
    // First, verify user profile exists (required for foreign key constraint)
    console.log('[Agent Creation] Checking if user profile exists...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      console.error('[Agent Creation] Profile check failed:', {
        profileError,
        userId: user.id,
        profileExists: !!profile,
      })
      return NextResponse.json(
        { 
          error: 'User profile not found. Please ensure your account is properly set up.',
          details: profileError?.message || 'Profile does not exist'
        },
        { status: 500 }
      )
    }
    
    console.log('[Agent Creation] Profile verified, preparing database insert...')
    const insertData = {
      user_id: user.id,
      name: agentName,
      vapi_assistant_id: vapiAssistant.id,
      vapi_phone_number_id: null, // Can be added later
      api_secret: apiSecret,
      system_prompt: agentConfig.systemPrompt,
      voice_id: agentConfig.voiceId || null,
      form_data: formData || {},
      workflow_config: workflowConfig || {},
    }
    
    console.log('[Agent Creation] Insert data prepared:', {
      userId: insertData.user_id,
      name: insertData.name,
      vapiAssistantId: insertData.vapi_assistant_id,
      apiSecretLength: insertData.api_secret.length,
      systemPromptLength: insertData.system_prompt?.length || 0,
      voiceId: insertData.voice_id,
    })
    
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .insert(insertData)
      .select()
      .single()

    if (agentError) {
      console.error('[Agent Creation] Database insert error:', {
        error: agentError,
        errorCode: agentError.code,
        errorMessage: agentError.message,
        errorDetails: agentError.details,
        errorHint: agentError.hint,
        insertData: {
          ...insertData,
          system_prompt: insertData.system_prompt ? insertData.system_prompt.substring(0, 100) + '...' : null,
        },
      })
      
      // Provide more specific error messages
      let errorMessage = 'Failed to save agent to database'
      if (agentError.code === '23503') {
        errorMessage = 'Foreign key constraint violation. User profile may not exist.'
      } else if (agentError.code === '23505') {
        errorMessage = 'Duplicate entry. API secret already exists (unlikely, but possible).'
      } else if (agentError.code === '42501') {
        errorMessage = 'Permission denied. Check Row Level Security policies.'
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: agentError.message,
          code: agentError.code,
        },
        { status: 500 }
      )
    }
    
    console.log('[Agent Creation] Agent saved successfully:', {
      agentId: agent.id,
      agentName: agent.name,
      createdAt: agent.created_at,
    })
    console.log('[Agent Creation] Agent creation completed successfully!')

    return NextResponse.json({ agent }, { status: 201 })
  } catch (error) {
    console.error('[Agent Creation] Unexpected error in agent creation:', {
      error,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

