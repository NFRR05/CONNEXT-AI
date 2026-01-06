"use client";

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardHeader,
  GlassCardTitle,
} from '@/components/ui/glass-card';
import { Status, StatusIndicator, StatusLabel } from '@/components/ui/status';
import { cn } from '@/lib/utils';

export interface SystemStatusItem {
  label: string;
  status: 'online' | 'offline' | 'maintenance' | 'degraded';
  customLabel?: string;
}

interface SystemStatusCardProps {
  title?: string;
  subtitle?: string;
  items: SystemStatusItem[];
  className?: string;
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
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

/**
 * A card component for displaying system status information.
 * Uses animated status indicators with color-coded states.
 */
export const SystemStatusCard = ({
  title = 'System Status',
  subtitle = 'Current system health',
  items,
  className,
}: SystemStatusCardProps) => {
  return (
    <GlassCard className={cn('w-full border-border/50', className)}>
      <GlassCardHeader>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GlassCardTitle className="text-xl font-bold">{title}</GlassCardTitle>
          {subtitle && (
            <GlassCardDescription className="mt-1">{subtitle}</GlassCardDescription>
          )}
        </motion.div>
      </GlassCardHeader>
      <GlassCardContent>
        <motion.div
          className="space-y-2 text-sm"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {items.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ x: 4, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex items-center justify-between p-3 rounded-lg bg-white/60 backdrop-blur-xl border border-border/50 hover:bg-white/80 hover:shadow-sm hover:shadow-primary/5 transition-all duration-200 cursor-default"
            >
              <span className="text-muted-foreground font-medium">{item.label}:</span>
              <Status status={item.status}>
                <StatusIndicator />
                <StatusLabel>
                  {item.customLabel || undefined}
                </StatusLabel>
              </Status>
            </motion.div>
          ))}
        </motion.div>
      </GlassCardContent>
    </GlassCard>
  );
};

