import { Sidebar } from '@/components/sidebar'
import { InfiniteGrid } from '@/components/ui/infinite-grid-integration'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex relative">
      <InfiniteGrid />
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 min-h-screen transition-all duration-300 ease-in-out p-4 sm:p-6 lg:p-8 relative z-10">
        {children}
      </main>
    </div>
  )
}
