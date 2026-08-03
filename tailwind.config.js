/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0B0F19',
        surface: '#111827',
        surface2: '#1A2234',
        edge: '#1F2937',
        accent: '#06B6D4',
        danger: '#EF4444',
        warn: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 18px rgba(6,182,212,0.35)',
        'glow-red': '0 0 24px rgba(239,68,68,0.55)',
        'glow-amber': '0 0 18px rgba(245,158,11,0.4)',
        panel: '0 8px 32px rgba(0,0,0,0.45)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.9' },
          '100%': { transform: 'scale(2.6)', opacity: '0' },
        },
        'confirm-pop': {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'toast-in': {
          '0%': { transform: 'translateX(110%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'scan-line': {
          '0%': { top: '0%' },
          '50%': { top: '85%' },
          '100%': { top: '0%' },
        },
        'live-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
        'confirm-pop': 'confirm-pop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'toast-in': 'toast-in 0.3s cubic-bezier(0.21, 1.02, 0.73, 1)',
        'scan-line': 'scan-line 3.4s ease-in-out infinite',
        'live-blink': 'live-blink 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
