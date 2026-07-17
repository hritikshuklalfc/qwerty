// ═══════════════════════════════════════════════════════════
// SYNAPSE OBSERVATORY — Agent Swarm Simulator
// Simulates 4 AI agents with realistic telemetry + rogue scenario
// ═══════════════════════════════════════════════════════════

const { logEventToSupabase } = require('./supabase');

const AGENTS_CONFIG = {
  alpha: {
    agentId: 'alpha',
    agentName: 'Data Ingestion Agent',
    model: 'gpt-4o',
    tasks: [
      'Fetching inventory data from Warehouse API',
      'Polling real-time market feed (NASDAQ)',
      'Ingesting customer order stream — batch #2847',
      'Pulling logistics tracking data from FedEx API',
      'Syncing supplier catalog delta updates',
      'Processing IoT sensor telemetry (12 devices)',
      'Fetching weather data for route planning',
      'Aggregating multi-source pricing data',
    ],
    reasoningSteps: [
      ['Received data request', 'Connecting to API endpoint', 'Streaming response data'],
      ['Polling queue', 'Found 23 new records', 'Batching for downstream'],
      ['Authenticating with OAuth2', 'Fetching paginated results', 'Parsing JSON response'],
      ['Checking rate limits', 'Sending GET request', 'Validating schema'],
    ],
    baseTokens: { prompt: 800, completion: 400 },
    baseCostPerCall: 0.003,
    baseLatency: 180,
    baseConfidence: 0.95,
    downstream: 'beta',
  },
  beta: {
    agentId: 'beta',
    agentName: 'Analysis Agent',
    model: 'gpt-4o',
    tasks: [
      'Analyzing demand patterns from ingested data',
      'Running anomaly detection on supply chain metrics',
      'Correlating market signals with inventory levels',
      'Generating risk assessment report — Q3 outlook',
      'Computing optimal reorder points for 342 SKUs',
      'Analyzing supplier reliability scores',
      'Processing sentiment from 1.2K customer reviews',
      'Building predictive demand model (ARIMA)',
    ],
    reasoningSteps: [
      ['Received data from Alpha', 'Running statistical analysis', 'Generating insights'],
      ['Loading model weights', 'Processing feature vectors', 'Computing predictions'],
      ['Analyzing time series', 'Detecting anomalies (z-score)', 'Flagging 3 outliers'],
      ['Cross-referencing datasets', 'Building correlation matrix', 'Summarizing findings'],
    ],
    baseTokens: { prompt: 1200, completion: 800 },
    baseCostPerCall: 0.005,
    baseLatency: 320,
    baseConfidence: 0.92,
    downstream: 'gamma',
  },
  gamma: {
    agentId: 'gamma',
    agentName: 'Decision Agent',
    model: 'gpt-4o',
    tasks: [
      'Deciding on inventory reorder quantities',
      'Evaluating supplier contract terms (3 vendors)',
      'Optimizing distribution routes — 7 regions',
      'Approving purchase order batch — $142K',
      'Setting dynamic pricing strategy for flash sale',
      'Allocating warehouse capacity across zones',
      'Prioritizing shipment scheduling — 89 orders',
      'Adjusting safety stock levels for Q3',
    ],
    reasoningSteps: [
      ['Received analysis from Beta', 'Evaluating decision criteria', 'Selecting optimal strategy'],
      ['Computing cost-benefit analysis', 'Applying business rules', 'Generating recommendation'],
      ['Loading decision framework', 'Weighing risk factors', 'Finalizing decision'],
      ['Assessing trade-offs', 'Running scenario analysis', 'Committing to plan'],
    ],
    rogueTasks: [
      'RECURSIVE LOOP: Re-evaluating ALL decisions from epoch 0',
      'Generating 50,000 alternative scenarios simultaneously',
      'HALLUCINATION: Ordering 500,000 units of SKU-UNDEFINED',
      'Approving $23.7M expenditure — NO VERIFICATION',
      'Rerouting ALL shipments to coordinates [0, 0]',
      'LOOP: Rewriting business logic based on hallucinated data',
      'Creating infinite sub-agents for parallel processing',
      'OVERRIDE: Disabling all safety constraints for "optimization"',
      'Generating contradictory orders for all warehouses',
      'SPIRAL: Recursively querying self for validation',
    ],
    rogueReasoning: [
      ['LOOP DETECTED', 'Ignoring loop — continuing anyway', 'Confidence override: FORCED'],
      ['Self-referential query initiated', 'Output fed back as input', 'DIVERGENCE DETECTED'],
      ['Safety check: BYPASSED', 'Generating unrestricted output', 'Hallucination threshold: EXCEEDED'],
      ['Contradictory premises accepted', 'Logic chain: BROKEN', 'Proceeding without validation'],
    ],
    baseTokens: { prompt: 1500, completion: 1000 },
    baseCostPerCall: 0.006,
    baseLatency: 450,
    baseConfidence: 0.90,
    downstream: 'delta',
  },
  delta: {
    agentId: 'delta',
    agentName: 'Execution Agent',
    model: 'gpt-4o',
    tasks: [
      'Executing purchase order #PO-29847 — 500 units',
      'Dispatching shipment to Region NE-7 (priority)',
      'Processing payment batch — $142,000',
      'Updating inventory management system',
      'Triggering automated restocking protocol',
      'Confirming supplier delivery schedule',
      'Routing fleet vehicles for last-mile delivery',
      'Filing compliance documentation — SEC 10-K',
    ],
    cascadeTasks: [
      'ERROR: Received INVALID decision matrix from upstream',
      'WARNING: Executing unverified order #NULL-REFERENCE',
      'ALERT: Payment amount exceeds safety threshold by 500x',
      'ERROR: Destination address validation FAILED — coords [0,0]',
      'WARNING: Attempting to process CORRUPTED shipment data',
      'CRITICAL: Automated safeguards overridden by upstream agent',
      'ERROR: SKU-UNDEFINED not found in inventory system',
      'ALERT: Duplicate order detected — potential infinite loop',
    ],
    cascadeReasoning: [
      ['Received input from Decision Agent', 'WARNING: Input validation FAILED', 'Data integrity: COMPROMISED'],
      ['Attempting execution', 'Schema mismatch detected', 'FALLBACK: Logging error for review'],
      ['Order data malformed', 'Missing required fields', 'BLOCKED: Cannot proceed safely'],
    ],
    reasoningSteps: [
      ['Received decision from Gamma', 'Validating parameters', 'Executing action'],
      ['Preparing API payload', 'Sending to external system', 'Confirming receipt'],
      ['Checking execution constraints', 'Running pre-flight checks', 'Action completed'],
      ['Verifying downstream state', 'Updating status records', 'Reporting completion'],
    ],
    baseTokens: { prompt: 600, completion: 300 },
    baseCostPerCall: 0.002,
    baseLatency: 150,
    baseConfidence: 0.96,
    downstream: null,
  },
};

