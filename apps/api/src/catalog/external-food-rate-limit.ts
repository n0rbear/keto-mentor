export const EXTERNAL_FOOD_RATE_LIMIT = Object.freeze({
  windowMs: 15 * 60 * 1000,
  limit: 10
});
export const EXTERNAL_FOOD_CONFIRM_RATE_LIMIT = Object.freeze({ windowMs: 15 * 60 * 1000, limit: 10 });
// Owner-beta (2026-09-14): a single real recipe candidate can have 8-15+
// ingredients, each needing its own dynamic-resolution attempt during
// recipe-discovery ingredient review — live-reproduced proof that sharing
// EXTERNAL_FOOD_RATE_LIMIT's 10-per-15-minutes budget (sized for ordinary
// per-meal dynamic lookups) with that burst exhausts it partway through a
// SINGLE recipe, so later ingredients fail with reason="rate_limited" no
// matter how resolvable they actually are — not a real resolution failure,
// a starved budget. A separate, more generous per-user window for this one
// bounded use (recipe-discovery is itself capped to <=3 candidate attempts
// per phrase, never repeated automatically) keeps the ORIGINAL per-meal
// limiter's abuse protection completely untouched.
export const RECIPE_INGREDIENT_DYNAMIC_RATE_LIMIT = Object.freeze({
  windowMs: 15 * 60 * 1000,
  limit: 60
});

export function externalFoodRateLimitKey(request: { user?: { id: string } }) {
  if (!request.user?.id) throw new Error("Authenticated user required before external food rate limiting");
  return request.user.id;
}
