import { describe, expect, it } from "vitest";
import inventory from "../../../../data/reference-dishes/hu-phase2-inventory.json" with { type: "json" };

describe("HU phase 2 inventory", () => {
  it("meets the non-chain minimums", () => {
    const counts = Object.groupBy(inventory.rows, (row) => row.category);
    expect(counts.traditional?.length).toBeGreaterThanOrEqual(60);
    expect(counts.everyday?.length).toBeGreaterThanOrEqual(60);
    expect(counts.street_food?.length).toBeGreaterThanOrEqual(25);
  });

  it("does not pretend inventory rows are seedable nutrition data", () => {
    expect(inventory.rows.every((row) => row.status === "inventory_only")).toBe(true);
  });
});
