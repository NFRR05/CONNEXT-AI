import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Twilio Status Callback Webhook Handler
 * 
 * This endpoint receives status updates from Twilio about call events.
 * It updates the call session in the database.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get('CallSid') as string
    const callStatus = formData.get('CallStatus') as string
    const callDuration = formData.get('CallDuration') as string
    const recordingUrl = formData.get('RecordingUrl') as string
    const recordingSid = formData.get('RecordingSid') as string

    console.log('[Twilio Status] Call status update:', {
      callSid,
      callStatus,
      callDuration,
      recordingUrl,
    })

    if (!callSid) {
      return NextResponse.json(
        { error: 'Missing CallSid' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Map Twilio status to our status enum
    const statusMap: Record<string, string> = {
      'queued': 'initiated',
      'ringing': 'ringing',
      'in-progress': 'in-progress',
      'completed': 'completed',
      'busy': 'busy',
      'failed': 'failed',
      'no-answer': 'no-answer',
      'canceled': 'failed',
    }

    const mappedStatus = statusMap[callStatus.toLowerCase()] || 'initiated'

    // Update call session
    const updateData: any = {
      status: mappedStatus,
      updated_at: new Date().toISOString(),
    }

    if (callDuration) {
      updateData.duration = parseInt(callDuration, 10)
    }

    if (callStatus === 'completed') {
      updateData.ended_at = new Date().toISOString()
    }

    if (recordingUrl) {
      updateData.recording_url = recordingUrl
    }

    if (recordingSid) {
      updateData.recording_sid = recordingSid
    }

    // Update call session
    const { error: updateError } = await supabase
      .from('twilio_call_sessions')
      .update(updateData)
      .eq('call_sid', callSid)

    if (updateError) {
      console.error('[Twilio Status] Error updating call session:', updateError)
      // Don't fail the webhook - Twilio expects 200
    }

    // Update agent call state
    if (callStatus === 'completed' || callStatus === 'failed') {
      await supabase
        .from('agents')
        .update({
          call_state: callStatus === 'completed' ? 'completed' : 'failed',
          twilio_call_sid: null,
        })
        .eq('twilio_call_sid', callSid)
    } else if (callStatus === 'in-progress') {
      await supabase
        .from('agents')
        .update({
          call_state: 'in-progress',
        })
        .eq('twilio_call_sid', callSid)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Twilio Status] Webhook error:', error)
    // Always return 200 to Twilio to avoid retries
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 200 }
    )
  }
}

