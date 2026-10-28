import { z } from "zod";

export const locales = ["hu", "de", "en"] as const;
export type Locale = (typeof locales)[number];

// Meal type (owner decision 2026-10-15): every logged meal says which meal it
// is. Suggested from the time of day, always changeable; "custom" carries the
// user's own name in mealTypeLabel. Legacy meals have none (null).
export const mealTypes = ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "snack", "custom"] as const;
export type MealType = (typeof mealTypes)[number];
export const mealTypeLabelSchema = z.string().trim().min(1).max(40);
const customNeedsLabel = (value: { mealType?: MealType; mealTypeLabel?: string }, context: z.RefinementCtx) => {
  if (value.mealType === "custom" && !value.mealTypeLabel) context.addIssue({ code: z.ZodIssueCode.custom, path: ["mealTypeLabel"], message: "custom_meal_type_needs_label" });
};

// E-mail (owner decision 2026-10-15, tester release): required for new
// accounts so a forgotten password can be reset by e-mail; login accepts the
// username or the e-mail address in the same field.
export const emailSchema = z.string().trim().toLowerCase().email().max(254);

export const registerSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_.-]+$/),
  email: emailSchema,
  password: z.string().min(10).max(200),
  locale: z.enum(locales).default("hu"),
  // Explicit consent to health data (GDPR Art. 9); the route refuses false or missing.
  healthConsent: z.boolean().optional()
});

export const loginSchema = z.object({
  username: z.string().trim().min(3).max(254),
  password: z.string().min(1).max(200),
  // "Bejelentkezve maradok" (2026-10-16): false ends the session when the browser closes.
  remember: z.boolean().optional()
});

export const passwordResetRequestSchema = z.object({ email: emailSchema, locale: z.enum(locales).optional() });
export const passwordChangeSchema = z.object({ currentPassword: z.string().min(1).max(200), newPassword: z.string().min(10).max(200) }).strict();
export const passwordResetConfirmSchema = z.object({ token: z.string().min(20).max(200), password: z.string().min(10).max(200) });
// Existing username-only accounts attach an e-mail; the current password
// proves it is the owner of the account, not someone at an unlocked screen.
export const emailUpdateSchema = z.object({ email: emailSchema, currentPassword: z.string().min(1).max(200) });
// Account deletion (GDPR erasure) is confirmed with the current password.
export const accountDeletionSchema = z.object({ currentPassword: z.string().min(1).max(200) });

// A standalone endpoint for changing just the UI language after onboarding —
// onboardingSchema's `locale` field only ever fires once (it always also
// marks onboardingDone), so an already-onboarded user switching languages
// needs a lightweight, dedicated way to persist that without resubmitting
// their whole profile.
export const localeUpdateSchema = z.object({ locale: z.enum(locales) }).strict();

export const onboardingSchema = z.object({
  locale: z.enum(locales),
  goal: z.enum(["weight_loss", "maintenance", "energy", "medical_support", "learning"]),
  dailyKcal: z.number().int().min(900).max(5000),
  dailyNetCarbs: z.number().int().min(5).max(100),
  dailyProtein: z.number().int().min(40).max(300),
  dailyFat: z.number().int().min(30).max(350),
  dailyFiber: z.number().int().min(0).max(80),
  preferences: z.array(z.string().min(1).max(60)).max(20),
  avoidedFoods: z.array(z.string().min(1).max(80)).max(40),
  allergies: z.array(z.string().min(1).max(80)).max(40)
});

const safeRecipeSourceUrlSchema = z.string().trim().url().max(2_000).superRefine((value, context) => {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) context.addIssue({ code: "custom", message: "sourceUrl must be an HTTP(S) URL without credentials" });
});

// Owner-beta (2026-09-15) — final PR review: createMealSchema's items union
// (catalog / manual / recipe-discovery) is tried in DECLARATION ORDER by
// Zod, and a NON-strict object silently STRIPS unrecognized keys rather
// than rejecting them. A payload that happened to satisfy catalog's own
// required fields (foodId + quantity + unit) matched here FIRST even when
// it ALSO carried sourceUrl/importProof/extractionMethod — those got
// silently dropped and the request was reinterpreted as an ordinary catalog
// item instead of failing loudly. Not a nutrition-forgery vector (a catalog
// item's own macros always come from the real Food row regardless), but a
// real fail-OPEN schema-discrimination gap: strict() here (matching
// recipeMealSchema's existing documented reasoning below) makes such a
// mixed-shape payload fail ALL THREE union members and get rejected
// outright, rather than being silently, unpredictably reinterpreted.
export const manualMealItemSchema = z.object({
  foodName: z.string().trim().min(2).max(120),
  quantityGrams: z.number().positive().max(5000),
  kcalPer100g: z.number().nonnegative().max(1000),
  fatPer100g: z.number().nonnegative().max(200),
  proteinPer100g: z.number().nonnegative().max(200),
  carbsPer100g: z.number().nonnegative().max(200),
  fiberPer100g: z.number().nonnegative().max(100).default(0),
  source: z.enum(["open_database", "open_food_facts", "manufacturer", "barcode", "user_input", "ai_ocr"]).default("user_input")
}).strict();

