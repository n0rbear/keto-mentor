import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const migration = readFileSync(fileURLToPath(new URL("../prisma/migrations/20260813120000_food_resolution_servings/migration.sql", import.meta.url)), "utf8");

describe("food resolution migration safety", () => {
  it("contains no destructive or public-schema SQL", () => {
    expect(migration).not.toMatch(/^\s*(DROP|TRUNCATE|DELETE)\b/im);
    expect(migration).not.toMatch(/"public"\./i);
  });

  it("schema-qualifies every changed Keto Mentor table", () => {
    for (const table of ["Food", "FoodAlias", "FoodServing", "MealItem"]) {
      expect(migration).toContain(`"ketomentor"."${table}"`);
    }
  });
});