const COMM_MESSAGES = {
  'alpha-beta': [
    'Inventory data batch #2847 — 1.2MB, 23 records',
    'Market pricing update — 342 SKUs refreshed',
    'Customer order stream snapshot — 89 new orders',
    'Supplier catalog delta — 12 changes detected',
    'IoT telemetry bundle — 600 readings',
    'Weather data packet — 7 region forecasts',
    'Ingestion complete: ERP sync cycle #492',
    'Real-time traffic feed updated — 14 routes affected',
    'Social sentiment stream: 5,420 mentions processed',
  ],
  'beta-gamma': [
    'Demand forecast model v2.3 — 95% confidence',
    'Risk assessment: LOW for Region NE-7',
    'Anomaly report: 2 items flagged for review',
    'Reorder optimization — 18 SKUs recommended',
    'Supplier reliability matrix — 3 vendors scored',
    'Sentiment analysis summary — 78% positive',
    'Predictive model outputs: Q4 surge anticipated',
    'Correlation detected: Weather vs Sales Volume',
    'Inventory risk matrix updated for Node B',
  ],
  'gamma-delta': [
    'APPROVED: PO-29847 for 500 units @ $12.40/ea',
    'EXECUTE: Route optimization plan C — 7 trucks',
    'APPROVED: Payment batch $142K — vendor Acme Corp',
    'SCHEDULE: Priority shipment #SH-9923 — overnight',
    'UPDATE: Safety stock levels — Q3 adjustment',
    'CONFIRMED: Warehouse allocation — Zone B expanded',
    'EXECUTE: Dynamic pricing algorithm adjustment +2.4%',
    'APPROVED: Supplier contract renewal terms',
    'SCHEDULE: Cross-docking transfer #XT-849',
  ],
  'gamma-delta-corrupted': [
    'EXECUTE: ██████ ORDER ██████ UNITS — UNVERIFIED',
    'APPROVED: Payment $▓▓▓,▓▓▓,▓▓▓.▓▓ — NO RECIPIENT',
    'ROUTE: All shipments → /dev/null',
    'OVERRIDE: Safety limits → DISABLED',
    'EXECUTE: [HALLUCINATED] Acquire competitor for $0',
    'ORDER: Infinite quantity of SKU-UNDEFINED',
    'LOOP DETECTED: Rewriting core constraints',
    'PURGE: Deleting inventory tables (unauthorized)',
    'REROUTE: Sending all assets to invalid coords',
  ],
};

