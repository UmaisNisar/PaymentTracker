/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Orbitron', 'system-ui', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        nasa: {
          void: '#050508',
          grid: '#0d1117',
          panel: '#0f1419',
          line: '#1e2a3a',
          red: '#fc3d21',
          orange: '#ff6b35',
          cyan: '#00d4ff',
          lime: '#c8ff00',
          mist: '#8ba4b4',
        },
      },
      boxShadow: {
        nasa: '0 0 0 1px rgba(0, 212, 255, 0.15), 0 8px 32px rgba(0, 0, 0, 0.45)',
        'nasa-glow': '0 0 20px rgba(252, 61, 33, 0.25)',
      },
      backgroundImage: {
        'nasa-grid':
          'linear-gradient(rgba(0, 212, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.04) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '24px 24px',
      },
      keyframes: {
        modalIn: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(12px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        sheetIn: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        backdropIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        lightboxPop: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(252, 61, 33, 0.0)' },
          '50%': { boxShadow: '0 0 0 4px rgba(252, 61, 33, 0.15)' },
        },
        flashCyan: {
          '0%': { boxShadow: '0 0 0 0 rgba(0, 212, 255, 0.6)' },
          '100%': { boxShadow: '0 0 0 12px rgba(0, 212, 255, 0)' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'modal-in': 'modalIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'sheet-in': 'sheetIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'backdrop-in': 'backdropIn 0.22s ease-out forwards',
        'lightbox-in': 'lightboxPop 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-up': 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards',
        'slide-in': 'slideIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) backwards',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'flash-cyan': 'flashCyan 0.7s ease-out',
        'spin-slow': 'spin 0.9s linear infinite',
      },
    },
  },
  plugins: [],
}
