'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

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
  form_data: any
  workflow_config: any
}

export default function RequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [request, setRequest] = useState<AgentRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchRequest(params.id as string)
    }
  }, [params.id])

  const fetchRequest = async (requestId: string) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data, error } = await supabase
        .from('agent_requests')
        .select('*')
        .eq('id', requestId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      setRequest(data)
    } catch (error) {
      console.error('Error fetching request:', error)
      toast({
        title: 'Error',
        description: 'Failed to load request details',
        variant: 'destructive',
      })
      router.push('/client/requests')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!request) return
    
    if (!confirm('Are you sure you want to cancel this request? This action cannot be undone.')) {
      return
    }

    setCancelling(true)
    try {
      const response = await fetch(`/api/agent-requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'cancelled',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel request')
      }

      toast({
        title: 'Request cancelled',
        description: 'Your request has been cancelled.',
      })

      router.push('/client/requests')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel request',
        variant: 'destructive',
      })
    } finally {
      setCancelling(false)
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
    return <div className="p-8">Loading request details...</div>
  }

  if (!request) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Request not found</h3>
            <p className="text-muted-foreground mb-4 text-center">
              The request you're looking for doesn't exist or you don't have access to it.
            </p>
            <Link href="/client/requests">
              <Button>Back to Requests</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/client/requests" className="flex items-center text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Requests
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{request.name || getRequestTypeLabel(request.request_type)}</h1>
          <div className="flex items-center gap-2 mt-2">
            {getStatusBadge(request.status)}
            <span className="text-sm text-muted-foreground">
              {getRequestTypeLabel(request.request_type)} • {new Date(request.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        {request.status === 'pending' && (
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Request'}
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Request Type</span>
              <p className="text-base font-medium">{getRequestTypeLabel(request.request_type)}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{request.priority}</Badge>
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Created</span>
              <p className="text-sm">{new Date(request.created_at).toLocaleString()}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Updated</span>
              <p className="text-sm">{new Date(request.updated_at).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        {request.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{request.description}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Form Data */}
      {request.form_data && Object.keys(request.form_data).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Form Data</CardTitle>
            <CardDescription>Information collected from the creation form</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {request.form_data.businessType && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Business Type</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {Array.isArray(request.form_data.businessType) ? (
                      request.form_data.businessType.map((type: string, idx: number) => (
                        <Badge key={idx} variant="secondary">{type}</Badge>
                      ))
                    ) : (
                      <Badge variant="secondary">{request.form_data.businessType}</Badge>
                    )}
                  </div>
                </div>
              )}

              {request.form_data.agentPurpose && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Agent Purpose</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {Array.isArray(request.form_data.agentPurpose) ? (
                      request.form_data.agentPurpose.map((purpose: string, idx: number) => (
                        <Badge key={idx} variant="secondary">{purpose}</Badge>
                      ))
                    ) : (
                      <Badge variant="secondary">{request.form_data.agentPurpose}</Badge>
                    )}
                  </div>
                </div>
              )}

              {request.form_data.informationToCollect && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Information to Collect</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {Array.isArray(request.form_data.informationToCollect) ? (
                      request.form_data.informationToCollect.map((info: string, idx: number) => (
                        <Badge key={idx} variant="outline">{info}</Badge>
                      ))
                    ) : (
                      <Badge variant="outline">{request.form_data.informationToCollect}</Badge>
                    )}
                  </div>
                </div>
              )}

              {request.form_data.tone && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tone & Personality</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {Array.isArray(request.form_data.tone) ? (
                      request.form_data.tone.map((tone: string, idx: number) => (
                        <Badge key={idx} variant="outline">{tone}</Badge>
                      ))
                    ) : (
                      <Badge variant="outline">{request.form_data.tone}</Badge>
                    )}
                  </div>
                </div>
              )}

              {request.form_data.businessName && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Business Name</span>
                  <p className="mt-1 text-sm font-medium">{request.form_data.businessName}</p>
                </div>
              )}

              {request.form_data.agentName && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Agent Name</span>
                  <p className="mt-1 text-sm font-medium">{request.form_data.agentName}</p>
                </div>
              )}

              {request.form_data.additionalInfo && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Additional Information</span>
                  <p className="mt-1 text-sm whitespace-pre-wrap break-words">{request.form_data.additionalInfo}</p>
                </div>
              )}

              {/* Show raw JSON for any other fields */}
              {Object.keys(request.form_data).some(key => 
                !['businessType', 'agentPurpose', 'informationToCollect', 'tone', 'businessName', 'agentName', 'additionalInfo'].includes(key)
              ) && (
                <div className="pt-4 border-t">
                  <details className="group">
                    <summary className="text-xs font-medium text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground">
                      Raw Form Data
                    </summary>
                    <div className="mt-2 p-4 bg-muted rounded-lg max-h-64 overflow-auto">
                      <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                        {JSON.stringify(request.form_data, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Configuration */}
      {request.workflow_config && Object.keys(request.workflow_config).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Workflow Configuration</CardTitle>
            <CardDescription>n8n workflow settings and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Data Validation */}
              {(request.workflow_config.validatePhone || request.workflow_config.validateEmail || request.workflow_config.filterTestCalls || request.workflow_config.minCallDuration) && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Data Validation</span>
                  <div className="space-y-2">
                    {request.workflow_config.validatePhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Validate phone numbers</span>
                      </div>
                    )}
                    {request.workflow_config.validateEmail && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Validate email addresses</span>
                      </div>
                    )}
                    {request.workflow_config.filterTestCalls && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Filter test calls</span>
                      </div>
                    )}
                    {request.workflow_config.minCallDuration && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Minimum call duration: {request.workflow_config.minCallDuration}s</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Handling */}
              {(request.workflow_config.retryOnFailure || request.workflow_config.errorNotifications) && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Error Handling</span>
                  <div className="space-y-2">
                    {request.workflow_config.retryOnFailure && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Retry on failure (max: {request.workflow_config.maxRetries || 3} retries)</span>
                      </div>
                    )}
                    {request.workflow_config.errorNotifications?.enabled && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Error notifications: {request.workflow_config.errorNotifications.email || 'Enabled'}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Data Transformation */}
              {(request.workflow_config.formatPhoneNumbers || request.workflow_config.extractStructuredData) && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Data Transformation</span>
                  <div className="space-y-2">
                    {request.workflow_config.formatPhoneNumbers && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Format phone numbers to international format</span>
                      </div>
                    )}
                    {request.workflow_config.extractStructuredData && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Extract structured data from transcripts</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Smart Routing */}
              {(request.workflow_config.routeBySentiment || request.workflow_config.routeByDuration) && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Smart Routing</span>
                  <div className="space-y-2">
                    {request.workflow_config.routeBySentiment && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Route by sentiment ({request.workflow_config.sentimentThreshold || 'all'})</span>
                      </div>
                    )}
                    {request.workflow_config.routeByDuration && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Route by duration (threshold: {request.workflow_config.durationThreshold || 120}s)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Show raw JSON for any other fields */}
              {Object.keys(request.workflow_config).some(key => 
                !['validatePhone', 'validateEmail', 'filterTestCalls', 'minCallDuration', 'retryOnFailure', 'maxRetries', 'errorNotifications', 'formatPhoneNumbers', 'extractStructuredData', 'routeBySentiment', 'sentimentThreshold', 'routeByDuration', 'durationThreshold'].includes(key)
              ) && (
                <div className="pt-4 border-t">
                  <details className="group">
                    <summary className="text-xs font-medium text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground">
                      Raw Configuration
                    </summary>
                    <div className="mt-2 p-4 bg-muted rounded-lg max-h-64 overflow-auto">
                      <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                        {JSON.stringify(request.workflow_config, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {request.admin_notes && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Admin Notes
            </CardTitle>
            <CardDescription>Feedback and notes from the admin team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{request.admin_notes}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

