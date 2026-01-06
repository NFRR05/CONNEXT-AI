'use client'

import { useEffect, useState } from 'react'
import { StatsCardsWithLinks, type StatsCardWithLinkData } from '@/components/ui/stats-cards-with-links'
import { SystemStatusCard, type SystemStatusItem } from '@/components/ui/system-status-card'
import { QuickActionCard, type ActionItem } from '@/components/ui/quick-action-card'
import { Loader } from '@/components/ui/loader'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Clock, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AdminStats {
  totalClients: number
  totalAgents: number
  pendingRequests: number
  totalLeads: number
  activeAgents: number
  inactiveAgents: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats>({
    totalClients: 0,
    totalAgents: 0,
    pendingRequests: 0,
    totalLeads: 0,
    activeAgents: 0,
    inactiveAgents: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const supabase = createClient()

      // Total clients (non-admin users)
      const { count: clientsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'client')

      // Total agents
      const { count: agentsCount } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })

      // Pending requests
      const { count: requestsCount } = await supabase
        .from('agent_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Total leads
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })

      // Active agents (with webhook activity in last 24h)
      const { count: activeCount } = await supabase
        .from('webhook_activity')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Inactive agents
      const { count: inactiveCount } = await supabase
        .from('webhook_activity')
        .select('*', { count: 'exact', head: true })
        .in('status', ['inactive', 'warning'])

      setStats({
        totalClients: clientsCount || 0,
        totalAgents: agentsCount || 0,
        pendingRequests: requestsCount || 0,
        totalLeads: leadsCount || 0,
        activeAgents: activeCount || 0,
        inactiveAgents: inactiveCount || 0,
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
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          System overview and management
        </p>
      </div>

      {/* Stats Grid */}
      <StatsCardsWithLinks
        data={[
          {
            name: "Total Clients",
            value: stats.totalClients.toString(),
            change: stats.totalClients > 0 ? "+" + stats.totalClients : undefined,
            changeType: stats.totalClients > 0 ? "positive" : undefined,
            href: "/admin/agents",
          },
          {
            name: "Total Agents",
            value: stats.totalAgents.toString(),
            change: stats.totalAgents > 0 ? "+" + stats.totalAgents : undefined,
            changeType: stats.totalAgents > 0 ? "positive" : undefined,
            href: "/admin/agents",
          },
          {
            name: "Pending Requests",
            value: stats.pendingRequests.toString(),
            change: stats.pendingRequests > 0 ? stats.pendingRequests.toString() : undefined,
            changeType: stats.pendingRequests > 0 ? "negative" : undefined,
            href: "/admin/requests",
          },
          {
            name: "Total Leads",
            value: stats.totalLeads.toLocaleString(),
            change: stats.totalLeads > 0 ? "+" + stats.totalLeads : undefined,
            changeType: stats.totalLeads > 0 ? "positive" : undefined,
            href: "/admin/agents",
          },
          {
            name: "Active Agents",
            value: stats.activeAgents.toString(),
            change: stats.activeAgents > 0 ? "+" + stats.activeAgents : undefined,
            changeType: stats.activeAgents > 0 ? "positive" : undefined,
            href: "/admin/agents",
          },
          {
            name: "Inactive Agents",
            value: stats.inactiveAgents.toString(),
            change: stats.inactiveAgents > 0 ? stats.inactiveAgents.toString() : undefined,
            changeType: stats.inactiveAgents > 0 ? "negative" : undefined,
            href: "/admin/agents",
          },
        ]}
      />

      {/* Quick Actions & System Status */}
      <div className="grid gap-4 sm:grid-cols-2">
        <QuickActionCard
          title="Quick Actions"
          subtitle="Common admin tasks"
          actions={[
            {
              icon: <Clock className="h-full w-full" />,
              label: 'Requests',
              href: '/admin/requests',
            },
            {
              icon: <MessageSquare className="h-full w-full" />,
              label: 'Agents',
              href: '/admin/agents',
            },
            {
              icon: <CheckCircle className="h-full w-full" />,
              label: 'Workflows',
              href: '/admin/workflows',
            },
          ]}
          columns={3}
        />

        <SystemStatusCard
          items={[
            {
              label: 'n8n Status',
              status: 'online',
              customLabel: 'Online',
            },
            {
              label: 'Database',
              status: 'online',
              customLabel: 'Healthy',
            },
            {
              label: 'API',
              status: 'online',
              customLabel: 'Operational',
            },
          ]}
        />
      </div>
    </div>
  )
}

