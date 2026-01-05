'use client'

import { useEffect, useState } from 'react'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Plus, Clock, CheckCircle, XCircle, Eye, MessageSquare } from 'lucide-react'
import Link from 'next/link'

interface AgentRequest {
  id: string
  request_type: 'create' | 'update' | 'delete'
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
  name: string | null
  description: string | null
  priority: string
  created_at: string
  updated_at: string
  admin_notes: string | null
  agent_id: string | null
}

export default function ClientRequestsPage() {
  const [requests, setRequests] = useState<AgentRequest[]>([])
  const [loading, setLoading] = useState(true)

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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      completed: 'default',
      cancelled: 'outline',
    }

    const icons = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      completed: CheckCircle,
      cancelled: XCircle,
    }

    const Icon = icons[status as keyof typeof icons] || Clock

    return (
      <Badge variant={variants[status] || 'secondary'}>
        <Icon className="mr-1 h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      create: 'Create Agent',
      update: 'Update Agent',
      delete: 'Delete Agent',
    }
    return labels[type] || type
  }

  if (loading) {
    return <div className="p-8">Loading requests...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Agent Requests</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
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

      {requests.length === 0 ? (
        <GlassCard>
          <GlassCardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No requests yet</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Create your first agent request to get started
            </p>
            <Link href="/client/requests/create">
              <Button>Create Request</Button>
            </Link>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <GlassCard key={request.id}>
              <GlassCardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-2 flex-1 min-w-0">
                    <GlassCardTitle className="break-words">{request.name || getRequestTypeLabel(request.request_type)}</GlassCardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(request.status)}
                      <GlassCardDescription className="text-xs sm:text-sm">
                        {getRequestTypeLabel(request.request_type)} • {new Date(request.created_at).toLocaleDateString()}
                      </GlassCardDescription>
                    </div>
                  </div>
                  <Link href={`/client/requests/${request.id}`} className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto border-white/10 hover:bg-white/5 hover:text-primary">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </Link>
                </div>
              </GlassCardHeader>
              {request.description && (
                <GlassCardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {request.description}
                  </p>
                </GlassCardContent>
              )}
              {request.admin_notes && request.status !== 'pending' && (
                <GlassCardContent className="pt-0">
                  <div className="rounded-lg bg-muted/20 backdrop-blur-sm p-3 border border-white/5">
                    <p className="text-sm font-medium mb-1">Admin Notes:</p>
                    <p className="text-sm text-muted-foreground">{request.admin_notes}</p>
                  </div>
                </GlassCardContent>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
