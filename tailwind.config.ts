import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#020617",       // Deep Void Black
        matrix: "#00ff9d",     // Safe/System
        amber: "#f59e0b",      // Caution/Intel
        crimson: "#ef4444",    // Critical/Strike
        slate: "#1e293b",      // Data/Structure
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'grid-overlay': "linear-gradient(rgba(0, 255, 157, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 157, 0.1) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
export default config;