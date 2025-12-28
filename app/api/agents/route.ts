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
    const { name, vapi_assistant_id, vapi_phone_number_id, system_prompt, voice_id } = body

    // Generate API secret
    const apiSecret = crypto.randomUUID().replace(/-/g, '')

    // Create agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .insert({
        user_id: user.id,
        name: name || 'Untitled Agent',
        vapi_assistant_id: vapi_assistant_id || null,
        vapi_phone_number_id: vapi_phone_number_id || null,
        api_secret: apiSecret,
        system_prompt: system_prompt || null,
        voice_id: voice_id || null,
      })
      .select()
      .single()

    if (agentError) {
      console.error('Error creating agent:', agentError)
      return NextResponse.json(
        { error: 'Failed to create agent' },
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

