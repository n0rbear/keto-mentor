// BLS / European-source priority (2026-09-20). Fixture names and nutrition are
// copied from the REAL BLS 4.0 workbook (BLS_4_0_Daten_2025_DE.xlsx) read with
// the repo's own BlsAdapter — never invented. Rule under test: at EQUAL identity
// strength a BLS row wins; a weaker BLS identity never beats a stronger USDA one;
// identity correctness always outranks source geography.
import { describe, expect, it } from "vitest";
import { searchFoods } from "./food-search.js";
import { normalizeSearch } from "./normalize.js";
import { resolveRecipeIngredientsBatch } from "../recipes/recipe-ingredient-batch-resolution.js";
import { parseNaturalFoodQuery } from "./natural-food-query.js";
import { aliasesForCoverageEntry } from "../importers/everyday-alias-overlay.js";
import { EVERYDAY_COVERAGE_V2 } from "../importers/everyday-coverage-manifest.js";

type Fx = { id: string; source: string; name: string; names?: Record<string, string>; synonyms?: Record<string, string[]> };
function catalog(rows: Fx[]) {
  const foods = rows.map((r) => ({ ...r, originalName: r.name, names: r.names ?? {}, createdById: null, servings: [],
    searchText: normalizeSearch([r.name, ...Object.values(r.names ?? {}), ...Object.values(r.synonyms ?? {}).flat()].join(" ")) }));
  const aliasRows = rows.flatMap((r) => Object.values(r.synonyms ?? {}).flat().map((a) => ({ foodId: r.id, normalizedAlias: normalizeSearch(a) })));
  return {
    foodAlias: { findMany: async ({ where }: any) => aliasRows.filter((a) => where.OR.some((o: any) => a.normalizedAlias.includes(o.normalizedAlias.contains))) },
    food: { findMany: async ({ where }: any) => where?.id?.in ? foods.filter((f) => where.id.in.includes(f.id)) : foods.filter((f) => where.OR.some((o: any) => f.searchText.includes(o.searchText.contains))) }
  } as any;
}

describe("A/B — searchFoods: BLS wins ties only, identity strength first", () => {
  it("A. equal-quality BLS vs USDA: BLS ranks first", async () => {
    const db = catalog([
      { id: "usda", source: "usda_fdc", name: "Garlic, raw", names: { en: "garlic" } },
      { id: "bls", source: "bls", name: "Knoblauch roh", names: { en: "garlic", de: "Knoblauch roh" } }
    ]);
    expect((await searchFoods(db, "garlic")).map((f) => f.id)).toEqual(["bls", "usda"]);
  });

  it("B. a WEAKER BLS identity never beats a clearly stronger USDA match", async () => {
    const db = catalog([
      // Real BLS row: contains the token but is a different food (a dish).
      { id: "bls-dish", source: "bls", name: "Petersilienkartoffeln" },
      { id: "usda-exact", source: "usda_fdc", name: "Petersilienkartoffeln", names: { en: "parsley potatoes" }, synonyms: { hu: ["petrezselymes krumpli"] } }
    ]);
    const ranked = await searchFoods(db, "petrezselymes krumpli");
    expect(ranked[0].id).toBe("usda-exact");
  });
});

describe("D — petrezselyem: leaf / root / dried stay separate identities (real BLS names)", () => {
  const db = () => catalog([
    { id: "leaf", source: "bls", name: "Petersilienblatt roh", names: { en: "parsley leaf" } },
    { id: "root", source: "bls", name: "Wurzelpetersilie roh", names: { en: "parsley root" } },
    { id: "dried", source: "bls", name: "Petersilienblatt getrocknet", names: { en: "dried parsley leaf" } }
  ]);
  it("a root query never returns the leaf as its top identity, and vice versa", async () => {
    expect((await searchFoods(db(), "Wurzelpetersilie"))[0].id).toBe("root");
    expect((await searchFoods(db(), "Petersilienblatt roh"))[0].id).toBe("leaf");
  });
  it("no overlay entry claims bare 'petrezselyem' (leaf vs root is genuinely ambiguous in Hungarian)", () => {
    const hu = EVERYDAY_COVERAGE_V2.flatMap((e) => e.aliases.hu).map(normalizeSearch);
    expect(hu).not.toContain("petrezselyem");
  });
});

