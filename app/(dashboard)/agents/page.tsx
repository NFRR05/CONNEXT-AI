'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card'
import { Loader2 } from 'lucide-react'

export default function AgentsPage() {
  const router = useRouter()

  useEffect(() => {
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
    redirectToPortal()
  }, [router])

  return (
    <div className="flex items-center justify-center h-full w-full">
      <GlassCard className="w-auto">
        <GlassCardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Redirecting...</p>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}
