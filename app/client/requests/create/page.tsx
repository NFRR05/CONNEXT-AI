'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RequestForm } from '@/components/ui/request-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'

interface Agent {
  id: string
  name: string
}

interface RequestFormData {
  request_type: 'create' | 'update' | 'delete'
  name: string
  description: string
  agent_id: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

export default function CreateRequestPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)

  // Fetch user's agents on component mount
  useEffect(() => {
    fetchAgents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAgents = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('agents')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAgents(data || [])
    } catch (error) {
      console.error('Error fetching agents:', error)
      toast({
        title: 'Error',
        description: 'Failed to load your agents',
        variant: 'destructive',
      })
    } finally {
      setLoadingAgents(false)
    }
  }

  const handleSubmit = async (formData: RequestFormData) => {
    setLoading(true)

    try {
      const requestBody = {
        request_type: formData.request_type,
        name: formData.name || null,
        description: formData.description || null,
        priority: formData.priority,
        agent_id: formData.agent_id || null,
      }

      const response = await fetch('/api/agent-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create request')
      }

      toast({
        title: 'Request submitted',
        description: 'Your request has been submitted and will be reviewed by an admin.',
      })

      router.push('/client/requests')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create request',
        variant: 'destructive',
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/client/requests')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/client/requests"
        className="flex items-center text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Requests
      </Link>

      <RequestForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        agents={agents}
        loadingAgents={loadingAgents}
        allowCreate={false}
      />
    </div>
  )
}
