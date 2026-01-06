import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimiters } from '@/lib/rate-limit-supabase'
import { agentRequestSchema, validateInput } from '@/lib/validation'
import { createErrorResponse, logError } from '@/lib/security/error-handler'
import { sanitizeText } from '@/lib/security/sanitization'

// GET: Fetch agent requests (users see their own, admins see all)
export async function GET(request: NextRequest) {
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

    // Rate limiting
    const rateLimit = await rateLimiters.apiGeneral(user.id)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const requestType = searchParams.get('request_type')

    // Build query - users see their own requests
    let query = supabase
      .from('agent_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (requestType) {
      query = query.eq('request_type', requestType)
    }

    const { data: requests, error: requestsError } = await query

    if (requestsError) {
      logError('Agent Requests GET', requestsError)
      return createErrorResponse(
        requestsError,
        'Failed to fetch requests',
        500
      )
    }

    return NextResponse.json({ requests: requests || [] }, { status: 200 })
  } catch (error) {
    logError('Agent Requests GET', error)
    return createErrorResponse(
      error,
      'Internal server error',
      500
    )
  }
}

// POST: Create a new agent request
export async function POST(request: NextRequest) {
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

    // Rate limiting (more lenient for requests)
    const rateLimit = await rateLimiters.apiGeneral(user.id)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Validate input
    const validation = validateInput(agentRequestSchema, body)
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

    const requestData = validation.data

    // Prevent clients from creating new agents (only update/delete allowed)
    if (requestData.request_type === 'create') {
      // Check user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const userRole = profile?.role || 'client'
      
      // Only admins can create agents directly
      if (userRole !== 'admin' && userRole !== 'support') {
        return NextResponse.json(
          { 
            error: 'Clients cannot create new agents. You can only request updates or deletions to your existing agent.',
            hint: 'If you need a new agent, contact support.'
          },
          { status: 403 }
        )
      }
    }

    // For update/delete requests, verify agent belongs to user
    if ((requestData.request_type === 'update' || requestData.request_type === 'delete') && requestData.agent_id) {
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('id', requestData.agent_id)
        .eq('user_id', user.id)
        .single()

      if (agentError || !agent) {
        return NextResponse.json(
          { error: 'Agent not found or does not belong to you' },
          { status: 404 }
        )
      }
    }

    // Sanitize input before storage
    const sanitizedName = requestData.name ? sanitizeText(requestData.name) : null
    const sanitizedDescription = requestData.description ? sanitizeText(requestData.description) : null
    const sanitizedSystemPrompt = requestData.system_prompt ? sanitizeText(requestData.system_prompt) : null

    // Create request
    const { data: newRequest, error: createError } = await supabase
      .from('agent_requests')
      .insert({
        user_id: user.id,
        agent_id: requestData.agent_id || null,
        request_type: requestData.request_type,
        status: 'pending',
        name: sanitizedName,
        description: sanitizedDescription,
        system_prompt: sanitizedSystemPrompt,
        voice_id: requestData.voice_id || null,
        priority: (body as any).priority || 'normal',
        form_data: requestData.form_data || {},
        workflow_config: requestData.workflow_config || {},
      })
      .select()
      .single()

    if (createError) {
      logError('Agent Requests POST', createError)
      return createErrorResponse(
        createError,
        'Failed to create request',
        500
      )
    }

    return NextResponse.json(
      { 
        request: newRequest,
        message: 'Request submitted successfully. It will be reviewed by an admin.'
      },
      { status: 201 }
    )
  } catch (error) {
    logError('Agent Requests POST', error)
    return createErrorResponse(
      error,
      'Internal server error',
      500
    )
  }
}


