// ═══════════════════════════════════════════════════════════
// SYNAPSE OBSERVATORY — Backend Server
// Express + Socket.IO on port 4000
// Dual mode: Simulation (ambient) + Real AI (live scenarios)
// ═══════════════════════════════════════════════════════════

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const AgentSimulator = require('./agentSimulator');
const AIAgentOrchestrator = require('./AIAgentOrchestrator');
const { HallucinationScorer } = require('./HallucinationDetector');

require('dotenv').config();

const PORT = process.env.PORT || 4000;
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || /\.vercel\.app$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// ── Initialize All Engines ──
const scorer = new HallucinationScorer(io);               // 3-Tier Hallucination Detection
// Load default behavioral contracts for the demo (Tier 2)
scorer.contracts.loadContracts([
  { agent: '*', rule: 'forbidden_words', words: ['test_error', 'unauthorized'], description: 'Must not leak system keywords' },
  { agent: 'beta', rule: 'range_check', field: 'confidence', min: 0, max: 100, description: 'Confidence must be percentage' }
]);
// Enable the Sandboxed Verifier (Tier 3)
scorer.verifier.enable('demo-sandbox-token');

const simulator = new AgentSimulator(io, scorer);          // Ambient simulation (keeps the live swarm view alive)
const orchestrator = new AIAgentOrchestrator(io, scorer);  // Real AI-powered scenarios

// ═══════════════════════════════════════════════════════════
// REST Endpoints — Existing Simulation Controls
// ═══════════════════════════════════════════════════════════

app.post('/api/kill/:agentId', (req, res) => {
  const { agentId } = req.params;
  const success = simulator.killAgent(agentId);
  if (success) {
    res.json({ success: true, message: `Agent ${agentId} terminated.` });
  } else {
    res.status(404).json({ success: false, message: `Agent ${agentId} not found.` });
  }
});

app.post('/api/kill-all', (req, res) => {
  simulator.killAll();
  res.json({ success: true, message: 'All agents terminated. Swarm offline.' });
});

app.post('/api/restart/:agentId', (req, res) => {
  const { agentId } = req.params;
  const success = simulator.restartAgent(agentId);
  if (success) {
    res.json({ success: true, message: `Agent ${agentId} restarted.` });
  } else {
    res.status(404).json({ success: false, message: `Agent ${agentId} not found.` });
  }
});

app.post('/api/resume/:agentId', (req, res) => {
  const { agentId } = req.params;
  const success = simulator.resumeAgent(agentId);
  if (success) {
    res.json({ success: true, message: `Agent ${agentId} resumed.` });
  } else {
    res.status(404).json({ success: false, message: `Agent ${agentId} not found or not paused.` });
  }
});

app.post('/api/restart-all', (req, res) => {
  simulator.restartAll();
  res.json({ success: true, message: 'Full system restart initiated.' });
});

app.post('/api/demo/trigger-rogue', (req, res) => {
  simulator.triggerRogue();
  res.json({ success: true, message: 'Demo rogue event triggered.' });
});

app.get('/api/status', (req, res) => {
  res.json(simulator.getStatus());
});

// ═══════════════════════════════════════════════════════════
// REST Endpoints — Hallucination Detection (3-Tier)
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/hallucination/config
 * Returns current hallucination detection configuration
 */
app.get('/api/hallucination/config', (req, res) => {
  res.json({
    tiers: {
      t1: { name: 'Mathematical Reasoning', active: true, accuracy: '~75-85%', description: 'Telemetry-only analysis. Always on. Zero company data needed.' },
      t2: { name: 'Behavioral Contracts', active: scorer.contracts.enabled, accuracy: '~92-95%', description: 'Company-defined validation rules. No raw data shared.' },
      t3: { name: 'Sandboxed Verifier', active: scorer.verifier.enabled, accuracy: '~99%+', description: 'Verifier runs on company infra. Only pass/fail verdicts sent.' },
    },
    thresholds: {
      warning: scorer.THRESHOLD_WARNING,
      critical: scorer.THRESHOLD_CRITICAL,
      autoPause: scorer.THRESHOLD_AUTO_PAUSE,
    },
    contracts: scorer.contracts.getContracts(),
  });
});

/**
 * POST /api/hallucination/contracts
 * Load behavioral contracts (Tier 2)
 * Body: { contracts: [...] }
 */
app.post('/api/hallucination/contracts', (req, res) => {
  const { contracts } = req.body;
  if (!Array.isArray(contracts)) {
    return res.status(400).json({ success: false, error: 'contracts must be an array' });
  }
  scorer.contracts.loadContracts(contracts);
  res.json({ success: true, loaded: contracts.length, message: `Loaded ${contracts.length} behavioral contracts.` });
});

/**
 * POST /api/hallucination/verifier/enable
 * Enable the Tier 3 Verifier receiver with an auth token
 * Body: { token: "..." }
 */
app.post('/api/hallucination/verifier/enable', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, error: 'Token is required to enable the verifier.' });
  }
  scorer.verifier.enable(token);
  res.json({ success: true, message: 'Verifier receiver enabled. Awaiting verdicts from your local Verifier Agent.' });
});

