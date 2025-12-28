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
      console.error('Error fetching leads:', leadsError)
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
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
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
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

    const body = await request.json()
    const { leadId, status } = body

    if (!leadId || !status) {
      return NextResponse.json(
        { error: 'leadId and status are required' },
        { status: 400 }
      )
    }

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
      console.error('Error updating lead:', updateError)
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      )
    }

    return NextResponse.json({ lead: updatedLead }, { status: 200 })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

