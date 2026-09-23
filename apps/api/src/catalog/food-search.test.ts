import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { expandFoodQuery, hasSemanticCoverage, isTrustedLocalMatch, localFormMismatch, searchFoods } from "./food-search.js";
import { normalizeSearch } from "./normalize.js";

const records = [
  { id: "chicken", name: "Roasted chicken breast", originalName: "Chicken breast", names: { hu: "Sült csirkemell" }, searchText: "sult csirkemell gebratene hahnchenbrust roasted chicken breast csirke huhn chicken", servings: [] },
  { id: "egg", name: "Fried egg", originalName: "Egg, fried", names: { hu: "Tükörtojás" }, searchText: "tukortojas spiegelei fried egg sult tojas ei", servings: [] },
  { id: "cucumber", name: "Gurke roh", originalName: "Gurke roh", names: { de: "Gurke" }, searchText: "gurke roh cucumber uborka", servings: [] }
];
const prisma = {
  foodAlias: { findMany: async () => [] },
  food: { findMany: async ({ where, take = 90 }: any) => {
    if (where.id?.in) return records.filter((food) => where.id.in.includes(food.id));
    const queries = where.OR.map((clause: any) => clause.searchText.contains);
    return records.filter((food) => queries.some((query: string) => food.searchText.includes(query))).slice(0, take);
  } }
} as unknown as Pick<PrismaClient, "food" | "foodAlias">;

describe("food search resolver", () => {
  it("prefers BLS over USDA only when identity scores tie", async () => {
    const base = { name: "Butter", originalName: "Butter", searchText: "butter", servings: [] };
    const fake = { foodAlias: { findMany: async () => [] }, food: { findMany: async () => [
      { ...base, id: "usda", source: "usda_fdc" }, { ...base, id: "bls", source: "bls" },
      { ...base, id: "bls-other", source: "bls", name: "Butter flavored sauce", originalName: "Butter flavored sauce", searchText: "butter flavored sauce" }
    ] } } as any;
    const result = await searchFoods(fake, "butter");
    expect(result.map((row) => row.id)).toEqual(["bls", "usda", "bls-other"]);
  });
  it.each([
    ["csirkemell", "chicken"], ["Hähnchenbrust", "chicken"], ["chicken breast", "chicken"],
    ["tukortojas", "egg"], ["sült tojás", "egg"], ["kígyóuborka", "cucumber"], ["uborka", "cucumber"]
  ])("finds %s", async (query, id) => expect((await searchFoods(prisma, query))[0]?.id).toBe(id));

  it("expands known prepared-food terms without inventing a match", () => expect(expandFoodQuery("tojásrántotta")).toEqual(["tojasrantotta", "ruhrei", "scrambled egg"]));
  it("ranks exact localized names before partial matches", async () => expect((await searchFoods(prisma, "Tükörtojás"))[0]?.match.stage).toBe("exact"));
  it("returns no foods for an unknown query", async () => expect(await searchFoods(prisma, "quinoa-pizza")).toEqual([]));
  it("does not query the catalog below two characters", async () => expect(await searchFoods(prisma, "c")).toEqual([]));
  it("ranks an exact alias above a longer alias that merely contains the query", async () => {
    const eggRecords = [
      { id: "base", name: "Egg", originalName: "Egg, whole, raw", names: { en: "Egg" }, searchText: "egg eggs", servings: [] },
      { id: "scrambled", name: "Scrambled egg", originalName: "Egg, scrambled", names: { en: "Scrambled egg" }, searchText: "scrambled egg eggs scrambled", servings: [] }
    ];
    const aliases = [
      { foodId: "base", normalizedAlias: "eggs" },
      { foodId: "scrambled", normalizedAlias: "eggs scrambled" }
    ];
    const exactAliasPrisma = {
      foodAlias: { findMany: async () => aliases },
      food: { findMany: async ({ where }: any) => where.id?.in ? eggRecords.filter((food) => where.id.in.includes(food.id)) : eggRecords }
    } as unknown as Pick<PrismaClient, "food" | "foodAlias">;

    const result = await searchFoods(exactAliasPrisma, "eggs");
    expect(result.map((food) => food.id)).toEqual(["base", "scrambled"]);
    expect(result[0].match).toMatchObject({ stage: "alias", score: 95 });
    expect(result[1].match.score).toBeLessThan(result[0].match.score);
  });
  it("normalizes German sharp s and accents", () => expect(normalizeSearch("Weißkohl Süßrahmbutter")).toBe("weisskohl sussrahmbutter"));
});

