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
        stencil: ["var(--font-stencil)", "var(--font-inter)", "sans-serif"],
      },
      letterSpacing: {
        dispatch: "0.22em",
        stencil: "0.06em",
      },
      backgroundImage: {
        "concrete-grain":
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.12  0 0 0 0 0.10  0 0 0 0 0.08  0 0 0 0.22 0'/></filter><rect width='240' height='240' filter='url(%23n)' opacity='0.55'/></svg>\")",
        "steel-brush":
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='40'><filter id='b'><feTurbulence type='turbulence' baseFrequency='0.02 1.2' numOctaves='2'/><feColorMatrix values='0 0 0 0 0.30  0 0 0 0 0.28  0 0 0 0 0.26  0 0 0 0.18 0'/></filter><rect width='400' height='40' filter='url(%23b)'/></svg>\")",
      },
      boxShadow: {
        bay: "0 1px 0 oklch(0.40 0.015 40 / 0.5) inset, 0 -1px 0 oklch(0.10 0.008 40 / 0.6) inset, 0 20px 40px -28px oklch(0.05 0.005 40 / 0.9)",
        emberglow:
          "0 0 0 1px oklch(0.56 0.20 35 / 0.45), 0 18px 60px -16px oklch(0.50 0.18 34 / 0.55), inset 0 0 0 1px oklch(0.64 0.21 38 / 0.10)",
        rivet:
          "inset 0 0 0 1px oklch(0.32 0.012 40), inset 0 1px 0 oklch(0.42 0.014 40 / 0.5)",
      },
      animation: {
        "alarm-pulse": "alarm-pulse 1.6s ease-out infinite",
        "signal-blink": "signal-blink 2s steps(2, jump-none) infinite",
      },
      keyframes: {
        "alarm-pulse": {
          "0%": { opacity: "0.95" },
          "50%": { opacity: "0.35" },
          "100%": { opacity: "0.95" },
        },
        "signal-blink": {
          "0%, 50%": { opacity: "1" },
          "50.01%, 100%": { opacity: "0.4" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
