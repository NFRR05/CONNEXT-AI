'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileJson, ChevronUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'

interface AgentRequest {
  id: string
  request_type: 'create' | 'update' | 'delete'
  name: string | null
  description: string | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
  created_at: string
  profiles?: {
    email: string | null
  } | null
}

interface RequestReviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: AgentRequest | null
  adminNotes: string
  onAdminNotesChange: (notes: string) => void
  onApprove: () => void
  onReject: () => void
  onCancel: () => void
  actionLoading: boolean
  showWorkflowPreview: boolean
  workflowPreview: any
  loadingPreview: boolean
  onToggleWorkflowPreview: () => void
  getRequestTypeLabel: (type: string) => string
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export function RequestReviewModal({
  open,
  onOpenChange,
  request,
  adminNotes,
  onAdminNotesChange,
  onApprove,
  onReject,
  onCancel,
  actionLoading,
  showWorkflowPreview,
  workflowPreview,
  loadingPreview,
  onToggleWorkflowPreview,
  getRequestTypeLabel,
}: RequestReviewModalProps) {
  if (!request) return null

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        dialogProps={{
          className: 'z-50',
        }}
      >
        <ModalHeader>
          <ModalTitle>Review Request</ModalTitle>
          <ModalDescription className="break-words">
            {getRequestTypeLabel(request.request_type)} from{' '}
            {request.profiles?.email || 'Unknown user'}
          </ModalDescription>
        </ModalHeader>

        <ModalBody className="flex-1 overflow-y-auto space-y-4">
          {/* Request Details Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="space-y-2"
          >
            <Label>Request Details</Label>
            <Card className="border shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Name
                      </p>
                      <p className="text-sm font-semibold">
                        {request.name || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Priority
                      </p>
                      <p className="text-sm font-semibold capitalize">
                        {request.priority}
                      </p>
                    </div>
                  </div>

                  {request.description && (
                    <div className="space-y-1 pt-2 border-t">
                      <p className="text-sm font-medium text-muted-foreground">
                        Description
                      </p>
                      <p className="text-sm break-words whitespace-pre-wrap">
                        {request.description}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Created
                    </p>
                    <p className="text-sm">
                      {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Workflow Preview Section (only for create requests) */}
          {request.request_type === 'create' && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <Label>Workflow Preview</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onToggleWorkflowPreview}
                  disabled={loadingPreview}
                  className="transition-all duration-300"
                >
                  {loadingPreview ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : showWorkflowPreview ? (
                    <>
                      <ChevronUp className="mr-2 h-4 w-4" />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <FileJson className="mr-2 h-4 w-4" />
                      Preview Workflow
                    </>
                  )}
                </Button>
              </div>

              <AnimatePresence>
                {showWorkflowPreview && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <Card className="border shadow-sm">
                      <CardContent className="pt-6">
                        {workflowPreview ? (
                          <div className="max-h-96 overflow-y-auto">
                            <pre className="text-xs font-mono whitespace-pre-wrap break-words bg-muted/50 p-4 rounded-lg border">
                              {JSON.stringify(workflowPreview, null, 2)}
                            </pre>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground text-center py-8">
                            No workflow preview available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Admin Notes Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="space-y-2"
          >
            <Label htmlFor="admin_notes">Admin Notes</Label>
            <Textarea
              id="admin_notes"
              value={adminNotes}
              onChange={(e) => onAdminNotesChange(e.target.value)}
              placeholder="Add notes about this request..."
              rows={4}
              className="min-h-[80px] transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </motion.div>
        </ModalBody>

        <ModalFooter className="flex flex-col sm:flex-row gap-2 pt-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 w-full sm:w-auto"
          >
            <Button
              onClick={onApprove}
              disabled={actionLoading}
              className="w-full transition-all duration-300 rounded-2xl"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Approve'
              )}
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 w-full sm:w-auto"
          >
            <Button
              variant="destructive"
              onClick={onReject}
              disabled={actionLoading}
              className="w-full transition-all duration-300 rounded-2xl"
            >
              Reject
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto"
          >
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={actionLoading}
              className="w-full sm:w-auto transition-all duration-300 rounded-2xl"
            >
              Cancel
            </Button>
          </motion.div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

