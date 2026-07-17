const express = require('express');
const cors = require('cors');


const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'synapse-observatory', timestamp: new Date().toISOString() });
});

// Agent stats endpoint — returns mock data for the Command Center
// In production this would connect to a real agent orchestration backend
app.get('/api/n8n/stats', (req, res) => {
  res.json({
    workflows: 5,
    totalActions: 0,
    source: 'agent-simulator'
  });
});

app.listen(PORT, () => {
  console.log(`Synapse Observatory API running on http://localhost:${PORT}`);
});