export const catalogMealItemSchema = z.object({
  foodId: z.string().min(1),
  quantity: z.number().positive().max(5000),
  unit: z.enum(["g", "kg", "serving"]).default("g"),
  servingId: z.string().min(1).optional(),
  gramsOverride: z.number().positive().max(50_000).optional(),
  quantityConfirmation: z.object({
    method: z.enum(["estimated", "ai_estimated", "user_corrected"]),
    accepted: z.literal(true),
    grams: z.number().finite().positive().max(5000)
  }).strict().optional()
}).strict().superRefine((item, context) => {
  if (item.quantityConfirmation && (item.unit !== "g" || item.quantity !== item.quantityConfirmation.grams)) context.addIssue({ code: "custom", message: "confirmed_grams_mismatch" });
  if (item.unit === "serving" && !item.servingId) context.addIssue({ code: "custom", path: ["servingId"], message: "servingId is required" });
  if (item.unit !== "serving" && (item.servingId || item.gramsOverride)) context.addIssue({ code: "custom", path: ["unit"], message: "serving fields require serving unit" });
});

// Owner-beta (2026-09-14) — recipe-confirm checkpoint: confirms a
// server-previewed web recipe candidate (see meal-input/recipe-discovery-
// fallback.ts) as part of a real meal. Deliberately carries NO ingredient
// list, Food IDs, or nutrition — the server re-derives the trusted
// ingredient set from `sourceUrl` itself (never trusts what the client
// echoes back), the same source-of-truth `previewRecipeImport` already
// uses. `importProof`/`extractionMethod` mirror recipeInputSchema's own
// existing trusted-import contract (see recipes/import-proof.ts) — proves
// the authenticated user legitimately went through discovery/preview for
// this exact URL, nothing more. `quantity`/`unit` mirror recipeMealSchema's
// existing portion contract exactly (addRecipeToMeal).
// Manual fixes for recipe ingredients that blocked a discovered recipe
// (owner request, 2026-09-25). Applied by the server to its OWN re-derived
// ingredient list, by index; never trusted as nutrition data. A chosen food
// must be a catalog food or the user's own (checked server-side).
export const recipeIngredientOverrideSchema = z.discriminatedUnion("action", [
  z.object({ ingredientIndex: z.number().int().min(0).max(99), action: z.literal("exclude") }).strict(),
  z.object({ ingredientIndex: z.number().int().min(0).max(99), action: z.literal("grams"), grams: z.number().positive().max(5000) }).strict(),
  z.object({ ingredientIndex: z.number().int().min(0).max(99), action: z.literal("food"), foodId: z.string().trim().min(1).max(64), grams: z.number().positive().max(5000).optional() }).strict()
]);

export const recipeDiscoveryMealItemSchema = z.object({
  sourceUrl: safeRecipeSourceUrlSchema,
  importProof: z.string().max(4_000),
  extractionMethod: z.enum(["schema_org_json_ld", "ai_structured"]),
  quantity: z.number().positive().max(5000),
  unit: z.enum(["g", "serving"]),
  ingredientOverrides: z.array(recipeIngredientOverrideSchema).max(100).optional()
}).strict();

