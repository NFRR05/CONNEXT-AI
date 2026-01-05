/**
 * Input Sanitization Utilities
 * 
 * Prevents XSS and injection attacks by sanitizing user input.
 */

/**
 * Sanitize HTML - removes all HTML tags
 * For text that will be displayed in UI
 */
export function sanitizeHtml(html: string): string {
  if (!html) return html
  
  // Remove all HTML tags
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/**
 * Sanitize text input
 * Removes HTML, trims, normalizes whitespace
 */
export function sanitizeText(text: string): string {
  if (!text) return text
  
  return sanitizeHtml(text)
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
}

/**
 * Normalize phone number to E.164 format
 * Input: Any phone format
 * Output: +1234567890 (E.164)
 * 
 * Supports all international numbers (Italian, Swiss, European, etc.)
 * Does not assume US format - requires proper E.164 format from source
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  // Remove leading zeros after country code
  cleaned = cleaned.replace(/^\+0+/, '+')
  
  // If already in E.164 format (starts with +), validate and return
  if (cleaned.startsWith('+')) {
    // Validate E.164 format: +[1-9][0-9]{1,14}
    const e164Regex = /^\+[1-9]\d{1,14}$/
    if (e164Regex.test(cleaned)) {
      return cleaned
    }
    // Invalid E.164 format
    return null
  }
  
  // If no + prefix, we can't determine country code reliably
  // Only attempt US format if it's clearly a US number (11 digits starting with 1)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    cleaned = '+' + cleaned
    const e164Regex = /^\+[1-9]\d{1,14}$/
    if (e164Regex.test(cleaned)) {
      return cleaned
    }
  }
  
  // For all other cases without +, return null
  // n8n should format numbers to E.164 before sending to CONNEXT AI
  return null
}

/**
 * Mask phone number for display
 * Shows only last 4 digits: +1********1234
 */
export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  
  if (phone.length <= 4) return phone
  
  const last4 = phone.slice(-4)
  const masked = phone.slice(0, -4).replace(/./g, '*')
  return masked + last4
}

/**
 * Sanitize URL
 * Validates and sanitizes URLs
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null
  
  try {
    const parsed = new URL(url)
    
    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }
    
    return parsed.toString()
  } catch {
    return null
  }
}

/**
 * Sanitize JSON data
 * Removes dangerous keys and validates structure
 */
export function sanitizeJsonData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data
  }
  
  const dangerousKeys = ['__proto__', 'constructor', 'prototype']
  const sanitized: any = Array.isArray(data) ? [] : {}
  
  for (const [key, value] of Object.entries(data)) {
    // Skip dangerous keys
    if (dangerousKeys.includes(key)) {
      continue
    }
    
    // Recursively sanitize nested objects
    if (value && typeof value === 'object') {
      sanitized[key] = sanitizeJsonData(value)
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