/**
 * POST /api/hallucination/verdict
 * Receive a verdict from the company's local Verifier Agent (Tier 3)
 * Headers: { x-verifier-token: "..." }
 * Body: { agentId, verdict: "PASS"|"FAIL", confidence, category }
 */
app.post('/api/hallucination/verdict', (req, res) => {
  const token = req.headers['x-verifier-token'];
  const result = scorer.verifier.receiveVerdict(token, req.body);
  if (!result.accepted) {
    return res.status(result.error === 'Invalid verifier token' ? 401 : 400).json(result);
  }
  // Re-score the agent with the new verdict
  const agentId = req.body.agentId;
  const rescored = scorer.score(agentId, '', { latencyMs: 0, costUSD: 0, confidence: 0.9, tokenCount: 0 });
  res.json({ accepted: true, hrs: rescored.hrs, level: rescored.level });
});

/**
 * GET /api/hallucination/history/:agentId
 * Get HRS history for sparkline charts
 */
app.get('/api/hallucination/history/:agentId', (req, res) => {
  res.json({ history: scorer.getHistory(req.params.agentId) });
});

// ═══════════════════════════════════════════════════════════
// REST Endpoints — REAL AI Scenarios (NEW)
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/ai/scenario
 * Run a predefined scenario through real AI agents
 * Body: { scenarioId: "invoice"|"whatsapp"|"selfhealing", apiKey: "..." }
 */
