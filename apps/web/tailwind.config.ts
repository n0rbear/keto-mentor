import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "rgb(var(--brand) / <alpha-value>)",
        brandDark: "rgb(var(--brand-deep) / <alpha-value>)",
        cyan: "rgb(var(--brand-bright) / <alpha-value>)",
        gold: "rgb(var(--warning) / <alpha-value>)",
        ink: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--text-muted) / <alpha-value>)",
        appBg: "rgb(var(--bg) / <alpha-value>)",
        borderSoft: "rgb(var(--border) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)"
      },
      boxShadow: {
        norb: "0 16px 40px rgb(0 0 0 / .28)",
        norbLg: "0 28px 80px rgb(0 0 0 / .42)"
      }
    }
  },
  plugins: []
} satisfies Config;
