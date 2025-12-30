import { z } from 'zod'

// Phone number validation (E.164 format)
const phoneRegex = /^\+[1-9]\d{1,14}$/

// Webhook input validation
export const webhookInputSchema = z.object({
  phone: z.string()
    .regex(phoneRegex, 'Phone must be in E.164 format (e.g., +1234567890)')
    .max(20)
    .optional()
    .nullable(),
  
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
    .trim(),
  
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

