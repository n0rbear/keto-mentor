// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { dismissInstall, isInstallDismissed, isIOS, isStandalone } from "./pwa";

function setMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", { value: vi.fn().mockReturnValue({ matches }), configurable: true });
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  Object.defineProperty(navigator, "standalone", { value: undefined, configurable: true });
  Reflect.deleteProperty(window, "matchMedia");
});

describe("isStandalone", () => {
  it("is false when matchMedia display-mode:standalone doesn't match and navigator.standalone is unset", () => {
    setMatchMedia(false);
    expect(isStandalone()).toBe(false);
  });

  it("is true when the display-mode media query matches (Chromium/Android installed PWA)", () => {
    setMatchMedia(true);
    expect(isStandalone()).toBe(true);
  });

  it("is true when navigator.standalone is true (iOS home-screen launch)", () => {
    setMatchMedia(false);
    Object.defineProperty(navigator, "standalone", { value: true, configurable: true });
    expect(isStandalone()).toBe(true);
  });
});

describe("isIOS", () => {
  it("detects iPhone/iPad/iPod user agents", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15");
    expect(isIOS()).toBe(true);
  });

  it("does not flag a desktop Chrome user agent as iOS", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36");
    expect(isIOS()).toBe(false);
  });

  it("does not flag a standard Android user agent as iOS", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36");
    expect(isIOS()).toBe(false);
  });
});

describe("install dismissal persistence", () => {
  it("is not dismissed by default", () => {
    expect(isInstallDismissed()).toBe(false);
  });

  it("persists a dismissal across calls", () => {
    dismissInstall();
    expect(isInstallDismissed()).toBe(true);
  });
});
