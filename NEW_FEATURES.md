# New Features Implementation Plan

## Overview

This document outlines the implementation plan for expanding CONNEXT AI into a comprehensive restaurant and business management platform. These features will be available as a service for all customers, transforming CONNEXT AI from a voice AI lead capture tool into a complete multi-channel customer engagement and operations platform.

## Features Included

1. **Multi-Channel Support** (WhatsApp, Instagram, Google, website)
2. **Booking System Integration**
3. **Menu Intelligence**
4. **Review Monitoring**
5. **Marketing Automation** (extends re-engagement feature)
6. **Google Business Optimization**
7. **Staff Support System**
8. **Advanced Analytics**

---

## 1. Multi-Channel Support

### Overview

Enable AI agents to communicate with customers across multiple channels (WhatsApp, Instagram, Google Business Messages, website chat) while maintaining consistent personality and context.

### Use Cases

- Customer can start conversation on Instagram, continue on WhatsApp
- Unified booking system across all channels
- Consistent brand voice everywhere
- Cross-channel customer history

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              CONNEXT AI Multi-Channel Hub                     │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ WhatsApp │  │Instagram │  │  Google  │  │ Website  │  │
│  │   API    │  │   API    │  │ Business │  │   Chat   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │              │              │          │
│       └─────────────┴──────────────┴──────────────┘          │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Unified Message Router                         │  │
│  │  - Channel detection                                   │  │
│  │  - Customer identification                             │  │
│  │  - Context retrieval                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         AI Agent (GPT-4o)                              │  │
│  │  - Unified personality                                 │  │
│  │  - Cross-channel memory                                │  │
│  │  - Channel-appropriate formatting                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Response Router                                 │  │
│  │  - Format for channel                                  │  │
│  │  - Send via appropriate API                            │  │
│  │  - Store conversation                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

#### `channels` Table
```sql
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('whatsapp', 'instagram', 'google', 'website', 'sms', 'email')),
  channel_id TEXT NOT NULL, -- External channel ID (e.g., WhatsApp Business Account ID)
  credentials JSONB NOT NULL, -- Encrypted API keys/tokens
  is_active BOOLEAN DEFAULT true,
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(agent_id, channel_type)
);
```

#### `conversations` Table
```sql
CREATE TABLE conversations (
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
CREATE INDEX idx_conversations_customer_identifier ON conversations(customer_identifier);
CREATE INDEX idx_conversations_channel_id ON conversations(channel_id);
```

#### `messages` Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'video', 'file', 'location', 'button')),
  external_message_id TEXT, -- ID from channel platform
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

### API Endpoints

#### Channel Management
- `POST /api/channels` - Connect a new channel
- `GET /api/channels` - List all channels for agent
- `GET /api/channels/:id` - Get channel details
- `PATCH /api/channels/:id` - Update channel settings
- `DELETE /api/channels/:id` - Disconnect channel
- `POST /api/channels/:id/test` - Test channel connection

#### Webhook Handlers
- `POST /api/webhooks/whatsapp` - WhatsApp webhook
- `POST /api/webhooks/instagram` - Instagram webhook
- `POST /api/webhooks/google` - Google Business Messages webhook
- `POST /api/webhooks/website` - Website chat webhook

#### Conversations
- `GET /api/conversations` - List conversations
- `GET /api/conversations/:id` - Get conversation with messages
- `POST /api/conversations/:id/messages` - Send message
- `PATCH /api/conversations/:id` - Update conversation (status, metadata)

### Integration Points

#### WhatsApp Business API
```typescript
// lib/channels/whatsapp.ts
export class WhatsAppChannel {
  async sendMessage(to: string, message: string, options?: any) {
    // Use WhatsApp Business API
    // Handle media, buttons, templates
  }
  
  async handleWebhook(payload: any) {
    // Process incoming messages
    // Route to AI agent
    // Store in database
  }
}
```

#### Instagram Graph API
```typescript
// lib/channels/instagram.ts
export class InstagramChannel {
  async sendMessage(recipientId: string, message: string) {
    // Use Instagram Graph API
    // Handle DMs and comments
  }
}
```

#### Google Business Messages API
```typescript
// lib/channels/google.ts
export class GoogleBusinessChannel {
  async sendMessage(conversationId: string, message: string) {
    // Use Google Business Messages API
  }
}
```

#### Website Chat Widget
```typescript
// components/chat-widget.tsx
// Real-time chat widget using Supabase Realtime
// Connects to same AI agent backend
```

### Implementation Phases

**Phase 1: WhatsApp Integration** (2-3 weeks)
- WhatsApp Business API setup
- Webhook handling
- Basic messaging

