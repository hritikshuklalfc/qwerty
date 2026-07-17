import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    entries: ['index.html', 'src/**/*.{js,jsx,ts,tsx}'],
  },
  server: {
    // Let /framer/* be served as static files from public/
    // Everything else falls back to index.html for React Router
    fs: {
      // Allow serving files from public directory
      allow: ['..'],
    },
  },
})
