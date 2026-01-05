'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'

interface Agent {
  id: string
  name: string
}

export default function CreateRequestPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [requestType, setRequestType] = useState<'create' | 'update' | 'delete'>('update')
  const [agents, setAgents] = useState<Agent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)

  // For update/delete requests - simple form
  const [simpleFormData, setSimpleFormData] = useState({
    agent_id: '',
    name: '',
    description: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
  })

  // Fetch user's agents on component mount
  useEffect(() => {
    fetchAgents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAgents = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('agents')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAgents(data || [])
    } catch (error) {
      console.error('Error fetching agents:', error)
      toast({
        title: 'Error',
        description: 'Failed to load your agents',
        variant: 'destructive',
      })
    } finally {
      setLoadingAgents(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let requestBody: any

      // Clients can only update or delete (not create)
      requestBody = {
        request_type: requestType,
        name: simpleFormData.name || null,
        description: simpleFormData.description || null,
        priority: simpleFormData.priority,
        agent_id: simpleFormData.agent_id || null,
      }

      const response = await fetch('/api/agent-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create request')
      }

      toast({
        title: 'Request submitted',
        description: 'Your request has been submitted and will be reviewed by an admin.',
      })

      router.push('/client/requests')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create request',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/client/requests" className="flex items-center text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Requests
      </Link>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Create Agent Request</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {requestType === 'create'
            ? "Let's guide you through creating the perfect agent for your business"
            : `Submit a request to ${requestType} an agent. Your request will be reviewed by an admin.`}
        </p>
      </div>

      {/* Request Type Selector */}
      <GlassCard>
        <GlassCardContent className="pt-6">
          <div>
            <Label htmlFor="request_type" className="mb-2 block">Request Type</Label>
            <Select
              value={requestType}
              onValueChange={(value: 'update' | 'delete') => {
                setRequestType(value)
              }}
            >
              <SelectTrigger className="bg-background/20 backdrop-blur-sm border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="update">Update Existing Agent</SelectItem>
                <SelectItem value="delete">Delete Agent</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              {requestType === 'update' && 'Provide details about what you want to change in your existing agent.'}
              {requestType === 'delete' && 'Request to permanently delete an agent and all associated data.'}
            </p>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Show form for update/delete */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Request Details</GlassCardTitle>
          <GlassCardDescription>
            Fill in the information for your {requestType} request
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            {requestType !== 'delete' && (
              <>
                <div>
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    value={simpleFormData.name}
                    onChange={(e) => setSimpleFormData({ ...simpleFormData, name: e.target.value })}
                    placeholder="My AI Agent"
                    required={requestType === 'update'}
                    className="bg-background/20 backdrop-blur-sm border-white/10 focus:border-primary/50"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={simpleFormData.description}
                    onChange={(e) => setSimpleFormData({ ...simpleFormData, description: e.target.value })}
                    placeholder="Describe what changes you want to make..."
                    rows={6}
                    required={requestType === 'update'}
                    className="bg-background/20 backdrop-blur-sm border-white/10 focus:border-primary/50"
                  />
                </div>
              </>
            )}

            {(requestType === 'update' || requestType === 'delete') && (
              <div>
                <Label htmlFor="agent_id">Select Agent</Label>
                {loadingAgents ? (
                  <div className="text-sm text-muted-foreground">Loading agents...</div>
                ) : agents.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    You don&apos;t have any agents yet. Agents will appear here once they&apos;re created.
                  </div>
                ) : (
                  <Select
                    value={simpleFormData.agent_id}
                    onValueChange={(value) => setSimpleFormData({ ...simpleFormData, agent_id: value })}
                    required
                  >
                    <SelectTrigger className="bg-background/20 backdrop-blur-sm border-white/10">
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  {agents.length > 0
                    ? 'Select the agent you want to update or delete.'
                    : 'Contact support if you need assistance.'}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={simpleFormData.priority}
                onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') =>
                  setSimpleFormData({ ...simpleFormData, priority: value })
                }
              >
                <SelectTrigger className="bg-background/20 backdrop-blur-sm border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="shadow-lg shadow-primary/20">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="border-white/10 hover:bg-white/5 hover:text-primary">
                Cancel
              </Button>
            </div>
          </form>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}