**Phase 2: Instagram & Google** (2-3 weeks)
- Instagram Graph API
- Google Business Messages
- Unified routing

**Phase 3: Website Chat** (1-2 weeks)
- Real-time chat widget
- WebSocket connection
- UI/UX polish

**Phase 4: Cross-Channel Context** (1-2 weeks)
- Customer identification across channels
- Unified conversation history
- Context sharing

---

## 2. Booking System Integration

### Overview

Integrate with popular booking systems (OpenTable, Resy, custom) or provide a built-in booking system for managing reservations, availability, and seating.

### Use Cases

- Customer books via any channel (phone, WhatsApp, website)
- Automatic double-booking prevention
- Waitlist management
- Optimal seating suggestions
- Cancellation handling

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Booking System Integration                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   OpenTable  │  │     Resy     │  │   Custom     │      │
│  │   Integration│  │ Integration  │  │   Booking    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Booking API Layer                              │  │
│  │  - Unified interface                                  │  │
│  │  - Availability checking                              │  │
│  │  - Reservation creation                               │  │
│  │  - Conflict detection                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         AI Agent Integration                            │  │
│  │  - Check availability via tools                        │  │
│  │  - Create reservations                                 │  │
│  │  - Handle cancellations                                │  │
│  │  - Suggest optimal times                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

#### `booking_systems` Table
```sql
CREATE TABLE booking_systems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  system_type TEXT NOT NULL CHECK (system_type IN ('opentable', 'resy', 'custom', 'builtin')),
  api_credentials JSONB NOT NULL, -- Encrypted API keys
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

#### `reservations` Table
```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  booking_system_id UUID REFERENCES booking_systems(id) ON DELETE SET NULL,
  external_reservation_id TEXT, -- ID from external booking system
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  party_size INTEGER NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
  special_requests TEXT,
  table_preference TEXT,
  source_channel TEXT, -- 'phone', 'whatsapp', 'website', etc.
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_agent_id ON reservations(agent_id);
```

#### `availability` Table (for built-in booking system)
```sql
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot TIME NOT NULL,
  available_tables INTEGER DEFAULT 0,
  max_capacity INTEGER,
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(agent_id, date, time_slot)
);

CREATE INDEX idx_availability_date ON availability(date);
```

#### `waitlist` Table
```sql
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  party_size INTEGER NOT NULL,
  preferred_date DATE,
  preferred_time TIME,
  flexible_dates BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'booked', 'expired', 'cancelled')),
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### API Endpoints

#### Booking System Management
- `POST /api/booking-systems` - Connect booking system
- `GET /api/booking-systems` - List connected systems
- `PATCH /api/booking-systems/:id` - Update settings
- `DELETE /api/booking-systems/:id` - Disconnect

#### Reservations
- `GET /api/reservations` - List reservations (with filters)
- `GET /api/reservations/:id` - Get reservation details
- `POST /api/reservations` - Create reservation
- `PATCH /api/reservations/:id` - Update reservation
- `DELETE /api/reservations/:id` - Cancel reservation
- `GET /api/reservations/availability` - Check availability

#### Waitlist
- `GET /api/waitlist` - List waitlist entries
- `POST /api/waitlist` - Add to waitlist
- `PATCH /api/waitlist/:id` - Update waitlist entry
- `POST /api/waitlist/:id/notify` - Notify customer of availability

### AI Agent Tools

```typescript
// Tools for AI agent to use
export const bookingTools = [
  {
    type: 'function',
    function: {
      name: 'check_availability',
      description: 'Check available reservation times for a given date and party size',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date' },
          party_size: { type: 'integer', minimum: 1 },
          time_preference: { type: 'string', enum: ['lunch', 'dinner', 'any'] }
        },
        required: ['date', 'party_size']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_reservation',
      description: 'Create a new reservation',
      parameters: {
        type: 'object',
        properties: {
          customer_name: { type: 'string' },
          customer_phone: { type: 'string' },
          customer_email: { type: 'string' },
          party_size: { type: 'integer' },
          date: { type: 'string', format: 'date' },
          time: { type: 'string', format: 'time' },
          special_requests: { type: 'string' }
        },
        required: ['customer_name', 'customer_phone', 'party_size', 'date', 'time']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'cancel_reservation',
      description: 'Cancel an existing reservation',
      parameters: {
        type: 'object',
        properties: {
          reservation_id: { type: 'string' },
          reason: { type: 'string' }
        },
        required: ['reservation_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'suggest_optimal_time',
      description: 'Suggest optimal reservation time based on availability and preferences',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date' },
          party_size: { type: 'integer' },
          preferred_time: { type: 'string', format: 'time' }
        },
        required: ['date', 'party_size']
      }
    }
  }
]
```

