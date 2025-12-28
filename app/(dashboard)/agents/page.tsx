'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { AgentSetupModal } from '@/components/agent-setup-modal'
import { Phone } from 'lucide-react'

interface Agent {
  id: string
  name: string
  vapi_assistant_id: string | null
  vapi_phone_number_id: string | null
  api_secret: string
  system_prompt: string | null
  voice_id: string | null
  created_at: string
  updated_at: string
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [description, setDescription] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [setupModalOpen, setSetupModalOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [phoneNumbers, setPhoneNumbers] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchAgents()
  }, [])

  async function fetchAgents() {
    try {
      const response = await fetch('/api/agents')
      if (!response.ok) throw new Error('Failed to fetch agents')
      const data = await response.json()
      setAgents(data.agents || [])
      
      // Fetch phone numbers for agents that have phone number IDs
      const phoneNumberPromises = (data.agents || [])
        .filter((agent: Agent) => agent.vapi_phone_number_id)
        .map(async (agent: Agent) => {
          try {
            const phoneResponse = await fetch(`/api/agents/${agent.id}/phone-number`)
            if (phoneResponse.ok) {
              const phoneData = await phoneResponse.json()
              return { agentId: agent.id, phoneNumber: phoneData.phoneNumber }
            }
          } catch (error) {
            console.error(`Error fetching phone number for agent ${agent.id}:`, error)
          }
          return null
        })
      
      const phoneResults = await Promise.all(phoneNumberPromises)
      const phoneMap: Record<string, string> = {}
      phoneResults.forEach((result) => {
        if (result) {
          phoneMap[result.agentId] = result.phoneNumber
        }
      })
      setPhoneNumbers(phoneMap)
    } catch (error) {
      console.error('Error fetching agents:', error)
      setError('Failed to load agents')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateAgent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          name: name || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create agent')
      }

      setSuccess('Agent created successfully!')
      setDescription('')
      setName('')
      await fetchAgents()
      
      // Open setup modal for the newly created agent
      if (data.agent) {
        setSelectedAgent(data.agent)
        setSetupModalOpen(true)
      }
    } catch (error) {
      console.error('Error creating agent:', error)
      setError(error instanceof Error ? error.message : 'Failed to create agent')
    } finally {
      setCreating(false)
    }
  }

  function handleDownloadBlueprint(agentId: string, agentName: string) {
    const link = document.createElement('a')
    link.href = `/api/agents/${agentId}/blueprint`
    link.download = `connext-ai-${agentName.replace(/\s+/g, '-').toLowerCase()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function fetchPhoneNumber(agentId: string) {
    // In a real implementation, you'd fetch the phone number from Vapi
    // For now, we'll store it when provisioned
    return phoneNumbers[agentId] || null
  }

  function handlePhoneNumberProvisioned(agentId: string, phoneNumber: string) {
    setPhoneNumbers((prev) => ({ ...prev, [agentId]: phoneNumber }))
    // Refresh agents to get updated phone number
    fetchAgents()
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your voice AI agents
          </p>
        </div>
      </div>

      {/* Create Agent Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Agent</CardTitle>
          <CardDescription>
            Describe what you need your agent to do, and we&apos;ll generate it for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAgent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name (Optional)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Dental Booking Assistant"
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="I need a booking assistant for my Dental Clinic. Ask for insurance type and preferred date."
                required
                disabled={creating}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Describe your business needs in natural language
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400">
                {success}
              </div>
            )}

            <Button type="submit" disabled={creating} className="w-full">
              {creating ? 'Creating Agent...' : 'Create Agent'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Agents List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Your Agents</h2>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading agents...</div>
        ) : agents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No agents yet. Create your first agent above!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                  <CardDescription>
                    Created {format(new Date(agent.created_at), 'MMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {phoneNumbers[agent.id] && (
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Phone Number</span>
                      </div>
                      <p className="text-lg font-bold">{phoneNumbers[agent.id]}</p>
                    </div>
                  )}
                  {agent.voice_id && (
                    <div className="text-sm">
                      <span className="font-medium">Voice:</span> {agent.voice_id}
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setSelectedAgent(agent)
                        setSetupModalOpen(true)
                      }}
                      className="w-full"
                    >
                      Setup Guide
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadBlueprint(agent.id, agent.name)}
                      className="w-full"
                    >
                      Download n8n Blueprint
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Setup Modal */}
      {selectedAgent && (
        <AgentSetupModal
          open={setupModalOpen}
          onOpenChange={setSetupModalOpen}
          agentId={selectedAgent.id}
          agentName={selectedAgent.name}
          phoneNumber={phoneNumbers[selectedAgent.id] || null}
          onPhoneNumberProvisioned={(phoneNumber) =>
            handlePhoneNumberProvisioned(selectedAgent.id, phoneNumber)
          }
        />
      )}
    </div>
  )
}
