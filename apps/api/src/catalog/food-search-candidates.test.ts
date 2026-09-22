import { describe, expect, it, vi } from "vitest";
import { searchFoods } from "./food-search.js";

const row = (id: string, name: string) => ({ id, name, originalName: name,
  searchText: name.toLowerCase(), source: "bls", _aliases: [],
  kcalPer100g: 100, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1 });

function database(discovery: any[], fuzzy: any[] = []) {
  return {
    $queryRaw: vi.fn(async (sql: any) => sql.text.includes("food-search:fuzzy") ? fuzzy : discovery),
    foodAlias: { findMany: vi.fn(async () => { throw new Error("No alias scan allowed"); }) },
    food: { findMany: vi.fn(async (args: any) => {
      expect(args.where.id.in.length).toBeLessThanOrEqual(30);
      expect(args.include.servings).toBeDefined();
      return [...discovery, ...fuzzy].filter(r => args.where.id.in.includes(r.id)).reverse().map(r => ({ ...r, servings: [] }));
    }) },
  } as any;
}

describe("bounded DB candidate discovery", () => {
  it.each([["Ei", "Ei"], ["Öl", "Öl"]])("keeps exact two-character %s identities", async (query, name) => {
    const db = database([row("exact", name)]);
    expect((await searchFoods(db, query))[0]).toMatchObject({ id: "exact", match: { stage: "exact" } });
    expect(db.$queryRaw).toHaveBeenCalledTimes(1);
  });
  it("does not paginate or run trigram fallback for a two-character fragment", async () => {
    const db = database([]);
    expect(await searchFoods(db, "ch")).toEqual([]);
    expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    expect(db.food.findMany).not.toHaveBeenCalled();
    expect(db.foodAlias.findMany).not.toHaveBeenCalled();
  });
  it("hydrates only final winners, preserving ranked order despite DB ID order", async () => {
    const db = database([row("compound", "Butter sauce"), row("basic", "Butter")]);
    const result = await searchFoods(db, "butter", 1);
    expect(result.map(r => r.id)).toEqual(["basic"]);
    expect(db.food.findMany).toHaveBeenCalledTimes(1);
    expect(db.food.findMany.mock.calls[0][0].where.id.in).toEqual(["basic"]);
  });
  it("runs at most one bounded fuzzy stage for insufficient good matches", async () => {
    const db = database([], [row("fuzzy", "Butter")]);
    expect((await searchFoods(db, "buttr"))[0]?.match.stage).toBe("fuzzy");
    expect(db.$queryRaw).toHaveBeenCalledTimes(2);
    const fuzzy = db.$queryRaw.mock.calls[1][0];
    expect(fuzzy.text).toContain("food-search:fuzzy");
    expect(fuzzy.values).toContain(16);
  });
  it("keeps stage limits, parameterized text and deterministic ordering in SQL", async () => {
    const db = database([]);
    await searchFoods(db, "ch");
    const sql = db.$queryRaw.mock.calls[0][0];
    expect(sql.values).toContain(32);
    expect(sql.values).toContain(48);
    expect(sql.text).toContain("ORDER BY");
    expect(sql.text).not.toContain("OFFSET");
    expect(sql.text).not.toContain("FoodServing");
    expect(sql.text).not.toContain("'ch'");
  });

  describe("bounded broad-match architecture (2026-09-22)", () => {
    it("reserves a documented budget for the broad alias/food prefilter, distinct from the final output budgets", async () => {
      const db = database([]);
      await searchFoods(db, "mit");
      const sql = db.$queryRaw.mock.calls[0][0];
      expect(sql.values).toContain(64); // lexicalPrefilter
      expect(sql.values).toContain(32); // exact (final identities)
      expect(sql.values).toContain(48); // lexical (final output)
    });
    it("bounds the RAW broad alias/food match itself, before row_number/grouping/hydration ever run on it", async () => {
      const db = database([]);
      await searchFoods(db, "mit");
      const sql = db.$queryRaw.mock.calls[0][0];
      // The broad alias scan's own LIMIT must sit strictly BEFORE alias
      // grouping, and the broad Food scan's own LIMIT strictly before
      // candidate_ids/eligible/normalized_names/scored. This is stronger than
      // merely gating the expensive per-row pipeline: the raw DB match set
      // itself is bounded, matching the read-only 214ms diagnostic's shape
      // (Food LIMIT 64 + Alias LIMIT 64 before any hydration).
      const order = ["FROM ketomentor.\"FoodAlias\" a", "ORDER BY (a.\"normalizedAlias\"", ") a\n    ), aliases AS (",
        "FROM ketomentor.\"Food\" f\n        WHERE f.\"createdById\"", ") ranked", "candidate_ids AS MATERIALIZED",
        "eligible AS (", "normalized_names AS MATERIALIZED", "scored AS MATERIALIZED"]
        .map(marker => sql.text.indexOf(marker));
      expect(order.every((index: number) => index >= 0)).toBe(true);
      expect(order).toEqual([...order].sort((a, b) => a - b));
    });
    it("protects exact identity through a dedicated index-backed alias lookup, decoupled from the broad match's LIMIT", async () => {
      const db = database([]);
      await searchFoods(db, "mit");
      const sql = db.$queryRaw.mock.calls[0][0];
      expect(sql.text).toContain("exact_alias_ids AS (");
      expect(sql.text).toContain("SELECT DISTINCT \"foodId\" AS id FROM ketomentor.\"FoodAlias\" WHERE \"normalizedAlias\" =");
      // exact_alias_ids has no LIMIT of its own: it must appear before the
      // broad alias scan's LIMIT and must not itself carry lexicalPrefilter.
      const exactIdx = sql.text.indexOf("exact_alias_ids AS (");
      const firstLimitIdx = sql.text.indexOf("LIMIT", exactIdx);
      const exactAliasBlock = sql.text.slice(exactIdx, sql.text.indexOf("), alias_matches"));
      expect(exactAliasBlock).not.toContain("LIMIT");
      expect(firstLimitIdx).toBeGreaterThan(sql.text.indexOf("alias_matches AS MATERIALIZED"));
    });
  });
});
