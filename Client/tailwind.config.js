/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Use class strategy (not media query)
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // User Module Colors - Light Mode (default)
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
        
        // Dark Mode Colors (will be applied when dark class is added)
        dark: {
          primary: '#F5C400',
          'primary-dark': '#d4a800',
          'primary-light': '#2a2400',
          secondary: '#6a4020',
          'secondary-dark': '#5a3520',
          'secondary-light': '#2a2015',
          text: '#e8e0c8',
          'text-light': '#c0b898',
          'text-lighter': '#a09878',
          border: '#4a3a28',
          'border-light': '#3a2a1a',
          background: '#1a1510',
          surface: '#2a2018',
          success: '#22c55e',
          'success-light': '#1a3a1a',
          warning: '#f59e0b',
          'warning-light': '#3a2a10',
          error: '#ef4444',
          'error-light': '#3a1a1a',
          info: '#3b82f6',
          'info-light': '#1a2a4a',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        'round': '999px',
      },
    },
  },
  plugins: [],
}