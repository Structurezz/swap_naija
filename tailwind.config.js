/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1D9E75',
          50: '#E8F7F2',
          100: '#C5EBD9',
          200: '#8DD4B5',
          300: '#55BE91',
          400: '#2AAF83',
          500: '#1D9E75',
          600: '#187F5E',
          700: '#126047',
          800: '#0C4030',
          900: '#062019',
        },
        accent: {
          DEFAULT: '#F59E0B',
          50: '#FFF8E6',
          100: '#FEEFC0',
          200: '#FDD87A',
          300: '#FCC234',
          400: '#F5B014',
          500: '#F59E0B',
          600: '#D98308',
          700: '#B36807',
          800: '#8C4D05',
          900: '#663303',
        },
        bg: '#FAFAF8',
        ink: '#1A1A1A',
      },
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 24px rgba(0,0,0,0.12)',
        bottom: '0 -2px 12px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
