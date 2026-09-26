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
  | "double_counting_guard"
  // Decision-transparency audit (2026-09-19) — real live "túrós muffin"
  // finding: every downstream resolution failure (local miss, web-evidence
  // miss, AI-estimation failure) was previously collapsed into a SINGLE
  // "food_identity: unresolved" line, under the generic ÉTELAZONOSÍTÁS
  // heading — even though identity itself was never in question (the AI
  // correctly understood "túrós muffin" as one food; what failed was
  // downstream: finding TRUSTED DATA for it). These two stages exist
  // specifically so the panel can attribute a failure to the actual step
  // that produced it, under its own, distinct human heading.
  | "web_evidence"
  | "ai_estimation";

export type DiagnosticEvent = {
  stage: DiagnosticStage;
  status: "ok" | "attention" | "blocked";
  code: string;
  blocking: boolean;
  itemLabel?: string;
  params?: Record<string, string | number>;
};

// Routing/localization audit (2026-09-19): every OTHER food-name display
// surface (search results, meal diary, recipe ingredients, candidate lists)
// already goes through the client-side pickDisplayName -> `names[locale]`
// fallback chain (see apps/web/src/food-display-name.ts) — this was the one
// remaining raw, English-only name in the app, because the diagnostics
// timeline is built server-side and DiagnosticEvent.itemLabel is already a
// plain string by the time it reaches the client (no full Food object to
// re-localize there). Mirrors the exact same fallback chain so a Hungarian
// user sees "Gouda sajt: ..." instead of "Gouda cheese: ...".
function pickName(food: { name: string; originalName?: string; names?: Record<string, string> } | null | undefined, locale?: string): string | undefined {
  if (!food) return undefined;
  return (locale ? food.names?.[locale] : undefined) ?? food.names?.en ?? food.originalName ?? food.name;
}

