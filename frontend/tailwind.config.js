/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf8f0',
          100: '#faecd9',
          200: '#f4d5a8',
          300: '#ecb96d',
          400: '#e39a3d',
          500: '#d4801f',
          600: '#bc6417',
          700: '#9b4c16',
          800: '#7d3d18',
          900: '#673317',
        },
        dark: {
          900: '#0d0d0d',
          800: '#161616',
          700: '#1e1e1e',
          600: '#2a2a2a',
          500: '#3a3a3a',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
