'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

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

interface RequestFormProps {
  onSubmit: (data: RequestFormData) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  agents?: Agent[]
  loadingAgents?: boolean
  allowCreate?: boolean
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export function RequestForm({
  onSubmit,
  onCancel,
  loading = false,
  agents = [],
  loadingAgents = false,
  allowCreate = false,
}: RequestFormProps) {
  const [formData, setFormData] = React.useState<RequestFormData>({
    request_type: allowCreate ? 'create' : 'update',
    name: '',
    description: '',
    agent_id: '',
    priority: 'normal',
  })

  const updateFormData = (field: keyof RequestFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const isFormValid = () => {
    if (formData.request_type === 'delete') {
      return formData.agent_id.trim() !== ''
    }
    if (formData.request_type === 'update') {
      return (
        formData.agent_id.trim() !== '' &&
        (formData.name.trim() !== '' || formData.description.trim() !== '')
      )
    }
    // create
    return (
      formData.name.trim() !== '' && formData.description.trim() !== ''
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border shadow-md rounded-3xl overflow-hidden">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Create Agent Request</CardTitle>
            <CardDescription>
              {formData.request_type === 'create'
                ? "Let's guide you through creating the perfect agent for your business"
                : `Submit a request to ${formData.request_type} an agent. Your request will be reviewed by an admin.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Request Type Selector */}
            <motion.div variants={fadeInUp} className="space-y-2">
              <Label htmlFor="request_type">Request Type</Label>
              <Select
                value={formData.request_type}
                onValueChange={(value: 'create' | 'update' | 'delete') =>
                  updateFormData('request_type', value)
                }
              >
                <SelectTrigger
                  id="request_type"
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowCreate && (
                    <SelectItem value="create">Create New Agent</SelectItem>
                  )}
                  <SelectItem value="update">Update Existing Agent</SelectItem>
                  <SelectItem value="delete">Delete Agent</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.request_type === 'update' &&
                  'Provide details about what you want to change in your existing agent.'}
                {formData.request_type === 'delete' &&
                  'Request to permanently delete an agent and all associated data.'}
                {formData.request_type === 'create' &&
                  'Request to create a new agent with your specifications.'}
              </p>
            </motion.div>

            {/* Agent Selection (for update/delete) */}
            {(formData.request_type === 'update' ||
              formData.request_type === 'delete') && (
              <motion.div variants={fadeInUp} className="space-y-2">
                <Label htmlFor="agent_id">Select Agent</Label>
                {loadingAgents ? (
                  <div className="text-sm text-muted-foreground">
                    Loading agents...
                  </div>
                ) : agents.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    You don&apos;t have any agents yet. Agents will appear here
                    once they&apos;re created.
                  </div>
                ) : (
                  <Select
                    value={formData.agent_id}
                    onValueChange={(value) =>
                      updateFormData('agent_id', value)
                    }
                  >
                    <SelectTrigger
                      id="agent_id"
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </motion.div>
            )}

            {/* Agent Name (for create/update) */}
            {formData.request_type !== 'delete' && (
              <motion.div variants={fadeInUp} className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  placeholder="My AI Agent"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  required={formData.request_type === 'create'}
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </motion.div>
            )}

            {/* Description (for create/update) */}
            {formData.request_type !== 'delete' && (
              <motion.div variants={fadeInUp} className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what changes you want to make or what the agent should do..."
                  value={formData.description}
                  onChange={(e) =>
                    updateFormData('description', e.target.value)
                  }
                  required={formData.request_type === 'create'}
                  rows={6}
                  className="min-h-[80px] transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </motion.div>
            )}

            {/* Priority */}
            <motion.div variants={fadeInUp} className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(
                  value: 'low' | 'normal' | 'high' | 'urgent'
                ) => updateFormData('priority', value)}
              >
                <SelectTrigger
                  id="priority"
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>
          </CardContent>
          <CardFooter className="flex justify-between pt-6 pb-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex items-center gap-1 transition-all duration-300 rounded-2xl"
              >
                <ArrowLeft className="h-4 w-4" /> Cancel
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="submit"
                disabled={!isFormValid() || loading}
                className={cn(
                  'flex items-center gap-1 transition-all duration-300 rounded-2xl'
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </motion.div>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  )
}

