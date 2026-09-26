import { describe, expect, it, vi } from "vitest";

const foodsByQuery: Record<string, any[]> = {};
vi.mock("../catalog/food-search.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../catalog/food-search.js")>();
  return { ...original, searchFoods: vi.fn(async (_prisma: unknown, query: string) => foodsByQuery[query] ?? []) };
});

const { unifiedSearch } = await import("./unified-search.js");
const { REFERENCE_USERNAME } = await import("../reference-dishes/seed.js");

function fakePrisma(own: Array<{ id: string; title: string }>, referenceVariants: string[] = []) {
  return {
    recipe: {
      findMany: async ({ where }: any) => where.user?.username === REFERENCE_USERNAME
        ? referenceVariants.map((id, i) => ({ id: `ref-${i}`, title: id, servings: 1, finishedWeightGrams: 300, provenance: { referenceVariantId: id } }))
        : own.filter(() => where.userId === "u1").map((r) => ({ ...r, servings: 4, finishedWeightGrams: 1600, provenance: null }))
    }
  } as any;
}
const deps = (over: any = {}) => ({ userId: "u1", foodLocale: "hu" as any, ...over });

describe("one search field (roadmap G1 + E4)", () => {
  it("digits of barcode length are a barcode, never a text search", async () => {
    expect(await unifiedSearch(fakePrisma([]), " 5997 5231 1130 7 ", false, deps())).toEqual({ kind: "barcode", barcode: "5997523111307" });
  });

  it("lists own recipes (by dish words), reference dishes (by partial alias) and ingredients together", async () => {
    foodsByQuery["pörkölt"] = [{ id: "f1", name: "Schwein Gulasch", match: { stage: "fuzzy", score: 60 } }];
    const prisma = fakePrisma([{ id: "own1", title: "A legfinomabb pörkölt" }, { id: "own2", title: "Rántott hús" }], ["hu_sertesporkolt", "hu_sertesporkolt__nokedli"]);
    const result = await unifiedSearch(prisma, "pörkölt", false, deps());
    if (result.kind !== "results") throw new Error("expected results");
    expect(result.items.map((i: any) => i.type === "recipe" ? `${i.source}:${i.title}` : `food:${i.food.id}`)).toEqual([
      "own:A legfinomabb pörkölt", "reference:hu_sertesporkolt", "reference:hu_sertesporkolt__nokedli", "food:f1"
    ]);
    expect(result.items[0]).toMatchObject({ servings: 4, servingGrams: 400 });
    expect(result.meaning.tried).toBe(false);
  });

  it("meaning search (E4) runs only when asked and nothing matched by name, and merges what it finds", async () => {
    foodsByQuery["virsli"] = [];
    foodsByQuery["frankfurter"] = [{ id: "w1", name: "Wiener Würstchen", match: { stage: "exact", score: 100 } }];
    const generate = vi.fn(async () => ({ canonicalConcept: "frankfurter", searchTerms: ["frankfurter"] }));
    const provider = { id: "openai", generate } as any;
    const typed = await unifiedSearch(fakePrisma([]), "virsli", false, deps({ searchIntentProvider: provider }));
    expect(generate).not.toHaveBeenCalled();
    const asked = await unifiedSearch(fakePrisma([]), "virsli", true, deps({ searchIntentProvider: provider }));
    if (typed.kind !== "results" || asked.kind !== "results") throw new Error("expected results");
    expect(typed.items).toEqual([]);
    expect(asked.items).toEqual([{ type: "food", food: expect.objectContaining({ id: "w1" }), via: "meaning" }]);
    expect(asked.meaning).toEqual({ tried: true, terms: ["frankfurter"] });
  });

  it("never spends the AI when a trusted name match exists or the budget is used up", async () => {
    foodsByQuery["tojás"] = [{ id: "e1", name: "Egg", match: { stage: "alias", score: 100 } }];
    foodsByQuery["xyz"] = [];
    const generate = vi.fn(async () => ({ canonicalConcept: "x", searchTerms: ["x"] }));
    const provider = { id: "openai", generate } as any;
    await unifiedSearch(fakePrisma([]), "tojás", true, deps({ searchIntentProvider: provider }));
    const limited = await unifiedSearch(fakePrisma([]), "xyz", true, deps({ searchIntentProvider: provider, meaningLimiter: { consume: () => false } }));
    expect(generate).not.toHaveBeenCalled();
    expect(limited.kind === "results" && limited.meaning.tried).toBe(false);
  });
});
