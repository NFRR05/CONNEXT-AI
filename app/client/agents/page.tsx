'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Phone, Eye } from 'lucide-react'
import Link from 'next/link'

interface Agent {
  id: string
  name: string
  vapi_assistant_id: string | null
  vapi_phone_number_id: string | null
  created_at: string
  status?: 'active' | 'inactive'
}

export default function ClientAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAgents(data || [])
    } catch (error) {
      console.error('Error fetching agents:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading agents...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">My Agents</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          View your active AI agents
        </p>
      </div>

      {agents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Create a request to get your first agent set up
            </p>
            <Link href="/client/requests/create">
              <Button>Create Request</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="break-words">{agent.name}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Created {new Date(agent.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant="default" className="w-fit">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  {agent.vapi_assistant_id && (
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Assistant ID:</span>
                      <span className="font-mono text-xs">{agent.vapi_assistant_id.substring(0, 8)}...</span>
                    </div>
                  )}
                  {agent.vapi_phone_number_id && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Phone configured</span>
                    </div>
                  )}
                </div>
                <Link href={`/client/agents/${agent.id}`}>
                  <Button variant="outline" className="w-full">
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

