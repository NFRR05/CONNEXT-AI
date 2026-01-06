'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/actions/auth'
import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface AppSidebarProps {
    initialRole?: 'client' | 'admin' | 'support' | null
}

export function AppSidebar({ initialRole = null }: AppSidebarProps) {
    const [userRole, setUserRole] = useState<'client' | 'admin' | 'support' | null>(initialRole)
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const handleSignOut = async () => {
        await signOut()
        router.push('/login')
    }

    useEffect(() => {
        // If we already have a role from server, use it and verify client-side
        if (initialRole) {
            setUserRole(initialRole)
        }
        
        // Always verify role client-side to ensure it's up to date
        async function getUser() {
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
        }
        getUser()
    }, [initialRole])

    const clientLinks = [
        { href: '/client/dashboard', label: 'Dashboard', icon: 'Chart_Line.svg' },
        { href: '/client/leads', label: 'Leads', icon: 'Users_Group.svg' },
        { href: '/client/agents', label: 'Agents', icon: 'Chat_Circle_Dots.svg' },
        { href: '/client/requests', label: 'Requests', icon: 'File_Document.svg' },
    ]

    const adminLinks = [
        { href: '/admin/dashboard', label: 'Dashboard', icon: 'Chart_Line.svg' },
        { href: '/admin/agents', label: 'Agents', icon: 'Chat_Circle_Dots.svg' },
        { href: '/admin/requests', label: 'Requests', icon: 'File_Document.svg' },
    ]

    const links = userRole === 'admin' || userRole === 'support' ? adminLinks : clientLinks
    const dashboardPath = userRole === 'admin' || userRole === 'support' ? '/admin/dashboard' : '/client/dashboard'

    return (
        <Sidebar open={open} setOpen={setOpen}>
            <SidebarBody className="justify-between gap-10">
                <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                    {/* Logo */}
                    {open ? <SidebarLogo href={dashboardPath} /> : <SidebarLogoIcon href={dashboardPath} />}
                    
                    {/* Navigation Links */}
                    <div className="mt-8 flex flex-col gap-1">
                        {links.map((link) => (
                            <SidebarLink key={link.href} link={link} />
                        ))}
                    </div>
                </div>

                {/* User Info Footer */}
                <div className="pb-4 space-y-2">
                    <div className="p-3 rounded-lg bg-white/60 backdrop-blur-xl border border-border/50">
                        <motion.p
                            animate={{
                                opacity: open ? 1 : 0,
                                display: open ? "block" : "none",
                            }}
                            className="text-xs text-muted-foreground font-medium capitalize"
                        >
                            {userRole || 'Loading...'}
                        </motion.p>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleSignOut}
                        className="w-full shadow-lg shadow-destructive/20"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <motion.span
                            animate={{
                                opacity: open ? 1 : 0,
                                display: open ? "inline" : "none",
                            }}
                        >
                            Sign Out
                        </motion.span>
                        {!open && <span className="sr-only">Sign Out</span>}
                    </Button>
                </div>
            </SidebarBody>
        </Sidebar>
    )
}

const SidebarLogo = ({ href }: { href: string }) => {
    return (
        <Link
            href={href}
            className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20 h-16 border-b border-border/50 px-6"
        >
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/60 bg-clip-text text-transparent whitespace-pre"
            >
                CONNEXT AI
            </motion.span>
        </Link>
    )
}

const SidebarLogoIcon = ({ href }: { href: string }) => {
    return (
        <Link
            href={href}
            className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20 h-16 border-b border-border/50 justify-center"
        >
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/60 bg-clip-text text-transparent">
                C
            </span>
        </Link>
    )
}
