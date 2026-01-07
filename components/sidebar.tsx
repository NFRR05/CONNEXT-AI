"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  Sidebar as BaseSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { LogOut, LayoutDashboard, Users, FileText, MessageSquare, Settings } from "lucide-react"
import { signOut } from "@/app/actions/auth"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

export function Sidebar() {
  const pathname = usePathname()
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
      setUserRole('client')
    }
  }

  // Client navigation items
  const clientNavItems: NavItem[] = [
    { title: "Dashboard", url: "/client/dashboard", icon: LayoutDashboard },
    { title: "Agents", url: "/client/agents", icon: Users },
    { title: "Leads", url: "/client/leads", icon: MessageSquare },
    { title: "Requests", url: "/client/requests", icon: FileText },
  ]

  // Admin navigation items
  const adminNavItems: NavItem[] = [
    { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Agents", url: "/admin/agents", icon: Users },
    { title: "Requests", url: "/admin/requests", icon: FileText },
  ]

  const navItems = userRole === 'admin' || userRole === 'support' ? adminNavItems : clientNavItems

  const isActive = (url: string) => pathname?.startsWith(url)

  return (
    <SidebarProvider>
      <BaseSidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">C</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">CONNEXT AI</span>
              <span className="text-xs text-muted-foreground capitalize">{userRole || 'Loading...'}</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        tooltip={item.title}
                      >
                        <Link href={item.url}>
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="p-3 rounded-lg bg-white/60 backdrop-blur-xl border border-border/50">
            <motion.p
              animate={{
                opacity: true ? 1 : 0,
                display: true ? "block" : "none",
              }}
              className="text-xs text-muted-foreground font-medium capitalize mb-2"
            >
              {userRole || 'Loading...'}
            </motion.p>
            <form action={signOut}>
              <Button
                type="submit"
                variant="destructive"
                className="w-full shadow-lg shadow-destructive/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>Sign Out</span>
              </Button>
            </form>
          </div>
        </SidebarFooter>
      </BaseSidebar>
    </SidebarProvider>
  )
}
