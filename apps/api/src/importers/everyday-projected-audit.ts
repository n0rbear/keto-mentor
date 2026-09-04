import { searchFoods } from "../catalog/food-search.js";
import { interpretMealInput } from "../meal-input/interpret.js";
import { EVERYDAY_SEARCH_CORPUS, type EverydaySearchCase } from "./everyday-coverage-manifest.js";
import { projectedCatalogPrisma, type ProjectedCatalog } from "./projected-catalog.js";

export type ProjectedSearchCategory = "PASS_EXACT" | "PASS_ALIAS" | "PASS_PARTIAL" | "PASS_FUZZY" | "AMBIGUOUS" | "WRONG_TOP_RESULT" | "MISSING";
export type ProjectedSearchResult = {
  query: string; expectedConcept: string; expectedIdentity: string | null; acceptedIdentities: readonly string[];
  actualTopIdentity: string | null; actualTopFoodId: string | null; topStage: string | null; topScore: number;
  secondIdentity: string | null; secondFoodId: string | null; secondScore: number; tiedOrNearlyTied: boolean; interpretWouldBeAmbiguous: boolean;
  category: ProjectedSearchCategory;
};
const identity = (food: any) => food ? `${food.source}:${food.sourceId}` : null;
const accepted = (test: EverydaySearchCase, candidate: string | null) => !!candidate && (
  test.acceptedIdentities?.includes(candidate) || candidate === `${test.expectedSource}:${test.expectedSourceId}`
);

export async function auditProjectedSearch(catalog: ProjectedCatalog, cases: readonly EverydaySearchCase[] = EVERYDAY_SEARCH_CORPUS) {
  const prisma = projectedCatalogPrisma(catalog);
  const results: ProjectedSearchResult[] = [];
  for (const test of cases) {
    const candidates = await searchFoods(prisma, test.query, 20);
    const top = candidates[0];
    const second = candidates[1];
    const topIdentity = identity(top);
    const secondIdentity = identity(second);
    const topScore = top?.match.score ?? 0;
    const secondScore = second?.match.score ?? 0;
    const tiedOrNearlyTied = !!second && topScore - secondScore <= 2;
    const interpretWouldBeAmbiguous = tiedOrNearlyTied && secondScore >= 80;
    let category: ProjectedSearchCategory;
    if (!top) category = "MISSING";
    else if (test.expectedAmbiguous) category = tiedOrNearlyTied ? "AMBIGUOUS" : "WRONG_TOP_RESULT";
    else if (interpretWouldBeAmbiguous) category = "AMBIGUOUS";
    else if (!accepted(test, topIdentity)) category = "WRONG_TOP_RESULT";
    else category = `PASS_${top.match.stage.toUpperCase()}` as ProjectedSearchCategory;
    results.push({
      query: test.query, expectedConcept: test.expectedConcept,
      expectedIdentity: test.expectedSource ? `${test.expectedSource}:${test.expectedSourceId}` : null,
      acceptedIdentities: test.acceptedIdentities ?? [], actualTopIdentity: topIdentity,
      actualTopFoodId: top?.id ?? null, topStage: top?.match.stage ?? null, topScore,
      secondIdentity, secondFoodId: second?.id ?? null, secondScore, tiedOrNearlyTied, interpretWouldBeAmbiguous, category
    });
  }
  const categories = Object.fromEntries((["PASS_EXACT", "PASS_ALIAS", "PASS_PARTIAL", "PASS_FUZZY", "AMBIGUOUS", "WRONG_TOP_RESULT", "MISSING"] as const)
    .map((category) => [category, results.filter((result) => result.category === category).length]));
  const passed = categories.PASS_EXACT + categories.PASS_ALIAS + categories.PASS_PARTIAL + categories.PASS_FUZZY;
  return { total: results.length, passed, passRate: Number((passed / results.length * 100).toFixed(1)), categories, results };
}

