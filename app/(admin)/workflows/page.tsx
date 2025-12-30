'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Workflow, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Agent {
  id: string
  name: string
  n8n_workflow_id: string | null
  n8n_hosting_type: string | null
  profiles: {
    email: string | null
  } | null
}

export default function AdminWorkflowsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchAgents()
  }, [])

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
          profiles:user_id (
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAgents(data || [])
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
        <h1 className="text-3xl font-bold">n8n Workflows</h1>
        <p className="text-muted-foreground mt-1">
          Manage n8n workflows for all agents
        </p>
      </div>

      {/* Agents with Workflows */}
      {agentsWithWorkflows.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Active Workflows ({agentsWithWorkflows.length})</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agentsWithWorkflows.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{agent.name}</CardTitle>
                      <CardDescription>
                        {agent.profiles?.email || 'Unknown user'}
                      </CardDescription>
                    </div>
                    <Badge variant="default">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Workflow className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Workflow ID:</span>
                      <span className="font-mono text-xs">{agent.n8n_workflow_id}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Type: {agent.n8n_hosting_type || 'hosted'}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Agents without Workflows */}
      {agentsWithoutWorkflows.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Agents Without Workflows ({agentsWithoutWorkflows.length})</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agentsWithoutWorkflows.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{agent.name}</CardTitle>
                      <CardDescription>
                        {agent.profiles?.email || 'Unknown user'}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      <XCircle className="mr-1 h-3 w-3" />
                      No Workflow
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This agent doesn't have an n8n workflow. Workflows are automatically created when you approve agent creation requests.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {agents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
            <p className="text-muted-foreground text-center">
              Workflows will appear here once agents are created and approved
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

