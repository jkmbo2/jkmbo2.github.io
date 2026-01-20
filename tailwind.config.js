/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#6366f1", // Indigo
          secondary: "#ec4899", // Pink
          accent: "#10b981", // Emerald
          bg: "#f8fafc", // Slate 50
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'scan-light': 'scan-light 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'scan-light': {
          '0%': { transform: 'translateY(-100%)', opacity: 0 },
          '50%': { opacity: 1 },
          '100%': { transform: 'translateY(100%)', opacity: 0 },
        }
      }
    },
  },
  plugins: [],
}
