import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorResponse, logError } from '@/lib/security/error-handler'

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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agent_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // First, get user's agent IDs
    const { data: userAgents, error: agentsError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)

    if (agentsError || !userAgents || userAgents.length === 0) {
      return NextResponse.json({
        leads: [],
        total: 0,
      }, { status: 200 })
    }

    const agentIds = userAgents.map(a => a.id)
    const filteredAgentIds = agentId ? agentIds.filter(id => id === agentId) : agentIds

    if (filteredAgentIds.length === 0) {
      return NextResponse.json({
        leads: [],
        total: 0,
      }, { status: 200 })
    }

    // Build query - get leads for user's agents
    let query = supabase
      .from('leads')
      .select(`
        *,
        agents (
          id,
          name
        )
      `)
      .in('agent_id', filteredAgentIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter
    if (status) {
      query = query.eq('status', status)
    }

    const { data: leads, error: leadsError } = await query

    if (leadsError) {
      logError('Leads GET', leadsError)
      return createErrorResponse(
        leadsError,
        'Failed to fetch leads',
        500
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .in('agent_id', filteredAgentIds)

    if (status) {
      countQuery = countQuery.eq('status', status)
    }

    const { count, error: countError } = await countQuery

    return NextResponse.json({
      leads: leads || [],
      total: count || 0,
    }, { status: 200 })
  } catch (error) {
    logError('Leads GET', error)
    return createErrorResponse(
      error,
      'Internal server error',
      500
    )
  }
}

export async function PATCH(request: NextRequest) {
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

    // Rate limiting
    const { rateLimiters } = await import('@/lib/rate-limit-supabase')
    const rateLimit = await rateLimiters.apiGeneral(user.id)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
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
    const { leadUpdateSchema, validateInput } = await import('@/lib/validation')
    const validation = validateInput(leadUpdateSchema, body)
    
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

    const { leadId, status } = validation.data

    // Verify user owns the lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        *,
        agents!inner (
          user_id
        )
      `)
      .eq('id', leadId)
      .eq('agents.user_id', user.id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Update lead status
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', leadId)
      .select()
      .single()

    if (updateError) {
      logError('Leads PATCH', updateError)
      return createErrorResponse(
        updateError,
        'Failed to update lead',
        500
      )
    }

    return NextResponse.json({ lead: updatedLead }, { status: 200 })
  } catch (error) {
    logError('Leads PATCH', error)
    return createErrorResponse(
      error,
      'Internal server error',
      500
    )
  }
}

