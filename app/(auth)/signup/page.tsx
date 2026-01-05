'use client'

import { useState } from 'react'
import { signUpWithEmail } from '@/app/actions/auth'
import { MultiStepForm, Step } from '@/components/ui/multistep-form'
import { InfiniteGrid } from '@/components/ui/infinite-grid-integration'
import Link from 'next/link'

const signupSteps: Step[] = [
  { id: 1, label: "Name", field: "name", placeholder: "Your full name" },
  { id: 2, label: "Email", field: "email", placeholder: "you@example.com", type: "email" },
  { id: 3, label: "Goal", field: "goal", placeholder: "What brings you here?" },
  { 
    id: 4, 
    label: "Password", 
    field: "password",
    placeholder: "",
    fields: [
      { field: "password", label: "Password", placeholder: "Create a password", type: "password" },
      { field: "confirmPassword", label: "Confirm Password", placeholder: "Confirm your password", type: "password" }
    ]
  },
]

export default function SignUpPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: Record<string, string>) {
    setLoading(true)
    setError(null)

    const password = formData.password
    const confirmPassword = formData.confirmPassword

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // OWASP Password Policy: Minimum 12 characters, complexity requirements
    if (password.length < 12) {
      setError('Password must be at least 12 characters long')
      setLoading(false)
      return
    }
    
    // Check password complexity
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      setError('Password must contain uppercase, lowercase, numbers, and special characters')
      setLoading(false)
      return
    }

    // Convert formData to FormData for the auth function
    const formDataObj = new FormData()
    formDataObj.append('email', formData.email)
    formDataObj.append('password', password)

    const result = await signUpWithEmail(formDataObj)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      throw new Error(result.error) // Re-throw to prevent completion
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative">
      <InfiniteGrid />
      <div className="w-full max-w-md mx-auto relative z-10 flex flex-col items-center">
        <div className="mb-8 text-center w-full">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Create Account</h1>
          <p className="text-muted-foreground">Sign up for CONNEXT AI</p>
        </div>
        
        <div className="w-full flex justify-center">
          <MultiStepForm
            steps={signupSteps}
            onSubmit={handleSubmit}
            submitLabel="Create Account"
            loading={loading}
            error={error}
            successMessage="Account created successfully!"
          />
        </div>

        <div className="mt-6 text-center text-sm w-full">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
