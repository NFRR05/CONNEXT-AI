'use client'

import { useEffect, useState } from 'react'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Workflow, CheckCircle, XCircle, RefreshCw, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface Agent {
  id: string
  name: string
  n8n_workflow_id: string | null
  n8n_hosting_type: string | null
  api_secret: string | null
  form_data: any
  workflow_config: any
  profiles: {
    email: string | null
  } | null
}

export default function AdminWorkflowsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchAgents = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('agents')
        .select(`
          id,
          name,
          n8n_workflow_id,
          n8n_hosting_type,
          api_secret,
          form_data,
          workflow_config,
          profiles:user_id (
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAgents((data || []) as any)
    } catch (error) {
      console.error('Error fetching agents:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch agents',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const syncWorkflow = async (agentId: string, workflowId: string) => {
    setSyncing(agentId)
    try {
      // This would call an API endpoint to sync/refresh the workflow
      // For now, just show a message
      toast({
        title: 'Workflow sync',
        description: 'Workflow sync functionality coming soon',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sync workflow',
        variant: 'destructive',
      })
    } finally {
      setSyncing(null)
    }
  }


  const agentsWithWorkflows = agents.filter(a => a.n8n_workflow_id)
  const agentsWithoutWorkflows = agents.filter(a => !a.n8n_workflow_id)

  if (loading) {
    return <div className="p-8">Loading workflows...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Agents & Workflows</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Manage all agents and their n8n workflows
        </p>
      </div>

      {/* Agents with Workflows */}
      {agentsWithWorkflows.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Active Workflows ({agentsWithWorkflows.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agentsWithWorkflows.map((agent) => (
              <GlassCard key={agent.id}>
                <GlassCardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <GlassCardTitle className="break-words">{agent.name}</GlassCardTitle>
                      <GlassCardDescription className="text-xs sm:text-sm break-words">
                        {agent.profiles?.email || 'Unknown user'}
                      </GlassCardDescription>
                    </div>
                    <Badge variant="default" className="w-fit">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  </div>
                </GlassCardHeader>
                <GlassCardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Workflow className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground text-xs sm:text-sm">Workflow ID:</span>
                      <span className="font-mono text-xs break-all">{agent.n8n_workflow_id}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Type: {agent.n8n_hosting_type || 'hosted'}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link href={`/admin/agents/${agent.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-white/10 hover:bg-white/5 hover:text-primary"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-white/10 hover:bg-white/5 hover:text-primary"
                      onClick={() => agent.n8n_workflow_id && syncWorkflow(agent.id, agent.n8n_workflow_id)}
                      disabled={syncing === agent.id}
                    >
                      {syncing === agent.id ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync Workflow
                        </>
                      )}
                    </Button>
                  </div>
                </GlassCardContent>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Agents without Workflows */}
      {agentsWithoutWorkflows.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Agents Without Workflows ({agentsWithoutWorkflows.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agentsWithoutWorkflows.map((agent) => (
              <GlassCard key={agent.id}>
                <GlassCardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <GlassCardTitle className="break-words">{agent.name}</GlassCardTitle>
                      <GlassCardDescription className="text-xs sm:text-sm break-words">
                        {agent.profiles?.email || 'Unknown user'}
                      </GlassCardDescription>
                    </div>
                    <Badge variant="outline" className="w-fit">
                      <XCircle className="mr-1 h-3 w-3" />
                      No Workflow
                    </Badge>
                  </div>
                </GlassCardHeader>
                <GlassCardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground break-words">
                    This agent doesn&apos;t have an n8n workflow. Workflows are automatically created when you approve agent creation requests.
                  </p>
                </GlassCardContent>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {agents.length === 0 && (
        <GlassCard>
          <GlassCardContent className="flex flex-col items-center justify-center py-12">
            <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
            <p className="text-muted-foreground text-center">
              Workflows will appear here once agents are created and approved
            </p>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  )
}
