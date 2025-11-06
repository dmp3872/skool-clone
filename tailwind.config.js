/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        docker: {
          50: '#e6f3ff',
          100: '#b3deff',
          200: '#80c9ff',
          300: '#4db3ff',
          400: '#1a9eff',
          500: '#0db7ed',
          600: '#0a92bd',
          700: '#086d8e',
          800: '#05495e',
          900: '#03242f',
        },
        primary: {
          50: '#e6f3ff',
          100: '#b3deff',
          200: '#80c9ff',
          300: '#4db3ff',
          400: '#1a9eff',
          500: '#0db7ed',
          600: '#0a92bd',
          700: '#086d8e',
          800: '#05495e',
          900: '#03242f',
        },
      },
    },
  },
  plugins: [],
};
