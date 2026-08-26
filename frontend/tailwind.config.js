/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agri: {
          50: '#f4f8f5',
          100: '#e3efe6',
          200: '#c5decb',
          300: '#9bc4a5',
          400: '#6ea47a',
          500: '#488555',
          600: '#356a42',
          700: '#2b5435',
          800: '#1b4332',
          900: '#17392b',
        },
        earth: {
          50: '#faf9f6',
          100: '#f4f1ea',
          200: '#e6ded1',
          300: '#d2c4b0',
          400: '#baa58b',
          500: '#a3896c',
          600: '#8e7155',
          700: '#725844',
          800: '#5e493a',
          900: '#4f3e32',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
