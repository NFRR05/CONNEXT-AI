/**
 * n8n Blueprint Generator
 * 
 * This module generates downloadable n8n JSON blueprints
 * with pre-configured webhook endpoints for CONNEXT AI.
 * 
 * Uses AI to generate accurate n8n workflow JSON that matches
 * n8n's exact format requirements with strict engineering standards:
 * 1. Strict node schema (execution parameters, not UI-state)
 * 2. Dynamic visual positioning system
 * 3. Detailed connection mapping
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

export interface WorkflowConfig {
  validatePhone?: boolean
  validateEmail?: boolean
  minCallDuration?: number | null
  filterTestCalls?: boolean
  retryOnFailure?: boolean
  maxRetries?: number
  errorNotifications?: {
    enabled?: boolean
    email?: string | null
  }
  formatPhoneNumbers?: boolean
  extractStructuredData?: boolean
  routeBySentiment?: boolean
  sentimentThreshold?: 'positive' | 'negative' | 'all'
  routeByDuration?: boolean
  durationThreshold?: number | null
  routeByBusinessHours?: boolean
  timezone?: string | null
  businessHours?: {
    start: string
    end: string
    days: number[]
  } | null
}

export interface GenerateBlueprintParams {
  webhookUrl: string
  agentSecret: string
  agentName: string
  formData?: {
    businessType?: string[]
    agentPurpose?: string[]
    informationToCollect?: string[]
    tone?: string[]
    additionalInfo?: string
    businessName?: string
  }
  workflowConfig?: WorkflowConfig
}

/**
 * Node position calculator for dynamic visual layout
 */
class NodePositionCalculator {
  private baseX: number = 250
  private baseY: number = 300
  private stepX: number = 250
  private currentX: number
  private currentY: number
  private branchOffset: number = 100

  constructor(startX: number = 250, startY: number = 300) {
    this.currentX = startX
    this.currentY = startY
  }

  /**
   * Get next position for a sequential node
   */
  getNextPosition(): [number, number] {
    this.currentX += this.stepX
    return [this.currentX, this.currentY]
  }

  /**
   * Get position for a branching node (if/switch)
   * Returns positions for true/false branches
   */
  getBranchPositions(): { true: [number, number]; false: [number, number] } {
    const nextX = this.currentX + this.stepX
    return {
      true: [nextX, this.currentY - this.branchOffset],
      false: [nextX, this.currentY + this.branchOffset],
    }
  }

  /**
   * Reset to a new base position (for new workflow sections)
   */
  reset(x: number, y: number) {
    this.currentX = x
    this.currentY = y
  }

  /**
   * Get current position
   */
  getCurrentPosition(): [number, number] {
    return [this.currentX, this.currentY]
  }
}

/**
 * Generates n8n workflow JSON using AI
 * This ensures the workflow matches n8n's exact format requirements
 */
