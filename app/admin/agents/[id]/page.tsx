'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Trash2 } from 'lucide-react'
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading agent details...</p>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="max-w-2xl mx-auto">
        <GlassCard>
          <GlassCardContent className="flex flex-col items-center justify-center py-16">
            <Icon src="/icons/Chat_Circle_Dots.svg" alt="Not found" size={64} className="opacity-50 mb-4" />
            <h3 className="text-2xl font-semibold mb-2">Agent not found</h3>
            <p className="text-muted-foreground mb-6 text-center">The agent you're looking for doesn't exist.</p>
            <Link href="/admin/agents">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Agents
              </Button>
            </Link>
          </GlassCardContent>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/agents">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{agent.name}</h1>
            <p className="text-muted-foreground mt-1">Agent details and workflow configuration</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="default" className="px-3 py-1.5 text-sm">Active</Badge>
          <Button
            variant="destructive"
            onClick={handleDeleteAgent}
            disabled={deleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? 'Deleting...' : 'Delete Agent'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Client Info */}
        <GlassCard>
          <GlassCardHeader className="pb-3">
            <div className="flex items-center gap-3 mb-2">
              <Icon src="/icons/Users_Group.svg" alt="User" size={24} />
              <GlassCardTitle className="text-lg">Client</GlassCardTitle>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <p className="text-sm font-medium text-foreground">{agent.profiles?.email || 'Unknown user'}</p>
          </GlassCardContent>
        </GlassCard>

        {/* Phone Number */}
        <GlassCard>
          <GlassCardHeader className="pb-3">
            <div className="flex items-center gap-3 mb-2">
              <Icon src="/icons/Chat_Circle_Dots.svg" alt="Phone" size={24} />
              <GlassCardTitle className="text-lg">Phone Number</GlassCardTitle>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            {agent.twilio_phone_number ? (
              <p className="text-lg font-mono font-semibold">{agent.twilio_phone_number}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Not configured</p>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Provider */}
        <GlassCard>
          <GlassCardHeader className="pb-3">
            <div className="flex items-center gap-3 mb-2">
              <Icon src="/icons/Chat_Circle_Dots.svg" alt="Provider" size={24} />
              <GlassCardTitle className="text-lg">Provider</GlassCardTitle>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <Badge variant="outline" className="text-sm">{agent.provider_type || 'twilio'}</Badge>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workflow Information */}
          <GlassCard>
            <GlassCardHeader>
              <div className="flex items-center gap-3">
                <Icon src="/icons/Chat_Circle_Dots.svg" alt="Workflow" size={24} />
                <div>
                  <GlassCardTitle>n8n Workflow</GlassCardTitle>
                  <GlassCardDescription>Workflow configuration and status</GlassCardDescription>
                </div>
              </div>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              {agent.n8n_workflow_id ? (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="px-3 py-1">
                      <Icon src="/icons/Chart_Line.svg" alt="Active" size={16} variant="dark" className="mr-1.5" />
                      Workflow Active
                    </Badge>
                  </div>
                  <div className="space-y-3 pt-2 border-t border-border/50">
                    <div className="flex items-start gap-3">
                      <Icon src="/icons/File_Document.svg" alt="ID" size={20} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Workflow ID</p>
                        <p className="text-sm font-mono break-all">{agent.n8n_workflow_id}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Icon src="/icons/Chat_Circle_Dots.svg" alt="Hosting" size={20} className="mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Hosting Type</p>
                        <Badge variant="outline">{agent.n8n_hosting_type || 'hosted'}</Badge>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-3 py-2">
                  <Icon src="/icons/Chat_Circle_Dots.svg" alt="Warning" size={20} className="mt-0.5 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    This agent doesn't have an n8n workflow linked yet. Create the workflow in n8n and update the agent's workflow ID.
                  </p>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* System Prompt */}
          {agent.system_prompt && (
            <GlassCard>
              <GlassCardHeader>
                <div className="flex items-center gap-3">
                  <Icon src="/icons/File_Document.svg" alt="Prompt" size={24} />
                  <div>
                    <GlassCardTitle>System Prompt</GlassCardTitle>
                    <GlassCardDescription>Full system prompt for this agent</GlassCardDescription>
                  </div>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-border/50">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{agent.system_prompt}</p>
                </div>
              </GlassCardContent>
            </GlassCard>
          )}

          {/* Form Data & Workflow Config */}
          <div className="grid gap-6 md:grid-cols-2">
            {agent.form_data && Object.keys(agent.form_data).length > 0 && (
              <GlassCard>
                <GlassCardHeader>
                  <div className="flex items-center gap-3">
                    <Icon src="/icons/File_Document.svg" alt="Form" size={20} />
                    <GlassCardTitle className="text-base">Form Data</GlassCardTitle>
                  </div>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-border/50 max-h-64 overflow-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words">{JSON.stringify(agent.form_data, null, 2)}</pre>
                  </div>
                </GlassCardContent>
              </GlassCard>
            )}

            {agent.workflow_config && Object.keys(agent.workflow_config).length > 0 && (
              <GlassCard>
                <GlassCardHeader>
                  <div className="flex items-center gap-3">
                    <Icon src="/icons/Chat_Circle_Dots.svg" alt="Config" size={20} />
                    <GlassCardTitle className="text-base">Workflow Config</GlassCardTitle>
                  </div>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-border/50 max-h-64 overflow-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words">{JSON.stringify(agent.workflow_config, null, 2)}</pre>
                  </div>
                </GlassCardContent>
              </GlassCard>
            )}
          </div>
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-6">
          {/* Voice Settings */}
          <GlassCard>
            <GlassCardHeader>
              <div className="flex items-center gap-3">
                <Icon src="/icons/Chat_Circle_Dots.svg" alt="Voice" size={20} />
                <GlassCardTitle className="text-base">Voice Settings</GlassCardTitle>
              </div>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Voice ID</p>
                <Badge variant="outline">{agent.voice_id || 'Default'}</Badge>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Metadata */}
          <GlassCard>
            <GlassCardHeader>
              <div className="flex items-center gap-3">
                <Icon src="/icons/Chart_Line.svg" alt="Dates" size={20} />
                <GlassCardTitle className="text-base">Metadata</GlassCardTitle>
              </div>
            </GlassCardHeader>
            <GlassCardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Icon src="/icons/Chart_Line.svg" alt="Created" size={18} className="mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Created</p>
                  <p className="text-sm">{new Date(agent.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pt-2 border-t border-border/50">
                <Icon src="/icons/Chart_Line.svg" alt="Updated" size={18} className="mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Last Updated</p>
                  <p className="text-sm">{new Date(agent.updated_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
