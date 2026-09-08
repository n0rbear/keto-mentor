import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // registerType "prompt": the app controls exactly when an update is
      // applied (a small localized banner + explicit reload), so an update
      // never interrupts an in-progress meal/recipe edit. See pwa.ts.
      registerType: "prompt",
      injectRegister: false,
      manifest: {
        name: "Keto Mentor",
        short_name: "Keto Mentor",
        description: "Keto Mentor by NorbApp — guided keto goals, natural-language meal logging and a real food diary.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#0a1112",
        theme_color: "#0a1112",
        icons: [
          { src: "/pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "/maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        // Precache only the built app shell (JS/CSS/HTML/icons). No
        // runtimeCaching entries are configured — and the API lives on a
        // separate origin entirely — so authenticated requests (auth,
        // profile, meals, recipes, food search, barcode) are never
        // intercepted or cached by the service worker. The network stays
        // authoritative for all of them.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webp}"],
        globIgnores: [
          // The existing header/footer brand photo (~2.8MB, pre-dating this
          // increment) is not part of the installable app shell — it loads
          // normally from the network like any other page image and must be
          // excluded outright rather than merely size-capped, since an
          // oversized matched asset fails the build rather than just warning.
          "**/norbapp-logo-new-*.*",
          // The barcode scanner's ZXing fallback (~480KB, see manualChunks
          // below) is intentionally lazy-loaded only when a user without
          // native BarcodeDetector support opens the camera scanner — it
          // must not be silently downloaded in the background for every
          // installed user just because the service worker precaches assets.
          "**/scanner-zxing-*.js"
        ]
      },
      devOptions: { enabled: false }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@zxing/")) return "scanner-zxing";
        }
      }
    }
  },
  server: { port: 5173 },
  preview: { port: 4173 }
});
