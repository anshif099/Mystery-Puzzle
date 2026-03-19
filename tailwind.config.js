/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mint: ({ opacityValue }) => {
          if (opacityValue === undefined) {
            return 'rgb(var(--color-mint-rgb))';
          }
          return `rgba(var(--color-mint-rgb), ${opacityValue})`;
        },
        "soft-yellow": "#E8E78E",
        "lavender-blue": ({ opacityValue }) => {
          if (opacityValue === undefined) {
            return 'rgb(var(--color-lavender-blue-rgb))';
          }
          return `rgba(var(--color-lavender-blue-rgb), ${opacityValue})`;
        },
        "sky-blue": "#6FA8DC",
        accent: "#FF6B6B",
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.8, transform: 'scale(1.05)' },
        }
      }
    },
  },
  plugins: [],
}