describe("C/E — túró and szalonna: no unsafe confident alias", () => {
  const huAliases = (key: string) => EVERYDAY_COVERAGE_V2.find((e) => e.key === key)!.aliases.hu.map(normalizeSearch);
  const allHu = EVERYDAY_COVERAGE_V2.flatMap((e) => e.aliases.hu).map(normalizeSearch);

  it("C. bare 'túró' is not an alias of the fat-free BLS Magerquark (M713100, 66 kcal); only 'sovány túró' is", () => {
    expect(allHu).not.toContain("turo");
    expect(huAliases("quark")).toContain("sovany turo");
    const entry = EVERYDAY_COVERAGE_V2.find((e) => e.key === "quark")!;
    expect(entry.sourceId).toBe("M713100");
    expect(aliasesForCoverageEntry(entry).some((a) => a.normalizedAlias === "turo")).toBe(false);
  });

  it("C. bare 'túró' cannot become a trusted local match to cottage cheese / quark / cream cheese", async () => {
    // The three real BLS candidates a naive mapping would pick between.
    const db = catalog([
      { id: "magerquark", source: "bls", name: "Speisequark Magerstufe, Magerquark < 10 % Fett i. Tr.", synonyms: { hu: ["sovány túró"] } },
      { id: "huttenkase", source: "bls", name: "Körniger Frischkäse < 10 % Fett i. Tr.", synonyms: { hu: ["szemcsés túró"] } },
      { id: "frischkase", source: "bls", name: "Frischkäsezubereitung Natur, mind. 60 % Fett i. Tr." }
    ]);
    const ranked = await searchFoods(db, "túró");
    expect(ranked.filter((f) => f.match.stage === "exact" || f.match.stage === "alias")).toEqual([]);
  });

  it("E. bare 'szalonna' is not an alias of BLS Frühstücksspeck (W415000, 304 kcal) — back fat is 699-746 kcal", async () => {
    expect(allHu).not.toContain("szalonna");
    const entry = EVERYDAY_COVERAGE_V2.find((e) => e.key === "bacon")!;
    expect(entry.sourceId).toBe("W415000");
    expect(aliasesForCoverageEntry(entry).some((a) => a.normalizedAlias === "szalonna")).toBe(false);
    const db = catalog([
      { id: "fruehstuecksspeck", source: "bls", name: "Schwein Frühstücksspeck, Rohpökelware, geräuchert", synonyms: { hu: ["bacon"] } },
      { id: "rueckenspeck", source: "bls", name: "Schwein Speck/Rückenspeck (grüner Speck) roh" }
    ]);
    const trusted = (await searchFoods(db, "szalonna")).filter((f) => f.match.stage === "exact" || f.match.stage === "alias");
    expect(trusted).toEqual([]);
  });
});

describe("F — recipe ingredient resolution honors the BLS tie-break", () => {
  const provider = (identity: string) => ({ id: "fixture", normalize: async () => ({ ingredients: [{ index: 0, foods: [{ canonicalIdentity: identity }] }] }) }) as any;
  const line = (raw: string) => ({ lines: [{ index: 0, raw, parsed: parseNaturalFoodQuery(raw) }] });

  it("with a trusted USDA '..., raw' row and an equally-matching BLS '... roh' row, the recipe resolver picks BLS", async () => {
    const db = catalog([
      { id: "usda", source: "usda_fdc", name: "Garlic, raw", names: { en: "garlic" } },
      { id: "bls", source: "bls", name: "Knoblauch roh", names: { en: "garlic", de: "Knoblauch roh" } }
    ]);
    const result = await resolveRecipeIngredientsBatch(db, provider("garlic"), line("2 cloves garlic"), null);
    expect(result?.[0].selectedFood?.id).toBe("bls");
  });

  it("an explicit cooked state still overrides the raw preference (BLS 'gekocht' is not treated as raw)", async () => {
    const db = catalog([
      { id: "bls-raw", source: "bls", name: "Wurzelpetersilie roh", names: { en: "parsley root" } },
      { id: "bls-cooked", source: "bls", name: "Wurzelpetersilie gekocht", names: { en: "parsley root" } }
    ]);
    const asSupplied = await resolveRecipeIngredientsBatch(db, provider("parsley root"), line("1 parsley root"), null);
    expect(asSupplied?.[0].selectedFood?.id).toBe("bls-raw");
  });

  it("a stronger USDA identity is not displaced by a weaker BLS row in the recipe resolver either", async () => {
    const db = catalog([
      { id: "bls-weak", source: "bls", name: "Petersilienkartoffeln" },
      { id: "usda-strong", source: "usda_fdc", name: "Parsley, fresh", names: { en: "parsley" } }
    ]);
    const result = await resolveRecipeIngredientsBatch(db, provider("parsley"), line("1 bunch parsley"), null);
    expect(result?.[0].selectedFood?.id).toBe("usda-strong");
  });
});
