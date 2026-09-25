import { describe, expect, it, vi } from "vitest";
import { expandFoodQuery, searchFoods, isTrustedLocalMatch, rankFoodCandidates } from "./food-search.js";
import { normalizeSearch } from "./normalize.js";
import { interpretMealInput } from "../meal-input/interpret.js";

function food(id: string, name: string, extra: Record<string, unknown> = {}) {
  return { id, name, originalName: name, searchText: normalizeSearch(name), source: "bls", createdById: null,
    kcalPer100g: 100, proteinPer100g: 10, fatPer100g: 5, carbsPer100g: 3, fiberPer100g: 1, servings: [], ...extra };
}

// Only in-memory catalog reads. No Prisma client, server, environment or DB.
function catalog(rows: ReturnType<typeof food>[]) {
  return { foodAlias: { findMany: vi.fn(async () => []) }, food: { findMany: vi.fn(async ({ where, take, skip = 0, orderBy }: any) => {
    let matches = rows.filter(row => where.id?.in ? where.id.in.includes(row.id)
      : where.OR.some((part: any) => row.searchText.includes(part.searchText.contains)));
    if (orderBy) matches = [...matches].sort((a, b) => a.id.localeCompare(b.id));
    return matches.slice(skip, take == null ? undefined : skip + take);
  }) } } as any;
}

// Model the bounded SQL contract, not physical row ordering/pagination. Actual
// SQL selection is also checked with read-only VALUES fixtures against Postgres.
function rankedCatalog(rows: ReturnType<typeof food>[], aliases: any[] = []) {
  const db = catalog(rows);
  db.$queryRaw = vi.fn(async (sql: any) => {
    if (sql.text.includes("food-search:fuzzy")) return [];
    const query = sql.values[0] as string;
    const aliasesByFood = new Map(rows.map(row => [row.id, aliases.filter(a => a.foodId === row.id)]));
    const ranked = rankFoodCandidates(rows, expandFoodQuery(query), aliasesByFood, new Set(), normalizeSearch(query));
    return [...ranked.filter(r => isTrustedLocalMatch(r.match)).slice(0, 32),
      ...ranked.filter(r => !isTrustedLocalMatch(r.match)).slice(0, 48)]
      .map(r => ({ ...r, _aliases: aliasesByFood.get(r.id) }));
  });
  return db;
}

