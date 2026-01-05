# CONNEXT AI

A Headless CRM and AI Agent Builder that bridges the gap between Voice AI and business data.

## Overview

CONNEXT AI is a dashboard for Voice AI agents built with n8n. Build your AI agent workflows in n8n (powered by Twilio/Retell/Vapi), and CONNEXT AI receives and displays all your call data (leads, transcripts, recordings) in a beautiful, real-time dashboard.

**Architecture**: 
- **n8n** = Your backend (handles all conversation logic, AI processing)
- **CONNEXT AI** = Your dashboard (receives data from n8n and displays it)

**Core Philosophy**: "n8n is your backend. CONNEXT AI is your dashboard."

## Tech Stack

- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS + ShadcnUI
- **Database & Auth**: Supabase (PostgreSQL + GoTrue Auth)
- **Backend**: n8n (User hosted or cloud) - handles all AI agent logic
- **Voice Providers**: Twilio, Retell, Vapi (configured in n8n)
- **LLM**: OpenAI, Anthropic, etc. (configured in n8n)

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.local.example`)
4. Run database migrations (see `supabase/schema.sql`)
5. Start the development server: `npm run dev`

For detailed setup instructions, see [SETUP.md](./SETUP.md).

## Project Structure

```
connext-ai/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   └── ui/               # ShadcnUI components
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase client utilities
│   ├── vapi/             # Vapi.ai integration
│   ├── openai/           # OpenAI integration
│   └── utils.ts          # General utilities
├── types/                # TypeScript type definitions
├── supabase/             # Database schema and migrations
└── public/               # Static assets
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

Private - All rights reserved

