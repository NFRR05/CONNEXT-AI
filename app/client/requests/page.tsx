'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { RequestsList, type RequestItem } from '@/components/ui/requests-list'
import { createClient } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ClientRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchRequests = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('agent_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewRequest = (id: string) => {
    router.push(`/client/requests/${id}`)
  }

  if (loading) {
    return <div className="p-8">Loading requests...</div>
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Agent Requests</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            View and manage your agent creation and modification requests
          </p>
        </div>
        <Link href="/client/requests/create" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>

      <RequestsList
        requests={requests}
        onViewRequest={handleViewRequest}
        emptyStateTitle="No requests yet"
        emptyStateDescription="Create your first agent request to get started"
        emptyStateActionLabel="Create Request"
        emptyStateActionHref="/client/requests/create"
      />
    </div>
  )
}
