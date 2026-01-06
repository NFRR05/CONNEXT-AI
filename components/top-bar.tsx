'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/actions/auth'
import { cn } from '@/lib/utils'
import { LogOut, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar'
import Link from 'next/link'

interface TopBarProps {
  initialRole?: 'client' | 'admin' | 'support' | null
}

export function TopBar({ initialRole = null }: TopBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState<'client' | 'admin' | 'support' | null>(initialRole)

  useEffect(() => {
    // If we already have a role from server, use it
    if (initialRole) {
      setUserRole(initialRole)
    }
    
    // Always verify role client-side to ensure it's up to date
    fetchUserRole()
  }, [initialRole])

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
        if (profile?.role) {
          setUserRole(profile.role as 'client' | 'admin' | 'support')
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const isActive = (path: string) => pathname?.startsWith(path)

  // Client portal links
  const clientLinks = [
    { href: '/client/dashboard', label: 'Dashboard' },
    { href: '/client/agents', label: 'Agents' },
    { href: '/client/leads', label: 'Leads' },
    { href: '/client/requests', label: 'Requests' },
  ]

  // Admin portal links
  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/agents', label: 'Agents' },
    { href: '/admin/requests', label: 'Requests' },
  ]

  const navLinks = userRole === 'admin' || userRole === 'support' ? adminLinks : clientLinks
  const dashboardPath = userRole === 'admin' || userRole === 'support' ? '/admin/dashboard' : '/client/dashboard'

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <Menubar className="absolute inset-x-0 top-0 w-full rounded-none border-0 border-b bg-white/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/60 shadow-sm z-50 h-16">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 w-full">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href={dashboardPath}
              className="flex items-center space-x-2 transition-opacity hover:opacity-80"
            >
              <span className="text-xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/60 bg-clip-text text-transparent">
                CONNEXT AI
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Menubar */}
          <div className="hidden md:flex md:items-center md:gap-1 flex-1 justify-center">
            {navLinks.map((link) => (
              <MenubarMenu key={link.href}>
                  <MenubarTrigger
                    className={cn(
                      "cursor-pointer",
                      isActive(link.href) && "bg-primary/10 text-primary"
                    )}
                    onClick={() => router.push(link.href)}
                  >
                    {link.label}
                  </MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem
                      className="cursor-pointer"
                      onClick={() => router.push(link.href)}
                    >
                      View {link.label}
                    </MenubarItem>
                    {link.href.includes('/agents') && (
                      <>
                        <MenubarSeparator />
                        <MenubarItem
                          className="cursor-pointer"
                          onClick={() => router.push(`${link.href}/create`)}
                        >
                          Create New Agent
                        </MenubarItem>
                      </>
                    )}
                    {link.href.includes('/requests') && (
                      <>
                        <MenubarSeparator />
                        <MenubarItem
                          className="cursor-pointer"
                          onClick={() => router.push(`${link.href}/create`)}
                        >
                          Create New Request
                        </MenubarItem>
                      </>
                    )}
                  </MenubarContent>
              </MenubarMenu>
            ))}
              
              {/* User Menu */}
              <MenubarMenu>
                <MenubarTrigger className="cursor-pointer">
                  Account
                  <ChevronDown className="ml-2 h-4 w-4" />
                </MenubarTrigger>
                <MenubarContent>
                  <MenubarItem disabled>
                    Role: {userRole || 'Loading...'}
                  </MenubarItem>
                  <MenubarSeparator />
                  <div className="p-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleSignOut}
                      className="w-full justify-start shadow-lg shadow-destructive/20"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </MenubarContent>
              </MenubarMenu>
          </div>

          {/* Mobile - Simple buttons */}
          <div className="flex items-center gap-2 md:hidden">
            <form action={signOut}>
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
          </div>
        </div>
    </Menubar>
  )
}

