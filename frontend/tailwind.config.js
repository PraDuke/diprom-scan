/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#1d4ed8", light: "#3b82f6", dark: "#1e3a8a" },
        surface: "#f8fafc",
      },
      fontFamily: {
        sans: ["'Noto Sans Thai'", "'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
