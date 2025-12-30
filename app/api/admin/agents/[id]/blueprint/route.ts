import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateN8nBlueprint, blueprintToJson } from '@/lib/n8n/generator'

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

    const { id: agentId } = await params

    // Fetch agent (admins can access any agent)
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Generate n8n blueprint
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const cleanUrl = appUrl.replace(/\/$/, '')
    const webhookUrl = `${cleanUrl}/api/webhooks/ingest`
    
    console.log('[Admin Blueprint API] Generating n8n blueprint...', {
      webhookUrl,
      agentName: agent.name,
      agentId: agent.id,
    })
    
    const blueprint = await generateN8nBlueprint({
      webhookUrl,
      agentSecret: agent.api_secret,
      agentName: agent.name,
      formData: agent.form_data || undefined,
      workflowConfig: agent.workflow_config || undefined,
    })

    console.log('[Admin Blueprint API] Blueprint generated successfully')
    const blueprintJson = blueprintToJson(blueprint)

    // Return as downloadable JSON
    return new NextResponse(blueprintJson, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="connext-ai-${agent.name.replace(/\s+/g, '-').toLowerCase()}.json"`,
      },
    })
  } catch (error) {
    console.error('Error generating blueprint:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

