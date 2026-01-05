import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Add security headers
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  if (process.env.NODE_ENV === 'production') {
    supabaseResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    supabaseResponse.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
    )
  }

  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          const isProduction = process.env.NODE_ENV === 'production'

          cookiesToSet.forEach(({ name, value, options }) => {
            // Secure cookie options
            const secureOptions = {
              ...options,
              httpOnly: true, // Prevent JavaScript access
              secure: isProduction, // HTTPS only in production
              sameSite: 'lax' as const, // CSRF protection
              path: '/',
            }
            request.cookies.set({ name, value, ...secureOptions } as any)
          })

          supabaseResponse = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            const secureOptions = {
              ...options,
              httpOnly: true,
              secure: isProduction,
              sameSite: 'lax' as const,
              path: '/',
            }
            supabaseResponse.cookies.set(name, value, secureOptions as any)
          })
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Allow access to auth routes and landing page without authentication
  const isAuthRoute = request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/auth')

  // Allow Twilio webhooks without authentication (they use Twilio signature verification)
  const isTwilioWebhook = request.nextUrl.pathname.startsWith('/api/twilio')

  // Allow webhook ingest without authentication (uses api_secret header for auth)
  const isWebhookIngest = request.nextUrl.pathname.startsWith('/api/webhooks/ingest')

  // Allow Retell webhooks without authentication (uses signature verification)
  const isRetellWebhook = request.nextUrl.pathname.startsWith('/api/retell/webhook')

  if (!user && !isAuthRoute && !isTwilioWebhook && !isWebhookIngest && !isRetellWebhook) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login/signup
  if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup'))) {
    // Get user role to redirect to appropriate portal
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || 'client'
    const url = request.nextUrl.clone()
    url.pathname = userRole === 'admin' || userRole === 'support' ? '/admin/dashboard' : '/client/dashboard'
    return NextResponse.redirect(url)
  }

  // Role-based route protection
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || 'client'
    const pathname = request.nextUrl.pathname

    // Admin routes - only admins/support can access
    if (pathname.startsWith('/admin')) {
      if (userRole !== 'admin' && userRole !== 'support') {
        const url = request.nextUrl.clone()
        url.pathname = '/client/dashboard'
        return NextResponse.redirect(url)
      }
    }

    // Client routes - only clients can access (admins can view but should use admin portal)
    if (pathname.startsWith('/client')) {
      // Allow access for all authenticated users
      // Admins can view client portal if needed
    }

    // Legacy dashboard routes - redirect based on role
    if (pathname.startsWith('/agents') || pathname.startsWith('/leads') || pathname === '/dashboard') {
      const url = request.nextUrl.clone()
      if (userRole === 'admin' || userRole === 'support') {
        url.pathname = pathname.replace(/^\/(agents|leads|dashboard)/, '/admin$&')
      } else {
        url.pathname = pathname.replace(/^\/(agents|leads|dashboard)/, '/client$&')
      }
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}

