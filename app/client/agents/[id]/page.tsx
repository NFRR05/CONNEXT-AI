'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader } from '@/components/ui/loader'
import { LeadsTable, type Lead } from '@/components/ui/leads-data-table'
import { createClient } from '@/lib/supabase/client'
import { Phone, MessageSquare, Clock, ArrowLeft, Settings, FileText, Trash2, Workflow } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface Agent {
  id: string
  name: string
  system_prompt: string | null
  voice_id: string | null
  twilio_phone_number: string | null
  provider_type: string | null
  created_at: string
  updated_at: string
}

interface LeadStats {
  total: number
  recent: number
}

export default function ClientAgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const agentId = params.id as string
  const [agent, setAgent] = useState<Agent | null>(null)
  const [leadStats, setLeadStats] = useState<LeadStats>({ total: 0, recent: 0 })
  const [leads, setLeads] = useState<Lead[]>([])
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [hasRejectedRequest, setHasRejectedRequest] = useState(false)

  useEffect(() => {
    if (agentId) {
      fetchAgentDetails()
      fetchLeadStats()
      checkRejectedRequests()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId])

  const checkRejectedRequests = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data: requests } = await supabase
        .from('agent_requests')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('agent_id', agentId)
        .eq('status', 'rejected')
        .limit(1)

      setHasRejectedRequest((requests?.length || 0) > 0)
    } catch (error) {
      console.error('Error checking rejected requests:', error)
    }
  }

  const handleDeleteAgent = async () => {
    if (!agent) return

    // Confirm deletion
    const confirmed = confirm(
      `Are you sure you want to delete "${agent.name}"? This action cannot be undone and will delete all associated leads and data.`
    )

    if (!confirmed) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/agents/${agent.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete agent')
      }

      toast({
        title: 'Agent deleted',
        description: 'Your agent has been deleted successfully.',
      })

      // Redirect to agents page
      router.push('/client/agents')
    } catch (error: any) {
      console.error('Error deleting agent:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete agent',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const fetchAgentDetails = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('agents')
        .select('id, name, system_prompt, voice_id, twilio_phone_number, provider_type, created_at, updated_at')
        .eq('id', agentId)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching agent:', error)
        throw error
      }
      if (!data) {
        router.push('/client/agents')
        return
      }

      // Ensure all fields exist with defaults
      setAgent({
        id: data.id,
        name: data.name,
        system_prompt: data.system_prompt || null,
        voice_id: data.voice_id || null,
        twilio_phone_number: data.twilio_phone_number || null,
        provider_type: data.provider_type || 'twilio',
        created_at: data.created_at,
        updated_at: data.updated_at || data.created_at,
      })
    } catch (error) {
      console.error('Error fetching agent:', error)
      router.push('/client/agents')
    } finally {
      setLoading(false)
    }
  }

  const fetchLeadStats = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Total leads
      const { count: totalCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)

      // Recent leads (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { count: recentCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .gte('created_at', sevenDaysAgo.toISOString())

      setLeadStats({
        total: totalCount || 0,
        recent: recentCount || 0,
      })
    } catch (error) {
      console.error('Error fetching lead stats:', error)
    }
  }

  const fetchLeads = async () => {
    setLoadingLeads(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const formattedLeads: Lead[] = (data || []).map(lead => ({
        id: lead.id,
        customer_phone: lead.customer_phone,
        call_summary: lead.call_summary,
        status: lead.status as 'New' | 'Contacted' | 'Closed',
        created_at: lead.created_at,
        duration: lead.duration,
        sentiment: lead.sentiment,
        agent_id: lead.agent_id,
        agent_name: agent?.name,
      }))

      setLeads(formattedLeads)
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast({
        title: 'Error',
        description: 'Failed to load leads',
        variant: 'destructive',
      })
    } finally {
      setLoadingLeads(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="p-8">
        <GlassCard>
          <GlassCardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Agent not found</h3>
            <p className="text-muted-foreground mb-4 text-center">
              This agent doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Link href="/client/agents">
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
            <Link href="/client/agents">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{agent.name}</h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                Agent details and configuration
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="default">Active</Badge>
          <Link href={`/client/requests/create?type=update&agent_id=${agent.id}`}>
            <Button variant="outline" size="sm" className="shadow-lg shadow-primary/20">
              <Settings className="mr-2 h-4 w-4" />
              Request Changes
            </Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteAgent}
            disabled={deleting}
            className="shadow-lg shadow-destructive/20"
          >
            {deleting ? (
              <>
                <Loader size="sm" className="mr-2" />
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

      <Tabs defaultValue="overview" className="w-full" onValueChange={(value) => {
        if (value === 'leads' && leads.length === 0 && !loadingLeads) {
          fetchLeads()
        }
      }}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Leads ({leadStats.total})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <GlassCard>
              <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <GlassCardTitle className="text-sm font-medium">Total Leads</GlassCardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </GlassCardHeader>
              <GlassCardContent>
                <div className="text-2xl font-bold">{leadStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  All time leads collected
                </p>
              </GlassCardContent>
            </GlassCard>

            <GlassCard>
              <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <GlassCardTitle className="text-sm font-medium">Recent Leads</GlassCardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </GlassCardHeader>
              <GlassCardContent>
                <div className="text-2xl font-bold">{leadStats.recent}</div>
                <p className="text-xs text-muted-foreground">
                  Last 7 days
                </p>
              </GlassCardContent>
            </GlassCard>
          </div>

          {/* Agent Information */}
          <div className="grid gap-4 sm:grid-cols-2">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Contact Information</GlassCardTitle>
                <GlassCardDescription>Phone number and provider</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-3">
                {agent.twilio_phone_number ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Phone Number:</span>
                    </div>
                    <p className="text-lg font-mono">{agent.twilio_phone_number}</p>
                    <p className="text-xs text-muted-foreground">
                      Customers can call this number to reach your AI agent
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Phone number not configured</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Contact support to configure a phone number for your agent
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <span className="text-sm font-medium">Provider:</span>
                  <Badge variant="outline">{agent.provider_type || 'twilio'}</Badge>
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
                  <p className="text-xs text-muted-foreground">
                    The voice your AI agent uses when speaking to customers
                  </p>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(agent.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Updated: {new Date(agent.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>

          {/* System Prompt */}
          {agent.system_prompt && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  System Prompt
                </GlassCardTitle>
                <GlassCardDescription>Instructions for your AI agent</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="p-4 bg-muted/20 rounded-lg backdrop-blur-sm border border-border/50">
                  <p className="text-sm whitespace-pre-wrap">{agent.system_prompt}</p>
                </div>
              </GlassCardContent>
            </GlassCard>
          )}

          {/* Rejected Request Notice */}
          {hasRejectedRequest && (
            <GlassCard className="border-destructive/50 bg-destructive/5">
              <GlassCardHeader>
                <GlassCardTitle className="text-destructive">Request Denied</GlassCardTitle>
                <GlassCardDescription>
                  Your previous request for this agent was denied. You can delete the agent directly below.
                </GlassCardDescription>
              </GlassCardHeader>
            </GlassCard>
          )}

          {/* Quick Actions */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Quick Actions</GlassCardTitle>
              <GlassCardDescription>Common tasks for this agent</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent className="space-y-2">
              <Link href={`/client/leads?agent_id=${agent.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  View All Leads
                </Button>
              </Link>
              <Link href={`/client/requests/create?type=update&agent_id=${agent.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Request Changes to Agent
                </Button>
              </Link>
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={handleDeleteAgent}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader size="sm" className="mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Agent
                  </>
                )}
              </Button>
            </GlassCardContent>
          </GlassCard>
        </TabsContent>

        <TabsContent value="leads" className="mt-6">
          {loadingLeads ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader size="lg" />
            </div>
          ) : (
            <LeadsTable
              title={`Leads for ${agent.name}`}
              leads={leads}
              onLeadAction={(leadId, action) => {
                if (action === "view") {
                  router.push(`/client/leads/${leadId}`)
                }
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Agent Settings
              </GlassCardTitle>
              <GlassCardDescription>Configure your agent settings</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Agent ID</p>
                <p className="text-xs font-mono text-muted-foreground">{agent.id}</p>
              </div>
              <div className="pt-2 border-t border-border/50 space-y-2">
                <p className="text-sm font-medium">Created</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(agent.created_at).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(agent.updated_at).toLocaleString()}
                </p>
              </div>
              <div className="pt-4 border-t border-border/50">
                <Link href={`/client/requests/create?type=update&agent_id=${agent.id}`}>
                  <Button variant="outline" className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Request Changes
                  </Button>
                </Link>
              </div>
            </GlassCardContent>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
