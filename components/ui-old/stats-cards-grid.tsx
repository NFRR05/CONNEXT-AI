"use client";

import * as React from "react";
import { GlassCard, GlassCardContent, GlassCardFooter } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface StatsCardData {
  name: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative";
  href: string;
}

interface StatsCardsGridProps {
  data: StatsCardData[];
  className?: string;
}

export function StatsCardsGrid({ data, className }: StatsCardsGridProps) {
  return (
    <div className={cn("w-full", className)}>
      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 w-full">
        {data.map((item) => (
          <GlassCard key={item.name} className="p-0 gap-0 hover:shadow-xl transition-all duration-300">
            <GlassCardContent className="p-6">
              <dd className="flex items-start justify-between space-x-2">
                <span className="truncate text-sm text-muted-foreground">
                  {item.name}
                </span>
                {item.change && (
                  <span
                    className={cn(
                      "text-sm font-medium whitespace-nowrap",
                      item.changeType === "positive"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {item.change}
                  </span>
                )}
              </dd>
              <dd className="mt-1 text-3xl font-semibold text-foreground">
                {item.value}
              </dd>
            </GlassCardContent>
            <GlassCardFooter className="flex justify-end border-t border-border/50 !p-0">
              <Link
                href={item.href}
                className="px-6 py-3 text-sm font-medium text-primary hover:text-primary/90 transition-colors flex items-center gap-1 group"
              >
                View more
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </GlassCardFooter>
          </GlassCard>
        ))}
      </dl>
    </div>
  );
}

