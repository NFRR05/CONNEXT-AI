# CONNEXT AI

A Headless CRM and AI Agent Builder that bridges the gap between Voice AI and business data.

## Overview

CONNEXT AI allows non-technical business owners to generate sophisticated Voice AI agents in minutes. Unlike standard tools that just create the bot, CONNEXT AI provides the destination for the data. It generates the agent, automates the logic (via n8n blueprints), and aggregates all call data (leads, summaries, recordings) into a built-in, real-time dashboard.

**Core Philosophy**: "The user owns the Dashboard; we handle the complexity."

## Tech Stack

- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS + ShadcnUI
- **Database & Auth**: Supabase (PostgreSQL + GoTrue Auth)
- **Voice Provider**: Vapi.ai
- **LLM**: OpenAI (GPT-4o)
- **Orchestration**: n8n (User hosted or cloud)

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

