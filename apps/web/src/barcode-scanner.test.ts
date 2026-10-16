// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { FRAME_SPECS, classifyCameraError, decodeFrames, guideToVideoRegion, normalizeScannedValue } from "./barcode-scanner";

const frame = (id: string, thorough = false) => ({ canvas: ({ id }) as unknown as HTMLCanvasElement, thorough });

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
  it("stops as soon as two frames read the same code", async () => {
    const decode = vi.fn(async (c: HTMLCanvasElement) => (["rotated", "crop"].includes((c as any).id) ? ["5901234123457"] : []));
    const result = await decodeFrames([frame("whole"), frame("rotated"), frame("crop"), frame("never")], decode);
    expect(result).toEqual({ status: "found", barcode: "5901234123457" });
    expect(decode.mock.calls.map(([c]) => (c as any).id)).not.toContain("never");
  });

  it("does not trust a single misread when other frames agree on another code", async () => {
    const reads: Record<string, string[]> = { a: ["0068466404121"], b: ["4008400404127"], c: ["4008400404127"] };
    const result = await decodeFrames([frame("a"), frame("b"), frame("c")], async (c) => reads[(c as any).id] ?? []);
    expect(result).toEqual({ status: "found", barcode: "4008400404127" });
  });

  it("falls back to a single read when nothing else is found", async () => {
    const result = await decodeFrames([frame("x"), frame("y")], async (c) => ((c as any).id === "y" ? ["96385074"] : []));
    expect(result).toEqual({ status: "found", barcode: "96385074" });
  });

  it("passes the thorough flag on, and stops when the time budget is used up", async () => {
    let clock = 0;
    const decode = vi.fn(async (_c: HTMLCanvasElement, _thorough?: boolean): Promise<string[]> => { clock += 400; return []; });
    const result = await decodeFrames(Array.from({ length: 20 }, (_, i) => frame(`f${i}`, i === 0)), decode, 1000, () => clock);
    expect(result).toEqual({ status: "not_found" });
    expect(decode).toHaveBeenCalledTimes(3);
    expect(decode.mock.calls[0][1]).toBe(true);
    expect(decode.mock.calls[1][1]).toBe(false);
  });

  it("reports a non-retail code (e.g. a QR URL) separately from finding nothing", async () => {
    expect(await decodeFrames([frame("a")], async () => ["https://example.com"])).toEqual({ status: "unsupported_code" });
    expect(await decodeFrames([frame("a"), { canvas: null }, frame("b")], async () => [])).toEqual({ status: "not_found" });
  });

  it("tries the whole photo, its middle and a 3×3 grid of crops, each upright and sideways", () => {
    expect(FRAME_SPECS.every((s) => s.maxSide <= 1600)).toBe(true);
    const grid = FRAME_SPECS.filter((s) => s.w === 0.5);
    expect(grid).toHaveLength(18);
    expect(grid.filter((s) => s.rotate === 90)).toHaveLength(9);
    // Together the grid crops cover the whole photo.
    expect(Math.max(...grid.map((s) => s.x! + s.w!))).toBe(1);
    expect(Math.max(...grid.map((s) => s.y! + s.h!))).toBe(1);
  });
});

describe("camera view with a guide frame", () => {
  it("maps the on-screen guide to video pixels when the video is cropped to fill the box", () => {
    // 300×400 box, 1920×1080 video: scaled to 400 high (711 wide), 205 px cut off each side.
    const r = guideToVideoRegion({ width: 300, height: 400 }, { left: 24, top: 152, width: 252, height: 96 }, { width: 1920, height: 1080 }, 0);
    expect(r.x).toBeCloseTo((24 + 205.6) / 711.1, 2);
    expect(r.w).toBeCloseTo(252 / 711.1, 2);
    expect(r.y).toBeCloseTo(0.38, 2);
    expect(r.h).toBeCloseTo(0.24, 2);
  });

  it("adds a margin but never leaves the video", () => {
    const r = guideToVideoRegion({ width: 400, height: 300 }, { left: 0, top: 0, width: 400, height: 300 }, { width: 400, height: 300 });
    expect(r).toEqual({ x: 0, y: 0, w: 1, h: 1 });
  });

  it("classifies camera errors", () => {
    expect(classifyCameraError(Object.assign(new Error("x"), { name: "NotAllowedError" }))).toBe("camera_denied");
    expect(classifyCameraError({ name: "NotFoundError" })).toBe("camera_unavailable");
    expect(classifyCameraError(new Error("boom"))).toBe("camera_error");
  });
});