async function generateN8nBlueprintWithAI(
  params: GenerateBlueprintParams
): Promise<N8nBlueprint> {
  const { webhookUrl, agentSecret, agentName, workflowConfig = {}, formData } = params

  // Ensure webhookUrl has https:// protocol
  const fullWebhookUrl = webhookUrl.startsWith('http') 
    ? webhookUrl 
    : `https://${webhookUrl}`

  // Build workflow configuration description for AI
  const workflowConfigDesc = workflowConfig ? `
=== WORKFLOW CONFIGURATION ===
Based on user preferences, include these features:

${workflowConfig.validatePhone ? '- Add phone number validation node before HTTP request' : ''}
${workflowConfig.validateEmail ? '- Add email validation node (if email is collected)' : ''}
${workflowConfig.filterTestCalls || workflowConfig.minCallDuration ? `- Add filter node to remove test calls (min duration: ${workflowConfig.minCallDuration || 10}s)` : ''}
${workflowConfig.formatPhoneNumbers ? '- Add phone number formatting node (international format)' : ''}
${workflowConfig.extractStructuredData ? '- Add structured data extraction node (extract names, dates, emails, amounts from transcript)' : ''}
${workflowConfig.routeBySentiment ? `- Add IF node to route by sentiment (threshold: ${workflowConfig.sentimentThreshold || 'all'})` : ''}
${workflowConfig.routeByDuration ? `- Add IF node to route by duration (threshold: ${workflowConfig.durationThreshold || 120}s)` : ''}
${workflowConfig.retryOnFailure ? `- Add error handler with retry logic (max retries: ${workflowConfig.maxRetries || 3})` : ''}
${workflowConfig.errorNotifications?.enabled ? `- Add email notification node for errors (to: ${workflowConfig.errorNotifications.email})` : ''}

Build the workflow with these nodes in sequence, using proper positioning and connections.
` : ''

  const prompt = `You are an expert at creating n8n workflow JSON files. Generate a complete, valid n8n workflow JSON following STRICT engineering standards:

=== ENGINEERING STANDARD 1: STRICT NODE SCHEMA ===
For n8n-nodes-base.httpRequest (typeVersion 4.1), you MUST use execution schema, NOT UI-state parameters:

HTTP Request Node Structure:
{
  "parameters": {
    "method": "POST",  // MUST be directly in parameters, not nested
    "url": "${fullWebhookUrl}",
    "authentication": "none",  // Explicitly set, not omitted
    "sendBody": true,  // Boolean flag
    "specifyHeaders": "json",  // Use "json", not UI objects
    "jsonParameters": true,  // If sending JSON body
    "headerParameters": {
      "parameters": [
        {
          "name": "x-agent-secret",
          "value": "${agentSecret}"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "bodyParameters": {
      "parameters": [
        {
          "name": "phone",
          "value": "={{ $json.from || $json.phone }}"
        },
        {
          "name": "summary",
          "value": "={{ $json.summary }}"
        },
        {
          "name": "recording",
          "value": "={{ $json.recordingUrl || $json.recording }}"
        },
        {
          "name": "transcript",
          "value": "={{ $json.transcript }}"
        },
        {
          "name": "sentiment",
          "value": "={{ $json.sentiment }}"
        },
        {
          "name": "structured_data",
          "value": "={{ $json.structuredData || $json.structured_data || {} }}"
        },
        {
          "name": "duration",
          "value": "={{ $json.duration }}"
        }
      ]
    },
    "options": {}
  }
}

CRITICAL: Do NOT use UI-state parameters like:
- headerParametersUi (WRONG)
- bodyParametersUi (WRONG)
- method nested in options (WRONG)

=== ENGINEERING STANDARD 2: DYNAMIC VISUAL POSITIONING ===
Implement coordinate system for position arrays [x, y]:
- Start: Webhook node at [250, 300]
- Sequential nodes: Increment X by 250 for each node
- Branching (if/switch): Split Y-axis
  * True branch: y - 100
  * False branch: y + 100

Position sequence:
- Node 1 (Webhook): [250, 300]
- Node 2 (HTTP Request): [500, 300]  // +250 X
- If branching needed: [750, 200] (true) and [750, 400] (false)

=== ENGINEERING STANDARD 3: DETAILED CONNECTION MAPPING ===
Connections MUST use strict structure:

Standard connection (Node A -> Node B):
{
  "connections": {
    "Node A": {
      "main": [
        [
          {
            "node": "Node B",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}

Complex connection (If/Switch with branches):
{
  "connections": {
    "If Node": {
      "main": [
        [
          {
            "node": "TruePathNode",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "FalsePathNode",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}

=== WORKFLOW REQUIREMENTS ===
1. Webhook node:
   - Name: "Vapi Webhook"
   - Type: "n8n-nodes-base.webhook"
   - typeVersion: 2
   - parameters.httpMethod: "POST"
   - parameters.path: "vapi-webhook"
   - parameters.responseMode: "responseNode"
   - Position: [250, 300]

2. HTTP Request node:
   - Name: "CONNEXT AI Ingest"
   - Type: "n8n-nodes-base.httpRequest"
   - typeVersion: 4.1
   - Position: [500, 300]
   - Use STRICT schema above (method, authentication, sendBody, etc.)

3. Node IDs: Generate UUID format (8-4-4-4-12 hex)

4. Workflow metadata:
   - name: "CONNEXT AI - ${agentName}"
   - settings: { executionOrder: "v1" }
   - staticData: null
   - tags: []
   - pinData: {}
   - versionId: "1"

${workflowConfigDesc}

Return ONLY valid JSON that can be directly imported into n8n. Follow all three engineering standards exactly. Include all workflow configuration features specified above.`

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

    // Post-process to enforce engineering standards
    const processed = enforceEngineeringStandards(parsed, params)

    // Ensure required fields
    processed.name = processed.name || `CONNEXT AI - ${agentName}`
    processed.settings = processed.settings || { executionOrder: 'v1' }
    processed.staticData = processed.staticData ?? null
    processed.tags = processed.tags || []
    processed.pinData = processed.pinData || {}
    processed.versionId = processed.versionId || '1'

    console.log('[n8n Generator] AI-generated workflow validated and processed successfully')
    return processed
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
 * Uses strict engineering standards for n8n node schema
 * Now creates sophisticated workflows based on workflow configuration
 */
function generateN8nBlueprintTemplate(
  params: GenerateBlueprintParams
): N8nBlueprint {
  const { webhookUrl, agentSecret, agentName, workflowConfig = {} } = params

  // Ensure webhookUrl has https:// protocol
  const fullWebhookUrl = webhookUrl.startsWith('http') 
    ? webhookUrl 
    : `https://${webhookUrl}`

  // Use position calculator for dynamic positioning
  const positionCalc = new NodePositionCalculator(250, 300)
  const nodes: any[] = []
  const connections: any = {}
  let lastNodeName = 'Vapi Webhook'

  // Generate unique IDs
  const generateId = () => generateNodeId()

  // 1. Webhook Node (always first)
  const webhookNodeId = generateId()
  const webhookPosition = positionCalc.getCurrentPosition()
  nodes.push({
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
    position: webhookPosition,
    webhookId: `vapi-call-${Date.now()}`,
  })

  // 2. Data Validation Nodes (if enabled)
  if (workflowConfig.validatePhone) {
    const validateNodeId = generateId()
    const validatePosition = positionCalc.getNextPosition()
    nodes.push({
      parameters: {
        jsCode: `// Validate phone number
const phone = $input.item.json.from || $input.item.json.phone || $input.item.json.customerPhone;
if (!phone) {
  throw new Error('Phone number is required');
}
const cleaned = phone.replace(/\\D/g, '');
if (cleaned.length < 10) {
  throw new Error('Invalid phone number format');
}
return {
  ...$input.item.json,
  phone: cleaned,
  validated: true
};`,
        mode: 'runOnceForAllItems',
      },
      id: validateNodeId,
      name: 'Validate Phone',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: validatePosition,
    })
    connections[lastNodeName] = {
      main: [[{ node: 'Validate Phone', type: 'main', index: 0 }]],
    }
    lastNodeName = 'Validate Phone'
  }

  if (workflowConfig.validateEmail && params.formData?.informationToCollect?.includes('Email Address')) {
    const validateEmailId = generateId()
    const validateEmailPosition = positionCalc.getNextPosition()
    nodes.push({
      parameters: {
        jsCode: `// Validate email if present
const email = $input.item.json.email || $input.item.json.customerEmail;
if (email) {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
}
return {
  ...$input.item.json,
  email: email || null
};`,
        mode: 'runOnceForAllItems',
      },
      id: validateEmailId,
      name: 'Validate Email',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: validateEmailPosition,
    })
    connections[lastNodeName] = {
      main: [[{ node: 'Validate Email', type: 'main', index: 0 }]],
    }
    lastNodeName = 'Validate Email'
  }

  // 3. Filter Test Calls (if enabled)
  if (workflowConfig.filterTestCalls || workflowConfig.minCallDuration) {
    const filterNodeId = generateId()
    const filterPosition = positionCalc.getNextPosition()
    const minDuration = workflowConfig.minCallDuration || 10
    nodes.push({
      parameters: {
        conditions: {
          number: [{
            value1: '={{ $json.duration || 0 }}',
            operation: 'larger',
            value2: minDuration,
          }],
        },
      },
      id: filterNodeId,
      name: 'Filter Test Calls',
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      position: filterPosition,
    })
    connections[lastNodeName] = {
      main: [
        [{ node: 'Filter Test Calls', type: 'main', index: 0 }], // True branch (valid call)
        [], // False branch (test call - discard)
      ],
    }
    lastNodeName = 'Filter Test Calls'
  }

  // 4. Format Phone Numbers (if enabled)
  if (workflowConfig.formatPhoneNumbers) {
    const formatNodeId = generateId()
    const formatPosition = positionCalc.getNextPosition()
    nodes.push({
      parameters: {
        jsCode: `// Format phone to international format
const phone = $input.item.json.phone || $input.item.json.from;
if (phone) {
  const cleaned = phone.replace(/\\D/g, '');
  let formatted = cleaned;
  // Add country code if missing (assume US +1)
  if (cleaned.length === 10) {
    formatted = '+1' + cleaned;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    formatted = '+' + cleaned;
  }
  return {
    ...$input.item.json,
    phone: formatted,
    originalPhone: phone
  };
}
return $input.item.json;`,
        mode: 'runOnceForAllItems',
      },
      id: formatNodeId,
      name: 'Format Phone',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: formatPosition,
    })
    connections[lastNodeName] = {
      main: [[{ node: 'Format Phone', type: 'main', index: 0 }]],
    }
    lastNodeName = 'Format Phone'
  }

  // 5. Extract Structured Data (if enabled)
  if (workflowConfig.extractStructuredData) {
    const extractNodeId = generateId()
    const extractPosition = positionCalc.getNextPosition()
    nodes.push({
      parameters: {
        jsCode: `// Extract structured data from transcript
const transcript = $input.item.json.transcript || '';
const structured = {
  names: [],
  dates: [],
  emails: [],
  phones: [],
  amounts: []
};

// Extract names (simple pattern - can be enhanced)
const namePattern = /(?:my name is|i'm|i am|this is)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)/gi;
let match;
while ((match = namePattern.exec(transcript)) !== null) {
  structured.names.push(match[1]);
}

// Extract dates
const datePattern = /(\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{2,4}|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:january|february|march|april|may|june|july|august|september|october|november|december)\\s+\\d{1,2})/gi;
while ((match = datePattern.exec(transcript)) !== null) {
  structured.dates.push(match[0]);
}

// Extract emails
const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g;
while ((match = emailPattern.exec(transcript)) !== null) {
  structured.emails.push(match[0]);
}

// Extract amounts
const amountPattern = /\\$?\\d+(?:\\.\\d{2})?/g;
while ((match = amountPattern.exec(transcript)) !== null) {
  structured.amounts.push(match[0]);
}

return {
  ...$input.item.json,
  structured_data: {
    ...($input.item.json.structuredData || {}),
    extracted: structured
  }
};`,
        mode: 'runOnceForAllItems',
      },
      id: extractNodeId,
      name: 'Extract Structured Data',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: extractPosition,
    })
    connections[lastNodeName] = {
      main: [[{ node: 'Extract Structured Data', type: 'main', index: 0 }]],
    }
    lastNodeName = 'Extract Structured Data'
  }

  // 6. Conditional Routing (Sentiment or Duration)
  let routingNodeName: string | null = null
  if (workflowConfig.routeBySentiment || workflowConfig.routeByDuration) {
    const routeNodeId = generateId()
    const routePosition = positionCalc.getNextPosition()
    const branchPositions = positionCalc.getBranchPositions()

    let conditions: any = {}
    if (workflowConfig.routeBySentiment && workflowConfig.sentimentThreshold !== 'all') {
      conditions.string = [{
        value1: '={{ $json.sentiment }}',
        operation: workflowConfig.sentimentThreshold === 'positive' ? 'equals' : 'notEqual',
        value2: workflowConfig.sentimentThreshold === 'positive' ? 'positive' : 'positive',
      }]
    }
    if (workflowConfig.routeByDuration && workflowConfig.durationThreshold) {
      conditions.number = [{
        value1: '={{ $json.duration || 0 }}',
        operation: 'larger',
        value2: workflowConfig.durationThreshold,
      }]
    }

    nodes.push({
      parameters: {
        conditions: conditions,
      },
      id: routeNodeId,
      name: 'Route by Priority',
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      position: routePosition,
    })
    connections[lastNodeName] = {
      main: [[{ node: 'Route by Priority', type: 'main', index: 0 }]],
    }
    routingNodeName = 'Route by Priority'
    lastNodeName = 'Route by Priority'
  }

  // 7. Main HTTP Request Node (CONNEXT AI Ingest)
  const httpNodeId = generateId()
  const httpPosition = routingNodeName 
    ? positionCalc.getNextPosition() // Will be positioned after routing
    : positionCalc.getNextPosition()
  
  const httpRequestNode: any = {
    parameters: {
      method: 'POST',
      url: fullWebhookUrl,
      authentication: 'none',
      sendBody: true,
      sendHeaders: true,
      specifyHeaders: 'json',
      jsonParameters: true,
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
      bodyParameters: {
        parameters: [
          {
            name: 'phone',
            value: '={{ $json.phone || $json.from || $json.customerPhone }}',
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
    position: httpPosition,
  }

  // Add retry configuration if enabled
  if (workflowConfig.retryOnFailure) {
    httpRequestNode.parameters.options = {
      ...httpRequestNode.parameters.options,
      retry: {
        maxRetries: workflowConfig.maxRetries || 3,
        retryDelay: 1000,
      },
    }
  }

  nodes.push(httpRequestNode)

  // Connect routing to HTTP request (both branches if routing exists)
  if (routingNodeName) {
    connections[routingNodeName] = {
      main: [
        [{ node: 'CONNEXT AI Ingest', type: 'main', index: 0 }], // True branch
        [{ node: 'CONNEXT AI Ingest', type: 'main', index: 0 }], // False branch
      ],
    }
  } else {
    connections[lastNodeName] = {
      main: [[{ node: 'CONNEXT AI Ingest', type: 'main', index: 0 }]],
    }
  }

  // 8. Error Notification (if enabled)
  // Note: In n8n, error notifications are typically handled via workflow error workflows
  // But we can add a "Continue on Fail" option to the HTTP Request node
  if (workflowConfig.errorNotifications?.enabled && workflowConfig.errorNotifications?.email) {
    // Add continueOnFail to HTTP request so errors don't stop the workflow
    httpRequestNode.parameters.options = {
      ...httpRequestNode.parameters.options,
      continueOnFail: true,
    }
    
    // Add a notification node that checks for errors
    const notifyNodeId = generateId()
    const notifyPosition = positionCalc.getNextPosition()
    nodes.push({
      parameters: {
        conditions: {
          boolean: [{
            value1: '={{ $json.error }}',
            operation: 'exists',
          }],
        },
      },
      id: notifyNodeId,
      name: 'Check for Errors',
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      position: notifyPosition,
    })
    
    // Email notification node (only if error exists)
    const emailNodeId = generateId()
    const emailPosition = [notifyPosition[0] + 250, notifyPosition[1] - 50]
    nodes.push({
      parameters: {
        fromEmail: 'noreply@connext-ai.com',
        toEmail: workflowConfig.errorNotifications.email,
        subject: 'CONNEXT AI Workflow Error',
        text: `An error occurred in your CONNEXT AI workflow.

Agent: ${agentName}
Error: {{ $json.error?.message || 'Unknown error' }}
Time: {{ $now }}

Please check your n8n workflow execution logs.`,
        options: {},
      },
      id: emailNodeId,
      name: 'Send Error Email',
      type: 'n8n-nodes-base.emailSend',
      typeVersion: 2,
      position: emailPosition,
    })
    
    connections['CONNEXT AI Ingest'] = {
      main: [[{ node: 'Check for Errors', type: 'main', index: 0 }]],
    }
    
    connections['Check for Errors'] = {
      main: [
        [{ node: 'Send Error Email', type: 'main', index: 0 }], // True branch (error exists)
        [], // False branch (no error - workflow complete)
      ],
    }
  }

  // Return the sophisticated workflow
  return {
    name: `CONNEXT AI - ${agentName}`,
    nodes: nodes,
    connections: connections,
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
 * Enforces engineering standards on AI-generated workflow
 * Fixes common issues like GET vs POST, UI-state parameters, positioning, etc.
 */
function enforceEngineeringStandards(
  blueprint: N8nBlueprint,
  params: GenerateBlueprintParams
): N8nBlueprint {
  const { webhookUrl, agentSecret } = params
  const fullWebhookUrl = webhookUrl.startsWith('http') 
    ? webhookUrl 
    : `https://${webhookUrl}`

  const positionCalc = new NodePositionCalculator(250, 300)

  // Process each node
  blueprint.nodes = blueprint.nodes.map((node, index) => {
    // Fix HTTP Request nodes (typeVersion 4.1)
    if (node.type === 'n8n-nodes-base.httpRequest' && node.typeVersion === 4.1) {
      // ENGINEERING STANDARD 1: Fix node schema
      const params = node.parameters || {}

      // Ensure method is directly in parameters, not nested
      if (!params.method || params.method === 'GET') {
        params.method = 'POST'
      }

      // Remove UI-state parameters if present
      delete params.headerParametersUi
      delete params.bodyParametersUi
      delete params.options?.method

      // Ensure authentication is explicitly set
      if (!params.authentication) {
        params.authentication = 'none'
      }

      // Ensure boolean flags are set
      if (params.sendBody === undefined) {
        params.sendBody = true
      }
      if (params.sendHeaders === undefined) {
        params.sendHeaders = true
      }
      if (params.specifyHeaders === undefined) {
        params.specifyHeaders = 'json'
      }
      if (params.jsonParameters === undefined) {
        params.jsonParameters = true
      }

      // Ensure headerParameters structure is correct
      if (!params.headerParameters?.parameters) {
        params.headerParameters = {
          parameters: [
            { name: 'x-agent-secret', value: agentSecret },
            { name: 'Content-Type', value: 'application/json' },
          ],
        }
      }

      // Ensure bodyParameters structure is correct
      if (!params.bodyParameters?.parameters) {
        params.bodyParameters = {
          parameters: [
            { name: 'phone', value: '={{ $json.from || $json.phone }}' },
            { name: 'summary', value: '={{ $json.summary }}' },
            { name: 'recording', value: '={{ $json.recordingUrl || $json.recording }}' },
            { name: 'transcript', value: '={{ $json.transcript }}' },
            { name: 'sentiment', value: '={{ $json.sentiment }}' },
            { name: 'structured_data', value: '={{ $json.structuredData || $json.structured_data || {} }}' },
            { name: 'duration', value: '={{ $json.duration }}' },
          ],
        }
      }

      // Ensure URL is correct
      if (node.name === 'CONNEXT AI Ingest' && params.url !== fullWebhookUrl) {
        params.url = fullWebhookUrl
      }

      node.parameters = params
    }

    // ENGINEERING STANDARD 2: Fix positioning
    if (index === 0) {
      // First node (webhook) at base position
      node.position = positionCalc.getCurrentPosition()
    } else {
      // Subsequent nodes increment X
      node.position = positionCalc.getNextPosition()
    }

    return node
  })

  // ENGINEERING STANDARD 3: Fix connections
  if (!blueprint.connections || Object.keys(blueprint.connections).length === 0) {
    // Rebuild connections if missing
    const webhookNode = blueprint.nodes.find(n => n.name === 'Vapi Webhook')
    const httpNode = blueprint.nodes.find(n => n.name === 'CONNEXT AI Ingest')

    if (webhookNode && httpNode) {
      blueprint.connections = {
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
      }
    }
  } else {
    // Validate and fix existing connections
    Object.keys(blueprint.connections).forEach(nodeName => {
      const conn = blueprint.connections[nodeName]
      if (conn.main && Array.isArray(conn.main)) {
        // Ensure each connection has proper structure
        conn.main = conn.main.map((output: any) => {
          if (Array.isArray(output)) {
            return output.map((link: any) => {
              if (typeof link === 'object' && link.node) {
                return {
                  node: link.node,
                  type: link.type || 'main',
                  index: link.index || 0,
                }
              }
              return link
            })
          }
          return output
        })
      }
    })
  }

  return blueprint
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
