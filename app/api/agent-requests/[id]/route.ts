import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimiters } from '@/lib/rate-limit-supabase'
import { adminRequestUpdateSchema, validateInput } from '@/lib/validation'
import { createErrorResponse, logError } from '@/lib/security/error-handler'
import { sanitizeText } from '@/lib/security/sanitization'
import crypto from 'crypto'

// GET: Get a specific request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: requestId } = await params

    // Fetch request
    const { data: request, error: requestError } = await supabase
      .from('agent_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (requestError || !request) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Verify user owns the request (or is admin)
    if (request.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({ request }, { status: 200 })
  } catch (error) {
    logError('Agent Request GET', error)
    return createErrorResponse(
      error,
      'Internal server error',
      500
    )
  }
}

// PATCH: Update request (admin approves/rejects, or user cancels)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: requestId } = await params

    console.log('[Agent Request PATCH] Received request:', {
      requestId,
      userId: user.id,
      userEmail: user.email,
    })

    // Rate limiting
    const rateLimit = await rateLimiters.apiGeneral(user.id)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Fetch request
    const { data: existingRequest, error: fetchError } = await supabase
      .from('agent_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
      // Don't log full body (may contain sensitive data)
      console.log('[Agent Request PATCH] Request body received')
    } catch (error) {
      logError('Agent Request PATCH', error)
      return NextResponse.json(
        { error: 'Invalid JSON body', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 400 }
      )
    }

    // Check if user is updating status (admin action) or canceling (user action)
    const isStatusUpdate = body.status && ['approved', 'rejected'].includes(body.status)
    const isUserCancel = body.status === 'cancelled' && existingRequest.user_id === user.id && existingRequest.status === 'pending'

    if (isStatusUpdate) {
      console.log('[Agent Request PATCH] Admin status update detected')
      // Admin action - validate input
      const validation = validateInput(adminRequestUpdateSchema, body)
      if (!validation.success) {
        logError('Agent Request PATCH', new Error('Validation failed'))
        return NextResponse.json(
          { 
            error: 'Invalid input data',
            details: validation.errors.errors
          },
          { status: 400 }
        )
      }
      console.log('[Agent Request PATCH] Validation passed, status:', validation.data.status)

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const userRole = profile?.role || 'client'
      
      if (userRole !== 'admin' && userRole !== 'support') {
        return NextResponse.json(
          { error: 'Unauthorized. Admin access required.' },
          { status: 403 }
        )
      }

      const updateData: any = {
        status: validation.data.status,
        admin_id: user.id,
        updated_at: new Date().toISOString(),
      }

      if (validation.data.admin_notes) {
        updateData.admin_notes = validation.data.admin_notes
      }

      // If approved, mark as completed and trigger implementation
      if (validation.data.status === 'approved') {
        updateData.completed_at = new Date().toISOString()
      }

      const { data: updatedRequest, error: updateError } = await supabase
        .from('agent_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating request:', updateError)
        return NextResponse.json(
          { error: 'Failed to update request' },
          { status: 500 }
        )
      }

      // If approved, implement the request
      if (validation.data.status === 'approved') {
        try {
          console.log('[Agent Request] Starting implementation for request:', requestId)
          await implementAgentRequest(updatedRequest, supabase)
          console.log('[Agent Request] Successfully implemented request:', requestId)
        } catch (implError) {
          console.error('[Agent Request] Error implementing request:', {
            requestId,
            error: implError,
            message: implError instanceof Error ? implError.message : 'Unknown error',
            stack: implError instanceof Error ? implError.stack : undefined,
          })
          
          // Update request status to indicate implementation failed
          const errorMessage = implError instanceof Error ? implError.message : 'Unknown error'
          try {
          await supabase
            .from('agent_requests')
            .update({ 
              status: 'pending',
                admin_notes: `Approved but implementation failed: ${errorMessage}. Please review.`
            })
            .eq('id', requestId)
          } catch (updateError) {
            console.error('[Agent Request] Failed to update request status:', updateError)
          }
          
          // Return error with details for debugging
          return NextResponse.json(
            { 
              error: 'Request approved but implementation failed',
              details: errorMessage,
              requestId: requestId,
              // Include more context for debugging
              hint: 'Check server logs for detailed error information. Common issues: missing Twilio credentials, database constraint violations, or missing request data.',
            },
            { status: 500 }
          )
        }
      }

      return NextResponse.json({ request: updatedRequest }, { status: 200 })
    } else if (isUserCancel) {
      // User canceling their own pending request
      const { data: updatedRequest, error: updateError } = await supabase
        .from('agent_requests')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single()

      if (updateError) {
        console.error('Error canceling request:', updateError)
        return NextResponse.json(
          { error: 'Failed to cancel request' },
          { status: 500 }
        )
      }

      return NextResponse.json({ request: updatedRequest }, { status: 200 })
    } else {
      return NextResponse.json(
        { error: 'Unauthorized or invalid operation' },
        { status: 403 }
      )
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('[Agent Request PATCH] Unexpected error:', {
      error,
      message: errorMessage,
      stack: errorStack,
      errorType: error?.constructor?.name,
    })
    
    // Return detailed error for debugging
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorMessage,
        // Only include stack in development
        ...(process.env.NODE_ENV === 'development' && errorStack ? { stack: errorStack } : {}),
      },
      { status: 500 }
    )
  }
}

