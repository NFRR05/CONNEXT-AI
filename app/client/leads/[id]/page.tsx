'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { EntityDetailView } from '@/components/ui/entity-detail-view'
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader } from '@/components/ui/loader'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Phone, MessageSquare, Clock, FileText } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface Lead {
  id: string
  customer_phone: string | null
  call_summary: string | null
  status: 'New' | 'Contacted' | 'Closed'
  created_at: string
  duration: number | null
  sentiment: string | null
  agent_id: string
  recording_url?: string | null
  transcript?: string | null
  agents: {
    name: string
  } | null
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const leadId = params.id as string
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [status, setStatus] = useState<'New' | 'Contacted' | 'Closed'>('New')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (leadId) {
      fetchLeadDetails()
    }
  }, [leadId])

  const fetchLeadDetails = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          agents:agent_id (
            name
          )
        `)
        .eq('id', leadId)
        .single()

      if (error) throw error
      if (data) {
        setLead(data as Lead)
        setStatus(data.status as 'New' | 'Contacted' | 'Closed')
        setNotes(data.call_summary || '')
      }
    } catch (error) {
      console.error('Error fetching lead:', error)
      toast({
        title: 'Error',
        description: 'Failed to load lead details',
        variant: 'destructive',
      })
      router.push('/client/leads')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!lead) return
    setUpdating(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('leads')
        .update({ status, call_summary: notes || lead.call_summary })
        .eq('id', lead.id)

      if (error) throw error

      toast({
        title: 'Updated',
        description: 'Lead status updated successfully',
      })
      fetchLeadDetails()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update lead',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="p-8">
        <GlassCard>
          <GlassCardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Lead not found</h3>
            <p className="text-muted-foreground mb-4 text-center">
              This lead doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Link href="/client/leads">
              <Button>Back to Leads</Button>
            </Link>
          </GlassCardContent>
        </GlassCard>
      </div>
    )
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/client/leads" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Leads
      </Link>

      <EntityDetailView
        title={`Lead from ${lead.customer_phone || 'Unknown'}`}
        status={lead.status}
        description={lead.call_summary || undefined}
        tags={[
          { 
            label: lead.status, 
            variant: lead.status === 'Closed' ? 'default' : lead.status === 'Contacted' ? 'secondary' : 'outline' 
          },
          ...(lead.sentiment ? [{ label: lead.sentiment, variant: 'outline' as const }] : [])
        ]}
        dateRange={{
          start: new Date(lead.created_at).toLocaleDateString(),
          end: formatDuration(lead.duration)
        }}
        attachments={lead.recording_url ? [{
          name: 'Call Recording',
          size: 'Audio File',
          type: 'other'
        }] : []}
        breadcrumbs={[
          { label: 'Leads', href: '/client/leads' },
          { label: lead.customer_phone || 'Lead', href: `/client/leads/${lead.id}` }
        ]}
      />

      {/* Status Update Form */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Update Status</GlassCardTitle>
          <GlassCardDescription>Update the lead status and add notes</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger id="status" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Contacted">Contacted</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this lead..."
              rows={4}
              className="mt-2"
            />
          </div>
          <Button onClick={handleStatusUpdate} disabled={updating} className="shadow-lg shadow-primary/20">
            {updating ? (
              <>
                <Loader size="sm" className="mr-2" />
                Updating...
              </>
            ) : (
              'Update Status'
            )}
          </Button>
        </GlassCardContent>
      </GlassCard>

      {/* Additional Information */}
      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Phone Number</p>
              <p className="text-lg font-mono">{lead.customer_phone || 'N/A'}</p>
            </div>
            {lead.agents && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Agent</p>
                <p className="text-sm font-medium">{lead.agents.name}</p>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Call Details
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Duration</p>
              <p className="text-lg font-semibold">{formatDuration(lead.duration)}</p>
            </div>
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Created</p>
              <p className="text-sm">{new Date(lead.created_at).toLocaleString()}</p>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Transcript Section */}
      {lead.transcript && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Call Transcript
            </GlassCardTitle>
            <GlassCardDescription>Full conversation transcript</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="p-4 bg-muted/20 rounded-lg backdrop-blur-sm border border-border/50">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{lead.transcript}</p>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  )
}

