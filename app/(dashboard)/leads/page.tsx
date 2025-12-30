'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LeadsPage() {
  const router = useRouter()

  const redirectToPortal = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const userRole = profile?.role || 'client'
      
      if (userRole === 'admin' || userRole === 'support') {
        router.push('/admin/dashboard')
      } else {
        router.push('/client/leads')
      }
    } catch (error) {
      console.error('Error redirecting:', error)
      router.push('/client/leads')
    }
  }, [router])

  useEffect(() => {
    redirectToPortal()
  }, [redirectToPortal])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting...</p>
    </div>
  )
}
