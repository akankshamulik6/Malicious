/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        darkBg: "#0F1715",
        cardBg: "#182420",
        accentGreen: "#22E570",
        softGreen: "#1B3B2B",
      },
    },
  },
  plugins: [],
};