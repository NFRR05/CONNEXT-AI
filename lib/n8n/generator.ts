/**
 * n8n Blueprint Generator
 * 
 * This module generates downloadable n8n JSON blueprints
 * with pre-configured webhook endpoints for CONNEXT AI.
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

  // Generate unique IDs for nodes
  const timestamp = Date.now()
  const webhookNodeId = `webhook-${timestamp}`
  const httpNodeId = `http-${timestamp + 1}`
  const respondNodeId = `respond-${timestamp + 2}`

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
        credentials: {},
        disabled: false,
        notes: '',
        notesInFlow: false,
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
          specifyBody: 'json',
          jsonBody: '={{ JSON.stringify({ phone: $json.from || $json.phone || $json.customerPhone || null, summary: $json.summary || $json.callSummary || null, recording: $json.recordingUrl || $json.recording || $json.recording_url || null, transcript: $json.transcript || $json.callTranscript || $json.call_transcript || null, sentiment: $json.sentiment || null, structured_data: $json.structuredData || $json.structured_data || $json.data || {}, duration: $json.duration || $json.callDuration || null }) }}',
          options: {
            response: {
              response: {
                responseFormat: 'json',
                response: {
                  neverError: true,
                },
              },
            },
          },
        },
        id: httpNodeId,
        name: 'CONNEXT AI Ingest',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [450, 300],
        credentials: {},
        disabled: false,
        notes: '',
        notesInFlow: false,
      },
      {
        parameters: {
          respondWith: 'json',
          responseBody: '={{ { "success": true, "message": "Lead ingested successfully" } }}',
          options: {},
        },
        id: respondNodeId,
        name: 'Respond to Webhook',
        type: 'n8n-nodes-base.respondToWebhook',
        typeVersion: 1.1,
        position: [650, 300],
        credentials: {},
        disabled: false,
        notes: '',
        notesInFlow: false,
      },
    ],
    connections: {
      [webhookNodeId]: {
        main: [
          [
            {
              node: httpNodeId,
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
      [httpNodeId]: {
        main: [
          [
            {
              node: respondNodeId,
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
    },
    settings: {
      executionOrder: 'v1',
      saveDataErrorExecution: 'all',
      saveDataSuccessExecution: 'all',
      saveManualExecutions: true,
      callersPolicy: 'workflowsFromSameOwner',
      errorWorkflow: '',
      timezone: 'America/New_York',
    },
    staticData: null,
    tags: [],
    pinData: {},
    versionId: '1',
    meta: {
      instanceId: '',
    },
  }
}

/**
 * Converts blueprint to downloadable JSON string
 */
export function blueprintToJson(blueprint: N8nBlueprint): string {
  return JSON.stringify(blueprint, null, 2)
}