// FINAL FALLBACK: AI-ESTIMATED NUTRITION (2026-09-16) — accepts a
// server-generated AI nutrition estimate as part of a real meal. Deliberately
// mirrors recipeDiscoveryMealItemSchema's trust model, not manualMealItemSchema's:
// the client echoes back the exact identity/numbers POST /meal-input/interpret
// returned, plus the signed `aiEstimateProof` that was minted alongside them
// (see catalog/ai-estimate-proof.ts) — the server re-verifies every one of
// those numbers against the proof before ever persisting anything, so a
// client cannot submit self-chosen numbers mislabeled as "this is what the
// AI said". `quantityGrams` is the only field never covered by the proof
// (echoing recipeDiscoveryMealItemSchema's own quantity/unit being separate
// from its identity proof), since accepting an estimate at a different
// portion size than shown is legitimate.
export const aiEstimateMealItemSchema = z.object({
  aiEstimateProof: z.string().max(4_000),
  requestedIdentity: z.string().trim().min(1).max(200),
  canonicalFoodName: z.string().trim().min(1).max(200),
  kcalPer100g: z.number().min(0).max(1_000),
  proteinPer100g: z.number().min(0).max(200),
  fatPer100g: z.number().min(0).max(200),
  carbsPer100g: z.number().min(0).max(200),
  fiberPer100g: z.number().min(0).max(100),
  quantityGrams: z.number().positive().max(5000)
}).strict();

export const createMealSchema = z.object({
  title: z.string().trim().min(2).max(100),
  mealType: z.enum(mealTypes),
  mealTypeLabel: mealTypeLabelSchema.optional(),
  eatenAt: z.string().datetime().optional(),
  items: z.array(z.union([catalogMealItemSchema, manualMealItemSchema, recipeDiscoveryMealItemSchema, aiEstimateMealItemSchema])).min(1).max(20)
}).superRefine(customNeedsLabel);

// Part P (2026-09-16): correcting a PRIVATE Food's own macros by hand — only
// ever valid for a Food this user owns (createdById) and whose source is
// itself non-authoritative (ai_estimated or user_input; see PATCH /foods/:id
// in server.ts, which also enforces this server-side, never trusting a
// client-supplied source/ownership check). Editing an ai_estimated Food
// transitions its source to user_input — it must never keep reading as "the
// AI's estimate" once a human has corrected it.
export const editPrivateFoodSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  kcalPer100g: z.number().min(0).max(1_000),
  proteinPer100g: z.number().min(0).max(200),
  fatPer100g: z.number().min(0).max(200),
  carbsPer100g: z.number().min(0).max(200),
  fiberPer100g: z.number().min(0).max(100)
}).strict();

// Editing an existing meal never re-specifies food/recipe identity or nutrition —
// only the trusted existing MealItem may have its grams corrected or be removed.
// `items`/`removeItemIds` reference existing MealItem ids explicitly; omitting an
// id from `items` never implies removal (that is only ever removeItemIds), so a
// client can safely correct one item's grams without risking dropping the rest.
export const editMealItemSchema = z.object({
  mealItemId: z.string().min(1),
  quantityGrams: z.number().finite().positive().max(50_000)
}).strict();

export const editMealSchema = z.object({
  title: z.string().trim().min(2).max(100).optional(),
  mealType: z.enum(mealTypes).optional(),
  mealTypeLabel: mealTypeLabelSchema.optional(),
  eatenAt: z.string().datetime().optional(),
  items: z.array(editMealItemSchema).max(20).optional(),
  removeItemIds: z.array(z.string().min(1)).max(20).optional()
}).strict().superRefine((value, context) => {
  customNeedsLabel(value, context);
  if (value.title === undefined && value.mealType === undefined && value.eatenAt === undefined && !value.items?.length && !value.removeItemIds?.length) {
    context.addIssue({ code: "custom", message: "no_changes_provided" });
  }
  if (value.items) {
    const ids = value.items.map((item) => item.mealItemId);
    if (new Set(ids).size !== ids.length) context.addIssue({ code: "custom", path: ["items"], message: "duplicate_meal_item_id" });
  }
  if (value.removeItemIds) {
    if (new Set(value.removeItemIds).size !== value.removeItemIds.length) context.addIssue({ code: "custom", path: ["removeItemIds"], message: "duplicate_remove_id" });
  }
  if (value.items && value.removeItemIds) {
    const removeSet = new Set(value.removeItemIds);
    if (value.items.some((item) => removeSet.has(item.mealItemId))) context.addIssue({ code: "custom", message: "conflicting_item_action" });
  }
});
export type EditMealInput = z.infer<typeof editMealSchema>;

// Repeat carries no client-authored content at all — the server loads the
// trusted source meal itself, so any field here (identity, quantity,
// nutrition, another userId) would only ever be a forgery attempt.
// The only choice a repeat takes is which meal it is now (optional: the source
// meal's type is kept when absent).
export const repeatMealSchema = z.object({ mealType: z.enum(mealTypes).optional(), mealTypeLabel: mealTypeLabelSchema.optional() }).strict().superRefine(customNeedsLabel);

