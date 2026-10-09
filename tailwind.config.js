/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f0f11',
          surface: '#1a1a1e',
          surfaceLight: '#222226',
          sunken: '#151518',
          border: 'rgba(255, 255, 255, 0.1)',
        },
        brand: {
          amber: '#f59e0b',
          amberHover: '#fbbf24',
          amberGlow: 'rgba(245, 158, 11, 0.15)',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
