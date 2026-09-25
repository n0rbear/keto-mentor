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

const aliasCleanup = readFileSync(fileURLToPath(new URL("../prisma/migrations/20260925120000_remove_ambiguous_dairy_bacon_aliases/migration.sql", import.meta.url)), "utf8");

describe("ambiguous alias cleanup migration scope", () => {
  const sql = aliasCleanup.replace(/--.*$/gm, "");
  const statements = sql.split(";").map((statement) => statement.trim()).filter(Boolean);

  it("only deletes FoodAlias rows and never drops or truncates anything", () => {
    expect(sql).not.toMatch(/\b(DROP|TRUNCATE|ALTER)\b/i);
    expect(sql).not.toMatch(/"public"\./i);
    const deletes = statements.filter((statement) => /^DELETE\b/i.test(statement));
    expect(deletes).toHaveLength(1);
    expect(deletes[0]).toMatch(/^DELETE FROM "ketomentor"\."FoodAlias"/);
  });

  it("confines every statement to the two audited BLS catalog records", () => {
    for (const statement of statements) {
      expect(statement).toMatch(/"source" = 'bls'/);
      expect(statement).toMatch(/"createdById" IS NULL/);
      expect(statement).toMatch(/'M713100'|'W415000'/);
    }
  });

  it("leaves user-confirmed and learned aliases alone", () => {
    expect(sql).toContain(`"provenance"->>'method' IN ('curated_import', 'everyday_coverage_alias_overlay')`);
    expect(sql).not.toMatch(/'(confirmed_external|dynamic_search)'/);
  });
});
