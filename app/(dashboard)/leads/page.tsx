'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { format, formatDistanceToNow } from 'date-fns'
import { Phone, Clock, Play, Eye, Filter, X } from 'lucide-react'
import { LeadDetailsModal } from '@/components/lead-details-modal'
import { cn } from '@/lib/utils'

interface Lead {
  id: string
  agent_id: string
  customer_phone: string | null
  call_summary: string | null
  call_transcript: string | null
  recording_url: string | null
  sentiment: string | null
  structured_data: any
  status: 'New' | 'Contacted' | 'Closed'
  duration: number | null
  created_at: string
  updated_at: string
  agents: {
    id: string
    name: string
  }
}

interface Agent {
  id: string
  name: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Filters
  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchAgents()
    fetchLeads()
    setupRealtimeSubscription()
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [selectedAgent, selectedStatus])

  async function fetchAgents() {
    try {
      const response = await fetch('/api/agents')
      if (!response.ok) throw new Error('Failed to fetch agents')
      const data = await response.json()
      setAgents(data.agents || [])
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }

  async function fetchLeads() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedAgent !== 'all') {
        params.append('agent_id', selectedAgent)
      }
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }

      const response = await fetch(`/api/leads?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch leads')
      const data = await response.json()
      setLeads(data.leads || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  function setupRealtimeSubscription() {
    const supabase = createClient()
    
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
        },
        (payload) => {
          console.log('Realtime update:', payload)
          // Refresh leads when changes occur
          fetchLeads()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  async function updateLeadStatus(leadId: string, status: 'New' | 'Contacted' | 'Closed') {
    try {
      const response = await fetch('/api/leads', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadId, status }),
      })

      if (!response.ok) throw new Error('Failed to update lead')
      
      // Update local state
      setLeads(prev =>
        prev.map(lead =>
          lead.id === leadId ? { ...lead, status } : lead
        )
      )
    } catch (error) {
      console.error('Error updating lead status:', error)
    }
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function getStatusBadgeVariant(status: string) {
    switch (status) {
      case 'New':
        return 'default'
      case 'Contacted':
        return 'secondary'
      case 'Closed':
        return 'outline'
      default:
        return 'default'
    }
  }

  function getSentimentColor(sentiment: string | null): string {
    if (!sentiment) return 'text-muted-foreground'
    const lower = sentiment.toLowerCase()
    if (lower.includes('positive') || lower.includes('happy')) return 'text-green-600 dark:text-green-400'
    if (lower.includes('negative') || lower.includes('angry')) return 'text-red-600 dark:text-red-400'
    return 'text-yellow-600 dark:text-yellow-400'
  }

  // Filter leads by search query
  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads
    
    const query = searchQuery.toLowerCase()
    return leads.filter(lead =>
      lead.customer_phone?.toLowerCase().includes(query) ||
      lead.call_summary?.toLowerCase().includes(query) ||
      lead.agents.name.toLowerCase().includes(query)
    )
  }, [leads, searchQuery])

  const hasActiveFilters = selectedAgent !== 'all' || selectedStatus !== 'all' || searchQuery

  function clearFilters() {
    setSelectedAgent('all')
    setSelectedStatus('all')
    setSearchQuery('')
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 md:py-10 px-4 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Leads Dashboard</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            View and manage all your incoming leads
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">Filters</CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-0 sm:flex sm:gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by phone, summary, or agent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Contacted">Contacted</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading leads...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {hasActiveFilters ? 'No leads match your filters' : 'No leads yet. They will appear here when calls come in.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="hidden sm:table-cell">Summary</TableHead>
                    <TableHead className="hidden md:table-cell">Sentiment</TableHead>
                    <TableHead className="hidden lg:table-cell">Duration</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                      setSelectedLead(lead)
                      setIsModalOpen(true)
                    }}>
                      <TableCell>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={lead.status}
                            onValueChange={(value: 'New' | 'Contacted' | 'Closed') => {
                              updateLeadStatus(lead.id, value)
                            }}
                          >
                            <SelectTrigger className="h-8 w-[100px] border-0 p-0">
                              <Badge variant={getStatusBadgeVariant(lead.status) as any}>
                                {lead.status}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="New">New</SelectItem>
                              <SelectItem value="Contacted">Contacted</SelectItem>
                              <SelectItem value="Closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{lead.agents.name}</TableCell>
                      <TableCell>
                        {lead.customer_phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{lead.customer_phone}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="max-w-[200px] truncate text-sm">
                          {lead.call_summary || <span className="text-muted-foreground">No summary</span>}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {lead.sentiment ? (
                          <span className={cn('text-xs font-medium', getSentimentColor(lead.sentiment))}>
                            {lead.sentiment}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDuration(lead.duration)}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {lead.recording_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedLead(lead)
                                setIsModalOpen(true)
                              }}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedLead(lead)
                              setIsModalOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Details Modal */}
      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onStatusUpdate={(status) => updateLeadStatus(selectedLead.id, status)}
        />
      )}
    </div>
  )
}
