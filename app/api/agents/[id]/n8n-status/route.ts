import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET: Check n8n status and webhook activity for an agent
 * Used to monitor if self-hosted n8n is online
 */
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

    const { id: agentId } = await params

    // Verify agent belongs to user
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, n8n_hosting_type, n8n_workflow_id')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Get webhook activity
    const { data: activity, error: activityError } = await supabase
      .from('webhook_activity')
      .select('*')
      .eq('agent_id', agentId)
      .single()

    if (activityError && activityError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching webhook activity:', activityError)
    }

    // Calculate status
    let status: 'online' | 'offline' | 'warning' = 'online'
    let message = 'n8n is online and receiving webhooks'
    let hoursSinceLastWebhook: number | null = null

    if (agent.n8n_hosting_type === 'self_hosted') {
      if (!activity || !activity.last_webhook_at) {
        status = 'offline'
        message = 'No webhooks received yet. Make sure your n8n instance is running and the workflow is active.'
      } else {
        const lastWebhook = new Date(activity.last_webhook_at)
        const now = new Date()
        hoursSinceLastWebhook = (now.getTime() - lastWebhook.getTime()) / (1000 * 60 * 60)

        if (hoursSinceLastWebhook > 24) {
          status = 'offline'
          message = `No webhooks received in ${Math.round(hoursSinceLastWebhook)} hours. Your n8n instance may be offline.`
        } else if (hoursSinceLastWebhook > 6) {
          status = 'warning'
          message = `No webhooks received in ${Math.round(hoursSinceLastWebhook)} hours. Check your n8n instance.`
        }
      }
    } else {
      // Hosted n8n - always online (managed by you)
      status = 'online'
      message = 'Hosted n8n workflow is active'
    }

    return NextResponse.json({
      status,
      message,
      hosting_type: agent.n8n_hosting_type,
      activity: activity ? {
        last_webhook_at: activity.last_webhook_at,
        webhook_count_24h: activity.webhook_count_24h,
        hours_since_last_webhook: hoursSinceLastWebhook,
      } : null,
    }, { status: 200 })
  } catch (error) {
    console.error('Error checking n8n status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

