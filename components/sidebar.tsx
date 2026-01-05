'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import Image from 'next/image'

export function Sidebar() {
    const pathname = usePathname()
    const [userRole, setUserRole] = useState<'client' | 'admin' | 'support' | null>(null)

    useEffect(() => {
        async function getUser() {
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
        }
        getUser()
    }, [])

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

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border/40 bg-background/60 backdrop-blur-xl transition-transform">
            <div className="flex h-16 items-center px-6 border-b border-border/40">
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    CONNEXT AI
                </span>
            </div>
            <div className="py-4 px-3 space-y-1">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground group",
                            pathname && pathname.startsWith(link.href) ? "bg-primary/10 text-primary" : "text-muted-foreground"
                        )}
                    >
                        <Image
                            src={`/icons/${link.icon}`}
                            alt={link.label}
                            width={20}
                            height={20}
                            className={cn(
                                "transition-opacity group-hover:opacity-100 brightness-0",
                                "opacity-70"
                            )}
                        />
                        {link.label}
                    </Link>
                ))}
            </div>

            <div className="absolute bottom-4 left-0 w-full px-3">
                <div className="p-4 rounded-xl glass-card bg-gradient-to-br from-primary/5 to-transparent border border-white/5">
                    <p className="text-xs text-muted-foreground font-medium">Logged in as {userRole}</p>
                </div>
            </div>
        </aside>
    )
}