app.post('/api/ai/scenario', async (req, res) => {
  let { scenarioId, apiKey } = req.body;

  if (!apiKey) {
    apiKey = process.env.GEMINI_API_KEY;
  }

  if (!apiKey) {
    return res.status(400).json({ success: false, error: 'Gemini API key is required. Set it in Settings.' });
  }

  if (!scenarioId) {
    return res.status(400).json({ success: false, error: 'scenarioId is required.' });
  }

  if (orchestrator.isRunning) {
    return res.status(409).json({ success: false, error: 'A scenario is already running. Wait for it to complete.' });
  }

  try {
    console.log(`\n[AI] 🚀 Starting REAL AI scenario: ${scenarioId}`);
    const result = await orchestrator.runScenario(scenarioId, apiKey);
    console.log(`[AI] ✅ Scenario complete. Tokens: ${result.totalTokens}, Cost: $${result.totalCost.toFixed(6)}, Latency: ${result.totalLatency}ms\n`);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error(`[AI] ❌ Scenario error:`, error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/ai/custom
 * Run a custom user prompt through the AI agent chain
 * Body: { prompt: "...", apiKey: "..." }
 */
app.post('/api/ai/custom', async (req, res) => {
  let { prompt, apiKey } = req.body;
  
  if (!apiKey) {
    apiKey = process.env.GEMINI_API_KEY;
  }

  if (!apiKey) {
    return res.status(400).json({ success: false, error: 'Gemini API key is required. Set it in Settings.' });
  }

  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Prompt is required.' });
  }

  if (orchestrator.isRunning) {
    return res.status(409).json({ success: false, error: 'A scenario is already running. Wait for it to complete.' });
  }

  try {
    console.log(`\n[AI] 🧠 Starting CUSTOM AI scenario: "${prompt.substring(0, 80)}..."`);
    const result = await orchestrator.runCustomPrompt(prompt, apiKey);
    console.log(`[AI] ✅ Custom scenario complete. Tokens: ${result.totalTokens}, Cost: $${result.totalCost.toFixed(6)}\n`);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error(`[AI] ❌ Custom scenario error:`, error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ai/scenarios
 * List available AI scenarios
 */
app.get('/api/ai/scenarios', (req, res) => {
  res.json(orchestrator.getScenarios());
});

/**
 * POST /api/ai/validate-key
 * Validate a Gemini API key
 */
app.post('/api/ai/validate-key', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ valid: false, error: 'No API key provided.' });
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Say "OK" in one word.');
    const text = result.response.text();
    res.json({ valid: true, response: text.trim() });
  } catch (error) {
    res.json({ valid: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// REST Endpoints — Agent Import Feature (NEW, ADDITIVE)
// Import agents from n8n workflows or GitHub repos
// ═══════════════════════════════════════════════════════════

const { previewN8nWorkflow, executeN8nImport, checkN8nHealth } = require('./importers/n8nImporter');
const { previewGitHubRepo, executeGitHubImport, checkAllowlist, ALLOWED_REPOS } = require('./importers/githubImporter');
const importJobStore = require('./importers/importJobStore');

/**
 * GET /api/import/n8n/health
 * Check if the n8n instance is reachable
 */
app.get('/api/import/n8n/health', async (req, res) => {
  try {
    const health = await checkN8nHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ reachable: false, error: error.message });
  }
});

/**
 * POST /api/import/n8n/preview
 * Preview an n8n workflow before importing
 * Body: { url: "http://localhost:5678/api/v1/workflows/1" }
 */
app.post('/api/import/n8n/preview', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'A valid n8n workflow URL is required.' });
  }

  try {
    const preview = await previewN8nWorkflow(url);
    res.json({ success: true, preview });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/import/github/preview
 * Preview a GitHub repo before importing
 * Body: { url: "https://github.com/user/repo", branch: "main", path: "/" }
 */
app.post('/api/import/github/preview', async (req, res) => {
  const { url, branch, path: subPath } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'A valid GitHub repository URL is required.' });
  }

  try {
    const preview = await previewGitHubRepo(url, branch, subPath);

    // If not in allowlist, return the allowlist info
    if (!preview.allowed) {
      return res.status(403).json({
        success: false,
        error: preview.error,
        allowedRepos: preview.allowedRepos,
      });
    }

    res.json({ success: true, preview });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/import/github/allowlist
 * Get the list of allowed GitHub repos for import
 */
app.get('/api/import/github/allowlist', (req, res) => {
  res.json({
    repos: ALLOWED_REPOS.map(r => ({
      url: r.url,
      label: r.label,
      description: r.description,
      language: r.language,
    })),
  });
});

/**
 * POST /api/import/confirm
 * Confirm and start an import job
 * Body: { source_type: "n8n"|"github", source_url: "...", preview_data: {...} }
 */
app.post('/api/import/confirm', async (req, res) => {
  const { source_type, source_url, preview_data } = req.body;

  if (!source_type || !source_url || !preview_data) {
    return res.status(400).json({
      success: false,
      error: 'source_type, source_url, and preview_data are required.',
    });
  }

  if (!['n8n', 'github'].includes(source_type)) {
    return res.status(400).json({ success: false, error: 'source_type must be "n8n" or "github".' });
  }

  // Create the import job
  const job = importJobStore.createJob(source_type, source_url, preview_data);

  console.log(`\n[Import] 📦 Created import job ${job.id} (${source_type}) — swarm_id: ${job.swarm_id}`);

  // Start execution asynchronously (don't await — return immediately)
  if (source_type === 'n8n') {
    executeN8nImport(job, io, preview_data).catch(err => {
      console.error(`[Import] n8n job ${job.id} error:`, err.message);
      importJobStore.updateStatus(job.id, 'failed', err.message);
    });
  } else {
    executeGitHubImport(job, io, preview_data).catch(err => {
      console.error(`[Import] GitHub job ${job.id} error:`, err.message);
      importJobStore.updateStatus(job.id, 'failed', err.message);
    });
  }

  res.json({
    success: true,
    job: importJobStore.serialize(job),
  });
});

/**
 * GET /api/import/jobs
 * List all import jobs
 */
app.get('/api/import/jobs', (req, res) => {
  const jobs = importJobStore.listJobs().map(j => importJobStore.serialize(j));
  res.json({ jobs });
});

/**
 * GET /api/import/jobs/:id
 * Get a specific import job
 */
app.get('/api/import/jobs/:id', (req, res) => {
  const job = importJobStore.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found.' });
  }
  res.json({ success: true, job: importJobStore.serialize(job) });
});

/**
 * POST /api/import/jobs/:id/stop
 * Stop a running import job (kill switch)
 */
app.post('/api/import/jobs/:id/stop', (req, res) => {
  const success = importJobStore.stopJob(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, error: 'Job not found.' });
  }
  console.log(`[Import] 🛑 Stopped import job ${req.params.id}`);
  res.json({ success: true, message: 'Import job stopped.' });
});

// ── WebSocket ──

io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  const status = simulator.getStatus();
  for (const agent of Object.values(status.agents)) {
    socket.emit('agent:update', agent);
  }

  // Listen for live scenario requests via WebSocket too
  socket.on('ai:run-scenario', async (data) => {
    const { scenarioId, apiKey } = data;
    if (!apiKey || !scenarioId) return;
    try {
      await orchestrator.runScenario(scenarioId, apiKey);
    } catch (err) {
      socket.emit('live:error', { error: err.message });
    }
  });

  socket.on('ai:run-custom', async (data) => {
    const { prompt, apiKey } = data;
    if (!apiKey || !prompt) return;
    try {
      await orchestrator.runCustomPrompt(prompt, apiKey);
    } catch (err) {
      socket.emit('live:error', { error: err.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// ── Start Server ──

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔═══════════════════════════════════════════════════╗');
  console.log('  ║                                                   ║');
  console.log('  ║        🧠  SYNAPSE OBSERVATORY — SERVER           ║');
  console.log('  ║                                                   ║');
  console.log(`  ║        API:       http://localhost:${PORT}            ║`);
  console.log('  ║        WebSocket: ws://localhost:4000              ║');
  console.log('  ║                                                   ║');
  console.log('  ║        🔴 Simulation Engine: ACTIVE               ║');
  console.log('  ║        🟢 AI Orchestrator:   READY                ║');
  console.log('  ║        📦 Agent Importer:    READY                ║');
  console.log('  ║                                                   ║');
  console.log('  ╚═══════════════════════════════════════════════════╝');
  console.log('');

  simulator.start();
});
