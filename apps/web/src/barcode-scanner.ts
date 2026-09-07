// Camera barcode scanning facade: pure camera-and-decode logic, no product
// lookup or UI. Feeds a validated raw barcode STRING (never a number, so
// leading zeros survive) into the existing /foods/resolve-barcode pipeline
// via a single onDetected callback. Progressive enhancement: prefers the
// native BarcodeDetector Shape Detection API where it actually supports a
// relevant retail format, and falls back to a dynamically-imported
// @zxing/browser decoder (so the main bundle never pays for it) everywhere
// else. Neither backend changes server-side validation: this module only
// ever hands the server a candidate string for it to authoritatively judge.

// Retail formats we actually care about. GTIN-14 sometimes arrives via ITF in
// some decoders, but ITF is deliberately excluded here — the server's GTIN
// validation is not weakened to accommodate scanner output, so a barcode the
// server can't validate as EAN/UPC is simply not something this scanner
// should hand it.
const SCAN_FORMATS_NATIVE = ["ean_13", "ean_8", "upc_a", "upc_e"] as const;
const ZXING_FORMAT_NAMES = ["EAN_13", "EAN_8", "UPC_A", "UPC_E"] as const;

const NATIVE_SCAN_INTERVAL_MS = 300; // a few detection attempts per second
const UNSUPPORTED_REPORT_THROTTLE_MS = 1500;
const BARCODE_LENGTHS = new Set([8, 12, 13, 14]);

export type ScannerBackend = "native" | "zxing";
export type ScannerErrorKind = "camera_denied" | "camera_unavailable" | "scanner_unsupported" | "scanner_error";

export type ScannerHandlers = {
  onDetected: (barcode: string) => void;
  onError: (kind: ScannerErrorKind, detail?: unknown) => void;
  onUnsupportedCode?: () => void;
  /** Camera acquired and the detection loop is actually running. */
  onScanning?: () => void;
};

/**
 * Rejects anything that isn't a bounded, purely-numeric GTIN-shaped string —
 * hostile QR/text payloads and non-retail symbologies never reach this far.
 * This is a lightweight UX-only check; the server remains the authoritative
 * validator (checksum etc.) via GET /foods/resolve-barcode.
 */
export function normalizeScannedValue(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed) || !BARCODE_LENGTHS.has(trimmed.length)) return null;
  return trimmed;
}

export function isCameraCapable(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia
    && typeof window !== "undefined" && window.isSecureContext === true;
}

function nativeDetectorCtor(): typeof BarcodeDetector | undefined {
  return (window as unknown as { BarcodeDetector?: typeof BarcodeDetector }).BarcodeDetector;
}

/**
 * Picks the backend without requesting camera permission — permission is
 * only ever requested once the caller actually starts a scan session.
 */
export async function detectBackend(): Promise<ScannerBackend | "unsupported"> {
  if (!isCameraCapable()) return "unsupported";
  const Native = nativeDetectorCtor();
  if (Native) {
    try {
      const supported = await Native.getSupportedFormats();
      if (SCAN_FORMATS_NATIVE.some((format) => supported.includes(format))) return "native";
    } catch {
      // fall through to the zxing fallback
    }
  }
  return "zxing";
}

function classifyCameraError(error: unknown): ScannerErrorKind {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") return "camera_denied";
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") return "camera_unavailable";
  return "scanner_error";
}

const CAMERA_CONSTRAINTS: MediaStreamConstraints = { video: { facingMode: { ideal: "environment" } }, audio: false };

type ZxingControls = { stop: () => void };

/**
 * Owns exactly one scan session: acquires the camera, runs the chosen
 * backend's detection loop, and guarantees every camera resource is released
 * on success, cancellation, error, or a fresh start() call. First valid
 * detection wins — once locked, no further detections are acted on, so a
 * barcode sitting in frame for many consecutive video frames triggers the
 * lookup pipeline exactly once.
 */
export class ScannerController {
  private stream: MediaStream | null = null;
  private stopped = true;
  private locked = false;
  private nativeTimer: ReturnType<typeof setInterval> | null = null;
  private nativeBusy = false;
  private zxingControls: ZxingControls | null = null;
  private lastUnsupportedAt = 0;

  async start(video: HTMLVideoElement, handlers: ScannerHandlers): Promise<void> {
    this.stop();
    this.stopped = false;
    this.locked = false;

    try {
      const backend = await detectBackend();
      if (this.stopped) return; // cancelled while picking a backend
      if (backend === "unsupported") { handlers.onError("scanner_unsupported"); return; }

      if (backend === "native") await this.startNative(video, handlers);
      else await this.startZxing(video, handlers);
    } catch (error) {
      // Last-resort safety net: any unexpected failure (e.g. a scanner
      // library throwing during construction) must still resolve to a
      // handled, localized state rather than an unhandled rejection.
      if (this.stopped) return;
      this.stop();
      handlers.onError("scanner_error", error);
    }
  }

