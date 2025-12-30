'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

export default function CreateRequestPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    request_type: 'create' as 'create' | 'update' | 'delete',
    name: '',
    description: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    agent_id: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/agent-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_type: formData.request_type,
          name: formData.name || null,
          description: formData.description || null,
          priority: formData.priority,
          agent_id: formData.agent_id || null,
        }),
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/client/requests" className="flex items-center text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Requests
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create Agent Request</CardTitle>
          <CardDescription>
            Submit a request to create, update, or delete an agent. Your request will be reviewed by an admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="request_type">Request Type</Label>
              <Select
                value={formData.request_type}
                onValueChange={(value: 'create' | 'update' | 'delete') =>
                  setFormData({ ...formData, request_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create">Create New Agent</SelectItem>
                  <SelectItem value="update">Update Existing Agent</SelectItem>
                  <SelectItem value="delete">Delete Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.request_type !== 'delete' && (
              <>
                <div>
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My AI Agent"
                    required={formData.request_type === 'create'}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your business, the agent's purpose, and any specific requirements..."
                    rows={6}
                    required={formData.request_type === 'create'}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    For new agents, provide details about your business and what the agent should do.
                  </p>
                </div>
              </>
            )}

            {formData.request_type === 'update' && (
              <div>
                <Label htmlFor="agent_id">Agent ID</Label>
                <Input
                  id="agent_id"
                  value={formData.agent_id}
                  onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                  placeholder="Enter agent ID to update"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  You can find the agent ID on your agents page.
                </p>
              </div>
            )}

            {formData.request_type === 'delete' && (
              <div>
                <Label htmlFor="agent_id">Agent ID</Label>
                <Input
                  id="agent_id"
                  value={formData.agent_id}
                  onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                  placeholder="Enter agent ID to delete"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Warning: This will permanently delete the agent and all associated data.
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