### Integration Examples

#### OpenTable Integration
```typescript
// lib/booking/opentable.ts
export class OpenTableIntegration {
  async checkAvailability(date: Date, partySize: number) {
    // Call OpenTable API
  }
  
  async createReservation(reservation: Reservation) {
    // Create via OpenTable API
    // Store external ID in database
  }
}
```

#### Built-in Booking System
```typescript
// lib/booking/builtin.ts
export class BuiltInBookingSystem {
  async checkAvailability(date: Date, partySize: number) {
    // Query availability table
    // Check against existing reservations
    // Return available slots
  }
  
  async createReservation(reservation: Reservation) {
    // Check for conflicts
    // Create reservation
    // Update availability
  }
}
```

### Implementation Phases

**Phase 1: Built-in Booking System** (2-3 weeks)
- Database schema
- Basic availability management
- Reservation CRUD
- Conflict detection

**Phase 2: AI Integration** (1-2 weeks)
- Add booking tools to agents
- Update system prompts
- Test with voice/text agents

**Phase 3: External Integrations** (2-3 weeks)
- OpenTable API
- Resy API
- Custom booking system adapter

**Phase 4: Advanced Features** (2-3 weeks)
- Waitlist management
- Optimal time suggestions
- Cancellation handling
- Double-booking prevention

---

## 3. Menu Intelligence

### Overview

Enable AI agents to answer detailed questions about menu items, provide recommendations, suggest wine pairings, and upsell intelligently based on context.

### Use Cases

- Customer asks "What's in the carbonara?"
- "What wine goes with the osso buco?"
- "Do you have gluten-free options?"
- "What's your most popular dish?"
- Intelligent upselling without being pushy

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Menu Intelligence System                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Menu Database                                  │  │
│  │  - Dishes, ingredients, allergens                     │  │
│  │  - Pricing, availability                              │  │
│  │  - Wine list, pairings                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         AI Tools / Functions                            │  │
│  │  - query_menu_item()                                  │  │
│  │  - suggest_wine_pairing()                             │  │
│  │  - check_allergens()                                  │  │
│  │  - recommend_dish()                                  │  │
│  │  - get_specials()                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         AI Agent (GPT-4o)                              │  │
│  │  - Natural menu queries                               │  │
│  │  - Context-aware recommendations                      │  │
│  │  - Elegant upselling                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

#### `menus` Table
```sql
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

#### `menu_items` Table
```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'appetizer', 'entree', 'dessert', 'wine', etc.
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  ingredients TEXT[], -- Array of ingredients
  allergens TEXT[], -- Array of allergens (gluten, dairy, nuts, etc.)
  dietary_info TEXT[], -- 'vegetarian', 'vegan', 'gluten-free', etc.
  preparation_time INTEGER, -- Minutes
  is_available BOOLEAN DEFAULT true,
  is_special BOOLEAN DEFAULT false,
  popularity_score INTEGER DEFAULT 0, -- For recommendations
  profit_margin DECIMAL(5, 2), -- For upselling
  wine_pairings UUID[], -- Array of wine menu_item IDs
  image_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_menu_items_menu_id ON menu_items(menu_id);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);
```

#### `menu_specials` Table
```sql
CREATE TABLE menu_specials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  discount_percentage DECIMAL(5, 2),
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  valid_days_of_week INTEGER[], -- 0=Sunday, 1=Monday, etc.
  valid_time_start TIME,
  valid_time_end TIME,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### API Endpoints

#### Menu Management
- `POST /api/menus` - Create menu
- `GET /api/menus` - List menus for agent
- `GET /api/menus/:id` - Get menu with items
- `PATCH /api/menus/:id` - Update menu
- `DELETE /api/menus/:id` - Delete menu

#### Menu Items
- `POST /api/menus/:menuId/items` - Add menu item
- `GET /api/menus/:menuId/items` - List menu items
- `GET /api/menu-items/:id` - Get menu item details
- `PATCH /api/menu-items/:id` - Update menu item
- `DELETE /api/menu-items/:id` - Delete menu item
- `POST /api/menu-items/bulk-import` - Bulk import from CSV/JSON

#### Menu Queries (for AI agent)
- `GET /api/menu-items/search` - Search menu items
- `GET /api/menu-items/recommendations` - Get recommendations
- `GET /api/menu-items/wine-pairings/:itemId` - Get wine pairings

### AI Agent Tools

