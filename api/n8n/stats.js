export default function handler(req, res) {
  res.status(200).json({ workflows: 5, totalActions: 0, source: 'agent-simulator' });
}
