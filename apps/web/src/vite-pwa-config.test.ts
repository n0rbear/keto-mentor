import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const VITE_CONFIG_PATH = resolve(import.meta.dirname, "..", "vite.config.ts");

/**
 * The application contains user-specific nutrition/diary data. This asserts
 * directly on the source of the PWA plugin config that no authenticated API
 * traffic can ever be runtime-cached by the generated service worker — the
 * network must stay authoritative for auth/profile/meals/recipes/food
 * search/barcode. A source-level assertion (rather than introspecting the
 * built plugin instance, whose internal shape isn't a stable public API) is
 * the most direct, least brittle way to pin this down.
 */
describe("PWA service worker caching strategy (vite.config.ts)", () => {
  it("configures no runtimeCaching entries and never references the API origin", async () => {
    const source = await readFile(VITE_CONFIG_PATH, "utf8");
    expect(source).toMatch(/VitePWA\(/);
    expect(source).toMatch(/globPatterns/);
    expect(source).not.toMatch(/runtimeCaching\s*:/);
    expect(source).not.toMatch(/keto-mentor-api|VITE_API_URL/);
  });

  it("uses registerType \"prompt\" so an update is never applied without an explicit user action", async () => {
    const source = await readFile(VITE_CONFIG_PATH, "utf8");
    expect(source).toMatch(/registerType:\s*"prompt"/);
  });
});
