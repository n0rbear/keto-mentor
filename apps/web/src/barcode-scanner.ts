// Barcode from a photo (owner request 2026-10-16): the user takes a photo of
// the barcode with the phone camera, and it is decoded locally in the browser
// — the photo is never uploaded. Only a validated raw barcode STRING (never a
// number, so leading zeros survive) goes on to /foods/resolve-barcode.
// Progressive enhancement: the native BarcodeDetector where it supports a
// retail format, otherwise a dynamically-imported @zxing/browser decoder (so
// the main bundle never pays for it). The server stays the authoritative
// validator.

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

/** Raw decoded values from one frame; an empty list means nothing was found. */
export type FrameDecoder = (canvas: HTMLCanvasElement) => Promise<string[]>;

async function createDecoder(): Promise<FrameDecoder> {
  const formats = await nativeFormats();
  if (formats.length) {
    const detector = new (nativeDetectorCtor()!)({ formats });
    return async (canvas) => {
      const results = await detector.detect(canvas).catch(() => [] as DetectedBarcode[]);
      return results.filter((r) => formats.includes(r.format)).map((r) => r.rawValue);
    };
  }
  const [{ BrowserMultiFormatOneDReader }, { DecodeHintType, BarcodeFormat }] = await loadZxing();
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, ZXING_FORMAT_NAMES.map((name) => BarcodeFormat[name]));
  hints.set(DecodeHintType.TRY_HARDER, true);
  const reader = new BrowserMultiFormatOneDReader(hints);
  return async (canvas) => {
    try { return [reader.decodeFromCanvas(canvas).getText()]; } catch { return []; }
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

type FrameSpec = { maxSide: number; rotate?: 0 | 90; crop?: number };

// Phone photos are 12+ MP: decoding at full size is slow and no more
// reliable. Order: whole photo, sideways barcode, a barcode small in the
// middle of the frame, then a smaller copy (helps blurry close-ups).
export const FRAME_SPECS: FrameSpec[] = [
  { maxSide: 1600 },
  { maxSide: 1600, rotate: 90 },
  { maxSide: 1600, crop: 0.55 },
  { maxSide: 900 }
];

function drawFrame(img: HTMLImageElement, spec: FrameSpec): HTMLCanvasElement | null {
  const w0 = img.naturalWidth || img.width, h0 = img.naturalHeight || img.height;
  const crop = spec.crop ?? 1;
  const sw = w0 * crop, sh = h0 * crop, sx = (w0 - sw) / 2, sy = (h0 - sh) / 2;
  const scale = Math.min(1, spec.maxSide / Math.max(sw, sh)) || 1;
  const w = Math.max(1, Math.round(sw * scale)), h = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  const rotated = spec.rotate === 90;
  canvas.width = rotated ? h : w;
  canvas.height = rotated ? w : h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  if (rotated) { ctx.translate(h, 0); ctx.rotate(Math.PI / 2); }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  return canvas;
}

/**
 * Tries the frames in order; the first valid retail barcode wins. A code
 * that was read but isn't a retail barcode (e.g. a QR code) is reported
 * separately so the user knows to photograph the striped barcode instead.
 */
export async function decodeFrames(frames: Iterable<HTMLCanvasElement | null>, decode: FrameDecoder): Promise<PhotoDecodeResult> {
  let sawOther = false;
  for (const frame of frames) {
    if (!frame) continue;
    for (const raw of await decode(frame)) {
      const barcode = normalizeScannedValue(raw);
      if (barcode) return { status: "found", barcode };
      sawOther = true;
    }
  }
  return sawOther ? { status: "unsupported_code" } : { status: "not_found" };
}

/** Decodes a barcode from a photo, entirely on the device. Throws only if the image can't be read. */
export async function decodeBarcodePhoto(file: Blob): Promise<PhotoDecodeResult> {
  const [img, decode] = await Promise.all([loadImage(file), createDecoder()]);
  function* frames() { for (const spec of FRAME_SPECS) yield drawFrame(img, spec); }
  return decodeFrames(frames(), decode);
}