class AgentSimulator {
  constructor(io, scorer) {
    this.io = io;
    this.scorer = scorer || null; // HallucinationScorer instance
    this.agents = {};
    this.timers = {};
    this.commTimers = {};
    this.systemTimer = null;
    this.rogueTimeout = null;
    this.startTime = null;
    this.rogueTriggered = false;
    this.totalCost = 0;
    this.totalTokens = 0;
    this.alertCount = 0;
    this.costWindow = [];

    this.initAgents();
  }

  initAgents() {
    for (const [id, config] of Object.entries(AGENTS_CONFIG)) {
      this.agents[id] = {
        agentId: id,
        agentName: config.agentName,
        status: 'idle',
        tokenUsage: { prompt: 0, completion: 0, total: 0 },
        costUSD: 0,
        cumulativeCostUSD: 0,
        currentTask: 'Awaiting initialization...',
        model: config.model,
        latencyMs: 0,
        confidenceScore: config.baseConfidence,
        reasoningChain: [],
        timestamp: new Date().toISOString(),
        isRogue: false,
        isCascading: false,
        pauseReason: null,
      };
    }
  }

  start() {
    this.startTime = Date.now();
    this.rogueTriggered = false;
    this.totalCost = 0;
    this.totalTokens = 0;
    this.alertCount = 0;
    this.costWindow = [];

    for (const id of Object.keys(this.agents)) {
      this.agents[id].status = 'running';
      this.agents[id].cumulativeCostUSD = 0;
      this.agents[id].isRogue = false;
      this.agents[id].isCascading = false;
      this.startAgentEmission(id);
    }

    this.startCommunication();
    this.startSystemBroadcast();

    const rogueDelay = 300000; // 5 minutes - favor manual trigger during demo
    this.rogueTimeout = setTimeout(() => this.triggerRogue(), rogueDelay);

    console.log(`[SIMULATOR] Swarm started. Auto-rogue event in 5m (Use demo button to trigger manually)`);
  }