export const mealInterpretationSchema = z.object({
  text: z.string().trim().min(2).max(300),
  // Client-generated correlator for the optional GET /meal-input/progress/:operationId
  // stream (see meal-input/progress-bus.ts) — never persisted, never used for
  // authorization, purely a same-request event-stream key.
  operationId: z.string().min(1).max(64).regex(/^[A-Za-z0-9-]+$/).optional()
}).strict();

export type QuantityClarification = {
  type: "quantity_missing" | "estimate_confirmation" | "grams_required";
  itemIndex: number;
  suggestedGrams?: number;
  rangeGrams?: { min: number; max: number };
  confidence?: number;
  method?: "estimated" | "ai_estimated";
  allowCustomGrams: boolean;
  // "volume": a container/hand portion (plate, bowl, handful, ...) reasoned
  // through a physical volume/density model — worth a short user-facing
  // explanation of what the estimate is based on. "geometry": a count/size
  // unit (piece, slice, cm, ...) using the existing direct estimator.
  basis?: "volume" | "geometry";
};

export const foodUnderstandingLanguageSchema = z.enum(["hu", "de", "en", "unknown"]);
export const foodUnderstandingKindSchema = z.enum(["single_food", "multiple_foods", "compound_dish"]);
export const foodUnderstandingUnitSchema = z.enum([
  "g", "kg", "piece", "slice", "portion", "plate", "bowl", "ladle",
  "tbsp", "tsp", "cup", "handful", "half", "quarter", "cm", "ml", "l", "unknown"
]);
export const foodUnderstandingItemSchema = z.object({
  originalText: z.string().trim().min(1).max(160),
  canonicalName: z.string().trim().min(1).max(120),
  // Owner-beta (2026-09-13): proven root cause of a compound-dish phrase
  // with no PER-ITEM quantity ("egy tányér csülökpörkölt krumplival" — only
  // the whole plate has a quantity, not each named item) silently failing
  // food-understanding entirely. The AI's answer was semantically correct
  // (compound_dish, dishName="csülökpörkölt", both items present) but Groq
  // represents "no value for this optional field" as an explicit JSON
  // `null`, which `.optional()` alone (undefined-only) rejects — the whole
  // response then fails schema validation, is discarded as invalid_response,
  // and the phrase falls back to a flat unresolved result with no semantic
  // structure at all, silently skipping local-recipe lookup and web recipe
  // discovery. `.nullable()` widens the accepted INPUT; the `.transform`
  // keeps the INFERRED type exactly `number | undefined` as before, so every
  // existing consumer (which already treats missing quantity via `!= null`
  // checks) needs no change at all.
  quantity: z.number().finite().positive().max(10_000).nullable().optional().transform((value) => value ?? undefined),
  unit: foodUnderstandingUnitSchema.optional(),
  size: z.enum(["small", "medium", "large"]).optional(),
  preparation: z.string().trim().min(1).max(60).optional(),
  modifiers: z.array(z.string().trim().min(1).max(80)).max(12).optional(),
  excludedModifiers: z.array(z.string().trim().min(1).max(80)).max(12).optional(),
  evidence: z.enum(["explicit", "inferred_common"]),
  confidence: z.number().finite().min(0).max(1)
}).strict();
export const foodUnderstandingSchema = z.object({
  language: foodUnderstandingLanguageSchema,
  kind: foodUnderstandingKindSchema,
  dishName: z.string().trim().min(1).max(120).optional(),
  dishQuantity: z.number().finite().positive().max(10_000).optional(),
  dishUnit: foodUnderstandingUnitSchema.optional(),
  // True only when the user explicitly stated that dishName's FULL
  // composition is the following item list (cues like "consisting of" /
  // "made from" / "a következőkből" / "bestehend aus") — in that case
  // dishName is a group LABEL, not an additional food, and must never be
  // counted again as a separate item alongside its own listed ingredients.
  // Absent/false is the safe default: dishName may still need its own
  // separate resolution (e.g. a named dish mentioned alongside extra
  // add-ons, not defined by them).
  dishIsComposition: z.boolean().optional(),
  // Owner-beta (2026-09-13): proven root cause of a second silent
  // total-classification-loss mode, for phrases whose dish name doesn't
  // naturally decompose into named items ("rakott krumpli" — a single
  // casserole, not "rakott" + "krumpli"). Groq correctly classifies these as
  // compound_dish with a real dishName, but returns items: [] rather than
  // inventing a component list — which `.min(1)` rejected outright, losing
  // the whole (otherwise valid) classification to invalid_response, exactly
  // like the sibling `quantity: null` case above. `.min(0)` here, paired with
  // the superRefine rule below that still requires >=1 item for every OTHER
  // kind, accepts this one well-formed shape without loosening validation
  // for single_food/multi_item, where an empty items array is never
  // meaningful. interpretAiUnderstanding's existing synthesis (dishNormalized/
  // hasDishItem, unchanged) already turns a dishName with zero matching items
  // into exactly one item named after the dish — this schema change is the
  // only thing needed for that path to ever be reached.
  items: z.array(foodUnderstandingItemSchema).min(0).max(12),
  clarificationNeeded: z.boolean(),
  clarificationReason: z.string().trim().min(1).max(240).optional(),
  confidence: z.number().finite().min(0).max(1)
}).strict().superRefine((value, context) => {
  if (value.kind === "compound_dish" && !value.dishName) {
    context.addIssue({ code: "custom", path: ["dishName"], message: "dishName is required for compound dishes" });
  }
  if (value.kind !== "compound_dish" && value.items.length === 0) {
    context.addIssue({ code: "too_small", minimum: 1, type: "array", inclusive: true, path: ["items"], message: "items must contain at least 1 element for a non-compound-dish classification" });
  }
  if (value.clarificationNeeded && !value.clarificationReason) {
    context.addIssue({ code: "custom", path: ["clarificationReason"], message: "clarificationReason is required" });
  }
});

