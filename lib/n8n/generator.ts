/**
 * n8n Blueprint Generator
 * 
 * This module generates downloadable n8n JSON blueprints
 * with pre-configured webhook endpoints for CONNEXT AI.
 * 
 * Uses AI to generate accurate n8n workflow JSON that matches
 * n8n's exact format requirements.
 */

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface N8nBlueprint {
  name: string
  nodes: any[]
  connections: any
  settings: any
  staticData: any
  tags: any[]
  pinData: any
  versionId: string
  meta?: {
    instanceId: string
  }
}

export interface GenerateBlueprintParams {
  webhookUrl: string
  agentSecret: string
  agentName: string
}

/**
 * Generates n8n workflow JSON using AI
 * This ensures the workflow matches n8n's exact format requirements
 */
async function generateN8nBlueprintWithAI(
  params: GenerateBlueprintParams
): Promise<N8nBlueprint> {
  const { webhookUrl, agentSecret, agentName } = params

  // Ensure webhookUrl has https:// protocol
  const fullWebhookUrl = webhookUrl.startsWith('http') 
    ? webhookUrl 
    : `https://${webhookUrl}`

  const prompt = `You are an expert at creating n8n workflow JSON files. Generate a complete, valid n8n workflow JSON that:

1. Has a Webhook node that receives POST requests from Vapi.ai
   - Node name: "Vapi Webhook"
   - Type: "n8n-nodes-base.webhook"
   - typeVersion: 2
   - httpMethod: "POST"
   - path: "vapi-webhook"
   - responseMode: "responseNode"
   - Position: [250, 300]

2. Has an HTTP Request node that sends data to: ${fullWebhookUrl}
   - Node name: "CONNEXT AI Ingest"
   - Type: "n8n-nodes-base.httpRequest"
   - typeVersion: 4.1
   - method: "POST"
   - url: "${fullWebhookUrl}"
   - authentication: "none"
   - Position: [450, 300]

3. The HTTP Request must include:
   - Header "x-agent-secret" with value: "${agentSecret}"
   - Header "Content-Type" with value: "application/json"
   - JSON body with these fields mapped from Vapi webhook data:
     * phone: from $json.from or $json.phone (use n8n expression syntax)
     * summary: from $json.summary
     * recording: from $json.recordingUrl or $json.recording
     * transcript: from $json.transcript
     * sentiment: from $json.sentiment
     * structured_data: from $json.structuredData or $json.structured_data or {}
     * duration: from $json.duration

4. Connections:
   - "Vapi Webhook" node connects to "CONNEXT AI Ingest" node
   - Use node names in connections, not IDs

5. Structure requirements:
   - Generate unique node IDs in UUID format (8-4-4-4-12 hex characters like "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
   - Include settings with executionOrder: "v1"
   - Workflow name: "CONNEXT AI - ${agentName}"
   - Include staticData: null, tags: [], pinData: {}, versionId: "1"

6. HTTP Request node body format:
   - Use bodyParameters with parameters array
   - Each parameter has name and value (value uses n8n expression syntax like "={{ $json.field }}")
   - Set sendBody: true
   - Set sendHeaders: true

Return ONLY valid JSON that can be directly imported into n8n. The JSON must be a complete n8n workflow object with all required fields.`

  try {
    console.log('[n8n Generator] Generating workflow with AI...')
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at generating n8n workflow JSON files. Always return valid, importable n8n workflow JSON. Use exact n8n node structures and formats. Return only JSON, no explanations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2, // Low temperature for consistent structure
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    console.log('[n8n Generator] AI response received, parsing...')
    const parsed = JSON.parse(content) as N8nBlueprint

    // Validate structure
    if (!parsed.nodes || !Array.isArray(parsed.nodes) || parsed.nodes.length < 2) {
      throw new Error('Invalid workflow structure: missing or insufficient nodes')
    }

    if (!parsed.connections) {
      throw new Error('Invalid workflow structure: missing connections')
    }

    // Ensure required fields
    parsed.name = parsed.name || `CONNEXT AI - ${agentName}`
    parsed.settings = parsed.settings || { executionOrder: 'v1' }
    parsed.staticData = parsed.staticData ?? null
    parsed.tags = parsed.tags || []
    parsed.pinData = parsed.pinData || {}
    parsed.versionId = parsed.versionId || '1'

    console.log('[n8n Generator] AI-generated workflow validated successfully')
    return parsed
  } catch (error) {
    console.error('[n8n Generator] AI generation failed:', {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
    })
    throw error // Re-throw to trigger fallback
  }
}

