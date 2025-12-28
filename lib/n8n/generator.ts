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

  return {
    name: `CONNEXT AI - ${agentName}`,
    nodes: [
      {
        parameters: {},
        id: 'webhook-node',
        name: 'Vapi Webhook',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 1,
        position: [250, 300],
        webhookId: 'vapi-call-webhook',
      },
      {
        parameters: {
          url: webhookUrl,
          sendHeaders: true,
          headerParameters: {
            parameters: [
              {
                name: 'x-agent-secret',
                value: agentSecret,
              },
            ],
          },
          sendBody: true,
          bodyParameters: {
            parameters: [
              {
                name: 'phone',
                value: '={{ $json.from }}',
              },
              {
                name: 'summary',
                value: '={{ $json.summary }}',
              },
              {
                name: 'recording',
                value: '={{ $json.recordingUrl }}',
              },
              {
                name: 'transcript',
                value: '={{ $json.transcript }}',
              },
              {
                name: 'sentiment',
                value: '={{ $json.sentiment }}',
              },
              {
                name: 'structured_data',
                value: '={{ $json.structuredData }}',
              },
              {
                name: 'duration',
                value: '={{ $json.duration }}',
              },
            ],
          },
          options: {},
        },
        id: 'http-request-node',
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
 * Converts blueprint to downloadable JSON string
 */
export function blueprintToJson(blueprint: N8nBlueprint): string {
  return JSON.stringify(blueprint, null, 2)
}

