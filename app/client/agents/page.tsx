'use client'

import { useEffect, useState } from 'react'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Phone, Eye } from 'lucide-react'
import Link from 'next/link'

interface Agent {
  id: string
  name: string
  twilio_phone_number: string | null
  created_at: string
  status?: 'active' | 'inactive'
}

export default function ClientAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

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
        .select('id, name, twilio_phone_number, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching agents:', error)
        throw error
      }
      setAgents((data || []).map(agent => ({
        id: agent.id,
        name: agent.name,
        twilio_phone_number: agent.twilio_phone_number || null,
        created_at: agent.created_at,
        status: 'active' as const,
      })))
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">My Agents</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          View your active AI agents
        </p>
      </div>

      {agents.length === 0 ? (
        <GlassCard>
          <GlassCardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agent yet</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Your agent will appear here once it&apos;s been created by an admin.
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Contact support if you need assistance.
            </p>
          </GlassCardContent>
        </GlassCard>
      ) : (
        // Show single agent (clients can only have one)
        agents.slice(0, 1).map((agent) => (
          <GlassCard key={agent.id}>
            <GlassCardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="space-y-1 flex-1 min-w-0">
                  <GlassCardTitle className="break-words">{agent.name}</GlassCardTitle>
                  <GlassCardDescription className="text-xs sm:text-sm">
                    Created {new Date(agent.created_at).toLocaleDateString()}
                  </GlassCardDescription>
                </div>
                <Badge variant="default" className="w-fit">Active</Badge>
              </div>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                {agent.twilio_phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-mono text-xs">{agent.twilio_phone_number}</span>
                  </div>
                )}
                {!agent.twilio_phone_number && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">Phone number not configured</span>
                  </div>
                )}
              </div>
              <Link href={`/client/agents/${agent.id}`}>
                <Button variant="outline" className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Button>
              </Link>
            </GlassCardContent>
          </GlassCard>
        ))
      )}
    </div>
  )
}
