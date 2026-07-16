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

require('dotenv').config();

const PORT = 4000;
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

// ── Initialize Both Engines ──
const simulator = new AgentSimulator(io);               // Ambient simulation (keeps the live swarm view alive)
const orchestrator = new AIAgentOrchestrator(io);         // Real AI-powered scenarios

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
  console.log('  ║                                                   ║');
  console.log('  ╚═══════════════════════════════════════════════════╝');
  console.log('');

  simulator.start();
});