function itemLabel(item: InterpretResult, locale?: string): string | undefined {
  return pickName(item.selectedFood, locale) || item.semanticItem?.canonicalName || item.parsed?.foodQuery;
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

function foodIdentityEvent(item: InterpretResult, locale?: string): DiagnosticEvent | null {
  const label = itemLabel(item, locale);
  if (item.nutritionEligible === false && item.excludedBySiblingRecipe) {
    return { stage: "food_identity", status: "ok", code: "excluded_double_counting", blocking: false, itemLabel: label, params: { dish: item.excludedBySiblingRecipe.dishName } };
  }
  if (item.foodResolution === "resolved" && item.selectedFood) {
    return { stage: "food_identity", status: "ok", code: "trusted_match", blocking: false, itemLabel: label };
  }
  // Decision-transparency audit (2026-09-19): the candidate NAMES were
  // already computed and already sitting on `item.candidates` (the frontend
  // has rendered them as a selectable list since the candidate-selection UX
  // fix) — but the "Mi történt?" trace never named them, only ever said
  // "several similarly good matches exist" with no names attached. Pure
  // plumbing: no new query, no new AI/external call, just carrying an
  // already-known value one step further. Bounded to 5 names so a
  // pathological local match burst can never produce an unbounded string.
  const candidateNames = item.candidates?.length ? item.candidates.slice(0, 5).map((c) => pickName(c, locale)).join(", ") : undefined;
  if (item.foodResolution === "preview") {
    return { stage: "food_identity", status: "attention", code: "preview_match", blocking: true, itemLabel: label, ...(candidateNames ? { params: { names: candidateNames } } : {}) };
  }
  if (item.ambiguous) return { stage: "food_identity", status: "attention", code: "ambiguous", blocking: true, itemLabel: label, ...(candidateNames ? { params: { count: item.candidates!.length, names: candidateNames } } : {}) };
  if (item.preparationUnavailable) return { stage: "food_identity", status: "attention", code: "preparation_unavailable", blocking: true, itemLabel: label };
  if (item.externalCandidates?.length) {
    return { stage: "food_identity", status: "attention", code: `external_${item.externalCandidatesReason ?? "confirmation_required"}`, blocking: true, itemLabel: label, params: { count: item.externalCandidates.length } };
  }
  if (item.foodResolution === "unresolved") return { stage: "food_identity", status: "blocked", code: "unresolved", blocking: true, itemLabel: label };
  if (item.foodResolution === "confirmation_required") {
    return { stage: "food_identity", status: "attention", code: "confirmation_required", blocking: true, itemLabel: label, ...(candidateNames ? { params: { names: candidateNames } } : {}) };
  }
  return null;
}

// Decision-transparency audit (2026-09-19): turns the always-safe
// InterpretResult.decisionTrace (see its own doc in dynamic-food-
// resolution.ts) into distinct, correctly-attributed events. Both fields are
// independently optional — `undefined` means that tier was never even
// reached for this item (e.g. a local match already won, or the fallback
// chain stopped at web-evidence before AI-estimation could run), which must
// never be rendered as if it had been tried and failed. Real live case that
// motivated this: "túrós muffin" reaching the dynamic-resolution chain,
// web-evidence being refused by ITS OWN rate limiter, and AI-estimation
// separately being refused by ITS OWN rate limiter — two DIFFERENT internal
// budgets, previously both invisible, both collapsed into one flat
// "unresolved" line.
function decisionTraceEvents(item: InterpretResult, locale?: string): DiagnosticEvent[] {
  const trace = item.decisionTrace;
  if (!trace) return [];
  const label = itemLabel(item, locale);
  const events: DiagnosticEvent[] = [];
  switch (trace.webEvidenceOutcome) {
    case "rate_limited":
      events.push({ stage: "web_evidence", status: "blocked", code: "web_evidence_rate_limited", blocking: true, itemLabel: label });
      break;
    case "search_failed":
      events.push({ stage: "web_evidence", status: "blocked", code: "web_evidence_search_failed", blocking: true, itemLabel: label });
      break;
    case "no_authoritative_source":
      events.push({ stage: "web_evidence", status: "attention", code: "web_evidence_no_authoritative_source", blocking: true, itemLabel: label });
      break;
    case "nutrition_missing":
      events.push({ stage: "web_evidence", status: "attention", code: "web_evidence_nutrition_missing", blocking: true, itemLabel: label });
      break;
    case "identity_mismatch":
      events.push({ stage: "web_evidence", status: "attention", code: "web_evidence_identity_mismatch", blocking: true, itemLabel: label });
      break;
    // "not_configured" (this deployment has no web-search provider wired at
    // all) and "success" (would only ever appear on a "resolved" outcome,
    // never reachable from an unresolved/ai_estimate_pending item) are
    // deliberately silent — neither is a meaningful "we tried and X
    // happened" line for THIS item.
  }
  switch (trace.aiEstimationOutcome) {
    case "internal_rate_limited":
      events.push({ stage: "ai_estimation", status: "blocked", code: "ai_estimation_internal_rate_limited", blocking: true, itemLabel: label });
      break;
    case "provider_rate_limited":
      events.push({ stage: "ai_estimation", status: "blocked", code: "ai_estimation_provider_rate_limited", blocking: true, itemLabel: label });
      break;
    case "timeout":
      events.push({ stage: "ai_estimation", status: "blocked", code: "ai_estimation_timeout", blocking: true, itemLabel: label });
      break;
    case "provider_error":
      events.push({ stage: "ai_estimation", status: "blocked", code: "ai_estimation_provider_error", blocking: true, itemLabel: label });
      break;
    case "invalid_response":
      events.push({ stage: "ai_estimation", status: "blocked", code: "ai_estimation_invalid_response", blocking: true, itemLabel: label });
      break;
    case "structurally_implausible":
      events.push({ stage: "ai_estimation", status: "attention", code: "ai_estimation_implausible", blocking: true, itemLabel: label });
      break;
    case "success":
      events.push({ stage: "ai_estimation", status: "ok", code: "ai_estimation_success", blocking: false, itemLabel: label });
      break;
  }
  return events;
}

function portionEvent(item: InterpretResult, locale?: string): DiagnosticEvent | null {
  const q = item.quantity;
  const label = itemLabel(item, locale);
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
    events.push({ stage: "local_recipe_search", status: "ok", code: "local_match", blocking: false, itemLabel: dishLabel, params: { title: discovery.localMatch!.title, source: discovery.localMatch!.source } });
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
    // Decision-transparency audit (2026-09-19, Task 7): the actual
    // unresolved/needs-review ingredient NAMES were already sitting on
    // `c.ingredients` (RecipeIngredientReview[], each with its own `name` +
    // `status`) — never shown before, only the aggregate counts. Bounded to
    // 5 and only ever built from names the backend already resolved for
    // THIS recipe; never invented when the field is absent.
    const unresolvedNames = c.ingredients?.filter((ing) => ing.status !== "resolved").slice(0, 5).map((ing) => ing.parsedFoodQuery).join(", ");
    events.push({
      stage: "ingredient_resolution",
      status: c.recipeState === "fully_resolved" ? "ok" : "attention",
      code: c.recipeState === "fully_resolved" ? "ingredients_fully_resolved" : "ingredients_need_review",
      blocking: c.recipeState !== "fully_resolved",
      itemLabel: dishLabel,
      params: { resolved: c.resolvedIngredientCount, total: c.ingredientCount, unresolved: c.unresolvedIngredientCount, needsReview: c.confirmationRequiredIngredientCount, ...(unresolvedNames ? { names: unresolvedNames } : {}) }
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
export function buildDiagnostics(result: InterpretResult, locale?: string): DiagnosticEvent[] {
  const events: DiagnosticEvent[] = [classificationEvent(result)];
  const rows = result.items?.length ? result.items : [result];

  for (const row of rows) {
    const identity = foodIdentityEvent(row, locale);
    if (identity) events.push(identity);
    events.push(...decisionTraceEvents(row, locale));
    const portion = portionEvent(row, locale);
    if (portion) events.push(portion);
    if (row.recipeDiscovery) events.push(...recipeDiscoveryEvents(row.recipeDiscovery, itemLabel(row, locale)));
  }
  // findEligibleDiscoveryTarget's "result" location (recipe-discovery-
  // fallback.ts) attaches `recipeDiscovery` at the TOP level even when
  // `items` has exactly one entry (the single-item-phrase case) — the loop
  // above only ever sees per-item `recipeDiscovery` (the "item" location, for
  // a multi-item phrase like "csülökpörkölt krumplival"), so a top-level
  // preview none of the rows already carried must still be surfaced here.
  if (result.recipeDiscovery && !rows.some((row) => row.recipeDiscovery)) {
    events.push(...recipeDiscoveryEvents(result.recipeDiscovery, result.semantic?.dishName ?? itemLabel(result, locale)));
  }
  return events;
}
