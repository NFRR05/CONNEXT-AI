# Customer Re-engagement Feature

## Overview

A feature that helps businesses automatically re-engage with lost or inactive customers by calling them or sending personalized messages/emails. This turns CONNEXT AI into a proactive customer retention tool, not just a passive lead collector.

## Use Cases

### 1. Win-Back Campaigns
- **Scenario**: Customer hasn't booked in 6+ months
- **Action**: AI calls to check in, offer special promotion
- **Goal**: Re-activate dormant customers

### 2. Follow-Up Reminders
- **Scenario**: Customer showed interest but didn't convert
- **Action**: Automated follow-up call or email
- **Goal**: Convert warm leads

### 3. Seasonal Promotions
- **Scenario**: Holiday season, special events
- **Action**: Proactive outreach to past customers
- **Goal**: Drive repeat business

### 4. Feedback Collection
- **Scenario**: Customer hasn't returned after first visit
- **Action**: Call to gather feedback, understand why
- **Goal**: Improve service and win back customers

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CONNEXT AI Dashboard                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Re-engagement Campaign Manager                 │  │
│  │  - Create campaigns                                    │  │
│  │  - Select target customers                            │  │
│  │  - Choose outreach method (call/email/SMS)            │  │
│  │  - Schedule campaigns                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Campaign Execution Engine                      │  │
│  │  - Queue outreach tasks                                │  │
│  │  - Execute calls via Vapi                             │  │
│  │  - Send emails via email service                      │  │
│  │  - Track results                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Results & Analytics                            │  │
│  │  - Campaign performance                                │  │
│  │  - Response rates                                      │  │
│  │  - Conversion tracking                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema Changes

### New Tables

#### 1. `campaigns` Table
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('winback', 'followup', 'promotional', 'feedback')),
  outreach_method TEXT NOT NULL CHECK (outreach_method IN ('call', 'email', 'sms', 'multi')),
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  target_criteria JSONB DEFAULT '{}'::jsonb, -- e.g., {"last_contact_days": 180, "status": "Closed"}
  message_template TEXT, -- For email/SMS
  call_script TEXT, -- For voice calls
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

#### 2. `campaign_recipients` Table
```sql
CREATE TABLE campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  customer_phone TEXT,
  customer_email TEXT,
  customer_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'answered', 'failed', 'opted_out')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  response_data JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

#### 3. `campaign_results` Table (Optional - for analytics)
```sql
CREATE TABLE campaign_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  answered_count INTEGER DEFAULT 0,
  responded_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  opted_out_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

## API Endpoints

### 1. Campaign Management

#### `POST /api/campaigns`
Create a new campaign
```json
{
  "name": "Holiday Win-Back Campaign",
  "description": "Re-engage customers who haven't visited in 6+ months",
  "campaign_type": "winback",
  "outreach_method": "call",
  "agent_id": "uuid-of-agent",
  "target_criteria": {
    "last_contact_days": 180,
    "status": "Closed",
    "min_leads": 1
  },
  "call_script": "Hi {name}, this is {business_name}. We noticed you haven't visited us in a while...",
  "scheduled_at": "2024-12-01T10:00:00Z"
}
```

#### `GET /api/campaigns`
List all campaigns for user
- Query params: `status`, `campaign_type`, `limit`, `offset`

#### `GET /api/campaigns/:id`
Get campaign details with recipients

#### `PATCH /api/campaigns/:id`
Update campaign (status, schedule, etc.)

#### `DELETE /api/campaigns/:id`
Delete campaign

#### `POST /api/campaigns/:id/start`
Start a campaign immediately

#### `POST /api/campaigns/:id/pause`
Pause an active campaign

#### `POST /api/campaigns/:id/stop`
Stop a campaign

### 2. Campaign Execution

#### `POST /api/campaigns/:id/execute`
Manually trigger campaign execution (for testing)

#### `GET /api/campaigns/:id/recipients`
Get all recipients for a campaign with their status

#### `GET /api/campaigns/:id/results`
Get campaign analytics and results

### 3. Customer Selection

