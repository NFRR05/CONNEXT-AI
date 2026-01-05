'use client'

import { useEffect, useState } from 'react'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { StatsCardsWithLinks, type StatsCardWithLinkData } from '@/components/ui/stats-cards-with-links'
import { createClient } from '@/lib/supabase/client'
import { Users, MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface AdminStats {
  totalClients: number
  totalAgents: number
  pendingRequests: number
  totalLeads: number
  activeAgents: number
  inactiveAgents: number
}

export default function AdminDashboard() {
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
    return <div className="p-8">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
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

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Quick Actions</GlassCardTitle>
            <GlassCardDescription>Common admin tasks</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-2">
            <Link href="/admin/requests">
              <Button variant="outline" className="w-full justify-start border-white/10 hover:bg-white/5 hover:text-primary">
                <Clock className="mr-2 h-4 w-4 text-black" />
                Review Requests
              </Button>
            </Link>
            <Link href="/admin/agents">
              <Button variant="outline" className="w-full justify-start border-white/10 hover:bg-white/5 hover:text-primary">
                <MessageSquare className="mr-2 h-4 w-4 text-black" />
                Manage Agents
              </Button>
            </Link>
            <Link href="/admin/workflows">
              <Button variant="outline" className="w-full justify-start border-white/10 hover:bg-white/5 hover:text-primary">
                <CheckCircle className="mr-2 h-4 w-4 text-black" />
                n8n Workflows
              </Button>
            </Link>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>System Status</GlassCardTitle>
            <GlassCardDescription>Current system health</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 rounded hover:bg-white/5">
                <span className="text-muted-foreground">n8n Status:</span>
                <span className="font-medium text-green-500">Online</span>
              </div>
              <div className="flex justify-between p-2 rounded hover:bg-white/5">
                <span className="text-muted-foreground">Database:</span>
                <span className="font-medium text-green-500">Healthy</span>
              </div>
              <div className="flex justify-between p-2 rounded hover:bg-white/5">
                <span className="text-muted-foreground">API:</span>
                <span className="font-medium text-green-500">Operational</span>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  )
}

