'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { AgentSetupModal } from '@/components/agent-setup-modal'
import { Phone, Plus } from 'lucide-react'

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
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
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
    } finally {
      setLoading(false)
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
    <div className="container mx-auto py-4 sm:py-6 md:py-10 px-4 sm:px-6 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Your Agents</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Manage your voice AI agents
          </p>
        </div>
        <Link href="/agents/create" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </Link>
      </div>

      {/* Agents List */}
      <div>
        {loading ? (
          <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm sm:text-base">
            Loading agents...
          </div>
        ) : agents.length === 0 ? (
          <Card>
            <CardContent className="py-8 sm:py-12 px-4 sm:px-6 text-center">
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm sm:text-base">
                  No agents yet. Create your first agent to get started!
                </p>
                <Link href="/agents/create" className="inline-block">
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Create Your First Agent</span>
                    <span className="sm:hidden">Create Agent</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Card key={agent.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg line-clamp-2">{agent.name}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Created {format(new Date(agent.created_at), 'MMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 flex-1 flex flex-col">
                  {phoneNumbers[agent.id] && (
                    <div className="p-2 sm:p-3 bg-primary/10 border border-primary/20 rounded-md">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium">Phone Number</span>
                      </div>
                      <p className="text-base sm:text-lg font-bold break-all">{phoneNumbers[agent.id]}</p>
                    </div>
                  )}
                  {agent.voice_id && (
                    <div className="text-xs sm:text-sm">
                      <span className="font-medium">Voice:</span>{' '}
                      <span className="break-words">{agent.voice_id}</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 mt-auto pt-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setSelectedAgent(agent)
                        setSetupModalOpen(true)
                      }}
                      className="w-full text-xs sm:text-sm"
                    >
                      Setup Guide
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadBlueprint(agent.id, agent.name)}
                      className="w-full text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Download n8n Blueprint</span>
                      <span className="sm:hidden">Download Blueprint</span>
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
