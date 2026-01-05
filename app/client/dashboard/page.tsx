'use client'

import { useEffect, useState } from 'react'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { StatsCardsWithLinks, type StatsCardWithLinkData } from '@/components/ui/stats-cards-with-links'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Clock, CheckCircle, XCircle, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  activeAgents: number
  pendingRequests: number
  totalLeads: number
  recentLeads: number
}

export default function ClientDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeAgents: 0,
    pendingRequests: 0,
    totalLeads: 0,
    recentLeads: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Fetch active agents
      const { count: agentsCount } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Fetch pending requests
      const { count: requestsCount } = await supabase
        .from('agent_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending')

      // Fetch total leads
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .in('agent_id',
          (await supabase.from('agents').select('id').eq('user_id', user.id)).data?.map(a => a.id) || []
        )

      // Fetch recent leads (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { count: recentLeadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .in('agent_id',
          (await supabase.from('agents').select('id').eq('user_id', user.id)).data?.map(a => a.id) || []
        )
        .gte('created_at', sevenDaysAgo.toISOString())

      setStats({
        activeAgents: agentsCount || 0,
        pendingRequests: requestsCount || 0,
        totalLeads: leadsCount || 0,
        recentLeads: recentLeadsCount || 0,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Overview of your agents and requests
          </p>
        </div>
        <Link href="/client/requests" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            View Requests
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <StatsCardsWithLinks
        data={[
          {
            name: "Active Agents",
            value: stats.activeAgents.toString(),
            change: stats.activeAgents > 0 ? "+" + stats.activeAgents : undefined,
            changeType: stats.activeAgents > 0 ? "positive" : undefined,
            href: "/client/agents",
          },
          {
            name: "Pending Requests",
            value: stats.pendingRequests.toString(),
            change: stats.pendingRequests > 0 ? stats.pendingRequests.toString() : undefined,
            changeType: stats.pendingRequests > 0 ? "negative" : undefined,
            href: "/client/requests",
          },
          {
            name: "Total Leads",
            value: stats.totalLeads.toLocaleString(),
            change: stats.totalLeads > 0 ? "+" + stats.totalLeads : undefined,
            changeType: stats.totalLeads > 0 ? "positive" : undefined,
            href: "/client/leads",
          },
          {
            name: "Recent Leads",
            value: stats.recentLeads.toString(),
            change: stats.recentLeads > 0 ? "+" + stats.recentLeads : undefined,
            changeType: stats.recentLeads > 0 ? "positive" : undefined,
            href: "/client/leads",
          },
        ]}
      />

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Quick Actions</GlassCardTitle>
            <GlassCardDescription>Common tasks and shortcuts</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-2">
            <Link href="/client/agents">
              <Button variant="outline" className="w-full justify-start border-white/10 hover:bg-white/5 hover:text-primary">
                <MessageSquare className="mr-2 h-4 w-4 text-black" />
                View My Agent
              </Button>
            </Link>
            <Link href="/client/requests">
              <Button variant="outline" className="w-full justify-start border-white/10 hover:bg-white/5 hover:text-primary">
                <Clock className="mr-2 h-4 w-4 text-black" />
                View Requests
              </Button>
            </Link>
            <Link href="/client/leads">
              <Button variant="outline" className="w-full justify-start border-white/10 hover:bg-white/5 hover:text-primary">
                <CheckCircle className="mr-2 h-4 w-4 text-black" />
                View Leads
              </Button>
            </Link>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Recent Activity</GlassCardTitle>
            <GlassCardDescription>Latest updates on your requests</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-sm text-muted-foreground p-4 bg-black/20 rounded-lg">
              Check your <Link href="/client/requests" className="text-primary hover:underline font-semibold">requests page</Link> to see the latest updates.
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  )
}

