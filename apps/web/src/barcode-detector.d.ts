// Minimal ambient types for the native Shape Detection API's BarcodeDetector.
// Not yet part of TypeScript's shipped DOM lib; supported in Chromium-based
// browsers only (behind a secure context). See barcode-scanner.ts for the
// feature-detected, progressively-enhanced usage.
interface BarcodeDetectorOptions {
  formats?: string[];
}

interface DetectedBarcode {
  rawValue: string;
  format: string;
}

interface BarcodeDetector {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

declare var BarcodeDetector: {
  prototype: BarcodeDetector;
  new (options?: BarcodeDetectorOptions): BarcodeDetector;
  getSupportedFormats(): Promise<string[]>;
};
