'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { StatsCardsWithLinks, type StatsCardWithLinkData } from '@/components/ui/stats-cards-with-links'
import { QuickActionCard, type ActionItem } from '@/components/ui/quick-action-card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Clock, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  activeAgents: number
  pendingRequests: number
  totalLeads: number
  recentLeads: number
}

export default function ClientDashboard() {
  const router = useRouter()
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
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
      <QuickActionCard
        title="Quick Actions"
        subtitle="Common tasks and shortcuts"
        actions={[
          {
            icon: <MessageSquare className="h-full w-full" />,
            label: 'Agents',
            href: '/client/agents',
          },
          {
            icon: <Clock className="h-full w-full" />,
            label: 'Requests',
            href: '/client/requests',
          },
          {
            icon: <CheckCircle className="h-full w-full" />,
            label: 'Leads',
            href: '/client/leads',
          },
        ]}
        columns={3}
      />
    </div>
  )
}

