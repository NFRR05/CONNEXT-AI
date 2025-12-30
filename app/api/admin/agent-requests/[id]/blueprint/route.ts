import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateN8nBlueprint, blueprintToJson } from '@/lib/n8n/generator'
import crypto from 'crypto'

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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || 'client'
    
    if (userRole !== 'admin' && userRole !== 'support') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const { id: requestId } = await params

    // Fetch request
    const { data: request, error: requestError } = await supabase
      .from('agent_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (requestError || !request) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Only allow preview for create requests
    if (request.request_type !== 'create') {
      return NextResponse.json(
        { error: 'Workflow preview is only available for create requests' },
        { status: 400 }
      )
    }

    // Generate a temporary API secret for preview (not saved)
    const tempApiSecret = crypto.randomUUID().replace(/-/g, '')
    const agentName = request.name || 'New Agent'

    // Generate n8n blueprint
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const cleanUrl = appUrl.replace(/\/$/, '')
    const webhookUrl = `${cleanUrl}/api/webhooks/ingest`
    
    console.log('[Admin Request Blueprint API] Generating preview blueprint...', {
      webhookUrl,
      agentName,
      requestId: request.id,
    })
    
    const blueprint = await generateN8nBlueprint({
      webhookUrl,
      agentSecret: tempApiSecret,
      agentName: agentName,
      formData: request.form_data || undefined,
      workflowConfig: request.workflow_config || undefined,
    })

    console.log('[Admin Request Blueprint API] Preview blueprint generated successfully')
    
    // Return as JSON (not downloadable, for preview)
    return NextResponse.json({ 
      blueprint,
      requestName: agentName,
      note: 'This is a preview. The actual API secret will be generated when the request is approved.'
    }, { status: 200 })
  } catch (error) {
    console.error('Error generating preview blueprint:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

