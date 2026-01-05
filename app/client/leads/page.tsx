'use client'

import { useEffect, useState } from 'react'
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Phone, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'

interface Lead {
  id: string
  customer_phone: string | null
  call_summary: string | null
  status: string
  created_at: string
  duration: number | null
  sentiment: string | null
  agent_id: string
}

export default function ClientLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchLeads = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Get user's agents
      const { data: agents } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)

      if (!agents || agents.length === 0) {
        setLeads([])
        return
      }

      const agentIds = agents.map(a => a.id)

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .in('agent_id', agentIds)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      New: 'default',
      Contacted: 'secondary',
      Closed: 'outline',
    }
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (loading) {
    return <div className="p-8">Loading leads...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leads</h1>
        <p className="text-muted-foreground mt-1">
          View all leads from your agents
        </p>
      </div>

      {leads.length === 0 ? (
        <GlassCard>
          <GlassCardContent className="flex flex-col items-center justify-center py-12">
            <Phone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No leads yet</h3>
            <p className="text-muted-foreground text-center">
              Leads will appear here once your agents start receiving calls
            </p>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <GlassCard key={lead.id}>
              <GlassCardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(lead.status)}
                      {lead.sentiment && (
                        <Badge variant="outline">{lead.sentiment}</Badge>
                      )}
                    </div>
                    {lead.customer_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{lead.customer_phone}</span>
                      </div>
                    )}
                    {lead.call_summary && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {lead.call_summary}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                      {lead.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(lead.duration)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}

