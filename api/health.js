export default function handler(req, res) {
  res.status(200).json({ status: 'ok', service: 'synapse-observatory', timestamp: new Date().toISOString() });
}
