/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        deep: 'var(--bg-deep)',
        surface: 'var(--bg-surface)',
        surface2: 'var(--bg-surface2)',
        panel: 'var(--bg-panel)',
        edge: 'var(--border-edge)',
        edge2: 'var(--border-edge2)',
        gold: '#C9A227',
        'gold-soft': '#E4C35A',
        steel: '#4C7BB5',
        cyan: '#22D3EE',
        sea: '#0EA5A4',
        danger: '#F43F5E',
        warn: '#F59E0B',
        info: '#38BDF8',
        okay: '#22C55E',
      },
      fontFamily: {
        sans: ['Rajdhani', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'Rajdhani', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'neo-raised': 'var(--neo-raised)',
        'neo-raised-sm': 'var(--neo-raised-sm)',
        'neo-inset': 'var(--neo-inset)',
        'neo-inset-sm': 'var(--neo-inset-sm)',
        'glow-gold': '0 0 22px rgba(201,162,39,0.35)',
        'glow-cyan': '0 0 18px rgba(34,211,238,0.35)',
        'glow-red': '0 0 26px rgba(244,63,94,0.55)',
        'glow-amber': '0 0 18px rgba(245,158,11,0.4)',
        panel: '0 12px 40px rgba(0,0,0,0.55)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.9' },
          '100%': { transform: 'scale(2.8)', opacity: '0' },
        },
        'confirm-pop': {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.215,0.61,0.355,1) infinite',
        'confirm-pop': 'confirm-pop 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        'fade-up': 'fade-up 0.35s ease-out',
      },
    },
  },
  plugins: [],
}