// Regression: owner-beta blocker #2 (2026-09-10). A "dynamic_search" alias
// only ever remembers one prior request's raw phrase, attached to whatever
// food that single request's (possibly wrong) resolution landed on — never
// human-reviewed. Two real production cases learned exactly this kind of
// alias from a bad dynamic-resolution/translation and then auto-resolved
// with full confidence on every later identical query, with zero AI
// involved: "gefüllte Kohlrouladen" -> "bok choy", "Champignoncremesuppe"
// -> "beech mushroom". Every other alias kind describes a food's OWN
// validated name (curated import data, or the food's own re-fetched
// localized/canonical names), so it keeps full trust unconditionally.
describe("semantic coverage gate on learned (dynamic_search) aliases", () => {
  function foodWith(id: string, name: string, searchText: string) {
    return { id, name, originalName: name, names: { en: name }, searchText, servings: [] };
  }

  it("a poisoned dynamic_search alias with zero relation to the food's own name does not auto-resolve (the real Kohlrouladen/bok choy case)", async () => {
    const bokChoy = foodWith("bok-choy", "Cabbage, bok choy, raw", "cabbage bok choy raw");
    const prismaWithBadAlias = {
      foodAlias: { findMany: async () => [{ foodId: "bok-choy", normalizedAlias: "gefullte kohlrouladen", kind: "dynamic_search" }] },
      food: { findMany: async ({ where }: any) => where?.id?.in ? [bokChoy].filter((f) => where.id.in.includes(f.id)) : [bokChoy] }
    } as unknown as Pick<PrismaClient, "food" | "foodAlias">;

    const result = await searchFoods(prismaWithBadAlias, "gefüllte Kohlrouladen");
    // Still surfaced (a weak candidate is legitimate — see task's "auto-resolve
    // vs candidate" distinction) but nowhere near auto-resolve confidence.
    expect(result[0]?.id).toBe("bok-choy");
    expect(result[0]?.match.stage).not.toBe("alias");
    expect(result[0]?.match.score).toBeLessThan(80);
  });

  it("the identical alias text, learned as a curated/synonym kind instead, is trusted at full weight (kind, not the mere existence of a row, is what matters)", async () => {
    const bokChoy = foodWith("bok-choy", "Cabbage, bok choy, raw", "cabbage bok choy raw");
    const prismaWithCuratedAlias = {
      foodAlias: { findMany: async () => [{ foodId: "bok-choy", normalizedAlias: "gefullte kohlrouladen", kind: "synonym" }] },
      food: { findMany: async ({ where }: any) => where?.id?.in ? [bokChoy].filter((f) => where.id.in.includes(f.id)) : [bokChoy] }
    } as unknown as Pick<PrismaClient, "food" | "foodAlias">;

    const result = await searchFoods(prismaWithCuratedAlias, "gefüllte Kohlrouladen");
    expect(result[0]).toMatchObject({ id: "bok-choy", match: { stage: "alias", score: 95 } });
  });

  it("a dynamic_search alias that genuinely overlaps the food's own name still resolves at full confidence (Mandel/Mandeln, csülök/pork hock style cross-language matches keep working)", async () => {
    const porkHock = foodWith("pork-hock", "Pork hock, cooked", "pork hock cooked");
    // A real localization pass would have attached a "csulok"-bearing hu name
    // before this alias was ever learned — reflected directly in names here
    // (which is why this legitimately lands on "exact", an even stronger tier
    // than "alias": the query matches the food's own recorded name outright).
    (porkHock as any).names = { en: "Pork hock, cooked", hu: "Csülök" };
    const prismaWithLegitAlias = {
      foodAlias: { findMany: async () => [{ foodId: "pork-hock", normalizedAlias: "csulok", kind: "dynamic_search" }] },
      food: { findMany: async ({ where }: any) => where?.id?.in ? [porkHock].filter((f) => where.id.in.includes(f.id)) : [porkHock] }
    } as unknown as Pick<PrismaClient, "food" | "foodAlias">;

    const result = await searchFoods(prismaWithLegitAlias, "csülök");
    expect(result[0]).toMatchObject({ id: "pork-hock", match: { stage: "exact", score: 100 } });
  });

  it("one shared token out of a multi-token dish name is not enough for a dynamic_search alias to auto-resolve (the real Champignoncremesuppe/beech-mushroom case)", async () => {
    const mushroom = foodWith("beech-mushroom", "Mushroom, beech", "mushroom beech");
    // Even a coincidental partial textual echo ("mushroom"-ish) must not be
    // enough on its own once coverage is computed against the food's own name.
    const prismaWithBadAlias = {
      foodAlias: { findMany: async () => [{ foodId: "beech-mushroom", normalizedAlias: "champignoncremesuppe", kind: "dynamic_search" }] },
      food: { findMany: async ({ where }: any) => where?.id?.in ? [mushroom].filter((f) => where.id.in.includes(f.id)) : [mushroom] }
    } as unknown as Pick<PrismaClient, "food" | "foodAlias">;

    const result = await searchFoods(prismaWithBadAlias, "Champignoncremesuppe");
    expect(result[0]?.match.stage).not.toBe("alias");
    expect(result[0]?.match.score).toBeLessThan(80);
  });

  // P0 semantic identity safety checkpoint (2026-09-16): the real,
  // reproduced bug this section closes. "mustár" (mustard, the condiment)
  // was learned as a dynamic_search alias for "Mustard greens, raw" purely
  // because hasSemanticCoverage's substring check treats "mustár" as
  // "covered" merely for being a lexical PREFIX of the longer, unrelated
  // compound word "mustárlevél" ("nyers mustárlevél", its own Hungarian
  // name) — passing every check the OTHER tests above rely on (real,
  // non-trivial lexical coverage, not a coincidental one-token echo). No
  // change to hasSemanticCoverage itself could fix this without also
  // breaking the legitimate csülök/pork-hock case two tests up. The actual
  // fix: a dynamic_search alias also needs confidence >=
  // DYNAMIC_SEARCH_ALIAS_TRUST_THRESHOLD to reach full ("exact") trust —
  // every alias written before this checkpoint (confidence 0.7, the
  // pre-existing default) is automatically demoted, no migration or manual
  // deletion of the existing poisoned row required.
  it("a dynamic_search alias with full lexical coverage but low (pre-checkpoint) confidence does NOT auto-resolve — the mustár/mustárlevél case", async () => {
    const mustardGreens = foodWith("mustard-greens", "Mustard greens, raw", "mustard greens raw");
    (mustardGreens as any).names = { en: "Mustard greens, raw", hu: "nyers mustárlevél" };
    const prismaWithPoisonedAlias = {
      foodAlias: { findMany: async () => [{ foodId: "mustard-greens", normalizedAlias: "mustar", kind: "dynamic_search", confidence: 0.7 }] },
      food: { findMany: async ({ where }: any) => where?.id?.in ? [mustardGreens].filter((f) => where.id.in.includes(f.id)) : [mustardGreens] }
    } as unknown as Pick<PrismaClient, "food" | "foodAlias">;

    const result = await searchFoods(prismaWithPoisonedAlias, "mustár");
    expect(result[0]?.match.stage).not.toBe("alias");
    expect(result[0]?.match.score).toBeLessThan(80);
  });

  it("a dynamic_search alias that HAS been semantically validated (confidence >= threshold) still resolves at full trust", async () => {
    const preparedMustard = foodWith("prepared-mustard", "Mustard, prepared, yellow", "mustard prepared yellow");
    (preparedMustard as any).names = { en: "Mustard, prepared, yellow", hu: "kész mustár, sárga" };
    const prismaWithValidatedAlias = {
      foodAlias: { findMany: async () => [{ foodId: "prepared-mustard", normalizedAlias: "mustar", kind: "dynamic_search", confidence: 0.95 }] },
      food: { findMany: async ({ where }: any) => where?.id?.in ? [preparedMustard].filter((f) => where.id.in.includes(f.id)) : [preparedMustard] }
    } as unknown as Pick<PrismaClient, "food" | "foodAlias">;

    const result = await searchFoods(prismaWithValidatedAlias, "mustár");
    expect(result[0]).toMatchObject({ id: "prepared-mustard", match: { stage: "alias", score: 95 } });
  });

  // P0 checkpoint regression matrix: the mustár/mustárlevél case is one
  // instance of a general shape (a short word that is a full lexical
  // prefix/subset of a longer, DIFFERENT food's compound name). The fix is
  // generic (confidence-gated, not food-specific), so it must hold for any
  // food pair with this shape, not just the one reported case.
  it.each([
    ["potato", "potato-bread", "Potato bread", "potato bread"],
    ["garlic", "garlic-bread", "Garlic bread", "garlic bread"],
    ["chicken", "chicken-soup", "Chicken soup", "chicken soup"],
    ["apple", "apple-pie", "Apple pie", "apple pie"],
    ["tomato", "tomato-sauce", "Tomato sauce", "tomato sauce"],
    ["carrot", "carrot-cake", "Carrot cake", "carrot cake"],
    ["senf", "senfblatter", "Senfblatter, mustard greens", "senfblatter mustard greens"]
  ])("a low-confidence (unvalidated) dynamic_search alias '%s' learned for a different, more specific food ('%s') does not auto-resolve", async (alias, id, name, searchText) => {
    const food = foodWith(id, name, searchText);
    const prismaWithLowConfAlias = {
      foodAlias: { findMany: async () => [{ foodId: id, normalizedAlias: alias, kind: "dynamic_search", confidence: 0.7 }] },
      food: { findMany: async ({ where }: any) => where?.id?.in ? [food].filter((f) => where.id.in.includes(f.id)) : [food] }
    } as unknown as Pick<PrismaClient, "food" | "foodAlias">;

    const result = await searchFoods(prismaWithLowConfAlias, alias);
    expect(result[0]?.match.stage).not.toBe("alias");
    expect(result[0]?.match.score).toBeLessThan(80);
  });

  it.each([
    ["potato", "potato-bread", "Potato bread", "potato bread"],
    ["garlic", "garlic-bread", "Garlic bread", "garlic bread"],
    ["senf", "senfblatter", "Senfblatter, mustard greens", "senfblatter mustard greens"]
  ])("the same alias '%s', once semantically validated (confidence >= threshold), is trusted at full weight", async (alias, id, name, searchText) => {
    const food = foodWith(id, name, searchText);
    const prismaWithValidatedAlias = {
      foodAlias: { findMany: async () => [{ foodId: id, normalizedAlias: alias, kind: "dynamic_search", confidence: 0.95 }] },
      food: { findMany: async ({ where }: any) => where?.id?.in ? [food].filter((f) => where.id.in.includes(f.id)) : [food] }
    } as unknown as Pick<PrismaClient, "food" | "foodAlias">;

    const result = await searchFoods(prismaWithValidatedAlias, alias);
    expect(result[0]).toMatchObject({ id, match: { stage: "alias", score: 95 } });
  });

  // Regression (2026-09-23, live staging RCA): a weak (confidence 0.7)
  // dynamic_search alias must be a MINIMUM fallback (35), never a precedence
  // override — it must not outrank the food's OWN genuine canonical/
  // searchText evidence. Real production case: "parsley" and "bacon" each
  // also carry an old dynamic_search alias pointing at their OWN, correct
  // Food (unlike the poisoned/unrelated-food cases above); the buggy
  // precedence forced both down to score 35 ("fuzzy") even though the food's
  // own name already earns 70-80 on natural evidence alone.
  it.each([
    ["parsley", "usda-parsley", "Parsley, fresh", "parsley fresh"],
    ["bacon", "usda-bacon", "Pork, cured, bacon, unprepared", "pork cured bacon unprepared"],
  ])("a weak dynamic_search alias pointing at the query's OWN correct food does not suppress that food's natural evidence for '%s'", async (alias, id, name, searchText) => {
    const food = foodWith(id, name, searchText);
    const prismaWithSelfReferentialWeakAlias = {
      foodAlias: { findMany: async () => [{ foodId: id, normalizedAlias: alias, kind: "dynamic_search", confidence: 0.7 }] },
      food: { findMany: async ({ where }: any) => where?.id?.in ? [food].filter((f) => where.id.in.includes(f.id)) : [food] }
    } as unknown as Pick<PrismaClient, "food" | "foodAlias">;

    const result = await searchFoods(prismaWithSelfReferentialWeakAlias, alias);
    expect(result[0]?.id).toBe(id);
    expect(result[0]?.match.stage).not.toBe("fuzzy");
    expect(result[0]?.match.score).toBeGreaterThan(35);
  });

  // The flip side of the above: when the food's OWN evidence is weaker than
  // the alias floor (a bare abbreviation-like name with no natural overlap),
  // the weak alias still legitimately provides the 35-point fallback signal
  // — it is a floor, not a no-op.
  it("a weak dynamic_search alias still provides its 35-point floor when the food has no stronger natural evidence of its own", async () => {
    const food = foodWith("obscure-sku-9", "SKU-9", "sku 9");
    const prismaWithWeakAliasNoOverlap = {
      foodAlias: { findMany: async () => [{ foodId: "obscure-sku-9", normalizedAlias: "parsley", kind: "dynamic_search", confidence: 0.7 }] },
      food: { findMany: async ({ where }: any) => where?.id?.in ? [food].filter((f) => where.id.in.includes(f.id)) : [food] }
    } as unknown as Pick<PrismaClient, "food" | "foodAlias">;

    const result = await searchFoods(prismaWithWeakAliasNoOverlap, "parsley");
    expect(result[0]).toMatchObject({ id: "obscure-sku-9", match: { stage: "fuzzy", score: 35 } });
  });

  // Positive control: legitimate compound-word matches (own recorded name,
  // not a learned alias) are untouched by the dynamic_search confidence gate.
  it.each([
    ["csirkemell", "Csirkemell"],
    ["csirkecomb", "Csirkecomb"],
    ["vöröshagyma", "Voroshagyma"],
    ["fokhagyma", "Fokhagyma"],
    ["Schweinerippchen", "Schweinerippchen"],
    ["Schweinehaxe", "Schweinehaxe"],
    ["Senf", "Senf"]
  ])("a food's own compound name ('%s') still resolves at full ('exact') trust with no alias involved", async (query, name) => {
    const food = foodWith("compound-food", name, normalizeSearch(name));
    const prismaNoAlias = {
      foodAlias: { findMany: async () => [] },
      food: { findMany: async ({ where }: any) => where?.id?.in ? [food].filter((f) => where.id.in.includes(f.id)) : [food] }
    } as unknown as Pick<PrismaClient, "food" | "foodAlias">;

    const result = await searchFoods(prismaNoAlias, query);
    expect(result[0]).toMatchObject({ id: "compound-food", match: { stage: "exact" } });
  });
});

