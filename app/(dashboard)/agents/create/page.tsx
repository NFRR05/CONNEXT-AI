'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AgentSetupModal } from '@/components/agent-setup-modal'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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

interface WorkflowConfig {
  // Data validation
  validatePhone: boolean
  validateEmail: boolean
  minCallDuration: number | null
  filterTestCalls: boolean
  
  // Error handling
  retryOnFailure: boolean
  maxRetries: number
  errorNotifications: {
    enabled: boolean
    email: string | null
  }
  
  // Data transformation
  formatPhoneNumbers: boolean
  extractStructuredData: boolean
  
  // Conditional routing
  routeBySentiment: boolean
  sentimentThreshold: 'positive' | 'negative' | 'all'
  routeByDuration: boolean
  durationThreshold: number | null
  
  // Business hours
  routeByBusinessHours: boolean
  timezone: string | null
  businessHours: {
    start: string
    end: string
    days: number[]
  } | null
}

interface FormData {
  businessType: string[]
  agentPurpose: string[]
  informationToCollect: string[]
  tone: string[]
  additionalInfo: string
  businessName: string
  agentName: string
  voice_id: string | null
  workflowConfig: WorkflowConfig
}

const BUSINESS_TYPES = [
  'Restaurant',
  'Dental Clinic',
  'Medical Practice',
  'Law Firm',
  'Real Estate',
  'Fitness/Gym',
  'Beauty Salon',
  'Auto Repair',
  'Home Services',
  'Retail Store',
  'Other'
]

const AGENT_PURPOSES = [
  'Book Appointments',
  'Answer Questions',
  'Collect Customer Information',
  'Provide Quotes/Estimates',
  'Handle Complaints',
  'Process Orders',
  'Schedule Services',
  'Qualify Leads'
]

const INFORMATION_TO_COLLECT = [
  'Name',
  'Phone Number',
  'Email Address',
  'Preferred Date/Time',
  'Service Type',
  'Location/Address',
  'Budget/Price Range',
  'Special Requirements',
  'Insurance Information',
  'Referral Source'
]

const TONES = [
  'Professional & Formal',
  'Friendly & Casual',
  'Warm & Welcoming',
  'Efficient & Direct',
  'Empathetic & Caring',
  'Enthusiastic & Energetic'
]

const VOICE_OPTIONS = [
  { id: '', label: 'Default (Auto-select)', description: 'System will choose best voice' },
  { id: 'alloy', label: 'Alloy', description: 'Neutral, balanced voice' },
  { id: 'echo', label: 'Echo', description: 'Male, middle-aged, confident' },
  { id: 'fable', label: 'Fable', description: 'Male, professional, articulate' },
  { id: 'onyx', label: 'Onyx', description: 'Deep male voice, authoritative' },
  { id: 'nova', label: 'Nova', description: 'Young female, friendly and energetic' },
  { id: 'shimmer', label: 'Shimmer', description: 'Warm female voice, caring and empathetic' },
]

