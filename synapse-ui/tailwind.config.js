/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#6c7e92', // The exact blue-slate from image copy 2.png
        'glass-surface': 'rgba(255, 255, 255, 0.08)',
        'glass-surface-solid': 'rgba(255, 255, 255, 0.05)', // Made translucent to enable glassmorphism everywhere
        'glass-border': 'rgba(255, 255, 255, 0.15)',
        'primary-accent': '#FF3B30', // Bright red-orange from cyborg head
        'secondary-accent': '#FFDAB9', // Soft peach for button glows
        'alert-accent': '#FF9500', 
        'text-primary': '#FFFFFF',
        'text-secondary': 'rgba(255, 255, 255, 0.85)',
        'text-tertiary': 'rgba(255, 255, 255, 0.6)',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        serif: ['Source Serif 4', 'serif'],
        mono: ['Fira Code', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 15px rgba(255, 59, 48, 0.5)' },
          '50%': { opacity: .7, boxShadow: '0 0 5px rgba(255, 59, 48, 0.2)' },
        }
      }
    },
  },
  plugins: [],
}