#### `POST /api/campaigns/:id/select-recipients`
Automatically select recipients based on campaign criteria
- Queries leads table based on `target_criteria`
- Creates `campaign_recipients` entries

## Frontend Components

### 1. Campaign List Page
**Route**: `/campaigns`
- Table of all campaigns
- Status badges
- Quick actions (start, pause, view)
- Filter by type, status, date

### 2. Create Campaign Wizard
**Route**: `/campaigns/create`
Multi-step form:
1. **Basic Info**: Name, description, type
2. **Target Selection**: Criteria for selecting customers
   - Last contact date range
   - Lead status filter
   - Agent filter
   - Custom filters
3. **Outreach Method**: Call, Email, SMS, or Multi-channel
4. **Content**: 
   - Call script (for voice)
   - Email template (for email)
   - SMS template (for SMS)
5. **Schedule**: When to start, timezone, rate limiting
6. **Review**: Preview and confirm

### 3. Campaign Details Page
**Route**: `/campaigns/:id`
- Campaign overview
- Recipients list with status
- Real-time progress
- Results analytics
- Actions (start, pause, stop)

### 4. Campaign Analytics Dashboard
**Route**: `/campaigns/:id/analytics`
- Response rates
- Conversion metrics
- Timeline visualization
- Recipient status breakdown

## Integration Points

### 1. Vapi.ai Integration (Voice Calls)
- Use existing Vapi assistant or create campaign-specific assistant
- Outbound calling via Vapi API
- Track call status and results
- Store recordings and transcripts

### 2. Email Service Integration
**Options:**
- **Resend** (recommended for simplicity)
- **SendGrid**
- **AWS SES**
- **Postmark**

**Implementation:**
```typescript
// lib/email/client.ts
export async function sendCampaignEmail(
  to: string,
  subject: string,
  template: string,
  variables: Record<string, string>
) {
  // Replace variables in template
  const body = replaceVariables(template, variables)
  
  // Send via email service
  // Store result in campaign_recipients
}
```

### 3. SMS Service Integration
**Options:**
- **Twilio**
- **Vonage (Nexmo)**
- **AWS SNS**

**Implementation:**
```typescript
// lib/sms/client.ts
export async function sendCampaignSMS(
  to: string,
  message: string,
  variables: Record<string, string>
) {
  // Replace variables in message
  const body = replaceVariables(message, variables)
  
  // Send via SMS service
  // Store result in campaign_recipients
}
```

## Background Jobs / Cron Jobs

### Campaign Execution Worker
- Check for scheduled campaigns that should start
- Process pending recipients in batches
- Rate limiting (e.g., max 10 calls/minute)
- Retry failed attempts
- Update recipient status

