'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Circle, Phone, Download, Settings, TestTube } from 'lucide-react'

interface AgentSetupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agentId: string
  agentName: string
  phoneNumber: string | null
  onPhoneNumberProvisioned: (phoneNumber: string) => void
}

export function AgentSetupModal({
  open,
  onOpenChange,
  agentId,
  agentName,
  phoneNumber,
  onPhoneNumberProvisioned,
}: AgentSetupModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [provisioningPhone, setProvisioningPhone] = useState(false)
  const [blueprintDownloaded, setBlueprintDownloaded] = useState(false)

  const steps = [
    {
      id: 1,
      title: 'Get Phone Number',
      description: 'Provision a phone number for your agent',
      icon: Phone,
      completed: !!phoneNumber,
    },
    {
      id: 2,
      title: 'Set Up n8n',
      description: 'Download and install n8n (or use n8n Cloud)',
      icon: Settings,
      completed: false,
    },
    {
      id: 3,
      title: 'Import Blueprint',
      description: 'Import the downloaded blueprint into n8n',
      icon: Download,
      completed: blueprintDownloaded,
    },
    {
      id: 4,
      title: 'Test Your Agent',
      description: 'Call your phone number to test the agent',
      icon: TestTube,
      completed: false,
    },
  ]

  async function handleProvisionPhone() {
    setProvisioningPhone(true)
    try {
      const response = await fetch(`/api/agents/${agentId}/phone-number`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to provision phone number')
      }

      const data = await response.json()
      if (data.phoneNumber) {
        onPhoneNumberProvisioned(data.phoneNumber)
        setCurrentStep(2)
      }
    } catch (error) {
      console.error('Error provisioning phone:', error)
      alert(error instanceof Error ? error.message : 'Failed to provision phone number')
    } finally {
      setProvisioningPhone(false)
    }
  }

  function handleDownloadBlueprint() {
    const link = document.createElement('a')
    link.href = `/api/agents/${agentId}/blueprint`
    link.download = `connext-ai-${agentName.replace(/\s+/g, '-').toLowerCase()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setBlueprintDownloaded(true)
    setCurrentStep(4)
  }

  const completedSteps = steps.filter((step) => step.completed).length
  const progress = (completedSteps / steps.length) * 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Setup Guide: {agentName}</DialogTitle>
          <DialogDescription>
            Follow these steps to get your agent up and running
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{completedSteps} of {steps.length} steps completed</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 mt-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = step.completed

            return (
              <Card
                key={step.id}
                className={isActive ? 'border-primary' : ''}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        Step {step.id}: {step.title}
                      </CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {step.id === 1 && (
                    <div className="space-y-4">
                      {phoneNumber ? (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md">
                          <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                            Phone Number Assigned
                          </p>
                          <p className="text-2xl font-bold">{phoneNumber}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Customers can call this number to reach your agent
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Click the button below to automatically provision a phone number from Vapi.
                            This number will be used for your voice AI agent.
                          </p>
                          <Button
                            onClick={handleProvisionPhone}
                            disabled={provisioningPhone}
                            className="w-full"
                          >
                            {provisioningPhone ? 'Provisioning...' : 'Get Phone Number'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {step.id === 2 && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        n8n is a workflow automation tool that will process calls from your agent.
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Option 1: n8n Desktop (Free)</p>
                        <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1 ml-2">
                          <li>Download n8n Desktop from <a href="https://n8n.io/download/" target="_blank" rel="noopener noreferrer" className="text-primary underline">n8n.io/download</a></li>
                          <li>Install and open n8n Desktop</li>
                          <li>Continue to Step 3</li>
                        </ol>
                        <p className="text-sm font-medium mt-4">Option 2: n8n Cloud (Paid)</p>
                        <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1 ml-2">
                          <li>Sign up at <a href="https://n8n.io/cloud/" target="_blank" rel="noopener noreferrer" className="text-primary underline">n8n.io/cloud</a></li>
                          <li>Create a new workflow</li>
                          <li>Continue to Step 3</li>
                        </ol>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(3)}
                        className="w-full"
                      >
                        I&apos;ve Set Up n8n
                      </Button>
                    </div>
                  )}

                  {step.id === 3 && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Import the blueprint file into your n8n instance. The blueprint is pre-configured
                        to send call data to your CONNEXT AI dashboard.
                      </p>
                      <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1 ml-2">
                        <li>In n8n, click the menu (☰) in the top left</li>
                        <li>Select &quot;Import from File&quot;</li>
                        <li>Choose the downloaded JSON file</li>
                        <li>The workflow will be imported automatically</li>
                      </ol>
                      <Button
                        onClick={handleDownloadBlueprint}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download n8n Blueprint
                      </Button>
                      {blueprintDownloaded && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          ✓ Blueprint downloaded! Now import it into n8n.
                        </p>
                      )}
                    </div>
                  )}

                  {step.id === 4 && (
                    <div className="space-y-3">
                      {phoneNumber ? (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Your agent is ready! Call the number below to test it.
                          </p>
                          <div className="p-4 bg-primary/10 border border-primary/20 rounded-md text-center">
                            <p className="text-sm text-muted-foreground mb-1">Call this number:</p>
                            <p className="text-2xl font-bold">{phoneNumber}</p>
                          </div>
                          <div className="p-4 bg-muted rounded-md">
                            <p className="text-sm font-medium mb-2">What happens next:</p>
                            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                              <li>When someone calls, your agent answers</li>
                              <li>The call is processed by n8n</li>
                              <li>Call data appears in your Leads dashboard</li>
                            </ul>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Please complete Step 1 (Get Phone Number) first.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {completedSteps === steps.length && (
            <Button onClick={() => onOpenChange(false)}>
              Got it!
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

