/**
 * n8n Blueprint Generator
 * 
 * This module generates downloadable n8n JSON blueprints
 * with pre-configured webhook endpoints for CONNEXT AI.
 * 
 * Based on actual n8n workflow JSON structure
 */

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
 * Generates an n8n workflow blueprint that:
 * 1. Receives webhook from Vapi
 * 2. Extracts call data
 * 3. POSTs to CONNEXT AI ingest endpoint
 */
export function generateN8nBlueprint(
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
