'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Phone, MessageSquare, Clock, ArrowLeft, Trash2, User, CheckCircle, Workflow } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface Agent {
  id: string
  name: string
  system_prompt: string | null
  voice_id: string | null
  twilio_phone_number: string | null
  twilio_phone_number_sid: string | null
  provider_type: string
  n8n_workflow_id: string | null
  n8n_hosting_type: string | null
  api_secret: string
  form_data: any
  workflow_config: any
  created_at: string
  updated_at: string
  profiles: {
    email: string | null
  } | null
}

export default function AdminAgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const agentId = params.id as string
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (agentId) {
      fetchAgentDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId])

  const fetchAgentDetails = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('agents')
        .select(`
          id,
          name,
          system_prompt,
          voice_id,
          twilio_phone_number,
          twilio_phone_number_sid,
          provider_type,
          n8n_workflow_id,
          n8n_hosting_type,
          api_secret,
          form_data,
          workflow_config,
          created_at,
          updated_at,
          profiles:user_id (
            email
          )
        `)
        .eq('id', agentId)
        .single()

      if (error) {
        console.error('Error fetching agent:', error)
        throw error
      }

      if (!data) {
        throw new Error('Agent not found')
      }

      // Ensure all fields exist with defaults
      setAgent({
        ...(data as any),
        provider_type: data.provider_type || 'twilio',
        updated_at: data.updated_at || data.created_at,
      })
    } catch (error) {
      console.error('Error fetching agent:', error)
      toast({
        title: 'Error',
        description: 'Failed to load agent details',
        variant: 'destructive',
      })
      router.push('/admin/agents')
    } finally {
      setLoading(false)
    }
  }


  const handleDeleteAgent = async () => {
    if (!confirm(`Are you sure you want to delete agent "${agent?.name}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete agent')
      }

      toast({
        title: 'Success',
        description: 'Agent deleted successfully',
      })

      router.push('/admin/agents')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete agent',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }


  if (loading) {
    return <div className="p-8">Loading agent details...</div>
  }

  if (!agent) {
    return (
      <div className="p-8">
        <GlassCard>
          <GlassCardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Agent not found</h3>
            <Link href="/admin/agents">
              <Button>Back to Agents</Button>
            </Link>
          </GlassCardContent>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/admin/agents">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{agent.name}</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Agent details and workflow configuration
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default">Active</Badge>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteAgent}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Trash2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Agent
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Agent Information */}
      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Agent Information</GlassCardTitle>
            <GlassCardDescription>Basic agent details</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Client:</span>
              </div>
              <p className="text-sm">{agent.profiles?.email || 'Unknown'}</p>
            </div>
            {agent.twilio_phone_number && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Phone Number:</span>
                </div>
                <p className="text-lg font-mono">{agent.twilio_phone_number}</p>
              </div>
            )}
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <span className="text-sm font-medium">Provider:</span>
              <Badge variant="outline">{agent.provider_type || 'twilio'}</Badge>
            </div>
            <div className="pt-2 border-t border-white/5 space-y-1">
              <p className="text-xs text-muted-foreground">
                Created: {new Date(agent.created_at).toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground">
                Updated: {new Date(agent.updated_at).toLocaleDateString()}
              </p>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Voice Settings</GlassCardTitle>
            <GlassCardDescription>AI voice configuration</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Voice ID:</span>
                <Badge variant="outline">{agent.voice_id || 'Default'}</Badge>
              </div>
            </div>
            {agent.system_prompt && (
              <div className="pt-2 border-t border-white/5">
                <p className="text-xs font-medium mb-1">System Prompt Preview:</p>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {agent.system_prompt.substring(0, 150)}...
                </p>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Workflow Information */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            n8n Workflow
          </GlassCardTitle>
          <GlassCardDescription>Workflow configuration and status</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          {agent.n8n_workflow_id ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="default">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Workflow Active
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Workflow ID:</span>
                <span className="font-mono text-xs">{agent.n8n_workflow_id}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Hosting Type:</span>
                <Badge variant="outline">{agent.n8n_hosting_type || 'hosted'}</Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This agent doesn&apos;t have an n8n workflow linked yet. Create the workflow in n8n and update the agent&apos;s <code className="text-xs">n8n_workflow_id</code> in the database.
            </p>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* System Prompt */}
      {agent.system_prompt && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>System Prompt</GlassCardTitle>
            <GlassCardDescription>Full system prompt for this agent</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="p-4 bg-muted/20 backdrop-blur-sm rounded-lg border border-white/5">
              <p className="text-sm whitespace-pre-wrap">{agent.system_prompt}</p>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Form Data & Workflow Config */}
      <div className="grid gap-4 sm:grid-cols-2">
        {agent.form_data && Object.keys(agent.form_data).length > 0 && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Form Data</GlassCardTitle>
              <GlassCardDescription>Agent configuration data</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="p-4 bg-muted/20 backdrop-blur-sm rounded-lg max-h-64 overflow-auto border border-white/5">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                  {JSON.stringify(agent.form_data, null, 2)}
                </pre>
              </div>
            </GlassCardContent>
          </GlassCard>
        )}

        {agent.workflow_config && Object.keys(agent.workflow_config).length > 0 && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Workflow Config</GlassCardTitle>
              <GlassCardDescription>n8n workflow settings</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="p-4 bg-muted/20 backdrop-blur-sm rounded-lg max-h-64 overflow-auto border border-white/5">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                  {JSON.stringify(agent.workflow_config, null, 2)}
                </pre>
              </div>
            </GlassCardContent>
          </GlassCard>
        )}
      </div>
    </div>
  )
}
