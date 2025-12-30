import { Navbar } from '@/components/navbar'
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
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        {children}
      </div>
    </>
  )
}

