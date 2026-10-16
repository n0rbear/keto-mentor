// Barcode reading on the device (owner requests 2026-10-16): from a photo, or
// from the in-app camera view with a guide frame. Neither the photo nor the
// camera image is ever uploaded; only a validated raw barcode STRING (never a
// number, so leading zeros survive) goes on to /foods/resolve-barcode.
// Progressive enhancement: the native BarcodeDetector where it supports a
// retail format, otherwise a dynamically-imported zxing decoder (so the main
// bundle never pays for it). The server stays the authoritative validator.

// Retail formats only. ITF is deliberately excluded — the server's GTIN
// validation is not weakened to accommodate scanner output.
const SCAN_FORMATS_NATIVE = ["ean_13", "ean_8", "upc_a", "upc_e"] as const;
const ZXING_FORMAT_NAMES = ["EAN_13", "EAN_8", "UPC_A", "UPC_E"] as const;
const BARCODE_LENGTHS = new Set([8, 12, 13, 14]);

export type PhotoDecodeResult =
  | { status: "found"; barcode: string }
  | { status: "not_found" }
  | { status: "unsupported_code" };

/**
 * Rejects anything that isn't a bounded, purely-numeric GTIN-shaped string —
 * hostile QR/text payloads and non-retail symbologies never reach this far.
 * UX-only; the server checks the checksum via GET /foods/resolve-barcode.
 */
export function normalizeScannedValue(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed) || !BARCODE_LENGTHS.has(trimmed.length)) return null;
  return trimmed;
}

function nativeDetectorCtor(): typeof BarcodeDetector | undefined {
  return typeof window === "undefined" ? undefined : (window as unknown as { BarcodeDetector?: typeof BarcodeDetector }).BarcodeDetector;
}

let zxingModules: Promise<[typeof import("@zxing/browser"), typeof import("@zxing/library")]> | null = null;

function loadZxing() {
  zxingModules ??= Promise.all([import("@zxing/browser"), import("@zxing/library")]);
  zxingModules.catch(() => { zxingModules = null; });
  return zxingModules;
}

async function nativeFormats(): Promise<string[]> {
  const Native = nativeDetectorCtor();
  if (!Native) return [];
  try {
    const supported = await Native.getSupportedFormats();
    return SCAN_FORMATS_NATIVE.filter((format) => supported.includes(format));
  } catch {
    return [];
  }
}

/** Warms the zxing chunk while the user is still on the form (no camera, no permission). */
export async function preloadScanner(): Promise<void> {
  if ((await nativeFormats()).length) return;
  await loadZxing().then(() => undefined, () => undefined);
}

/** Raw decoded values from one frame; an empty list means nothing was found. `thorough` also tries a second binarizer. */
export type FrameDecoder = (canvas: HTMLCanvasElement, thorough?: boolean) => Promise<string[]>;

export async function createDecoder(): Promise<FrameDecoder> {
  const formats = await nativeFormats();
  if (formats.length) {
    const detector = new (nativeDetectorCtor()!)({ formats });
    return async (canvas) => {
      const results = await detector.detect(canvas).catch(() => [] as DetectedBarcode[]);
      return results.filter((r) => formats.includes(r.format)).map((r) => r.rawValue);
    };
  }
  const [{ HTMLCanvasElementLuminanceSource }, lib] = await loadZxing();
  const hints = new Map();
  hints.set(lib.DecodeHintType.POSSIBLE_FORMATS, ZXING_FORMAT_NAMES.map((name) => lib.BarcodeFormat[name]));
  hints.set(lib.DecodeHintType.TRY_HARDER, true);
  const reader = new lib.MultiFormatOneDReader(hints);
  // Hybrid suits sharp photos; the global histogram often still reads a
  // slightly blurred or low-contrast barcode the hybrid one gives up on.
  return async (canvas, thorough = false) => {
    const source = new HTMLCanvasElementLuminanceSource(canvas);
    const binarizers = thorough ? [lib.HybridBinarizer, lib.GlobalHistogramBinarizer] : [lib.HybridBinarizer];
    for (const Binarizer of binarizers) {
      try { return [reader.decode(new lib.BinaryBitmap(new Binarizer(source)), hints).getText()]; } catch { /* try the next one */ }
      reader.reset();
    }
    return [];
  };
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  // An <img> honours the photo's EXIF orientation when drawn to a canvas.
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image_unreadable")); };
    img.src = url;
  });
}

