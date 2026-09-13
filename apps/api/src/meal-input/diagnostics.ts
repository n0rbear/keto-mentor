import type { InterpretResult } from "./interpret.js";

/**
 * Beta owner-testing diagnostics (checkpoint 2026-09-13): a bounded, typed,
 * language-neutral timeline DERIVED from an already-computed InterpretResult
 * — never a separate parallel data path, never anything the client couldn't
 * already see elsewhere in the same response. Every event here describes a
 * pipeline stage that genuinely ran (or was genuinely skipped/blocked) for
 * THIS request; nothing is fabricated to look complete. `code` is a small
 * closed vocabulary translated client-side (see apps/web/src/i18n.ts's
 * `diagnostics` labels) so raw internal identifiers (provider error codes,
 * HTTP statuses, publicCode strings) are never shown to a production user —
 * only ever logged server-side (see interpret.ts / recipe-discovery-
 * fallback.ts's existing console.log calls) for owner/dev audit.
 */
export type DiagnosticStage =
  | "classification"
  | "food_identity"
  | "portion"
  | "local_recipe_search"
  | "recipe_web_discovery"
  | "ingredient_resolution"
  | "double_counting_guard";

export type DiagnosticEvent = {
  stage: DiagnosticStage;
  status: "ok" | "attention" | "blocked";
  code: string;
  blocking: boolean;
  itemLabel?: string;
  params?: Record<string, string | number>;
};

function itemLabel(item: InterpretResult): string | undefined {
  return item.selectedFood?.name || item.semanticItem?.canonicalName || item.parsed?.foodQuery;
}

function classificationEvent(result: InterpretResult): DiagnosticEvent {
  if (result.aiUnderstandingFailure) {
    return { stage: "classification", status: "attention", code: `ai_failed_${result.aiUnderstandingFailure.code}`, blocking: false };
  }
  if (result.interpretationSource === "ai_assisted") {
    return {
      stage: "classification", status: "ok", code: "ai_understood", blocking: false,
      params: { kind: result.semantic?.kind ?? "single_food", ...(result.semantic?.dishName ? { dish: result.semantic.dishName } : {}) }
    };
  }
  return { stage: "classification", status: "ok", code: "direct_match", blocking: false };
}

function foodIdentityEvent(item: InterpretResult): DiagnosticEvent | null {
  const label = itemLabel(item);
  if (item.nutritionEligible === false && item.excludedBySiblingRecipe) {
    return { stage: "food_identity", status: "ok", code: "excluded_double_counting", blocking: false, itemLabel: label, params: { dish: item.excludedBySiblingRecipe.dishName } };
  }
  if (item.foodResolution === "resolved" && item.selectedFood) {
    return { stage: "food_identity", status: "ok", code: "trusted_match", blocking: false, itemLabel: label };
  }
  if (item.foodResolution === "preview") {
    return { stage: "food_identity", status: "attention", code: "preview_match", blocking: true, itemLabel: label };
  }
  if (item.ambiguous) return { stage: "food_identity", status: "attention", code: "ambiguous", blocking: true, itemLabel: label };
  if (item.preparationUnavailable) return { stage: "food_identity", status: "attention", code: "preparation_unavailable", blocking: true, itemLabel: label };
  if (item.externalCandidates?.length) {
    return { stage: "food_identity", status: "attention", code: `external_${item.externalCandidatesReason ?? "confirmation_required"}`, blocking: true, itemLabel: label, params: { count: item.externalCandidates.length } };
  }
  if (item.foodResolution === "unresolved") return { stage: "food_identity", status: "blocked", code: "unresolved", blocking: true, itemLabel: label };
  if (item.foodResolution === "confirmation_required") return { stage: "food_identity", status: "attention", code: "confirmation_required", blocking: true, itemLabel: label };
  return null;
}

function portionEvent(item: InterpretResult): DiagnosticEvent | null {
  const q = item.quantity;
  const label = itemLabel(item);
  if (!q) return null;
  if (q.status === "resolved" && !q.requiresConfirmation) return null; // exact/authoritative — not worth a line
  if (q.status === "resolved" && q.requiresConfirmation) {
    return { stage: "portion", status: "attention", code: q.estimated ? "estimate_needs_confirmation" : "needs_confirmation", blocking: true, itemLabel: label };
  }
  if (q.reason === "quantity_missing") return { stage: "portion", status: "attention", code: "quantity_missing", blocking: true, itemLabel: label };
  if (q.aiOutcome && q.aiOutcome !== "estimated") {
    return { stage: "portion", status: "blocked", code: `portion_ai_${q.aiOutcome}`, blocking: true, itemLabel: label };
  }
  return { stage: "portion", status: "blocked", code: "conversion_missing", blocking: true, itemLabel: label };
}

