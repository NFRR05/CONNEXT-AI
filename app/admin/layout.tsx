import { AppSidebar } from '@/components/sidebar'
import { InfiniteGrid } from '@/components/ui/infinite-grid-integration'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check user role - only admins/support can access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role || 'client'

  if (userRole !== 'admin' && userRole !== 'support') {
    redirect('/client/dashboard')
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex relative">
      <InfiniteGrid />
      <AppSidebar initialRole={userRole as 'client' | 'admin' | 'support'} />
      <main className="flex-1 ml-0 md:ml-[80px] lg:ml-[80px] min-h-screen transition-all duration-300 ease-in-out p-4 sm:p-6 lg:p-8 relative z-10">
        {children}
      </main>
    </div>
  )
}
