import { describe, expect, it } from "vitest";
import { gtinCheckDigit, validateBarcode } from "./barcode.js";

describe("validateBarcode", () => {
  it.each([
    ["EAN-13", "4008400404127"],
    ["UPC-A", "036000291452"],
    ["EAN-8", "40170725"],
    ["EAN-13 (second example)", "5901234123457"],
    ["EAN-8 (second example)", "73513537"]
  ])("accepts a valid %s barcode", (_label, code) => {
    expect(validateBarcode(code)).toEqual({ ok: true, barcode: code });
  });

  it("trims surrounding whitespace before validating", () => {
    expect(validateBarcode("  4008400404127  ")).toEqual({ ok: true, barcode: "4008400404127" });
  });

  it.each([
    ["empty string", ""],
    ["letters", "abcdefgh"],
    ["mixed alnum", "4008400404A27"],
    ["too short", "1234567"],
    ["wrong length (not 8/12/13/14)", "123456789012345"],
    ["contains a dash", "400-840-0404127"],
    ["contains a space in the middle", "4008 400404127"],
    ["a free-text search string", "chicken breast"],
    ["absurdly long numeric input", "1".repeat(200)]
  ])("rejects a malformed barcode: %s", (_label, input) => {
    expect(validateBarcode(input)).toEqual({ ok: false, reason: "invalid_format" });
  });

  it.each([
    ["EAN-13", "4008400404128"],
    ["UPC-A", "036000291451"],
    ["EAN-8", "40170726"]
  ])("rejects a %s with a bad check digit", (_label, code) => {
    expect(validateBarcode(code)).toEqual({ ok: false, reason: "invalid_checksum" });
  });

  it("computes the GS1 check digit consistently across supported lengths", () => {
    expect(gtinCheckDigit("400840040412")).toBe(7); // -> 4008400404127 (EAN-13)
    expect(gtinCheckDigit("03600029145")).toBe(2); // -> 036000291452 (UPC-A)
    expect(gtinCheckDigit("4017072")).toBe(5); // -> 40170725 (EAN-8)
  });
});
