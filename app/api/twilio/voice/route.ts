import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { createClient } from '@/lib/supabase/server'

const VoiceResponse = twilio.twiml.VoiceResponse

/**
 * Twilio Voice Webhook Handler
 * 
 * This endpoint handles incoming calls from Twilio.
 * It creates a call session and routes the call to the appropriate agent.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get('CallSid') as string
    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const agentId = request.nextUrl.searchParams.get('agent_id')

    console.log('[Twilio Voice] Incoming call:', {
      callSid,
      from,
      to,
      agentId,
    })

    const supabase = await createClient()

    // Find agent by phone number or agent_id
    let agent
    if (agentId) {
      const { data, error } = await supabase
        .from('agents')
        .select('id, system_prompt, api_secret, name')
        .eq('id', agentId)
        .eq('provider_type', 'twilio')
        .single()

      if (error || !data) {
        console.error('[Twilio Voice] Agent not found by ID:', agentId)
        const response = new VoiceResponse()
        response.say('Sorry, we could not find the agent. Please try again later.')
        response.hangup()
        return new NextResponse(response.toString(), {
          headers: { 'Content-Type': 'text/xml' },
        })
      }
      agent = data
    } else {
      // Try to find agent by phone number
      const { data, error } = await supabase
        .from('agents')
        .select('id, system_prompt, api_secret, name')
        .eq('twilio_phone_number', to)
        .eq('provider_type', 'twilio')
        .single()

      if (error || !data) {
        console.error('[Twilio Voice] Agent not found by phone number:', to)
        const response = new VoiceResponse()
        response.say('Sorry, we could not find the agent. Please try again later.')
        response.hangup()
        return new NextResponse(response.toString(), {
          headers: { 'Content-Type': 'text/xml' },
        })
      }
      agent = data
    }

    // Create call session
    const { error: sessionError } = await supabase
      .from('twilio_call_sessions')
      .insert({
        agent_id: agent.id,
        call_sid: callSid,
        from_number: from,
        to_number: to,
        status: 'initiated',
        direction: 'inbound',
        started_at: new Date().toISOString(),
      })

    if (sessionError) {
      console.error('[Twilio Voice] Error creating call session:', sessionError)
      // Continue anyway - don't fail the call
    }

    // Update agent call state
    await supabase
      .from('agents')
      .update({
        twilio_call_sid: callSid,
        call_state: 'ringing',
      })
      .eq('id', agent.id)

    // Create TwiML response with Media Streams
    const response = new VoiceResponse()

    // Get WebSocket server URL (from environment or use default)
    const wsServerUrl = process.env.TWILIO_WS_SERVER_URL || 
                       process.env.NEXT_PUBLIC_WS_SERVER_URL ||
                       'wss://your-websocket-server.com'

    // Start Media Stream to WebSocket server
    const start = response.start()
    start.stream({
      url: `${wsServerUrl}/media?agent_id=${agent.id}&call_sid=${callSid}`,
      track: 'both_tracks', // Both inbound and outbound audio
    })

    // Say greeting while connecting
    response.say({
      voice: 'alice',
      language: 'en-US',
    }, `Hello, you've reached ${agent.name || 'our AI assistant'}. Please hold while we connect you to our AI.`)

    // Hangup handler
    response.hangup()

    return new NextResponse(response.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (error) {
    console.error('[Twilio Voice] Webhook error:', error)
    const response = new VoiceResponse()
    response.say({
      voice: 'alice',
      language: 'en-US',
    }, 'Sorry, we encountered an error. Please try again later.')
    response.hangup()
    
    return new NextResponse(response.toString(), {
      headers: { 'Content-Type': 'text/xml' },
      status: 500,
    })
  }
}