// Owner-beta blocker #3 (2026-09-10): candidate relevance and trusted
// auto-resolve identity are different questions and must not share a
// threshold. A two-token phrase where only the (semantically load-bearing)
// modifier is missing — "stuffed cabbage" vs. a food merely named "cabbage" —
// used to pass at 50% coverage. Full coverage is required for TRUST; nothing
// here is a word list, it is the same token-coverage machinery at a stricter
// bar.
describe("hasSemanticCoverage: trust threshold (owner-beta blocker #3, 2026-09-10)", () => {
  it.each([
    ["stuffed cabbage", ["cabbage red raw"]],
    ["mushroom cream soup", ["mushroom beech"]],
    ["egg soup", ["egg"]],
    ["tofu soup", ["tofu"]]
  ])("a modifier + shared-base-word phrase ('%s') does not have full coverage against a food named only the base word", (query, representations) => {
    expect(hasSemanticCoverage(normalizeSearch(query), representations)).toBe(false);
  });

  it.each([
    ["cabbage red raw", ["cabbage red raw"]], // exact canonical name
    ["mandel", ["mandeln"]], // singular query, inflected/plural canonical representation
    ["csulok", ["pork hock cooked", "csulok"]] // trusted exact alias/localized name
  ])("a genuinely matching phrase ('%s') still has full coverage", (query, representations) => {
    expect(hasSemanticCoverage(normalizeSearch(query), representations)).toBe(true);
  });
});

