const INSTALL_DISMISSED_KEY = "km_install_dismissed";

/**
 * True once the app is already running as an installed/home-screen PWA —
 * used to hide install affordances that would otherwise be confusing inside
 * an already-installed app. Covers the standard `display-mode` media query
 * (Chromium/Android) and iOS Safari's older `navigator.standalone` flag.
 */
export function isStandalone(): boolean {
  const displayModeStandalone = typeof window !== "undefined" && typeof window.matchMedia === "function"
    && window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = typeof navigator !== "undefined" && (navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(displayModeStandalone || iosStandalone);
}

/**
 * iOS Safari never fires `beforeinstallprompt`, so it needs its own
 * "Share -> Add to Home Screen" instructions instead of an install button.
 * Deliberately excludes other WebKit-based iOS browsers' UA strings only
 * where they're indistinguishable from Safari — this is a best-effort UA
 * check, not a security boundary.
 */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isAppleMobile = /iPad|iPhone|iPod/.test(ua);
  const isIPadOS13Plus = navigator.platform === "MacIntel" && (navigator as unknown as { maxTouchPoints?: number }).maxTouchPoints
    ? (navigator as unknown as { maxTouchPoints?: number }).maxTouchPoints! > 1
    : false;
  return isAppleMobile || isIPadOS13Plus;
}

export function isInstallDismissed(): boolean {
  try {
    return localStorage.getItem(INSTALL_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissInstall(): void {
  try {
    localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
  } catch {
    // private browsing / storage disabled — dismissal just won't persist
  }
}
