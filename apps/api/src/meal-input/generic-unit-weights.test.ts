import { describe, expect, it } from "vitest";
import { genericUnitWeight } from "./generic-unit-weights.js";
import { resolveQuantity } from "./interpret.js";
import { parseNaturalFoodQuery } from "../catalog/natural-food-query.js";
import { dishCoreKey, phraseMentionsDish, withoutSiteSuffix } from "./local-recipe-lookup.js";

const food = (name: string, names: Record<string, string> = {}) => ({ id: "f", source: "bls", sourceId: null, name, names, servings: [] });

describe("typical slice weights without AI (owner request 2026-09-26)", () => {
  it("knows common cold cuts, cheese and bread in every language", () => {
    expect(genericUnitWeight("slice", food("Salami", { hu: "Szalámi" }))?.grams).toBe(8);
    expect(genericUnitWeight("slice", food("Kochschinken", { hu: "Főtt sonka" }))?.grams).toBe(15);
    expect(genericUnitWeight("slice", food("Gouda, 45% F.i.Tr.", { hu: "Gouda sajt" }))?.grams).toBe(20);
    expect(genericUnitWeight("slice", food("Roggenbrot", { hu: "Rozskenyér" }))?.grams).toBe(35);
    expect(genericUnitWeight("slice", food("Hamburger"))).toBeNull();
    expect(genericUnitWeight("piece", food("Gouda"))).toBeNull();
  });

  it("turns '4 szelet sajt' into grams, editable before saving", async () => {
    const result = await resolveQuantity(parseNaturalFoodQuery("4 szelet sajt"), food("Gouda", { hu: "Gouda sajt" }) as any);
    expect(result).toMatchObject({ status: "resolved", grams: 80, gramsPerUnit: 20, requiresConfirmation: true, provenance: { method: "generic_unit_weight", key: "cheese" } });
  });

  it("counts eggs in an egg dish without its own egg serving ('Rántotta 3 tojásból')", async () => {
    const result = await resolveQuantity(parseNaturalFoodQuery("Rántotta 3 tojásból"), food("Scrambled eggs", { hu: "Rántotta" }) as any);
    expect(result).toMatchObject({ status: "resolved", grams: 150, provenance: { method: "generic_unit_weight", key: "egg" } });
    expect(genericUnitWeight("piece", food("Apple", { hu: "Alma" }))).toBeNull();
  });

  it("prefers the food's own slice serving", async () => {
    const own = { ...food("Gouda"), servings: [{ id: "s1", key: "slice", unit: "slice", labels: {}, grams: 25, isEstimated: false, confidence: 1, provenance: { source: "curated" } }] };
    expect(await resolveQuantity(parseNaturalFoodQuery("3 szelet gouda"), own as any)).toMatchObject({ grams: 75, servingId: "s1" });
  });
});

describe("dish names in sentences and imported titles", () => {
  it("ignores a site suffix and Hungarian suffixes", () => {
    expect(dishCoreKey("Paprikás krumpli | Mindmegette.hu")).toBe("paprikas krumpli");
    expect(withoutSiteSuffix("Paprikás krumpli | Mindmegette.hu")).toBe("Paprikás krumpli");
    expect(withoutSiteSuffix("Gulyásleves – Nosalty")).toBe("Gulyásleves");
    expect(withoutSiteSuffix("Lecsó – nagyi módra")).toBe("Lecsó – nagyi módra");
    expect(phraseMentionsDish("Ettem egy tányér paprikás krumplit", "Paprikás krumpli")).toBe(true);
    expect(phraseMentionsDish("Ettem egy tányér paprikás krumplit", "Paprikás csirke")).toBe(false);
    expect(phraseMentionsDish("paprikás kru", "Paprikás krumpli")).toBe(true);
  });
});
