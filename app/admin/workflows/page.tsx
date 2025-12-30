'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Workflow, CheckCircle, XCircle, RefreshCw, Download, FileJson } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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
  const [downloading, setDownloading] = useState<string | null>(null)
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
          api_secret,
          form_data,
          workflow_config,
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

  const downloadBlueprint = async (agentId: string, agentName: string) => {
    setDownloading(agentId)
    try {
      const response = await fetch(`/api/admin/agents/${agentId}/blueprint`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate blueprint')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `connext-ai-${agentName.replace(/\s+/g, '-').toLowerCase()}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Blueprint downloaded',
        description: 'Workflow JSON has been downloaded successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to download blueprint',
        variant: 'destructive',
      })
    } finally {
      setDownloading(null)
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
        <h1 className="text-2xl sm:text-3xl font-bold">n8n Workflows</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Manage n8n workflows for all agents
        </p>
      </div>

      {/* Agents with Workflows */}
      {agentsWithWorkflows.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Active Workflows ({agentsWithWorkflows.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agentsWithWorkflows.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="break-words">{agent.name}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm break-words">
                        {agent.profiles?.email || 'Unknown user'}
                      </CardDescription>
                    </div>
                    <Badge variant="default" className="w-fit">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => downloadBlueprint(agent.id, agent.name)}
                      disabled={downloading === agent.id}
                    >
                      {downloading === agent.id ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download JSON
                        </>
                      )}
                    </Button>
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
                  </div>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agentsWithoutWorkflows.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="break-words">{agent.name}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm break-words">
                        {agent.profiles?.email || 'Unknown user'}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="w-fit">
                      <XCircle className="mr-1 h-3 w-3" />
                      No Workflow
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground break-words">
                    This agent doesn't have an n8n workflow. Workflows are automatically created when you approve agent creation requests.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => downloadBlueprint(agent.id, agent.name)}
                    disabled={downloading === agent.id}
                  >
                    {downloading === agent.id ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileJson className="mr-2 h-4 w-4" />
                        Generate & Download JSON
                      </>
                    )}
                  </Button>
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

