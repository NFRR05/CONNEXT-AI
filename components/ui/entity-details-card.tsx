"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

// Define variants for the status badge using cva
const badgeVariants = cva(
  "capitalize",
  {
    variants: {
      status: {
        active: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
        inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300",
        pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
        completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
        rejected: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
        cancelled: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
      },
    },
    defaultVariants: {
      status: "active",
    },
  }
);

// Define the type for each action button
export interface EntityAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  disabled?: boolean;
}

// Define the props for the main component
export interface EntityDetailsCardProps extends VariantProps<typeof badgeVariants> {
  title: string;
  subtitle?: string;
  entityId: string;
  entityName?: string;
  date: Date;
  dateLabel?: string;
  actions: EntityAction[];
  className?: string;
  status: "active" | "inactive" | "pending" | "completed" | "rejected" | "cancelled";
  metadata?: {
    label: string;
    value: string;
  }[];
}

const EntityDetailsCard = React.forwardRef<
  HTMLDivElement,
  EntityDetailsCardProps
>(({ 
    className, 
    title,
    subtitle,
    entityName,
    status,
    entityId,
    date,
    dateLabel = "Created",
    actions,
    metadata,
    ...props 
}, ref) => {
  
  // Format the date for display
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Animation variants for framer-motion
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <motion.div
      ref={ref}
      className={cn("w-full", className)}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      {...props}
    >
      <GlassCard className="overflow-hidden">
        {/* Main content section */}
        <div className="p-6 space-y-4">
          {/* Header with title and status */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-muted-foreground">
                  {subtitle}
                </p>
              )}
              {entityName && (
                <p className="text-sm text-muted-foreground">
                  {entityName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge className={cn(badgeVariants({ status }))}>{status}</Badge>
              <span className="text-xs text-muted-foreground font-mono">ID: {entityId.slice(0, 8)}...</span>
            </div>
          </div>
          
          {/* Metadata Section */}
          {metadata && metadata.length > 0 && (
            <div className="border-t border-border/50 pt-4 space-y-2">
              {metadata.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.label}:</span>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Date Section */}
          <div className="border-t border-border/50 pt-4">
            <p className="text-sm text-muted-foreground">{dateLabel}</p>
            <p className="text-lg font-semibold text-foreground">{formattedDate}</p>
          </div>
        </div>
        
        {/* Actions Toolbar */}
        {actions.length > 0 && (
          <div className="bg-white/60 backdrop-blur-sm px-6 py-3 border-t border-border/50">
            <div className="flex items-center justify-start gap-2 overflow-x-auto pb-2 -mb-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'ghost'}
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="flex-shrink-0"
                >
                  <action.icon className="mr-2 h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
});

EntityDetailsCard.displayName = "EntityDetailsCard";

export { EntityDetailsCard };

