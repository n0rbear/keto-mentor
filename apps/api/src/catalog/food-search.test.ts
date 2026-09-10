import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { expandFoodQuery, hasSemanticCoverage, isTrustedLocalMatch, searchFoods } from "./food-search.js";
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