/** A region of the source (fractions of its width/height), scaled so its longer side is maxSide, optionally turned 90°. */
export type FrameSpec = { maxSide: number; rotate?: 0 | 90; x?: number; y?: number; w?: number; h?: number; thorough?: boolean };

const GRID = [0, 0.25, 0.5];
// Phone photos are 12+ MP: decoding at full size is slow and no more
// reliable. Order: the whole photo (upright and sideways), its middle, then
// a 3×3 grid of overlapping half-size crops so a small barcode anywhere in
// the picture is enlarged enough to read, then a smaller copy for blurry
// close-ups. Each crop is tried upright and turned, since a barcode on a
// bottle is often vertical.
export const FRAME_SPECS: FrameSpec[] = [
  { maxSide: 1600, thorough: true },
  { maxSide: 1600, rotate: 90, thorough: true },
  { maxSide: 1600, x: 0.225, y: 0.225, w: 0.55, h: 0.55, thorough: true },
  { maxSide: 1600, x: 0.225, y: 0.225, w: 0.55, h: 0.55, rotate: 90, thorough: true },
  ...GRID.flatMap((y) => GRID.flatMap((x) => [0, 90].map((rotate) => ({ maxSide: 1200, x, y, w: 0.5, h: 0.5, rotate: rotate as 0 | 90 })))),
  { maxSide: 900, thorough: true },
  { maxSide: 900, rotate: 90, thorough: true }
];

/** Draws one region of an image or video frame onto a fresh canvas. */
export function drawRegion(source: CanvasImageSource, sourceWidth: number, sourceHeight: number, spec: FrameSpec): HTMLCanvasElement | null {
  const sx = (spec.x ?? 0) * sourceWidth, sy = (spec.y ?? 0) * sourceHeight;
  const sw = (spec.w ?? 1) * sourceWidth, sh = (spec.h ?? 1) * sourceHeight;
  if (sw < 1 || sh < 1) return null;
  const scale = Math.min(1, spec.maxSide / Math.max(sw, sh)) || 1;
  const w = Math.max(1, Math.round(sw * scale)), h = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  const rotated = spec.rotate === 90;
  canvas.width = rotated ? h : w;
  canvas.height = rotated ? w : h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  if (rotated) { ctx.translate(h, 0); ctx.rotate(Math.PI / 2); }
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, w, h);
  return canvas;
}

/** A smaller copy of a canvas, for reading the same image a second time at another scale. */
export function rescaleCanvas(source: HTMLCanvasElement, factor: number): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * factor));
  canvas.height = Math.max(1, Math.round(source.height * factor));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

const firstValid = (raws: string[]) => raws.map(normalizeScannedValue).find((v): v is string => !!v) ?? null;

/**
 * Reads one canvas, then smaller copies of it (70%, 50%) until two reads
 * agree. A blurred barcode can misread, at one particular scale, into
 * another code whose check digit happens to fit; the same misread at a
 * second scale is very unlikely. Without agreement the first read is
 * returned unconfirmed.
 */
export async function readConfirmed(canvas: HTMLCanvasElement, decode: FrameDecoder, thorough = false): Promise<{ code: string | null; confirmed: boolean; other: boolean }> {
  const raws = await decode(canvas, thorough);
  const first = firstValid(raws);
  if (!first) return { code: null, confirmed: false, other: raws.length > 0 };
  const seen = [first];
  for (const factor of [0.7, 0.5]) {
    const smaller = rescaleCanvas(canvas, factor);
    const code = smaller ? firstValid(await decode(smaller, true)) : null;
    if (!code) continue;
    if (seen.includes(code)) return { code, confirmed: true, other: false };
    seen.push(code);
  }
  return { code: first, confirmed: false, other: false };
}

