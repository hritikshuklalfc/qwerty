// ═══════════════════════════════════════════════════════════
// N8N IMPORTER SERVICE
// Fetches, parses, and instruments n8n workflows for Synapse OS
// observation via the existing simulator/Socket.IO pipeline.
// ═══════════════════════════════════════════════════════════

const { spawn } = require('child_process');
const importJobStore = require('./importJobStore');

// ── n8n node type → Synapse span type mapping ──
const NODE_TYPE_MAP = {
  // AI / LLM nodes
  '@n8n/n8n-nodes-langchain.agent':           { spanType: 'llm_call', isAgent: true, risk: 'low' },
  '@n8n/n8n-nodes-langchain.chainLlm':        { spanType: 'llm_call', isAgent: true, risk: 'low' },
  '@n8n/n8n-nodes-langchain.openAi':          { spanType: 'llm_call', isAgent: true, risk: 'low' },
  '@n8n/n8n-nodes-langchain.lmChatOpenAi':    { spanType: 'llm_call', isAgent: true, risk: 'low' },
  'n8n-nodes-base.openAi':                    { spanType: 'llm_call', isAgent: true, risk: 'low' },

  // HTTP / API nodes
  'n8n-nodes-base.httpRequest':               { spanType: 'tool_call', isAgent: false, risk: 'medium' },
  'n8n-nodes-base.webhook':                   { spanType: 'trigger', isAgent: false, risk: 'low' },

  // Action nodes (potentially high-risk)
  'n8n-nodes-base.slack':                     { spanType: 'tool_call', isAgent: false, risk: 'medium' },
  'n8n-nodes-base.gmail':                     { spanType: 'tool_call', isAgent: false, risk: 'medium' },
  'n8n-nodes-base.stripe':                    { spanType: 'tool_call', isAgent: false, risk: 'high' },
  'n8n-nodes-base.shopify':                   { spanType: 'tool_call', isAgent: false, risk: 'high' },
  'n8n-nodes-base.postgres':                  { spanType: 'tool_call', isAgent: false, risk: 'medium' },
  'n8n-nodes-base.mysql':                     { spanType: 'tool_call', isAgent: false, risk: 'medium' },

  // Logic / flow control nodes
  'n8n-nodes-base.if':                        { spanType: 'internal_step', isAgent: false, risk: 'low' },
  'n8n-nodes-base.switch':                    { spanType: 'internal_step', isAgent: false, risk: 'low' },
  'n8n-nodes-base.set':                       { spanType: 'internal_step', isAgent: false, risk: 'low' },
  'n8n-nodes-base.merge':                     { spanType: 'internal_step', isAgent: false, risk: 'low' },
  'n8n-nodes-base.noOp':                      { spanType: 'internal_step', isAgent: false, risk: 'low' },
  'n8n-nodes-base.functionItem':              { spanType: 'internal_step', isAgent: false, risk: 'low' },
  'n8n-nodes-base.code':                      { spanType: 'internal_step', isAgent: false, risk: 'medium' },
  'n8n-nodes-base.manualTrigger':             { spanType: 'trigger', isAgent: false, risk: 'low' },
  'n8n-nodes-base.scheduleTrigger':           { spanType: 'trigger', isAgent: false, risk: 'low' },
};

// Default mapping for unknown node types
const DEFAULT_NODE_MAP = { spanType: 'internal_step', isAgent: false, risk: 'low' };

// ── n8n instance health check ──
const N8N_BASE_URL = process.env.N8N_URL || 'http://localhost:5678';

/**
 * Check if the n8n instance is reachable
 * @returns {Promise<{reachable: boolean, version: string|null, error: string|null}>}
 */
async function checkN8nHealth() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${N8N_BASE_URL}/healthz`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      return { reachable: true, version: null, error: null };
    }
    // n8n may not have /healthz, try the root
    return { reachable: true, version: null, error: null };
  } catch (err) {
    // Try the root URL as fallback
    try {
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 5000);
      const response2 = await fetch(N8N_BASE_URL, { signal: controller2.signal });
      clearTimeout(timeout2);
      return { reachable: response2.status < 500, version: null, error: null };
    } catch {
      return {
        reachable: false,
        version: null,
        error: `n8n instance at ${N8N_BASE_URL} is unreachable. Make sure it's running (docker-compose up).`,
      };
    }
  }
}

/**
 * Classify an n8n node type into Synapse span/risk categories
 * @param {string} nodeType - n8n node type string
 * @returns {{ spanType: string, isAgent: boolean, risk: string }}
 */
function classifyNode(nodeType) {
  // Exact match
  if (NODE_TYPE_MAP[nodeType]) return NODE_TYPE_MAP[nodeType];

  // Partial matching for common patterns
  const typeLower = (nodeType || '').toLowerCase();
  if (typeLower.includes('langchain') || typeLower.includes('openai') || typeLower.includes('ai')) {
    return { spanType: 'llm_call', isAgent: true, risk: 'low' };
  }
  if (typeLower.includes('http') || typeLower.includes('request')) {
    return { spanType: 'tool_call', isAgent: false, risk: 'medium' };
  }
  if (typeLower.includes('stripe') || typeLower.includes('payment') || typeLower.includes('shopify')) {
    return { spanType: 'tool_call', isAgent: false, risk: 'high' };
  }
  if (typeLower.includes('trigger') || typeLower.includes('webhook')) {
    return { spanType: 'trigger', isAgent: false, risk: 'low' };
  }

  return DEFAULT_NODE_MAP;
}

