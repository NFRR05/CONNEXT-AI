import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  let next = requestUrl.searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
    
    // If no next parameter, determine dashboard based on user role
    if (!next) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        const userRole = profile?.role || 'client'
        next = (userRole === 'admin' || userRole === 'support') 
          ? '/admin/dashboard' 
          : '/client/dashboard'
      } else {
        next = '/client/dashboard'
      }
    }
  } else {
    next = next || '/client/dashboard'
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}

