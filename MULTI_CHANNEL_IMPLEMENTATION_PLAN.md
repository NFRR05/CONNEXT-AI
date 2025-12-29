# Multi-Channel Support Implementation Plan

## Overview

This document provides a detailed, step-by-step implementation plan for adding multi-channel support to CONNEXT AI. This will enable AI agents to communicate with customers across WhatsApp, Instagram, Google Business Messages, and website chat while maintaining consistent personality and context.

**Priority**: Tier 1 (Critical)  
**Estimated Timeline**: 2-3 weeks for Phase 1 (WhatsApp), 4-6 weeks for all channels  
**Dependencies**: Existing agent system, Supabase database, Vapi.ai integration

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Phase 1: WhatsApp Integration](#phase-1-whatsapp-integration)
4. [Phase 2: Instagram Integration](#phase-2-instagram-integration)
5. [Phase 3: Google Business Messages](#phase-3-google-business-messages)
6. [Phase 4: Website Chat Widget](#phase-4-website-chat-widget)
7. [Phase 5: Cross-Channel Context](#phase-5-cross-channel-context)
8. [Testing Strategy](#testing-strategy)
9. [Security & Compliance](#security--compliance)
10. [Deployment Checklist](#deployment-checklist)

---

## Architecture Overview

### System Flow

```
Incoming Message Flow:
┌─────────────┐
│   Channel   │ (WhatsApp/Instagram/Google/Website)
│   Platform  │
└──────┬──────┘
       │ Webhook
       ↓
┌─────────────────────────────────────┐
│  Webhook Handler                    │
│  /api/webhooks/{channel}            │
│  - Verify signature                 │
│  - Extract message data             │
│  - Identify customer                │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│  Message Router                     │
│  lib/channels/router.ts             │
│  - Find/create conversation         │
│  - Load context                    │
│  - Route to AI agent               │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│  AI Agent (Vapi/OpenAI)             │
│  - Process with context             │
│  - Generate response                │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│  Response Router                    │
│  - Format for channel               │
│  - Send via channel API             │
│  - Store in database                │
└─────────────────────────────────────┘
```

### Key Components

1. **Channel Adapters** (`lib/channels/`)
   - `whatsapp.ts` - WhatsApp Business API integration
   - `instagram.ts` - Instagram Graph API integration
   - `google.ts` - Google Business Messages API integration
   - `website.ts` - Website chat widget handler
   - `base.ts` - Base channel interface

2. **Message Router** (`lib/channels/router.ts`)
   - Unified message routing
   - Customer identification
   - Context management

3. **Webhook Handlers** (`app/api/webhooks/`)
   - `whatsapp/route.ts`
   - `instagram/route.ts`
   - `google/route.ts`
   - `website/route.ts`

4. **API Routes** (`app/api/`)
   - `channels/route.ts` - Channel management
   - `conversations/route.ts` - Conversation management
   - `messages/route.ts` - Message operations

5. **Frontend Components** (`app/(dashboard)/channels/`)
   - Channel list page
   - Channel setup wizard
   - Conversation viewer
   - Chat widget component

---

## Database Schema

### Migration File: `supabase/migrations/001_multi_channel.sql`

```sql
-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CHANNELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('whatsapp', 'instagram', 'google', 'website', 'sms', 'email')),
  channel_id TEXT NOT NULL, -- External channel ID (e.g., WhatsApp Business Account ID)
  credentials JSONB NOT NULL, -- Encrypted API keys/tokens
  is_active BOOLEAN DEFAULT true,
  webhook_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb, -- Channel-specific settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(agent_id, channel_type)
);

CREATE INDEX idx_channels_agent_id ON channels(agent_id);
CREATE INDEX idx_channels_channel_type ON channels(channel_type);
CREATE INDEX idx_channels_is_active ON channels(is_active);

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  customer_identifier TEXT NOT NULL, -- Phone, email, or platform user ID
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  metadata JSONB DEFAULT '{}'::jsonb, -- Channel-specific metadata
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX idx_conversations_channel_id ON conversations(channel_id);
CREATE INDEX idx_conversations_customer_identifier ON conversations(customer_identifier);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'video', 'file', 'location', 'button', 'template')),
  external_message_id TEXT, -- ID from channel platform
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional message data (media URLs, buttons, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_direction ON messages(direction);
CREATE INDEX idx_messages_external_message_id ON messages(external_message_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Channels policies
CREATE POLICY "Users can view channels for own agents"
  ON channels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = channels.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create channels for own agents"
  ON channels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = channels.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update channels for own agents"
  ON channels FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = channels.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete channels for own agents"
  ON channels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = channels.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Conversations policies
CREATE POLICY "Users can view conversations for own agents"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = conversations.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert conversations"
  ON conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update conversations for own agents"
  ON conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = conversations.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY "Users can view messages for own agents"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN agents ON agents.id = conversations.agent_id
      WHERE conversations.id = messages.conversation_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert messages"
  ON messages FOR INSERT
  WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp for channels
CREATE TRIGGER update_channels_updated_at
  BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Update updated_at timestamp for conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Update conversation last_message_at when message is inserted
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_last_message_at
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();
```

### Run Migration

```bash
# Apply migration to Supabase
# Option 1: Via Supabase Dashboard SQL Editor
# Option 2: Via Supabase CLI
supabase db push
```

---

## Phase 1: WhatsApp Integration

### Step 1.1: Install Dependencies

**File**: `package.json`

Add dependencies:
```json
{
  "dependencies": {
    "@whatsapp/business-api": "^1.0.0", // or use axios for direct API calls
    "crypto": "^1.0.1" // For webhook signature verification
  }
}
```

Run:
```bash
npm install
```

### Step 1.2: Create Base Channel Interface

**File**: `lib/channels/base.ts`

```typescript
export interface ChannelMessage {
  id: string
  from: string // Customer identifier (phone, user ID, etc.)
  content: string
  messageType: 'text' | 'image' | 'audio' | 'video' | 'file' | 'location' | 'button'
  metadata?: Record<string, any>
  timestamp: Date
}

export interface ChannelResponse {
  success: boolean
  messageId?: string
  error?: string
}

export interface ChannelConfig {
  credentials: Record<string, any>
  settings?: Record<string, any>
}

export abstract class BaseChannel {
  protected config: ChannelConfig
  protected agentId: string

  constructor(agentId: string, config: ChannelConfig) {
    this.agentId = agentId
    this.config = config
  }

  abstract sendMessage(to: string, content: string, options?: any): Promise<ChannelResponse>
  abstract handleWebhook(payload: any): Promise<ChannelMessage | null>
  abstract verifyWebhook(payload: any, signature: string): Promise<boolean>
  
  // Helper method to format message for channel
  protected formatMessage(content: string, options?: any): string {
    // Default implementation - can be overridden
    return content
  }
}
```

### Step 1.3: Create WhatsApp Channel Adapter

**File**: `lib/channels/whatsapp.ts`

```typescript
import { BaseChannel, ChannelMessage, ChannelResponse, ChannelConfig } from './base'
import axios from 'axios'

interface WhatsAppCredentials {
  accessToken: string
  phoneNumberId: string
  businessAccountId: string
  appSecret: string // For webhook verification
  verifyToken: string // For webhook verification
}

export class WhatsAppChannel extends BaseChannel {
  private apiUrl = 'https://graph.facebook.com/v18.0'
  private credentials: WhatsAppCredentials

  constructor(agentId: string, config: ChannelConfig) {
    super(agentId, config)
    this.credentials = config.credentials as WhatsAppCredentials
  }

  /**
   * Send a text message via WhatsApp Business API
   */
  async sendMessage(
    to: string,
    content: string,
    options?: {
      template?: string
      buttons?: Array<{ id: string; title: string }>
      media?: { type: 'image' | 'video' | 'document'; url: string }
    }
  ): Promise<ChannelResponse> {
    try {
      const url = `${this.apiUrl}/${this.credentials.phoneNumberId}/messages`
      
      let payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to.replace(/\D/g, ''), // Remove non-digits
      }

      if (options?.template) {
        // Use template message
        payload.type = 'template'
        payload.template = {
          name: options.template,
          language: { code: 'en' }
        }
      } else if (options?.buttons && options.buttons.length > 0) {
        // Interactive message with buttons
        payload.type = 'interactive'
        payload.interactive = {
          type: 'button',
          body: { text: content },
          action: {
            buttons: options.buttons.map(btn => ({
              type: 'reply',
              reply: {
                id: btn.id,
                title: btn.title
              }
            }))
          }
        }
      } else if (options?.media) {
        // Media message
        payload.type = options.media.type
        payload[options.media.type] = {
          link: options.media.url
        }
      } else {
        // Plain text message
        payload.type = 'text'
        payload.text = { body: content }
      }

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      return {
        success: true,
        messageId: response.data.messages[0]?.id
      }
    } catch (error: any) {
      console.error('[WhatsApp] Error sending message:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      }
    }
  }

  /**
   * Handle incoming webhook payload from WhatsApp
   */
  async handleWebhook(payload: any): Promise<ChannelMessage | null> {
    try {
      const entry = payload.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value

      // Handle message status updates (delivered, read, etc.)
      if (value?.statuses) {
        // We can track message status but don't create a message
        return null
      }

      // Handle incoming messages
      const message = value?.messages?.[0]
      if (!message) {
        return null
      }

      const from = message.from
      let content = ''
      let messageType: ChannelMessage['messageType'] = 'text'
      const metadata: Record<string, any> = {
        messageId: message.id,
        timestamp: message.timestamp
      }

      // Extract content based on message type
      if (message.type === 'text') {
        content = message.text.body
        messageType = 'text'
      } else if (message.type === 'image') {
        content = message.image.caption || ''
        messageType = 'image'
        metadata.mediaUrl = message.image.id
        metadata.mimeType = message.image.mime_type
      } else if (message.type === 'audio') {
        content = 'Audio message'
        messageType = 'audio'
        metadata.mediaUrl = message.audio.id
        metadata.mimeType = message.audio.mime_type
      } else if (message.type === 'video') {
        content = message.video.caption || ''
        messageType = 'video'
        metadata.mediaUrl = message.video.id
        metadata.mimeType = message.video.mime_type
      } else if (message.type === 'document') {
        content = message.document.caption || message.document.filename || ''
        messageType = 'file'
        metadata.mediaUrl = message.document.id
        metadata.mimeType = message.document.mime_type
        metadata.filename = message.document.filename
      } else if (message.type === 'location') {
        content = 'Location shared'
        messageType = 'location'
        metadata.latitude = message.location.latitude
        metadata.longitude = message.location.longitude
      } else if (message.type === 'interactive') {
        // Button response
        const buttonResponse = message.interactive?.button_reply
        if (buttonResponse) {
          content = buttonResponse.title
          messageType = 'button'
          metadata.buttonId = buttonResponse.id
        }
      } else {
        // Unknown message type
        return null
      }

      return {
        id: message.id,
        from: from,
        content: content,
        messageType: messageType,
        metadata: metadata,
        timestamp: new Date(parseInt(message.timestamp) * 1000)
      }
    } catch (error) {
      console.error('[WhatsApp] Error handling webhook:', error)
      return null
    }
  }

  /**
   * Verify webhook signature from WhatsApp
   */
  async verifyWebhook(payload: any, signature: string): Promise<boolean> {
    // WhatsApp webhook verification uses HMAC SHA256
    const crypto = require('crypto')
    const hmac = crypto.createHmac('sha256', this.credentials.appSecret)
    hmac.update(JSON.stringify(payload))
    const calculatedSignature = hmac.digest('hex')
    
    return calculatedSignature === signature
  }

  /**
   * Verify webhook challenge (for initial setup)
   */
  verifyChallenge(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.credentials.verifyToken) {
      return challenge
    }
    return null
  }
}
```

### Step 1.4: Create Message Router

**File**: `lib/channels/router.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { WhatsAppChannel } from './whatsapp'
import { BaseChannel, ChannelMessage } from './base'
import { generateAgentResponse } from './agent-handler'

export interface ChannelFactory {
  createChannel(agentId: string, channelType: string, config: any): BaseChannel
}

export class MessageRouter {
  /**
   * Process incoming message from any channel
   */
  static async processIncomingMessage(
    agentId: string,
    channelType: string,
    message: ChannelMessage
  ) {
    console.log(`[MessageRouter] Processing ${channelType} message from ${message.from}`)

    const supabase = await createClient()

    // 1. Find or create channel
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('*')
      .eq('agent_id', agentId)
      .eq('channel_type', channelType)
      .single()

    if (channelError || !channel) {
      console.error('[MessageRouter] Channel not found:', channelError)
      throw new Error('Channel not found')
    }

    // 2. Find or create conversation
    let conversation
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('agent_id', agentId)
      .eq('channel_id', channel.id)
      .eq('customer_identifier', message.from)
      .eq('status', 'active')
      .single()

    if (existingConversation) {
      conversation = existingConversation
    } else {
      // Create new conversation
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          agent_id: agentId,
          channel_id: channel.id,
          customer_identifier: message.from,
          customer_phone: message.from, // For WhatsApp, from is phone number
          status: 'active',
          last_message_at: message.timestamp
        })
        .select()
        .single()

      if (convError) {
        console.error('[MessageRouter] Error creating conversation:', convError)
        throw new Error('Failed to create conversation')
      }
      conversation = newConversation
    }

    // 3. Store incoming message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        channel_id: channel.id,
        direction: 'inbound',
        content: message.content,
        message_type: message.messageType,
        external_message_id: message.id,
        metadata: message.metadata || {}
      })

    if (messageError) {
      console.error('[MessageRouter] Error storing message:', messageError)
    }

    // 4. Get conversation history for context
    const { data: history } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(20) // Last 20 messages for context

    // 5. Generate AI response
    const response = await generateAgentResponse(
      agentId,
      message.content,
      history || [],
      conversation
    )

    // 6. Send response via channel
    const channelInstance = this.createChannelInstance(channelType, agentId, {
      credentials: channel.credentials,
      settings: channel.settings
    })

    const sendResult = await channelInstance.sendMessage(
      message.from,
      response.content,
      response.options
    )

    // 7. Store outbound message
    if (sendResult.success && sendResult.messageId) {
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          channel_id: channel.id,
          direction: 'outbound',
          content: response.content,
          message_type: 'text',
          external_message_id: sendResult.messageId,
          metadata: response.options || {}
        })
    }

    return {
      success: true,
      conversationId: conversation.id,
      messageId: sendResult.messageId
    }
  }

  /**
   * Create channel instance based on type
   */
  private static createChannelInstance(
    channelType: string,
    agentId: string,
    config: any
  ): BaseChannel {
    switch (channelType) {
      case 'whatsapp':
        return new WhatsAppChannel(agentId, config)
      case 'instagram':
        // TODO: Implement in Phase 2
        throw new Error('Instagram channel not yet implemented')
      case 'google':
        // TODO: Implement in Phase 3
        throw new Error('Google channel not yet implemented')
      case 'website':
        // TODO: Implement in Phase 4
        throw new Error('Website channel not yet implemented')
      default:
        throw new Error(`Unknown channel type: ${channelType}`)
    }
  }
}

/**
 * Generate AI agent response
 */
async function generateAgentResponse(
  agentId: string,
  userMessage: string,
  history: any[],
  conversation: any
): Promise<{ content: string; options?: any }> {
  // Get agent configuration
  const supabase = await createClient()
  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single()

  if (!agent) {
    throw new Error('Agent not found')
  }

  // Build conversation context
  const context = history
    .map(msg => `${msg.direction === 'inbound' ? 'Customer' : 'Agent'}: ${msg.content}`)
    .join('\n')

  // Use OpenAI to generate response
  // This is a simplified version - you may want to use Vapi's API or OpenAI directly
  const { generateAgentResponse: generateResponse } = await import('@/lib/openai/client')
  
  const response = await generateResponse({
    systemPrompt: agent.system_prompt || 'You are a helpful restaurant assistant.',
    userMessage: userMessage,
    context: context,
    conversationHistory: history
  })

  return {
    content: response.content,
    options: response.options
  }
}
```

### Step 1.5: Create WhatsApp Webhook Handler

**File**: `app/api/webhooks/whatsapp/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { WhatsAppChannel } from '@/lib/channels/whatsapp'
import { MessageRouter } from '@/lib/channels/router'
import { createClient } from '@/lib/supabase/server'

/**
 * GET: Webhook verification (required by WhatsApp)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Get verify token from environment or database
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp Webhook] Verification successful')
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

/**
 * POST: Handle incoming messages
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const signature = request.headers.get('x-hub-signature-256') || ''

    console.log('[WhatsApp Webhook] Received payload:', JSON.stringify(payload, null, 2))

    // Verify webhook signature
    // Note: You'll need to get the channel config to verify
    // For now, we'll skip verification in development
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement signature verification
    }

    const entry = payload.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    // Handle webhook verification
    if (value?.statuses) {
      // Message status update (delivered, read, etc.)
      console.log('[WhatsApp Webhook] Message status update')
      return NextResponse.json({ success: true })
    }

    // Handle incoming messages
    const message = value?.messages?.[0]
    if (!message) {
      return NextResponse.json({ success: true })
    }

    // Get phone number ID to find the channel
    const phoneNumberId = value.metadata?.phone_number_id
    if (!phoneNumberId) {
      console.error('[WhatsApp Webhook] No phone number ID in payload')
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Find channel by phone number ID
    const supabase = await createClient()
    const { data: channel } = await supabase
      .from('channels')
      .select('*, agents(*)')
      .eq('channel_type', 'whatsapp')
      .eq('is_active', true)
      .contains('credentials', { phoneNumberId })
      .single()

    if (!channel) {
      console.error('[WhatsApp Webhook] Channel not found for phone number:', phoneNumberId)
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Create WhatsApp channel instance
    const whatsappChannel = new WhatsAppChannel(channel.agent_id, {
      credentials: channel.credentials,
      settings: channel.settings
    })

    // Process webhook payload
    const channelMessage = await whatsappChannel.handleWebhook(payload)
    
    if (!channelMessage) {
      // Not a message we need to process
      return NextResponse.json({ success: true })
    }

    // Route message to agent
    await MessageRouter.processIncomingMessage(
      channel.agent_id,
      'whatsapp',
      channelMessage
    )

    // WhatsApp requires 200 response within 20 seconds
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[WhatsApp Webhook] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Step 1.6: Create Channel Management API

**File**: `app/api/channels/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * GET: List all channels for user's agents
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const agentId = searchParams.get('agent_id')

    let query = supabase
      .from('channels')
      .select('*, agents(*)')
      .eq('agents.user_id', user.id)

    if (agentId) {
      query = query.eq('agent_id', agentId)
    }

    const { data: channels, error } = await query

    if (error) {
      console.error('[Channels API] Error fetching channels:', error)
      return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 })
    }

    // Remove sensitive credentials from response
    const sanitizedChannels = channels?.map(channel => ({
      ...channel,
      credentials: undefined // Don't expose credentials
    }))

    return NextResponse.json({ channels: sanitizedChannels })
  } catch (error: any) {
    console.error('[Channels API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST: Create a new channel
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { agent_id, channel_type, credentials, settings } = body

    // Validate required fields
    if (!agent_id || !channel_type || !credentials) {
      return NextResponse.json(
        { error: 'Missing required fields: agent_id, channel_type, credentials' },
        { status: 400 }
      )
    }

    // Verify user owns the agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agent_id)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Validate channel type
    const validTypes = ['whatsapp', 'instagram', 'google', 'website', 'sms', 'email']
    if (!validTypes.includes(channel_type)) {
      return NextResponse.json(
        { error: `Invalid channel_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if channel already exists for this agent
    const { data: existing } = await supabase
      .from('channels')
      .select('id')
      .eq('agent_id', agent_id)
      .eq('channel_type', channel_type)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Channel already exists for this agent' },
        { status: 409 }
      )
    }

    // Encrypt credentials (simplified - use proper encryption in production)
    // TODO: Implement proper encryption using crypto or a service like AWS KMS
    const encryptedCredentials = encryptCredentials(credentials)

    // Generate webhook URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'
    const webhookUrl = `${baseUrl}/api/webhooks/${channel_type}`

    // Extract channel ID from credentials (varies by channel type)
    let channelId = ''
    if (channel_type === 'whatsapp') {
      channelId = credentials.phoneNumberId || ''
    } else if (channel_type === 'instagram') {
      channelId = credentials.pageId || ''
    } else if (channel_type === 'google') {
      channelId = credentials.locationId || ''
    }

    // Create channel
    const { data: channel, error: createError } = await supabase
      .from('channels')
      .insert({
        agent_id: agent_id,
        channel_type: channel_type,
        channel_id: channelId,
        credentials: encryptedCredentials,
        settings: settings || {},
        webhook_url: webhookUrl,
        is_active: true
      })
      .select()
      .single()

    if (createError) {
      console.error('[Channels API] Error creating channel:', createError)
      return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 })
    }

    // Return channel without credentials
    const { credentials: _, ...channelResponse } = channel
    return NextResponse.json({ channel: channelResponse }, { status: 201 })
  } catch (error: any) {
    console.error('[Channels API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Helper function to encrypt credentials
 * TODO: Implement proper encryption
 */
function encryptCredentials(credentials: any): any {
  // For now, just return as-is
  // In production, use proper encryption (AES-256-GCM, AWS KMS, etc.)
  return credentials
}
```

**File**: `app/api/channels/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET: Get channel details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: channel, error } = await supabase
      .from('channels')
      .select('*, agents(*)')
      .eq('id', params.id)
      .eq('agents.user_id', user.id)
      .single()

    if (error || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Remove credentials
    const { credentials: _, ...channelResponse } = channel
    return NextResponse.json({ channel: channelResponse })
  } catch (error: any) {
    console.error('[Channels API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH: Update channel
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns the channel
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('*, agents(*)')
      .eq('id', params.id)
      .eq('agents.user_id', user.id)
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const body = await request.json()
    const updates: any = {}

    if (body.settings !== undefined) {
      updates.settings = body.settings
    }
    if (body.is_active !== undefined) {
      updates.is_active = body.is_active
    }
    if (body.credentials !== undefined) {
      // Encrypt new credentials
      updates.credentials = encryptCredentials(body.credentials)
    }

    const { data: updatedChannel, error: updateError } = await supabase
      .from('channels')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('[Channels API] Error updating channel:', updateError)
      return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 })
    }

    const { credentials: _, ...channelResponse } = updatedChannel
    return NextResponse.json({ channel: channelResponse })
  } catch (error: any) {
    console.error('[Channels API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE: Delete channel
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns the channel
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('*, agents(*)')
      .eq('id', params.id)
      .eq('agents.user_id', user.id)
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from('channels')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('[Channels API] Error deleting channel:', deleteError)
      return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Channels API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function encryptCredentials(credentials: any): any {
  return credentials // TODO: Implement proper encryption
}
```

### Step 1.7: Create Frontend - Channel List Page

**File**: `app/(dashboard)/channels/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, MessageSquare, Settings, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Channel {
  id: string
  channel_type: string
  is_active: boolean
  created_at: string
  agents: {
    id: string
    name: string
  }
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChannels()
  }, [])

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/channels')
      const data = await response.json()
      setChannels(data.channels || [])
    } catch (error) {
      console.error('Error fetching channels:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (channelId: string) => {
    if (!confirm('Are you sure you want to delete this channel?')) {
      return
    }

    try {
      const response = await fetch(`/api/channels/${channelId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchChannels()
      }
    } catch (error) {
      console.error('Error deleting channel:', error)
    }
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return '💬'
      case 'instagram':
        return '📷'
      case 'google':
        return '🔍'
      case 'website':
        return '🌐'
      default:
        return '💬'
    }
  }

  const getChannelName = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  if (loading) {
    return <div className="p-8">Loading channels...</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Channels</h1>
          <p className="text-muted-foreground mt-1">
            Manage your communication channels
          </p>
        </div>
        <Link href="/channels/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Channel
          </Button>
        </Link>
      </div>

      {channels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No channels yet</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Connect your first channel to start receiving messages
            </p>
            <Link href="/channels/create">
              <Button>Add Your First Channel</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel) => (
            <Card key={channel.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getChannelIcon(channel.channel_type)}</span>
                    <CardTitle>{getChannelName(channel.channel_type)}</CardTitle>
                  </div>
                  <Badge variant={channel.is_active ? 'default' : 'secondary'}>
                    {channel.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription>
                  Agent: {channel.agents?.name || 'Unknown'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/channels/${channel.id}`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(channel.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Step 1.8: Create Frontend - Channel Setup Wizard

**File**: `app/(dashboard)/channels/create/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function CreateChannelPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    agent_id: '',
    channel_type: '',
    // WhatsApp specific
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    appSecret: '',
    verifyToken: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const credentials = {
        accessToken: formData.accessToken,
        phoneNumberId: formData.phoneNumberId,
        businessAccountId: formData.businessAccountId,
        appSecret: formData.appSecret,
        verifyToken: formData.verifyToken
      }

      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agent_id: formData.agent_id,
          channel_type: formData.channel_type,
          credentials: credentials
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create channel')
      }

      router.push('/channels')
    } catch (error: any) {
      alert(error.message || 'Failed to create channel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Link href="/channels" className="flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Channels
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Connect a Channel</CardTitle>
          <CardDescription>
            Connect your WhatsApp Business account to start receiving messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Agent Selection */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="agent_id">Select Agent</Label>
                  <Select
                    value={formData.agent_id}
                    onValueChange={(value) => setFormData({ ...formData, agent_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* TODO: Fetch agents from API */}
                      <SelectItem value="agent-1">Agent 1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="channel_type">Channel Type</Label>
                  <Select
                    value={formData.channel_type}
                    onValueChange={(value) => setFormData({ ...formData, channel_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose channel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="instagram" disabled>Instagram (Coming Soon)</SelectItem>
                      <SelectItem value="google" disabled>Google Business (Coming Soon)</SelectItem>
                      <SelectItem value="website" disabled>Website Chat (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" onClick={() => setStep(2)} disabled={!formData.agent_id || !formData.channel_type}>
                  Next
                </Button>
              </div>
            )}

            {/* Step 2: WhatsApp Credentials */}
            {step === 2 && formData.channel_type === 'whatsapp' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="accessToken">Access Token</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    value={formData.accessToken}
                    onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                    placeholder="EAAxxxxxxxxxxxx"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Get this from your Meta App Dashboard
                  </p>
                </div>
                <div>
                  <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                  <Input
                    id="phoneNumberId"
                    value={formData.phoneNumberId}
                    onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                    placeholder="123456789012345"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="businessAccountId">Business Account ID</Label>
                  <Input
                    id="businessAccountId"
                    value={formData.businessAccountId}
                    onChange={(e) => setFormData({ ...formData, businessAccountId: e.target.value })}
                    placeholder="123456789012345"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="appSecret">App Secret</Label>
                  <Input
                    id="appSecret"
                    type="password"
                    value={formData.appSecret}
                    onChange={(e) => setFormData({ ...formData, appSecret: e.target.value })}
                    placeholder="xxxxxxxxxxxxxxxxxxxxx"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Used for webhook signature verification
                  </p>
                </div>
                <div>
                  <Label htmlFor="verifyToken">Verify Token</Label>
                  <Input
                    id="verifyToken"
                    value={formData.verifyToken}
                    onChange={(e) => setFormData({ ...formData, verifyToken: e.target.value })}
                    placeholder="my_verify_token"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    This will be used to verify your webhook
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Connect Channel
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## Phase 2: Instagram Integration

### Step 2.1: Create Instagram Channel Adapter

**File**: `lib/channels/instagram.ts`

```typescript
import { BaseChannel, ChannelMessage, ChannelResponse, ChannelConfig } from './base'
import axios from 'axios'

interface InstagramCredentials {
  accessToken: string
  pageId: string
  appSecret: string
  verifyToken: string
}

export class InstagramChannel extends BaseChannel {
  private apiUrl = 'https://graph.facebook.com/v18.0'
  private credentials: InstagramCredentials

  constructor(agentId: string, config: ChannelConfig) {
    super(agentId, config)
    this.credentials = config.credentials as InstagramCredentials
  }

  async sendMessage(recipientId: string, content: string, options?: any): Promise<ChannelResponse> {
    try {
      const url = `${this.apiUrl}/${this.credentials.pageId}/messages`
      
      const payload = {
        recipient: { id: recipientId },
        message: { text: content }
      }

      const response = await axios.post(url, payload, {
        params: {
          access_token: this.credentials.accessToken
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      return {
        success: true,
        messageId: response.data.message_id
      }
    } catch (error: any) {
      console.error('[Instagram] Error sending message:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      }
    }
  }

  async handleWebhook(payload: any): Promise<ChannelMessage | null> {
    try {
      const entry = payload.entry?.[0]
      const messaging = entry?.messaging?.[0]
      
      if (!messaging || !messaging.message) {
        return null
      }

      const message = messaging.message
      const senderId = messaging.sender.id

      return {
        id: message.mid,
        from: senderId,
        content: message.text || '',
        messageType: 'text',
        timestamp: new Date(messaging.timestamp)
      }
    } catch (error) {
      console.error('[Instagram] Error handling webhook:', error)
      return null
    }
  }

  async verifyWebhook(payload: any, signature: string): Promise<boolean> {
    const crypto = require('crypto')
    const hmac = crypto.createHmac('sha256', this.credentials.appSecret)
    hmac.update(JSON.stringify(payload))
    const calculatedSignature = hmac.digest('hex')
    return calculatedSignature === signature
  }
}
```

### Step 2.2: Create Instagram Webhook Handler

**File**: `app/api/webhooks/instagram/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { InstagramChannel } from '@/lib/channels/instagram'
import { MessageRouter } from '@/lib/channels/router'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const signature = request.headers.get('x-hub-signature-256') || ''

    // Find channel by page ID
    const entry = payload.entry?.[0]
    const pageId = entry?.id

    const supabase = await createClient()
    const { data: channel } = await supabase
      .from('channels')
      .select('*, agents(*)')
      .eq('channel_type', 'instagram')
      .eq('is_active', true)
      .contains('credentials', { pageId })
      .single()

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const instagramChannel = new InstagramChannel(channel.agent_id, {
      credentials: channel.credentials,
      settings: channel.settings
    })

    const channelMessage = await instagramChannel.handleWebhook(payload)
    
    if (channelMessage) {
      await MessageRouter.processIncomingMessage(
        channel.agent_id,
        'instagram',
        channelMessage
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Instagram Webhook] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

---

## Phase 3: Google Business Messages

### Step 3.1: Create Google Channel Adapter

**File**: `lib/channels/google.ts`

```typescript
import { BaseChannel, ChannelMessage, ChannelResponse, ChannelConfig } from './base'
import axios from 'axios'

interface GoogleCredentials {
  accessToken: string
  locationId: string
  projectId: string
}

export class GoogleChannel extends BaseChannel {
  private apiUrl = 'https://businessmessages.googleapis.com/v1'
  private credentials: GoogleCredentials

  constructor(agentId: string, config: ChannelConfig) {
    super(agentId, config)
    this.credentials = config.credentials as GoogleCredentials
  }

  async sendMessage(conversationId: string, content: string, options?: any): Promise<ChannelResponse> {
    try {
      const url = `${this.apiUrl}/conversations/${conversationId}/messages`
      
      const payload = {
        messageId: `msg_${Date.now()}`,
        text: content,
        representative: {
          representativeType: 'BOT'
        }
      }

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      return {
        success: true,
        messageId: response.data.name
      }
    } catch (error: any) {
      console.error('[Google] Error sending message:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      }
    }
  }

  async handleWebhook(payload: any): Promise<ChannelMessage | null> {
    try {
      const message = payload.message
      if (!message || !message.text) {
        return null
      }

      return {
        id: message.name,
        from: payload.conversationId,
        content: message.text,
        messageType: 'text',
        timestamp: new Date(message.createTime)
      }
    } catch (error) {
      console.error('[Google] Error handling webhook:', error)
      return null
    }
  }

  async verifyWebhook(payload: any, signature: string): Promise<boolean> {
    // Google uses different verification - implement based on their docs
    return true
  }
}
```

---

## Phase 4: Website Chat Widget

### Step 4.1: Create Website Channel Handler

**File**: `lib/channels/website.ts`

```typescript
import { BaseChannel, ChannelMessage, ChannelResponse, ChannelConfig } from './base'

export class WebsiteChannel extends BaseChannel {
  async sendMessage(to: string, content: string, options?: any): Promise<ChannelResponse> {
    // Website chat uses WebSocket/SSE - handled differently
    // This is mainly for consistency with other channels
    return {
      success: true,
      messageId: `web_${Date.now()}`
    }
  }

  async handleWebhook(payload: any): Promise<ChannelMessage | null> {
    return {
      id: payload.id || `web_${Date.now()}`,
      from: payload.userId || payload.sessionId,
      content: payload.message,
      messageType: 'text',
      timestamp: new Date()
    }
  }

  async verifyWebhook(payload: any, signature: string): Promise<boolean> {
    // Website chat verification handled by session/auth
    return true
  }
}
```

### Step 4.2: Create Chat Widget Component

**File**: `components/chat-widget.tsx`

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { MessageSquare, X, Send } from 'lucide-react'

interface ChatWidgetProps {
  agentId: string
  channelId: string
}

export function ChatWidget({ agentId, channelId }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = {
      id: `msg_${Date.now()}`,
      content: input,
      direction: 'outbound',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/conversations/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agentId,
          channelId,
          message: input
        })
      })

      const data = await response.json()
      
      const botMessage = {
        id: `msg_${Date.now()}`,
        content: data.response,
        direction: 'inbound',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-4 right-4 rounded-full h-14 w-14 shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[600px] flex flex-col shadow-xl">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Chat with us</h3>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.direction === 'outbound'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          disabled={loading}
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
```

---

## Phase 5: Cross-Channel Context

### Step 5.1: Customer Identification

**File**: `lib/channels/customer-identifier.ts`

```typescript
import { createClient } from '@/lib/supabase/server'

/**
 * Identify customer across channels using phone/email
 */
export async function identifyCustomer(
  identifier: string,
  channelType: string,
  agentId: string
): Promise<string | null> {
  const supabase = await createClient()

  // Try to find existing conversation with same identifier
  const { data: existing } = await supabase
    .from('conversations')
    .select('customer_identifier, customer_phone, customer_email')
    .eq('agent_id', agentId)
    .or(`customer_phone.eq.${identifier},customer_email.eq.${identifier},customer_identifier.eq.${identifier}`)
    .limit(1)
    .single()

  if (existing) {
    return existing.customer_identifier
  }

  return null
}

/**
 * Merge customer data across channels
 */
export async function mergeCustomerData(
  customerIdentifier: string,
  newData: {
    phone?: string
    email?: string
    name?: string
  }
) {
  const supabase = await createClient()

  // Update all conversations with this customer identifier
  const updates: any = {}
  if (newData.phone) updates.customer_phone = newData.phone
  if (newData.email) updates.customer_email = newData.email
  if (newData.name) updates.customer_name = newData.name

  await supabase
    .from('conversations')
    .update(updates)
    .eq('customer_identifier', customerIdentifier)
}
```

---

## Testing Strategy

### Unit Tests

**File**: `__tests__/channels/whatsapp.test.ts`

```typescript
import { WhatsAppChannel } from '@/lib/channels/whatsapp'

describe('WhatsAppChannel', () => {
  it('should format phone numbers correctly', () => {
    const channel = new WhatsAppChannel('agent-1', {
      credentials: {
        accessToken: 'test',
        phoneNumberId: '123',
        businessAccountId: '456',
        appSecret: 'secret',
        verifyToken: 'token'
      }
    })

    // Test phone number formatting
  })

  it('should handle webhook payload correctly', async () => {
    // Test webhook handling
  })
})
```

### Integration Tests

1. **Webhook Testing**
   - Use ngrok to expose local webhook endpoint
   - Send test messages from WhatsApp/Instagram
   - Verify message processing

2. **End-to-End Testing**
   - Create channel via API
   - Send test message
   - Verify response is generated and sent
   - Check database records

### Manual Testing Checklist

- [ ] Create WhatsApp channel
- [ ] Verify webhook setup
- [ ] Send test message from WhatsApp
- [ ] Verify AI response is generated
- [ ] Verify response is sent back
- [ ] Check conversation is created in database
- [ ] Verify message history is stored
- [ ] Test channel deactivation
- [ ] Test channel deletion

---

## Security & Compliance

### 1. Credential Encryption

**File**: `lib/encryption/credentials.ts`

```typescript
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY!
const ALGORITHM = 'aes-256-gcm'

export function encryptCredentials(credentials: any): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv)
  
  let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return JSON.stringify({
    iv: iv.toString('hex'),
    encrypted: encrypted,
    authTag: authTag.toString('hex')
  })
}

export function decryptCredentials(encryptedData: string): any {
  const data = JSON.parse(encryptedData)
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(data.iv, 'hex')
  )
  
  decipher.setAuthTag(Buffer.from(data.authTag, 'hex'))
  
  let decrypted = decipher.update(data.encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return JSON.parse(decrypted)
}
```

### 2. Webhook Signature Verification

- Always verify webhook signatures
- Use HTTPS for all webhook endpoints
- Implement rate limiting

### 3. Data Privacy

- Store minimal customer data
- Implement data retention policies
- Allow customer data deletion (GDPR compliance)

---

## Deployment Checklist

### Pre-Deployment

- [ ] Run database migrations
- [ ] Set environment variables:
  - `WHATSAPP_VERIFY_TOKEN`
  - `CREDENTIALS_ENCRYPTION_KEY`
  - `NEXT_PUBLIC_APP_URL`
- [ ] Test webhook endpoints locally with ngrok
- [ ] Verify all API routes are protected
- [ ] Test credential encryption/decryption

### Deployment Steps

1. **Deploy to Vercel/Production**
   ```bash
   npm run build
   vercel deploy --prod
   ```

2. **Configure Webhooks**
   - WhatsApp: Set webhook URL in Meta App Dashboard
   - Instagram: Set webhook URL in Meta App Dashboard
   - Google: Configure in Google Cloud Console

3. **Verify Webhooks**
   - Test webhook verification (GET requests)
   - Send test messages
   - Monitor logs for errors

### Post-Deployment

- [ ] Monitor error logs
- [ ] Test message flow end-to-end
- [ ] Verify database records are created
- [ ] Check response times
- [ ] Monitor API rate limits

---

## Environment Variables

Add to `.env.local`:

```env
# WhatsApp
WHATSAPP_VERIFY_TOKEN=your_verify_token_here

# Instagram
INSTAGRAM_VERIFY_TOKEN=your_verify_token_here

# Encryption
CREDENTIALS_ENCRYPTION_KEY=your_32_byte_hex_key_here

# App URL (for webhook URLs)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Next Steps After Phase 1

1. **Add Conversation Viewer UI**
   - List all conversations
   - View message history
   - Filter by channel/status

2. **Add Analytics**
   - Message volume per channel
   - Response times
   - Customer engagement metrics

3. **Add Message Templates**
   - Quick replies
   - Button templates
   - Media templates

4. **Add Multi-Agent Support**
   - Route conversations to specific agents
   - Load balancing
   - Agent availability

---

## Troubleshooting

### Common Issues

1. **Webhook not receiving messages**
   - Check webhook URL is correct
   - Verify webhook is subscribed
   - Check webhook signature verification

2. **Messages not being sent**
   - Verify API credentials are correct
   - Check rate limits
   - Verify phone number is registered

3. **Database errors**
   - Check RLS policies
   - Verify foreign key constraints
   - Check indexes are created

---

## Resources

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [Google Business Messages Docs](https://developers.google.com/business-communications)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)

---

**Last Updated**: [Date]  
**Status**: Phase 1 (WhatsApp) - Ready for Implementation

