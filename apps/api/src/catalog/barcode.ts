// Canonical GTIN family: EAN-8, UPC-A (12), EAN-13, GTIN-14 — the practical
// lengths Open Food Facts (and retail packaging generally) actually uses.
export const BARCODE_LENGTHS = [8, 12, 13, 14] as const;

/**
 * Standard GS1 GTIN check-digit algorithm, defined identically regardless of
 * GTIN length: weight alternating digits 3/1 from the rightmost digit of the
 * body (i.e. the digit adjacent to the check digit gets weight 3), sum, and
 * the check digit is whatever makes the total a multiple of 10.
 */
export function gtinCheckDigit(body: string): number {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const digit = Number(body[body.length - 1 - i]);
    sum += digit * (i % 2 === 0 ? 3 : 1);
  }
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

export type BarcodeValidation =
  | { ok: true; barcode: string }
  | { ok: false; reason: "invalid_format" | "invalid_checksum" };

/**
 * Validates and canonicalizes a user/query-supplied barcode. Rejects
 * anything that isn't a bounded, purely numeric GTIN of a supported length
 * with a correct check digit — never silently accepts a malformed value,
 * and never treats the barcode endpoint as a general search-string input.
 */
export function validateBarcode(raw: string): BarcodeValidation {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed) || !(BARCODE_LENGTHS as readonly number[]).includes(trimmed.length)) {
    return { ok: false, reason: "invalid_format" };
  }
  const body = trimmed.slice(0, -1);
  const checkDigit = Number(trimmed[trimmed.length - 1]);
  if (gtinCheckDigit(body) !== checkDigit) return { ok: false, reason: "invalid_checksum" };
  return { ok: true, barcode: trimmed };
}
