/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Naval command-center palette
        base: '#050B18',
        deep: '#07101F',
        surface: '#0B182B',
        surface2: '#0F1F38',
        panel: '#10233F',
        edge: '#1B324F',
        edge2: '#24466B',
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
        'glow-gold': '0 0 22px rgba(201,162,39,0.35)',
        'glow-cyan': '0 0 18px rgba(34,211,238,0.35)',
        'glow-red': '0 0 26px rgba(244,63,94,0.55)',
        'glow-amber': '0 0 18px rgba(245,158,11,0.4)',
        panel: '0 12px 40px rgba(0,0,0,0.55)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      backgroundImage: {
        'grid-lines':
          'linear-gradient(rgba(76,123,181,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(76,123,181,0.06) 1px, transparent 1px)',
        'radar':
          'radial-gradient(circle at center, rgba(14,165,164,0.12) 0%, transparent 60%)',
      },
      backgroundSize: {
        grid: '28px 28px',
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
        'toast-in': {
          '0%': { transform: 'translateX(110%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'scan-line': {
          '0%': { top: '0%' },
          '50%': { top: '92%' },
          '100%': { top: '0%' },
        },
        'live-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pin-ping': {
          '0%': { transform: 'scale(0.9)', opacity: '0.8' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        'fade-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.215,0.61,0.355,1) infinite',
        'confirm-pop': 'confirm-pop 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        'toast-in': 'toast-in 0.3s cubic-bezier(0.21,1.02,0.73,1)',
        'scan-line': 'scan-line 3.6s ease-in-out infinite',
        'live-blink': 'live-blink 1.6s ease-in-out infinite',
        'radar-sweep': 'radar-sweep 4s linear infinite',
        'pin-ping': 'pin-ping 1.6s cubic-bezier(0,0,0.2,1) infinite',
        'fade-up': 'fade-up 0.35s ease-out',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
}
