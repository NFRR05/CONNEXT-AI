'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/actions/auth'
import { cn } from '@/lib/utils'

export function Navbar() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/agents" className="flex items-center space-x-2">
            <span className="text-xl font-bold">CONNEXT AI</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/agents">
              <Button
                variant={isActive('/agents') ? 'default' : 'ghost'}
                className={cn(
                  'transition-colors',
                  isActive('/agents') && 'bg-primary text-primary-foreground'
                )}
              >
                Agents
              </Button>
            </Link>
            <Link href="/leads">
              <Button
                variant={isActive('/leads') ? 'default' : 'ghost'}
                className={cn(
                  'transition-colors',
                  isActive('/leads') && 'bg-primary text-primary-foreground'
                )}
              >
                Leads
              </Button>
            </Link>
          </div>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="ghost">
            Sign Out
          </Button>
        </form>
      </div>
    </nav>
  )
}

