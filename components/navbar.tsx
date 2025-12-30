'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/actions/auth'
import { cn } from '@/lib/utils'
import { Menu, X, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userRole, setUserRole] = useState<'client' | 'admin' | 'support' | null>(null)

  useEffect(() => {
    fetchUserRole()
  }, [])

  const fetchUserRole = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setUserRole(profile?.role || 'client')
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const isActive = (path: string) => pathname?.startsWith(path)

  // Client portal links
  const clientLinks = [
    { href: '/client/dashboard', label: 'Dashboard' },
    { href: '/client/requests', label: 'Requests' },
    { href: '/client/agents', label: 'Agents' },
    { href: '/client/leads', label: 'Leads' },
  ]

  // Admin portal links
  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/requests', label: 'Requests' },
    { href: '/admin/agents', label: 'Agents' },
    { href: '/admin/workflows', label: 'Workflows' },
  ]

  const navLinks = userRole === 'admin' || userRole === 'support' ? adminLinks : clientLinks
  const dashboardPath = userRole === 'admin' || userRole === 'support' ? '/admin/dashboard' : '/client/dashboard'

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href={dashboardPath}
              className="flex items-center space-x-2 transition-opacity hover:opacity-80"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                CONNEXT AI
              </span>
            </Link>
          </div>

          {/* Desktop Navigation & Sign Out - Right Side */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={isActive(link.href) ? 'default' : 'ghost'}
                  className={cn(
                    'transition-all duration-200',
                    isActive(link.href) 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
            <form action={signOut}>
              <Button 
                type="submit" 
                variant="ghost"
                className="gap-2 transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </form>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <form action={signOut} className="md:hidden">
              <Button 
                type="submit" 
                variant="ghost"
                size="icon"
                className="h-9 w-9"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Sign Out</span>
              </Button>
            </form>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="border-t bg-background md:hidden">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'block rounded-md px-3 py-2 text-base font-medium transition-colors',
                    isActive(link.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