export type FoodUnderstanding = z.infer<typeof foodUnderstandingSchema>;
export type FoodUnderstandingItem = z.infer<typeof foodUnderstandingItemSchema>;

export const recipeVisibilitySchema = z.enum(["private", "public", "unlisted"]);
export const recipeIngredientRoleSchema = z.enum(["core", "seasoning", "garnish", "serving_accompaniment"]);
// Not .strict(): recipeInputSchema.parse() is deliberately used to sanitize a
// browser-reconstructed object (e.g. import-preview rows merged with manual
// edits) that may still carry extra fields like a forged kcalPer100g — those
// must be silently dropped, not turned into a hard validation failure. See
// service.test.ts "strips browser-supplied macros...".
export const recipeIngredientSchema = z.object({
  foodId: z.string().min(1),
  quantityGrams: z.number().positive().max(50_000),
  originalText: z.string().trim().max(300).optional(),
  preparation: z.string().trim().max(200).optional(),
  sourceGroup: z.string().trim().max(160).optional(),
  role: recipeIngredientRoleSchema.default("core"),
  optional: z.boolean().default(false),
  includedInBaseNutrition: z.boolean().default(true),
  roleProvenance: z.record(z.unknown()).optional(),
  sortOrder: z.number().int().min(0).max(100).optional()
});
export const recipeInputSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2_000).optional(),
  instructions: z.array(z.string().trim().min(1).max(1_000)).max(100).default([]),
  servings: z.number().positive().max(1000).optional(),
  finishedWeightGrams: z.number().positive().max(100_000).optional(),
  visibility: recipeVisibilitySchema.default("private"),
  sourceType: z.enum(["manual", "schema_org", "ai_structured"]).default("manual"),
  sourceUrl: safeRecipeSourceUrlSchema.optional(),
  importProof: z.string().max(4_000).optional(),
  // How the dish is eaten ("Mély tányérban eszem", 2026-10-12). Stored as
  // provenance.servedIn, which the plate-portion logic reads. Omitted on an
  // update = keep the current value.
  servedIn: z.enum(["flat_plate", "deep_plate"]).optional(),
  ingredients: z.array(recipeIngredientSchema).min(1).max(50)
});
// recipeMealSchema carries no legitimate extra fields (unlike recipeInputSchema
// above) — it is parsed straight from req.body for the trusted add-to-meal
// endpoint, so unknown fields (e.g. a forged nutrition value) are rejected
// outright rather than silently stripped.
export const recipeMealSchema = z.object({
  title: z.string().trim().min(2).max(100).optional(),
  mealType: z.enum(mealTypes),
  mealTypeLabel: mealTypeLabelSchema.optional(),
  quantity: z.number().positive().max(5000),
  unit: z.enum(["g", "serving"])
}).strict().superRefine(customNeedsLabel);
export const recipeListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional()
});
export const recipeImportPreviewSchema = z.object({
  url: safeRecipeSourceUrlSchema
}).strict();
export type RecipeInput = z.infer<typeof recipeInputSchema>;
export type RecipeMealInput = z.infer<typeof recipeMealSchema>;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type LocaleUpdateInput = z.infer<typeof localeUpdateSchema>;
export type CreateMealInput = z.infer<typeof createMealSchema>;
export type EditPrivateFoodInput = z.infer<typeof editPrivateFoodSchema>;
export type RecipeDiscoveryMealItemInput = z.infer<typeof recipeDiscoveryMealItemSchema>;
export type RecipeIngredientOverride = z.infer<typeof recipeIngredientOverrideSchema>;

