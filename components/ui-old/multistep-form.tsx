"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { CheckIcon, ArrowRightIcon } from "lucide-react"

export type Step = {
  id: number
  label: string
  field: string
  placeholder: string
  type?: string
  fields?: Array<{ field: string; label: string; placeholder: string; type?: string }>
}

type MultiStepFormProps = {
  steps: Step[]
  onSubmit: (formData: Record<string, string>) => Promise<void> | void
  submitLabel?: string
  loading?: boolean
  error?: string | null
  successMessage?: string
  onComplete?: (formData: Record<string, string>) => void
}

export function MultiStepForm({
  steps,
  onSubmit,
  submitLabel = "Complete",
  loading = false,
  error = null,
  successMessage,
  onComplete
}: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isComplete, setIsComplete] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleNext = async () => {
    const currentStepData = steps[currentStep]

    // Validate current step
    if (currentStepData.fields) {
      // Multi-field step (e.g., password + confirm password)
      const allFieldsFilled = currentStepData.fields.every(
        field => formData[field.field]?.trim()
      )
      if (!allFieldsFilled) {
        setLocalError("Please fill in all fields")
        return
      }

      // Additional validation for password confirmation
      if (currentStepData.field === "password" && formData.password !== formData.confirmPassword) {
        setLocalError("Passwords do not match")
        return
      }
    } else {
      // Single field step
      if (!formData[currentStepData.field]?.trim()) {
        setLocalError("This field is required")
        return
      }
    }

    setLocalError(null)

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Last step - submit
      try {
        await onSubmit(formData)
        if (onComplete) {
          onComplete(formData)
        }
        setIsComplete(true)
      } catch (err) {
        // Error handling is done in parent component
      }
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    setLocalError(null)
  }

  const currentStepData = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  if (isComplete && successMessage) {
    return (
      <div className="w-full max-w-sm">
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-background via-background to-muted/20 p-12 backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),transparent_50%)]" />
          <div className="relative flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-700">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-foreground/10 bg-foreground/5">
              <CheckIcon
                className="h-8 w-8 text-foreground animate-in zoom-in duration-500 delay-200"
                strokeWidth={2.5}
              />
            </div>
            <div className="space-y-1 text-center">
              <h2 className="text-xl font-medium tracking-tight text-balance">You&apos;re all set</h2>
              <p className="text-sm text-muted-foreground/80">{successMessage}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-10 flex items-center justify-center gap-3">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-3">
            <button
              onClick={() => index < currentStep && setCurrentStep(index)}
              disabled={index > currentStep}
              className={cn(
                "group relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-700 ease-out",
                "disabled:cursor-not-allowed",
                index < currentStep && "bg-foreground/10 text-foreground/60",
                index === currentStep && "bg-foreground text-background shadow-[0_0_20px_-5px_rgba(0,0,0,0.3)]",
                index > currentStep && "bg-muted/50 text-muted-foreground/40",
              )}
            >
              {index < currentStep ? (
                <CheckIcon className="h-4 w-4 animate-in zoom-in duration-500" strokeWidth={2.5} />
              ) : (
                <span className="text-sm font-medium tabular-nums">{step.id}</span>
              )}
              {index === currentStep && (
                <div className="absolute inset-0 rounded-full bg-foreground/20 blur-md animate-pulse" />
              )}
            </button>
            {index < steps.length - 1 && (
              <div className="relative h-[1.5px] w-12">
                <div className="absolute inset-0 bg-[rgba(207,207,207,0.4)]" />
                <div
                  className="absolute inset-0 bg-foreground/30 transition-all duration-700 ease-out origin-left"
                  style={{
                    transform: `scaleX(${index < currentStep ? 1 : 0})`,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mb-8 overflow-hidden rounded-full bg-muted/30 h-[2px]">
        <div
          className="h-full bg-gradient-to-r from-foreground/60 to-foreground transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-8">
        {(error || localError) && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive animate-in fade-in">
            {error || localError}
          </div>
        )}

        <div key={currentStepData.id} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="flex items-baseline justify-between">
            <Label htmlFor={currentStepData.fields ? currentStepData.fields[0]?.field : currentStepData.field} className="text-lg font-medium tracking-tight">
              {currentStepData.label}
            </Label>
            <span className="text-xs font-medium text-muted-foreground/60 tabular-nums">
              {currentStep + 1}/{steps.length}
            </span>
          </div>

          {currentStepData.fields ? (
            // Multi-field step
            <div className="space-y-4">
              {currentStepData.fields.map((field) => (
                <div key={field.field} className="relative group">
                  <Label htmlFor={field.field} className="text-sm text-muted-foreground mb-2 block">
                    {field.label}
                  </Label>
                  <Input
                    id={field.field}
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    value={formData[field.field] || ""}
                    onChange={(e) => handleInputChange(field.field, e.target.value)}
                    autoFocus={field === currentStepData.fields![0]}
                    className="h-14 text-base transition-all duration-500 border-border/50 focus:border-foreground/20 bg-background/50 backdrop-blur"
                    disabled={loading}
                  />
                </div>
              ))}
            </div>
          ) : (
            // Single field step
            <div className="relative group">
              <Input
                id={currentStepData.field}
                type={currentStepData.type || (currentStepData.field === "email" ? "email" : "text")}
                placeholder={currentStepData.placeholder}
                value={formData[currentStepData.field] || ""}
                onChange={(e) => handleInputChange(currentStepData.field, e.target.value)}
                autoFocus
                className="h-14 text-base transition-all duration-500 border-border/50 focus:border-foreground/20 bg-background/50 backdrop-blur"
                disabled={loading}
              />
            </div>
          )}
        </div>

        <Button
          onClick={handleNext}
          disabled={loading || (currentStepData.fields
            ? !currentStepData.fields.every(f => formData[f.field]?.trim())
            : !formData[currentStepData.field]?.trim())}
          className="w-full h-12 group relative transition-all duration-300 hover:shadow-lg hover:shadow-foreground/5"
        >
          <span className="flex items-center justify-center gap-2 font-medium">
            {loading
              ? "Processing..."
              : currentStep === steps.length - 1
                ? submitLabel
                : "Continue"}
            {!loading && (
              <ArrowRightIcon
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5 duration-300"
                strokeWidth={2}
              />
            )}
          </span>
        </Button>

        {currentStep > 0 && (
          <button
            onClick={() => {
              setCurrentStep(currentStep - 1)
              setLocalError(null)
            }}
            disabled={loading}
            className="w-full text-center text-sm text-muted-foreground/60 hover:text-foreground/80 transition-all duration-300 disabled:opacity-50"
          >
            Go back
          </button>
        )}
      </div>
    </div>
  )
}

