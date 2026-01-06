"use client";

import { motion } from "framer-motion"
import { GlassCard, GlassCardContent, GlassCardFooter } from "@/components/ui/glass-card"
import { ArrowRight } from "lucide-react"
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
    className?: string
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
}

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15,
        },
    },
}

export function StatsCardsWithLinks({ data, className }: StatsCardsWithLinksProps) {
    return (
        <motion.div
            className={cn("w-full", className)}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 w-full">
                {data.map((item, index) => (
                    <motion.div
                        key={item.name}
                        variants={cardVariants}
                        whileHover={{ y: -4, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        <GlassCard className="p-0 gap-0 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 h-full border-border/50 group cursor-pointer">
                            <GlassCardContent className="p-6">
                                <dd className="flex items-start justify-between space-x-2">
                                    <span className="truncate text-sm text-muted-foreground font-medium">
                                        {item.name}
                                    </span>
                                    {item.change && (
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 + index * 0.1 }}
                                            className={cn(
                                                "text-sm font-semibold whitespace-nowrap",
                                                item.changeType === "positive"
                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                    : "text-red-600 dark:text-red-400"
                                            )}
                                        >
                                            {item.change}
                                        </motion.span>
                                    )}
                                </dd>
                                <motion.dd
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + index * 0.1 }}
                                    className="mt-2 text-3xl font-bold text-foreground tracking-tight"
                                >
                                    {item.value}
                                </motion.dd>
                            </GlassCardContent>
                            <GlassCardFooter className="flex justify-end border-t border-border/50 !p-0 overflow-hidden">
                                <Link
                                    href={item.href}
                                    className="w-full px-6 py-3 text-sm font-medium text-primary hover:text-primary/90 transition-all duration-200 flex items-center justify-end gap-1 group-hover:bg-primary/5"
                                >
                                    <span>View more</span>
                                    <motion.div
                                        whileHover={{ x: 4 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                    </motion.div>
                                </Link>
                            </GlassCardFooter>
                        </GlassCard>
                    </motion.div>
                ))}
            </dl>
        </motion.div>
    )
}