```typescript
export const menuIntelligenceTools = [
  {
    type: 'function',
    function: {
      name: 'query_menu_item',
      description: 'Get detailed information about a menu item',
      parameters: {
        type: 'object',
        properties: {
          item_name: { type: 'string' },
          category: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_allergens',
      description: 'Check if menu items contain specific allergens',
      parameters: {
        type: 'object',
        properties: {
          allergens: { type: 'array', items: { type: 'string' } },
          category: { type: 'string' }
        },
        required: ['allergens']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'suggest_wine_pairing',
      description: 'Suggest wine pairings for a dish',
      parameters: {
        type: 'object',
        properties: {
          dish_name: { type: 'string' },
          dish_category: { type: 'string' }
        },
        required: ['dish_name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'recommend_dish',
      description: 'Recommend dishes based on preferences, time of day, or popularity',
      parameters: {
        type: 'object',
        properties: {
          preferences: { type: 'array', items: { type: 'string' } },
          dietary_restrictions: { type: 'array', items: { type: 'string' } },
          time_of_day: { type: 'string', enum: ['breakfast', 'lunch', 'dinner'] },
          price_range: { type: 'string', enum: ['budget', 'moderate', 'premium'] }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_current_specials',
      description: 'Get current specials and promotions',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date' },
          time: { type: 'string', format: 'time' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'suggest_upsell',
      description: 'Suggest complementary items or upgrades (use subtly, not pushy)',
      parameters: {
        type: 'object',
        properties: {
          current_order: { type: 'array', items: { type: 'string' } },
          customer_preferences: { type: 'object' }
        }
      }
    }
  }
]
```

### Implementation

```typescript
// lib/menu/intelligence.ts
export class MenuIntelligence {
  async queryMenuItem(itemName: string, category?: string) {
    // Search menu items
    // Return detailed information
  }
  
  async checkAllergens(allergens: string[], category?: string) {
    // Filter menu items by allergens
    // Return safe options
  }
  
  async suggestWinePairing(dishName: string) {
    // Find dish
    // Get wine pairings
    // Return recommendations with explanations
  }
  
  async recommendDish(preferences: any) {
    // Use popularity scores
    // Consider time of day
    // Filter by dietary restrictions
    // Return personalized recommendations
  }
  
  async getCurrentSpecials(date: Date, time?: Date) {
    // Check menu_specials table
    // Filter by date/time validity
    // Return active specials
  }
}
```

### Implementation Phases

**Phase 1: Menu Database** (1-2 weeks)
- Database schema
- CRUD API endpoints
- Basic menu management UI

**Phase 2: AI Tools Integration** (1-2 weeks)
- Implement menu intelligence functions
- Add tools to agent configuration
- Test with AI agent

**Phase 3: Advanced Features** (1-2 weeks)
- Wine pairing logic
- Recommendation algorithm
- Upselling intelligence
- Specials management

**Phase 4: Bulk Import & Management** (1 week)
- CSV/JSON import
- Menu templates
- Category management

---

## 4. Review Monitoring

### Overview

Automatically monitor reviews across Google, Yelp, TripAdvisor, and Instagram, respond intelligently, and flag issues for human attention.

### Use Cases

- Auto-respond to positive reviews
- Flag negative reviews for management
- Track review trends
- Maintain brand voice in responses
- Generate review requests at optimal times

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Review Monitoring System                          │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Google  │  │   Yelp   │  │TripAdvisor│ │Instagram │    │
│  │   API    │  │   API    │  │   API    │  │   API    │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │              │              │          │
│       └─────────────┴──────────────┴──────────────┘          │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Review Aggregator                              │  │
│  │  - Fetch reviews periodically                          │  │
│  │  - Store in database                                   │  │
│  │  - Detect new reviews                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         AI Review Analyzer                             │  │
│  │  - Sentiment analysis                                  │  │
│  │  - Auto-response generation                            │  │
│  │  - Issue flagging                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Response Manager                                │  │
│  │  - Auto-respond (positive)                             │  │
│  │  - Queue for human (negative)                           │  │
│  │  - Track responses                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

#### `review_sources` Table
```sql
CREATE TABLE review_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('google', 'yelp', 'tripadvisor', 'instagram', 'facebook')),
  source_id TEXT NOT NULL, -- Business ID on platform
  api_credentials JSONB NOT NULL, -- Encrypted API keys
  is_active BOOLEAN DEFAULT true,
  auto_respond_enabled BOOLEAN DEFAULT true,
  response_template TEXT, -- Custom response template
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(agent_id, source_type)
);
```