export default function CreateAgentPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [setupModalOpen, setSetupModalOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [phoneNumbers, setPhoneNumbers] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    businessType: [],
    agentPurpose: [],
    informationToCollect: [],
    tone: [],
    additionalInfo: '',
    businessName: '',
    agentName: '',
    voice_id: null,
    workflowConfig: {
      validatePhone: true,
      validateEmail: false,
      minCallDuration: null,
      filterTestCalls: true,
      retryOnFailure: true,
      maxRetries: 3,
      errorNotifications: {
        enabled: false,
        email: null
      },
      formatPhoneNumbers: true,
      extractStructuredData: true,
      routeBySentiment: false,
      sentimentThreshold: 'all',
      routeByDuration: false,
      durationThreshold: null,
      routeByBusinessHours: false,
      timezone: null,
      businessHours: null
    }
  })

  const totalSteps = 6

  function updateFormData(field: keyof FormData, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  function toggleArrayField(field: 'businessType' | 'agentPurpose' | 'informationToCollect' | 'tone', value: string) {
    setFormData(prev => {
      const current = prev[field]
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value]
      return { ...prev, [field]: updated }
    })
  }

  function canProceedToNextStep(): boolean {
    switch (step) {
      case 1:
        return formData.businessType.length > 0
      case 2:
        return formData.agentPurpose.length > 0
      case 3:
        return formData.informationToCollect.length > 0
      case 4:
        return formData.tone.length > 0
      case 5:
        return true // Additional info is optional
      case 6:
        return true // Workflow config is optional (has defaults)
      default:
        return false
    }
  }

  function updateWorkflowConfig(field: keyof WorkflowConfig, value: any) {
    setFormData(prev => ({
      ...prev,
      workflowConfig: {
        ...prev.workflowConfig,
        [field]: value
      }
    }))
  }

  function updateErrorNotifications(field: keyof WorkflowConfig['errorNotifications'], value: any) {
    setFormData(prev => ({
      ...prev,
      workflowConfig: {
        ...prev.workflowConfig,
        errorNotifications: {
          ...prev.workflowConfig.errorNotifications,
          [field]: value
        }
      }
    }))
  }

  function generateDescription(): string {
    const parts: string[] = []

    // Business context
    if (formData.businessName) {
      parts.push(`Business: ${formData.businessName}`)
    }
    if (formData.businessType.length > 0) {
      parts.push(`Business Type: ${formData.businessType.join(', ')}`)
    }

    // Purpose
    if (formData.agentPurpose.length > 0) {
      parts.push(`The agent should: ${formData.agentPurpose.join(', ').toLowerCase()}`)
    }

    // Information to collect
    if (formData.informationToCollect.length > 0) {
      parts.push(`The agent must collect the following information: ${formData.informationToCollect.join(', ').toLowerCase()}`)
    }

    // Tone
    if (formData.tone.length > 0) {
      parts.push(`Tone and personality: ${formData.tone.join(', ').toLowerCase()}`)
    }

    // Additional info
    if (formData.additionalInfo.trim()) {
      parts.push(`Additional requirements: ${formData.additionalInfo}`)
    }

    return parts.join('. ') + '.'
  }

  async function handleCreateAgent() {
    setCreating(true)
    setError(null)
    setSuccess(null)

    const description = generateDescription()

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          name: formData.agentName || undefined,
          formData: {
            businessType: formData.businessType,
            agentPurpose: formData.agentPurpose,
            informationToCollect: formData.informationToCollect,
            tone: formData.tone,
            additionalInfo: formData.additionalInfo,
            businessName: formData.businessName,
          },
          workflowConfig: formData.workflowConfig,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create agent')
      }

      setSuccess('Agent created successfully!')
      
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

  function handlePhoneNumberProvisioned(agentId: string, phoneNumber: string) {
    setPhoneNumbers((prev) => ({ ...prev, [agentId]: phoneNumber }))
  }

  function handleModalClose() {
    setSetupModalOpen(false)
    // Redirect based on user role
    const redirectToAgents = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          const userRole = profile?.role || 'client'
          const agentsPath = (userRole === 'admin' || userRole === 'support') 
            ? '/admin/agents' 
            : '/client/agents'
          router.push(agentsPath)
        } else {
          router.push('/client/agents')
        }
      } catch (error) {
        router.push('/client/agents')
      }
    }
    redirectToAgents()
  }

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">What type of business do you have?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select all that apply (you can select multiple)
              </p>
            </div>
            <div className="space-y-2">
              {BUSINESS_TYPES.map((type) => (
                <label
                  key={type}
                  className={cn(
                    'flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all',
                    formData.businessType.includes(type)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={formData.businessType.includes(type)}
                    onChange={() => toggleArrayField('businessType', type)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">{type}</span>
                </label>
              ))}
            </div>
            {formData.businessType.includes('Other') && (
              <div className="mt-4">
                <Label htmlFor="businessName" className="text-sm">
                  Please specify your business type
                </Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => updateFormData('businessName', e.target.value)}
                  placeholder="e.g., Yoga Studio, Pet Grooming"
                  className="mt-2"
                />
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">What should your agent do?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select all the tasks your agent should handle
              </p>
            </div>
            <div className="space-y-2">
              {AGENT_PURPOSES.map((purpose) => (
                <label
                  key={purpose}
                  className={cn(
                    'flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all',
                    formData.agentPurpose.includes(purpose)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={formData.agentPurpose.includes(purpose)}
                    onChange={() => toggleArrayField('agentPurpose', purpose)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">{purpose}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">What information should your agent collect?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select all the information you need from customers
              </p>
            </div>
            <div className="space-y-2">
              {INFORMATION_TO_COLLECT.map((info) => (
                <label
                  key={info}
                  className={cn(
                    'flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all',
                    formData.informationToCollect.includes(info)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={formData.informationToCollect.includes(info)}
                    onChange={() => toggleArrayField('informationToCollect', info)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">{info}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">How should your agent sound?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select the tone, personality, and voice that matches your brand
              </p>
            </div>
            
            {/* Tone Selection */}
            <div>
              <h4 className="text-sm font-medium mb-3">Tone & Personality</h4>
              <div className="space-y-2">
                {TONES.map((tone) => (
                  <label
                    key={tone}
                    className={cn(
                      'flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all',
                      formData.tone.includes(tone)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={formData.tone.includes(tone)}
                      onChange={() => toggleArrayField('tone', tone)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium">{tone}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Voice Selection */}
            <div>
              <h4 className="text-sm font-medium mb-3">Voice Character</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Choose a specific voice for your agent. Each voice has a different age, gender, and personality.
              </p>
              <Select
                value={formData.voice_id || ''}
                onValueChange={(value) => updateFormData('voice_id', value === '' ? null : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a voice (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_OPTIONS.map((voice) => (
                    <SelectItem key={voice.id || 'default'} value={voice.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{voice.label}</span>
                        <span className="text-xs text-muted-foreground">{voice.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                💡 <strong>Tip:</strong> A plumber might want &quot;Echo&quot; (middle-aged man), while a restaurant might prefer &quot;Nova&quot; (young, friendly). Leave as default to let the system choose.
              </p>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Final Details</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add any additional information or specific requirements
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="agentName" className="text-sm">
                  Agent Name (Optional)
                </Label>
                <Input
                  id="agentName"
                  value={formData.agentName}
                  onChange={(e) => updateFormData('agentName', e.target.value)}
                  placeholder="e.g., Restaurant Booking Assistant"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  A friendly name for your agent. We&apos;ll generate one if you leave this blank.
                </p>
              </div>
              <div>
                <Label htmlFor="additionalInfo" className="text-sm">
                  Additional Information (Optional)
                </Label>
                <textarea
                  id="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={(e) => updateFormData('additionalInfo', e.target.value)}
                  placeholder="e.g., Only accept bookings during business hours (9 AM - 6 PM), Ask about dietary restrictions for restaurants, etc."
                  rows={4}
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add any specific rules, requirements, or special instructions for your agent.
                </p>
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Workflow Configuration</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Customize how your workflow processes and routes leads (optional - defaults are recommended)
              </p>
            </div>

            {/* Data Validation */}
            <div className="space-y-3 border-b pb-4">
              <h4 className="font-medium text-sm">Data Validation</h4>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.workflowConfig.validatePhone}
                  onChange={(e) => updateWorkflowConfig('validatePhone', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Validate phone numbers before processing</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.workflowConfig.validateEmail}
                  onChange={(e) => updateWorkflowConfig('validateEmail', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Validate email addresses (if collected)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.workflowConfig.filterTestCalls}
                  onChange={(e) => updateWorkflowConfig('filterTestCalls', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Filter out test calls (very short duration)</span>
              </label>
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.workflowConfig.minCallDuration !== null}
                    onChange={(e) => updateWorkflowConfig('minCallDuration', e.target.checked ? 30 : null)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Minimum call duration (seconds):</span>
                </label>
                {formData.workflowConfig.minCallDuration !== null && (
                  <Input
                    type="number"
                    value={formData.workflowConfig.minCallDuration || 30}
                    onChange={(e) => updateWorkflowConfig('minCallDuration', parseInt(e.target.value) || 30)}
                    min={1}
                    className="w-20"
                  />
                )}
              </div>
            </div>

            {/* Error Handling */}
            <div className="space-y-3 border-b pb-4">
              <h4 className="font-medium text-sm">Error Handling</h4>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.workflowConfig.retryOnFailure}
                  onChange={(e) => updateWorkflowConfig('retryOnFailure', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Retry failed requests automatically</span>
              </label>
              {formData.workflowConfig.retryOnFailure && (
                <div className="ml-6 flex items-center space-x-2">
                  <Label htmlFor="maxRetries" className="text-sm">Max retries:</Label>
                  <Input
                    id="maxRetries"
                    type="number"
                    value={formData.workflowConfig.maxRetries}
                    onChange={(e) => updateWorkflowConfig('maxRetries', parseInt(e.target.value) || 3)}
                    min={1}
                    max={10}
                    className="w-20"
                  />
                </div>
              )}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.workflowConfig.errorNotifications.enabled}
                  onChange={(e) => updateErrorNotifications('enabled', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Send error notifications via email</span>
              </label>
              {formData.workflowConfig.errorNotifications.enabled && (
                <div className="ml-6">
                  <Input
                    type="email"
                    placeholder="your-email@example.com"
                    value={formData.workflowConfig.errorNotifications.email || ''}
                    onChange={(e) => updateErrorNotifications('email', e.target.value)}
                    className="mt-2"
                  />
                </div>
              )}
            </div>

            {/* Data Transformation */}
            <div className="space-y-3 border-b pb-4">
              <h4 className="font-medium text-sm">Data Transformation</h4>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.workflowConfig.formatPhoneNumbers}
                  onChange={(e) => updateWorkflowConfig('formatPhoneNumbers', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Format phone numbers to international format</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.workflowConfig.extractStructuredData}
                  onChange={(e) => updateWorkflowConfig('extractStructuredData', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Extract structured data from transcripts (names, dates, etc.)</span>
              </label>
            </div>

            {/* Conditional Routing */}
            <div className="space-y-3 border-b pb-4">
              <h4 className="font-medium text-sm">Smart Routing</h4>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.workflowConfig.routeBySentiment}
                  onChange={(e) => updateWorkflowConfig('routeBySentiment', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Route leads by sentiment (positive/negative)</span>
              </label>
              {formData.workflowConfig.routeBySentiment && (
                <div className="ml-6">
                  <select
                    value={formData.workflowConfig.sentimentThreshold}
                    onChange={(e) => updateWorkflowConfig('sentimentThreshold', e.target.value as any)}
                    className="mt-2 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">All sentiments</option>
                    <option value="positive">Only positive</option>
                    <option value="negative">Only negative (for priority handling)</option>
                  </select>
                </div>
              )}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.workflowConfig.routeByDuration}
                  onChange={(e) => updateWorkflowConfig('routeByDuration', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Route by call duration (longer calls = higher priority)</span>
              </label>
              {formData.workflowConfig.routeByDuration && (
                <div className="ml-6 flex items-center space-x-2">
                  <Label htmlFor="durationThreshold" className="text-sm">Duration threshold (seconds):</Label>
                  <Input
                    id="durationThreshold"
                    type="number"
                    value={formData.workflowConfig.durationThreshold || 120}
                    onChange={(e) => updateWorkflowConfig('durationThreshold', parseInt(e.target.value) || 120)}
                    min={1}
                    className="w-24"
                  />
                </div>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
              <p className="text-xs text-blue-900 dark:text-blue-200">
                💡 <strong>Tip:</strong> These settings will create a sophisticated n8n workflow with validation, error handling, and smart routing. You can always modify the workflow later in n8n.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const [agentsPath, setAgentsPath] = useState('/client/agents')

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          const userRole = profile?.role || 'client'
          const path = (userRole === 'admin' || userRole === 'support') 
            ? '/admin/agents' 
            : '/client/agents'
          setAgentsPath(path)
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
      }
    }
    fetchUserRole()
  }, [])

  return (
    <div className="container mx-auto py-4 sm:py-6 md:py-10 px-4 sm:px-6 max-w-3xl">
      <div className="mb-4 sm:mb-6">
        <Link href={agentsPath}>
          <Button variant="ghost" className="mb-3 sm:mb-4 -ml-2 sm:ml-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back to Agents</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Create New Agent</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Let&apos;s guide you through creating the perfect agent for your business
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm text-muted-foreground">
            Step {step} of {totalSteps}
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground">
            {Math.round((step / totalSteps) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">
            {step === 1 && 'Business Type'}
            {step === 2 && 'Agent Purpose'}
            {step === 3 && 'Information Collection'}
            {step === 4 && 'Tone & Personality'}
            {step === 5 && 'Final Details'}
            {step === 6 && 'Workflow Configuration'}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-xs sm:text-sm text-destructive break-words mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-500/15 p-3 text-xs sm:text-sm text-green-600 dark:text-green-400 break-words mb-4">
              {success}
            </div>
          )}

          {renderStep()}

          <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1 sm:flex-initial sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
            <div className="flex-1" />
            {step < totalSteps ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canProceedToNextStep()}
                className="flex-1 sm:flex-initial sm:w-auto"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleCreateAgent}
                disabled={creating || !canProceedToNextStep()}
                className="flex-1 sm:flex-initial sm:w-auto"
              >
                {creating ? (
                  <>
                    <span className="hidden sm:inline">Creating Agent...</span>
                    <span className="sm:hidden">Creating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Create Agent
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Modal */}
      {selectedAgent && (
        <AgentSetupModal
          open={setupModalOpen}
          onOpenChange={(open) => {
            setSetupModalOpen(open)
            if (!open) {
              handleModalClose()
            }
          }}
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
