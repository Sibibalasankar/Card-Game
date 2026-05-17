/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        poker: {
          dark: '#07160e',
          table: '#0f3c25',
          felt: '#135c36',
          border: '#2c6a46',
          gold: '#ffd700',
          accent: '#c5a85c',
        },
        custom: {
          dark: '#0d0d12',
          card: '#16161f',
          accent: '#6366f1',
          danger: '#ef4444',
          success: '#10b981',
          warning: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        outfit: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        'card-glow': '0 0 15px rgba(255, 215, 0, 0.6)',
        'active-glow': '0 0 20px rgba(99, 102, 241, 0.8)',
        'neon-green': '0 0 15px rgba(16, 185, 129, 0.5)',
      },
      backgroundImage: {
        'radial-table': 'radial-gradient(circle, #1d6e42 0%, #0d3820 60%, #07170e 100%)',
        'radial-dark': 'radial-gradient(circle, #1a1a24 0%, #0b0b0f 100%)',
      }
    },
  },
  plugins: [],
}