#### `reviews` Table
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_source_id UUID NOT NULL REFERENCES review_sources(id) ON DELETE CASCADE,
  external_review_id TEXT NOT NULL, -- ID from platform
  reviewer_name TEXT,
  reviewer_photo_url TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_date TIMESTAMP WITH TIME ZONE NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score DECIMAL(3, 2), -- -1.0 to 1.0
  requires_response BOOLEAN DEFAULT false,
  response_status TEXT DEFAULT 'pending' CHECK (response_status IN ('pending', 'auto_responded', 'human_responded', 'ignored')),
  ai_generated_response TEXT,
  human_response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  response_url TEXT, -- Link to response on platform
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(review_source_id, external_review_id)
);

CREATE INDEX idx_reviews_review_source_id ON reviews(review_source_id);
CREATE INDEX idx_reviews_sentiment ON reviews(sentiment);
CREATE INDEX idx_reviews_requires_response ON reviews(requires_response);
CREATE INDEX idx_reviews_review_date ON reviews(review_date DESC);
```

### API Endpoints

#### Review Source Management
- `POST /api/review-sources` - Connect review source
- `GET /api/review-sources` - List connected sources
- `PATCH /api/review-sources/:id` - Update settings
- `DELETE /api/review-sources/:id` - Disconnect

#### Reviews
- `GET /api/reviews` - List reviews (with filters)
- `GET /api/reviews/:id` - Get review details
- `POST /api/reviews/:id/respond` - Post response to review
- `POST /api/reviews/:id/flag` - Flag for human review
- `GET /api/reviews/analytics` - Review analytics

#### Review Fetching
- `POST /api/review-sources/:id/fetch` - Manually fetch reviews
- `GET /api/review-sources/:id/sync-status` - Get sync status

### Background Jobs

```typescript
// app/api/cron/reviews/route.ts
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Fetch reviews from all active sources
  const sources = await getActiveReviewSources()
  
  for (const source of sources) {
    await fetchReviewsFromSource(source.id)
    await analyzeNewReviews(source.id)
    await autoRespondToPositiveReviews(source.id)
  }

  return Response.json({ success: true })
}
```

### AI Integration

```typescript
// lib/reviews/analyzer.ts
export class ReviewAnalyzer {
  async analyzeSentiment(reviewText: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative',
    score: number,
    requiresResponse: boolean
  }> {
    // Use OpenAI for sentiment analysis
    // Determine if response needed
  }
  
  async generateResponse(review: Review, brandVoice: string): Promise<string> {
    // Generate brand-appropriate response
    // Use GPT-4o with review context
  }
}
```

### Integration Examples

#### Google My Business API
```typescript
// lib/reviews/google.ts
export class GoogleReviewFetcher {
  async fetchReviews(businessId: string) {
    // Use Google My Business API
    // Return reviews
  }
  
  async postResponse(reviewId: string, response: string) {
    // Post response via API
  }
}
```

#### Yelp Fusion API
```typescript
// lib/reviews/yelp.ts
export class YelpReviewFetcher {
  async fetchReviews(businessId: string) {
    // Use Yelp Fusion API
  }
}
```

### Implementation Phases

**Phase 1: Google Reviews** (2-3 weeks)
- Google My Business API integration
- Review fetching
- Basic sentiment analysis

**Phase 2: Auto-Response** (1-2 weeks)
- AI response generation
- Auto-respond to positive reviews
- Flag negative reviews

**Phase 3: Multi-Platform** (2-3 weeks)
- Yelp API
- TripAdvisor (scraping or API)
- Instagram comments

**Phase 4: Analytics & Optimization** (1-2 weeks)
- Review trends dashboard
- Response performance tracking
- Optimal response time suggestions

---

## 5. Marketing Automation

### Overview

Extend the re-engagement feature with advanced marketing automation: social media posting, ad copy generation, email campaigns, and event promotion.

### Use Cases

- Auto-generate and schedule social media posts
- Create ad copy for Meta and TikTok
- Send promotional emails to customer segments
- Promote events and seasonal menus
- A/B test marketing messages

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Marketing Automation Platform                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Campaign Manager                               │  │
│  │  - Create campaigns                                    │  │
│  │  - Schedule posts                                      │  │
│  │  - Segment customers                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         AI Content Generator                           │  │
│  │  - Social media captions                              │  │
│  │  - Ad copy                                            │  │
│  │  - Email templates                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Instagram │  │ Facebook │  │  Email  │  │   SMS    │    │
│  │   API    │  │   API    │  │ Service │  │ Service  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

#### `marketing_campaigns` Table
```sql
CREATE TABLE marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('social', 'email', 'sms', 'ad', 'multi')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
  target_audience JSONB DEFAULT '{}'::jsonb, -- Segmentation criteria
  content JSONB NOT NULL, -- Campaign content (varies by type)
  schedule JSONB, -- Scheduling configuration
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

