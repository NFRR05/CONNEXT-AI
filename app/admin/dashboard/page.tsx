'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StatsCards } from '@/components/ui/stats-cards'
import { Loader2 } from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    agents: 0,
    leads: 0,
    requests: 0,
    users: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login')
          return
        }

        // Fetch all agents count (admin sees all)
        const { count: agentsCount } = await supabase
          .from('agents')
          .select('*', { count: 'exact', head: true })

        // Fetch all leads count (admin sees all)
        const { count: leadsCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })

        // Fetch all requests count (admin sees all)
        const { count: requestsCount } = await supabase
          .from('agent_requests')
          .select('*', { count: 'exact', head: true })

        // Fetch all users count
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        setStats({
          agents: agentsCount || 0,
          leads: leadsCount || 0,
          requests: requestsCount || 0,
          users: usersCount || 0,
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const statsData = [
    {
      name: 'Total Agents',
      value: stats.agents.toString(),
      href: '/admin/agents',
    },
    {
      name: 'Total Leads',
      value: stats.leads.toString(),
      href: '/admin/leads',
    },
    {
      name: 'Requests',
      value: stats.requests.toString(),
      href: '/admin/requests',
    },
    {
      name: 'Total Users',
      value: stats.users.toString(),
      href: '/admin/users',
    },
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's an overview of the system.
        </p>
      </div>

      <div className="flex-1 flex items-end justify-center -mb-6">
        <StatsCards data={statsData} />
      </div>
    </div>
  )
}
