import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { createErrorResponse, logError } from '@/lib/security/error-handler'
import { sanitizeText, normalizePhone } from '@/lib/security/sanitization'

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
      logError('Agent Creation', authError)
      return createErrorResponse(
        authError,
        'Unauthorized',
        401
      )
    }
    
    if (!user) {
      logError('Agent Creation', new Error('No user found after auth check'))
      return createErrorResponse(
        new Error('Unauthorized'),
        'Unauthorized',
        401
      )
    }
    
    // Log without PII
    console.log('[Agent Creation] User authenticated:', {
      userId: user.id,
      // email: user.email, // ❌ REMOVED - PII
    })

    // Check if current user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    const isAdmin = profile?.role === 'admin' || profile?.role === 'support'
    
    console.log('[Agent Creation] Step 2.5: Parsing request body for target user...')
    let body
    try {
      body = await request.json()
      console.log('[Agent Creation] Request body received:', {
        hasDescription: !!body.description,
        descriptionLength: body.description?.length || 0,
        hasName: !!body.name,
        name: body.name,
        hasUserEmail: !!body.user_email,
        hasUserId: !!body.user_id,
        isAdmin: isAdmin,
      })
    } catch (parseError) {
      console.error('[Agent Creation] Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid request body. Expected JSON.' },
        { status: 400 }
      )
    }

    // Determine target user
    let targetUserId = user.id // Default to current user
    let targetUserEmail = body.user_email // Optional: email for admin to create agent for another user

    // If admin specified user_email, find that user
    if (isAdmin && targetUserEmail) {
      // Use service role client to query auth.users
      const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      try {
        // Use Supabase Admin API to get user by email
        const { data: adminUsers, error: adminError } = await serviceClient.auth.admin.listUsers()
        
        if (adminError) {
          console.error('[Agent Creation] Error listing users:', adminError)
          return NextResponse.json(
            { error: `Failed to find user: ${adminError.message}` },
            { status: 500 }
          )
        }

        const foundUser = adminUsers?.users?.find((u: any) => 
          u.email?.toLowerCase() === targetUserEmail.toLowerCase()
        )

        if (!foundUser) {
          return NextResponse.json(
            { error: `User with email ${targetUserEmail} not found` },
            { status: 404 }
          )
        }

        targetUserId = foundUser.id
        console.log('[Agent Creation] Admin creating agent for user:', targetUserEmail, 'user_id:', targetUserId)
      } catch (error) {
        console.error('[Agent Creation] Error finding user:', error)
        return NextResponse.json(
          { 
            error: `Failed to find user: ${targetUserEmail}`,
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        )
      }
    } else if (isAdmin && body.user_id) {
      // Admin can also specify user_id directly
      targetUserId = body.user_id
      console.log('[Agent Creation] Admin creating agent for user_id:', targetUserId)
    }

    // Use service role client if admin is creating for another user (to bypass RLS)
    const dbClient = isAdmin && targetUserId !== user.id 
      ? createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : supabase

    // Check if target user already has an agent (ONE AGENT PER CLIENT)
    const { data: existingAgent, error: existingError } = await dbClient
      .from('agents')
      .select('id, name')
      .eq('user_id', targetUserId)
      .single()

    if (existingAgent) {
      console.log('[Agent Creation] Target user already has an agent')
      return NextResponse.json(
        { 
          error: 'User already has an agent. Please request changes to the existing agent instead of creating a new one.',
          // Don't expose agent ID in response
        },
        { status: 400 }
      )
    }

    // Rate limiting (per target user, not admin)
    const { rateLimiters } = await import('@/lib/rate-limit-supabase')
    const rateLimit = await rateLimiters.agentCreation(targetUserId)
    
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

    // Validate input (exclude user_email and user_id from validation)
    const { agentCreationSchema, validateInput } = await import('@/lib/validation')
    const { user_email, user_id, ...agentData } = body
    const validation = validateInput(agentCreationSchema, agentData)
    
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

    // Generate agent name
    let agentName: string = 'Untitled Agent'
    if (name && typeof name === 'string' && name.trim().length > 0) {
      agentName = name.trim()
    } else if (description && typeof description === 'string' && description.trim().length > 0) {
      agentName = description.length > 50
        ? description.substring(0, 50).trim()
        : description.trim()
    }

    // Generate API secret
    console.log('[Agent Creation] Generating API secret...')
    const apiSecret = crypto.randomUUID().replace(/-/g, '')
    console.log('[Agent Creation] API secret generated')

    // Verify target user profile exists (required for foreign key constraint)
    console.log('[Agent Creation] Checking if target user profile exists...')
    const { data: targetProfile, error: profileError } = await dbClient
      .from('profiles')
      .select('id')
      .eq('id', targetUserId)
      .single()
    
    if (profileError || !targetProfile) {
      console.error('[Agent Creation] Profile check failed:', {
        profileError,
        userId: targetUserId,
        profileExists: !!targetProfile,
      })
      return NextResponse.json(
        { 
          error: 'User profile not found. Please ensure the account is properly set up.',
          details: profileError?.message || 'Profile does not exist'
        },
        { status: 500 }
      )
    }
    
    // Save agent to database
    console.log('[Agent Creation] Saving agent to database...')
    const insertData: any = {
      user_id: targetUserId,
      name: agentName,
      api_secret: apiSecret,
      system_prompt: description || null, // Optional: can be set later
      form_data: formData || {},
      workflow_config: workflowConfig || {},
      // Legacy fields (kept nullable for backward compatibility)
      provider_type: null,
      retell_agent_id: null,
      retell_phone_number_id: null,
      twilio_phone_number_sid: null,
      twilio_phone_number: null,
      vapi_assistant_id: null,
      vapi_phone_number_id: null,
      voice_id: null,
    }
    
    const { data: agent, error: agentError } = await dbClient
      .from('agents')
      .insert(insertData)
      .select()
      .single()

    if (agentError) {
      console.error('[Agent Creation] Database insert error:', agentError)
      
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
    
    console.log('[Agent Creation] Agent created successfully:', {
      agentId: agent.id,
      agentName: agent.name,
    })

    return NextResponse.json({ agent }, { status: 201 })
  } catch (error) {
    logError('Agent Creation', error)
    return createErrorResponse(
      error,
      'Internal server error',
      500
    )
  }
}

