import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/shared/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        concrete: {
          950: "oklch(0.14 0.008 40)",
          900: "oklch(0.18 0.009 40)",
          850: "oklch(0.20 0.010 40)",
          800: "oklch(0.22 0.010 40)",
          750: "oklch(0.25 0.011 40)",
          700: "oklch(0.28 0.012 40)",
          600: "oklch(0.36 0.012 40)",
          500: "oklch(0.46 0.012 40)",
        },
        steel: {
          600: "oklch(0.42 0.012 220)",
          500: "oklch(0.52 0.012 220)",
          400: "oklch(0.62 0.011 220)",
          300: "oklch(0.74 0.010 220)",
          200: "oklch(0.84 0.008 220)",
        },
        bone: {
          100: "oklch(0.94 0.005 80)",
          200: "oklch(0.88 0.006 80)",
        },
        ember: {
          950: "oklch(0.22 0.10 32)",
          900: "oklch(0.32 0.13 32)",
          800: "oklch(0.42 0.16 33)",
          700: "oklch(0.50 0.18 34)",
          600: "oklch(0.56 0.20 35)",
          500: "oklch(0.64 0.21 38)",
          400: "oklch(0.72 0.19 42)",
        },
        signal: {
          yellow: "oklch(0.83 0.16 92)",
          "yellow-dim": "oklch(0.48 0.10 92)",
          green: "oklch(0.72 0.16 155)",
          "green-dim": "oklch(0.40 0.09 155)",
          ice: "oklch(0.78 0.07 220)",
          "ice-dim": "oklch(0.40 0.05 220)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
