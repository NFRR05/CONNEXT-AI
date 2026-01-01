/**
 * Twilio Media Streams + OpenAI Realtime API Bridge
 * 
 * This module handles real-time bidirectional audio streaming between
 * Twilio Media Streams and OpenAI Realtime API.
 */

import WebSocket from 'ws'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface RealtimeBridgeConfig {
  agentId: string
  callSid: string
  systemPrompt: string
  voiceId?: string
}

/**
 * Handle Twilio Media Stream WebSocket connection
 */
export async function handleTwilioMediaStream(
  twilioWs: WebSocket,
  config: RealtimeBridgeConfig
) {
  console.log('[Realtime Bridge] Starting bridge for:', {
    agentId: config.agentId,
    callSid: config.callSid,
  })

  // Connect to OpenAI Realtime API
  const openaiWs = await connectToOpenAIRealtime(config)

  // Handle messages from Twilio → OpenAI
  twilioWs.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString())
      
      if (message.event === 'media') {
        // Decode base64 audio from Twilio (mu-law)
        const audioPayload = message.media.payload
        const audioBuffer = Buffer.from(audioPayload, 'base64')
        
        // Convert mu-law to PCM (OpenAI expects PCM)
        const pcmAudio = convertMulawToPcm(audioBuffer)
        
        // Send to OpenAI Realtime API
        sendAudioToOpenAI(openaiWs, pcmAudio)
      } else if (message.event === 'start') {
        console.log('[Realtime Bridge] Twilio stream started')
        // Record stream session
        supabase.from('twilio_media_streams').insert({
          call_sid: config.callSid,
          stream_sid: message.streamSid,
          status: 'connected',
        }).catch(console.error)
      } else if (message.event === 'stop') {
        console.log('[Realtime Bridge] Twilio stream stopped')
        openaiWs.close()
        twilioWs.close()
        
        // Update stream session
        supabase.from('twilio_media_streams')
          .update({ status: 'disconnected', disconnected_at: new Date().toISOString() })
          .eq('call_sid', config.callSid)
          .catch(console.error)
      }
    } catch (error) {
      console.error('[Realtime Bridge] Error processing Twilio message:', error)
    }
  })

  // Handle messages from OpenAI → Twilio
  openaiWs.on('message', (data: string) => {
    try {
      const message = JSON.parse(data)
      
      if (message.type === 'response.audio.delta') {
        // Get audio delta from OpenAI (base64 encoded PCM16)
        const audioBase64 = message.delta
        
        if (audioBase64) {
          // Convert PCM to mu-law (Twilio expects mu-law)
          const pcmAudio = Buffer.from(audioBase64, 'base64')
          const mulawAudio = convertPcmToMulaw(pcmAudio)
          
          // Send to Twilio
          sendAudioToTwilio(twilioWs, mulawAudio)
        }
      } else if (message.type === 'response.audio_transcript.delta') {
        // Log transcript for debugging
        if (message.delta) {
          process.stdout.write(message.delta)
        }
      } else if (message.type === 'response.audio_transcript.done') {
        // Full transcript received
        console.log('\n[Realtime Bridge] Full transcript:', message.transcript)
      } else if (message.type === 'error') {
        console.error('[Realtime Bridge] OpenAI error:', message.error)
      }
    } catch (error) {
      console.error('[Realtime Bridge] Error processing OpenAI message:', error)
    }
  })

  // Handle errors
  twilioWs.on('error', (error) => {
    console.error('[Realtime Bridge] Twilio WebSocket error:', error)
    openaiWs.close()
  })

  openaiWs.on('error', (error) => {
    console.error('[Realtime Bridge] OpenAI WebSocket error:', error)
    twilioWs.close()
  })

  // Handle close
  twilioWs.on('close', () => {
    console.log('[Realtime Bridge] Twilio WebSocket closed')
    openaiWs.close()
  })

  openaiWs.on('close', () => {
    console.log('[Realtime Bridge] OpenAI WebSocket closed')
    twilioWs.close()
  })
}

