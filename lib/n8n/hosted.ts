/**
 * Hosted n8n Management
 * 
 * This module manages n8n workflows hosted on your server for Pro tier customers.
 * For free tier customers, they download blueprints and host n8n themselves.
 */

const N8N_API_URL = process.env.N8N_API_URL || 'http://localhost:5678'
const N8N_API_KEY = process.env.N8N_API_KEY // Your n8n instance API key

export interface HostedWorkflow {
  id: string
  name: string
  active: boolean
  nodes: any[]
  connections: any
}

/**
 * Create a workflow on your hosted n8n instance
 */
export async function createHostedWorkflow(
  blueprint: any,
  agentSecret: string
): Promise<HostedWorkflow> {
  if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY not configured. Cannot create hosted workflow.')
  }

  // Update webhook URL in blueprint to use agent secret
  const workflowData = {
    ...blueprint,
    name: `${blueprint.name} (Hosted)`,
    active: true, // Auto-activate for pro users
    nodes: blueprint.nodes.map((node: any) => {
      // Update webhook node to include agent secret
      if (node.type === 'n8n-nodes-base.webhook') {
        return {
          ...node,
          parameters: {
            ...node.parameters,
            // Ensure webhook includes x-agent-secret header
            options: {
              ...node.parameters.options,
              responseHeaders: {
                entries: [
                  {
                    name: 'x-agent-secret',
                    value: agentSecret,
                  },
                ],
              },
            },
          },
        }
      }
      return node
    }),
  }

  const response = await fetch(`${N8N_API_URL}/api/v1/workflows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': N8N_API_KEY,
    },
    body: JSON.stringify(workflowData),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(`Failed to create hosted workflow: ${error.message || response.statusText}`)
  }

  return response.json()
}

/**
 * Get workflow by ID
 */
export async function getHostedWorkflow(workflowId: string): Promise<HostedWorkflow | null> {
  if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY not configured')
  }

  const response = await fetch(`${N8N_API_URL}/api/v1/workflows/${workflowId}`, {
    method: 'GET',
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(`Failed to get hosted workflow: ${error.message || response.statusText}`)
  }

  return response.json()
}

/**
 * Update workflow
 */
export async function updateHostedWorkflow(
  workflowId: string,
  updates: Partial<HostedWorkflow>
): Promise<HostedWorkflow> {
  if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY not configured')
  }

  const response = await fetch(`${N8N_API_URL}/api/v1/workflows/${workflowId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': N8N_API_KEY,
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(`Failed to update hosted workflow: ${error.message || response.statusText}`)
  }

  return response.json()
}

/**
 * Delete workflow
 */
export async function deleteHostedWorkflow(workflowId: string): Promise<void> {
  if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY not configured')
  }

  const response = await fetch(`${N8N_API_URL}/api/v1/workflows/${workflowId}`, {
    method: 'DELETE',
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(`Failed to delete hosted workflow: ${error.message || response.statusText}`)
  }
}

/**
 * Activate/deactivate workflow
 */
export async function toggleHostedWorkflow(
  workflowId: string,
  active: boolean
): Promise<HostedWorkflow> {
  if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY not configured')
  }

  const response = await fetch(`${N8N_API_URL}/api/v1/workflows/${workflowId}/activate`, {
    method: active ? 'POST' : 'POST', // n8n uses POST for both activate/deactivate
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
    },
    body: JSON.stringify({ active }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(`Failed to toggle hosted workflow: ${error.message || response.statusText}`)
  }

  return response.json()
}


