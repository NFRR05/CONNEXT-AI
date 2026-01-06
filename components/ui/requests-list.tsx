'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CheckCircle, XCircle, Eye, MessageSquare, Plus, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Link from 'next/link'

export interface RequestItem {
  id: string
  request_type: 'create' | 'update' | 'delete'
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
  name: string | null
  description: string | null
  priority: string
  created_at: string
  admin_notes: string | null
  agent_id: string | null
  user_email?: string | null
}

interface RequestsListProps {
  requests: RequestItem[]
  onViewRequest?: (id: string) => void
  onReviewRequest?: (id: string) => void
  emptyStateTitle?: string
  emptyStateDescription?: string
  emptyStateActionLabel?: string
  emptyStateActionHref?: string
  showUserEmail?: boolean
  className?: string
}

const animationVariants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, x: 20, scale: 0.95 },
  transition: { duration: 0.2, ease: 'easeOut' },
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    approved: 'default',
    rejected: 'destructive',
    completed: 'default',
    cancelled: 'outline',
  }

  const icons = {
    pending: Clock,
    approved: CheckCircle,
    rejected: XCircle,
    completed: CheckCircle,
    cancelled: XCircle,
  }

  const Icon = icons[status as keyof typeof icons] || Clock

  return (
    <Badge variant={variants[status] || 'secondary'}>
      <Icon className="mr-1 h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

const getPriorityBadge = (priority: string) => {
  const colors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30',
    normal: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800/30',
    high: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/30',
    urgent: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30',
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs border',
        colors[priority] || colors.normal
      )}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  )
}

const getRequestTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    create: 'Create Agent',
    update: 'Update Agent',
    delete: 'Delete Agent',
  }
  return labels[type] || type
}

const getRequestIcon = (type: string) => {
  return <FileText className="h-5 w-5" />
}

export function RequestsList({
  requests,
  onViewRequest,
  onReviewRequest,
  emptyStateTitle = 'No requests yet',
  emptyStateDescription = 'Create your first agent request to get started',
  emptyStateActionLabel = 'Create Request',
  emptyStateActionHref,
  showUserEmail = false,
  className,
}: RequestsListProps) {
  if (requests.length === 0) {
    return (
      <Card className={cn('rounded-2xl shadow-lg', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{emptyStateTitle}</h3>
          <p className="text-muted-foreground mb-4 text-center">
            {emptyStateDescription}
          </p>
          {emptyStateActionHref && (
            <Link href={emptyStateActionHref}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {emptyStateActionLabel}
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('w-full space-y-4', className)}>
      <AnimatePresence>
        {requests.map((request) => (
          <motion.div
            key={request.id}
            layout
            initial={animationVariants.initial}
            animate={animationVariants.animate}
            exit={animationVariants.exit}
            transition={animationVariants.transition}
          >
            <Card className="rounded-2xl shadow-lg">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Header with title, badges, metadata */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold break-words">
                        {request.name || getRequestTypeLabel(request.request_type)}
                      </h3>
                      {getStatusBadge(request.status)}
                      {getPriorityBadge(request.priority)}
                    </div>
                    {/* Metadata */}
                    <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                      <span>{getRequestTypeLabel(request.request_type)}</span>
                      <span>•</span>
                      {showUserEmail && request.user_email && (
                        <>
                          <span>{request.user_email}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{new Date(request.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    {onReviewRequest ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReviewRequest(request.id)}
                        className="w-full sm:w-auto"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Review
                      </Button>
                    ) : onViewRequest ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewRequest(request.id)}
                        className="w-full sm:w-auto"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              {/* Description (line-clamped) */}
              {request.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {request.description}
                  </p>
                </CardContent>
              )}
              {/* Admin notes section (if exists) */}
              {request.admin_notes && (
                <CardContent className="pt-0">
                  <div className="rounded-lg bg-muted/50 p-3 border border-border/50">
                    <p className="text-sm font-medium mb-1">Admin Notes:</p>
                    <p className="text-sm text-muted-foreground">{request.admin_notes}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

