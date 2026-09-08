// Test-only stand-in for the "virtual:pwa-register/react" module that
// vite-plugin-pwa injects into the real app build. Vitest's own Vite
// pipeline (vitest.config.ts) doesn't run that plugin, so this module is
// aliased in for any test that transitively imports UpdateBanner/main.tsx
// without caring about update behavior. Tests that DO care override it with
// vi.mock("virtual:pwa-register/react", ...).
import { useState } from "react";

export function useRegisterSW() {
  const needRefresh = useState(false);
  const offlineReady = useState(false);
  return { needRefresh, offlineReady, updateServiceWorker: async () => {} };
}