describe("general catalog ranking regressions", () => {
  it("does not treat an expansion as attested identity: bacon must not retrieve ham/Hamburger/Hammel", async () => {
    expect(expandFoodQuery("bacon")).toEqual(["bacon"]);
    const result = await searchFoods(catalog([food("ham", "Ham"), food("burger", "Hamburger"), food("mutton", "Hammel"), food("bacon", "Bacon")]), "bacon");
    expect(result.map(row => row.id)).toEqual(["bacon"]);
  });
  it.each([ ["ham", "Hamburger"], ["ham", "Hammel"], ["rice", "Licorice"], ["pea", "Peanut"], ["nut", "Coconut"] ])(
    "does not accept '%s' solely as a substring of '%s'", async (query, unrelated) => {
      expect(await searchFoods(catalog([food("other", unrelated)]), query)).toEqual([]);
    });
  it("allows a whole token inside a reordered name without promoting it to exact", async () => {
    const [result] = await searchFoods(catalog([food("f", "Pork, bacon, raw")]), "bacon");
    expect(result.id).toBe("f");
    expect(isTrustedLocalMatch(result.match)).toBe(false);
  });
  it("keeps a legitimate semantic expansion discoverable but below trusted identity", async () => {
    const [result] = await searchFoods(catalog([food("scrambled", "Rührei")]), "tojásrántotta");
    expect(result?.id).toBe("scrambled");
    expect(result?.match).toMatchObject({ stage: "partial", query: "ruhrei" });
    expect(isTrustedLocalMatch(result.match)).toBe(false);
  });
  it.each([
    ["Schmand", "Schmand 24% Fett", "Schmand mit Kräutern"],
    ["quark", "Speisequark natur", "Quark mit Marmelade"],
    ["quark", "Quark 20% Fett i.Tr.", "Quarkbrötchen"],
    ["yogurt", "Yogurt plain", "Yogurt with jam"],
    ["oat", "Oat, raw", "Oat cake"],
  ])("prefers a basic ingredient for %s without a food-name exception", async (query, basic, compound) => {
    const result = await searchFoods(catalog([food("compound", compound), food("basic", basic)]), query);
    expect(result[0]?.id).toBe("basic");
  });
  it("ranks the real basic Schmand identity above the real hyphenated dip name", async () => {
    const result = await searchFoods(catalog([
      food("dip", "Schmand-Dip mit Schnittlauch"),
      food("plain", "Sauerrahm/Schmand, mind. 20 % Fett"),
    ]), "Schmand");
    expect(result.map(row => row.id)).toEqual(["plain", "dip"]);
  });
  it("ranks real plain Speisequark variants above prepared Quark products", async () => {
    const result = await searchFoods(catalog([
      food("jam", "Quark (Halbfettstufe) mit Konfitüre"),
      food("pastry", "Quark-Frucht-Plunder"),
      food("plain", "Speisequark Fettstufe, 40 % Fett i. Tr."),
    ]), "quark");
    expect(result[0]?.id).toBe("plain");
  });
  it("recognizes an ingredient-headed hyphen compound inside a parenthesized preparation", async () => {
    const rows = [...Array.from({ length: 120 }, (_, i) => food(`cake-${i}`, `Cake${i} (Quark-Öl-Teig)`)),
      food("plain", "Speisequark Fettstufe, 40 % Fett i. Tr.")];
    expect((await searchFoods(rankedCatalog(rows), "quark"))[0].id).toBe("plain");
  });
  it.each(["Apfel-Quarktorte (ohne Boden)", "Kaffeegebäck (Quarkblätterteig)", "Käsegebäck salzig (Quarkmürbeteig)"])(
    "recognizes generic prepared-food heads inside compounds: %s", async compound => {
      const result = await searchFoods(catalog([food("compound", compound), food("plain", "Speisequark Fettstufe, 40 % Fett i. Tr.")]), "quark");
      expect(result[0].id).toBe("plain");
    });
  it.each(["Quarkauflauf", "Quarkcreme", "Bananenquark"])("uses published meal-component metadata for %s, not ingredient exceptions", async name => {
    const rows = [food("dish", name, { sourceId: "Y880160" }), food("basic", "Speisequark natur", { sourceId: "M713500" })];
    expect((await searchFoods(catalog(rows), "quark"))[0].id).toBe("basic");
    expect((await searchFoods(catalog(rows), name))[0].id).toBe("dish");
  });
  it("does not let publisher-classified pastry outrank its basic ingredient", async () => {
    const rows = [food("pastry", "Quarkstollen (Rührmasse)", { sourceId: "D123456" }), food("plain", "Speisequark natur", { sourceId: "M713500" })];
    expect((await searchFoods(catalog(rows), "quark"))[0].id).toBe("plain");
    expect((await searchFoods(catalog(rows), "Quarkstollen (Rührmasse)"))[0].id).toBe("pastry");
  });
  it.each([
    ["Petersilie", "Petersilie frisch", "Petersilie getrocknet"],
    ["parsley", "Parsley raw", "Parsley dried"],
    ["basil", "Basil fresh", "Basil dried"],
    ["tomato", "Tomato raw", "Tomato cooked"],
  ])("prefers unspecified/fresh form over an unrequested processed form for %s", async (query, basic, processed) => {
    const result = await searchFoods(catalog([food("processed", processed), food("basic", basic)]), query);
    expect(result[0]?.id).toBe("basic");
    expect(isTrustedLocalMatch(result.find(row => row.id === "processed")!.match)).toBe(false);
  });
  it("ranks the real raw parsley-leaf record above the dried form for a bare query", async () => {
    const result = await searchFoods(catalog([
      food("dried", "Petersilienblatt getrocknet"),
      food("raw", "Petersilienblatt roh"),
      food("root", "Wurzelpetersilie roh"),
    ]), "Petersilie");
    expect(result[0]?.id).toBe("raw");
    expect(result.findIndex(row => row.id === "root")).toBeGreaterThan(result.findIndex(row => row.id === "raw"));
  });
  it("does not let a shortened translation hide the original dried form", async () => {
    const result = await searchFoods(catalog([food("dried", "Petersilie getrocknet", { names: { en: "Parsley" }, searchText: "petersilie getrocknet parsley" }), food("raw", "Parsley")]), "parsley");
    expect(result[0].id).toBe("raw");
    expect(result.find(row => row.id === "dried")!.match.stage).toBe("exact");
  });
  it("preserves explicitly requested dried form", async () => {
    expect((await searchFoods(catalog([food("raw", "Petersilie frisch"), food("dried", "Petersilie getrocknet")]), "Petersilie getrocknet"))[0].id).toBe("dried");
  });
  it("prefers a qualified fresh name over a misleading exact shortened dried name", async () => {
    const result = await searchFoods(catalog([food("dried", "Parsley dried", { names: { en: "Parsley" } }), food("fresh", "Parsley fresh")]), "parsley");
    expect(result[0].id).toBe("fresh");
  });
  it("keeps long typing prefixes weak rather than exact identities", async () => {
    const [result] = await searchFoods(catalog([food("z", "Zucchini")]), "zucch");
    expect(result.match).toMatchObject({ stage: "partial", score: 40 });
  });
  it("uses literal requested preparation even when canonical identity omits it", async () => {
    const rows = [food("raw", "Parsley fresh", { names: { en: "Parsley" } }), food("dried", "Parsley dried", { names: { en: "Parsley" } })];
    expect((await searchFoods(catalog(rows), "parsley", 20, { rawIngredient: "1 g dried parsley" }))[0].id).toBe("dried");
  });
  // The compound penalty exists to keep an ingredient query off prepared
  // dishes; it must not demote the dish the query names exactly just because
  // another locale's name for it ("Apple pie") contains a compound keyword.
  it.each([
    ["almás pite", "Almás pite fahéjjal"],
    ["apple pie", "Apple pie filling"],
    ["Apfelkuchen", "Apfelkuchen vom Blech"],
  ])("ranks the exact dish '%s' above a partial match", async (query, partialName) => {
    const exact = food("exact", "Almás pite", { names: { hu: "Almás pite", en: "Apple pie", de: "Apfelkuchen" }, searchText: "almas pite apple pie apfelkuchen" });
    const partial = food("partial", partialName);
    for (const db of [catalog([partial, exact]), rankedCatalog([partial, exact])]) {
      const result = await searchFoods(db, query);
      expect(result[0]).toMatchObject({ id: "exact", match: { stage: "exact" } });
    }
  });
  it("preserves explicitly requested compounds", async () => {
    expect((await searchFoods(catalog([food("plain", "Yogurt"), food("jam", "Yogurt with jam")]), "yogurt with jam"))[0].id).toBe("jam");
  });
  it("does not let BLS source priority override the stronger USDA identity", async () => {
    const result = await searchFoods(catalog([food("bls", "Butter sauce"), food("usda", "Butter", { source: "usda_fdc" })]), "butter");
    expect(result[0].id).toBe("usda");
  });
  it("does not prefer incomplete BLS data over comparable complete USDA data", async () => {
    const result = await searchFoods(catalog([food("bls", "Butter", { kcalPer100g: null }), food("usda", "Butter", { source: "usda_fdc" })]), "butter");
    expect(result[0].id).toBe("usda");
  });
  it("finds an exact candidate beyond the original 90-row pre-ranking cutoff, regardless of input order", async () => {
    const rows = [...Array.from({ length: 190 }, (_, index) => food(`a${String(index).padStart(3,"0")}`, `Quark dessert ${index}`)), food("z-plain", "Quark")];
    for (const input of [rows, [...rows].reverse()]) {
      const db = rankedCatalog(input);
      expect((await searchFoods(db, "quark", 1))[0]?.id).toBe("z-plain");
      for (const [args] of db.food.findMany.mock.calls) expect(args.orderBy).toBeDefined();
      expect(db.food.findMany.mock.calls[0][0].where.id.in).toEqual(["z-plain"]);
      expect(db.foodAlias.findMany).not.toHaveBeenCalled();
    }
  });
  it("finds an exact alias beyond the original 60-row cutoff", async () => {
    const rows = [...Array.from({ length: 130 }, (_, index) => food(`a${String(index).padStart(3, "0")}`, `Other ${index}`)), food("z-target", "Cultured cream")];
    const aliases = [
      ...rows.slice(0, 130).map((row, index) => ({ id: `a${String(index).padStart(3, "0")}`, foodId: row.id, normalizedAlias: `cream filler ${index}`, kind: "synonym", confidence: 1 })),
      { id: "z-target", foodId: "z-target", normalizedAlias: "cream", kind: "synonym", confidence: 1 },
    ];
    const db = rankedCatalog(rows, aliases);
    expect((await searchFoods(db, "cream", 1))[0]?.id).toBe("z-target");
    expect(db.foodAlias.findMany).not.toHaveBeenCalled();
    expect(db.food.findMany.mock.calls[0][0].where.id.in).toEqual(["z-target"]);
  });
  it("keeps two equally strong identities ambiguous instead of trusting the source tie-break", async () => {
    const result = await interpretMealInput(catalog([food("a", "Cream", { source: "bls" }), food("b", "Cream", { source: "usda_fdc", fatPer100g: 30 })]), "100 g cream");
    expect(result.ambiguous).toBe(true);
    expect(result.canConfirm).toBe(false);
  });
});
