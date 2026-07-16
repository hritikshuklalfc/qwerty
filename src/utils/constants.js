export const APP_NAME = "Synapse Observatory";
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.synapse.io' 
  : 'http://localhost:3000';

// Backend server URL (Express + Socket.IO) — used for AI orchestration & Live Swarm
// In production (Vercel), this should point to the Railway-deployed backend.
// Set VITE_BACKEND_URL in Vercel environment variables.
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
