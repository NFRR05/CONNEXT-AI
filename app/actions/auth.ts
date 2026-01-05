'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function signInWithEmail(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // Check if account is locked (using service role to bypass RLS)
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  // Get user by email first to check lock status
  const { data: authUser } = await supabase.auth.getUser()

  if (authUser?.user) {
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('account_locked_until, failed_login_attempts')
      .eq('id', authUser.user.id)
      .single()

    if (profile?.account_locked_until && new Date(profile.account_locked_until) > new Date()) {
      return {
        error: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
      }
    }
  }

  const { data: signInData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    // Increment failed login attempts if user exists
    if (signInData?.user) {
      await serviceSupabase.rpc('increment_failed_login', {
        p_user_id: (signInData.user as any).id,
      })
    }

    // Generic error message (don't reveal if email exists)
    return { error: 'Invalid email or password' }
  }

  // Reset failed login attempts on success
  if (signInData?.user) {
    await serviceSupabase.rpc('reset_failed_login', {
      p_user_id: signInData.user.id,
    })
  }

  revalidatePath('/', 'layout')
  redirect('/agents')
}

export async function signUpWithEmail(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Check your email to confirm your account')
}

export async function signInWithMagicLink(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Check your email for the magic link!' }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

