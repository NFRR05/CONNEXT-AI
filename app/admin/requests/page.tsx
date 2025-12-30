'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { Clock, CheckCircle, XCircle, Eye, MessageSquare, FileJson, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AgentRequest {
  id: string
  user_id: string
  request_type: 'create' | 'update' | 'delete'
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
  name: string | null
  description: string | null
  priority: string
  created_at: string
  admin_notes: string | null
  agent_id: string | null
  form_data: any
  workflow_config: any
  profiles: {
    email: string | null
  } | null
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AgentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<AgentRequest | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [showWorkflowPreview, setShowWorkflowPreview] = useState(false)
  const [workflowPreview, setWorkflowPreview] = useState<any>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const { toast } = useToast()

  const fetchRequests = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('agent_requests')
        .select(`
          *,
          profiles:user_id (
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch requests',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApprove = async (requestId: string) => {
    setActionLoading(requestId)
    try {
      const response = await fetch(`/api/agent-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'approved',
          admin_notes: adminNotes || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve request')
      }

      toast({
        title: 'Request approved',
        description: 'The agent request has been approved and will be processed.',
      })

      setSelectedRequest(null)
      setAdminNotes('')
      setShowWorkflowPreview(false)
      setWorkflowPreview(null)
      fetchRequests()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve request',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (requestId: string) => {
    setActionLoading(requestId)
    try {
      const response = await fetch(`/api/agent-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected',
          admin_notes: adminNotes || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reject request')
      }

      toast({
        title: 'Request rejected',
        description: 'The request has been rejected.',
      })

      setSelectedRequest(null)
      setAdminNotes('')
      setShowWorkflowPreview(false)
      setWorkflowPreview(null)
      fetchRequests()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject request',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
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

  const loadWorkflowPreview = async (requestId: string) => {
    if (workflowPreview) {
      setShowWorkflowPreview(!showWorkflowPreview)
      return
    }

    setLoadingPreview(true)
    try {
      const response = await fetch(`/api/admin/agent-requests/${requestId}/blueprint`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate preview')
      }

      const data = await response.json()
      setWorkflowPreview(data.blueprint)
      setShowWorkflowPreview(true)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load workflow preview',
        variant: 'destructive',
      })
    } finally {
      setLoadingPreview(false)
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const otherRequests = requests.filter(r => r.status !== 'pending')

  if (loading) {
    return <div className="p-8">Loading requests...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Agent Requests</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Review and manage agent creation and modification requests
        </p>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Pending Requests ({pendingRequests.length})</h2>
          {pendingRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="break-words">{request.name || getRequestTypeLabel(request.request_type)}</CardTitle>
                      {getStatusBadge(request.status)}
                      <Badge variant="outline" className="text-xs">{request.priority}</Badge>
                    </div>
                    <CardDescription className="text-xs sm:text-sm break-words">
                      {getRequestTypeLabel(request.request_type)} • {request.profiles?.email || 'Unknown user'} • {new Date(request.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRequest(request)}
                    className="w-full sm:w-auto"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Review
                  </Button>
                </div>
              </CardHeader>
              {request.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {request.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Other Requests */}
      {otherRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Other Requests</h2>
          <div className="space-y-2">
            {otherRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-2 flex-1 min-w-0">
                      <CardTitle className="text-base break-words">{request.name || getRequestTypeLabel(request.request_type)}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(request.status)}
                        <CardDescription className="text-xs sm:text-sm break-words">
                          {request.profiles?.email || 'Unknown user'} • {new Date(request.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Review Request</CardTitle>
              <CardDescription className="break-words">
                {getRequestTypeLabel(selectedRequest.request_type)} from {selectedRequest.profiles?.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Request Details</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg space-y-2">
                  <div>
                    <span className="font-medium">Name:</span> {selectedRequest.name || 'N/A'}
                  </div>
                  {selectedRequest.description && (
                    <div>
                      <span className="font-medium">Description:</span>
                      <p className="mt-1 text-sm break-words">{selectedRequest.description}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Priority:</span> {selectedRequest.priority}
                  </div>
                </div>
              </div>

              {selectedRequest.request_type === 'create' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Workflow Preview</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => loadWorkflowPreview(selectedRequest.id)}
                      disabled={loadingPreview}
                    >
                      {loadingPreview ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : showWorkflowPreview ? (
                        <>
                          <ChevronUp className="mr-2 h-4 w-4" />
                          Hide Preview
                        </>
                      ) : (
                        <>
                          <FileJson className="mr-2 h-4 w-4" />
                          Preview Workflow
                        </>
                      )}
                    </Button>
                  </div>
                  {showWorkflowPreview && workflowPreview && (
                    <div className="mt-2 p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
                      <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                        {JSON.stringify(workflowPreview, null, 2)}
                      </pre>
                    </div>
                  )}
                  {showWorkflowPreview && !workflowPreview && (
                    <div className="mt-2 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                      No workflow preview available
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="admin_notes">Admin Notes</Label>
                <Textarea
                  id="admin_notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this request..."
                  rows={4}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => handleApprove(selectedRequest.id)}
                  disabled={actionLoading === selectedRequest.id}
                  className="flex-1"
                >
                  {actionLoading === selectedRequest.id ? 'Processing...' : 'Approve'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedRequest.id)}
                  disabled={actionLoading === selectedRequest.id}
                  className="flex-1"
                >
                  Reject
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRequest(null)
                    setAdminNotes('')
                    setShowWorkflowPreview(false)
                    setWorkflowPreview(null)
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

