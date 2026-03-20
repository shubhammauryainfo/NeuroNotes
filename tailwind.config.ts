import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./server/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#121212",
        cream: "#fff9ed",
        lemon: "#ffe66d",
        mint: "#90f1b8",
        sky: "#8ec5ff",
        coral: "#ff8f6b",
        rose: "#ff6fae"
      },
      boxShadow: {
        brutal: "6px 6px 0 0 #121212",
        "brutal-sm": "4px 4px 0 0 #121212"
      },
      fontFamily: {
        sans: ["Arial Black", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
