'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface WorkflowConfig {
  validatePhone: boolean
  validateEmail: boolean
  minCallDuration: number | null
  filterTestCalls: boolean
  retryOnFailure: boolean
  maxRetries: number
  errorNotifications: {
    enabled: boolean
    email: string | null
  }
  formatPhoneNumbers: boolean
  extractStructuredData: boolean
  routeBySentiment: boolean
  sentimentThreshold: 'positive' | 'negative' | 'all'
  routeByDuration: boolean
  durationThreshold: number | null
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

export default function CreateRequestPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [requestType, setRequestType] = useState<'create' | 'update' | 'delete'>('create')
  const [step, setStep] = useState(1)
  
  // For create requests - multi-step form
  const [formData, setFormData] = useState<FormData>({
    businessType: [],
    agentPurpose: [],
    informationToCollect: [],
    tone: [],
    additionalInfo: '',
    businessName: '',
    agentName: '',
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

  // For update/delete requests - simple form
  const [simpleFormData, setSimpleFormData] = useState({
    agent_id: '',
    name: '',
    description: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
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
        return true
      case 6:
        return true
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

    if (formData.businessName) {
      parts.push(`Business: ${formData.businessName}`)
    }
    if (formData.businessType.length > 0) {
      parts.push(`Business Type: ${formData.businessType.join(', ')}`)
    }
    if (formData.agentPurpose.length > 0) {
      parts.push(`The agent should: ${formData.agentPurpose.join(', ').toLowerCase()}`)
    }
    if (formData.informationToCollect.length > 0) {
      parts.push(`The agent must collect the following information: ${formData.informationToCollect.join(', ').toLowerCase()}`)
    }
    if (formData.tone.length > 0) {
      parts.push(`Tone and personality: ${formData.tone.join(', ').toLowerCase()}`)
    }
    if (formData.additionalInfo.trim()) {
      parts.push(`Additional requirements: ${formData.additionalInfo}`)
    }

    return parts.join('. ') + '.'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let requestBody: any

      if (requestType === 'create') {
        // Multi-step form data
        const description = generateDescription()
        requestBody = {
          request_type: 'create',
          name: formData.agentName || null,
          description: description,
          priority: 'normal',
          form_data: {
            businessType: formData.businessType,
            agentPurpose: formData.agentPurpose,
            informationToCollect: formData.informationToCollect,
            tone: formData.tone,
            additionalInfo: formData.additionalInfo,
            businessName: formData.businessName,
            agentName: formData.agentName,
          },
          workflow_config: formData.workflowConfig,
        }
      } else {
        // Simple form for update/delete
        requestBody = {
          request_type: requestType,
          name: simpleFormData.name || null,
          description: simpleFormData.description || null,
          priority: simpleFormData.priority,
          agent_id: simpleFormData.agent_id || null,
        }
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
    } finally {
      setLoading(false)
    }
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
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">How should your agent sound?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select the tone and personality that matches your brand
              </p>
            </div>
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
                <Textarea
                  id="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={(e) => updateFormData('additionalInfo', e.target.value)}
                  placeholder="e.g., Only accept bookings during business hours (9 AM - 6 PM), Ask about dietary restrictions for restaurants, etc."
                  rows={4}
                  className="mt-2"
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
                <span className="text-sm">Extract structured data from transcripts</span>
              </label>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
              <p className="text-xs text-blue-900 dark:text-blue-200">
                💡 <strong>Tip:</strong> These settings will create a sophisticated n8n workflow. You can always modify the workflow later in n8n.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/client/requests" className="flex items-center text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Requests
      </Link>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Create Agent Request</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {requestType === 'create' 
            ? "Let's guide you through creating the perfect agent for your business"
            : `Submit a request to ${requestType} an agent. Your request will be reviewed by an admin.`}
        </p>
      </div>

      {/* Request Type Selector */}
      <Card>
        <CardContent className="pt-6">
          <div>
            <Label htmlFor="request_type" className="mb-2 block">Request Type</Label>
            <Select
              value={requestType}
              onValueChange={(value: 'create' | 'update' | 'delete') => {
                setRequestType(value)
                if (value === 'create') {
                  setStep(1)
                }
              }}
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
            <p className="text-xs text-muted-foreground mt-2">
              {requestType === 'create' && 'Complete the 6-step form to create a new agent with detailed configuration.'}
              {requestType === 'update' && 'Provide details about what you want to change in your existing agent.'}
              {requestType === 'delete' && 'Request to permanently delete an agent and all associated data.'}
            </p>
          </div>
        </CardContent>
      </Card>

  {/* If request type is not create, show simple form */}
  {requestType !== 'create' ? (
    <Card>
      <CardHeader>
        <CardTitle>Request Details</CardTitle>
        <CardDescription>
          Fill in the information for your {requestType} request
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">

              {requestType !== 'delete' && (
                <>
                  <div>
                    <Label htmlFor="name">Agent Name</Label>
                    <Input
                      id="name"
                      value={simpleFormData.name}
                      onChange={(e) => setSimpleFormData({ ...simpleFormData, name: e.target.value })}
                      placeholder="My AI Agent"
                      required={requestType === 'update'}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={simpleFormData.description}
                      onChange={(e) => setSimpleFormData({ ...simpleFormData, description: e.target.value })}
                      placeholder="Describe what changes you want to make..."
                      rows={6}
                      required={requestType === 'update'}
                    />
                  </div>
                </>
              )}

              {(requestType === 'update' || requestType === 'delete') && (
                <div>
                  <Label htmlFor="agent_id">Agent ID</Label>
                  <Input
                    id="agent_id"
                    value={simpleFormData.agent_id}
                    onChange={(e) => setSimpleFormData({ ...simpleFormData, agent_id: e.target.value })}
                    placeholder="Enter agent ID"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    You can find the agent ID on your agents page.
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={simpleFormData.priority}
                  onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') =>
                    setSimpleFormData({ ...simpleFormData, priority: value })
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
  ) : (
    <>
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
          <form onSubmit={handleSubmit}>
            {renderStep()}

            <div className="flex justify-between gap-3 mt-8 pt-6 border-t">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 sm:flex-initial"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              ) : null}
              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceedToNextStep()}
                  className={step > 1 ? "flex-1 sm:flex-initial" : "flex-1"}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading || !canProceedToNextStep()}
                  className={step > 1 ? "flex-1 sm:flex-initial" : "flex-1"}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )}
    </div>
  )
}