#### `marketing_posts` Table
```sql
CREATE TABLE marketing_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('instagram', 'facebook', 'twitter', 'linkedin')),
  content TEXT NOT NULL,
  media_urls TEXT[],
  scheduled_at TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
  external_post_id TEXT, -- ID from social platform
  engagement_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### API Endpoints

#### Campaign Management
- `POST /api/marketing/campaigns` - Create campaign
- `GET /api/marketing/campaigns` - List campaigns
- `GET /api/marketing/campaigns/:id` - Get campaign details
- `PATCH /api/marketing/campaigns/:id` - Update campaign
- `DELETE /api/marketing/campaigns/:id` - Delete campaign
- `POST /api/marketing/campaigns/:id/generate-content` - AI generate content

#### Content Generation
- `POST /api/marketing/generate/social-caption` - Generate social media caption
- `POST /api/marketing/generate/ad-copy` - Generate ad copy
- `POST /api/marketing/generate/email` - Generate email template

#### Posting
- `POST /api/marketing/posts` - Create post
- `GET /api/marketing/posts` - List posts
- `POST /api/marketing/posts/:id/schedule` - Schedule post
- `POST /api/marketing/posts/:id/publish` - Publish immediately

### AI Content Generation

```typescript
// lib/marketing/generator.ts
export class MarketingContentGenerator {
  async generateSocialCaption(context: {
    businessName: string,
    topic: string,
    tone: string,
    includeHashtags: boolean
  }): Promise<string> {
    // Use GPT-4o to generate engaging social media caption
  }
  
  async generateAdCopy(context: {
    platform: 'meta' | 'tiktok' | 'google',
    objective: string,
    targetAudience: string,
    offer: string
  }): Promise<{
    headline: string,
    description: string,
    callToAction: string
  }> {
    // Generate platform-specific ad copy
  }
  
