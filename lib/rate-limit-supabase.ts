import { createClient } from '@/lib/supabase/server'

export interface RateLimitResult {
  allowed: boolean
  count: number
  limit: number
  remaining: number
  resetAt: Date
}

/**
 * Check rate limit using Supabase PostgreSQL
 * @param identifier - User ID, IP address, or agent secret
 * @param endpoint - Endpoint name (e.g., 'agent_creation', 'webhook_ingest')
 * @param maxRequests - Maximum requests allowed
 * @param windowMinutes - Time window in minutes
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowMinutes: number
): Promise<RateLimitResult> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_minutes: windowMinutes,
    })
    
    if (error) {
      console.error('Rate limit check error:', error)
      // Fail open - allow request if rate limit check fails
      return {
        allowed: true,
        count: 0,
        limit: maxRequests,
        remaining: maxRequests,
        resetAt: new Date(Date.now() + windowMinutes * 60 * 1000),
      }
    }
    
    return {
      allowed: data.allowed as boolean,
      count: data.count as number,
      limit: data.limit as number,
      remaining: data.remaining as number,
      resetAt: new Date(data.reset_at as string),
    }
  } catch (error) {
    console.error('Rate limit exception:', error)
    // Fail open on exception
    return {
      allowed: true,
      count: 0,
      limit: maxRequests,
      remaining: maxRequests,
      resetAt: new Date(Date.now() + windowMinutes * 60 * 1000),
    }
  }
}

// Predefined rate limiters for different endpoints
export const rateLimiters = {
  // Agent creation: 3 per hour per user
  agentCreation: (userId: string) => 
    checkRateLimit(userId, 'agent_creation', 3, 60),
  
  // Webhook ingest: 100 per minute per agent
  webhookIngest: (agentSecret: string) => 
    checkRateLimit(agentSecret, 'webhook_ingest', 100, 1),
  
  // General API: 30 per minute per user
  apiGeneral: (userId: string) => 
    checkRateLimit(userId, 'api_general', 30, 1),
  
  // Authentication: 5 per 15 minutes per IP
  auth: (ipAddress: string) => 
    checkRateLimit(ipAddress, 'auth', 5, 15),
}

