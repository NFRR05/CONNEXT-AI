'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AgentsPage() {
  const router = useRouter()

  useEffect(() => {
    redirectToPortal()
  }, [])

  const redirectToPortal = async () => {
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
        router.push('/admin/agents')
      } else {
        router.push('/client/agents')
      }
    } catch (error) {
      console.error('Error redirecting:', error)
      router.push('/client/agents')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting...</p>
    </div>
  )
}