// Rugalmas célok (premium, 2026-10-16): optional per-weekday overrides of the
// daily targets, e.g. carb cycling. A missing day or field keeps the base goal.
export const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];
export const dayGoalSchema = z.object({
  kcal: z.number().int().min(800).max(6000).optional(),
  netCarbs: z.number().int().min(0).max(300).optional(),
  protein: z.number().int().min(0).max(400).optional(),
  fat: z.number().int().min(0).max(400).optional()
}).strict();
export const weekdayGoalsSchema = z.object({
  mon: dayGoalSchema.optional(), tue: dayGoalSchema.optional(), wed: dayGoalSchema.optional(), thu: dayGoalSchema.optional(),
  fri: dayGoalSchema.optional(), sat: dayGoalSchema.optional(), sun: dayGoalSchema.optional()
}).strict();
export type WeekdayGoals = z.infer<typeof weekdayGoalsSchema>;
export type BaseGoals = { dailyKcal: number; dailyProtein: number; dailyNetCarbs: number; dailyFat: number; dailyFiber: number };

/** The targets for one calendar day (YYYY-MM-DD): the base goals with that weekday's overrides. */
export function effectiveGoals(profile: Partial<BaseGoals> & { weekdayGoals?: unknown } | null | undefined, date: string): BaseGoals {
  const base: BaseGoals = { dailyKcal: profile?.dailyKcal ?? 1800, dailyProtein: profile?.dailyProtein ?? 110, dailyNetCarbs: profile?.dailyNetCarbs ?? 25, dailyFat: profile?.dailyFat ?? 130, dailyFiber: profile?.dailyFiber ?? 25 };
  const parsed = weekdayGoalsSchema.safeParse(profile?.weekdayGoals ?? {});
  if (!parsed.success) return base;
  const day = parsed.data[WEEKDAY_KEYS[(new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7]];
  if (!day) return base;
  return { ...base, dailyKcal: day.kcal ?? base.dailyKcal, dailyProtein: day.protein ?? base.dailyProtein, dailyNetCarbs: day.netCarbs ?? base.dailyNetCarbs, dailyFat: day.fat ?? base.dailyFat };
}

// "Nézz be a hűtőbe" (owner idea 02261c, 2026-10-20): what the user has at
// home, ticked in the dinner ideas. Terms are matched against normalized
// ingredient names (hu/de/en, accents removed): a plain term must start a
// word, a "*term" may sit inside a compound word ("kígyóuborka"), a "=term"
// must be the whole word ("ei", not "Eisbergsalat").
export const fridgeItems = [
  { key: "egg", hu: "Tojás", de: "Eier", en: "Eggs", terms: ["tojas", "=ei", "eier", "huhnerei", "egg", "eggs", "*tojas"] },
  { key: "ham", hu: "Sonka, felvágott", de: "Schinken, Aufschnitt", en: "Ham, cold cuts", terms: ["*sonka", "felvagott", "parizsi", "mortadella", "*schinken", "aufschnitt", "fleischwurst", "jagdwurst", "ham", "bologna", "husalata", "fleischsalat"] },
  { key: "salami", hu: "Szalámi, kolbász", de: "Salami, Wurst", en: "Salami, sausage", terms: ["*szalami", "*kolbasz", "debreceni", "salami", "*wurst", "sausage", "chorizo"] },
  { key: "frankfurter", hu: "Virsli", de: "Würstchen", en: "Frankfurters", terms: ["virsli", "wurstchen", "frankfurter", "wiener", "frankfurt"] },
  { key: "bacon", hu: "Szalonna, bacon", de: "Speck", en: "Bacon", terms: ["*szalonna", "bacon", "speck", "*speck"] },
  { key: "chicken", hu: "Csirke, pulyka", de: "Hähnchen, Pute", en: "Chicken, turkey", terms: ["*csirke", "*pulyka", "*hahnchen", "huhn", "*pute", "chicken", "turkey", "broiler", "*tyuk", "kacsa", "liba", "ente", "gans", "duck", "goose"] },
  { key: "pork", hu: "Sertéshús", de: "Schweinefleisch", en: "Pork", terms: ["*sertes", "karaj", "tarja", "*schwein", "pork", "birka", "barany", "vaddisznohus", "vadhus", "lamm", "wild", "lamb", "mutton"] },
  { key: "beef", hu: "Marhahús", de: "Rindfleisch", en: "Beef", terms: ["*marha", "*rind", "beef", "roastbeef", "borju", "kalb", "veal"] },
  { key: "minced", hu: "Darált hús", de: "Hackfleisch", en: "Minced meat", terms: ["daralt", "*hackfleisch", "ground", "minced"] },
  { key: "fish", hu: "Hal, tonhal", de: "Fisch, Thunfisch", en: "Fish, tuna", terms: ["hal", "tonhal", "lazac", "makrela", "pisztrang", "szardinia", "hering", "harcsa", "ponty", "fisch", "*thunfisch", "lachs", "makrele", "forelle", "sardine", "fish", "tuna", "salmon", "trout", "mackerel", "herring", "matjes", "*hal", "hekk", "suger", "*fisch", "cod", "pollock"] },
  { key: "cheese", hu: "Sajt", de: "Käse", en: "Cheese", terms: ["*sajt", "gouda", "trappista", "edami", "emmentali", "emmentaler", "mozzarella", "feta", "parmezan", "parmesan", "camembert", "brie", "keksajt", "*kase", "cheese", "cheddar"] },
  { key: "quark", hu: "Túró, krémsajt", de: "Quark, Frischkäse", en: "Quark, cream cheese", terms: ["turo", "*kremsajt", "quark", "topfen", "*frischkase", "cottage", "ricotta", "*turo"] },
  { key: "sour_cream", hu: "Tejföl, joghurt", de: "Sauerrahm, Joghurt", en: "Sour cream, yogurt", terms: ["tejfol", "joghurt", "kefir", "sauerrahm", "*saure sahne", "schmand", "joghurt", "yogurt", "yoghurt", "sour cream", "creme fraiche"] },
  { key: "cream", hu: "Tejszín", de: "Sahne", en: "Cream", terms: ["tejszin", "sahne", "cream", "*tejszin"] },
  { key: "mayonnaise", hu: "Majonéz", de: "Mayonnaise", en: "Mayonnaise", terms: ["majonez", "mayonnaise", "salatmayonnaise", "mayo", "*majonez", "remulad"] },
  { key: "cucumber", hu: "Uborka", de: "Gurke", en: "Cucumber", terms: ["*uborka", "*gurke", "cucumber", "pickle", "pickles", "gherkin"] },
  { key: "tomato", hu: "Paradicsom", de: "Tomaten", en: "Tomatoes", terms: ["*paradicsom", "*tomate", "tomaten", "tomato", "paradeiser"] },
  { key: "pepper", hu: "Paprika (friss)", de: "Paprika (frisch)", en: "Bell pepper", terms: ["*kaliforniai paprika", "zoldpaprika", "tv paprika", "gemusepaprika", "bell pepper", "wax pepper", "paprika piros", "paprika sarga", "peppers"] },
  { key: "onion", hu: "Hagyma", de: "Zwiebeln", en: "Onions", terms: ["*hagyma", "*zwiebel", "onion", "onions", "shallot", "schalotte", "lauch", "leek"] },
  { key: "salad", hu: "Saláta, rukkola", de: "Salat, Rucola", en: "Lettuce, rocket", terms: ["fejes salata", "jegsalata", "salatalevel", "romai", "rukkola", "galambbegy", "kopfsalat", "eisbergsalat", "feldsalat", "rucola", "romaine", "lettuce", "arugula", "rocket", "zsazsa", "soska", "kresse", "cress"] },
  { key: "avocado", hu: "Avokádó", de: "Avocado", en: "Avocado", terms: ["avokado", "avocado"] },
  { key: "radish", hu: "Retek", de: "Radieschen", en: "Radish", terms: ["retek", "radieschen", "radish", "rettich"] },
  { key: "zucchini", hu: "Cukkini, padlizsán", de: "Zucchini, Aubergine", en: "Zucchini, aubergine", terms: ["cukkini", "padlizsan", "zucchini", "aubergine", "courgette", "eggplant", "sutotok"] },
  { key: "mushroom", hu: "Gomba", de: "Pilze", en: "Mushrooms", terms: ["*gomba", "champignon", "pilz", "pilze", "mushroom", "mushrooms", "pfifferling", "varganya"] },
  { key: "cabbage", hu: "Káposzta, savanyú káposzta", de: "Kohl, Sauerkraut", en: "Cabbage, sauerkraut", terms: ["*kaposzta", "*kohl", "sauerkraut", "weisskraut", "rotkraut", "cabbage", "sauerkraut", "kelkaposzta", "wirsing"] },
  { key: "greens", hu: "Spenót, brokkoli, karfiol", de: "Spinat, Brokkoli, Blumenkohl", en: "Spinach, broccoli, cauliflower", terms: ["spenot", "brokkoli", "karfiol", "spinat", "*blumenkohl", "broccoli", "cauliflower", "spinach", "sparga", "kelkaposzta", "kale", "spargel", "asparagus"] },
  { key: "green_bean", hu: "Zöldbab, zöldborsó", de: "Grüne Bohnen, Erbsen", en: "Green beans, peas", terms: ["zoldbab", "zoldborso", "*bohnen", "erbsen", "green bean", "green beans", "peas", "fisolen", "*kukorica", "maiskorn", "corn"] },
  { key: "root_veg", hu: "Répa, zeller, gyökér", de: "Karotten, Sellerie, Wurzeln", en: "Carrot, celery, roots", terms: ["*repa", "zeller", "*gyoker", "karotte", "mohre", "sellerie", "*wurzel", "carrot", "celery", "celeriac", "parsnip", "pastinake", "petrezselyemgyoker", "*zeller", "karalabe", "kohlrabi", "paszternak"] },
  { key: "beetroot", hu: "Cékla", de: "Rote Bete", en: "Beetroot", terms: ["cekla", "rote bete", "rote rube", "beetroot", "beet"] },
  { key: "olives", hu: "Olívabogyó", de: "Oliven", en: "Olives", terms: ["oliva", "olivabogyo", "oliven", "olive", "olives", "kapribogyo", "kapern", "capers"] },
  { key: "nuts", hu: "Dió, mag", de: "Nüsse, Kerne", en: "Nuts, seeds", terms: ["dio", "mogyoro", "mandula", "tokmag", "napraforgomag", "lenmag", "szezammag", "walnuss", "*nuss", "mandel", "kerne", "nut", "nuts", "almond", "walnut", "walnuts", "seeds", "gesztenye", "fenyomag", "pinienkerne", "chestnut"] },
  { key: "milk", hu: "Tej", de: "Milch", en: "Milk", terms: ["=tej", "*milch", "milk"] },
  { key: "bread", hu: "Kenyér, péksütemény", de: "Brot, Gebäck", en: "Bread, rolls", terms: ["*kenyer", "zsemle", "kifli", "kalacs", "pita", "tortilla", "perec", "bagett", "croissant", "*brot", "*brotchen", "*semmel", "brezel", "bread", "roll", "toast", "baguette"] },
  { key: "fruit", hu: "Gyümölcs", de: "Obst", en: "Fruit", terms: ["alma", "korte", "banan", "meggy", "cseresznye", "eper", "malna", "afonya", "szilva", "*barack", "ananasz", "kivi", "mango", "*dinnye", "nektarin", "szolo", "apfel", "birne", "kirsch", "erdbeer", "himbeer", "pflaume", "pfirsich", "aprikose", "apple", "pear", "cherry", "strawberr", "raspberr", "plum", "peach", "apricot", "pineapple", "banana", "nectarine", "melon"] },
  { key: "potato", hu: "Burgonya", de: "Kartoffeln", en: "Potatoes", terms: ["*burgonya", "krumpli", "*kartoffel", "erdapfel", "potato", "potatoes"] },
  { key: "rice_pasta", hu: "Rizs, tészta", de: "Reis, Nudeln", en: "Rice, pasta", terms: ["rizs", "teszta", "nokedli", "galuska", "reis", "nudel", "nudeln", "*teigwaren", "spatzle", "rice", "pasta", "spaghetti", "noodles", "dara", "*dara", "zabpehely", "muzli", "granola", "*pehely", "kuszkusz", "couscous", "haferflocken", "griess"] },
  { key: "legumes", hu: "Bab, lencse, csicseriborsó", de: "Bohnen, Linsen, Kichererbsen", en: "Beans, lentils, chickpeas", terms: ["bab", "lencse", "csicseri", "*linsen", "kichererbsen", "*bohnen", "beans", "lentils", "chickpeas", "hummus", "*bab", "*borso", "humusz"] }
] as const;
export type FridgeItemKey = (typeof fridgeItems)[number]["key"];
