/**
 * Twilio Webhook Signature Verification
 * 
 * Verifies that webhook requests are actually from Twilio.
 * Prevents spoofed webhook attacks.
 */

import twilio from 'twilio'
import { NextRequest } from 'next/server'

/**
 * Verify Twilio webhook signature
 * Returns true if signature is valid, false otherwise
 */
export async function verifyTwilioRequest(
  request: NextRequest,
  authToken: string
): Promise<boolean> {
  try {
    const signature = request.headers.get('X-Twilio-Signature')
    
    if (!signature) {
      console.error('[Twilio Verification] Missing signature header')
      return false
    }
    
    // Clone the request so we can read the body without consuming it
    const clonedRequest = request.clone()
    
    // Get form data from cloned request (original request body remains intact)
    const formData = await clonedRequest.formData()
    const params: Record<string, string> = {}
    
    // Convert FormData to object
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString()
    }
    
    // Construct the URL that Twilio used for signing
    // Use the host from headers (handles ngrok/proxy correctly)
    const protocol = request.headers.get('x-forwarded-proto') || 
                     (request.url.startsWith('https') ? 'https' : 'http')
    const host = request.headers.get('host') || 
                 request.headers.get('x-forwarded-host') ||
                 new URL(request.url).host
    
    // Build URL without query string (Twilio signs the path, not query params)
    const url = `${protocol}://${host}${request.nextUrl.pathname}`
    
    // Verify signature
    const isValid = twilio.validateRequest(authToken, signature, url, params)
    
    if (!isValid) {
      console.error('[Twilio Verification] Invalid signature', {
        url,
        hasSignature: !!signature,
        paramCount: Object.keys(params).length,
        protocol,
        host,
      })
    }
    
    return isValid
  } catch (error) {
    console.error('[Twilio Verification] Verification error:', error)
    return false
  }
}

/**
 * Verify Twilio webhook for JSON payloads
 */
export async function verifyTwilioJsonRequest(
  request: NextRequest,
  authToken: string
): Promise<boolean> {
  try {
    const signature = request.headers.get('X-Twilio-Signature')
    
    if (!signature) {
      return false
    }
    
    // Clone the request so we can read the body without consuming it
    const clonedRequest = request.clone()
    const body = await clonedRequest.json()
    
    // Construct the URL that Twilio used for signing
    const protocol = request.headers.get('x-forwarded-proto') || 
                     (request.url.startsWith('https') ? 'https' : 'http')
    const host = request.headers.get('host') || 
                 request.headers.get('x-forwarded-host') ||
                 new URL(request.url).host
    
    const url = `${protocol}://${host}${request.nextUrl.pathname}`
    
    // Convert JSON to URL-encoded format for verification
    const params: Record<string, string> = {}
    for (const [key, value] of Object.entries(body)) {
      params[key] = String(value)
    }
    
    return twilio.validateRequest(authToken, signature, url, params)
  } catch (error) {
    console.error('[Twilio Verification] JSON verification error:', error)
    return false
  }
}

