export const APP_NAME = "Synapse Observatory";
const IS_PROD = process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost';

export const API_BASE_URL = IS_PROD 
  ? 'https://api.synapse.io' 
  : 'http://localhost:3000';

export const OBSERVATORY_URL = IS_PROD
  ? 'https://synapse-os-server-production.up.railway.app'
  : 'http://localhost:5175';

export const ENGINE_URL = IS_PROD
  ? '/n8n' // Will be proxied by vercel.json
  : 'http://localhost:8000';

export const SOCKET_URL = IS_PROD
  ? 'https://synapse-os-server-production.up.railway.app'
  : 'http://localhost:4000';
