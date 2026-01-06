"use client";

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardHeader,
  GlassCardTitle,
} from '@/components/ui/glass-card';

/**
 * Interface for each action item in the QuickActionCard.
 * @property {React.ReactNode} icon - The icon to display for the action.
 * @property {string} label - The text label for the action button.
 * @property {string} [href] - Optional href for navigation (uses Next.js Link).
 * @property {() => void} [onClick] - Optional function to call when the button is clicked (if no href).
 */
export interface ActionItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}

/**
 * Props for the QuickActionCard component.
 * @property {string} title - The main title of the card.
 * @property {string} [subtitle] - An optional subtitle or description.
 * @property {ActionItem[]} actions - An array of action items to be displayed as buttons.
 * @property {string} [className] - Optional additional class names for custom styling.
 * @property {number} [columns] - Number of columns in the grid (default: 3).
 */
interface QuickActionCardProps {
  title: string;
  subtitle?: string;
  actions: ActionItem[];
  className?: string;
  columns?: 2 | 3 | 4;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
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
};

/**
 * A card component for displaying a set of "quick actions" or links.
 * It's designed to be reusable and theme-adaptive using glassmorphism design.
 */
export const QuickActionCard = ({
  title,
  subtitle,
  actions,
  className,
  columns = 3,
}: QuickActionCardProps) => {
  const router = useRouter();

  const handleAction = (action: ActionItem) => {
    if (action.href) {
      router.push(action.href);
    } else if (action.onClick) {
      action.onClick();
    }
  };

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

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
          className={cn('grid gap-3 sm:gap-4', gridCols[columns])}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {actions.map((action, index) => {
            const ActionButton = (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <motion.button
                  onClick={() => handleAction(action)}
                  aria-label={action.label}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 p-5 rounded-xl w-full",
                    "bg-white/60 backdrop-blur-xl border border-border/50 shadow-sm shadow-black/5",
                    "text-foreground hover:bg-white/80 hover:border-border hover:shadow-md hover:shadow-primary/10",
                    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    "ring-offset-background transition-all duration-300",
                    "aspect-square group"
                  )}
                >
                  <motion.div
                    className="h-6 w-6 text-foreground"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    {action.icon}
                  </motion.div>
                  <span className="text-sm font-semibold group-hover:text-primary transition-colors">
                    {action.label}
                  </span>
                </motion.button>
              </motion.div>
            );

            // If href is provided, wrap in Link for better Next.js navigation
            if (action.href) {
              return (
                <Link key={index} href={action.href} className="block">
                  {ActionButton}
                </Link>
              );
            }

            return ActionButton;
          })}
        </motion.div>
      </GlassCardContent>
    </GlassCard>
  );
};

