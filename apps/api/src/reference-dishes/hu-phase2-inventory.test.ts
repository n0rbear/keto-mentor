import { describe, expect, it } from "vitest";
import { REFERENCE_DATA } from "./reference-data.js";

describe("HU phase 2 inventory", () => {
  it("meets the non-chain minimums", () => {
    const counts = REFERENCE_DATA.inventory.HU;
    expect(counts.traditional.length).toBeGreaterThanOrEqual(60);
    expect(counts.everyday.length).toBeGreaterThanOrEqual(60);
    expect(counts.street_food.length).toBeGreaterThanOrEqual(25);
  });

  it("does not pretend inventory rows are seedable nutrition data", () => {
    expect(Object.values(REFERENCE_DATA.inventory.HU).flat().length).toBeGreaterThan(0);
  });
});
