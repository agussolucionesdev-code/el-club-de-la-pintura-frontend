/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#FCD34D",
          DEFAULT: "#F59E0B",
          dark: "#D97706",
        },
        dark: {
          bg: "#030712",
          card: "#0f172a",
          border: "#1e293b",
        },
      },
      boxShadow: {
        "glass-light": "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
        "glass-dark": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      animation: {
        "fade-in-up": "fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        blob: "blob 10s infinite",
        // --- NUEVAS ANIMACIONES SUAVES Y DESDE DISTINTOS ÁNGULOS ---
        "smooth-reveal":
          "smoothReveal 2s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "slide-in-left":
          "slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in-right":
          "slideInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in-bottom":
          "slideInBottom 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(50px) scale(0.9)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        // Revelado fluido como si se corriera un telón de luz
        smoothReveal: {
          "0%": { clipPath: "inset(0 100% 0 0)" },
          "100%": { clipPath: "inset(0 0 0 0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-40px) scale(0.9)" },
          "100%": { opacity: "1", transform: "translateX(0) scale(1)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(40px) scale(0.9)" },
          "100%": { opacity: "1", transform: "translateX(0) scale(1)" },
        },
        slideInBottom: {
          "0%": { opacity: "0", transform: "translateY(40px) scale(0.9)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
