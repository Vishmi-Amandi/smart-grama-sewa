/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // User Module Colors
        'user-primary': {
          DEFAULT: '#F5C400',
          dark: '#d4a800',
          light: '#fff8e0',
        },
        'user-secondary': {
          DEFAULT: '#8a6040',
          dark: '#6a4020',
          light: '#f5f0e8',
        },
        'user-text': {
          DEFAULT: '#1e1200',
          light: '#666666',
          lighter: '#888888',
        },
        'user-border': {
          DEFAULT: '#e8d5ac',
          light: '#f0e8d0',
        },
        'user-background': '#f8f6f0',
        'user-surface': '#ffffff',
        'user-success': {
          DEFAULT: '#22c55e',
          light: '#e6f9ee',
        },
        'user-warning': {
          DEFAULT: '#f59e0b',
          light: '#fff3dc',
        },
        'user-error': {
          DEFAULT: '#ef4444',
          light: '#fee2e2',
        },
        'user-info': {
          DEFAULT: '#3b82f6',
          light: '#eff6ff',
        },
        
        // Dark Mode Specific Colors
        'dark-bg': '#121826',
        'dark-sidebar': '#1a2332',
        'dark-surface': '#1e293b',
        'dark-hover': '#2d3a4f',
        'dark-border': '#334155',
        'dark-text': '#f1f5f9',
        'dark-text-sub': '#94a3b8',
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        'round': '999px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease',
        'slide-up': 'slideUp 0.3s ease',
        'spin-slow': 'spin 0.8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        spin: {
          'to': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}