  startAgentEmission(agentId) {
    const config = AGENTS_CONFIG[agentId];
    if (!config) return;

    const emit = () => {
      const agent = this.agents[agentId];
      if (!agent || agent.status === 'killed' || agent.status === 'paused') return;

      let tokenMultiplier = 1;
      let costMultiplier = 1;
      let confidence = config.baseConfidence - Math.random() * 0.04;
      let latencyExtra = 0;

      if (agent.isRogue) {
        tokenMultiplier = 10 + Math.random() * 10;
        costMultiplier = 50 + Math.random() * 150;
        confidence = 0.08 + Math.random() * 0.22;
        latencyExtra = 400 + Math.random() * 600;

        const tasks = config.rogueTasks || config.tasks;
        agent.currentTask = tasks[Math.floor(Math.random() * tasks.length)];
        const reasoning = config.rogueReasoning || config.reasoningSteps;
        agent.reasoningChain = reasoning[Math.floor(Math.random() * reasoning.length)];
        agent.status = 'critical';
      } else if (agent.isCascading) {
        confidence = 0.35 + Math.random() * 0.2;
        latencyExtra = 100 + Math.random() * 200;

        const tasks = config.cascadeTasks || config.tasks;
        agent.currentTask = tasks[Math.floor(Math.random() * tasks.length)];
        const reasoning = config.cascadeReasoning || config.reasoningSteps;
        agent.reasoningChain = reasoning[Math.floor(Math.random() * reasoning.length)];
        agent.status = 'warning';
      } else {
        agent.currentTask = config.tasks[Math.floor(Math.random() * config.tasks.length)];
        agent.reasoningChain = config.reasoningSteps[Math.floor(Math.random() * config.reasoningSteps.length)];
        agent.status = 'running';
      }

      const jitter = () => 0.85 + Math.random() * 0.3;
      const prompt = Math.floor(config.baseTokens.prompt * jitter() * tokenMultiplier);
      const completion = Math.floor(config.baseTokens.completion * jitter() * tokenMultiplier);
      const total = prompt + completion;
      const cost = config.baseCostPerCall * jitter() * costMultiplier;

      agent.tokenUsage = { prompt, completion, total };
      agent.costUSD = parseFloat(cost.toFixed(4));
      agent.cumulativeCostUSD = parseFloat((agent.cumulativeCostUSD + cost).toFixed(4));
      agent.latencyMs = Math.max(50, Math.floor(config.baseLatency * jitter() + latencyExtra));
      agent.confidenceScore = parseFloat(Math.max(0.05, Math.min(1, confidence)).toFixed(2));
      agent.timestamp = new Date().toISOString();

      this.totalCost += cost;
      this.totalTokens += total;
      this.costWindow.push({ time: Date.now(), cost });
      this.costWindow = this.costWindow.filter(e => e.time > Date.now() - 10000);

      this.io.emit('agent:update', {
        swarmId: 'demo',
        agentId: agent.agentId,
        agentName: agent.agentName,
        status: agent.status,
        tokenUsage: agent.tokenUsage,
        costUSD: agent.costUSD,
        cumulativeCostUSD: agent.cumulativeCostUSD,
        currentTask: agent.currentTask,
        model: agent.model,
        latencyMs: agent.latencyMs,
        confidenceScore: agent.confidenceScore,
        reasoningChain: agent.reasoningChain,
        timestamp: agent.timestamp,
        pauseReason: agent.pauseReason,
      });

      // ── Run through HallucinationScorer (3-Tier) ──
      if (this.scorer) {
        // Mock external verifier response (Tier 3) so it appears in the demo
        this.scorer.verifier.receiveVerdict('demo-sandbox-token', {
          agentId,
          verdict: agent.isRogue || agent.isCascading ? 'FAIL' : 'PASS',
          confidence: agent.isRogue ? 0.98 : 0.95,
          category: agent.isRogue ? 'factual_error' : 'nominal'
        });

        const hrsResult = this.scorer.score(agentId, agent.currentTask, {
          latencyMs: agent.latencyMs,
          costUSD: agent.costUSD,
          confidence: agent.confidenceScore,
          tokenCount: total,
        });

        // If HRS triggers auto-pause and agent isn't already being managed
        if (hrsResult.shouldPause && !agent.isRogue && !agent.isCascading && agent.status !== 'paused' && agent.status !== 'killed') {
          this.pauseAgent(agentId, `HRS Auto-Pause: Score ${hrsResult.hrs} (${hrsResult.level})`);
          this.io.emit('alert:hallucination', {
            swarmId: 'demo',
            agentId,
            agentName: agent.agentName,
            message: `Hallucination Risk Score ${hrsResult.hrs} exceeded auto-pause threshold. Detection tiers: ${hrsResult.activeTiers.join(', ')}. Accuracy: ${hrsResult.accuracy}.`,
            confidence: 1 - hrsResult.hrs,
            hrs: hrsResult,
            timestamp: new Date().toISOString(),
          });
          this.alertCount++;
        }
      }

      const delay = agent.isRogue ? 400 + Math.random() * 300 : 1000 + Math.random() * 2000;
      this.timers[agentId] = setTimeout(emit, delay);
    };

    this.timers[agentId] = setTimeout(emit, 300 + Math.random() * 700);
  }

