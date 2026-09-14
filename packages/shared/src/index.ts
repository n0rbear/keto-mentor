import { z } from "zod";

export const locales = ["hu", "de", "en"] as const;
export type Locale = (typeof locales)[number];

export const registerSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_.-]+$/),
  password: z.string().min(10).max(200),
  locale: z.enum(locales).default("hu")
});

export const loginSchema = z.object({
  username: z.string().trim().min(3).max(32),
  password: z.string().min(1).max(200)
});

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
export const recipeDiscoveryMealItemSchema = z.object({
  sourceUrl: safeRecipeSourceUrlSchema,
  importProof: z.string().max(4_000),
  extractionMethod: z.enum(["schema_org_json_ld", "ai_structured"]),
  quantity: z.number().positive().max(5000),
  unit: z.enum(["g", "serving"])
}).strict();

export const createMealSchema = z.object({
  title: z.string().trim().min(2).max(100),
  eatenAt: z.string().datetime().optional(),
  items: z.array(z.union([catalogMealItemSchema, manualMealItemSchema, recipeDiscoveryMealItemSchema])).min(1).max(20)
});

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
  eatenAt: z.string().datetime().optional(),
  items: z.array(editMealItemSchema).max(20).optional(),
  removeItemIds: z.array(z.string().min(1)).max(20).optional()
}).strict().superRefine((value, context) => {
  if (value.title === undefined && value.eatenAt === undefined && !value.items?.length && !value.removeItemIds?.length) {
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
export const repeatMealSchema = z.object({}).strict();

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
  "tbsp", "tsp", "cup", "handful", "half", "quarter", "unknown"
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
  ingredients: z.array(recipeIngredientSchema).min(1).max(50)
});
// recipeMealSchema carries no legitimate extra fields (unlike recipeInputSchema
// above) — it is parsed straight from req.body for the trusted add-to-meal
// endpoint, so unknown fields (e.g. a forged nutrition value) are rejected
// outright rather than silently stripped.
export const recipeMealSchema = z.object({
  title: z.string().trim().min(2).max(100).optional(),
  quantity: z.number().positive().max(5000),
  unit: z.enum(["g", "serving"])
}).strict();
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
export type RecipeDiscoveryMealItemInput = z.infer<typeof recipeDiscoveryMealItemSchema>;