describe("isTrustedLocalMatch: the one shared strong-resolution bar (owner-beta blocker #3, 2026-09-10)", () => {
  it.each([
    ["exact", 100, true],
    ["alias", 95, true],
    ["partial", 80, false], // prefix/startsWith tier — relevant, not trusted
    ["partial", 25, false], // the real bug's own tokenCoverage tier
    ["fuzzy", 35, false]
  ] as const)("stage=%s score=%i -> trusted=%s", (stage, score, expected) => {
    expect(isTrustedLocalMatch({ stage, score })).toBe(expected);
  });
});

describe("localFormMismatch: a stale local cache must not permanently outrank real form evidence (owner-beta checkpoint, 2026-09-15)", () => {
  const dynamicSearchAlias = { stage: "alias", aliasKind: "dynamic_search" };

  it("flags the reproduced live bug: source states no preparation, the only cached candidate is explicitly cooked", () => {
    expect(localFormMismatch("Tomatoes, red, ripe, cooked", { rawIngredient: "1 db paradicsom" }, dynamicSearchAlias)).toBe(true);
  });

  it("flags the symmetric case: source explicitly states a cooked/boiled preparation, the only cached candidate is explicitly raw", () => {
    expect(localFormMismatch("Tomatoes, red, ripe, raw", { rawIngredient: "2 főtt paradicsom" }, dynamicSearchAlias)).toBe(true);
    expect(localFormMismatch("Potatoes, raw, skin", { rawIngredient: "500 g főtt burgonya" }, dynamicSearchAlias)).toBe(true);
  });

  it("does not flag a candidate whose own name agrees with (or is silent about) the source's preparation", () => {
    expect(localFormMismatch("Garlic, raw", { rawIngredient: "2 gerezd fokhagyma" }, dynamicSearchAlias)).toBe(false);
    expect(localFormMismatch("Salt, table", { rawIngredient: "1 db paradicsom" }, dynamicSearchAlias)).toBe(false); // neutral candidate name, no state words either way
  });

  it("never flags a candidate when there is no source evidence at all (no preparation, no raw ingredient text)", () => {
    expect(localFormMismatch("Tomatoes, red, ripe, cooked", {}, dynamicSearchAlias)).toBe(false);
  });

  it("never flags a candidate reached via anything OTHER than an unreviewed dynamic_search alias — an exact name match or a human/system-validated alias kind must never be second-guessed by this heuristic", () => {
    const cases = [
      { stage: "exact" as const },
      { stage: "alias", aliasKind: "confirmed_external" }, // explicit human confirmation via /foods/resolve-external/confirm
      { stage: "alias", aliasKind: "curated_seed" },
      { stage: "alias", aliasKind: "external" },
      { stage: "alias", aliasKind: "synonym" },
      { stage: "alias", aliasKind: "localized_name" }
    ];
    for (const match of cases) {
      expect(localFormMismatch("Tomatoes, red, ripe, cooked", { rawIngredient: "1 db paradicsom" }, match)).toBe(false);
    }
  });

  it("falls back to the unscoped check when no match provenance is supplied at all (backward compatibility for callers without it)", () => {
    expect(localFormMismatch("Tomatoes, red, ripe, cooked", { rawIngredient: "1 db paradicsom" })).toBe(true);
  });

  it("must never flag a processed-derivative candidate as merely 'cooked' — this heuristic is intentionally narrow (raw vs cooked state only), the derivative/different-food distinction remains the semantic gate's job", () => {
    // "Bread, potato" contains none of the cooked/raw vocabulary at all —
    // this check correctly has nothing to say about it either way; rejecting
    // it is external-food.test.ts's semantic-gate responsibility, not this
    // cheap textual heuristic's.
    expect(localFormMismatch("Bread, potato", { rawIngredient: "500 g krumpli" }, dynamicSearchAlias)).toBe(false);
  });
});