**Implementation Options:**
1. **Vercel Cron Jobs** (if using Vercel)
2. **Supabase Edge Functions** with cron triggers
3. **n8n workflows** (user's instance)
4. **External service** (Inngest, Trigger.dev)

### Example: Vercel Cron Job
```typescript
// app/api/cron/campaigns/route.ts
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Find campaigns that should execute
  const campaigns = await getScheduledCampaigns()
  
  for (const campaign of campaigns) {
    await executeCampaign(campaign.id)
  }

  return Response.json({ success: true })
}
```

## Campaign Execution Flow

### Voice Call Campaign
```
1. Campaign starts
   ↓
2. Queue recipients (status: pending → queued)
   ↓
3. For each recipient (rate limited):
   a. Call via Vapi outbound API
   b. Use campaign's call script
   c. Record call
   d. Update recipient status (answered/failed)
   e. Store transcript and results
   ↓
4. If customer responds positively:
   - Create new lead in leads table
   - Mark as converted
   ↓
5. Update campaign results
```

### Email Campaign
```
1. Campaign starts
   ↓
2. Queue recipients
   ↓
3. For each recipient:
   a. Replace variables in template
   b. Send email via email service
   c. Update status (sent → delivered)
   d. Track opens/clicks (if service supports)
   ↓
4. Handle bounces/unsubscribes
   ↓
5. Update campaign results
```

## Target Customer Selection Logic

### Query Builder
```typescript
function buildTargetQuery(criteria: TargetCriteria) {
  let query = supabase
    .from('leads')
    .select('*')
    .eq('agents.user_id', userId)

  // Last contact filter
  if (criteria.last_contact_days) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - criteria.last_contact_days)
    query = query.lt('created_at', cutoffDate.toISOString())
  }

  // Status filter
  if (criteria.status) {
    query = query.eq('status', criteria.status)
  }

  // Agent filter
  if (criteria.agent_id) {
    query = query.eq('agent_id', criteria.agent_id)
  }

  // Minimum leads requirement
  if (criteria.min_leads) {
    // Group by customer_phone and count
    // Only include customers with >= min_leads
  }

  return query
}
```

## Features to Implement

### Phase 1: Core Functionality
- [ ] Database schema (campaigns, campaign_recipients)
- [ ] Campaign CRUD API endpoints
- [ ] Campaign list page
- [ ] Create campaign wizard
- [ ] Basic target selection
- [ ] Campaign execution for voice calls (Vapi)

### Phase 2: Multi-Channel Support
- [ ] Email service integration
- [ ] SMS service integration
- [ ] Email template editor
- [ ] SMS template editor
- [ ] Multi-channel campaigns

### Phase 3: Advanced Features
- [ ] Campaign scheduling
- [ ] Rate limiting
- [ ] A/B testing
- [ ] Personalization variables
- [ ] Opt-out management
- [ ] Campaign analytics dashboard
- [ ] Export results

### Phase 4: Automation
- [ ] Background job processing
- [ ] Automatic recipient selection
- [ ] Smart scheduling (best time to call)
- [ ] Follow-up automation
- [ ] Integration with existing CRMs

## Example Campaign Scripts

### Win-Back Call Script
```
"Hi {customer_name}, this is {agent_name} calling from {business_name}. 
We noticed you haven't visited us in a while, and we wanted to check in. 
We have a special offer just for you: {promotion}. 
Would you like to schedule an appointment?"
```

### Follow-Up Email Template
```
Subject: We'd love to see you again, {customer_name}!

Hi {customer_name},

We noticed you were interested in {service_type} but haven't had a chance to book yet.
We'd love to help you! Here's a special offer just for you:

{promotion}

[Book Now Button]

Best regards,
{business_name}
```

## Security & Compliance

### 1. Opt-Out Management
- Store opt-out preferences
- Check before sending
- Respect unsubscribe requests
- Provide easy opt-out mechanism

### 2. Rate Limiting
- Prevent spam
- Respect carrier limits
- Configurable per campaign
- Queue management

### 3. Data Privacy
- GDPR compliance
- Customer consent tracking
- Data retention policies
- Right to be forgotten

## Testing Strategy

### Unit Tests
- Target selection logic
- Template variable replacement
- Campaign status transitions

### Integration Tests
- API endpoints
- Email/SMS sending
- Vapi outbound calls

### E2E Tests
- Full campaign creation flow
- Campaign execution
- Results tracking

## Future Enhancements

1. **AI-Powered Personalization**
   - Generate personalized scripts based on customer history
   - Optimize send times using ML

2. **Predictive Analytics**
   - Predict which customers are likely to churn
   - Score customers for re-engagement likelihood

3. **Multi-Touch Campaigns**
   - Automated sequences (email → call → SMS)
   - Drip campaigns

4. **Integration Marketplace**
   - Pre-built integrations for popular CRMs
   - Zapier/Make.com connectors

5. **Voice AI Enhancements**
   - Natural conversation flows
   - Handle objections
   - Schedule appointments directly

## Implementation Priority

**MVP (Minimum Viable Product):**
1. Voice call campaigns only
2. Manual recipient selection
3. Basic campaign management
4. Simple call scripts

**V1.0:**
1. Add email campaigns
2. Automated recipient selection
3. Campaign scheduling
4. Basic analytics

**V2.0:**
1. SMS campaigns
2. Multi-channel campaigns
3. Advanced analytics
4. A/B testing

---

**Next Steps:**
1. Review and approve this plan
2. Set up database migrations
3. Build API endpoints
4. Create frontend components
5. Integrate with Vapi for outbound calls
6. Add email service integration
7. Implement background job processing

