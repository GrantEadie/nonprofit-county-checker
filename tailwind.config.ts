import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        krona: ["var(--font-krona-one)", "sans-serif"],
      },
      colors: {
        surface: {
          DEFAULT: "#0f0f11",
          1: "#141418",
          2: "#1a1a1f",
          3: "#202026",
        },
      },
    },
  },
  plugins: [],
};

export default config;