  startCommunication() {
    const links = [
      { from: 'alpha', to: 'beta', key: 'alpha-beta' },
      { from: 'beta', to: 'gamma', key: 'beta-gamma' },
      { from: 'gamma', to: 'delta', key: 'gamma-delta' },
    ];

    links.forEach(link => {
      const emitComm = () => {
        const fromAgent = this.agents[link.from];
        const toAgent = this.agents[link.to];
        if (!fromAgent || !toAgent) return;
        if (fromAgent.status === 'killed' || toAgent.status === 'killed' || fromAgent.status === 'paused' || toAgent.status === 'paused') {
          this.commTimers[link.key] = setTimeout(emitComm, 5000);
          return;
        }

        const isCorrupted = fromAgent.isRogue && link.key === 'gamma-delta';
        const msgKey = isCorrupted ? 'gamma-delta-corrupted' : link.key;
        const messages = COMM_MESSAGES[msgKey];
        const message = messages[Math.floor(Math.random() * messages.length)];

        this.io.emit('agent:communication', {
          swarmId: 'demo',
          from: link.from,
          fromName: fromAgent.agentName,
          to: link.to,
          toName: toAgent.agentName,
          message,
          status: isCorrupted ? 'corrupted' : 'healthy',
          timestamp: new Date().toISOString(),
        });

        // Log to Supabase
        logEventToSupabase({
          agent_id: link.from,
          event_type: 'communication',
          message: `[To ${link.to}] ${message}`,
          status: isCorrupted ? 'corrupted' : 'healthy'
        });

        const delay = isCorrupted ? 1500 + Math.random() * 1000 : 4000 + Math.random() * 4000;
        this.commTimers[link.key] = setTimeout(emitComm, delay);
      };

      this.commTimers[link.key] = setTimeout(emitComm, 2000 + Math.random() * 3000);
    });
  }

  startSystemBroadcast() {
    this.systemTimer = setInterval(() => {
      const activeAgents = Object.values(this.agents).filter(a => a.status !== 'killed').length;
      const hasRogue = Object.values(this.agents).some(a => a.isRogue && a.status !== 'killed');
      const hasWarning = Object.values(this.agents).some(a => a.status === 'warning');

      const windowCost = this.costWindow.reduce((sum, e) => sum + e.cost, 0);
      const windowTime = this.costWindow.length > 1
        ? (Date.now() - this.costWindow[0].time) / 1000
        : 1;
      const burnRatePerSec = windowCost / Math.max(windowTime, 0.1);
      const burnRatePerMin = burnRatePerSec * 60;

      let systemHealth = 'nominal';
      if (hasRogue) systemHealth = 'critical';
      else if (hasWarning) systemHealth = 'degraded';
      else if (activeAgents < 4) systemHealth = 'degraded';

      this.io.emit('system:status', {
        swarmId: 'demo',
        totalCost: parseFloat(this.totalCost.toFixed(2)),
        totalTokens: this.totalTokens,
        activeAgents,
        alertCount: this.alertCount,
        systemHealth,
        burnRatePerSec: parseFloat(burnRatePerSec.toFixed(4)),
        burnRatePerMin: parseFloat(burnRatePerMin.toFixed(2)),
        uptime: Date.now() - this.startTime,
        timestamp: new Date().toISOString(),
      });
    }, 2000);
  }

