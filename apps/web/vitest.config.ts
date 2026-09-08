import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // vite-plugin-pwa only registers this virtual module in the real app
      // build (vite.config.ts); Vitest doesn't run that plugin, so it's
      // aliased to a local no-op stub here. See src/test/pwa-register-stub.ts.
      "virtual:pwa-register/react": fileURLToPath(new URL("./src/test/pwa-register-stub.ts", import.meta.url))
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"]
  }
});