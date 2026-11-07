/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#03060d', 900: '#060b16', 800: '#0b1324', 700: '#121c33', 600: '#1b2744' },
        river: { 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9' },
        flood: { 300: '#67e8f9', 400: '#22d3ee' },
        erosion: { 400: '#fb923c', 500: '#f97316' },
        risk: { high: '#ef4444', med: '#facc15', low: '#34d399' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(56,189,248,0.55)',
        glowOrange: '0 0 40px -8px rgba(249,115,22,0.55)',
      },
      keyframes: {
        drift: { '0%,100%': { transform: 'translate(0,0) scale(1)' }, '50%': { transform: 'translate(4%, -3%) scale(1.08)' } },
        shimmer: { '0%': { backgroundPosition: '0% 50%' }, '100%': { backgroundPosition: '200% 50%' } },
        pulseRing: { '0%': { transform: 'scale(.8)', opacity: '.8' }, '100%': { transform: 'scale(2.4)', opacity: '0' } },
      },
      animation: {
        drift: 'drift 18s ease-in-out infinite',
        drift2: 'drift 24s ease-in-out infinite reverse',
        shimmer: 'shimmer 6s linear infinite',
        pulseRing: 'pulseRing 2.2s cubic-bezier(.2,.6,.4,1) infinite',
      },
    },
  },
  plugins: [],
}