/**
 * Tries the frames in order until a code is confirmed (two scales agree, or
 * two different frames read the same code) or the time budget runs out; then
 * the most-read code wins. A code that was read but isn't a retail barcode
 * (e.g. a QR code) is reported separately so the user knows to photograph
 * the striped barcode instead.
 */
export async function decodeFrames(
  frames: Iterable<{ canvas: HTMLCanvasElement | null; thorough?: boolean }>,
  decode: FrameDecoder,
  budgetMs = 6000,
  now: () => number = () => performance.now()
): Promise<PhotoDecodeResult> {
  const started = now();
  let sawOther = false;
  const votes = new Map<string, number>();
  for (const { canvas, thorough } of frames) {
    if (now() - started > budgetMs) break;
    if (!canvas) continue;
    const read = await readConfirmed(canvas, decode, thorough);
    if (read.other) sawOther = true;
    if (read.code) {
      if (read.confirmed) return { status: "found", barcode: read.code };
      const count = (votes.get(read.code) ?? 0) + 1;
      votes.set(read.code, count);
      if (count >= 2) return { status: "found", barcode: read.code };
    }
    // Let the "Looking for the barcode…" status repaint between frames.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  const best = [...votes.entries()].sort((x, y) => y[1] - x[1])[0];
  if (best) return { status: "found", barcode: best[0] };
  return sawOther ? { status: "unsupported_code" } : { status: "not_found" };
}

/** Decodes a barcode from a photo, entirely on the device. Throws only if the image can't be read. */
export async function decodeBarcodePhoto(file: Blob): Promise<PhotoDecodeResult> {
  const [img, decode] = await Promise.all([loadImage(file), createDecoder()]);
  const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
  function* frames() { for (const spec of FRAME_SPECS) yield { canvas: drawRegion(img, w, h, spec), thorough: spec.thorough }; }
  return decodeFrames(frames(), decode);
}

// ---- In-app camera with a guide frame -------------------------------------

export const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
  audio: false
};

export function cameraAvailable(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof window !== "undefined" && window.isSecureContext === true;
}

/**
 * The guide frame's area in video pixels. The video fills its box with
 * object-fit: cover, so part of the video is cropped off; the guide is given
 * in box pixels. A margin around the guide forgives slightly off-centre aim.
 */
export function guideToVideoRegion(
  box: { width: number; height: number },
  guide: { left: number; top: number; width: number; height: number },
  video: { width: number; height: number },
  margin = 0.12
): { x: number; y: number; w: number; h: number } {
  const scale = Math.max(box.width / video.width, box.height / video.height);
  const offsetX = (box.width - video.width * scale) / 2, offsetY = (box.height - video.height * scale) / 2;
  const mx = guide.width * margin, my = guide.height * margin;
  const left = Math.max(0, (guide.left - mx - offsetX) / scale), top = Math.max(0, (guide.top - my - offsetY) / scale);
  const right = Math.min(video.width, (guide.left + guide.width + mx - offsetX) / scale);
  const bottom = Math.min(video.height, (guide.top + guide.height + my - offsetY) / scale);
  return { x: left / video.width, y: top / video.height, w: Math.max(0, right - left) / video.width, h: Math.max(0, bottom - top) / video.height };
}

/** Torch (flash light) on the rear camera, where the browser exposes it (mostly Android Chrome). */
export function torchSupported(track: MediaStreamTrack | undefined): boolean {
  try { return !!(track?.getCapabilities?.() as { torch?: boolean } | undefined)?.torch; } catch { return false; }
}

export async function setTorch(track: MediaStreamTrack, on: boolean): Promise<boolean> {
  try { await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] }); return true; } catch { return false; }
}

export type CameraErrorKind = "camera_denied" | "camera_unavailable" | "camera_error";

export function classifyCameraError(error: unknown): CameraErrorKind {
  const name = error instanceof Error ? error.name : (error as { name?: string } | null)?.name ?? "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") return "camera_denied";
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") return "camera_unavailable";
  return "camera_error";
}