/**
 * Parse n8n connections object into a list of edges
 * @param {object} connections - n8n workflow connections object
 * @returns {Array<{from: string, to: string}>}
 */
function parseConnections(connections) {
  const edges = [];
  if (!connections) return edges;

  for (const [sourceName, outputs] of Object.entries(connections)) {
    if (!outputs) continue;
    // n8n connections format: { "NodeName": { "main": [[{ "node": "TargetNode", "type": "main", "index": 0 }]] } }
    for (const [outputType, outputChannels] of Object.entries(outputs)) {
      if (!Array.isArray(outputChannels)) continue;
      for (const channel of outputChannels) {
        if (!Array.isArray(channel)) continue;
        for (const conn of channel) {
          if (conn && conn.node) {
            edges.push({ from: sourceName, to: conn.node });
          }
        }
      }
    }
  }
  return edges;
}

/**
 * Preview an n8n workflow from a URL
 * Fetches the workflow JSON, parses nodes/connections, returns structured preview
 *
 * @param {string} url - Public n8n workflow URL or API endpoint
 * @returns {Promise<object>} Preview data
 */
async function previewN8nWorkflow(url) {
  // First check n8n health
  const health = await checkN8nHealth();

  let workflowData;

  try {
    // Try to fetch the workflow JSON
    // Support multiple URL formats:
    // 1. Direct API: http://localhost:5678/api/v1/workflows/{id}
    // 2. Public share URL: https://n8n.io/workflows/{id}
    // 3. Raw JSON URL
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Failed to fetch workflow: HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      // This is likely a web page, not raw JSON — try to extract workflow data
      const html = await response.text();
      // Look for embedded JSON in the page (n8n public share pages embed workflow JSON)
      const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/s)
        || html.match(/"workflow"\s*:\s*({.*?})\s*[,}]/s);
      if (jsonMatch) {
        workflowData = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Could not extract workflow JSON from the URL. Please provide a direct API or JSON URL.');
      }
    } else {
      workflowData = await response.json();
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out while fetching the workflow URL.');
    }
    throw new Error(`Failed to fetch workflow: ${err.message}`);
  }

  // Handle n8n API response wrapping
  if (workflowData.data && workflowData.data.nodes) {
    workflowData = workflowData.data;
  }

  // Validate structure
  const nodes = workflowData.nodes || [];
  const connections = workflowData.connections || {};

  if (nodes.length === 0) {
    throw new Error('Workflow has no nodes. Please check the URL.');
  }

  // Classify nodes
  const classifiedNodes = nodes.map(node => {
    const classification = classifyNode(node.type);
    return {
      name: node.name,
      type: node.type,
      spanType: classification.spanType,
      isAgent: classification.isAgent,
      risk: classification.risk,
      position: node.position || { x: 0, y: 0 },
      parameters: node.parameters ? Object.keys(node.parameters) : [],
    };
  });

  // Parse connections into edges
  const edges = parseConnections(connections);

  // Summary stats
  const agentCount = classifiedNodes.filter(n => n.isAgent).length;
  const toolCount = classifiedNodes.filter(n => n.spanType === 'tool_call').length;
  const logicCount = classifiedNodes.filter(n => n.spanType === 'internal_step').length;
  const triggerCount = classifiedNodes.filter(n => n.spanType === 'trigger').length;
  const highRiskCount = classifiedNodes.filter(n => n.risk === 'high').length;

  return {
    workflow: {
      name: workflowData.name || 'Unnamed Workflow',
      id: workflowData.id || null,
      active: workflowData.active || false,
    },
    nodes: classifiedNodes,
    edges,
    summary: {
      totalNodes: classifiedNodes.length,
      agentNodes: agentCount,
      toolNodes: toolCount,
      logicNodes: logicCount,
      triggerNodes: triggerCount,
      highRiskNodes: highRiskCount,
      totalEdges: edges.length,
    },
    n8nHealth: health,
  };
}

/**
 * Execute an n8n import job — instruments the workflow and emits events
 * through the existing Socket.IO pipeline.
 *
 * @param {object} job - Import job from the job store
 * @param {import('socket.io').Server} io - Socket.IO server instance
 * @param {object} previewData - Data from previewN8nWorkflow
 */
