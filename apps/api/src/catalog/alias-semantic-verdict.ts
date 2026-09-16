import type { SemanticCandidateGateProvider } from "./semantic-candidate-gate.js";

/**
 * P0 semantic identity safety checkpoint (2026-09-16) — real, reproduced
 * bug: "mustár" (mustard, the condiment) was learned as a `dynamic_search`
 * alias for "Mustard greens, raw" purely on lexical overlap
 * (hasSemanticCoverage), then reused at full trust forever after, because
 * resolveAuthoritativeFood's LOCAL-match short-circuit never invokes the
 * semantic-candidate-gate at all (that gate only ever ran for freshly-fetched
 * EXTERNAL candidates) — so a `dynamic_search` alias, once learned, was never
 * actually semantically re-verified against the identity it was learned for.
 *
 * `computeAliasSemanticVerdict` closes this gap by reusing the EXISTING
 * semantic-candidate-gate (same_identity/processed_derivative/
 * different_prepared_food classification, not a new classifier) at the one
 * moment a NEW dynamic_search alias is about to be written — see
 * dynamic-food-resolution.ts's learnSearchAlias, which uses the resulting
 * verdict to decide the alias's own confidence (and therefore whether it
 * will ever be trusted at the "exact" tier again — see food-search.ts's
 * DYNAMIC_SEARCH_ALIAS_TRUST_THRESHOLD).
 *
 * Cost model: this only runs once, at the moment a genuinely NEW (or
 * previously-demoted, i.e. already below the trust threshold) alias is about
 * to be learned — never on an already-fully-trusted repeat query, which
 * short-circuits far earlier in interpretOne's own local search and never
 * reaches this code at all. No real gate configured (disabled provider) ->
 * "unknown" verdict, zero AI calls, identical to this codebase's pre-existing
 * behavior.
 */
export type AliasSemanticVerdict = "validated" | "rejected" | "unknown";

export async function computeAliasSemanticVerdict(
  provider: SemanticCandidateGateProvider | undefined,
  originalIdentity: string,
  food: { id: string; name?: unknown; originalName?: unknown; names?: unknown },
  locale: string | undefined,
  semanticContext?: { rawIngredient?: string; recipeTitle?: string; recipeContext?: string; preparation?: string; sourceQuantity?: number; sourceUnit?: string }
): Promise<AliasSemanticVerdict> {
  if (!provider || provider.id === "disabled") return "unknown";
  const authoritativeName =
    (typeof food.originalName === "string" && food.originalName) ||
    (typeof food.name === "string" && food.name) ||
    "";
  if (!authoritativeName) return "unknown";
  try {
    const verdicts = await provider.checkRelevance(
      {
        identity: originalIdentity,
        locale,
        rawIngredient: semanticContext?.rawIngredient,
        recipeTitle: semanticContext?.recipeTitle,
        recipeContext: semanticContext?.recipeContext,
        preparation: semanticContext?.preparation,
        sourceQuantity: semanticContext?.sourceQuantity,
        sourceUnit: semanticContext?.sourceUnit
      },
      [{ id: food.id, authoritativeName }]
    );
    // A real gate's *absence* of an entry for this candidate IS a rejection
    // (fail-closed — see semantic-candidate-gate.ts), never "unknown": the
    // gate was actually consulted and did not approve this identity.
    return verdicts.get(food.id) ? "validated" : "rejected";
  } catch {
    // A transient provider failure (timeout, malformed response) must not
    // permanently block ever learning this alias — fall back to the
    // pre-existing, safe (never over-trusted) legacy behavior, exactly as if
    // no gate had been configured. The next identical query gets another
    // chance to genuinely validate it.
    return "unknown";
  }
}
