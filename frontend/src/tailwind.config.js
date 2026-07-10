/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Void navy — the base background scale (not pure black, slight blue undertone)
        dark: {
          50: "#F1F1F6",
          100: "#D9DAE6",
          200: "#B3B5CC",
          300: "#8B8FA3",
          400: "#5C5F78",
          500: "#3A3C52",
          600: "#26283D",
          700: "#1A1B2C",
          800: "#12132056",
          850: "#14152599",
          900: "#0E0F1A",
          950: "#0A0B14",
        },
        // Electric indigo — primary accent
        indigo: {
          50: "#EEECFF",
          100: "#DBD7FF",
          200: "#B7AFFF",
          300: "#8F82FA",
          400: "#7367F0",
          500: "#5B4FE8",
          600: "#4B3FD4",
          700: "#3B30AC",
          800: "#2C2482",
          900: "#1E1859",
        },
        // Signal emerald — high match / success
        signal: {
          400: "#4ADE80",
          500: "#34D399",
          600: "#0FAF7F",
        },
        // Amber — attention / mid match
        caution: {
          400: "#FBBF24",
          500: "#F59E0B",
        },
        // Coral — low match / warning
        alert: {
          400: "#FB7185",
          500: "#F43F5E",
        },
      },
      fontFamily: {
        display: ["Outfit", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "trajectory-glow":
          "radial-gradient(120% 100% at 15% 0%, rgba(91,79,232,0.18) 0%, rgba(10,11,20,0) 55%), radial-gradient(90% 70% at 100% 100%, rgba(52,211,153,0.10) 0%, rgba(10,11,20,0) 50%)",
        "arc-stroke":
          "linear-gradient(90deg, transparent 0%, rgba(91,79,232,0.9) 35%, rgba(52,211,153,0.9) 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0,0,0,0.45), inset 0 1px 0 0 rgba(255,255,255,0.06)",
        "glass-hover": "0 12px 40px 0 rgba(91,79,232,0.25), inset 0 1px 0 0 rgba(255,255,255,0.08)",
      },
      backdropBlur: {
        glass: "20px",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
