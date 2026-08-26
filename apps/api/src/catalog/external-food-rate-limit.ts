export const EXTERNAL_FOOD_RATE_LIMIT = Object.freeze({
  windowMs: 15 * 60 * 1000,
  limit: 10
});

export function externalFoodRateLimitKey(request: { user?: { id: string } }) {
  if (!request.user?.id) throw new Error("Authenticated user required before external food rate limiting");
  return request.user.id;
}
