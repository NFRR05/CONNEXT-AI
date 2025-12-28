import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPhoneNumber, getPhoneNumber } from '@/lib/vapi/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: agentId } = await params

    // Fetch agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    if (!agent.vapi_phone_number_id) {
      return NextResponse.json(
        { error: 'No phone number assigned' },
        { status: 404 }
      )
    }

    // Get phone number from Vapi
    const vapiApiKey = process.env.VAPI_API_KEY
    
    if (!vapiApiKey) {
      return NextResponse.json(
        { error: 'Vapi API key not configured' },
        { status: 500 }
      )
    }

    try {
      const phoneNumberData = await getPhoneNumber(vapiApiKey, agent.vapi_phone_number_id)
      return NextResponse.json({
        phoneNumber: phoneNumberData.number,
        phoneNumberId: phoneNumberData.id,
      }, { status: 200 })
    } catch (error) {
      console.error('Vapi get phone number error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch phone number from Vapi' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error fetching phone number:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: agentId } = await params

    // Fetch agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Check if phone number already exists
    if (agent.vapi_phone_number_id) {
      // If phone number exists, return it
      const vapiApiKey = process.env.VAPI_API_KEY
      if (vapiApiKey) {
        try {
          const phoneNumberData = await getPhoneNumber(vapiApiKey, agent.vapi_phone_number_id)
          return NextResponse.json({
            phoneNumber: phoneNumberData.number,
            phoneNumberId: phoneNumberData.id,
          }, { status: 200 })
        } catch (error) {
          // If fetching fails, continue to provision new one
        }
      }
    }

    // Provision phone number from Vapi
    const vapiApiKey = process.env.VAPI_API_KEY
    
    if (!vapiApiKey) {
      return NextResponse.json(
        { error: 'Vapi API key not configured' },
        { status: 500 }
      )
    }

    let phoneNumberData
    try {
      phoneNumberData = await createPhoneNumber(vapiApiKey)
    } catch (error) {
      console.error('Vapi phone number error:', error)
      return NextResponse.json(
        { error: 'Failed to provision phone number. Please check your Vapi API key and account balance.' },
        { status: 500 }
      )
    }

    // Update agent with phone number
    const { data: updatedAgent, error: updateError } = await supabase
      .from('agents')
      .update({
        vapi_phone_number_id: phoneNumberData.id,
      })
      .eq('id', agentId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating agent:', updateError)
      return NextResponse.json(
        { error: 'Failed to save phone number' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      phoneNumber: phoneNumberData.number,
      phoneNumberId: phoneNumberData.id,
    }, { status: 200 })
  } catch (error) {
    console.error('Error provisioning phone number:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