  async generateEmailTemplate(context: {
    subject: string,
    purpose: string,
    tone: string,
    includePersonalization: boolean
  }): Promise<{
    subject: string,
    body: string,
    htmlBody: string
  }> {
    // Generate email template
  }
}
```

### Implementation Phases

**Phase 1: Content Generation** (1-2 weeks)
- AI content generator
- Social caption generation
- Ad copy generation

**Phase 2: Social Media Integration** (2-3 weeks)
- Instagram API
- Facebook API
- Post scheduling

**Phase 3: Email Campaigns** (1-2 weeks)
- Email service integration
- Template system
- Segmentation

**Phase 4: Advanced Features** (2-3 weeks)
- A/B testing
- Analytics dashboard
- Performance optimization

---

## 6. Google Business Optimization

### Overview

Automatically manage Google Business Profile: answer Q&A, post updates, optimize profile, and improve local search visibility.

### Use Cases

- Auto-answer Google Q&A questions
- Post updates about specials and events
- Optimize business hours and information
- Monitor and respond to Google reviews (covered in Review Monitoring)
- Improve local search rankings

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Google Business Optimization                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Google My Business API                         │  │
│  │  - Q&A monitoring                                      │  │
│  │  - Post updates                                        │  │
│  │  - Profile management                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         AI Response Generator                           │  │
│  │  - Answer Q&A questions                               │  │
│  │  - Generate update posts                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Optimization Engine                             │  │
│  │  - Profile completeness checker                        │  │
│  │  - Keyword optimization                                │  │
│  │  - Local SEO suggestions                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

#### `google_business_profiles` Table
```sql
CREATE TABLE google_business_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  business_account_id TEXT NOT NULL, -- Google Business Account ID
  location_id TEXT NOT NULL, -- Google Business Location ID
  api_credentials JSONB NOT NULL, -- OAuth tokens
  auto_answer_qa BOOLEAN DEFAULT true,
  auto_post_updates BOOLEAN DEFAULT false,
  qa_response_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(agent_id)
);
```

#### `google_qa` Table
```sql
CREATE TABLE google_qa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES google_business_profiles(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL, -- Google Q&A ID
  question_text TEXT NOT NULL,
  asked_by TEXT,
  answer_text TEXT,
  answered_by TEXT, -- 'ai' or 'human'
  answered_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'flagged')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(profile_id, question_id)
);
```

#### `google_posts` Table
```sql
CREATE TABLE google_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES google_business_profiles(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL CHECK (post_type IN ('update', 'event', 'offer', 'product')),
  content TEXT NOT NULL,
  media_urls TEXT[],
  call_to_action TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
  external_post_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### API Endpoints

#### Google Business Profile
- `POST /api/google-business/connect` - Connect Google Business Profile
- `GET /api/google-business/profile` - Get profile info
- `PATCH /api/google-business/profile` - Update profile settings

#### Q&A Management
- `GET /api/google-business/qa` - List Q&A questions
- `POST /api/google-business/qa/:id/answer` - Answer question
- `POST /api/google-business/qa/:id/flag` - Flag for human review

#### Posts
- `POST /api/google-business/posts` - Create post
- `GET /api/google-business/posts` - List posts
- `POST /api/google-business/posts/:id/publish` - Publish post

#### Optimization
- `GET /api/google-business/optimization` - Get optimization suggestions
- `POST /api/google-business/optimize` - Apply optimizations

### Implementation

```typescript
// lib/google-business/client.ts
export class GoogleBusinessClient {
  async fetchQAQuestions(locationId: string) {
    // Fetch unanswered questions
  }
  
  async answerQuestion(questionId: string, answer: string) {
    // Post answer via API
  }
  
  async createPost(locationId: string, post: GooglePost) {
    // Create post on Google Business Profile
  }
  
  async getOptimizationSuggestions(locationId: string) {
    // Analyze profile completeness
    // Suggest improvements
  }
}
```

### Implementation Phases

**Phase 1: Q&A Automation** (2-3 weeks)
- Google My Business API setup
- Q&A fetching
- AI answer generation
- Auto-respond

**Phase 2: Post Management** (1-2 weeks)
- Create and schedule posts
- Update posting

**Phase 3: Optimization** (1-2 weeks)
- Profile analysis
- SEO suggestions
- Local search optimization

---

## 7. Staff Support System

### Overview

Internal knowledge base and chat system for staff to quickly access menu information, service standards, and training materials during shifts.

### Use Cases

- New hire training
- Quick answers during busy shifts
- Menu knowledge access
- Service standard reference
- Reduce interruptions to management

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Staff Support System                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Knowledge Base                                 │  │
│  │  - Menu information                                    │  │
│  │  - Service standards                                  │  │
│  │  - Training materials                                 │  │
│  │  - FAQ                                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Staff Chat Interface                           │  │
│  │  - Quick question answering                           │  │
│  │  - Context-aware responses                           │  │
│  │  - Training quiz system                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

#### `staff_members` Table
```sql
CREATE TABLE staff_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT, -- 'server', 'host', 'manager', etc.
  access_level TEXT DEFAULT 'staff' CHECK (access_level IN ('staff', 'manager', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

#### `knowledge_base_articles` Table
```sql
CREATE TABLE knowledge_base_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL, -- 'menu', 'service', 'training', 'policies'
  tags TEXT[],
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_kb_articles_agent_id ON knowledge_base_articles(agent_id);
CREATE INDEX idx_kb_articles_category ON knowledge_base_articles(category);
```

#### `staff_queries` Table
```sql
CREATE TABLE staff_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  source TEXT, -- 'knowledge_base', 'ai', 'human'
  was_helpful BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### API Endpoints

#### Staff Management
- `POST /api/staff` - Add staff member
- `GET /api/staff` - List staff members
- `PATCH /api/staff/:id` - Update staff member
- `DELETE /api/staff/:id` - Remove staff member

#### Knowledge Base
- `POST /api/knowledge-base/articles` - Create article
- `GET /api/knowledge-base/articles` - List articles
- `GET /api/knowledge-base/articles/:id` - Get article
- `PATCH /api/knowledge-base/articles/:id` - Update article
- `DELETE /api/knowledge-base/articles/:id` - Delete article
- `POST /api/knowledge-base/search` - Search articles

#### Staff Chat
- `POST /api/staff/chat` - Ask question
- `GET /api/staff/queries` - Query history

### Implementation

```typescript
// lib/staff/support.ts
export class StaffSupport {
  async answerQuestion(question: string, context: {
    agentId: string,
    staffMemberId: string
  }): Promise<string> {
    // Search knowledge base first
    // If not found, use AI with knowledge base context
    // Return answer
  }
  
  async searchKnowledgeBase(query: string, agentId: string) {
    // Vector search or keyword search
    // Return relevant articles
  }
}
```

### Implementation Phases

**Phase 1: Knowledge Base** (1-2 weeks)
- Database schema
- Article management
- Basic search

**Phase 2: Staff Chat** (1-2 weeks)
- Chat interface
- AI integration
- Query history

**Phase 3: Training System** (1-2 weeks)
- Quiz system
- Training modules
- Progress tracking

---

## 8. Advanced Analytics

### Overview

Comprehensive analytics dashboard with dish popularity, revenue tracking, customer insights, pattern detection, and actionable recommendations.

### Use Cases

- Track which dishes convert best
- Identify slow days and suggest promotions
- Detect customer behavior patterns
- Revenue per lead analysis
- Predictive insights

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Advanced Analytics System                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Data Aggregation                                │  │
│  │  - Leads data                                           │  │
│  │  - Reservations                                         │  │
│  │  - Menu items                                           │  │
│  │  - Conversations                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Analytics Engine                                │  │
│  │  - Pattern detection                                   │  │
│  │  - Trend analysis                                       │  │
│  │  - Predictive models                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Insights Dashboard                              │  │
│  │  - Visualizations                                       │  │
│  │  - Recommendations                                     │  │
│  │  - Reports                                              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

#### `analytics_events` Table
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'lead_created', 'reservation_made', 'dish_ordered', etc.
  event_data JSONB NOT NULL,
  customer_id TEXT, -- Phone or email
  revenue DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_analytics_events_agent_id ON analytics_events(agent_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
```

#### `analytics_insights` Table
```sql
CREATE TABLE analytics_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'slow_day', 'popular_dish', 'trend', 'recommendation'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_actioned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### API Endpoints

#### Analytics
- `GET /api/analytics/overview` - Dashboard overview
- `GET /api/analytics/revenue` - Revenue metrics
- `GET /api/analytics/dishes` - Dish popularity
- `GET /api/analytics/customers` - Customer insights
- `GET /api/analytics/trends` - Trend analysis
- `GET /api/analytics/insights` - Generated insights
- `POST /api/analytics/insights/:id/action` - Mark insight as actioned

### Analytics Queries

```typescript
// lib/analytics/engine.ts
export class AnalyticsEngine {
  async getDishPopularity(agentId: string, dateRange: DateRange) {
    // Aggregate dish mentions from conversations
    // Count reservations with dish preferences
    // Return popularity scores
  }
  
  async detectSlowDays(agentId: string) {
    // Analyze reservation patterns
    // Identify consistently slow days
    // Return recommendations
  }
  
  async analyzeCustomerBehavior(agentId: string) {
    // Group customers by behavior patterns
    // Identify high-value customers
    // Detect churn risk
  }
  
  async generateInsights(agentId: string) {
    // Run all analytics
    // Generate actionable insights
    // Store in analytics_insights table
  }
}
```

### Implementation Phases

**Phase 1: Basic Analytics** (2-3 weeks)
- Event tracking
- Basic dashboards
- Revenue metrics

**Phase 2: Advanced Metrics** (2-3 weeks)
- Dish popularity
- Customer segmentation
- Pattern detection

**Phase 3: Predictive Analytics** (2-3 weeks)
- ML models
- Churn prediction
- Demand forecasting

**Phase 4: Insights & Recommendations** (1-2 weeks)
- Automated insight generation
- Actionable recommendations
- Alert system

---

## Implementation Priority & Timeline

### MVP (Weeks 1-4)
1. Multi-channel support - WhatsApp only
2. Basic booking system (built-in)
3. Menu intelligence - Basic menu database
4. Basic analytics dashboard

### V1.0 (Weeks 5-12)
1. Complete multi-channel (Instagram, Google, website)
2. Booking system integrations (OpenTable, Resy)
3. Full menu intelligence with AI tools
4. Review monitoring (Google, Yelp)
5. Marketing automation - Content generation
6. Google Business - Q&A automation
7. Staff support - Knowledge base
8. Advanced analytics - Core metrics

### V2.0 (Weeks 13-20)
1. Advanced marketing features
2. Full Google Business optimization
3. Staff training system
4. Predictive analytics
5. A/B testing
6. Advanced integrations

---

## Technical Requirements

### New Dependencies
- WhatsApp Business API SDK
- Instagram Graph API
- Google My Business API client
- Yelp Fusion API client
- Email service (Resend/SendGrid)
- SMS service (Twilio)
- Vector database (Pinecone/Weaviate) for RAG

### Infrastructure
- Background job processing (Vercel Cron / Inngest)
- Webhook endpoints for all channels
- Real-time updates (Supabase Realtime)
- File storage (Supabase Storage / S3)

### Security
- Encrypted API credentials storage
- OAuth flows for platform integrations
- Rate limiting
- Webhook signature verification

---

## Next Steps

1. **Review and prioritize features**
2. **Set up development environment**
3. **Create database migrations**
4. **Build API endpoints incrementally**
5. **Develop frontend components**
6. **Integrate third-party APIs**
7. **Implement background jobs**
8. **Testing and QA**
9. **Documentation**
10. **Launch and iterate**

---

This implementation plan provides a comprehensive roadmap for transforming CONNEXT AI into a full-featured restaurant and business management platform. Each feature can be developed incrementally, allowing for early value delivery while building toward the complete vision.