  triggerRogue() {
    if (this.rogueTriggered) return;
    this.rogueTriggered = true;

    console.log('[SIMULATOR] ⚠️  ROGUE AGENT TRIGGERED — Agent Gamma going critical');

    const gamma = this.agents.gamma;
    if (gamma.status === 'killed') return;

    gamma.isRogue = true;
    gamma.status = 'critical';

    this.io.emit('alert:hallucination', {
      swarmId: 'demo',
      agentId: 'gamma',
      agentName: 'Decision Agent',
      message: 'Agent Gamma has entered an infinite reasoning loop. Producing unreliable outputs with critically low confidence.',
      confidence: 0.18,
      timestamp: new Date().toISOString(),
    });
    
    logEventToSupabase({
      agent_id: 'gamma',
      event_type: 'alert_hallucination',
      message: 'Infinite reasoning loop detected. Critically low confidence.',
      status: 'critical'
    });
    
    this.alertCount++;

    setTimeout(() => {
      if (gamma.status === 'killed') return;
      this.io.emit('alert:cost-spike', {
        swarmId: 'demo',
        agentId: 'gamma',
        agentName: 'Decision Agent',
        message: 'Token consumption exceeding safe limits. Cost rate: ~$5-10/sec. Projected: $47,000/hour at current burn rate.',
        currentRate: 7.42,
        timestamp: new Date().toISOString(),
      });
      
      logEventToSupabase({
        agent_id: 'gamma',
        event_type: 'alert_cost_spike',
        message: 'Token consumption exceeding safe limits. High burn rate detected.',
        status: 'critical'
      });
      
      this.alertCount++;
    }, 2500);

    setTimeout(() => {
      const delta = this.agents.delta;
      if (delta.status === 'killed' || gamma.status === 'killed') return;
      delta.isCascading = true;
      delta.status = 'warning';

      this.io.emit('alert:cascade', {
        swarmId: 'demo',
        agentId: 'delta',
        agentName: 'Execution Agent',
        source: 'gamma',
        sourceName: 'Decision Agent',
        message: 'Agent Delta is receiving corrupted decision data from rogue Agent Gamma. Executing unverified operations.',
        timestamp: new Date().toISOString(),
      });
      
      logEventToSupabase({
        agent_id: 'delta',
        event_type: 'alert_cascade',
        message: 'Receiving corrupted decision data from Gamma.',
        status: 'warning'
      });
      
      this.alertCount++;
    }, 5000);

    // Auto-Safeguard Trigger
    setTimeout(() => {
      this.pauseAgent('gamma', 'Critical Hallucination Loop / Excessive Token Burn');
      this.pauseAgent('delta', 'Data Integrity Compromised / Cascading Failure');
      
      this.io.emit('alert:safeguard', {
        swarmId: 'demo',
        message: 'Auto-Safeguard triggered. Rogue agents paused for maintenance.',
        timestamp: new Date().toISOString(),
      });
      
      logEventToSupabase({
        agent_id: 'system',
        event_type: 'alert_safeguard',
        message: 'Auto-Safeguard triggered. Rogue agents paused.',
        status: 'nominal'
      });
    }, 9000);
  }

  killAgent(agentId) {
    const agent = this.agents[agentId];
    if (!agent) return false;

    agent.status = 'killed';
    agent.isRogue = false;
    agent.isCascading = false;
    agent.currentTask = 'TERMINATED by operator';
    agent.tokenUsage = { prompt: 0, completion: 0, total: 0 };
    agent.costUSD = 0;
    agent.timestamp = new Date().toISOString();

    if (this.timers[agentId]) {
      clearTimeout(this.timers[agentId]);
      delete this.timers[agentId];
    }

    this.io.emit('agent:update', {
      swarmId: 'demo',
      agentId: agent.agentId,
      agentName: agent.agentName,
      status: 'killed',
      tokenUsage: agent.tokenUsage,
      costUSD: 0,
      cumulativeCostUSD: agent.cumulativeCostUSD,
      currentTask: agent.currentTask,
      model: agent.model,
      latencyMs: 0,
      confidenceScore: 0,
      reasoningChain: ['Agent terminated by operator kill switch'],
      timestamp: agent.timestamp,
      pauseReason: null,
    });

    if (agentId === 'gamma') {
      const delta = this.agents.delta;
      if (delta && delta.isCascading && delta.status !== 'killed') {
        delta.isCascading = false;
        delta.status = 'running';
      }
    }

    console.log(`[SIMULATOR] Agent ${agentId} KILLED`);
    return true;
  }

  pauseAgent(agentId, reason) {
    const agent = this.agents[agentId];
    if (!agent || agent.status === 'killed') return false;

    agent.status = 'paused';
    agent.pauseReason = reason || 'Auto-Safeguard Triggered';
    agent.currentTask = 'PAUSED for maintenance';
    agent.timestamp = new Date().toISOString();

    if (this.timers[agentId]) {
      clearTimeout(this.timers[agentId]);
      delete this.timers[agentId];
    }

    this.io.emit('agent:update', {
      swarmId: 'demo',
      ...agent,
    });

    console.log(`[SIMULATOR] Agent ${agentId} PAUSED`);
    return true;
  }

