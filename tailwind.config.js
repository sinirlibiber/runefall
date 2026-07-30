/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: "#0A0C16",
          soft: "#12162A",
          line: "#232a4a",
        },
        parchment: {
          DEFAULT: "#E9DCC0",
          dim: "#C9B98F",
        },
        ember: {
          DEFAULT: "#D4A24C",
          hot: "#F2B84B",
          deep: "#8A5A22",
        },
        arcane: {
          DEFAULT: "#7B5EA7",
          bright: "#A785D6",
        },
        blood: {
          DEFAULT: "#C1443C",
          bright: "#E85F52",
        },
        mana: {
          DEFAULT: "#3E8FB0",
          bright: "#59B8DE",
        },
      },
      fontFamily: {
        display: ["Cinzel", "serif"],
        body: ["Spectral", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        rune: "0 0 18px rgba(212,162,76,0.55)",
        arcane: "0 0 22px rgba(123,94,167,0.6)",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.72 },
        },
        risesmoke: {
          "0%": { transform: "translateY(0) scale(1)", opacity: 0.5 },
          "100%": { transform: "translateY(-40px) scale(1.6)", opacity: 0 },
        },
      },
      animation: {
        flicker: "flicker 3s ease-in-out infinite",
        risesmoke: "risesmoke 2.2s ease-out infinite",
      },
    },
  },
  plugins: [],
};
