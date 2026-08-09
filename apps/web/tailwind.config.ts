import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#04AEB0",
        brandDark: "#047F82",
        cyan: "#00D8FF",
        gold: "#D4AF37",
        ink: "#162B38",
        muted: "#60727E",
        appBg: "#F5FAFB",
        borderSoft: "#D6E6E8"
      },
      boxShadow: {
        norb: "0 8px 24px rgba(22, 43, 56, .08)",
        norbLg: "0 24px 70px rgba(22, 43, 56, .14)"
      }
    }
  },
  plugins: []
} satisfies Config;
