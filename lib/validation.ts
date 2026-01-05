import { z } from 'zod'
import { normalizePhone } from '@/lib/security/sanitization'

// Phone number validation (E.164 format)
const phoneRegex = /^\+[1-9]\d{1,14}$/

// Password validation (OWASP compliant)
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')

// Webhook input validation
export const webhookInputSchema = z.object({
  phone: z.string()
    .max(20)
    .optional()
    .nullable()
    .transform((val) => val ? normalizePhone(val) : null)
    .refine((val) => !val || phoneRegex.test(val), {
      message: 'Phone must be in E.164 format (e.g., +1234567890)'
    }),
  
  summary: z.string()
    .max(10000, 'Summary must be less than 10,000 characters')
    .optional()
    .nullable(),
  
  recording: z.string()
    .url('Recording must be a valid URL')
    .max(500, 'Recording URL too long')
    .optional()
    .nullable(),
  
  transcript: z.string()
    .max(50000, 'Transcript must be less than 50,000 characters')
    .optional()
    .nullable(),
  
  sentiment: z.enum(['positive', 'negative', 'neutral'])
    .optional()
    .nullable(),
  
  structured_data: z.record(z.any())
    .optional()
    .default({}),
  
  duration: z.number()
    .int('Duration must be an integer')
    .positive('Duration must be positive')
    .max(36000, 'Duration cannot exceed 10 hours')
    .optional()
    .nullable(),
})

// Agent creation validation
export const agentCreationSchema = z.object({
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be less than 5,000 characters')
    .trim()
    .optional(),
  
  name: z.string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  
  formData: z.record(z.any())
    .optional(),
  
  workflowConfig: z.record(z.any())
    .optional(),
})

// Lead update validation
export const leadUpdateSchema = z.object({
  leadId: z.string()
    .uuid('Lead ID must be a valid UUID'),
  
  status: z.enum(['New', 'Contacted', 'Closed'], {
    errorMap: () => ({ message: 'Status must be New, Contacted, or Closed' })
  }),
})

// Agent request validation
export const agentRequestSchema = z.object({
  request_type: z.enum(['create', 'update', 'delete'], {
    errorMap: () => ({ message: 'Request type must be create, update, or delete' })
  }),
  
  agent_id: z.string()
    .uuid('Agent ID must be a valid UUID')
    .optional()
    .nullable(),
  
  name: z.string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be less than 5,000 characters')
    .trim()
    .optional(),
  
  system_prompt: z.string()
    .max(10000, 'System prompt must be less than 10,000 characters')
    .optional()
    .nullable(),
  
  voice_id: z.string()
    .max(100)
    .optional()
    .nullable(),
  
  form_data: z.record(z.any())
    .optional(),
  
  workflow_config: z.record(z.any())
    .optional(),
}).refine(
  (data) => {
    // For create requests, description is required
    if (data.request_type === 'create' && !data.description) {
      return false
    }
    // For update/delete requests, agent_id is required
    if ((data.request_type === 'update' || data.request_type === 'delete') && !data.agent_id) {
      return false
    }
    return true
  },
  {
    message: 'Description required for create requests, agent_id required for update/delete requests'
  }
)

// Admin request update validation
export const adminRequestUpdateSchema = z.object({
  status: z.enum(['approved', 'rejected'], {
    errorMap: () => ({ message: 'Status must be approved or rejected' })
  }),
  
  admin_notes: z.string()
    .max(1000, 'Admin notes must be less than 1,000 characters')
    .optional()
    .nullable(),
})

// Helper function to validate and return errors
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return { success: false, errors: result.error }
}

