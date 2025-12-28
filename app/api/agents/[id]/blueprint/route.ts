import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateN8nBlueprint, blueprintToJson } from '@/lib/n8n/generator'

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

    // Generate n8n blueprint
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    // Remove trailing slash and ensure proper URL format
    const cleanUrl = appUrl.replace(/\/$/, '')
    const webhookUrl = `${cleanUrl}/api/webhooks/ingest`
    
    console.log('[Blueprint API] Generating n8n blueprint...', {
      webhookUrl,
      agentName: agent.name,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
    })
    
    const blueprint = await generateN8nBlueprint({
      webhookUrl,
      agentSecret: agent.api_secret,
      agentName: agent.name,
    })

    console.log('[Blueprint API] Blueprint generated successfully')
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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

