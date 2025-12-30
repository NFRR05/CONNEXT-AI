import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimiters } from '@/lib/rate-limit-supabase'
import { adminRequestUpdateSchema, validateInput } from '@/lib/validation'
import crypto from 'crypto'

// GET: Get a specific request
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

    // Verify user owns the request (or is admin)
    if (request.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({ request }, { status: 200 })
  } catch (error) {
    console.error('Error fetching request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH: Update request (admin approves/rejects, or user cancels)
export async function PATCH(
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

    const { id: requestId } = await params

    // Rate limiting
    const rateLimit = await rateLimiters.apiGeneral(user.id)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Fetch request
    const { data: existingRequest, error: fetchError } = await supabase
      .from('agent_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Check if user is updating status (admin action) or canceling (user action)
    const isStatusUpdate = body.status && ['approved', 'rejected'].includes(body.status)
    const isUserCancel = body.status === 'cancelled' && existingRequest.user_id === user.id && existingRequest.status === 'pending'

    if (isStatusUpdate) {
      // Admin action - validate input
      const validation = validateInput(adminRequestUpdateSchema, body)
      if (!validation.success) {
        return NextResponse.json(
          { 
            error: 'Invalid input data',
            details: validation.errors.errors
          },
          { status: 400 }
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

      const updateData: any = {
        status: validation.data.status,
        admin_id: user.id,
        updated_at: new Date().toISOString(),
      }

      if (validation.data.admin_notes) {
        updateData.admin_notes = validation.data.admin_notes
      }

      // If approved, mark as completed and trigger implementation
      if (validation.data.status === 'approved') {
        updateData.completed_at = new Date().toISOString()
      }

      const { data: updatedRequest, error: updateError } = await supabase
        .from('agent_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating request:', updateError)
        return NextResponse.json(
          { error: 'Failed to update request' },
          { status: 500 }
        )
      }

      // If approved, implement the request
      if (validation.data.status === 'approved') {
        try {
          await implementAgentRequest(updatedRequest, supabase)
        } catch (implError) {
          console.error('Error implementing request:', implError)
          // Update request status to indicate implementation failed
          await supabase
            .from('agent_requests')
            .update({ 
              status: 'pending',
              admin_notes: `Approved but implementation failed: ${implError instanceof Error ? implError.message : 'Unknown error'}. Please review.`
            })
            .eq('id', requestId)
          
          return NextResponse.json(
            { 
              error: 'Request approved but implementation failed',
              details: implError instanceof Error ? implError.message : 'Unknown error'
            },
            { status: 500 }
          )
        }
      }

      return NextResponse.json({ request: updatedRequest }, { status: 200 })
    } else if (isUserCancel) {
      // User canceling their own pending request
      const { data: updatedRequest, error: updateError } = await supabase
        .from('agent_requests')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single()

      if (updateError) {
        console.error('Error canceling request:', updateError)
        return NextResponse.json(
          { error: 'Failed to cancel request' },
          { status: 500 }
        )
      }

      return NextResponse.json({ request: updatedRequest }, { status: 200 })
    } else {
      return NextResponse.json(
        { error: 'Unauthorized or invalid operation' },
        { status: 403 }
      )
    }
  } catch (error) {
    console.error('Error updating request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to implement approved agent request
async function implementAgentRequest(
  request: any,
  supabase: any
) {
  if (request.request_type === 'create') {
    // Check user's subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', request.user_id)
      .single()

    if (profileError || !profile) {
      throw new Error('User profile not found')
    }

    // Create new agent
    // Import agent creation logic from agents route
    const { generateAgentConfig } = await import('@/lib/openai/client')
    const { createAssistant } = await import('@/lib/vapi/client')
    
    if (!request.description) {
      throw new Error('Description is required for agent creation')
    }

    // Generate agent config
    const agentConfig = await generateAgentConfig(request.description)
    
    // Create Vapi assistant
    const vapiApiKey = process.env.VAPI_API_KEY
    if (!vapiApiKey) {
      throw new Error('Vapi API key not configured')
    }

    const systemPromptStr = agentConfig.systemPrompt || request.description
    const agentName = request.name || systemPromptStr.substring(0, 50).trim() || 'Untitled Agent'

    const vapiAssistant = await createAssistant(vapiApiKey, {
      name: agentName,
      firstMessage: systemPromptStr,
      model: 'gpt-3.5-turbo',
      voiceId: agentConfig.voiceId || request.voice_id || undefined,
    })

    // Generate API secret
    const apiSecret = crypto.randomUUID().replace(/-/g, '')

    // Generate n8n blueprint
    const { generateN8nBlueprint } = await import('@/lib/n8n/generator')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const cleanUrl = appUrl.replace(/\/$/, '')
    const webhookUrl = `${cleanUrl}/api/webhooks/ingest`

    const blueprint = await generateN8nBlueprint({
      webhookUrl,
      agentSecret: apiSecret,
      agentName: agentName,
      formData: request.form_data || undefined,
      workflowConfig: request.workflow_config || undefined,
    })

    // ALWAYS create hosted n8n workflow (centralized n8n instance)
    // The admin hosts n8n and manages all workflows
    let n8nWorkflowId: string | null = null
    let n8nHostingType: 'self_hosted' | 'hosted' = 'hosted'

    try {
      const { createHostedWorkflow } = await import('@/lib/n8n/hosted')
      const hostedWorkflow = await createHostedWorkflow(blueprint, apiSecret)
      n8nWorkflowId = hostedWorkflow.id
      n8nHostingType = 'hosted'
      console.log(`[Agent Request] Successfully created n8n workflow ${n8nWorkflowId} for agent ${agentName}`)
    } catch (error) {
      console.error('[Agent Request] Failed to create hosted n8n workflow:', error)
      // This is critical - if n8n workflow creation fails, we should still create the agent
      // but log the error for admin review
      throw new Error(`Failed to create n8n workflow: ${error instanceof Error ? error.message : 'Unknown error'}. Agent creation aborted.`)
    }

    // Create agent in database
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .insert({
        user_id: request.user_id,
        name: agentName,
        vapi_assistant_id: vapiAssistant.id,
        vapi_phone_number_id: null,
        api_secret: apiSecret,
        system_prompt: agentConfig.systemPrompt || systemPromptStr,
        voice_id: agentConfig.voiceId || request.voice_id || null,
        form_data: request.form_data || {},
        workflow_config: request.workflow_config || {},
        n8n_workflow_id: n8nWorkflowId,
        n8n_hosting_type: n8nHostingType,
      })
      .select()
      .single()

    if (agentError) {
      throw new Error(`Failed to create agent: ${agentError.message}`)
    }

    // Initialize webhook activity tracking
    await supabase
      .from('webhook_activity')
      .insert({
        agent_id: agent.id,
        status: 'active',
      })
      .onConflict('agent_id')
      .ignore()

    // Update request with agent_id
    await supabase
      .from('agent_requests')
      .update({ agent_id: agent.id })
      .eq('id', request.id)

    return agent
  } else if (request.request_type === 'update' && request.agent_id) {
    // Update existing agent
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (request.name) updateData.name = request.name
    if (request.system_prompt !== undefined) updateData.system_prompt = request.system_prompt
    if (request.voice_id !== undefined) updateData.voice_id = request.voice_id
    if (request.form_data !== undefined) updateData.form_data = request.form_data
    if (request.workflow_config !== undefined) updateData.workflow_config = request.workflow_config

    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', request.agent_id)
      .single()

    if (agentError || !agent) {
      throw new Error('Agent not found')
    }

    // Update Vapi assistant if system_prompt or voice_id changed
    if ((request.system_prompt !== undefined || request.voice_id !== undefined) && agent.vapi_assistant_id) {
      const vapiApiKey = process.env.VAPI_API_KEY
      if (vapiApiKey) {
        const vapiUpdateBody: any = {}
        if (request.name) vapiUpdateBody.name = request.name
        if (request.system_prompt !== undefined) vapiUpdateBody.firstMessage = request.system_prompt
        if (request.voice_id !== undefined) vapiUpdateBody.voice = request.voice_id

        await fetch(`https://api.vapi.ai/assistant/${agent.vapi_assistant_id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${vapiApiKey}`,
          },
          body: JSON.stringify(vapiUpdateBody),
        })
      }
    }

    const { data: updatedAgent, error: updateError } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', request.agent_id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update agent: ${updateError.message}`)
    }

    return updatedAgent
  } else if (request.request_type === 'delete' && request.agent_id) {
    // Delete agent
    const { error: deleteError } = await supabase
      .from('agents')
      .delete()
      .eq('id', request.agent_id)

    if (deleteError) {
      throw new Error(`Failed to delete agent: ${deleteError.message}`)
    }

    return { deleted: true }
  } else {
    throw new Error('Invalid request type or missing agent_id')
  }
}

