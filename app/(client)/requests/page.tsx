'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Plus, Clock, CheckCircle, XCircle, Eye } from 'lucide-react'
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agent Requests</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your agent creation and modification requests
          </p>
        </div>
        <Link href="/client/requests/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No requests yet</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Create your first agent request to get started
            </p>
            <Link href="/client/requests/create">
              <Button>Create Request</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{request.name || getRequestTypeLabel(request.request_type)}</CardTitle>
                      {getStatusBadge(request.status)}
                    </div>
                    <CardDescription>
                      {getRequestTypeLabel(request.request_type)} • {new Date(request.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Link href={`/client/requests/${request.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              {request.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {request.description}
                  </p>
                </CardContent>
              )}
              {request.admin_notes && request.status !== 'pending' && (
                <CardContent className="pt-0">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm font-medium mb-1">Admin Notes:</p>
                    <p className="text-sm text-muted-foreground">{request.admin_notes}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