function recipeDiscoveryEvents(discovery: NonNullable<InterpretResult["recipeDiscovery"]>, dishLabel: string | undefined): DiagnosticEvent[] {
  const events: DiagnosticEvent[] = [];
  if (discovery.status === "local_match") {
    events.push({ stage: "local_recipe_search", status: "ok", code: "local_match", blocking: false, itemLabel: dishLabel, params: { title: discovery.localMatch!.title } });
    return events;
  }
  events.push({ stage: "local_recipe_search", status: "ok", code: "no_local_match", blocking: false, itemLabel: dishLabel });

  if (discovery.reason === "ambiguous_local_matches") {
    events.push({ stage: "local_recipe_search", status: "attention", code: "ambiguous_local_matches", blocking: true, itemLabel: dishLabel, params: { count: discovery.localAlternatives?.length ?? 0 } });
    return events;
  }

  if (!discovery.searchAttempted) {
    events.push({ stage: "recipe_web_discovery", status: "blocked", code: "web_disabled", blocking: true, itemLabel: dishLabel });
    return events;
  }

  if (discovery.status === "confirmation_required" && discovery.candidate) {
    const c = discovery.candidate;
    events.push({
      stage: "recipe_web_discovery", status: "ok", code: "web_found", blocking: false, itemLabel: dishLabel,
      params: { title: c.title, domain: c.domain, attempted: discovery.candidatesAttempted }
    });
    events.push({
      stage: "ingredient_resolution",
      status: c.recipeState === "fully_resolved" ? "ok" : "attention",
      code: c.recipeState === "fully_resolved" ? "ingredients_fully_resolved" : "ingredients_need_review",
      blocking: c.recipeState !== "fully_resolved",
      itemLabel: dishLabel,
      params: { resolved: c.resolvedIngredientCount, total: c.ingredientCount, unresolved: c.unresolvedIngredientCount, needsReview: c.confirmationRequiredIngredientCount }
    });
    if (c.overlapsWithSiblingItems?.length || c.possibleOverlapWithSiblingItems?.length) {
      events.push({
        stage: "double_counting_guard", status: "ok", code: "sibling_overlap_guarded", blocking: false, itemLabel: dishLabel,
        params: { confirmed: c.overlapsWithSiblingItems?.length ?? 0, possible: c.possibleOverlapWithSiblingItems?.length ?? 0 }
      });
    }
    return events;
  }

  const reasonCode = discovery.reason === "rate_limited" ? "web_rate_limited"
    : discovery.reason === "provider_error" ? "web_provider_error"
    : discovery.reason === "no_relevant_results" ? "web_no_results"
    : discovery.reason === "systemic_error" ? "web_systemic_error"
    : "web_no_fully_resolvable_candidate";
  events.push({ stage: "recipe_web_discovery", status: "blocked", code: reasonCode, blocking: true, itemLabel: dishLabel, params: { searched: discovery.resultCount, attempted: discovery.candidatesAttempted } });
  return events;
}

/**
 * Builds the full timeline for one request's final (already fully resolved,
 * post-recipe-discovery-fallback) InterpretResult. Safe to call on any
 * result shape — single item, multi-item, or compound-dish.
 */
export function buildDiagnostics(result: InterpretResult): DiagnosticEvent[] {
  const events: DiagnosticEvent[] = [classificationEvent(result)];
  const rows = result.items?.length ? result.items : [result];

  for (const row of rows) {
    const identity = foodIdentityEvent(row);
    if (identity) events.push(identity);
    const portion = portionEvent(row);
    if (portion) events.push(portion);
    if (row.recipeDiscovery) events.push(...recipeDiscoveryEvents(row.recipeDiscovery, itemLabel(row)));
  }
  // findEligibleDiscoveryTarget's "result" location (recipe-discovery-
  // fallback.ts) attaches `recipeDiscovery` at the TOP level even when
  // `items` has exactly one entry (the single-item-phrase case) — the loop
  // above only ever sees per-item `recipeDiscovery` (the "item" location, for
  // a multi-item phrase like "csülökpörkölt krumplival"), so a top-level
  // preview none of the rows already carried must still be surfaced here.
  if (result.recipeDiscovery && !rows.some((row) => row.recipeDiscovery)) {
    events.push(...recipeDiscoveryEvents(result.recipeDiscovery, result.semantic?.dishName ?? itemLabel(result)));
  }
  return events;
}
