'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LeadsTable, type Lead } from '@/components/ui/leads-data-table'
import { createClient } from '@/lib/supabase/client'

export default function ClientLeadsPage() {
  const router = useRouter()
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
        .select(`
          *,
          agents:agent_id (
            name
          )
        `)
        .in('agent_id', agentIds)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      
      // Map the data to include agent_name
      const mappedLeads = (data || []).map((lead: any) => ({
        ...lead,
        agent_name: lead.agents?.name || 'Unknown Agent'
      }))
      
      setLeads(mappedLeads)
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            View all leads from your agents
          </p>
        </div>
        <div className="p-8 text-center text-muted-foreground">Loading leads...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          View all leads from your agents
        </p>
      </div>

      <LeadsTable
        title="Leads"
        leads={leads}
        onLeadAction={(leadId, action) => {
          if (action === "view") {
            router.push(`/client/leads/${leadId}`)
          }
        }}
      />
    </div>
  )
}

