/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink:    { DEFAULT: '#0D0A0B', 50: '#1a1518' },
        vermil: { DEFAULT: '#C0392B', light: '#E74C3C', dark: '#962D22' },
        jade:   { DEFAULT: '#1A7A4A', light: '#27AE60', glow: '#2ECC71' },
        gold:   { DEFAULT: '#D4AF37', light: '#F1C40F', pale: '#F9E07A' },
        smoke:  { DEFAULT: '#8E8082', light: '#BDB2B5', dark: '#5C5256' },
        paper:  { DEFAULT: '#F5ECD7', dark: '#E8D5B0' },
        spirit: { DEFAULT: '#7B2D8B', light: '#9B59B6', glow: '#AF7AC5' },
      },
      fontFamily: {
        display: ['"Noto Serif"', 'serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
        cjk:     ['"Noto Serif SC"', '"Noto Serif"', 'serif'],
      },
      animation: {
        'float':      'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shake':      'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'ritual':     'ritual 4s linear infinite',
        'fade-up':    'fadeUp 0.5s ease forwards',
        'spin-slow':  'spin 8s linear infinite',
        'flicker':    'flicker 1.5s ease-in-out infinite',
      },
      keyframes: {
        float:      { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        pulseGlow:  { '0%,100%': { boxShadow: '0 0 10px rgba(212,175,55,0.3)' }, '50%': { boxShadow: '0 0 30px rgba(212,175,55,0.8)' } },
        shake:      { '10%,90%': { transform: 'translate3d(-1px,0,0)' }, '20%,80%': { transform: 'translate3d(2px,0,0)' }, '30%,50%,70%': { transform: 'translate3d(-3px,0,0)' }, '40%,60%': { transform: 'translate3d(3px,0,0)' } },
        ritual:     { '0%': { strokeDashoffset: '1000' }, '100%': { strokeDashoffset: '0' } },
        fadeUp:     { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        flicker:    { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
      backgroundImage: {
        'paper-texture': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        'hex-grid': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z' fill='%23D4AF37' fill-opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
