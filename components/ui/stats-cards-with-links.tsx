import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"
import { ArrowDown, ArrowUp, ArrowRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface StatsCardWithLinkData {
    name: string
    value: string
    change?: string
    changeType?: "positive" | "negative"
    href: string
}

interface StatsCardsWithLinksProps {
    data: StatsCardWithLinkData[]
}

export function StatsCardsWithLinks({ data }: StatsCardsWithLinksProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data.map((item) => (
                <Link key={item.name} href={item.href}>
                    <GlassCard className="hover:bg-white/5 transition-colors cursor-pointer group h-full">
                        <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b-0">
                            <GlassCardTitle className="text-sm font-medium">
                                {item.name}
                            </GlassCardTitle>
                            <ArrowRight className="h-4 w-4 text-black group-hover:text-primary transition-colors" />
                        </GlassCardHeader>
                        <GlassCardContent>
                            <div className="text-2xl font-bold">{item.value}</div>
                            {item.change && (
                                <p className={cn(
                                    "text-xs flex items-center mt-1",
                                    item.changeType === "positive" ? "text-green-500" : "text-red-500"
                                )}>
                                    {item.changeType === "positive" ? (
                                        <ArrowUp className="mr-1 h-3 w-3" />
                                    ) : (
                                        <ArrowDown className="mr-1 h-3 w-3" />
                                    )}
                                    {item.change} from last period
                                </p>
                            )}
                        </GlassCardContent>
                    </GlassCard>
                </Link>
            ))}
        </div>
    )
}