  private async startNative(video: HTMLVideoElement, handlers: ScannerHandlers): Promise<void> {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
    } catch (error) {
      handlers.onError(classifyCameraError(error));
      return;
    }
    if (this.stopped) { for (const track of stream.getTracks()) track.stop(); return; }
    this.stream = stream;
    video.srcObject = stream;
    video.muted = true;
    try { await video.play(); } catch { /* autoplay races are non-fatal; detection still proceeds */ }
    if (this.stopped) return;

    const Native = nativeDetectorCtor()!;
    const supported = await Native.getSupportedFormats().catch(() => [] as string[]);
    const formats = SCAN_FORMATS_NATIVE.filter((format) => supported.includes(format));
    let detector: BarcodeDetector;
    try {
      detector = new Native({ formats: formats.length ? formats : [...SCAN_FORMATS_NATIVE] });
    } catch (error) {
      this.stop();
      handlers.onError("scanner_error", error);
      return;
    }
    if (this.stopped) return;

    const allowed = new Set<string>(formats.length ? formats : SCAN_FORMATS_NATIVE);
    handlers.onScanning?.();
    this.nativeTimer = setInterval(async () => {
      if (this.nativeBusy || this.locked || this.stopped) return;
      this.nativeBusy = true;
      try {
        const results = await detector.detect(video);
        if (this.locked || this.stopped) return;
        let matched = false;
        for (const result of results) {
          if (!allowed.has(result.format)) continue;
          const normalized = normalizeScannedValue(result.rawValue);
          if (!normalized) continue;
          matched = true;
          this.locked = true;
          this.stop();
          handlers.onDetected(normalized);
          break;
        }
        if (!matched && results.length) this.reportUnsupported(handlers);
      } catch {
        // transient per-frame detect() failures are ignored — the loop just retries
      } finally {
        this.nativeBusy = false;
      }
    }, NATIVE_SCAN_INTERVAL_MS);
  }

  private async startZxing(video: HTMLVideoElement, handlers: ScannerHandlers): Promise<void> {
    let browserMod: typeof import("@zxing/browser");
    let libraryMod: typeof import("@zxing/library");
    try {
      [browserMod, libraryMod] = await Promise.all([import("@zxing/browser"), import("@zxing/library")]);
    } catch (error) {
      handlers.onError("scanner_error", error);
      return;
    }
    if (this.stopped) return;

    const { BrowserMultiFormatOneDReader } = browserMod;
    const { DecodeHintType, BarcodeFormat } = libraryMod;
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, ZXING_FORMAT_NAMES.map((name) => BarcodeFormat[name]));
    const reader = new BrowserMultiFormatOneDReader(hints, { delayBetweenScanAttempts: NATIVE_SCAN_INTERVAL_MS, delayBetweenScanSuccess: 500 });

    let controls: ZxingControls;
    try {
      controls = await reader.decodeFromConstraints(CAMERA_CONSTRAINTS, video, (result, _error, ctrls) => {
        if (this.locked || this.stopped) return;
        if (!result) return;
        const normalized = normalizeScannedValue(result.getText());
        if (!normalized) { this.reportUnsupported(handlers); return; }
        this.locked = true;
        ctrls.stop();
        handlers.onDetected(normalized);
      });
    } catch (error) {
      if (this.stopped) return;
      handlers.onError(classifyCameraError(error));
      return;
    }
    this.zxingControls = controls;
    if (this.stopped) { controls.stop(); return; }
    handlers.onScanning?.();
  }

  private reportUnsupported(handlers: ScannerHandlers) {
    if (!handlers.onUnsupportedCode) return;
    const now = Date.now();
    if (now - this.lastUnsupportedAt < UNSUPPORTED_REPORT_THROTTLE_MS) return;
    this.lastUnsupportedAt = now;
    handlers.onUnsupportedCode();
  }

  /** Idempotent: safe to call from cancel, unmount, a fresh start(), or after a detection. */
  stop(): void {
    this.stopped = true;
    if (this.nativeTimer != null) { clearInterval(this.nativeTimer); this.nativeTimer = null; }
    if (this.zxingControls) { try { this.zxingControls.stop(); } catch { /* already stopped */ } this.zxingControls = null; }
    if (this.stream) { for (const track of this.stream.getTracks()) track.stop(); this.stream = null; }
  }
}
