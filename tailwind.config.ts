import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans:  ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        oswald: ["var(--font-oswald)", "sans-serif"],
      },
      colors: {
        // ── Semantic tokens (CSS-variable backed — auto light/dark) ──────
        page: "var(--page)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        ink: {
          1: "var(--ink-1)",
          2: "var(--ink-2)",
          3: "var(--ink-3)",
          4: "var(--ink-4)",
        },
        viable: "var(--viable-text)",
        // ── Palette (fixed) ───────────────────────────────────────────────
        // Shadow Grey       #1e212b
        // Forest Green      #4d8b31
        // School Bus Yellow #ffc800
        // Vivid Tangerine   #ff8427
        // White             #ffffff
        "shadow-grey":    "#1e212b",
        "forest-green":   "#4d8b31",
        "school-yellow":  "#ffc800",
        tangerine:        "#ff8427",
      },
    },
  },
  plugins: [],
};

export default config;
