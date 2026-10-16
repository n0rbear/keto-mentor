// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { FRAME_SPECS, decodeFrames, normalizeScannedValue } from "./barcode-scanner";

const frame = (id: string) => ({ id }) as unknown as HTMLCanvasElement;

describe("normalizeScannedValue", () => {
  it("accepts GTIN-shaped digit strings and preserves leading zeros", () => {
    expect(normalizeScannedValue("0012345678905")).toBe("0012345678905");
    expect(normalizeScannedValue(" 96385074 ")).toBe("96385074");
  });
  it("rejects non-numeric, garbage, or wrong-length values", () => {
    for (const bad of ["https://evil.example", "12345", "123456789012345", "12a4567890123", "", 5901234123457 as unknown]) {
      expect(normalizeScannedValue(bad)).toBeNull();
    }
  });
});

describe("barcode from a photo", () => {
  it("returns the first valid retail barcode and stops trying further frames", async () => {
    const decode = vi.fn(async (c: HTMLCanvasElement) => ((c as any).id === "rotated" ? ["5901234123457"] : []));
    const result = await decodeFrames([frame("whole"), frame("rotated"), frame("crop")], decode);
    expect(result).toEqual({ status: "found", barcode: "5901234123457" });
    expect(decode).toHaveBeenCalledTimes(2);
  });

  it("reports a non-retail code (e.g. a QR URL) separately from finding nothing", async () => {
    expect(await decodeFrames([frame("a")], async () => ["https://example.com"])).toEqual({ status: "unsupported_code" });
    expect(await decodeFrames([frame("a"), null, frame("b")], async () => [])).toEqual({ status: "not_found" });
  });

  it("downscales big phone photos and also tries a sideways and a centre-cropped frame", () => {
    expect(FRAME_SPECS.every((s) => s.maxSide <= 1600)).toBe(true);
    expect(FRAME_SPECS.some((s) => s.rotate === 90)).toBe(true);
    expect(FRAME_SPECS.some((s) => (s.crop ?? 1) < 1)).toBe(true);
  });
});
