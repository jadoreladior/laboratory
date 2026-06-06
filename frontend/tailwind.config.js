/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Unbounded', 'sans-serif'],
      },
      colors: {
        lab: {
          bg:      '#0E0E0E',
          card:    '#1A1A1A',
          border:  '#2A2A2A',
          lily:    '#C17BFF',   // лиловый — основной акцент
          'lily-dim': '#8B4FC8',
          red:     '#FF4B4B',   // красный неон — студия
          muted:   '#888888',
          white:   '#FFFFFF',
        },
      },
      animation: {
        'fade-in':  'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 },                            to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.95)' },  to: { opacity: 1, transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}
