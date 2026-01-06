'use client'

import { useEffect, useState } from 'react'
import { RequestsList, type RequestItem } from '@/components/ui/requests-list'
import { RequestReviewModal } from '@/components/ui/request-review-modal'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface AgentRequest extends RequestItem {
  user_id: string
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
        let error
        try {
          error = await response.json()
        } catch (e) {
          error = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        // Build detailed error message
        let errorMessage = error.error || 'Failed to approve request'
        if (error.details) {
          errorMessage += `: ${error.details}`
        }

        // Log full error for debugging
        console.error('Approve request error - Full details:', {
          status: response.status,
          statusText: response.statusText,
          error: error,
          errorString: JSON.stringify(error, null, 2),
        })

        // Show the actual error details in the toast
        const toastMessage = error.details || error.error || 'Failed to approve request'

        throw new Error(toastMessage)
      }

      toast({
        title: 'Request approved',
        description: 'The agent request has been approved and will be processed.',
      })

      handleCloseModal()
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

      handleCloseModal()
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

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      create: 'Create Agent',
      update: 'Update Agent',
      delete: 'Delete Agent',
    }
    return labels[type] || type
  }

  const handleReviewRequest = (id: string) => {
    const request = requests.find(r => r.id === id)
    if (request) {
      setSelectedRequest(request as AgentRequest)
    }
  }

  const loadWorkflowPreview = async (requestId: string) => {
    if (workflowPreview && selectedRequest?.id === requestId) {
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

  const handleToggleWorkflowPreview = () => {
    if (selectedRequest) {
      loadWorkflowPreview(selectedRequest.id)
    }
  }

  const handleCloseModal = () => {
    setSelectedRequest(null)
    setAdminNotes('')
    setShowWorkflowPreview(false)
    setWorkflowPreview(null)
  }

  const pendingRequests = requests.filter(r => r.status === 'pending').map(r => ({
    ...r,
    user_email: (r as AgentRequest).profiles?.email || null
  }))
  const otherRequests = requests.filter(r => r.status !== 'pending').map(r => ({
    ...r,
    user_email: (r as AgentRequest).profiles?.email || null
  }))

  if (loading) {
    return <div className="p-8">Loading requests...</div>
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Agent Requests</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Review and manage agent creation and modification requests
        </p>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Pending Requests ({pendingRequests.length})</h2>
          <RequestsList
            requests={pendingRequests}
            onReviewRequest={handleReviewRequest}
            showUserEmail={true}
          />
        </div>
      )}

      {/* Other Requests */}
      {otherRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Other Requests</h2>
          <RequestsList
            requests={otherRequests}
            showUserEmail={true}
          />
        </div>
      )}

      {/* Empty State */}
      {pendingRequests.length === 0 && otherRequests.length === 0 && (
        <RequestsList
          requests={[]}
          showUserEmail={true}
          emptyStateTitle="No requests found"
          emptyStateDescription="There are no agent requests to review at this time"
        />
      )}

      {/* Review Modal */}
      <RequestReviewModal
        open={!!selectedRequest}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseModal()
          }
        }}
        request={selectedRequest}
        adminNotes={adminNotes}
        onAdminNotesChange={setAdminNotes}
        onApprove={() => selectedRequest && handleApprove(selectedRequest.id)}
        onReject={() => selectedRequest && handleReject(selectedRequest.id)}
        onCancel={handleCloseModal}
        actionLoading={actionLoading === selectedRequest?.id}
        showWorkflowPreview={showWorkflowPreview}
        workflowPreview={workflowPreview}
        loadingPreview={loadingPreview}
        onToggleWorkflowPreview={handleToggleWorkflowPreview}
        getRequestTypeLabel={getRequestTypeLabel}
      />
    </div>
  )
}