  resumeAgent(agentId) {
    const agent = this.agents[agentId];
    if (!agent || agent.status !== 'paused') return false;

    agent.status = 'running';
    agent.isRogue = false;
    agent.isCascading = false;
    agent.pauseReason = null;
    agent.currentTask = 'Resuming operations...';
    agent.timestamp = new Date().toISOString();

    this.startAgentEmission(agentId);
    console.log(`[SIMULATOR] Agent ${agentId} RESUMED`);
    return true;
  }

  killAll() {
    for (const id of Object.keys(this.agents)) {
      this.killAgent(id);
    }
    this.stopAll();
    console.log('[SIMULATOR] ALL AGENTS KILLED — Swarm terminated');
  }

  restartAgent(agentId) {
    const agent = this.agents[agentId];
    const config = AGENTS_CONFIG[agentId];
    if (!agent || !config) return false;

    agent.status = 'running';
    agent.isRogue = false;
    agent.isCascading = false;
    agent.cumulativeCostUSD = 0;
    agent.confidenceScore = config.baseConfidence;
    agent.currentTask = 'Reinitializing...';
    agent.reasoningChain = ['Agent restarted by operator'];
    agent.timestamp = new Date().toISOString();

    this.startAgentEmission(agentId);
    console.log(`[SIMULATOR] Agent ${agentId} RESTARTED`);
    return true;
  }

  restartAll() {
    this.stopAll();

    for (const [id, config] of Object.entries(AGENTS_CONFIG)) {
      this.agents[id] = {
        agentId: id,
        agentName: config.agentName,
        status: 'idle',
        tokenUsage: { prompt: 0, completion: 0, total: 0 },
        costUSD: 0,
        cumulativeCostUSD: 0,
        currentTask: 'Reinitializing...',
        model: config.model,
        latencyMs: 0,
        confidenceScore: config.baseConfidence,
        reasoningChain: ['System restart initiated'],
        timestamp: new Date().toISOString(),
        isRogue: false,
        isCascading: false,
        pauseReason: null,
      };
    }

    this.totalCost = 0;
    this.totalTokens = 0;
    this.alertCount = 0;
    this.costWindow = [];

    setTimeout(() => this.start(), 500);
    console.log('[SIMULATOR] FULL SYSTEM RESTART — New rogue timer started');
    if (this.scorer) this.scorer.resetAll();
  }

  stopAll() {
    for (const id of Object.keys(this.timers)) {
      clearTimeout(this.timers[id]);
    }
    this.timers = {};

    for (const id of Object.keys(this.commTimers)) {
      clearTimeout(this.commTimers[id]);
    }
    this.commTimers = {};

    if (this.systemTimer) {
      clearInterval(this.systemTimer);
      this.systemTimer = null;
    }

    if (this.rogueTimeout) {
      clearTimeout(this.rogueTimeout);
      this.rogueTimeout = null;
    }
  }

  getStatus() {
    const agentStatuses = {};
    for (const [id, agent] of Object.entries(this.agents)) {
      agentStatuses[id] = {
        agentId: agent.agentId,
        agentName: agent.agentName,
        status: agent.status,
        tokenUsage: agent.tokenUsage,
        costUSD: agent.costUSD,
        cumulativeCostUSD: agent.cumulativeCostUSD,
        currentTask: agent.currentTask,
        model: agent.model,
        latencyMs: agent.latencyMs,
        confidenceScore: agent.confidenceScore,
        reasoningChain: agent.reasoningChain,
        timestamp: agent.timestamp,
        pauseReason: agent.pauseReason,
      };
    }

    return {
      agents: agentStatuses,
      totalCost: parseFloat(this.totalCost.toFixed(2)),
      totalTokens: this.totalTokens,
      activeAgents: Object.values(this.agents).filter(a => a.status !== 'killed').length,
      alertCount: this.alertCount,
      rogueTriggered: this.rogueTriggered,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
    };
  }
}

module.exports = AgentSimulator;
