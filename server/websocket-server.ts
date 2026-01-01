/**
 * Standalone WebSocket Server for Twilio Media Streams + OpenAI Realtime API
 * 
 * Run this server separately from your Next.js app:
 *   npm run ws-server
 * 
 * Or use: node server/websocket-server.js
 * 
 * Make sure to set environment variables:
 *   - OPENAI_API_KEY
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import WebSocket from 'ws'
import { createServer } from 'http'
import { URL } from 'url'
import { handleTwilioMediaStream } from '../lib/twilio/realtime-bridge'
import { createClient } from '@supabase/supabase-js'

const PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 8080

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Create HTTP server
const server = createServer()

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  path: '/media',
})

wss.on('connection', async (ws: WebSocket, req) => {
  console.log('[WebSocket Server] New connection from:', req.socket.remoteAddress)

  try {
    // Parse query parameters
    const url = new URL(req.url || '', `http://${req.headers.host}`)
    const agentId = url.searchParams.get('agent_id')
    const callSid = url.searchParams.get('call_sid')

    if (!agentId || !callSid) {
      console.error('[WebSocket Server] Missing agent_id or call_sid')
      ws.close(1008, 'Missing agent_id or call_sid')
      return
    }

    // Get agent configuration
    const { data: agent, error } = await supabase
      .from('agents')
      .select('id, system_prompt, voice_id')
      .eq('id', agentId)
      .eq('provider_type', 'twilio')
      .single()

    if (error || !agent) {
      console.error('[WebSocket Server] Agent not found:', agentId)
      ws.close(1008, 'Agent not found')
      return
    }

    // Start the real-time bridge
    await handleTwilioMediaStream(ws, {
      agentId: agent.id,
      callSid,
      systemPrompt: agent.system_prompt || 'You are a helpful AI assistant.',
      voiceId: agent.voice_id || undefined,
    })

    console.log('[WebSocket Server] Bridge established for:', { agentId, callSid })
  } catch (error) {
    console.error('[WebSocket Server] Connection error:', error)
    ws.close(1011, 'Internal server error')
  }
})

server.listen(PORT, () => {
  console.log(`[WebSocket Server] Listening on ws://localhost:${PORT}/media`)
  console.log('[WebSocket Server] Ready to accept Twilio Media Stream connections')
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[WebSocket Server] SIGTERM received, closing server...')
  wss.close(() => {
    server.close(() => {
      console.log('[WebSocket Server] Server closed')
      process.exit(0)
    })
  })
})

