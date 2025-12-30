import { Navbar } from '@/components/navbar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Check user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role || 'client'

  // Redirect admins to admin portal (but allow viewing)
  // You can remove this if you want admins to access both portals
  // if (userRole === 'admin' || userRole === 'support') {
  //   redirect('/admin/dashboard')
  // }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        {children}
      </div>
    </>
  )
}