export const MEAL_REGRESSION_INPUTS = [
  "2 eggs", "2 tojás", "2 Eier", "avocado", "vaj", "Butter", "butter",
  "spenót", "Spinat", "spinach", "uborka", "Gurke", "cucumber", "Gouda", "Cheddar",
  "chicken breast", "fried egg", "tükörtojás", "scrambled egg", "rántotta"
] as const;

export async function auditProjectedMealInput(catalog: ProjectedCatalog, inputs: readonly string[] = MEAL_REGRESSION_INPUTS) {
  const prisma = projectedCatalogPrisma(catalog);
  return Promise.all(inputs.map(async (input) => {
    const result = await interpretMealInput(prisma, input);
    return {
      input, foodResolution: result.foodResolution, selectedFoodId: result.selectedFood?.id ?? null,
      selectedIdentity: identity(result.selectedFood), ambiguous: !!result.ambiguous,
      quantityStatus: result.quantity?.status ?? null, grams: result.quantity?.grams ?? null,
      servingId: result.quantity?.servingId ?? null, preparation: result.preparation ?? null,
      preparationUnavailable: !!result.preparationUnavailable,
      candidates: result.candidates.slice(0, 3).map((candidate) => ({
        foodId: candidate.id, identity: identity(candidate), stage: candidate.match?.stage ?? null, score: candidate.match?.score ?? 0
      }))
    };
  }));
}

export async function auditShortAliasSafety(catalog: ProjectedCatalog) {
  const introduced = [...new Set(catalog.aliases.map((alias) => alias.normalizedAlias).filter((alias) => alias.length >= 2 && alias.length <= 3))];
  const queries = [...new Set(["ei", "oil", "ham", "rice", ...introduced])].sort();
  const prisma = projectedCatalogPrisma(catalog);
  return Promise.all(queries.map(async (query) => {
    const matching = catalog.aliases.filter((alias) => alias.normalizedAlias.includes(query));
    const exact = matching.filter((alias) => alias.normalizedAlias === query);
    const results = await searchFoods(prisma, query, 20);
    return {
      query, matchingAliasRows: matching.length, exceedsTake60: matching.length > 60,
      exactAliasFoodIds: [...new Set(exact.map((alias) => alias.foodId))],
      exactAliasRowsInsideFirst60: exact.filter((alias) => matching.indexOf(alias) < 60).length,
      topFoodId: results[0]?.id ?? null, topIdentity: identity(results[0]),
      topStage: results[0]?.match.stage ?? null, topScore: results[0]?.match.score ?? 0
    };
  }));
}

const COLLISION_CONCEPTS = new Set(["egg", "avocado", "butter", "spinach", "cucumber", "cheddar", "gouda", "chicken-breast"]);

export async function auditCrossSourceCollisions(
  current: ProjectedCatalog,
  projected: ProjectedCatalog,
  preFix: ProjectedCatalog,
  cases: readonly EverydaySearchCase[] = EVERYDAY_SEARCH_CORPUS
) {
  const selected = cases.filter((test) => COLLISION_CONCEPTS.has(test.expectedConcept));
  const run = async (catalog: ProjectedCatalog, query: string) => {
    const prisma = projectedCatalogPrisma(catalog);
    const candidates = await searchFoods(prisma, query, 2);
    const interpreted = await interpretMealInput(prisma, query);
    return {
      topIdentity: identity(candidates[0]), topFoodId: candidates[0]?.id ?? null, topScore: candidates[0]?.match.score ?? 0,
      secondIdentity: identity(candidates[1]), secondFoodId: candidates[1]?.id ?? null, secondScore: candidates[1]?.match.score ?? 0,
      ambiguous: !!interpreted.ambiguous, resolution: interpreted.foodResolution
    };
  };
  return Promise.all(selected.map(async (test) => ({
    query: test.query, concept: test.expectedConcept,
    production: await run(current, test.query), preFixProjected: await run(preFix, test.query), projected: await run(projected, test.query)
  })));
}