/**
 * Template-based generator (fallback when AI is unavailable or fails)
 */
function generateN8nBlueprintTemplate(
  params: GenerateBlueprintParams
): N8nBlueprint {
  const { webhookUrl, agentSecret, agentName } = params

  // Ensure webhookUrl has https:// protocol
  const fullWebhookUrl = webhookUrl.startsWith('http') 
    ? webhookUrl 
    : `https://${webhookUrl}`

  // Generate unique IDs for nodes (n8n uses UUID-like format)
  const webhookNodeId = generateNodeId()
  const httpNodeId = generateNodeId()

  return {
    name: `CONNEXT AI - ${agentName}`,
    nodes: [
      {
        parameters: {
          httpMethod: 'POST',
          path: 'vapi-webhook',
          responseMode: 'responseNode',
          options: {},
        },
        id: webhookNodeId,
        name: 'Vapi Webhook',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 2,
        position: [250, 300],
        webhookId: `vapi-call-${Date.now()}`,
      },
      {
        parameters: {
          method: 'POST',
          url: fullWebhookUrl,
          authentication: 'none',
          sendHeaders: true,
          headerParameters: {
            parameters: [
              {
                name: 'x-agent-secret',
                value: agentSecret,
              },
              {
                name: 'Content-Type',
                value: 'application/json',
              },
            ],
          },
          sendBody: true,
          bodyParameters: {
            parameters: [
              {
                name: 'phone',
                value: '={{ $json.from || $json.phone || $json.customerPhone }}',
              },
              {
                name: 'summary',
                value: '={{ $json.summary || $json.callSummary }}',
              },
              {
                name: 'recording',
                value: '={{ $json.recordingUrl || $json.recording || $json.recording_url }}',
              },
              {
                name: 'transcript',
                value: '={{ $json.transcript || $json.callTranscript || $json.call_transcript }}',
              },
              {
                name: 'sentiment',
                value: '={{ $json.sentiment }}',
              },
              {
                name: 'structured_data',
                value: '={{ $json.structuredData || $json.structured_data || $json.data || {} }}',
              },
              {
                name: 'duration',
                value: '={{ $json.duration || $json.callDuration }}',
              },
            ],
          },
          options: {},
        },
        id: httpNodeId,
        name: 'CONNEXT AI Ingest',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.1,
        position: [450, 300],
      },
    ],
    connections: {
      'Vapi Webhook': {
        main: [
          [
            {
              node: 'CONNEXT AI Ingest',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
    },
    settings: {
      executionOrder: 'v1',
    },
    staticData: null,
    tags: [],
    pinData: {},
    versionId: '1',
  }
}

/**
 * Main function: Generates an n8n workflow blueprint
 * Uses AI if available, falls back to template-based generation
 */
export async function generateN8nBlueprint(
  params: GenerateBlueprintParams
): Promise<N8nBlueprint> {
  // Try AI generation first if OpenAI is configured
  if (process.env.OPENAI_API_KEY) {
    try {
      return await generateN8nBlueprintWithAI(params)
    } catch (error) {
      console.warn('[n8n Generator] AI generation failed, using template fallback:', error)
      // Fall through to template generation
    }
  } else {
    console.log('[n8n Generator] OpenAI not configured, using template generation')
  }

  // Fallback to template-based generation
  return generateN8nBlueprintTemplate(params)
}

/**
 * Generate a node ID in n8n format (similar to UUID)
 */
function generateNodeId(): string {
  // n8n uses format like: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  const chars = 'abcdef0123456789'
  const segments = [8, 4, 4, 4, 12]
  
  return segments.map(len => {
    let segment = ''
    for (let i = 0; i < len; i++) {
      segment += chars[Math.floor(Math.random() * chars.length)]
    }
    return segment
  }).join('-')
}

/**
 * Converts blueprint to downloadable JSON string
 */
export function blueprintToJson(blueprint: N8nBlueprint): string {
  return JSON.stringify(blueprint, null, 2)
}
