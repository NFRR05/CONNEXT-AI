import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Get the agent secret from headers
    const agentSecret = request.headers.get('x-agent-secret')
    
    if (!agentSecret) {
      return NextResponse.json(
        { error: 'Missing x-agent-secret header' },
        { status: 401 }
      )
    }

    // Validate agent secret and get agent_id
    const supabase = await createClient()
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('api_secret', agentSecret)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Invalid agent secret' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      phone,
      summary,
      recording,
      transcript,
      sentiment,
      structured_data,
      duration,
    } = body

    // Insert lead into database
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        agent_id: agent.id,
        customer_phone: phone || null,
        call_summary: summary || null,
        recording_url: recording || null,
        call_transcript: transcript || null,
        sentiment: sentiment || null,
        structured_data: structured_data || {},
        duration: duration || null,
      })
      .select()
      .single()

    if (leadError) {
      console.error('Error inserting lead:', leadError)
      return NextResponse.json(
        { error: 'Failed to save lead' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, lead_id: lead.id },
      { status: 200 }
    )
  } catch (error) {
    console.error('Webhook ingest error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

