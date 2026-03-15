/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // El Dorado/Amarillo del logo para botones y acentos
        brand: {
          light: "#FCD34D", // Amber 300
          DEFAULT: "#F59E0B", // Amber 500
          dark: "#D97706", // Amber 600
        },
        // Fondos oscuros elegantes
        dark: {
          bg: "#0F172A", // Slate 900
          card: "#1E293B", // Slate 800
          border: "#334155", // Slate 700
        },
      },
    },
  },
  plugins: [],
};
