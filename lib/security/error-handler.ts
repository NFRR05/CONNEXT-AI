/**
 * Secure Error Handler
 * 
 * Prevents information leakage in error responses.
 * OWASP: Never expose stack traces, database errors, or internal details in production.
 */

import { NextResponse } from 'next/server'

const isProduction = process.env.NODE_ENV === 'production'

export interface SafeError {
  error: string
  code?: string
  details?: string
  stack?: string
}

/**
 * Create a safe error response that doesn't leak information
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string = 'An error occurred',
  statusCode: number = 500
): NextResponse {
  if (isProduction) {
    // Production: Generic error only
    return NextResponse.json(
      { error: defaultMessage },
      { status: statusCode }
    )
  }
  
  // Development: Show details for debugging
  const message = error instanceof Error ? error.message : String(error)
  const errorType = error instanceof Error ? error.constructor.name : typeof error
  const stack = error instanceof Error ? error.stack : undefined
  
  return NextResponse.json(
    { 
      error: message || defaultMessage,
      type: errorType,
      ...(stack ? { stack } : {})
    },
    { status: statusCode }
  )
}

/**
 * Sanitize error for logging (removes PII and sensitive data)
 */
export function sanitizeErrorForLogging(error: unknown): SafeError {
  if (!(error instanceof Error)) {
    return { error: String(error) }
  }
  
  const sanitized: SafeError = {
    error: error.message,
  }
  
  // Only include stack in development
  if (!isProduction && error.stack) {
    sanitized.stack = error.stack
  }
  
  // Remove sensitive patterns from error message
  const sensitivePatterns = [
    /password/gi,
    /secret/gi,
    /key/gi,
    /token/gi,
    /api[_-]?key/gi,
    /\b[A-Za-z0-9]{32,}\b/g, // Long strings that might be keys
  ]
  
  let message = error.message
  for (const pattern of sensitivePatterns) {
    message = message.replace(pattern, '[REDACTED]')
  }
  
  sanitized.error = message
  
  return sanitized
}

/**
 * Log error securely (without PII)
 */
export function logError(context: string, error: unknown): void {
  const sanitized = sanitizeErrorForLogging(error)
  console.error(`[${context}]`, sanitized)
}

