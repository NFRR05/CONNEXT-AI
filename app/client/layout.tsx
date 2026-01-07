"use client"

import { Sidebar } from '@/components/sidebar'
import InfiniteGrid from '@/components/ui/infinite-grid-integration'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex relative">
      <InfiniteGrid />
      <Sidebar />
      <main className="flex-1 min-h-screen transition-all duration-300 ease-in-out p-4 sm:p-4 lg:p-6 relative z-10">
        {children}
      </main>
    </div>
  )
}
