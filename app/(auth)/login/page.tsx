'use client'

import { useState, Suspense } from 'react'
import { signInWithEmail } from '@/app/actions/auth'
import { MultiStepForm, Step } from '@/components/ui/multistep-form'
import { InfiniteGrid } from '@/components/ui/infinite-grid-integration'
import Link from 'next/link'

const loginSteps: Step[] = [
  { id: 1, label: "Email", field: "email", placeholder: "you@example.com", type: "email" },
  { id: 2, label: "Password", field: "password", placeholder: "Enter your password", type: "password" },
]

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: Record<string, string>) {
    setLoading(true)
    setError(null)

    // Convert formData to FormData for the auth function
    const formDataObj = new FormData()
    formDataObj.append('email', formData.email)
    formDataObj.append('password', formData.password)

    const result = await signInWithEmail(formDataObj)

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
          <h1 className="text-3xl font-bold tracking-tight mb-2">CONNEXT AI</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <div className="w-full flex justify-center">
          <MultiStepForm
            steps={loginSteps}
            onSubmit={handleSubmit}
            submitLabel="Sign In"
            loading={loading}
            error={error}
            successMessage="Signed in successfully!"
          />
        </div>

        <div className="mt-6 text-center text-sm w-full">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center relative">
        <InfiniteGrid />
        <div className="w-full max-w-md mx-auto relative z-10 flex flex-col items-center">
          <div className="mb-8 text-center w-full">
            <h1 className="text-3xl font-bold tracking-tight mb-2">CONNEXT AI</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