/**
 * Connect to OpenAI Realtime API
 */
async function connectToOpenAIRealtime(config: RealtimeBridgeConfig): Promise<WebSocket> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  // OpenAI Realtime API WebSocket URL
  // Using the latest stable model - check OpenAI docs for current version
  const wsUrl = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17'
  
  const ws = new WebSocket(wsUrl, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'OpenAI-Beta': 'realtime=v1',
    },
  })

  return new Promise((resolve, reject) => {
    ws.on('open', () => {
      console.log('[Realtime Bridge] Connected to OpenAI Realtime API')
      
      // Send session configuration
      const sessionConfig = {
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: config.systemPrompt,
          voice: config.voiceId || 'alloy',
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1',
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
        },
      }
      
      ws.send(JSON.stringify(sessionConfig))
      
      // Start the conversation
      ws.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_audio',
              audio: '', // Will be filled with audio data
            },
          ],
        },
      }))
      
      resolve(ws)
    })

    ws.on('error', (error) => {
      console.error('[Realtime Bridge] OpenAI connection error:', error)
      reject(error)
    })
  })
}

/**
 * Send audio to OpenAI Realtime API
 */
function sendAudioToOpenAI(ws: WebSocket, audioBuffer: Buffer) {
  // Convert to base64
  const base64Audio = audioBuffer.toString('base64')
  
  // Send as audio input
  ws.send(JSON.stringify({
    type: 'input_audio_buffer.append',
    audio: base64Audio,
  }))
  
  // Trigger processing
  ws.send(JSON.stringify({
    type: 'input_audio_buffer.commit',
  }))
}

/**
 * Send audio to Twilio
 */
function sendAudioToTwilio(ws: WebSocket, audioBuffer: Buffer) {
  const base64Audio = audioBuffer.toString('base64')
  
  const message = {
    event: 'media',
    streamSid: '', // Will be set by Twilio
    media: {
      payload: base64Audio,
    },
  }
  
  ws.send(JSON.stringify(message))
}

/**
 * Convert mu-law (Twilio format) to PCM16 (OpenAI format)
 */
function convertMulawToPcm(mulawBuffer: Buffer): Buffer {
  // mu-law to linear PCM conversion
  const pcmBuffer = Buffer.alloc(mulawBuffer.length * 2)
  
  for (let i = 0; i < mulawBuffer.length; i++) {
    const mulawByte = mulawBuffer[i]
    const sign = (mulawByte & 0x80) ? -1 : 1
    const exponent = (mulawByte & 0x70) >> 4
    const mantissa = (mulawByte & 0x0F) | 0x10
    
    let sample = mantissa << (exponent + 2)
    sample = (sample - 33) * sign
    
    // Convert to 16-bit PCM
    const pcmValue = Math.max(-32768, Math.min(32767, sample * 256))
    pcmBuffer.writeInt16LE(pcmValue, i * 2)
  }
  
  return pcmBuffer
}

/**
 * Convert PCM16 (OpenAI format) to mu-law (Twilio format)
 */
function convertPcmToMulaw(pcmBuffer: Buffer): Buffer {
  const mulawBuffer = Buffer.alloc(pcmBuffer.length / 2)
  
  for (let i = 0; i < mulawBuffer.length; i++) {
    const pcmValue = pcmBuffer.readInt16LE(i * 2)
    const sign = pcmValue < 0 ? 0x80 : 0x00
    const magnitude = Math.abs(pcmValue)
    
    // Find exponent
    let exponent = 7
    let temp = magnitude >> 7
    while (temp > 0 && exponent > 0) {
      temp >>= 1
      exponent--
    }
    
    // Calculate mantissa
    const mantissa = (magnitude >> (exponent + 3)) & 0x0F
    
    // Combine into mu-law byte
    mulawBuffer[i] = sign | (exponent << 4) | mantissa
  }
  
  return mulawBuffer
}

