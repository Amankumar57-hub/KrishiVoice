/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      colors: {
        primary: {
          DEFAULT: '#3730A3', // Imperial Violet / Deep Indigo
          light:   '#818cf8',
          dark:    '#1e1b4b',
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5', 
          700: '#4338ca', 
          800: '#3730a3',
          900: '#312e81',
        },
        amber: {
          DEFAULT: '#06b6d4', // Swapped out Amber for Cyber Cyan
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        earth: '#1e1b4b',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        hindi:   ['"Noto Sans Devanagari"', 'sans-serif'],
      },
      backgroundImage: {
        'farm-gradient': 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #6366f1 100%)',
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseGreen: { '0%,100%': { boxShadow: '0 0 0 0 rgba(79,70,229,0.35)' }, '50%': { boxShadow: '0 0 0 20px rgba(79,70,229,0)' } },
      },
    },
  },
  plugins: [],
}
