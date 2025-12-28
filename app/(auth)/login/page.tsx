'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { signInWithEmail, signInWithMagicLink } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

function LoginForm() {
  const [mode, setMode] = useState<'email' | 'magic'>('email')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const msg = searchParams.get('message')
    if (msg) {
      setMessage(msg)
    }
  }, [searchParams])

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const result = await signInWithEmail(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  async function handleMagicLinkSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const result = await signInWithMagicLink(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.success) {
      setMessage(result.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">CONNEXT AI</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'email' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => {
                setMode('email')
                setError(null)
                setMessage(null)
              }}
            >
              Email/Password
            </Button>
            <Button
              type="button"
              variant={mode === 'magic' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => {
                setMode('magic')
                setError(null)
                setMessage(null)
              }}
            >
              Magic Link
            </Button>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400">
              {message}
            </div>
          )}

          {mode === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="magic-email">Email</Label>
                <Input
                  id="magic-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Magic Link'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                We'll send you a link to sign in without a password
              </p>
            </form>
          )}

          <Separator />

          <div className="text-center text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">CONNEXT AI</CardTitle>
            <CardDescription className="text-center">Loading...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