// Helper function to implement approved agent request
async function implementAgentRequest(
  request: any,
  supabase: any
) {
  console.log('[implementAgentRequest] Starting implementation for request:', {
    requestId: request.id,
    requestType: request.request_type,
    userId: request.user_id,
    agentId: request.agent_id,
  })

  if (request.request_type === 'create') {
    // Check if user already has an agent (ONE AGENT PER CLIENT constraint)
    const { data: existingAgent, error: existingError } = await supabase
      .from('agents')
      .select('id, name')
      .eq('user_id', request.user_id)
      .single()

    if (existingAgent) {
      console.error('[implementAgentRequest] User already has an agent:', existingAgent.id)
      throw new Error(`User already has an agent (${existingAgent.name}). Cannot create another agent. Please update or delete the existing agent first.`)
    }

    // Check user's subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', request.user_id)
      .single()

    if (profileError || !profile) {
      console.error('[implementAgentRequest] Profile error:', profileError)
      throw new Error(`User profile not found: ${profileError?.message || 'Unknown error'}`)
    }

    // Create new agent (Twilio ONLY)
    // Import agent creation logic
    const { generateAgentConfig } = await import('@/lib/openai/client')
    const { purchasePhoneNumber } = await import('@/lib/twilio/client')
    
    // Use description or form_data to generate agent config
    const description = request.description || 
      (request.form_data ? JSON.stringify(request.form_data) : 'Create a helpful AI assistant')
    
    if (!description || description.trim() === '') {
      throw new Error('Description or form_data is required for agent creation')
    }

    console.log('[implementAgentRequest] Generating agent config with description length:', description.length)

    // Generate agent config with comprehensive form data
    let agentConfig
    try {
      agentConfig = await generateAgentConfig(
        description,
      request.form_data // Pass structured form data for enhanced prompt generation
    )
      console.log('[implementAgentRequest] Agent config generated successfully')
    } catch (error) {
      console.error('[implementAgentRequest] Error generating agent config:', error)
      throw new Error(`Failed to generate agent config: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    const systemPromptStr = agentConfig.systemPrompt || request.description
    const agentName = request.name || systemPromptStr.substring(0, 50).trim() || 'Untitled Agent'

    // Purchase Twilio phone number
    let twilioPhoneNumber = null
    try {
      console.log('[implementAgentRequest] Purchasing Twilio phone number...')
      
      // Check if Twilio credentials are configured
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in environment variables.')
      }
      
      twilioPhoneNumber = await purchasePhoneNumber({
        areaCode: request.form_data?.area_code || null, // Use area code from form_data if available
      })
      console.log('[implementAgentRequest] Twilio phone number purchased:', {
        sid: twilioPhoneNumber.sid,
        phoneNumber: twilioPhoneNumber.phoneNumber,
      })
    } catch (error) {
      console.error('[implementAgentRequest] Twilio phone number purchase error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })
      throw new Error(`Failed to purchase Twilio phone number: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Generate API secret
    const apiSecret = crypto.randomUUID().replace(/-/g, '')

    // Admin will create n8n workflow manually and link it via n8n_workflow_id
    const n8nWorkflowId: string | null = null
    const n8nHostingType: 'self_hosted' | 'hosted' = 'hosted'

    // Create agent in database (Twilio ONLY)
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .insert({
        user_id: request.user_id,
        name: agentName,
        provider_type: 'twilio', // ALWAYS Twilio
        twilio_phone_number_sid: twilioPhoneNumber?.sid || null,
        twilio_phone_number: twilioPhoneNumber?.phoneNumber || null,
        vapi_assistant_id: null, // Always null
        vapi_phone_number_id: null, // Always null
        api_secret: apiSecret,
        system_prompt: agentConfig.systemPrompt || systemPromptStr,
        voice_id: agentConfig.voiceId || request.voice_id || null,
        form_data: request.form_data || {},
        workflow_config: request.workflow_config || {},
        n8n_workflow_id: n8nWorkflowId,
        n8n_hosting_type: n8nHostingType,
      })
      .select()
      .single()

    if (agentError) {
      console.error('[implementAgentRequest] Agent creation error:', {
        error: agentError,
        message: agentError.message,
        code: agentError.code,
        details: agentError.details,
        hint: agentError.hint,
      })
      throw new Error(`Failed to create agent: ${agentError.message}${agentError.hint ? ` (${agentError.hint})` : ''}`)
    }

    console.log('[implementAgentRequest] Agent created successfully:', agent.id)

    // Initialize webhook activity tracking (optional - table might not exist)
    try {
    await supabase
      .from('webhook_activity')
      .insert({
        agent_id: agent.id,
        status: 'active',
      })
      .onConflict('agent_id')
      .ignore()
      console.log('[implementAgentRequest] Webhook activity initialized')
    } catch (webhookError) {
      console.warn('[implementAgentRequest] Failed to initialize webhook activity (table might not exist):', webhookError)
      // Continue - this is not critical
    }

    // Update request with agent_id
    await supabase
      .from('agent_requests')
      .update({ agent_id: agent.id })
      .eq('id', request.id)

    return agent
  } else if (request.request_type === 'update' && request.agent_id) {
    // Update existing agent
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (request.name) updateData.name = request.name
    if (request.system_prompt !== undefined) updateData.system_prompt = request.system_prompt
    if (request.voice_id !== undefined) updateData.voice_id = request.voice_id
    if (request.form_data !== undefined) updateData.form_data = request.form_data
    if (request.workflow_config !== undefined) updateData.workflow_config = request.workflow_config

    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', request.agent_id)
      .single()

    if (agentError || !agent) {
      throw new Error('Agent not found')
    }

    // For Twilio agents, no external API updates needed
    // System prompt and voice_id are stored in database and used by WebSocket server

    const { data: updatedAgent, error: updateError } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', request.agent_id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update agent: ${updateError.message}`)
    }

    return updatedAgent
  } else if (request.request_type === 'delete' && request.agent_id) {
    // Delete agent
    const { error: deleteError } = await supabase
      .from('agents')
      .delete()
      .eq('id', request.agent_id)

    if (deleteError) {
      throw new Error(`Failed to delete agent: ${deleteError.message}`)
    }

    return { deleted: true }
  } else {
    throw new Error('Invalid request type or missing agent_id')
  }
}

