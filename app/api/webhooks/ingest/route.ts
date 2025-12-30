import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimiters } from '@/lib/rate-limit-supabase'
import { webhookInputSchema, validateInput } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    // 1. Get and validate agent secret
    const agentSecret = request.headers.get('x-agent-secret')
    
    if (!agentSecret || agentSecret.trim() === '') {
      return NextResponse.json(
        { error: 'Missing x-agent-secret header' },
        { status: 401 }
      )
    }

    // 2. Rate limiting (per agent secret)
    const rateLimit = await rateLimiters.webhookIngest(agentSecret.trim())
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
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

    // 3. Validate agent secret in database
    const supabase = await createClient()
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('api_secret', agentSecret.trim())
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Invalid agent secret' },
        { status: 401 }
      )
    }

    // 4. Parse request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // 5. Validate input data
    const validation = validateInput(webhookInputSchema, body)
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

    const validatedData = validation.data

    // 6. Insert lead with validated data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        agent_id: agent.id,
        customer_phone: validatedData.phone,
        call_summary: validatedData.summary,
        recording_url: validatedData.recording,
        call_transcript: validatedData.transcript,
        sentiment: validatedData.sentiment,
        structured_data: validatedData.structured_data || {},
        duration: validatedData.duration,
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
      { 
        status: 200,
        headers: {
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        }
      }
    )
  } catch (error) {
    console.error('Webhook ingest error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