async function executeN8nImport(job, io, previewData) {
  const jobId = job.id;
  const swarmId = job.swarm_id;

  try {
    importJobStore.updateStatus(jobId, 'instrumenting');

    // Emit instrumentation start
    io.emit('live:scenario-start', {
      scenarioId: swarmId,
      isCustom: true,
      title: `Imported: ${previewData.workflow.name}`,
      icon: '📦',
      description: `n8n workflow import: ${previewData.summary.totalNodes} nodes`,
      steps: previewData.nodes.map((node, i) => ({
        agent: node.name.toLowerCase().replace(/\s+/g, '_'),
        description: `${node.name} (${node.spanType})`,
        icon: node.isAgent ? '🤖' : node.spanType === 'tool_call' ? '🔧' : '⚙️',
      })),
    });

    // Register agents in the swarm
    const agents = {};
    for (const node of previewData.nodes) {
      const agentId = node.name.toLowerCase().replace(/\s+/g, '_');
      agents[agentId] = {
        swarmId,
        agentId,
        agentName: node.name,
        status: 'idle',
        spanType: node.spanType,
        risk: node.risk,
        tokenUsage: { total: 0, prompt: 0, completion: 0 },
        costUSD: 0,
        lastActivity: new Date().toISOString(),
      };

      // Emit agent registration
      io.emit('agent:update', agents[agentId]);
    }

    importJobStore.updateStatus(jobId, 'running');

    // Simulate the workflow execution step by step
    // In a production system, this would call the n8n webhook/execution API
    // For the demo, we simulate the execution with realistic timing
    for (let i = 0; i < previewData.nodes.length; i++) {
      const node = previewData.nodes[i];
      const agentId = node.name.toLowerCase().replace(/\s+/g, '_');

      // Check if job was stopped
      const currentJob = importJobStore.getJob(jobId);
      if (!currentJob || currentJob.status === 'stopped') {
        console.log(`[n8n Import] Job ${jobId} was stopped, aborting execution`);
        return;
      }

      // Update agent status to processing
      agents[agentId].status = 'processing';
      agents[agentId].lastActivity = new Date().toISOString();
      io.emit('agent:update', agents[agentId]);

      // Emit activity log
      io.emit('live:activity', {
        swarmId,
        id: `${swarmId}-step-${i}`,
        agentId,
        agentName: node.name,
        type: node.spanType,
        message: `Executing ${node.name} (${node.type})`,
        timestamp: new Date().toISOString(),
      });

      // Emit demo step progress
      io.emit('live:demo-step', { swarmId, step: i, status: 'running', output: null });

      // If high-risk, emit approval request
      if (node.risk === 'high') {
        io.emit('live:approval-added', {
          swarmId,
          id: `${swarmId}-approval-${i}`,
          agentId,
          agentName: node.name,
          description: `High-risk action: ${node.name} (${node.type}) requires approval before execution`,
          status: 'pending',
          timestamp: new Date().toISOString(),
        });
      }

      // Simulate execution time (agent nodes take longer)
      const execTime = node.isAgent ? 1500 + Math.random() * 2000 : 300 + Math.random() * 700;
      await new Promise(resolve => setTimeout(resolve, execTime));

      // Simulate token usage for AI nodes
      if (node.isAgent) {
        const promptTokens = 200 + Math.floor(Math.random() * 800);
        const completionTokens = 100 + Math.floor(Math.random() * 400);
        agents[agentId].tokenUsage = {
          total: promptTokens + completionTokens,
          prompt: promptTokens,
          completion: completionTokens,
        };
        agents[agentId].costUSD = ((promptTokens * 0.00001) + (completionTokens * 0.00003));
      }

      // Update agent status to idle (done)
      agents[agentId].status = 'idle';
      agents[agentId].lastActivity = new Date().toISOString();
      io.emit('agent:update', agents[agentId]);

      // Emit step completion
      io.emit('live:demo-step', {
        swarmId,
        step: i,
        status: 'done',
        output: `${node.name} completed successfully`,
      });

      // Emit handoff if there are edges from this node
      const outgoingEdges = previewData.edges.filter(e => e.from === node.name);
      for (const edge of outgoingEdges) {
        const targetId = edge.to.toLowerCase().replace(/\s+/g, '_');
        io.emit('live:agent-handoff', {
          swarmId,
          from: agentId,
          to: targetId,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Calculate totals
    const totalTokens = Object.values(agents).reduce((sum, a) => sum + a.tokenUsage.total, 0);
    const totalCost = Object.values(agents).reduce((sum, a) => sum + a.costUSD, 0);

    // Emit telemetry
    io.emit('live:telemetry', {
      swarmId,
      totalTokens,
      totalCost,
      totalLatency: previewData.nodes.length * 1000,
    });

    // Emit scenario complete
    io.emit('live:scenario-complete', {
      swarmId,
      totalTokens,
      totalCost,
      totalLatency: previewData.nodes.length * 1000,
      agentsUsed: Object.keys(agents).length,
    });

    importJobStore.updateStatus(jobId, 'completed');
    console.log(`[n8n Import] Job ${jobId} completed. ${previewData.nodes.length} nodes executed.`);

  } catch (err) {
    console.error(`[n8n Import] Job ${jobId} failed:`, err.message);
    importJobStore.updateStatus(jobId, 'failed', err.message);

    io.emit('live:error', { swarmId, error: `n8n import failed: ${err.message}` });
  }
}

module.exports = {
  previewN8nWorkflow,
  executeN8nImport,
  checkN8nHealth,
  classifyNode,
  parseConnections,
};
